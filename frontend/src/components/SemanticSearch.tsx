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
import { API_BASE_URL } from '../lib/apiClient';

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
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/repos/${repoId}/search`, {
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
    <div className="bg-white border border-[#E5E1DA] p-6 rounded-2xl shadow-xs relative overflow-hidden group sm:col-span-2">
      {/* Background visual element */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[#E85D2C] pointer-events-none">
        <Search className="w-48 h-48" />
      </div>

      <div className="flex items-start gap-3 mb-4 pb-3 border-b border-[#E5E1DA] pr-8">
        <div className="p-2 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-xl text-[#E85D2C] shrink-0">
          <Search className="w-4.5 h-4.5 text-[#E85D2C]" />
        </div>
        <div>
          <span className="text-[10px] text-[#E85D2C] font-mono font-semibold uppercase tracking-wider">Semantic Search Engine</span>
          <h3 className="text-[#1A1D29] font-bold text-sm mt-0.5">Codebase Query (RAG)</h3>
        </div>
      </div>

      {/* Status Warning / Helper Banner */}
      {!isIndexed && (
        <div className="mb-4 p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] flex gap-2 items-center">
          {indexingStatus === 'indexing' ? (
            <>
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              <span className="text-xs text-amber-700 font-mono">Indexing in progress... Search is locked until complete.</span>
            </>
          ) : indexingStatus === 'error' ? (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-xs text-rose-700 font-mono">Indexing failed. Please retry indexing to search.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-[#6B7280] shrink-0" />
              <span className="text-xs text-[#6B7280] font-mono">Indexing not initialized.</span>
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
              className="w-full bg-[#FAFAF7] text-[#1A1D29] placeholder-[#6B7280] text-xs rounded-xl border border-[#E5E1DA] hover:border-[#E85D2C]/40 focus:border-[#E85D2C] focus:bg-white focus:outline-none px-4 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {queryValidationError && (
              <span className="absolute left-1 -bottom-5 text-[10px] text-rose-600 font-mono">
                {queryValidationError}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isIndexed || isSearching || query.trim().length < 3}
            className="px-5 py-3 rounded-xl bg-[#E85D2C] hover:bg-[#D44E1F] disabled:bg-[#E5E1DA] disabled:text-[#6B7280] text-white font-medium text-xs transition-all duration-200 shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
          <Loader2 className="w-8 h-8 text-[#E85D2C] animate-spin mb-3" />
          <h4 className="text-[#1A1D29] font-semibold text-xs">Synthesizing Answer</h4>
          <p className="text-[#6B7280] text-[10px] mt-1 font-mono leading-relaxed">
            Running smart search & generating response using Groq model
          </p>
        </div>
      )}

      {/* ERROR MESSAGE DISPLAY */}
      {error && !isSearching && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-800 font-semibold text-xs">Search Failed</h4>
            <p className="text-rose-700 text-[10px] font-mono mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ANSWER & RESULTS */}
      {!isSearching && !error && answer && (
        <div className="flex flex-col gap-6">
          
          {/* Highlighted Synthesized Answer Card */}
          {isNoContext ? (
            /* Warning/Empty visual state for "no relevant information found" */
            <div className="p-5 rounded-xl bg-amber-50/80 border border-dashed border-amber-300 text-amber-950 shadow-xs relative overflow-hidden">
              <div className="absolute top-3 right-3 text-amber-500/20">
                <HelpCircle className="w-12 h-12" />
              </div>
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <h4 className="text-amber-800 font-bold text-xs uppercase tracking-wider font-mono">No Relevant Code Information Found</h4>
              </div>
              <p className="text-amber-950 text-xs leading-relaxed mt-2.5 pr-8 whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          ) : (
            /* Premium highlighted normal answer card */
            <div className="p-5 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] shadow-xs relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[#E85D2C]/10">
                <Sparkles className="w-12 h-12" />
              </div>
              
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#E85D2C] shrink-0 mt-0.5" />
                <h4 className="text-[#E85D2C] font-bold text-xs uppercase tracking-wider font-mono">Synthesized Explainer Answer</h4>
              </div>
              
              <p className="text-[#1A1D29] text-xs leading-relaxed mt-2.5 whitespace-pre-wrap">
                {answer}
              </p>

              {/* Clickable Citations */}
              {citedChunks && citedChunks.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-[#E5E1DA]">
                  <span className="text-[10px] text-[#6B7280] font-mono block mb-2 uppercase tracking-wider font-semibold">Citations & References:</span>
                  <div className="flex flex-wrap gap-2">
                    {citedChunks.map((citation, index) => {
                      const fileName = citation.file_path.split('/').pop() || citation.file_path;
                      return (
                        <button
                          key={index}
                          onClick={() => onSelectFile(citation.file_path)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#FAFAF7] border border-[#E5E1DA] hover:border-[#E85D2C]/40 rounded-lg text-[#1A1D29] hover:text-[#E85D2C] text-[10px] font-mono transition-all duration-150 cursor-pointer shadow-2xs"
                          title={`Open ${citation.file_path}`}
                        >
                          <FileCode className="w-3 h-3 text-[#E85D2C]" />
                          <span className="font-semibold">{fileName}</span>
                          <span className="text-[#6B7280]">L{citation.start_line}-{citation.end_line}</span>
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
            <div className="border border-[#E5E1DA] rounded-xl overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => setShowResultsList(!showResultsList)}
                className="w-full px-4 py-3 hover:bg-[#FAFAF7] flex items-center justify-between transition-colors border-b border-[#E5E1DA] text-[#1A1D29] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-xs font-semibold">View all {searchResults.length} results</span>
                </div>
                {showResultsList ? (
                  <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                )}
              </button>

              {showResultsList && (
                <div className="p-4 flex flex-col gap-3 max-h-[40vh] overflow-y-auto divide-y divide-[#E5E1DA]">
                  {searchResults.map((result) => {
                    const hasKeyword = result.found_by.includes('keyword');
                    const hasVector = result.found_by.includes('vector');
                    
                    return (
                      <div key={result.id} className="pt-3 first:pt-0">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectFile(result.file_path)}
                            className="text-[#1A1D29] hover:text-[#E85D2C] text-xs font-semibold font-mono hover:underline text-left cursor-pointer truncate max-w-full"
                          >
                            {result.file_path} (L{result.start_line}-{result.end_line})
                          </button>
                          
                          {/* Found By Badge */}
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-medium select-none ${
                            hasKeyword && hasVector 
                              ? 'bg-purple-50 border-purple-200 text-purple-700' 
                              : hasVector 
                              ? 'bg-blue-50 border-blue-200 text-blue-700' 
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {hasKeyword && hasVector 
                              ? 'keyword + vector' 
                              : hasVector 
                              ? 'vector only' 
                              : 'keyword only'}
                          </span>
                        </div>

                        {/* Chunk Info & Code Block */}
                        <div className="text-[10px] text-[#6B7280] font-mono mb-1.5 flex gap-2">
                          <span>Name: <strong className="text-[#1A1D29] font-semibold">{result.name}</strong></span>
                          <span>•</span>
                          <span>Type: <strong className="text-[#1A1D29] font-semibold">{result.chunk_type}</strong></span>
                        </div>

                        <pre className="p-3 bg-[#FAFAF7] border border-[#E5E1DA] rounded-lg text-[10px] text-[#1A1D29] font-mono overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
                          {result.content_preview}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-[#E5E1DA] text-center py-6">
              <FileCode className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
              <p className="text-[10px] text-[#6B7280] font-mono">No raw code chunks retrieved for query.</p>
            </div>
          )}

        </div>
      )}

      {/* NO RESULTS RETURNED */}
      {!isSearching && !error && answer && searchResults.length === 0 && (
        <div className="p-5 rounded-xl border border-dashed border-[#E5E1DA] text-center py-10">
          <HelpCircle className="w-8 h-8 text-[#6B7280] mx-auto mb-3" />
          <h4 className="text-[#1A1D29] font-semibold text-xs">No matching results found</h4>
          <p className="text-[#6B7280] text-[10px] mt-1.5 font-mono max-w-sm mx-auto leading-relaxed">
            The semantic search returned zero chunk matches. Try querying with different keywords or general description terms.
          </p>
        </div>
      )}
    </div>
  );
}

