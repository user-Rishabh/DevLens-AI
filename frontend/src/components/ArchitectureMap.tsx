import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Network, 
  Zap, 
  Search, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  Files,
  ChevronRight
} from 'lucide-react';
import { API_BASE_URL } from '../lib/apiClient';

interface Edge {
  from: string;
  to: string;
}

interface Node {
  id: string;
  label: string;
  directory: string;
  x: number;
  y: number;
  inDegree: number;
  outDegree: number;
}

interface ArchitectureMapProps {
  repoId: string;
  dependencies: Edge[];
  selectedFilePath?: string;
  onSelectFile?: (filePath: string) => void;
  onViewSummary?: (filePath: string) => void;
}

export default function ArchitectureMap({ 
  repoId, 
  dependencies = [], 
  selectedFilePath = '', 
  onSelectFile,
  onViewSummary
}: ArchitectureMapProps) {
  const [showBlastRadius, setShowBlastRadius] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [blastData, setBlastData] = useState<{
    direct: Set<string>;
    transitive: Set<string>;
    total: number;
  }>({
    direct: new Set(),
    transitive: new Set(),
    total: 0
  });

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasDragged, setHasDragged] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Extract unique files as nodes and layout them in a force-directed grid/circle
  const { nodes, nodeMap, edges } = useMemo(() => {
    const uniqueFiles = new Set<string>();
    const inDegreeMap: Record<string, number> = {};
    const outDegreeMap: Record<string, number> = {};

    dependencies.forEach(edge => {
      if (edge.from && edge.to) {
        uniqueFiles.add(edge.from);
        uniqueFiles.add(edge.to);
        outDegreeMap[edge.from] = (outDegreeMap[edge.from] || 0) + 1;
        inDegreeMap[edge.to] = (inDegreeMap[edge.to] || 0) + 1;
      }
    });

    const fileList = Array.from(uniqueFiles);
    const total = fileList.length;
    const cols = Math.ceil(Math.sqrt(total));
    const width = 800;
    const height = 500;
    const padding = 80;

    const nodeMapLocal: Record<string, Node> = {};
    const nodesLocal: Node[] = fileList.map((file, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = padding + (col * (width - 2 * padding)) / Math.max(1, cols - 1);
      const y = padding + (row * (height - 2 * padding)) / Math.max(1, Math.ceil(total / cols) - 1);

      const nodeObj: Node = {
        id: file,
        label: file.split('/').pop() || file,
        directory: file.substring(0, file.lastIndexOf('/')),
        x: isNaN(x) ? width / 2 : x,
        y: isNaN(y) ? height / 2 : y,
        inDegree: inDegreeMap[file] || 0,
        outDegree: outDegreeMap[file] || 0
      };
      nodeMapLocal[file] = nodeObj;
      return nodeObj;
    });

    return { nodes: nodesLocal, nodeMap: nodeMapLocal, edges: dependencies };
  }, [dependencies]);

  // 2. Fetch blast radius data when selected file or dependencies change
  useEffect(() => {
    if (!selectedFilePath || !repoId) {
      setBlastData({ direct: new Set(), transitive: new Set(), total: 0 });
      return;
    }

    const fetchBlastData = async () => {
      const encodedPath = encodeURIComponent(selectedFilePath);

      try {
        const response = await fetch(`${API_BASE_URL}/api/files/blast-radius?repo_id=${repoId}&file_path=${encodedPath}`);
        if (response.ok) {
          const data = await response.json();
          const directSet = new Set<string>(data.direct_dependents || []);
          const transitiveSet = new Set<string>(
            (data.transitive_dependents || []).map((t: any) => t.file_path)
          );

          setBlastData({
            direct: directSet,
            transitive: transitiveSet,
            total: data.total_affected_count || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch blast radius for graph visualization:', err);
      }
    };

    fetchBlastData();
  }, [repoId, selectedFilePath]);

  // Extract outgoing links (files this node imports) and incoming links (files importing this node)
  const { outgoingLinks, incomingLinks, transitiveLinks } = useMemo(() => {
    if (!selectedFilePath) {
      return { outgoingLinks: [], incomingLinks: [], transitiveLinks: [] };
    }

    // Files that selectedFilePath imports (outgoing dependencies)
    const outgoing = dependencies
      .filter(e => e.from === selectedFilePath)
      .map(e => e.to);

    // Files that import selectedFilePath (incoming dependents)
    const incoming = dependencies
      .filter(e => e.to === selectedFilePath)
      .map(e => e.from);

    // Transitive impact from blast radius
    const transitive = Array.from(blastData.transitive).filter(
      path => path !== selectedFilePath && !incoming.includes(path)
    );

    return {
      outgoingLinks: Array.from(new Set(outgoing)),
      incomingLinks: Array.from(new Set(incoming)),
      transitiveLinks: transitive
    };
  }, [selectedFilePath, dependencies, blastData]);

  const outgoingSet = useMemo(() => new Set(outgoingLinks), [outgoingLinks]);
  const incomingSet = useMemo(() => new Set(incomingLinks), [incomingLinks]);

  // Pan and Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = Math.abs(e.clientX - (dragStart.x + pan.x));
    const dy = Math.abs(e.clientY - (dragStart.y + pan.y));
    if (dx > 4 || dy > 4) {
      setHasDragged(true);
    }
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = () => {
    // If clicking empty canvas without dragging, deselect node
    if (!hasDragged && selectedFilePath && onSelectFile) {
      onSelectFile('');
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="bg-white border border-[#E5E1DA] p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden shadow-xs">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E1DA] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#E85D2C]/10 border border-[#E85D2C]/20 rounded-xl text-[#E85D2C]">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[#1A1D29] font-bold text-sm flex items-center gap-2">
              Architecture & Imports Map
              <span className="px-2 py-0.5 bg-[#FAFAF7] text-[#6B7280] border border-[#E5E1DA] text-[10px] font-mono rounded-full">
                {nodes.length} files • {edges.length} connections
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Find node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAF7] border border-[#E5E1DA] text-[#1A1D29] placeholder-[#6B7280] text-xs pl-8 pr-2 py-1.5 rounded-lg focus:outline-none focus:border-[#E85D2C] focus:bg-white font-mono"
            />
          </div>

          {/* Blast Radius Toggle */}
          <button
            type="button"
            onClick={() => setShowBlastRadius(!showBlastRadius)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              showBlastRadius
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                : 'bg-white border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${showBlastRadius ? 'text-amber-600 fill-amber-500/20' : 'text-[#6B7280]'}`} />
            Impact View: {showBlastRadius ? 'ON' : 'OFF'}
          </button>

          {/* Reset Zoom/Pan */}
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 bg-white hover:bg-[#FAFAF7] border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:text-[#1A1D29] transition-all cursor-pointer"
            title="Reset Map View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Area */}
      <div 
        className="w-full h-[520px] lg:h-[580px] bg-[#FAFAF7] rounded-xl border border-[#E5E1DA] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Floating Map Legend & Stats Box (Top Left) */}
        <div 
          className="absolute top-3 left-3 z-10 bg-white/95 border border-[#E5E1DA] p-2.5 rounded-xl text-[10px] font-mono text-[#1A1D29] flex flex-col gap-1.5 backdrop-blur-md shadow-md max-w-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-bold uppercase tracking-wider text-[#E85D2C] text-[9px] flex items-center gap-1">
            <Layers className="w-3 h-3" /> Graph Legend
          </div>

          <div className="flex flex-col gap-1 pt-1 border-t border-[#E5E1DA]">
            {selectedFilePath ? (
              <>
                <div className="flex items-center gap-1.5 text-[#E85D2C] font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[#E85D2C] shrink-0" />
                  Active: <span className="truncate max-w-[130px]">{selectedFilePath.split('/').pop()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-[#4F46E5] shrink-0" />
                  Imports / Uses ({outgoingLinks.length})
                </div>
                <div className="flex items-center gap-1.5 text-amber-800">
                  <span className="h-2 w-2 rounded-full bg-[#D97706] shrink-0" />
                  Imported By ({incomingLinks.length})
                </div>
                {showBlastRadius && transitiveLinks.length > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-800">
                    <span className="h-2 w-2 rounded-full bg-[#EA580C] shrink-0" />
                    Transitive Impact ({transitiveLinks.length})
                  </div>
                )}
              </>
            ) : (
              <p className="text-[#6B7280] text-[10px] leading-tight">
                Click any file node to inspect all its incoming and outgoing links without leaving this page.
              </p>
            )}
          </div>
        </div>

        {/* Zoom Controls (Bottom Left) */}
        <div 
          className="absolute bottom-3 left-3 z-10 flex gap-1.5 bg-white/95 p-1 rounded-xl border border-[#E5E1DA] backdrop-blur-md shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}
            className="p-1.5 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#FAFAF7] rounded-lg cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
            className="p-1.5 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#FAFAF7] rounded-lg cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#FAFAF7] rounded-lg cursor-pointer"
            title="Reset Pan & Zoom"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Node Connections Inspector Drawer (Right Side Overlay) */}
        {selectedFilePath && (
          <div 
            className="absolute top-3 right-3 bottom-3 w-80 max-w-[calc(100%-24px)] bg-white/95 border border-[#E5E1DA] rounded-xl shadow-xl z-20 flex flex-col overflow-hidden backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inspector Header */}
            <div className="p-3 border-b border-[#E5E1DA] bg-[#FAFAF7]/80 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1D29]">
                  <FileText className="w-3.5 h-3.5 text-[#E85D2C] shrink-0" />
                  <span className="truncate font-mono">{selectedFilePath.split('/').pop()}</span>
                </div>
                <div className="text-[10px] text-[#6B7280] font-mono truncate mt-0.5" title={selectedFilePath}>
                  {selectedFilePath}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectFile && onSelectFile('')}
                className="p-1 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#E5E1DA]/50 rounded-lg transition-colors cursor-pointer"
                title="Deselect node"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Summary Redirect */}
            {onViewSummary && (
              <div className="p-2.5 bg-white border-b border-[#E5E1DA]">
                <button
                  type="button"
                  onClick={() => onViewSummary(selectedFilePath)}
                  className="w-full py-1.5 px-2.5 bg-[#E85D2C]/10 hover:bg-[#E85D2C]/15 border border-[#E85D2C]/30 text-[#E85D2C] rounded-lg text-xs font-mono font-semibold flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Files className="w-3.5 h-3.5" />
                    Open in Summary Tab
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAFAF7]/50 border-b border-[#E5E1DA] text-[10px] font-mono">
              <div className="bg-white p-2 rounded-lg border border-[#E5E1DA]/80">
                <div className="text-[#6B7280]">Total Links</div>
                <div className="text-sm font-bold text-[#1A1D29]">
                  {outgoingLinks.length + incomingLinks.length}
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#E5E1DA]/80">
                <div className="text-[#6B7280]">Blast Impact</div>
                <div className="text-sm font-bold text-amber-700">
                  {blastData.total} {blastData.total === 1 ? 'file' : 'files'}
                </div>
              </div>
            </div>

            {/* Scrollable Links Breakdown */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs font-mono">
              {/* 1. Imports / Dependencies (Outgoing) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-[#4F46E5]" />
                    Imports ({outgoingLinks.length})
                  </span>
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider">Dependencies</span>
                </div>

                {outgoingLinks.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] italic bg-[#FAFAF7] border border-[#E5E1DA] rounded-lg p-2">
                    Does not import any project files
                  </p>
                ) : (
                  <div className="space-y-1">
                    {outgoingLinks.map(path => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => onSelectFile && onSelectFile(path)}
                        className="w-full text-left p-1.5 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200/60 rounded-lg text-indigo-900 transition-colors flex items-center justify-between group cursor-pointer"
                        title={path}
                      >
                        <span className="truncate text-[11px] font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] shrink-0" />
                          {path.split('/').pop()}
                        </span>
                        <span className="text-[9px] text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          Focus
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Imported By / Dependents (Incoming) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3 text-[#D97706]" />
                    Imported By ({incomingLinks.length})
                  </span>
                  <span className="text-[9px] text-[#6B7280] uppercase tracking-wider">Dependents</span>
                </div>

                {incomingLinks.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] italic bg-[#FAFAF7] border border-[#E5E1DA] rounded-lg p-2">
                    Not imported by any project files (Entry point / Leaf)
                  </p>
                ) : (
                  <div className="space-y-1">
                    {incomingLinks.map(path => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => onSelectFile && onSelectFile(path)}
                        className="w-full text-left p-1.5 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/60 rounded-lg text-amber-900 transition-colors flex items-center justify-between group cursor-pointer"
                        title={path}
                      >
                        <span className="truncate text-[11px] font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />
                          {path.split('/').pop()}
                        </span>
                        <span className="text-[9px] text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          Focus
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Transitive Blast Impact (if active) */}
              {showBlastRadius && transitiveLinks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-orange-950 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#EA580C]" />
                      Transitive Impact ({transitiveLinks.length})
                    </span>
                    <span className="text-[9px] text-[#6B7280] uppercase tracking-wider">Blast Radius</span>
                  </div>

                  <div className="space-y-1">
                    {transitiveLinks.map(path => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => onSelectFile && onSelectFile(path)}
                        className="w-full text-left p-1.5 bg-orange-50/60 hover:bg-orange-100/70 border border-orange-200/60 rounded-lg text-orange-900 transition-colors flex items-center justify-between group cursor-pointer"
                        title={path}
                      >
                        <span className="truncate text-[11px] font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0" />
                          {path.split('/').pop()}
                        </span>
                        <span className="text-[9px] text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          Focus
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactive SVG Rendering */}
        <svg 
          className="w-full h-full"
          viewBox="0 0 800 500"
        >
          <defs>
            {/* Standard edge marker */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#C5BFB6" opacity="0.8" />
            </marker>

            {/* Outgoing links marker (Selected imports Target) */}
            <marker
              id="arrowhead-outgoing"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#4F46E5" opacity="0.95" />
            </marker>

            {/* Incoming links marker (Source imports Selected) */}
            <marker
              id="arrowhead-incoming"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#D97706" opacity="0.95" />
            </marker>

            {/* Transitive blast marker */}
            <marker
              id="arrowhead-transitive"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#EA580C" opacity="0.9" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. EDGES */}
            {edges.map((edge, idx) => {
              const source = nodeMap[edge.from];
              const target = nodeMap[edge.to];
              if (!source || !target) return null;

              const isOutgoingEdge = selectedFilePath === edge.from;
              const isIncomingEdge = selectedFilePath === edge.to;
              const isTransitiveEdge = showBlastRadius && blastData.transitive.has(edge.from);
              
              const isRelated = isOutgoingEdge || isIncomingEdge || isTransitiveEdge;
              const isDimmed = !!selectedFilePath && !isRelated;

              let stroke = '#D1CDC7';
              let strokeWidth = 1.2;
              let strokeOpacity = isDimmed ? 0.15 : 0.6;
              let strokeDasharray = 'none';
              let markerEnd = 'url(#arrowhead)';

              if (isOutgoingEdge) {
                stroke = '#4F46E5'; // Indigo for outgoing (imports)
                strokeWidth = 2.5;
                strokeOpacity = 0.95;
                markerEnd = 'url(#arrowhead-outgoing)';
              } else if (isIncomingEdge) {
                stroke = '#D97706'; // Amber for incoming (dependents)
                strokeWidth = 2.5;
                strokeOpacity = 0.95;
                markerEnd = 'url(#arrowhead-incoming)';
              } else if (isTransitiveEdge) {
                stroke = '#EA580C'; // Orange for transitive
                strokeWidth = 2;
                strokeOpacity = 0.85;
                strokeDasharray = '4 3';
                markerEnd = 'url(#arrowhead-transitive)';
              }

              return (
                <line
                  key={`${edge.from}->${edge.to}-${idx}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeDasharray={strokeDasharray}
                  markerEnd={markerEnd}
                />
              );
            })}

            {/* 2. NODES */}
            {nodes.map((node) => {
              const isSelected = selectedFilePath === node.id;
              const isOutgoing = outgoingSet.has(node.id);
              const isIncoming = incomingSet.has(node.id);
              const isTransitive = showBlastRadius && blastData.transitive.has(node.id) && !isIncoming;
              const isMatchesSearch = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
              
              const isRelated = isSelected || isOutgoing || isIncoming || isTransitive;
              const isDimmed = !!selectedFilePath && !isRelated;

              let fillColor = '#FFFFFF';
              let strokeColor = node.inDegree > 3 ? '#1A1D29' : '#C5BFB6';
              let textColor = '#1A1D29';

              if (isSelected) {
                fillColor = '#E85D2C';
                strokeColor = '#FFFFFF';
                textColor = '#E85D2C';
              } else if (isIncoming) {
                fillColor = '#FEF3C7'; // amber-100
                strokeColor = '#D97706'; // amber-600
                textColor = '#92400E';
              } else if (isOutgoing) {
                fillColor = '#EEF2FF'; // indigo-100
                strokeColor = '#4F46E5'; // indigo-600
                textColor = '#3730A3';
              } else if (isTransitive) {
                fillColor = '#FFEDD5'; // orange-100
                strokeColor = '#EA580C'; // orange-600
                textColor = '#9A3412';
              } else if (isMatchesSearch) {
                strokeColor = '#E85D2C';
                fillColor = '#FFF7ED';
                textColor = '#C2410C';
              }

              return (
                <g 
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectFile) {
                      onSelectFile(isSelected ? '' : node.id);
                    }
                  }}
                  className="cursor-pointer group"
                  opacity={isDimmed ? 0.3 : 1}
                >
                  {/* Outer glow ring for selected or direct connections */}
                  {isSelected && (
                    <circle
                      r={20}
                      fill="none"
                      stroke="#E85D2C"
                      strokeWidth={2.5}
                      className="animate-ping opacity-30"
                    />
                  )}
                  {(isIncoming || isOutgoing) && (
                    <circle
                      r={16 + Math.min(node.inDegree, 6)}
                      fill="none"
                      stroke={isIncoming ? '#D97706' : '#4F46E5'}
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      className="opacity-60"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={10 + Math.min(node.inDegree, 6)}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected || isIncoming || isOutgoing || isTransitive ? 2.5 : 1.5}
                    className="transition-all duration-200 group-hover:scale-125 shadow-sm"
                  />

                  {/* Node Label Text */}
                  <text
                    y={22 + Math.min(node.inDegree, 6)}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={isSelected || isIncoming || isOutgoing ? 11 : 9}
                    fontWeight={isSelected || isIncoming || isOutgoing ? 'bold' : 'normal'}
                    fontFamily="monospace"
                    className="pointer-events-none select-none font-medium"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
