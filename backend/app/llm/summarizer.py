import os
import time
from threading import Lock
from fastapi import HTTPException

from app.llm.groq_client import execute_groq_chat_completion

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

def generate_fallback_summary(file_path: str, file_content: str) -> dict:
    """
    Generates an informative, patient, beginner-friendly structured explanation
    when the LLM service is unavailable or as a robust baseline.
    Returns a dict with 'purpose', 'key_parts', and 'connections'.
    """
    fname = os.path.basename(file_path).lower()
    ext = os.path.splitext(fname)[1].lower()
    
    if fname == 'package.json':
        purpose = (
            "You can think of this file like an official recipe card or identity passport for this entire application. "
            "It gives the project its name and version number, while declaring all the external tools, libraries, and helpers "
            "that the project needs in order to run. In modern web development, developers rarely build everything from scratch; "
            "they rely on existing pre-built blocks created by others. This file acts as an authoritative shopping list that tells "
            "package managers (tools that download code for you) exactly what ingredients must be downloaded before anything works."
        )
        key_parts = [
            "Project Identity: Defines the official project name, version identifier, and whether this package is private or open-source.",
            "Runnable Scripts: A collection of handy shortcut commands (like 'dev' to start the local preview server, or 'build' to bundle the files) so developers don't have to type long terminal commands.",
            "Production Dependencies: A checklist of required third-party software packages (such as React for rendering the visual interface and Lucide for icons) that must be installed for users to see the app.",
            "Development Dependencies: Additional helper tools (like TypeScript for error checking and Vite for fast reloading) that developers only use while writing code, which aren't needed by end users."
        ]
        connections = (
            "Nearly every tool and script in the frontend directory relies on this file as the ultimate source of truth. "
            "Whenever someone clones this project onto a new computer and runs the setup command, this file tells the computer "
            "which thousands of underlying files to fetch into the project's library folder. If a package name or version is wrong "
            "here, the build tools won't know how to run the application, and the entire frontend server will fail to start."
        )
    elif fname == 'readme.md':
        purpose = (
            "This file is the front door and welcome handbook for the entire codebase. "
            "Think of it like the user manual that comes inside the box when you buy new furniture or electronics. "
            "Its primary job is to explain in human words what this software actually is, why it was created, and how someone "
            "can set it up on their own machine to start using or testing it. Written in a readable format called Markdown, it serves "
            "as the first document any teammate or open-source contributor reads before touching any code."
        )
        key_parts = [
            "Project Overview & Vision: Introduces the software and explains the real-world problem it solves with visual diagrams or feature highlights.",
            "Prerequisites & System Requirements: Clearly states what software (like Node.js or Python) must already be installed on your computer before you can run this.",
            "Step-by-Step Installation Guide: Walkthrough commands showing how to download the code, install dependencies, and launch both frontend and backend servers.",
            "Architecture & Architecture Notes: Outlines the main directories and gives guidance on where different pieces of code live."
        ]
        connections = (
            "This documentation file does not execute any logic, so no source code files import or run it. "
            "Instead, its connection is purely human: it connects developers to the codebase by translating complex systems into straightforward steps. "
            "Because it is standalone, modifying or correcting this file carries zero risk of breaking any running programs or automated tests."
        )
    elif fname in ('.gitignore', '.npmignore', '.dockerignore'):
        purpose = (
            "This configuration file serves as a strict bouncer or privacy filter for your project's version control system (Git). "
            "When developers work on a project, their computers generate lots of temporary files, downloaded packages, and secret keys "
            "that should never be shared publicly or uploaded to shared servers. This file provides an explicit checklist of files and "
            "folders that Git should completely ignore and pretend do not exist, keeping the repository clean and secure."
        )
        key_parts = [
            "Downloaded Dependency Folders: Rules that ignore giant folders (like 'node_modules' or Python virtual environments) which can be re-downloaded at any time and would needlessly bloat the repository.",
            "Secret Credentials & Environment Files: Rules that block files like '.env' containing sensitive passwords and API keys from ever being exposed to GitHub.",
            "Build Artifacts & Temporary Files: Patterns ignoring compiled code, temporary caches, and operating system junk like thumbnail files."
        ]
        connections = (
            "While no code executes this file directly, it protects the health and security of the entire repository. "
            "Every single developer and automated pipeline that saves changes relies on these rules to avoid uploading sensitive tokens "
            "or megabytes of unnecessary cache files. If this file were deleted or misconfigured, secrets might leak online or repository "
            "cloning times could slow to a crawl."
        )
    elif ext in ('.tsx', '.jsx'):
        base_component = os.path.basename(file_path)
        purpose = (
            f"This file represents a visual building block of the user interface ({base_component}). "
            "In modern web apps, screens are constructed out of reusable Lego-like pieces called components. "
            "This specific component is responsible for what users see on their screen and how they interact with it—such as clicking buttons, "
            "viewing statistics, or reading formatted information. It blends the visual structure (HTML) with the interactive behavior (JavaScript)."
        )
        key_parts = [
            "State & Memory: Keeps track of changing information while the user is on the page, such as whether a menu is open, data is loading, or an error occurred.",
            "Visual Layout & Styling: Defines how elements look, including colors, margins, cards, and responsive sizing that looks good on both phones and desktops.",
            "Event Handlers & Interactivity: Functions that run when a user clicks a button, types in an input field, or toggles between different tabs.",
            "Data Communication: Fetches information from the backend server and displays it dynamically to the user."
        ]
        connections = (
            "This component connects directly to the visual pages of the app, receiving information from parent screens "
            "and sending user actions back up. It also communicates with the backend API to request fresh data. "
            "If an error is introduced here, the visual part of this screen could freeze, show an error alert, or fail to render for users."
        )
    elif ext == '.py':
        base_py = os.path.basename(file_path)
        purpose = (
            f"This Python file ({base_py}) serves as an engine component in the backend server. "
            "If the frontend is the dashboard and steering wheel of a car, this backend file is like a piece of the engine under the hood. "
            "It runs on the server rather than in the user's web browser, performing tasks like calculating data, communicating with databases, "
            "or coordinating communication between different services."
        )
        key_parts = [
            "Core Logic Functions: Individual routines that carry out specific tasks step-by-step, transforming raw input into organized output.",
            "Data Validation & Safety Checks: Verifies that incoming data is formatted properly and handles potential errors gracefully so the server doesn't crash.",
            "External Services & Integrations: Interacts with helper libraries, file systems, or databases to fetch and store information."
        ]
        connections = (
            "Other modules and API routes in the backend import and call functions from this file whenever they need its specialized capabilities. "
            "It also forms a critical bridge connecting the frontend user requests to the underlying database and external AI models. "
            "If this file fails, any user request that depends on its calculation will return a failure message."
        )
    else:
        base_name = os.path.basename(file_path)
        purpose = (
            f"This file ({base_name}) is a dedicated component in the project's repository. "
            "Every file in a codebase acts like an organized tool in a workshop, handling a specific responsibility such as configuring settings, "
            "formatting styles, or executing instructions. This file provides the necessary rules and information needed by surrounding modules."
        )
        key_parts = [
            "Configuration Settings & Definitions: Specifies parameters, structure, and foundational rules that the program refers to while running.",
            "Support Logic: Provides utilities or styles that help keep the rest of the application organized and predictable."
        ]
        connections = (
            "Depending on its file type, other files either read its configuration settings or invoke its functions directly. "
            "Changes made here can influence the appearance or behavior of connected modules across the system."
        )

    summary_text = f"What this file does\n{purpose}\n\nKey parts inside\n"
    if isinstance(key_parts, list):
        summary_text += "\n".join(f"• {k}" for k in key_parts)
    else:
        summary_text += str(key_parts)
    summary_text += f"\n\nHow it connects\n{connections}"

    return {
        "purpose": purpose,
        "key_parts": key_parts,
        "connections": connections,
        "summary": summary_text
    }

def summarize_file(file_path: str, file_content: str) -> dict:
    """
    Sends file content to Groq API using llama-3.3-70b-versatile to generate a patient,
    beginner-friendly, structured explanation with 3 clear sections:
    - What this file does (purpose)
    - Key parts inside (key_parts)
    - How it connects (connections)

    Returns a dict with {"purpose": str, "key_parts": list[str] | str, "connections": str, "summary": str}.
    Enforces a strict length truncation of 8,000 characters for LLM token efficiency.
    Uses max_tokens=1500 to prevent cutoffs.
    Implements a 2-attempt backoff retry for transient 429 rate limit errors from Groq.
    Gracefully falls back to generate_fallback_summary if Groq is unavailable.
    """
    api_key_current = os.getenv("GROQ_API_KEY")
    if not api_key_current or not HAS_GROQ_SDK:
        return generate_fallback_summary(file_path, file_content)

    # Initialize the Groq client
    try:
        client = Groq(api_key=api_key_current)
    except Exception as e:
        print(f"[DevLens AI Warning] Failed to initialize Groq client (using fallback): {str(e)}")
        return generate_fallback_summary(file_path, file_content)

    # Redact secrets before sending to Groq to protect sensitive credentials
    from app.security.secret_scanner import redact_secrets
    redaction_res = redact_secrets(file_content)
    file_content = redaction_res["redacted_content"]
    
    if redaction_res["secrets_found"] > 0:
        print(f"[SECURITY REDACTION] Redacted {redaction_res['secrets_found']} potential secrets in file summarization: {file_path}")

    # Truncate content if very large (> 8,000 characters)
    max_chars = 8000
    if len(file_content) > max_chars:
        file_content = (
            file_content[:4000] +
            "\n\n... [FILE CONTENT TRUNCATED FOR LLM SUMMARY TO REDUCE TOKEN OVERHEAD] ...\n\n" +
            file_content[-4000:]
        )

    system_prompt = (
        "You are an exceptionally patient, encouraging senior software engineer explaining code to a teammate "
        "who is brand new to programming and has never seen this codebase before.\n"
        "YOUR CORE PRINCIPLES:\n"
        "1. Assume zero prior background knowledge: Do not assume they know words like 'dependency', 'endpoint', 'schema', "
        "'middleware', 'cache', 'AST', 'transitive', or 'serialization'. If you must use a technical term, immediately explain it "
        "in the exact same sentence using a simple comparison or plain description.\n"
        "2. Thoroughness over brevity: Each section MUST be a genuine, thoughtful short paragraph (4 to 6 full sentences), "
        "not 1-2 clipped or rushed lines. Patiently walk the reader through step by step.\n"
        "3. Real-world analogies: Use a natural, intuitive everyday analogy where it genuinely clarifies something (for instance, "
        "comparing a config file to 'a settings menu', a router to 'a receptionist directing visitors to the right department', "
        "or a database model to 'a labeled folder template'). Only include an analogy when it genuinely aids comprehension.\n"
        "4. Describe concrete effects, not abstract jargon: For internal parts, describe what each piece actually DOES in practice with "
        "a concrete example (e.g. 'when someone clicks X, this code runs Y').\n"
        "5. Explain cause and effect: When explaining connections, describe the relationship in direct cause-and-effect terms "
        "(e.g. 'three other parts of the project rely on this file—if someone changes this, those three parts could break'). If a file is "
        "genuinely standalone with no other project connections (like a README or root config), say so honestly and clearly in 1-2 plain sentences.\n"
        "6. Strict JSON Output: You must respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        '  "purpose": "4-6 sentences explaining the core purpose and high-level role, using an analogy if helpful.",\n'
        '  "key_parts": [\n'
        '    "Bullet 1: 1-3 sentences describing a specific section/function and what it actually does with a concrete example.",\n'
        '    "Bullet 2: 1-3 sentences describing another section/function and what it actually does with a concrete example.",\n'
        '    "Bullet 3: 1-3 sentences describing another section/function and what it actually does with a concrete example."\n'
        '  ],\n'
        '  "connections": "4-6 sentences explaining cause-and-effect connections with the rest of the project (or stating clearly if standalone)."\n'
        "}"
    )

    user_prompt = (
        f"Please explain this file to a beginner teammate:\n"
        f"File Path: '{file_path}'\n\n"
        f"File Content:\n"
        f"```\n{file_content}\n```\n\n"
        f"Provide your response as a valid JSON object with the keys 'purpose', 'key_parts', and 'connections'."
    )

    try:
        record_and_check_volume()
        
        chat_completion, model_used = execute_groq_chat_completion(
            client=client,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
            max_retries=2
        )
        
        if not chat_completion.choices or len(chat_completion.choices) == 0:
            return generate_fallback_summary(file_path, file_content)
            
        raw_response = chat_completion.choices[0].message.content.strip()
        
        # Parse JSON from LLM response
        import json
        import re
        
        parsed_data = None
        try:
            parsed_data = json.loads(raw_response)
        except Exception:
            # If wrapped in markdown code fences
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                try:
                    parsed_data = json.loads(json_match.group(0))
                except Exception:
                    pass

        if parsed_data and isinstance(parsed_data, dict) and "purpose" in parsed_data:
            purpose = str(parsed_data.get("purpose", "")).strip()
            key_parts = parsed_data.get("key_parts", [])
            connections = str(parsed_data.get("connections", "")).strip()

            # Build combined human-readable text for backward compatibility
            summary_text = f"What this file does\n{purpose}\n\nKey parts inside\n"
            if isinstance(key_parts, list):
                summary_text += "\n".join(f"• {k}" for k in key_parts)
            else:
                summary_text += str(key_parts)
            summary_text += f"\n\nHow it connects\n{connections}"

            return {
                "purpose": purpose,
                "key_parts": key_parts,
                "connections": connections,
                "summary": summary_text
            }
        else:
            print(f"[DevLens AI Warning] LLM output did not contain expected JSON keys, falling back to structured fallback.")
            return generate_fallback_summary(file_path, file_content)
        
    except RateLimitError as e:
        print(f"[DevLens AI Warning] Groq rate limit reached (using fallback): {str(e)}")
        return generate_fallback_summary(file_path, file_content)
            
    except Exception as e:
        print(f"[DevLens AI Warning] Groq API call encountered issue (using fallback): {str(e)}")
        return generate_fallback_summary(file_path, file_content)
