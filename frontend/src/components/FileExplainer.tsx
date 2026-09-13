import React, { useEffect, useState, useRef } from 'react';
import { 
  FileText, 
  Cpu, 
  Database, 
  AlertTriangle, 
  Loader2,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  GitCommit,
  Network,
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '../lib/apiClient';

interface TransitiveDep {
  file_path: string;
  depth: number;
  path: string[];
}

interface BlastRadiusData {
  file_path: string;
  direct_dependents: string[];
  transitive_dependents: TransitiveDep[];
  total_affected_count: number;
}

interface FileExplainerProps {
  repoId: string;
  filePath: string;
  onClose?: () => void;
  onLoadingStateChange?: (loading: boolean) => void;
  onSelectFile?: (filePath: string) => void;
}

export default function FileExplainer({ 
  repoId, 
  filePath, 
  onClose, 
  onLoadingStateChange,
  onSelectFile 
}: FileExplainerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'blast_radius'>('summary');

  // AI Summary states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [cached, setCached] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [secretsRedacted, setSecretsRedacted] = useState(false);

  // Blast Radius states
  const [loadingBlast, setLoadingBlast] = useState(false);
  const [blastData, setBlastData] = useState<BlastRadiusData | null>(null);
  const [blastError, setBlastError] = useState<string | null>(null);
  
  const loadingRef = useRef('');

  useEffect(() => {
    if (!repoId || !filePath) return;
    
    if (loadingRef.current === filePath) {
      return;
    }

    const fetchAllFileData = async () => {
      loadingRef.current = filePath;
      console.log(`[DevLens AI] Fetching explanation & blast radius for: "${filePath}"`);

      setLoadingSummary(true);
      setLoadingBlast(true);
      if (onLoadingStateChange) onLoadingStateChange(true);

      setSummaryError(null);
      setBlastError(null);
      setSummary('');
      setBlastData(null);
      setSecretsRedacted(false);
      
      const encodedPath = encodeURIComponent(filePath);
      
      // Parallel fetches for summary and blast radius
      try {
        const [summaryRes, blastRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/files/explain?repo_id=${repoId}&file_path=${encodedPath}`),
          fetch(`${API_BASE_URL}/api/files/blast-radius?repo_id=${repoId}&file_path=${encodedPath}`)
        ]);

        if (summaryRes.ok) {
          const sumData = await summaryRes.json();
          setSummary(sumData.summary);
          setModelUsed(sumData.model_used);
          setCached(sumData.cached);
          setSecretsRedacted(sumData.secrets_redacted || false);
        } else {
          const sumErr = await summaryRes.json();
          setSummaryError(sumErr.detail || 'Failed to generate explanation.');
        }

        if (blastRes.ok) {
          const bData = await blastRes.json();
          setBlastData(bData);
        } else {
          const bErr = await blastRes.json();
          setBlastError(bErr.detail || 'Failed to compute blast radius.');
        }
      } catch (err: any) {
        console.error(err);
        setSummaryError(err.message || 'An error occurred while fetching file data.');
      } finally {
        setLoadingSummary(false);
        setLoadingBlast(false);
        loadingRef.current = '';
        if (onLoadingStateChange) onLoadingStateChange(false);
      }
    };

    fetchAllFileData();
  }, [repoId, filePath]);

  const handleRegenerate = async () => {
    if (!repoId || !filePath || loadingSummary) return;
    setLoadingSummary(true);
    setSummaryError(null);
    setSummary('');
    if (onLoadingStateChange) onLoadingStateChange(true);
    
    const encodedPath = encodeURIComponent(filePath);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/explain?repo_id=${repoId}&file_path=${encodedPath}&force_regenerate=true`);
      if (res.ok) {
        const sumData = await res.json();
        setSummary(sumData.summary);
        setModelUsed(sumData.model_used);
        setCached(sumData.cached);
        setSecretsRedacted(sumData.secrets_redacted || false);
      } else {
        const sumErr = await res.json();
        setSummaryError(sumErr.detail || 'Failed to regenerate explanation.');
      }
    } catch (err: any) {
      console.error(err);
      setSummaryError(err.message || 'An error occurred while regenerating explanation.');
    } finally {
      setLoadingSummary(false);
      if (onLoadingStateChange) onLoadingStateChange(false);
    }
  };

  const fileName = filePath.split('/').pop() || filePath;
  const directory = filePath.substring(0, filePath.lastIndexOf('/'));

  return (
    <div className="bg-white border border-[#E5E1DA] p-6 rounded-2xl flex flex-col h-full relative overflow-hidden shadow-xs">
      {/* Close button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-[#E5E1DA] hover:border-[#E85D2C]/40 bg-white hover:bg-[#FAFAF7] text-[#6B7280] hover:text-[#1A1D29] transition-all duration-150 cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Header Info */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[#E5E1DA] pr-8">
        <div className="p-2.5 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-xl text-[#E85D2C] shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#E85D2C] font-mono font-semibold uppercase tracking-wider">File Analyzer</span>
            {secretsRedacted && (
              <span 
                className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[9px] font-semibold animate-pulse select-none cursor-help"
                title="Potential secrets were detected and redacted before AI analysis for your safety"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                SECRETS REDACTED
              </span>
            )}
          </div>
          <h3 className="text-[#1A1D29] font-bold text-base truncate mt-0.5">{fileName}</h3>
          {directory && (
            <p className="text-[10px] text-[#6B7280] font-mono truncate mt-0.5">{directory}/</p>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-4 mb-4 border-b border-[#E5E1DA] pb-2 select-none">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`pb-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'summary' 
              ? 'border-[#E85D2C] text-[#E85D2C]' 
              : 'border-transparent text-[#6B7280] hover:text-[#1A1D29]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          AI Summary
        </button>

        <button 
          onClick={() => setActiveTab('blast_radius')}
          className={`pb-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'blast_radius' 
              ? 'border-[#E85D2C] text-[#E85D2C]' 
              : 'border-transparent text-[#6B7280] hover:text-[#1A1D29]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#E85D2C]" />
          What Depends On This
          {blastData && (
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              blastData.total_affected_count > 0 
                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                : 'bg-[#FAFAF7] text-[#6B7280] border border-[#E5E1DA]'
            }`}>
              {blastData.total_affected_count}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[30vh] overflow-y-auto">
        
        {/* TAB 1: AI SUMMARY */}
        {activeTab === 'summary' && (
          <div className="flex-1 flex flex-col">
            {loadingSummary && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-8 h-8 text-[#E85D2C] animate-spin mb-4" />
                <p className="text-[#1A1D29] text-sm font-semibold">Generating AI Summary...</p>
                <p className="text-[#6B7280] text-xs mt-1 font-mono">Invoking Gemini 2.0 Flash</p>
              </div>
            )}

            {summaryError && !loadingSummary && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-rose-800 font-semibold text-sm">Failed to Load Explanation</h4>
                <p className="text-rose-700 text-xs mt-2 max-w-sm leading-relaxed">{summaryError}</p>
              </div>
            )}

            {!loadingSummary && !summaryError && summary && (
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-wrap gap-3 select-none">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAFAF7] border border-[#E5E1DA] rounded-lg text-[#6B7280] text-[10px] font-mono">
                    <Cpu className="w-3 h-3 text-[#6B7280]" />
                    Model: <span className="text-[#E85D2C] font-bold">{modelUsed}</span>
                  </div>

                  {cached ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[10px] font-mono">
                      <Database className="w-3 h-3 text-emerald-600" />
                      Source: CACHED (Instant)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-lg text-[#E85D2C] text-[10px] font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E85D2C] animate-pulse" />
                      Source: LLM CALCULATION
                    </div>
                  )}

                  <button
                    onClick={handleRegenerate}
                    disabled={loadingSummary}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#FAFAF7] border border-[#E5E1DA] hover:border-[#E85D2C]/40 rounded-lg text-[#6B7280] hover:text-[#1A1D29] text-[10px] font-mono transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    title="Force regenerate summary"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#6B7280] ${loadingSummary ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>

                <div className="text-[#1A1D29] text-sm leading-relaxed font-sans bg-[#FAFAF7] p-4 rounded-xl border border-[#E5E1DA] whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BLAST RADIUS */}
        {activeTab === 'blast_radius' && (
          <div className="flex-1 flex flex-col gap-4">
            {loadingBlast && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
                <p className="text-[#1A1D29] text-sm font-semibold">Computing Dependencies...</p>
                <p className="text-[#6B7280] text-xs mt-1 font-mono">Analyzing import dependencies</p>
              </div>
            )}

            {blastError && !loadingBlast && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-rose-800 font-semibold text-sm">Dependency Calculation Error</h4>
                <p className="text-rose-700 text-xs mt-2 max-w-sm leading-relaxed">{blastError}</p>
              </div>
            )}

            {!loadingBlast && !blastError && blastData && (
              <div className="flex-1 flex flex-col gap-5">
                
                {/* Blast Radius Stat Banner */}
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                  blastData.total_affected_count > 0 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className={`p-3 rounded-xl shrink-0 ${
                    blastData.total_affected_count > 0 
                      ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {blastData.total_affected_count > 0 ? <Zap className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {blastData.total_affected_count > 0 
                        ? `${blastData.total_affected_count} ${blastData.total_affected_count === 1 ? 'file' : 'files'} depend on this` 
                        : 'No other files import this one'}
                    </h4>
                    <p className="text-xs mt-0.5 text-[#6B7280]">
                      {blastData.total_affected_count > 0 
                        ? 'Modifying interfaces in this file will impact the downstream files listed below.' 
                        : 'This file is a leaf module or top-level entry point. Changing it carries low risk of breaking other files.'}
                    </p>
                  </div>
                </div>

                {/* ZERO DEPENDENTS CASE */}
                {blastData.total_affected_count === 0 && (
                  <div className="p-6 rounded-xl border border-dashed border-[#E5E1DA] text-center text-[#6B7280] bg-[#FAFAF7]/50">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                    <p className="text-xs text-[#1A1D29] font-medium">Safe to Modify</p>
                    <p className="text-[11px] text-[#6B7280] mt-1 max-w-sm mx-auto">
                      No internal project files currently reference <code className="text-[#1A1D29] bg-white border border-[#E5E1DA] px-1.5 py-0.5 rounded font-mono">{fileName}</code> as an import dependency.
                    </p>
                  </div>
                )}

                {/* DIRECT DEPENDENTS LIST */}
                {blastData.direct_dependents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h5 className="text-[11px] font-mono font-bold uppercase text-[#E85D2C] tracking-wider flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5" />
                      Direct Dependents ({blastData.direct_dependents.length})
                    </h5>
                    <div className="flex flex-col gap-1.5">
                      {blastData.direct_dependents.map((depPath) => (
                        <button
                          key={depPath}
                          onClick={() => onSelectFile && onSelectFile(depPath)}
                          className="w-full text-left p-2.5 rounded-xl bg-[#FAFAF7] hover:bg-amber-50/60 border border-[#E5E1DA] hover:border-amber-300 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-xs font-mono text-[#1A1D29] group-hover:text-amber-800 truncate">
                              {depPath}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#6B7280] group-hover:text-amber-700 flex items-center gap-1 shrink-0">
                            Inspect <ArrowRight className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRANSITIVE DEPENDENTS LIST */}
                {blastData.transitive_dependents.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <h5 className="text-[11px] font-mono font-bold uppercase text-[#E85D2C] tracking-wider flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5" />
                      Transitive Dependents ({blastData.transitive_dependents.length})
                    </h5>
                    <div className="flex flex-col gap-2">
                      {blastData.transitive_dependents.map((transDep, idx) => (
                        <div 
                          key={`${transDep.file_path}-${idx}`}
                          className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E5E1DA] hover:border-[#E85D2C]/40 transition-all flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => onSelectFile && onSelectFile(transDep.file_path)}
                              className="text-xs font-mono font-semibold text-[#1A1D29] hover:text-[#E85D2C] truncate text-left cursor-pointer flex items-center gap-2"
                            >
                              <span className="px-1.5 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded text-[9px]">
                                Depth {transDep.depth}
                              </span>
                              <span className="truncate">{transDep.file_path}</span>
                            </button>
                            <button
                              onClick={() => onSelectFile && onSelectFile(transDep.file_path)}
                              className="text-[10px] font-mono text-[#6B7280] hover:text-[#E85D2C] flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                            >
                              Inspect <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Impact Flow Chain Path */}
                          <div className="bg-white p-2 rounded-lg border border-[#E5E1DA] text-[10px] font-mono text-[#6B7280] flex items-center gap-1.5 flex-wrap overflow-x-auto">
                            <span className="text-[#6B7280] font-sans text-[9px] uppercase tracking-wider">Flow:</span>
                            {transDep.path.map((node, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <ArrowRight className="w-2.5 h-2.5 text-[#E85D2C] shrink-0" />}
                                <span className={`px-1.5 py-0.5 rounded ${
                                  i === 0 
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' 
                                    : i === transDep.path.length - 1 
                                      ? 'bg-orange-50 text-orange-800 border border-orange-200 font-bold' 
                                      : 'bg-[#FAFAF7] text-[#1A1D29] border border-[#E5E1DA]'
                                }`}>
                                  {node.split('/').pop() || node}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

