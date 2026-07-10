import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Cpu, 
  Database, 
  AlertTriangle, 
  Loader2,
  X
} from 'lucide-react';

interface FileExplainerProps {
  repoId: string;
  filePath: string;
  onClose?: () => void;
}

export default function FileExplainer({ repoId, filePath, onClose }: FileExplainerProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId || !filePath) return;

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      setSummary('');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const encodedPath = encodeURIComponent(filePath);
      
      try {
        const response = await fetch(`${apiUrl}/api/files/explain?repo_id=${repoId}&file_path=${encodedPath}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to generate explanation.');
        }
        
        setSummary(data.summary);
        setModelUsed(data.model_used);
        setCached(data.cached);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while fetching the file summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [repoId, filePath]);

  const fileName = filePath.split('/').pop() || filePath;
  const directory = filePath.substring(0, filePath.lastIndexOf('/'));

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full relative overflow-hidden shadow-2xl">
      {/* Close button for mobile or compact views */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 transition-all duration-150 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex items-start gap-3 mb-6 pb-4 border-b border-zinc-900 pr-8">
        <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase tracking-wider">File Analyzer</span>
          <h3 className="text-white font-bold text-base truncate mt-0.5">{fileName}</h3>
          {directory && (
            <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">{directory}/</p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[30vh]">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-200 text-sm font-semibold">Generating AI Summary...</p>
            <p className="text-zinc-500 text-xs mt-1 font-mono">Invoking OpenRouter LLM completions</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-red-300 font-semibold text-sm">Failed to Load Explanation</h4>
            <p className="text-red-400/90 text-xs mt-2 max-w-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Explanation Text Display */}
        {!loading && !error && summary && (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Meta badges */}
            <div className="flex flex-wrap gap-3 select-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-[10px] font-mono">
                <Cpu className="w-3 h-3 text-zinc-500" />
                Model: <span className="text-indigo-400 font-bold">{modelUsed}</span>
              </div>

              {cached ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/25 rounded-lg text-emerald-400 text-[10px] font-mono">
                  <Database className="w-3 h-3 text-emerald-500" />
                  Source: CACHED (Instant)
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-indigo-400 text-[10px] font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Source: LLM CALCULATION
                </div>
              )}
            </div>

            {/* Summary Text Box */}
            <div className="text-zinc-300 text-xs leading-relaxed font-sans bg-zinc-950/40 p-4 rounded-xl border border-zinc-900 whitespace-pre-wrap">
              {summary}
            </div>

          </div>
        )}

        {/* Initial Empty State */}
        {!loading && !error && !summary && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <FileText className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-xs">Select any code file on the left side to review a plain-English explain report.</p>
          </div>
        )}

      </div>
    </div>
  );
}
