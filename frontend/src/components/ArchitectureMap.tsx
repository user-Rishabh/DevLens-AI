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
        className="w-full h-[450px] bg-[#FAFAF7] rounded-xl border border-[#E5E1DA] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Floating Map Legend & Stats Box */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 border border-[#E5E1DA] p-3 rounded-xl text-[10px] font-mono text-[#1A1D29] flex flex-col gap-1.5 backdrop-blur-md shadow-md max-w-xs">
          <div className="font-bold uppercase tracking-wider text-[#E85D2C] text-[9px] flex items-center gap-1">
            <Layers className="w-3 h-3" /> Graph Legend
          </div>

          {selectedFilePath ? (
            <div className="flex flex-col gap-1 pt-1 border-t border-[#E5E1DA]">
              <div className="truncate text-[#1A1D29] font-bold">
                Selected: <span className="text-[#E85D2C]">{selectedFilePath.split('/').pop()}</span>
              </div>
              {showBlastRadius && (
                <div className="flex flex-col gap-0.5 mt-0.5 text-[#6B7280]">
                  <span className="flex items-center gap-1 text-amber-800">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-400" />
                    Direct Dependents ({blastData.direct.size})
                  </span>
                  <span className="flex items-center gap-1 text-orange-800">
                    <span className="h-2 w-2 rounded-full bg-[#E85D2C] shadow-sm shadow-orange-500" />
                    Transitive Dependents ({blastData.transitive.size})
                  </span>
                  <span className="flex items-center gap-1 text-[#6B7280]">
                    <span className="h-2 w-2 rounded-full bg-[#D1CDC7]" />
                    Unaffected Modules
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#6B7280] text-[10px] leading-tight">
              Click any file node on the map to visualize its import dependency blast radius spatially.
            </p>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 bg-white/95 p-1 rounded-xl border border-[#E5E1DA] backdrop-blur-md shadow-md">
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))}
            className="p-1.5 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#FAFAF7] rounded-lg cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
            className="p-1.5 text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#FAFAF7] rounded-lg cursor-pointer"
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
              <polygon points="0 0, 8 3, 0 6" fill="#C5BFB6" opacity="0.8" />
            </marker>
            <marker
              id="arrowhead-blast"
              markerWidth="8"
              markerHeight="6"
              refX="16"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#E85D2C" opacity="0.9" />
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
                      ? '#D97706' 
                      : isTransitiveEdge 
                        ? '#E85D2C' 
                        : '#D1CDC7'
                  }
                  strokeWidth={isDirectEdge || isTransitiveEdge ? 2.5 : 1.2}
                  strokeOpacity={isDimmed ? 0.2 : isDirectEdge ? 0.95 : 0.7}
                  strokeDasharray={isTransitiveEdge ? '4 3' : 'none'}
                  markerEnd={isDirectEdge || isTransitiveEdge ? 'url(#arrowhead-blast)' : 'url(#arrowhead)'}
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

              let fillColor = '#FFFFFF';
              let strokeColor = node.inDegree > 3 ? '#1A1D29' : '#C5BFB6';
              let textColor = '#1A1D29';

              if (isSelected) {
                fillColor = '#E85D2C';
                strokeColor = '#FFFFFF';
                textColor = '#E85D2C';
              } else if (isDirect) {
                fillColor = '#FEF3C7'; // amber-100
                strokeColor = '#D97706'; // amber-600
                textColor = '#92400E';
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
                    if (onSelectFile) onSelectFile(node.id);
                  }}
                  className="cursor-pointer group"
                  opacity={isDimmed ? 0.3 : 1}
                >
                  {/* Outer glow ring for selected or blast radius target */}
                  {(isSelected || isDirect) && (
                    <circle
                      r={18}
                      fill="none"
                      stroke={isSelected ? '#E85D2C' : '#D97706'}
                      strokeWidth={2}
                      className="animate-ping opacity-25"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={10 + Math.min(node.inDegree, 6)}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected || isDirect || isTransitive ? 2.5 : 1.5}
                    className="transition-all duration-200 group-hover:scale-125 shadow-sm"
                  />

                  {/* Node Label Text */}
                  <text
                    y={22 + Math.min(node.inDegree, 6)}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={isSelected || isDirect ? 11 : 9}
                    fontWeight={isSelected || isDirect ? 'bold' : 'normal'}
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
