<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a2b4a,100:6d28d9&height=220&section=header&text=DevLens%20AI&fontSize=60&fontColor=ffffff&fontAlignY=35&desc=Google%20Maps%20for%20Codebases&descAlignY=55&descSize=18&animation=fadeIn" width="100%"/>

<br/>

<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=8B5CF6&center=true&vCenter=true&width=650&lines=Paste+a+GitHub+repo.+Understand+it+instantly.;AST-aware+chunking+%2B+hybrid+semantic+search;Git-history+hotspot+detection+%2B+AI+explanations;Ask+your+codebase+questions+in+plain+English." alt="Typing SVG" />
</a>

<br/><br/>

<img src="https://img.shields.io/badge/status-in--development-8B5CF6?style=for-the-badge&labelColor=1a2b4a"/>
<img src="https://img.shields.io/badge/phase-3%20of%203-2563eb?style=for-the-badge&labelColor=1a2b4a"/>
<img src="https://img.shields.io/badge/license-MIT-10b981?style=for-the-badge&labelColor=1a2b4a"/>

<br/><br/>

<img src="https://skillicons.dev/icons?i=react,vite,tailwind,fastapi,python,supabase,postgres,ts,nodejs,git&theme=dark" />

</div>

<br/>

## What is DevLens AI?

DevLens AI is a **codebase intelligence platform**. Paste any GitHub repository URL and instantly get:

- 🗂️ A navigable **file structure** with noise (`node_modules`, lockfiles, build artifacts) filtered out
- 🔥 **Git-history hotspot detection** — surfaces the files changed most often, statistically the riskiest to touch
- 🤖 **AI-generated plain-English explanations** for any file, cached so they're instant on repeat views
- 🔍 **Hybrid semantic search** — ask "where is authentication handled?" in plain English and get a grounded, cited answer synthesized from the actual code, not a hallucinated guess
- 🗺️ An **interactive architecture map** showing how files depend on each other
- 📚 **Auto-generated module documentation**, exportable as Markdown
- 🧭 An AI-synthesized **"where should I start?"** onboarding guide for new contributors
- 📊 A **code quality score** combining churn, size, and complexity signals

<br/>

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=rect&color=0:6d28d9,100:1a2b4a&height=3&width=100%"/>
</div>

<br/>

## Why This Exists

Every developer who joins an unfamiliar codebase hits the same wall: hundreds of files, no map, and no fast way to answer *"where does X happen?"* or *"what will break if I change this?"*

Most tools that attempt this stop at a thin wrapper around an embedding API. DevLens AI is built differently — it combines **real static analysis** (AST-aware parsing, git history mining, dependency graphs) with an LLM that acts as an explanation layer on top, not the whole product.

<br/>

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │      GitHub URL          │
                    └────────────┬─────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Shallow Clone (temp)   │
                    └────────────┬─────────────┘
                                 ▼
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  AST Parsing   │      │  Git History      │      │  Content Capture │
│  (tree-sitter) │      │  Mining (churn)   │      │  (pre-cleanup)   │
└───────┬────────┘      └────────┬──────────┘      └────────┬─────────┘
        ▼                        ▼                           ▼
┌───────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Chunking +    │      │  Hotspot Ranking  │      │  AI Summarization │
│  Embeddings    │      │                    │      │  (Groq)           │
└───────┬────────┘      └────────┬──────────┘      └────────┬─────────┘
        ▼                        ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           Supabase (Postgres + pgvector + full-text)             │
└──────────────────────────────┬────────────────────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Hybrid Search (RRF) +   │
                    │  RAG Answer Generation   │
                    └────────────┬─────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   React Frontend (UI)    │
                    └─────────────────────────┘
```

<br/>

## ⚙️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | React · Vite · TypeScript · Tailwind CSS · React Flow |
| **Backend** | Python · FastAPI |
| **Database** | Supabase (Postgres) · pgvector · full-text search (GIN) |
| **AST Parsing** | tree-sitter (Python, JS, TS/TSX) |
| **Embeddings** | sentence-transformers (`all-MiniLM-L6-v2`, local, free) |
| **LLM** | Groq (`llama-3.3-70b-versatile`) |
| **Git Analysis** | GitPython |

</div>

<br/>

## 🧠 What Makes This Different

<table>
<tr>
<td width="50%" valign="top">

**Most student RAG projects:**
- Fixed-size text chunking
- Pure vector similarity search
- No evaluation of retrieval quality
- LLM allowed to answer from general knowledge
- Single confident answer, even when wrong

</td>
<td width="50%" valign="top">

**DevLens AI:**
- AST-aware chunking (function/class boundaries)
- **Hybrid search** — keyword (full-text) + vector, combined via **Reciprocal Rank Fusion**
- Explicit grounding — answers only from retrieved chunks, cites file + line
- Clearly states when no relevant code was found, instead of hallucinating
- Real git-history mining for risk signals, not guessed

</td>
</tr>
</table>

<br/>

## ✨ Features

<details>
<summary><b>🔍 Hybrid Semantic Search + RAG</b></summary>
<br/>

Ask a natural-language question about the codebase. DevLens embeds the query, retrieves candidates via both keyword and vector search, fuses the rankings, and asks the LLM to synthesize a grounded answer — citing exact files and line ranges. If nothing relevant is found, it says so explicitly.

</details>

<details>
<summary><b>🔥 Git Hotspot Detection</b></summary>
<br/>

Mines full commit history via `git log --numstat` to rank files by churn frequency — a well-established proxy for bug-proneness and complexity.

</details>

<details>
<summary><b>🗺️ Interactive Architecture Map</b></summary>
<br/>

Renders the extracted import/dependency graph as a zoomable, clickable node-link diagram via React Flow, with hotspot files visually flagged.

</details>

<details>
<summary><b>📚 Auto-Generated Documentation</b></summary>
<br/>

Synthesizes per-file AI summaries into cohesive, module-level documentation — exportable as a single Markdown file.

</details>

<details>
<summary><b>🧭 Onboarding Guide</b></summary>
<br/>

Combines detected entry points, structurally central files (high import in-degree), and hotspots into an AI-suggested reading order for new contributors.

</details>

<details>
<summary><b>📊 Code Quality Score</b></summary>
<br/>

A composite, repo-relative score per file combining churn, size, and complexity — surfaced directly in the file tree.

</details>

<br/>

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/DevLens-AI.git
cd DevLens-AI

# Backend setup
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
cp .env.example .env          # add your Supabase + Groq keys
python app/main.py

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```


<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6d28d9,100:1a2b4a&height=120&section=footer"/>

**Built by [Rishabh](https://github.com/<your-username>)** · B.Tech AI & Data Science, VESIT · Team AlgoMinds

</div>
