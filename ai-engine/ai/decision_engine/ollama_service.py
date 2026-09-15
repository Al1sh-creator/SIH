"""
==========================================================
File: ollama_service.py

What:
    This file is responsible for communicating with Groq.

Why:
    We don't want the Decision Engine to know how Groq works.
    The Decision Engine should only ask for an AI response.

Responsibilities:
    - Connect to Groq
    - Send Prompt
    - Receive Response
    - Return AI Response
    - Parse JSON output
==========================================================
"""

import os
import json
import logging
import re
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from django.conf import settings

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        # We use openai/gpt-oss-20b on Groq
        self.llm = ChatGroq(
            api_key=os.environ.get("GROQ_API_KEY"),
            model_name="openai/gpt-oss-20b",
            temperature=0.2, 
        )

    def generate_response(self, prompt: str) -> dict:
        try:
            logger.info("Sending prompt to Groq (openai/gpt-oss-20b)...")
            
            # Use stream to show live generation in the terminal
            print("\n[AI Module] --- Groq is typing (Live Generation)... ---")
            content = ""
            for chunk in self.llm.stream([HumanMessage(content=prompt)]):
                content += chunk.content
                print(chunk.content, end="", flush=True)
            print("\n[AI Module] --- Finished typing! ---")
            
            # Clean up potential markdown formatting wrapping the JSON
            cleaned_content = re.sub(r'^```(?:json)?\n', '', content.strip())
            cleaned_content = re.sub(r'\n```$', '', cleaned_content.strip())
            
            return json.loads(cleaned_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON from Groq response: {str(e)}")
            logger.error(f"Raw content: {content}")
            return {
                "error": "Failed to parse AI response.",
                "raw_response": content
            }
        except Exception as e:
            logger.error(f"Groq Service Error: {str(e)}")
            return {
                "error": str(e)
            }

ollama_service = OllamaService()