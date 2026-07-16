import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertCircle, Eye, EyeOff, Loader2, FileCode2, Flame, RefreshCw } from 'lucide-react';
import FileExplainer from './FileExplainer';

// 1. Custom File Node Component
const FileNode = memo(({ data }: any) => {
  const { label, folder, isHotspot, commitCount, isSelected } = data;
  
  return (
    <div className={`px-4 py-3 rounded-xl border text-xs shadow-xl transition-all duration-200 min-w-[200px] select-none ${
      isSelected 
        ? 'bg-indigo-950/90 border-indigo-500 text-indigo-100 shadow-indigo-500/30 scale-105' 
        : isHotspot
          ? 'bg-zinc-900 border-red-500/50 text-zinc-100 shadow-red-500/5 hover:border-red-500 hover:shadow-red-500/15'
          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850'
    }`}>
      {/* Input Handle (left side) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: isSelected ? '#818cf8' : '#4f46e5', width: 6, height: 6 }} 
      />
      
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg shrink-0 ${
          isHotspot 
            ? 'bg-red-500/10 text-red-400' 
            : isSelected
              ? 'bg-indigo-500/10 text-indigo-400'
              : 'bg-zinc-800 text-zinc-400'
        }`}>
          {isHotspot ? <Flame className="w-3.5 h-3.5 animate-pulse" /> : <FileCode2 className="w-3.5 h-3.5" />}
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate text-white">{label}</p>
          {folder ? (
            <p className="text-[9px] text-zinc-500 truncate font-mono mt-0.5">{folder}/</p>
          ) : (
            <p className="text-[9px] text-zinc-600 truncate font-mono mt-0.5">root</p>
          )}
        </div>
        
        {commitCount > 0 && (
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
            isHotspot 
              ? 'bg-red-500/20 text-red-300' 
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {commitCount}
          </span>
        )}
      </div>

      {/* Output Handle (right side) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: isSelected ? '#818cf8' : '#4f46e5', width: 6, height: 6 }} 
      />
    </div>
  );
});

// Map custom node types
const nodeTypes = { fileNode: FileNode };

interface ArchitectureMapProps {
  repoId: string;
  repoName: string;
  onSelectFile?: (path: string) => void;
}

export default function ArchitectureMap({ repoId, repoName, onSelectFile }: ArchitectureMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rawData, setRawData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Large repo state
  const [isFiltered, setIsFiltered] = useState(true);
  const [hasLargeRepo, setHasLargeRepo] = useState(false);
  
  // Selected file inside the map
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // 2. Fetch Graph Data
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedPath(null);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      console.log(`[DevLens AI] Fetching dependency graph for repo: ${repoId}`);
      const response = await fetch(`${apiUrl}/api/repos/${repoId}/graph`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch dependency graph.');
      }
      
      setRawData(data);
      setHasLargeRepo(data.nodes.length > 80);
      setIsFiltered(data.nodes.length > 80);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading the dependency graph.');
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    if (repoId) {
      fetchGraph();
    }
  }, [repoId, fetchGraph]);

  // 3. Layout Algorithm
  const applyLayout = useCallback((rawNodes: any[], rawEdges: any[], filterActive: boolean, selectedId: string | null) => {
    let processedNodes = [...rawNodes];
    let processedEdges = [...rawEdges];
    
    // Perform top-N filtering for large repos
    if (filterActive && rawNodes.length > 80) {
      const nodeDegrees: { [key: string]: number } = {};
      rawNodes.forEach(n => { nodeDegrees[n.id] = 0; });
      
      rawEdges.forEach(edge => {
        if (nodeDegrees[edge.source] !== undefined) nodeDegrees[edge.source]++;
        if (nodeDegrees[edge.target] !== undefined) nodeDegrees[edge.target]++;
      });
      
      const sortedByDegree = [...rawNodes].sort((a, b) => (nodeDegrees[b.id] || 0) - (nodeDegrees[a.id] || 0));
      const topNodes = sortedByDegree.slice(0, 80);
      const topNodeIds = new Set(topNodes.map(n => n.id));
      
      processedNodes = topNodes;
      processedEdges = rawEdges.filter(edge => topNodeIds.has(edge.source) && topNodeIds.has(edge.target));
    }

    // Group into columns by folder
    const folderGroups: { [key: string]: any[] } = {};
    processedNodes.forEach(node => {
      const folder = node.folder || 'Root';
      if (!folderGroups[folder]) {
        folderGroups[folder] = [];
      }
      folderGroups[folder].push(node);
    });

    // Sort folders alphabetically (Root first)
    const sortedFolders = Object.keys(folderGroups).sort((a, b) => {
      if (a === 'Root') return -1;
      if (b === 'Root') return 1;
      return a.localeCompare(b);
    });

    const COL_WIDTH = 340;
    const ROW_HEIGHT = 80;

    // Compute layout coordinates
    const layoutedNodes = processedNodes.map(node => {
      const folder = node.folder || 'Root';
      const colIndex = sortedFolders.indexOf(folder);
      const rowIndex = folderGroups[folder].indexOf(node);
      
      // Slight vertical stagger on odd columns to improve visual alignment
      const x = colIndex * COL_WIDTH;
      const y = rowIndex * ROW_HEIGHT + (colIndex % 2 === 0 ? 0 : ROW_HEIGHT / 2);
      
      return {
        id: node.id,
        type: 'fileNode',
        position: { x, y },
        data: {
          label: node.label,
          folder: node.folder,
          isHotspot: node.is_hotspot,
          commitCount: node.commit_count,
          isSelected: node.id === selectedId
        }
      };
    });

    // Format edges with styles and direction markers
    const layoutedEdges = processedEdges.map((edge, idx) => {
      const isRelatedToSelected = selectedId && (edge.source === selectedId || edge.target === selectedId);
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: !!isRelatedToSelected,
        style: { 
          stroke: isRelatedToSelected ? '#818cf8' : '#3f3f46', 
          strokeWidth: isRelatedToSelected ? 2.5 : 1.5, 
          opacity: isRelatedToSelected ? 0.9 : 0.4 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: isRelatedToSelected ? '#818cf8' : '#3f3f46',
        },
      };
    });

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [setNodes, setEdges]);

  // Apply layout when rawData, isFiltered, or selectedPath changes
  useEffect(() => {
    if (rawData.nodes.length > 0) {
      applyLayout(rawData.nodes, rawData.edges, isFiltered, selectedPath);
    }
  }, [rawData, isFiltered, selectedPath, applyLayout]);

  // Handle Node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedPath(node.id);
    if (onSelectFile) {
      onSelectFile(node.id);
    }
  }, [onSelectFile]);

  // Format statistics
  const totalFiles = rawData.nodes.length;
  const renderedFiles = nodes.length;
  const totalEdges = rawData.edges.length;
  const renderedEdges = edges.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[600px] min-h-[500px]">
      
      {/* 1. Canvas Section */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden relative border border-zinc-900">
        
        {/* Top Control Bar */}
        <div className="bg-zinc-950/60 backdrop-blur-md px-4 py-3 border-b border-zinc-900 flex justify-between items-center gap-4 z-20 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-indigo-400 font-mono font-semibold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25">
              Interactive Map
            </span>
            <span className="text-zinc-400 text-xs truncate max-w-[200px] sm:max-w-none">
              {repoName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
            <span>Files: <strong>{renderedFiles}/{totalFiles}</strong></span>
            <span>Dependencies: <strong>{renderedEdges}/{totalEdges}</strong></span>
            
            {hasLargeRepo && (
              <button
                type="button"
                onClick={() => setIsFiltered(!isFiltered)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm"
              >
                {isFiltered ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-amber-500" />}
                {isFiltered ? "Show All Files" : "Apply Filter"}
              </button>
            )}
          </div>
        </div>

        {/* Large Repo warning banner */}
        {hasLargeRepo && isFiltered && (
          <div className="absolute top-12 left-4 right-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10.5px] px-3 py-2 rounded-xl flex items-center justify-between gap-3 z-20 shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Large repository detected:</strong> Showing top 80 most-connected files to prevent visual clutter.
              </span>
            </div>
            <button
              onClick={() => setIsFiltered(false)}
              className="text-amber-300 hover:text-white font-bold underline cursor-pointer shrink-0"
            >
              Show all anyway
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/80 z-30 flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-200 text-sm font-semibold">Analyzing database mapping...</p>
            <p className="text-zinc-500 text-xs mt-1 font-mono">Querying cached dependency tree</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 bg-zinc-950/90 z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-red-300 font-semibold text-sm">Failed to Load Graph Map</h4>
            <p className="text-red-400/90 text-xs mt-2 max-w-sm leading-relaxed">{error}</p>
            <button 
              onClick={fetchGraph}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1 w-full pt-12">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Background color="#18181b" gap={20} size={1} />
            <Controls className="!bg-zinc-900 !border-zinc-800 !text-white [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-400 hover:[&>button]:!text-white" />
            <MiniMap 
              style={{ background: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }}
              nodeColor={(n) => {
                if (n.id === selectedPath) return '#6366f1';
                if (n.data?.isHotspot) return '#ef4444';
                return '#27272a';
              }}
              maskColor="rgba(9, 9, 11, 0.7)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* 2. Side-by-side Explanation Panel */}
      <div className={`w-full lg:w-96 flex flex-col transition-all duration-300 shrink-0 ${
        selectedPath ? 'block animate-fade-in' : 'hidden'
      }`}>
        {selectedPath && (
          <FileExplainer
            repoId={repoId}
            filePath={selectedPath}
            onClose={() => setSelectedPath(null)}
          />
        )}
      </div>

    </div>
  );
}
