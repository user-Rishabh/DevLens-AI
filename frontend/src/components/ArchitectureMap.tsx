import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Network, 
  Zap, 
  Search, 
  Eye, 
  EyeOff, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  GitCommit,
  Check,
  ShieldCheck
} from 'lucide-react';

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
}

export default function ArchitectureMap({ 
  repoId, 
  dependencies = [], 
  selectedFilePath = '', 
  onSelectFile 
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const encodedPath = encodeURIComponent(selectedFilePath);

      try {
        const response = await fetch(`${apiUrl}/api/files/blast-radius?repo_id=${repoId}&file_path=${encodedPath}`);
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

  // Pan and Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-zinc-850 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-zinc-100 font-bold text-sm flex items-center gap-2">
              Architecture & Imports Map
              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono rounded-full">
                {nodes.length} files • {edges.length} connections
              </span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Find node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-200 text-xs pl-8 pr-2 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Blast Radius Toggle */}
          <button
            type="button"
            onClick={() => setShowBlastRadius(!showBlastRadius)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              showBlastRadius
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${showBlastRadius ? 'text-amber-400 fill-amber-400/20' : 'text-zinc-500'}`} />
            Blast Radius Overlay: {showBlastRadius ? 'ON' : 'OFF'}
          </button>

          {/* Reset Zoom/Pan */}
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
            title="Reset Map View"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Map Area */}
      <div 
        className="w-full h-[450px] bg-zinc-950/90 rounded-xl border border-zinc-900 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Floating Map Legend & Stats Box */}
        <div className="absolute top-3 left-3 z-10 glass-panel p-3 rounded-xl border border-zinc-800/80 text-[10px] font-mono text-zinc-300 flex flex-col gap-1.5 backdrop-blur-md shadow-xl max-w-xs">
          <div className="font-bold uppercase tracking-wider text-indigo-400 text-[9px] flex items-center gap-1">
            <Layers className="w-3 h-3" /> Graph Legend
          </div>

          {selectedFilePath ? (
            <div className="flex flex-col gap-1 pt-1 border-t border-zinc-850">
              <div className="truncate text-zinc-200 font-bold">
                Selected: <span className="text-amber-400">{selectedFilePath.split('/').pop()}</span>
              </div>
              {showBlastRadius && (
                <div className="flex flex-col gap-0.5 mt-0.5 text-zinc-400">
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                    Direct Dependents ({blastData.direct.size})
                  </span>
                  <span className="flex items-center gap-1 text-orange-300">
                    <span className="h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500" />
                    Transitive Dependents ({blastData.transitive.size})
                  </span>
                  <span className="flex items-center gap-1 text-zinc-500">
                    <span className="h-2 w-2 rounded-full bg-zinc-700" />
                    Unaffected Modules
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-[10px] leading-tight">
              Click any file node on the map to visualize its import dependency blast radius spatially.
            </p>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 glass-panel p-1 rounded-xl border border-zinc-800 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 rounded-lg cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 rounded-lg cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive SVG Rendering */}
        <svg 
          className="w-full h-full"
          viewBox="0 0 800 500"
        >
          <defs>
            {/* Arrowhead marker for directed dependency edges */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#6366f1" opacity="0.6" />
            </marker>
            <marker
              id="arrowhead-blast"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" opacity="0.9" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. EDGES */}
            {edges.map((edge, idx) => {
              const source = nodeMap[edge.from];
              const target = nodeMap[edge.to];
              if (!source || !target) return null;

              const isSelectedSource = selectedFilePath === edge.to;
              const isDirectEdge = showBlastRadius && isSelectedSource && blastData.direct.has(edge.from);
              const isTransitiveEdge = showBlastRadius && blastData.transitive.has(edge.from);
              
              const isDimmed = showBlastRadius && selectedFilePath && !isDirectEdge && !isTransitiveEdge;

              return (
                <line
                  key={`${edge.from}->${edge.to}-${idx}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={
                    isDirectEdge 
                      ? '#f59e0b' 
                      : isTransitiveEdge 
                        ? '#f97316' 
                        : '#4f46e5'
                  }
                  strokeWidth={isDirectEdge || isTransitiveEdge ? 2.5 : 1}
                  strokeOpacity={isDimmed ? 0.15 : isDirectEdge ? 0.9 : 0.4}
                  strokeDasharray={isTransitiveEdge ? '4 3' : 'none'}
                  markerEnd={isDirectEdge ? 'url(#arrowhead-blast)' : 'url(#arrowhead)'}
                />
              );
            })}

            {/* 2. NODES */}
            {nodes.map((node) => {
              const isSelected = selectedFilePath === node.id;
              const isDirect = showBlastRadius && selectedFilePath && blastData.direct.has(node.id);
              const isTransitive = showBlastRadius && selectedFilePath && blastData.transitive.has(node.id);
              const isMatchesSearch = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());
              
              const isDimmed = showBlastRadius && selectedFilePath && !isSelected && !isDirect && !isTransitive;

              let fillColor = '#18181b'; // zinc-900 default
              let strokeColor = '#3f3f46'; // zinc-700 default
              let textColor = '#a1a1aa';

              if (isSelected) {
                fillColor = '#312e81'; // indigo-900
                strokeColor = '#818cf8'; // indigo-400
                textColor = '#ffffff';
              } else if (isDirect) {
                fillColor = '#451a03'; // amber-950
                strokeColor = '#f59e0b'; // amber-500
                textColor = '#fef3c7';
              } else if (isTransitive) {
                fillColor = '#431407'; // orange-950
                strokeColor = '#f97316'; // orange-500
                textColor = '#ffedd5';
              } else if (isMatchesSearch) {
                strokeColor = '#e0e7ff';
                textColor = '#ffffff';
              }

              return (
                <g 
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectFile) onSelectFile(node.id);
                  }}
                  className="cursor-pointer group"
                  opacity={isDimmed ? 0.25 : 1}
                >
                  {/* Outer glow ring for selected or blast radius target */}
                  {(isSelected || isDirect) && (
                    <circle
                      r={16}
                      fill="none"
                      stroke={isSelected ? '#818cf8' : '#f59e0b'}
                      strokeWidth={2}
                      className="animate-ping opacity-30"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={10 + Math.min(node.inDegree, 6)}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected || isDirect || isTransitive ? 2.5 : 1.5}
                    className="transition-all duration-200 group-hover:scale-125"
                  />

                  {/* Node Label Text */}
                  <text
                    y={22 + Math.min(node.inDegree, 6)}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={isSelected || isDirect ? 11 : 9}
                    fontWeight={isSelected || isDirect ? 'bold' : 'normal'}
                    fontFamily="monospace"
                    className="pointer-events-none select-none drop-shadow-md"
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
