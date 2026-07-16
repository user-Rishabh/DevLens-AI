import React, { useState } from 'react';
import { 
  GitBranch, 
  Search, 
  Network, 
  Flame, 
  BookOpen, 
  ArrowRight, 
  Github, 
  Database,
  Layers,
  Cpu,
  ArrowLeft,
  AlertTriangle,
  FolderTree,
  Terminal,
  Files,
  Loader2,
  RefreshCw,
  Check
} from 'lucide-react';
import FileTree, { FileTreeNodeType } from '../components/FileTree';
import HotspotList, { HotspotType } from '../components/HotspotList';
import FileExplainer from '../components/FileExplainer';
import SemanticSearch from '../components/SemanticSearch';
import ArchitectureMap from '../components/ArchitectureMap';
import AutoDocs from '../components/AutoDocs';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard states
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoId, setRepoId] = useState('');
  const [fileTree, setFileTree] = useState<FileTreeNodeType | null>(null);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<HotspotType[]>([]);
  
  // Tab Selector state
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'docs'>('overview');
  
  // Sidebar tab switcher & Active file selection
  const [sidebarTab, setSidebarTab] = useState<'files' | 'hotspots'>('files');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  
  // Guard cooldown indicator state
  const [isExplainerLoading, setIsExplainerLoading] = useState(false);

  // Background Indexing states
  const [indexingStatus, setIndexingStatus] = useState<'idle' | 'indexing' | 'success' | 'error'>('idle');
  const [chunksIndexed, setChunksIndexed] = useState<number | null>(null);
  const [indexingError, setIndexingError] = useState<string | null>(null);

  // Background indexing fetcher
  const handleIndex = async (id: string, force: boolean = false) => {
    setIndexingStatus('indexing');
    setIndexingError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      console.log(`[DevLens AI] Starting background indexing for: ${id} (force_reindex=${force})`);
      const response = await fetch(`${apiUrl}/api/repos/${id}/index${force ? '?force_reindex=true' : ''}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to index repository');
      }
      setChunksIndexed(data.chunks_indexed);
      setIndexingStatus('success');
      console.log(`[DevLens AI] Background indexing complete for: ${id}. Chunks indexed: ${data.chunks_indexed}`);
    } catch (err: any) {
      console.error(`[DevLens AI] Indexing failed for repo: ${id}`, err);
      setIndexingError(err.message || 'Repository indexing failed.');
      setIndexingStatus('error');
    }
  };

  // Helper to count files and folders in the tree
  const countTreeNodes = (node: FileTreeNodeType | null): { files: number; folders: number } => {
    if (!node) return { files: 0, folders: 0 };
    let files = 0;
    let folders = 0;
    
    if (node.type === 'folder') {
      folders++;
      if (node.children) {
        node.children.forEach(child => {
          const childCounts = countTreeNodes(child);
          files += childCounts.files;
          folders += childCounts.folders;
        });
      }
    } else {
      files++;
    }
    
    return { files, folders };
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl && !repoUrl.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSelectedFilePath('');
    setIsExplainerLoading(false);
    setLoadingPhase('Validating GitHub URL...');
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      // Small artificial delays to show phases smoothly to the user
      setTimeout(() => setLoadingPhase('Cloning Repository (depth 100 with Git history)...'), 600);
      
      const response = await fetch(`${apiUrl}/api/repos/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ github_url: repoUrl.trim() }),
      });
      
      setLoadingPhase('Analyzing dependency graph & Git file hotspots...');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to ingest repository');
      }
      
      // Update states on success
      setRepoId(data.repo_id);
      setRepoName(data.repo_name);
      setFileTree(data.file_tree);
      setDependencies(data.dependencies);
      setHotspots(data.hotspots);
      setIsAnalyzed(true);
      
      // Select the files tab by default
      setSidebarTab('files');

      // Trigger background indexing asynchronously (no await)
      handleIndex(data.repo_id);
      
      // Explicitly log the received dependency graph to the developer console
      console.log('=========== DevLens AI Ingestion Report ===========');
      console.log('Repo ID:', data.repo_id);
      console.log('Project Name:', data.repo_name);
      console.log('Dependency Edges (Internal Imports):', data.dependencies);
      console.log('Git Hotspots (Commit Frequency):', data.hotspots);
      console.log('==================================================');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while communicating with the backend.');
    } finally {
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  const handleReset = () => {
    setIsAnalyzed(false);
    setRepoId('');
    setRepoName('');
    setFileTree(null);
    setDependencies([]);
    setHotspots([]);
    setRepoUrl('');
    setSelectedFilePath('');
    setIsExplainerLoading(false);
    setError(null);
    setIndexingStatus('idle');
    setChunksIndexed(null);
    setIndexingError(null);
    setActiveTab('overview');
  };

  const { files: fileCount, folders: folderCount } = countTreeNodes(fileTree);

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none animate-glow-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-200 to-indigo-300">
                DevLens <span className="text-indigo-400">AI</span>
              </span>
              <span className="block text-[9px] text-zinc-500 font-mono leading-none mt-0.5">Ingestion & Analytics active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAnalyzed && (
              <button
                onClick={handleReset}
                disabled={isExplainerLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 text-xs transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Analyze Another
              </button>
            )}
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* LOADING STATE VIEW */}
        {isLoading && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
              <FolderTree className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Analyzing Repository</h3>
            <p className="text-indigo-400 text-sm font-mono animate-pulse mb-1">{loadingPhase}</p>
            <p className="text-zinc-500 text-xs">
              Calculating imports dependency linkages and processing git commit history for hotspot detection.
            </p>
          </div>
        )}

        {/* HOMEPAGE VIEW (Initial Form) */}
        {!isLoading && !isAnalyzed && (
          <div className="max-w-3xl mx-auto my-12">
            
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-400 font-medium mb-6 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                Phase 1 Complete: AI File Explainer Active
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Inspect Codebases <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">
                  Instantly and Safely
                </span>
              </h1>
              
              <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
                Provide any public GitHub repository. We will clone, parse imports, compute hotspots, and generate structured plain-English file explanations.
              </p>

              {/* Error Alert Box */}
              {error && (
                <div className="mb-6 max-w-xl mx-auto p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-left flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-300 font-semibold text-sm">Analysis Failed</h4>
                    <p className="text-red-400/90 text-xs mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Repository Input Form */}
              <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto mb-8">
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
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    Analyze Repository
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Quick Demo Links */}
              <div className="flex items-center justify-center gap-3 text-xs text-zinc-500">
                <span>Try an example:</span>
                <button 
                  type="button"
                  onClick={() => setRepoUrl('https://github.com/octocat/Spoon-Knife')}
                  className="text-zinc-400 hover:text-indigo-400 transition-colors duration-150 underline decoration-zinc-700 hover:decoration-indigo-500 underline-offset-4"
                >
                  octocat/Spoon-Knife
                </button>
                <span>•</span>
                <button 
                  type="button"
                  onClick={() => setRepoUrl('https://github.com/user-Rishabh/DevLens-AI')}
                  className="text-zinc-400 hover:text-indigo-400 transition-colors duration-150 underline decoration-zinc-700 hover:decoration-indigo-500 underline-offset-4"
                >
                  user-Rishabh/DevLens-AI
                </button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
              <div className="glass-panel p-5 rounded-xl border border-indigo-500/10">
                <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/25 rounded-lg w-fit mb-4">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-zinc-200 font-semibold text-xs mb-2">AI File Explainer</h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Click on any file to immediately review plain-English AI summaries describing its purpose, key classes/exports, and side effects.
                </p>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-indigo-500/10">
                <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/25 rounded-lg w-fit mb-4">
                  <Flame className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-zinc-200 font-semibold text-xs mb-2">Git Hotspots</h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Identifies key codebase files by calculating commit edit frequency logs across history.
                </p>
              </div>
              <div className="glass-panel p-5 rounded-xl border border-indigo-500/10">
                <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/25 rounded-lg w-fit mb-4">
                  <Network className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-zinc-200 font-semibold text-xs mb-2">Imports Mapping</h3>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Tracks internal references between JS, TS, and Python modules. Outputs the edges graph list to the console.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW (Successfully Ingested) */}
        {!isLoading && isAnalyzed && fileTree && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-4">
            
            {/* Sidebar Folder Explorer / Hotspots Tab (Col-4) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="glass-panel p-5 rounded-2xl flex flex-col h-full min-h-[50vh] max-h-[75vh]">
                
                {/* Tab selector */}
                <div className="flex gap-4 mb-4 pb-2 border-b border-zinc-900 select-none">
                  <button 
                    onClick={() => !isExplainerLoading && setSidebarTab('files')}
                    disabled={isExplainerLoading}
                    className={`pb-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      sidebarTab === 'files' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5" />
                      Workspace Files
                    </span>
                  </button>
                  <button 
                    onClick={() => !isExplainerLoading && setSidebarTab('hotspots')}
                    disabled={isExplainerLoading}
                    className={`pb-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      sidebarTab === 'hotspots' 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Git Hotspots
                    </span>
                  </button>
                </div>
                
                {/* Scrollable list content */}
                <div className="flex-1 overflow-hidden relative">
                  {sidebarTab === 'files' ? (
                    <FileTree 
                      tree={fileTree} 
                      onSelectFile={setSelectedFilePath}
                      selectedFilePath={selectedFilePath}
                      disabled={isExplainerLoading}
                    />
                  ) : (
                    <HotspotList hotspots={hotspots} />
                  )}
                  
                  {/* Cooldown overlay message inside the sidebar */}
                  {isExplainerLoading && sidebarTab === 'files' && (
                    <div className="absolute bottom-2 left-2 right-2 bg-indigo-950/80 border border-indigo-500/35 text-[10px] text-indigo-300 font-mono py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg select-none backdrop-blur-sm">
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      Please wait, loading explanation...
                    </div>
                  )}
                </div>

                {/* File Count Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Files className="w-3 h-3 text-zinc-500" />
                    {fileCount} files
                  </span>
                  <span>{folderCount} directories</span>
                </div>
              </div>
            </div>

            {/* Dashboard Workspace Contents (Col-8) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Repository Title Banner */}
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-400 pointer-events-none">
                  <Github className="w-32 h-32" />
                </div>
                
                <span className="text-xs text-indigo-400 font-mono font-medium uppercase tracking-wider">Repository Ingested & Analyzed</span>
                <div className="flex items-center gap-3 mt-1 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">{repoName}</h2>
                  
                  {/* Background Indexing Status Badge */}
                  {indexingStatus === 'indexing' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono rounded-lg animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      Indexing...
                    </div>
                  )}
                  {indexingStatus === 'success' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-lg">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      {chunksIndexed !== null ? `${chunksIndexed} chunks indexed` : 'Indexed'}
                    </div>
                  )}
                  {indexingStatus === 'error' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400 text-[10px] font-mono rounded-lg">
                        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        Indexing failed
                      </div>
                      <button
                        type="button"
                        onClick={() => handleIndex(repoId, true)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono rounded-lg transition-all cursor-pointer shadow-sm active:scale-[0.97]"
                        title={indexingError || 'Retry indexing'}
                      >
                        <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Sanitization, dependency parsing, and git-history calculations complete. We mapped {dependencies.length} internal reference links and evaluated {hotspots.length} hotspots. Click files in the explorer to read their AI summaries.
                </p>
                
                <div className="flex gap-4 mt-4">
                  <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-xs font-mono">
                    Dependency Edges: <span className="text-indigo-400 font-bold">{dependencies.length}</span>
                  </div>
                  <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-xs font-mono">
                    Open Console (F12) to inspect graph
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-900 gap-1.5 select-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'map'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Architecture Map
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('docs')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'docs'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Module Documentation
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                selectedFilePath ? (
                  <FileExplainer 
                    repoId={repoId}
                    filePath={selectedFilePath}
                    onClose={() => !isExplainerLoading && setSelectedFilePath('')}
                    onLoadingStateChange={setIsExplainerLoading}
                  />
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Dashboard Help message */}
                    <div className="p-5 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-center py-12">
                      <div className="max-w-md">
                        <FolderTree className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <h4 className="text-zinc-300 font-semibold text-sm">Select a file to inspect</h4>
                        <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
                          Navigate through the **Workspace Files** directory structure on the left and select any source code file to view its plain-English AI description report.
                        </p>
                      </div>
                    </div>

                    {/* Dashboard Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Interactive Architecture Map Card */}
                      <div className="glass-panel p-5 rounded-xl border border-zinc-900/50 relative overflow-hidden group flex flex-col justify-between">
                        <div>
                          <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg w-fit mb-4">
                            <Network className="w-4 h-4 text-indigo-400" />
                          </div>
                          <h4 className="text-zinc-200 font-semibold text-xs mb-1">Dependency Visualizer</h4>
                          <p className="text-zinc-400 text-[11px] leading-normal mb-4">
                            Import mappings are fully analyzed! Render the interactive 2D architecture map of code relationships.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('map')}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Open Architecture Map <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Semantic Search UI */}
                      <SemanticSearch
                        repoId={repoId}
                        indexingStatus={indexingStatus}
                        chunksIndexed={chunksIndexed}
                        onSelectFile={setSelectedFilePath}
                      />

                    </div>
                  </div>
                )
              )}

              {activeTab === 'map' && (
                <ArchitectureMap
                  repoId={repoId}
                  repoName={repoName}
                  onSelectFile={setSelectedFilePath}
                />
              )}

              {activeTab === 'docs' && (
                <AutoDocs
                  repoId={repoId}
                  repoName={repoName}
                />
              )}

              {/* Console Status Logger */}
              <div className="glass-panel p-4 rounded-xl border border-zinc-900 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <div className="flex-1 text-[11px] font-mono text-zinc-400 truncate">
                  <span className="text-indigo-400">devlens@system:~$</span> parsed {dependencies.length} import connections & tracked {hotspots.length} files
                </div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LOGGED TO CONSOLE
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600 gap-4">
          <p>© 2026 DevLens AI. Analysis Engine online.</p>
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
