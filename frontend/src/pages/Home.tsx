import React, { useState } from 'react';
import { 
  GitBranch, 
  Search, 
  Network, 
  Flame, 
  BookOpen, 
  ArrowRight, 
  Github, 
  HelpCircle,
  Database,
  Layers,
  Cpu
} from 'lucide-react';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    setIsLoading(true);
    // Placeholder interaction
    setTimeout(() => {
      setIsLoading(false);
      alert(`Scaffold Hook: Analysis triggered for ${repoUrl}. Actual logic will be implemented in the next phase!`);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-glow-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-200 to-indigo-300">
                DevLens <span className="text-indigo-400">AI</span>
              </span>
              <span className="block text-[10px] text-zinc-500 font-mono leading-none mt-0.5">v0.1.0-alpha</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-400 font-medium mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Now in Active Scaffolding Mode
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Codebase Intelligence, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">
              Visualized & Explained
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Paste a GitHub repository URL below. DevLens AI will map dependency graphs, 
            detect hotspot files, and let you search code in natural language.
          </p>

          {/* Repository Input Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
            <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-2xl shadow-indigo-950/20">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 sm:py-0">
                <GitBranch className="w-5 h-5 text-zinc-500 shrink-0" />
                <input 
                  type="url" 
                  required
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none py-1.5"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Repository
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Links */}
          <div className="flex items-center justify-center gap-3 text-xs text-zinc-500">
            <span>Try an example:</span>
            <button 
              type="button"
              onClick={() => setRepoUrl('https://github.com/facebook/react')}
              className="text-zinc-400 hover:text-indigo-400 transition-colors duration-150 underline decoration-zinc-700 hover:decoration-indigo-500 underline-offset-4"
            >
              facebook/react
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => setRepoUrl('https://github.com/fastapi/fastapi')}
              className="text-zinc-400 hover:text-indigo-400 transition-colors duration-150 underline decoration-zinc-700 hover:decoration-indigo-500 underline-offset-4"
            >
              fastapi/fastapi
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          
          {/* Card 1: Directory Explainer */}
          <div className="glass-panel p-6 rounded-2xl hover:border-zinc-800 transition-all duration-300 group">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit mb-5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-base mb-2">Structure & Explainers</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Explore file structure with auto-generated summaries. Click any directory to understand its architectural purpose.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>STATUS</span>
              <span className="text-violet-400 font-semibold">SCAFFOLDED</span>
            </div>
          </div>

          {/* Card 2: Dependency Graph */}
          <div className="glass-panel p-6 rounded-2xl hover:border-zinc-800 transition-all duration-300 group">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit mb-5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all duration-300">
              <Network className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-base mb-2">Dependency Graphs</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Interact with a full topological map of imports and linkages. Trace circular dependencies and modular structures visually.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>STATUS</span>
              <span className="text-violet-400 font-semibold">SCAFFOLDED</span>
            </div>
          </div>

          {/* Card 3: Hotspots */}
          <div className="glass-panel p-6 rounded-2xl hover:border-zinc-800 transition-all duration-300 group">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit mb-5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all duration-300">
              <Flame className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-base mb-2">Git Heatmaps</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Identify "hotspots" of churn and complexity. High-frequency commit files overlayed against cyclomatic complexity.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>STATUS</span>
              <span className="text-violet-400 font-semibold">SCAFFOLDED</span>
            </div>
          </div>

          {/* Card 4: Semantic Search */}
          <div className="glass-panel p-6 rounded-2xl hover:border-zinc-800 transition-all duration-300 group">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit mb-5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all duration-300">
              <Search className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-base mb-2">Semantic Search</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Search the codebase using natural language. Locate utility functions by what they do rather than keyword matching.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>STATUS</span>
              <span className="text-violet-400 font-semibold">SCAFFOLDED</span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <footer className="mt-24 border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-4">
          <p>© 2026 DevLens AI. Under active development.</p>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              Supabase Postgres
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              FastAPI Python
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
