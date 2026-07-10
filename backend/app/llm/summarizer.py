import os
from fastapi import HTTPException

# Attempt to load the google-generativeai SDK. 
# Safe check to prevent runtime crashes if the environment setup is incomplete.
try:
    import google.generativeai as genai
    from google.api_core.exceptions import ResourceExhausted, GoogleAPICallError
    HAS_GEMINI_SDK = True
except ImportError:
    HAS_GEMINI_SDK = False
    ResourceExhausted = Exception
    GoogleAPICallError = Exception

def summarize_file(file_path: str, file_content: str) -> str:
    """
    Sends file content to Google Gemini API to generate a plain-English summary.
    Enforces a strict length truncation of 8,000 characters.
    """
    api_key_current = os.getenv("GEMINI_API_KEY")
    if not api_key_current:
        # Raise a clear configuration error if the key is missing
        print("[DevLens AI Error] GEMINI_API_KEY is not configured in the environment.")
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing from the environment. Please obtain a key from Google AI Studio and configure it in your .env file."
        )

    if not HAS_GEMINI_SDK:
        print("[DevLens AI Error] google-generativeai SDK is not installed in the environment.")
        raise HTTPException(
            status_code=500,
            detail="The 'google-generativeai' SDK is not installed in the python environment. Please run 'pip install -r requirements.txt'."
        )

    # Configure the Gemini API client dynamically using the key from env variables
    try:
        genai.configure(api_key=api_key_current)
    except Exception as e:
        print(f"[DevLens AI Error] Failed to configure Gemini API: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to configure Gemini API: {str(e)}"
        )

    # Truncate content if very large (> 8,000 characters)
    max_chars = 8000
    if len(file_content) > max_chars:
        file_content = (
            file_content[:4000] +
            "\n\n... [FILE CONTENT TRUNCATED FOR LLM SUMMARY TO REDUCE TOKEN OVERHEAD] ...\n\n" +
            file_content[-4000:]
        )

    # Prompt instructing the LLM to deliver a concise, structured outline
    prompt = (
        f"You are a Senior Software Architect reviewing a codebase.\n"
        f"Provide a concise, plain-English summary of the file: '{file_path}'.\n"
        f"Your summary must cover:\n"
        f"1. Primary Purpose: What is this file's main role or goal in the codebase?\n"
        f"2. Key Components: What are the main classes, functions, or exports defined?\n"
        f"3. Side Effects/Dependencies: Does it perform external network calls, database queries, or write to disk?\n\n"
        f"Be very concise. Limit your total response to a single short, structured paragraph (max 150 words). "
        f"Do not write introductory or concluding phrases.\n\n"
        f"File Content:\n```\n{file_content}\n```"
    )

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        if not response.text:
            raise ValueError("No response text returned from Gemini API.")
        return response.text.strip()
        
    except ResourceExhausted as e:
        print(f"[DevLens AI Error] Gemini API rate limit reached: {str(e)}")
        raise HTTPException(
            status_code=429,
            detail="Gemini API rate limit reached. Please wait a moment and try again."
        )
    except GoogleAPICallError as e:
        print(f"[DevLens AI Error] Gemini API call failed: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error occurred: {e.message or str(e)}"
        )
    except Exception as e:
        print(f"[DevLens AI Error] Unexpected error during Gemini generation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during summary generation: {str(e)}"
        )
