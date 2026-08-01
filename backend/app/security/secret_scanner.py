import re

# Regular expression patterns for common secret formats
PATTERNS = {
    "private_key": (
        re.compile(r'-----BEGIN [A-Z ]+PRIVATE KEY-----[^-]+-----END [A-Z ]+PRIVATE KEY-----', re.DOTALL),
        "[REDACTED_PRIVATE_KEY]"
    ),
    "db_uri": (
        re.compile(r'\b(?:postgres|postgresql|mongodb|mysql|mssql|redis):\/\/[^:\s]+:[^@\s]+@[a-zA-Z0-9_.-]+(?::\d+)?\/[a-zA-Z0-9_.-]+\b', re.IGNORECASE),
        "[REDACTED_DATABASE_URI]"
    ),
    "aws_key": (
        re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
        "[REDACTED_AWS_KEY]"
    ),
    "google_key": (
        re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b'),
        "[REDACTED_GOOGLE_KEY]"
    ),
    "github_token": (
        re.compile(r'\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b'),
        "[REDACTED_GITHUB_TOKEN]"
    ),
    "openai_key": (
        re.compile(r'\bsk-[a-zA-Z0-9]{20,}\b'),
        "[REDACTED_OPENAI_KEY]"
    ),
    "jwt": (
        re.compile(r'\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_+/=]*\b'),
        "[REDACTED_JWT_TOKEN]"
    )
}

# Generic API key match near context words (e.g. api_key, db_password, token)
CONTEXT_PATTERN = re.compile(
    r'\b[a-zA-Z0-9_\-]*(?:key|token|secret|password|passwd)[a-zA-Z0-9_\-]*\b\s*[:=]\s*["\'`]?([A-Za-z0-9_\-\.]{32,})["\'`]?',
    re.IGNORECASE
)

def redact_secrets(content: str) -> dict:
    """
    Scans the input content for common secret patterns and redacts them.
    Returns a dict with the redacted content and count of secrets found.
    """
    if not content:
        return {"redacted_content": "", "secrets_found": 0}

    redacted_content = content
    secrets_found = 0

    # 1. Scan for standard patterns
    for pattern_name, (pattern, placeholder) in PATTERNS.items():
        matches = pattern.findall(redacted_content)
        if matches:
            secrets_found += len(matches)
            redacted_content = pattern.sub(placeholder, redacted_content)

    # 2. Scan for generic API keys in context
    def redact_generic_key(match):
        nonlocal secrets_found
        full_str = match.group(0)
        secret = match.group(1)
        
        # Exclude common false positives (like base64, dot-qualified strings, or version strings)
        if "." in secret or "/" in secret or len(secret) > 200:
            return full_str
            
        secrets_found += 1
        placeholder = "[REDACTED_API_KEY]"
        start_idx = full_str.rfind(secret)
        if start_idx != -1:
            return full_str[:start_idx] + placeholder + full_str[start_idx + len(secret):]
        return full_str

    redacted_content = CONTEXT_PATTERN.sub(redact_generic_key, redacted_content)

    return {
        "redacted_content": redacted_content,
        "secrets_found": secrets_found
    }
