import React, { useState } from 'react';
import { 
  Search, 
  Loader2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  Sparkles, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface CitedChunk {
  file_path: string;
  start_line: number;
  end_line: number;
}

interface SearchResult {
  id: string;
  file_path: string;
  chunk_type: string;
  name: string;
  parent_class: string | null;
  start_line: number;
  end_line: number;
  content_preview: string;
  content: string;
  found_by: string[];
  rrf_score: number;
}

interface SemanticSearchProps {
  repoId: string;
  indexingStatus: 'idle' | 'indexing' | 'success' | 'error';
  chunksIndexed: number | null;
  onSelectFile: (filePath: string) => void;
}

export default function SemanticSearch({ 
  repoId, 
  indexingStatus, 
  chunksIndexed, 
  onSelectFile 
}: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citedChunks, setCitedChunks] = useState<CitedChunk[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResultsList, setShowResultsList] = useState(false);
  const [queryValidationError, setQueryValidationError] = useState<string | null>(null);

  const isIndexed = indexingStatus === 'success';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIndexed) return;
    
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      setQueryValidationError('Search query must be at least 3 characters long.');
      return;
    }
    
    setQueryValidationError(null);
    setIsSearching(true);
    setError(null);
    setAnswer(null);
    setCitedChunks([]);
    setSearchResults([]);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${apiUrl}/api/repos/${repoId}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: trimmedQuery,
          top_k: 10
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Search request failed.');
      }
      
      setAnswer(data.answer);
      setCitedChunks(data.cited_chunks || []);
      setSearchResults(data.all_results || []);
      setShowResultsList(false); // Collapsed by default as per instructions
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while executing semantic search.');
    } finally {
      setIsSearching(false);
    }
  };

  // Determine if the answer represents the "no relevant information found" case
  const isNoContext = React.useMemo(() => {
    if (!answer) return false;
    const lowerAnswer = answer.toLowerCase();
    return (
      citedChunks.length === 0 ||
      lowerAnswer.includes('do not have enough context') ||
      lowerAnswer.includes('no relevant code chunks') ||
      lowerAnswer.includes('could not find relevant information') ||
      lowerAnswer.includes('couldn\'t find relevant information') ||
      lowerAnswer.includes('no relevant information')
    );
  }, [answer, citedChunks]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-zinc-900/50 relative overflow-hidden group sm:col-span-2">
      {/* Background visual element */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-indigo-400 pointer-events-none">
        <Search className="w-48 h-48" />
      </div>

      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-zinc-900 pr-8">
        <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
          <Search className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase tracking-wider">Semantic Search Engine</span>
          <h3 className="text-white font-bold text-sm mt-0.5">Codebase Query (RAG)</h3>
        </div>
      </div>

      {/* Status Warning / Helper Banner */}
      {!isIndexed && (
        <div className="mb-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 flex gap-2 items-center">
          {indexingStatus === 'indexing' ? (
            <>
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
              <span className="text-xs text-amber-400 font-mono">Indexing in progress... Search is locked until complete.</span>
            </>
          ) : indexingStatus === 'error' ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs text-red-400 font-mono">Indexing failed. Please retry indexing to search.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="text-xs text-zinc-500 font-mono">Indexing not initialized.</span>
            </>
          )}
        </div>
      )}

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input 
              type="text"
              required
              disabled={!isIndexed || isSearching}
              placeholder={
                !isIndexed 
                  ? 'Indexing in progress...' 
                  : 'Ask about this codebase (e.g., "how is auth handled?")'
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 3) {
                  setQueryValidationError(null);
                }
              }}
              className="w-full bg-zinc-950 text-zinc-100 placeholder-zinc-500 text-xs rounded-xl border border-zinc-850 hover:border-zinc-800 focus:border-indigo-500/80 focus:outline-none px-4 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {queryValidationError && (
              <span className="absolute left-1 -bottom-5 text-[10px] text-red-400 font-mono">
                {queryValidationError}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isIndexed || isSearching || query.trim().length < 3}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-900 disabled:to-zinc-900 text-white font-medium text-xs transition-all duration-205 shadow-md shadow-indigo-600/10 active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Ask DevLens
              </>
            )}
          </button>
        </div>
      </form>

      {/* SEARCH LOADING STATE */}
      {isSearching && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <h4 className="text-zinc-300 font-semibold text-xs">Synthesizing Answer</h4>
          <p className="text-zinc-500 text-[10px] mt-1 font-mono leading-relaxed">
            Running hybrid retrieval (RRF) & generating response using Groq llama-3.3-70b-versatile
          </p>
        </div>
      )}

      {/* ERROR MESSAGE DISPLAY */}
      {error && !isSearching && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-300 font-semibold text-xs">Search Failed</h4>
            <p className="text-red-400/90 text-[10px] font-mono mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ANSWER & RESULTS */}
      {!isSearching && !error && answer && (
        <div className="flex flex-col gap-6">
          
          {/* Highlighted Synthesized Answer Card */}
          {isNoContext ? (
            /* Warning/Empty visual state for "no relevant information found" */
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-dashed border-amber-500/35 text-zinc-305 shadow-lg relative overflow-hidden">
              <div className="absolute top-3 right-3 text-amber-500/20">
                <HelpCircle className="w-12 h-12" />
              </div>
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">No Relevant Code Information Found</h4>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed mt-2.5 pr-8 whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          ) : (
            /* Premium highlighted normal answer card */
            <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/25 shadow-lg shadow-indigo-950/15 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-indigo-500/10">
                <Sparkles className="w-12 h-12" />
              </div>
              
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">Synthesized Explainer Answer</h4>
              </div>
              
              <p className="text-zinc-200 text-xs leading-relaxed mt-2.5 whitespace-pre-wrap">
                {answer}
              </p>

              {/* Clickable Citations */}
              {citedChunks && citedChunks.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-zinc-900/70">
                  <span className="text-[10px] text-zinc-500 font-mono block mb-2 uppercase tracking-wider font-semibold">Citations & References:</span>
                  <div className="flex flex-wrap gap-2">
                    {citedChunks.map((citation, index) => {
                      const fileName = citation.file_path.split('/').pop() || citation.file_path;
                      return (
                        <button
                          key={index}
                          onClick={() => onSelectFile(citation.file_path)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-zinc-300 hover:text-indigo-300 text-[10px] font-mono transition-all duration-150 cursor-pointer"
                          title={`Open ${citation.file_path}`}
                        >
                          <FileCode className="w-3 h-3 text-indigo-400/90" />
                          <span className="font-semibold">{fileName}</span>
                          <span className="text-zinc-500">L{citation.start_line}-{citation.end_line}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsible search results section */}
          {searchResults.length > 0 ? (
            <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/20">
              <button
                type="button"
                onClick={() => setShowResultsList(!showResultsList)}
                className="w-full px-4 py-3 hover:bg-zinc-900/20 flex items-center justify-between transition-colors border-b border-zinc-900 text-zinc-300 hover:text-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold">View all {searchResults.length} results</span>
                </div>
                {showResultsList ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {showResultsList && (
                <div className="p-4 flex flex-col gap-3 max-h-[40vh] overflow-y-auto divide-y divide-zinc-900/50">
                  {searchResults.map((result) => {
                    const hasKeyword = result.found_by.includes('keyword');
                    const hasVector = result.found_by.includes('vector');
                    
                    return (
                      <div key={result.id} className="pt-3 first:pt-0">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectFile(result.file_path)}
                            className="text-zinc-300 hover:text-indigo-400 text-xs font-semibold font-mono hover:underline text-left cursor-pointer truncate max-w-full"
                          >
                            {result.file_path} (L{result.start_line}-{result.end_line})
                          </button>
                          
                          {/* Found By Badge */}
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-medium select-none ${
                            hasKeyword && hasVector 
                              ? 'bg-purple-950/30 border-purple-500/20 text-purple-400' 
                              : hasVector 
                              ? 'bg-blue-950/30 border-blue-500/20 text-blue-400' 
                              : 'bg-amber-950/30 border-amber-500/20 text-amber-400'
                          }`}>
                            {hasKeyword && hasVector 
                              ? 'keyword + vector' 
                              : hasVector 
                              ? 'vector only' 
                              : 'keyword only'}
                          </span>
                        </div>

                        {/* Chunk Info & Code Block */}
                        <div className="text-[10px] text-zinc-500 font-mono mb-1.5 flex gap-2">
                          <span>Name: <strong className="text-zinc-400 font-semibold">{result.name}</strong></span>
                          <span>•</span>
                          <span>Type: <strong className="text-zinc-400 font-semibold">{result.chunk_type}</strong></span>
                        </div>

                        <pre className="p-3 bg-zinc-950/90 border border-zinc-900 rounded-lg text-[10px] text-zinc-400 font-mono overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
                          {result.content_preview}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-zinc-900 text-center py-6">
              <FileCode className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-500 font-mono">No raw code chunks retrieved for query.</p>
            </div>
          )}

        </div>
      )}

      {/* NO RESULTS RETURNED */}
      {!isSearching && !error && answer && searchResults.length === 0 && (
        <div className="p-5 rounded-xl border border-dashed border-zinc-800 text-center py-10">
          <HelpCircle className="w-8 h-8 text-zinc-650 mx-auto mb-3" />
          <h4 className="text-zinc-400 font-semibold text-xs">No matching results found</h4>
          <p className="text-zinc-500 text-[10px] mt-1.5 font-mono max-w-sm mx-auto leading-relaxed">
            The semantic search returned zero chunk matches. Try querying with different keywords or general description terms.
          </p>
        </div>
      )}
    </div>
  );
}
