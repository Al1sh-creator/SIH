"""
==========================================================
File: retriever.py

What:
    Handles connecting to ChromaDB and retrieving relevant
    chunks for a given query.

Why:
    We need semantic search capabilities to provide accurate
    context to the LLM.

Responsibilities:
    - Load existing ChromaDB
    - Perform similarity search using nomic-embed-text
    - Format retrieved documents for prompt injection
==========================================================
"""

import os
import logging
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

class RAGRetriever:
    def __init__(self, persist_directory: str):
        self.persist_directory = persist_directory
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
        self.vector_store = None
        self._init_store()

    def _init_store(self):
        """Initialize connection to ChromaDB if it exists."""
        if os.path.exists(self.persist_directory) and os.listdir(self.persist_directory):
            try:
                self.vector_store = Chroma(
                    persist_directory=self.persist_directory,
                    embedding_function=self.embeddings
                )
                logger.info(f"Successfully loaded ChromaDB from {self.persist_directory}")
            except Exception as e:
                logger.error(f"Failed to load ChromaDB: {str(e)}")
        else:
            logger.warning(f"ChromaDB not found at {self.persist_directory}. Indexing might be required.")

    def search(self, query: str, k: int = 5, target_crop: str = "") -> str:
        """Search the vector store, filter by target_crop, and return formatted results."""
        if not self.vector_store:
            logger.warning("Vector store not initialized. Returning empty context.")
            return ""

        try:
            # 1. Retrieve the top-k chunks
            docs = self.vector_store.similarity_search(query, k=k)
            if not docs:
                return ""
            
            # 2. Inspect each retrieved chunk and filter by target crop aliases
            filtered_docs = []
            if target_crop:
                target_lower = target_crop.lower().strip()
                
                # Common agricultural crop aliases
                CROP_ALIASES = {
                    "rice": ["rice", "paddy"],
                    "maize": ["maize", "corn"],
                    "groundnut": ["groundnut", "peanut"],
                    "cotton": ["cotton", "kapas"],
                    "wheat": ["wheat"],
                    "coffee": ["coffee"]
                }
                
                # Determine aliases for the target crop
                aliases = CROP_ALIASES.get(target_lower, [target_lower])
                # Ensure the original name is always in the list just in case
                if target_lower not in aliases:
                    aliases.append(target_lower)

                for doc in docs:
                    doc_content_lower = doc.page_content.lower()
                    # Keep chunk if it explicitly mentions any alias of the predicted crop
                    if any(alias in doc_content_lower for alias in aliases):
                        filtered_docs.append(doc)
            else:
                # If no target crop provided, keep all
                filtered_docs = docs
            
            # 3 & 4. If no chunks remain after filtering, return empty string
            if not filtered_docs:
                logger.info(f"All chunks filtered out. No relevant info found for crop: {target_crop}")
                return ""
            
            context_parts = []
            for i, doc in enumerate(filtered_docs):
                source = doc.metadata.get("source", "Unknown Source")
                context_parts.append(f"[Source {i+1}: {os.path.basename(source)}]\n{doc.page_content}\n")
            
            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Error during semantic search: {str(e)}")
            return ""
