import os
import time
from threading import Lock
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

# In-memory rolling request counter
counter_lock = Lock()
request_timestamps = []
WARNING_THRESHOLD_RPM = 30  # Groq free tier limit threshold warning

def record_and_check_volume() -> None:
    """
    Appends the current timestamp to an in-memory rolling window and logs a warning 
    if the request rate is approaching Groq's free-tier limits (30 RPM).
    """
    global request_timestamps
    now = time.time()
    with counter_lock:
        request_timestamps.append(now)
        # Keep only timestamps within the last 60 seconds
        request_timestamps = [t for t in request_timestamps if now - t <= 60]
        recent_count = len(request_timestamps)
        
        if recent_count > WARNING_THRESHOLD_RPM:
            print(
                f"[DevLens AI Warning] HIGH VOLUME DETECTED: {recent_count} Groq API calls triggered "
                f"within a 60-second rolling window! (Approaching or exceeding free tier limit of {WARNING_THRESHOLD_RPM} RPM)."
            )

def summarize_file(file_path: str, file_content: str) -> str:
    """
    Sends file content to Groq API using llama-3.3-70b-versatile to generate a plain-English summary.
    Enforces a strict length truncation of 8,000 characters.
    Implements a 2-attempt backoff retry specifically for transient 429 rate limit errors from Groq.
    """
    api_key_current = os.getenv("GROQ_API_KEY")
    if not api_key_current:
        print("[DevLens AI Error] GROQ_API_KEY is not configured in the environment.")
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is missing from the environment. Please obtain a key from console.groq.com and configure it in your .env file."
        )

    if not HAS_GROQ_SDK:
        print("[DevLens AI Error] groq SDK is not installed in the environment.")
        raise HTTPException(
            status_code=500,
            detail="The 'groq' SDK is not installed in the python environment. Please run 'pip install -r requirements.txt'."
        )

    # Initialize the Groq client
    try:
        client = Groq(api_key=api_key_current)
    except Exception as e:
        print(f"[DevLens AI Error] Failed to initialize Groq client: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Groq client: {str(e)}"
        )

    # Truncate content if very large (> 8,000 characters)
    max_chars = 8000
    if len(file_content) > max_chars:
        file_content = (
            file_content[:4000] +
            "\n\n... [FILE CONTENT TRUNCATED FOR LLM SUMMARY TO REDUCE TOKEN OVERHEAD] ...\n\n" +
            file_content[-4000:]
        )

    # Prompt instructing the LLM to deliver a longer, plain-English explanation
    prompt = (
        f"You are a friendly and knowledgeable colleague explaining a file to another teammate.\n"
        f"Provide a clear, detailed, plain-language explanation of the file: '{file_path}'.\n\n"
        f"YOUR EXPLANATION MUST FOLLOW THESE GUIDELINES:\n"
        f"1. Length & Structure: Aim for roughly 3 to 5 sentences or a short, descriptive paragraph. Do not write a single dense/terse sentence.\n"
        f"2. Language: Use plain, everyday language. Avoid unnecessary developer jargon. If you must use a technical term, explain it immediately in plain English (for example, instead of saying 'no side effects', explain that 'this file doesn't change anything elsewhere in the application').\n"
        f"3. Content Checklist:\n"
        f"   - (a) What this file is for: State its primary goal or role in one clear, simple sentence that even a non-developer could understand.\n"
        f"   - (b) What is inside it: Describe the key parts, elements, or logic contained in the file, focusing on what they do rather than just listing technical constructs like classes, functions, or exports.\n"
        f"   - (c) Project connections: If applicable, explain how it connects to the rest of the project (e.g. how other parts of the system depend on or interact with it).\n"
        f"4. Tone: Keep the tone clear, helpful, and slightly conversational. Avoid a clinical, dry, or audit-style summary.\n"
        f"5. Introductory text: Do not include introductory phrases like 'Here is the summary' or concluding remarks. Start directly with the explanation.\n\n"
        f"STYLE GUIDE CONTRAST (Follow this style direction):\n"
        f"- TOO SHORT/TECHNICAL (AVOID THIS STYLE):\n"
        f"  \"The primary purpose of the '.gitignore' file is to specify files and directories that should be ignored by Git. Key components include patterns for Node, Python, and environment-specific files. This file has no side effects or dependencies.\"\n"
        f"- BETTER / PLAIN LANGUAGE (AIM FOR THIS STYLE):\n"
        f"  \"This file tells Git which files and folders to leave alone when saving changes to the project — things like temporary build files, personal environment settings, and installed packages that don't need to be tracked or shared with other developers. It's organized into sections for different tools (like Node.js and Python), so the project stays clean and doesn't accidentally upload things like passwords or huge dependency folders to GitHub. This file doesn't affect how the app runs — it only affects what gets saved and shared through version control.\"\n\n"
        f"File Content to summarize:\n"
        f"```\n{file_content}\n```"
    )

    # Retry configurations for 429 errors from Groq
    max_retries = 2
    backoffs = [2.0, 5.0]  # First retry after 2s, second retry after 5s

    for attempt in range(max_retries + 1):
        try:
            # Check and log request frequency prior to making the call
            record_and_check_volume()
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=300
            )
            
            if not chat_completion.choices or len(chat_completion.choices) == 0:
                raise ValueError("No response text returned from Groq API.")
                
            return chat_completion.choices[0].message.content.strip()
            
        except RateLimitError as e:
            # Catch transient rate limits (429) specifically and sleep-retry
            if attempt < max_retries:
                sleep_time = backoffs[attempt]
                print(
                    f"[DevLens AI] Rate limited by Groq API. "
                    f"Retrying in {sleep_time}s... (Attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(sleep_time)
            else:
                # Max retries exhausted
                print(f"[DevLens AI Error] Groq API rate limit reached after {max_retries} retries: {str(e)}")
                raise HTTPException(
                    status_code=429,
                    detail="Groq API rate limit reached. Please wait a moment and try again."
                )
                
        except APIStatusError as e:
            # Log and raise other API errors immediately (e.g. auth issues, invalid inputs) without retries
            print(f"[DevLens AI Error] Groq API call failed with code {e.status_code}: {e.message}")
            raise HTTPException(
                status_code=502,
                detail=f"Groq API error occurred (HTTP {e.status_code}): {e.message}"
            )
            
        except Exception as e:
            # Handle unexpected runtime exceptions
            print(f"[DevLens AI Error] Unexpected error during Groq generation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error during summary generation: {str(e)}"
            )
