import os
import time
from typing import Any, List, Dict, Tuple
from groq import Groq, RateLimitError

# Cached working model discovered during runtime
_RESOLVED_GROQ_MODEL: str | None = None

DEFAULT_FALLBACK_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
]

def get_preferred_groq_model() -> str:
    global _RESOLVED_GROQ_MODEL
    if _RESOLVED_GROQ_MODEL:
        return _RESOLVED_GROQ_MODEL
    env_model = os.getenv("GROQ_MODEL")
    if env_model and env_model.strip() and env_model.strip() != "llama-3.3-70b-versatile":
        return env_model.strip()
    return "openai/gpt-oss-120b"

def execute_groq_chat_completion(
    client: Groq,
    messages: List[Dict[str, str]],
    temperature: float = 0.2,
    max_tokens: int = 800,
    response_format: Any = None,
    max_retries: int = 2,
    backoffs: List[float] | None = None,
) -> Tuple[Any, str]:
    """
    Executes a Groq chat completion with automatic model fallback for deprecated or unavailable models
    (e.g., 404 model_not_found) and exponential backoff for rate limits.
    Returns a tuple of (chat_completion, resolved_model_name).
    """
    global _RESOLVED_GROQ_MODEL
    if backoffs is None:
        backoffs = [2.0, 5.0]

    primary_model = get_preferred_groq_model()
    candidate_models = [primary_model]
    for m in DEFAULT_FALLBACK_MODELS:
        if m not in candidate_models:
            candidate_models.append(m)

    last_error = None
    for model_name in candidate_models:
        for attempt in range(max_retries + 1):
            try:
                kwargs: Dict[str, Any] = {
                    "messages": messages,
                    "model": model_name,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if response_format is not None:
                    kwargs["response_format"] = response_format

                chat_completion = client.chat.completions.create(**kwargs)
                _RESOLVED_GROQ_MODEL = model_name
                return chat_completion, model_name

            except RateLimitError as rle:
                last_error = rle
                if attempt < max_retries:
                    sleep_time = backoffs[attempt] if attempt < len(backoffs) else 5.0
                    print(f"[DevLens AI] Groq rate limited on model {model_name}. Retrying in {sleep_time}s... ({attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                else:
                    break

            except Exception as e:
                err_str = str(e).lower()
                # If model is not found, deprecated, or restricted (404), fail fast to next candidate model
                if "model_not_found" in err_str or "does not exist" in err_str or "404" in err_str:
                    print(f"[DevLens AI Warning] Groq model '{model_name}' is unavailable ({e}). Trying fallback model...")
                    last_error = e
                    break
                else:
                    last_error = e
                    if attempt < max_retries:
                        time.sleep(1.0)
                    else:
                        break

    if last_error:
        raise last_error
    raise RuntimeError("All candidate Groq models failed to complete request.")
