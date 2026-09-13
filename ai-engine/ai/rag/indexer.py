"""
==========================================================
File: indexer.py

What:
    Handles reading PDFs, chunking them, and generating embeddings
    to store permanently in ChromaDB.

Why:
    We need a local Knowledge Base (RAG) to provide context
    for agricultural decisions.

Responsibilities:
    - Load PDFs from knowledge_base directory
    - Split into smaller chunks
    - Generate embeddings using nomic-embed-text
    - Store embeddings in ChromaDB
    - Ensure indexing happens only once (batch indexing)
==========================================================
"""

import os
import logging
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma

logger = logging.getLogger(__name__)

class PDFIndexer:
    def __init__(self, knowledge_base_dir: str, persist_directory: str):
        self.knowledge_base_dir = knowledge_base_dir
        self.persist_directory = persist_directory
        # Uses sentence-transformers locally — no server needed
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    def is_indexed(self) -> bool:
        """Check if ChromaDB already exists to avoid re-indexing."""
        return os.path.exists(self.persist_directory) and os.listdir(self.persist_directory)

    def get_all_pdfs(self) -> list[str]:
        """Recursively find all PDFs in the knowledge base."""
        pdf_files = []
        for root, _, files in os.walk(self.knowledge_base_dir):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        return pdf_files

    def index_documents(self):
        """Load, split, and store documents in ChromaDB."""
        if self.is_indexed():
            logger.info(f"Vector store already exists at {self.persist_directory}. Skipping indexing.")
            return

        pdf_files = self.get_all_pdfs()
        if not pdf_files:
            logger.warning(f"No PDFs found in {self.knowledge_base_dir}.")
            return

        logger.info(f"Found {len(pdf_files)} PDFs. Starting indexing...")
        all_splits = []

        for pdf_path in pdf_files:
            logger.info(f"Processing: {pdf_path}")
            try:
                loader = PyPDFLoader(pdf_path)
                docs = loader.load()
                splits = self.text_splitter.split_documents(docs)
                all_splits.extend(splits)
            except Exception as e:
                logger.error(f"Failed to process {pdf_path}: {str(e)}")

        if all_splits:
            logger.info(f"Creating ChromaDB at {self.persist_directory} with {len(all_splits)} chunks...")
            vector_store = Chroma(
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory
            )
            
            # Batch adding to avoid Ollama server overload
            batch_size = 50
            for i in range(0, len(all_splits), batch_size):
                batch = all_splits[i:i+batch_size]
                logger.info(f"Indexing batch {i//batch_size + 1}/{(len(all_splits)+batch_size-1)//batch_size}...")
                vector_store.add_documents(batch)
                
            logger.info("Indexing complete.")
        else:
            logger.warning("No text extracted from PDFs.")
