import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileCode, 
  FileJson, 
  FileText, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';

export interface FileTreeNodeType {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNodeType[];
}

interface FileTreeProps {
  tree: FileTreeNodeType;
  onSelectFile?: (path: string) => void;
  selectedFilePath?: string;
}

// Helper to determine the appropriate icon for a file extension
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'py':
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-4 h-4 text-pink-400 shrink-0" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
}

interface TreeNodeProps {
  node: FileTreeNodeType;
  depth: number;
  onSelectFile?: (path: string) => void;
  selectedFilePath?: string;
}

function TreeNode({ node, depth = 0, onSelectFile, selectedFilePath }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0); // Expand root by default
  const isFolder = node.type === 'folder';
  const isSelected = !isFolder && selectedFilePath === node.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      if (onSelectFile) {
        onSelectFile(node.path);
      }
    }
  };

  return (
    <div className="select-none font-mono text-xs">
      {/* Node Header Row */}
      <div 
        onClick={handleClick}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 ${
          isSelected 
            ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-300 font-semibold' 
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {/* Toggle Arrow for folders */}
        {isFolder ? (
          <span className="text-zinc-600 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        ) : (
          <span className="w-3" /> // Spacer for alignment
        )}

        {/* Node Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500/80 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-indigo-500/80 shrink-0" />
          )
        ) : (
          getFileIcon(node.name)
        )}

        {/* Node Name */}
        <span className="truncate">{node.name}</span>
      </div>

      {/* Children Recursion */}
      {isFolder && isExpanded && node.children && (
        <div className="mt-0.5">
          {node.children.map((child, idx) => (
            <TreeNode 
              key={`${child.path}-${idx}`} 
              node={child} 
              depth={depth + 1} 
              onSelectFile={onSelectFile}
              selectedFilePath={selectedFilePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ tree, onSelectFile, selectedFilePath }: FileTreeProps) {
  if (!tree || !tree.name) {
    return (
      <div className="text-zinc-500 text-xs italic p-4">
        No directory structure found.
      </div>
    );
  }

  return (
    <div className="w-full h-full max-h-[68vh] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <TreeNode 
        node={tree} 
        depth={0} 
        onSelectFile={onSelectFile}
        selectedFilePath={selectedFilePath}
      />
    </div>
  );
}
