export interface TechStackCategory {
  [category: string]: string[];
}

export const techStack: TechStackCategory = {
  "Frontend": ["React", "Vite", "TypeScript", "Tailwind CSS", "React Flow"],
  "Backend": ["Python", "FastAPI"],
  "Database": ["Supabase (Postgres)", "pgvector", "Full-Text Search"],
  "AI / ML": ["Groq (Llama 3.3)", "sentence-transformers", "tree-sitter"],
  "Analysis": ["GitPython"]
};
