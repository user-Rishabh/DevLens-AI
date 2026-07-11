# DevLens AI

DevLens AI is a codebase intelligence web application that analyzes pasted GitHub repositories to visualize directory structures, map dependency graphs, identify Git-history "hotspot" files, and enable semantic natural language code search.

---

## Folder Structure

```text
devlens-ai/
├── frontend/             # React + Vite + Tailwind CSS (v4)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages (Home, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Helper/integration libraries (Supabase client, etc.)
│   └── (standard Vite + Tailwind config files)
├── backend/              # Python + FastAPI
│   ├── app/
│   │   ├── api/          # Route handlers & endpoints
│   │   ├── ingestion/    # Repo cloning & parsing logic
│   │   ├── analysis/     # Dependency mapping & Git hotspots analysis
│   │   ├── search/       # Vector embeddings & search logic
│   │   ├── llm/          # Large Language Model integration
│   │   ├── models/       # Database & validation models
│   │   └── main.py       # FastAPI application entry point
│   └── requirements.txt  # Python requirements
├── db/
│   └── migrations/       # Database migrations
└── README.md
```

---

## Local Setup & Run Instructions

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Python](https://www.python.org/) (v3.10 or higher recommended)
*   [Git](https://git-scm.com/)

---

### 2. Backend Setup
The backend runs a FastAPI server at `http://localhost:8000`.

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment**:
    *   **Windows (PowerShell)**:
        ```powershell
        python -m venv .venv
        .venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux**:
        ```bash
        python3 -m venv .venv
        source .venv/bin/activate
        ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables**:
    Copy the sample environment file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and populate:
    *   `SUPABASE_URL` and `SUPABASE_KEY` (from your Supabase project)
    *   `GROQ_API_KEY` (obtain a free key from the [Groq Console](https://console.groq.com))

5.  **Run the backend**:
    ```bash
    python app/main.py
    ```
    The server will start at [http://localhost:8000](http://localhost:8000). You can verify it by checking the health endpoint at [http://localhost:8000/api/health](http://localhost:8000/api/health).

---

### 3. Frontend Setup
The frontend runs a Vite React dev server at `http://localhost:5173`.

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Copy the sample environment file:
    ```bash
    cp .env.example .env
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The site will open at [http://localhost:5173](http://localhost:5173) in your browser.
