import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Loader2, 
  AlertCircle, 
  FolderIcon, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';

interface ModuleDoc {
  module_path: string;
  doc_content: string;
  file_count: number;
}

interface AutoDocsProps {
  repoId: string;
  repoName: string;
}

// 1. Simple, Elegant, Zero-Dependency Markdown Renderer
function renderMarkdown(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent: string[] = [];
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, idx) => {
    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <pre key={`code-${idx}`} className="bg-zinc-950/80 border border-zinc-900 p-4 rounded-xl font-mono text-[10.5px] text-zinc-300 overflow-x-auto my-3 whitespace-pre select-text">
            {codeContent.join('\n')}
          </pre>
        );
        codeContent = [];
      } else {
        inCodeBlock = true;
      }
      return;
    }
    
    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }
    
    const trimmed = line.trim();
    
    // Handle Headings
    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={idx} className="text-xs font-bold text-white mt-4 mb-2">{trimmed.substring(4)}</h4>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={idx} className="text-sm font-bold text-indigo-400 mt-5 mb-2.5">{trimmed.substring(3)}</h3>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={idx} className="text-base font-extrabold text-white mt-6 mb-3 border-b border-zinc-900 pb-1.5">{trimmed.substring(2)}</h2>);
      return;
    }
    
    // Handle Bullet Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const rawContent = trimmed.substring(2);
      elements.push(
        <li key={idx} className="text-zinc-300 text-xs leading-relaxed ml-4 list-disc pl-1 mb-1.5">
          {parseInlineMarkdown(rawContent)}
        </li>
      );
      return;
    }
    
    // Handle Numbered Lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <li key={idx} className="text-zinc-300 text-xs leading-relaxed ml-4 list-decimal pl-1 mb-1.5">
          {parseInlineMarkdown(numMatch[2])}
        </li>
      );
      return;
    }
    
    // Empty Line
    if (!trimmed) {
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }
    
    // Default Paragraph
    elements.push(
      <p key={idx} className="text-zinc-300 text-xs leading-relaxed mb-3">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
  
  return <div className="space-y-1 select-text">{elements}</div>;
}

// Inline Markdown Parser (**bold** and `code`)
function parseInlineMarkdown(text: string) {
  const parts = [];
  let keyIdx = 0;
  
  const inlineRegex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    if (match[2]) {
      parts.push(<strong key={keyIdx++} className="font-bold text-white">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<code key={keyIdx++} className="bg-zinc-900 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300 border border-zinc-800">{match[3]}</code>);
    }
    
    lastIndex = inlineRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
}


export default function AutoDocs({ repoId, repoName }: AutoDocsProps) {
  const [docs, setDocs] = useState<ModuleDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Accordion open/close mapping
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (modulePath: string) => {
    setOpenSections(prev => ({
      ...prev,
      [modulePath]: !prev[modulePath]
    }));
  };

  // 2. Load Docs from Cache or trigger check
  const loadDocs = useCallback(async (triggerGeneration = false) => {
    setLoading(true);
    setError(null);
    if (triggerGeneration) {
      setLoadingPhase('Synthesizing folder summaries...');
      setTimeout(() => setLoadingPhase('Analyzing file connections & relationships...'), 1500);
      setTimeout(() => setLoadingPhase('Generating README documentation overviews via Gemini 3.5...'), 3500);
    } else {
      setLoadingPhase('Checking cache...');
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      const url = `${apiUrl}/api/repos/${repoId}/docs`;
      const response = await fetch(url);
      const data = await response.json();
      
      // If we are checking cache on mount and it's a 400 (no docs yet) or 404
      if (!response.ok) {
        if (!triggerGeneration && (response.status === 400 || response.status === 404)) {
          // Just leave docs empty, the user can click the CTA button to generate
          setDocs([]);
          return;
        }
        throw new Error(data.detail || 'Failed to retrieve module documentation.');
      }
      
      setDocs(data.modules || []);
      
      // Open the first section by default
      if (data.modules && data.modules.length > 0) {
        setOpenSections({ [data.modules[0].module_path]: true });
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load module documentation.');
    } finally {
      setLoading(false);
      setLoadingPhase('');
    }
  }, [repoId]);

  useEffect(() => {
    if (repoId) {
      loadDocs(false);
    }
  }, [repoId, loadDocs]);

  // 3. Export Download Action
  const handleExport = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const exportUrl = `${apiUrl}/api/repos/${repoId}/docs/export?repo_name=${encodeURIComponent(repoName)}`;
    // Open in new window/trigger native download
    window.location.href = exportUrl;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Doc Page Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-indigo-400 font-mono font-medium uppercase tracking-wider">Module Synthesis</span>
          <h2 className="text-xl font-bold text-white mt-0.5">Auto-Generated Documentation</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            DevLens AI synthesizes the cached explanations of your files, cross-references internal dependencies, and generates comprehensive, module-level README documents.
          </p>
        </div>

        {docs.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export README.md
          </button>
        )}
      </div>

      {/* Main Content Pane */}
      <div className="relative min-h-[300px] flex flex-col">
        
        {/* Loading Spinner with Phase indicators */}
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/80 z-20 rounded-2xl flex flex-col items-center justify-center text-center p-8 border border-zinc-900/50">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-200 text-sm font-semibold">Running Documentation Architect...</p>
            <p className="text-zinc-500 text-xs mt-1.5 font-mono">{loadingPhase}</p>
          </div>
        )}

        {/* Error Screen */}
        {error && (
          <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center flex flex-col items-center justify-center">
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-red-300 font-semibold text-sm">Documentation Pipeline Failed</h4>
            <p className="text-red-400/90 text-xs mt-2 max-w-md leading-relaxed">{error}</p>
            <button 
              onClick={() => loadDocs(true)}
              className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        )}

        {/* Initial Generation CTA (If cache check was empty) */}
        {!loading && !error && docs.length === 0 && (
          <div className="glass-panel p-12 rounded-2xl border border-zinc-900 flex flex-col items-center text-center py-16">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-indigo-400 mb-5">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-white font-bold text-base">Generate Codebase Module Docs</h3>
            <p className="text-zinc-500 text-xs mt-2 max-w-sm leading-relaxed">
              No module documents are currently cached for this repository. Let our AI system analyze and synthesize directory relationships.
            </p>
            <button
              onClick={() => loadDocs(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              Synthesize Module Docs
            </button>
          </div>
        )}

        {/* Accordion Documentation List */}
        {!loading && !error && docs.length > 0 && (
          <div className="flex flex-col gap-4">
            {docs.map((doc) => {
              const isOpen = !!openSections[doc.module_path];
              
              return (
                <div 
                  key={doc.module_path}
                  className={`glass-panel rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen ? 'border-zinc-800 bg-zinc-900/10 shadow-lg' : 'border-zinc-900/50 hover:border-zinc-800 bg-zinc-900/0'
                  }`}
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleSection(doc.module_path)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-left select-none bg-zinc-900/10 hover:bg-zinc-900/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isOpen ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        <FolderIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white text-xs font-bold font-mono tracking-tight truncate">
                          {doc.module_path}
                        </h4>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">
                          {doc.file_count} {doc.file_count === 1 ? 'file' : 'files'} included
                        </span>
                      </div>
                    </div>

                    <div className="text-zinc-500 shrink-0">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Accordion Content Area */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-3 border-t border-zinc-900/50 bg-zinc-950/20 max-w-none">
                      {renderMarkdown(doc.doc_content)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
