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
  disabled?: boolean;
  qualityScores?: Record<string, number>;
}

// Helper to determine the appropriate icon for a file extension
function getFileIcon(fileName: string, isDisabled: boolean) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const colorClass = isDisabled ? 'text-[#6B7280]/40 shrink-0' : 'shrink-0';
  
  switch (ext) {
    case 'py':
      return <FileCode className={`w-4 h-4 ${isDisabled ? colorClass : 'text-emerald-600 shrink-0'}`} />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode className={`w-4 h-4 ${isDisabled ? colorClass : 'text-indigo-600 shrink-0'}`} />;
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return <FileJson className={`w-4 h-4 ${isDisabled ? colorClass : 'text-amber-600 shrink-0'}`} />;
    case 'md':
    case 'txt':
      return <FileText className={`w-4 h-4 ${isDisabled ? colorClass : 'text-sky-600 shrink-0'}`} />;
    case 'css':
    case 'scss':
      return <FileCode className={`w-4 h-4 ${isDisabled ? colorClass : 'text-pink-600 shrink-0'}`} />;
    case 'html':
      return <FileCode className={`w-4 h-4 ${isDisabled ? colorClass : 'text-[#E85D2C] shrink-0'}`} />;
    default:
      return <File className={`w-4 h-4 ${isDisabled ? colorClass : 'text-[#6B7280] shrink-0'}`} />;
  }
}

interface TreeNodeProps {
  node: FileTreeNodeType;
  depth: number;
  onSelectFile?: (path: string) => void;
  selectedFilePath?: string;
  disabled?: boolean;
  qualityScores?: Record<string, number>;
}

function TreeNode({ node, depth = 0, onSelectFile, selectedFilePath, disabled, qualityScores }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0); // Expand root by default
  const isFolder = node.type === 'folder';
  const isSelected = !isFolder && selectedFilePath === node.path;
  
  // Disable files from click events, but allow expanding/collapsing folder trees
  const isItemDisabled = !isFolder && disabled;

  const score = !isFolder && qualityScores ? qualityScores[node.path] : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      if (isItemDisabled) {
        return; // Ignore clicks while loading
      }
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
            ? 'bg-[#E85D2C]/10 border-l-2 border-[#E85D2C] text-[#E85D2C] font-semibold' 
            : isItemDisabled
              ? 'text-[#6B7280]/40 cursor-not-allowed border-l-2 border-transparent'
              : 'text-[#1A1D29] hover:text-[#1A1D29] hover:bg-[#FAFAF7] border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {/* Toggle Arrow for folders */}
        {isFolder ? (
          <span className="text-[#6B7280] shrink-0">
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
            <FolderOpen className="w-3.5 h-3.5 text-[#3B5FE0] shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-[#3B5FE0] shrink-0" />
          )
        ) : (
          getFileIcon(node.name, !!isItemDisabled)
        )}

        {/* Node Name */}
        <span className="truncate">{node.name}</span>

        {/* Quality Score Badge */}
        {!isFolder && score !== undefined && (
          <span 
            title={`Quality Health Score: ${score}/100`}
            className={`ml-auto shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
              score >= 80 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : score >= 50 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {score}
          </span>
        )}
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
              disabled={disabled}
              qualityScores={qualityScores}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ tree, onSelectFile, selectedFilePath, disabled, qualityScores }: FileTreeProps) {
  if (!tree || !tree.name) {
    return (
      <div className="text-[#6B7280] text-xs italic p-4">
        No directory structure found.
      </div>
    );
  }

  return (
    <div className="w-full h-full max-h-[68vh] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-[#E5E1DA] scrollbar-track-transparent">
      <TreeNode 
        node={tree} 
        depth={0} 
        onSelectFile={onSelectFile} 
        selectedFilePath={selectedFilePath}
        disabled={disabled}
        qualityScores={qualityScores}
      />
    </div>
  );
}
