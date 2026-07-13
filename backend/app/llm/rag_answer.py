import os
import time
import json
from fastapi import HTTPException

# Attempt to load the Groq SDK client.
try:
    from groq import Groq
    from groq import RateLimitError, APIStatusError
    HAS_GROQ_SDK = True
except ImportError:
    HAS_GROQ_SDK = False
    RateLimitError = Exception
    APIStatusError = Exception

def generate_rag_answer(query: str, chunks: list[dict]) -> dict:
    """
    Synthesizes a response to the user's query using retrieved code chunks and Groq's 
    llama-3.3-70b-versatile model. Enforces a structured JSON output with citations.
    """
    api_key_current = os.getenv("GROQ_API_KEY")
    if not api_key_current:
        print("[DevLens AI Error] GROQ_API_KEY is not configured in the environment.")
        return {
            "answer": "GROQ_API_KEY is missing from the environment. Please configure it in your .env file to enable semantic question answering.",
            "cited_chunks": []
        }

    if not HAS_GROQ_SDK:
        print("[DevLens AI Error] groq SDK is not installed in the environment.")
        return {
            "answer": "The 'groq' SDK is not installed in the python environment. Please run 'pip install -r requirements.txt'.",
            "cited_chunks": []
        }

    # Limit search context inputs to the top 8 chunks to respect token budgets and keep context dense
    top_chunks = chunks[:8]
    if not top_chunks:
        return {
            "answer": "No relevant code chunks were retrieved for the search query to answer the question.",
            "cited_chunks": []
        }

    # Format chunks context for prompt
    chunks_context = ""
    for idx, chunk in enumerate(top_chunks, start=1):
        chunks_context += (
            f"--- Chunk {idx}: {chunk['file_path']} (lines {chunk['start_line']}-{chunk['end_line']}) ---\n"
            f"{chunk['content']}\n\n"
        )

    # Set up system instructions enforcing grounding and structured JSON responses
    system_prompt = (
        "You are an expert software engineer assistant. You answer questions about a codebase using ONLY the provided code chunks.\n"
        "Rules:\n"
        "1. Do not use outside knowledge. Answer ONLY based on the context chunks.\n"
        "2. If the context does not contain enough information, state EXACTLY: 'I do not have enough context to answer this question from the indexed codebase.'\n"
        "3. You must provide a JSON response. The JSON structure must match:\n"
        "{\n"
        "  \"answer\": \"your detailed explanation here, referencing file names and line ranges (e.g. backend/app/main.py lines 10-20)\",\n"
        "  \"cited_chunks\": [\n"
        "    { \"file_path\": \"backend/app/main.py\", \"start_line\": 10, \"end_line\": 20 }\n"
        "  ]\n"
        "}"
    )

    user_prompt = (
        f"User Question: \"{query}\"\n\n"
        f"Code Chunks Context:\n"
        f"{chunks_context}"
    )

    try:
        client = Groq(api_key=api_key_current)
    except Exception as e:
        print(f"[DevLens AI Error] Failed to initialize Groq client: {str(e)}")
        return {
            "answer": f"Failed to initialize Groq client: {str(e)}",
            "cited_chunks": []
        }

    # Retry configurations for rate limits
    max_retries = 2
    backoffs = [2.0, 5.0]

    for attempt in range(max_retries + 1):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                response_format={"type": "json_object"},
                max_tokens=800
            )
            
            raw_response = chat_completion.choices[0].message.content.strip()
            parsed = json.loads(raw_response)
            
            # Formulate returning schema dictionary
            return {
                "answer": parsed.get("answer", ""),
                "cited_chunks": parsed.get("cited_chunks", [])
            }
            
        except RateLimitError as e:
            if attempt < max_retries:
                sleep_time = backoffs[attempt]
                print(
                    f"[DevLens AI] RAG Rate limited by Groq API. "
                    f"Retrying in {sleep_time}s... (Attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(sleep_time)
            else:
                print(f"[DevLens AI Error] Groq API rate limit reached after {max_retries} retries during RAG: {str(e)}")
                return {
                    "answer": "Groq API rate limit reached. Please wait a moment and try again.",
                    "cited_chunks": []
                }
        except json.JSONDecodeError as e:
            print(f"[DevLens AI Error] LLM returned invalid JSON payload: {str(e)}")
            return {
                "answer": f"Failed to parse model response as JSON: {raw_response}",
                "cited_chunks": []
            }
        except Exception as e:
            print(f"[DevLens AI Error] Unexpected error during RAG answer generation: {str(e)}")
            return {
                "answer": f"An error occurred while synthesizing the answer: {str(e)}",
                "cited_chunks": []
            }
