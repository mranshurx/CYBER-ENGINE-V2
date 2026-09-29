import React, { useState } from 'react';
import { VFile } from '../types';
import { formatFileSize } from '../utils/fileSystem';
import {
  Folder,
  File,
  FileCode,
  FileArchive,
  FileText,
  Lock,
  Download,
  Trash2,
  Edit3,
  Copy,
  Scissors,
  Eye,
  KeyRound,
  CheckSquare,
  Square,
  Search,
  FolderPlus,
  Upload,
} from 'lucide-react';

interface FileListViewProps {
  files: VFile[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenItem: (item: VFile) => void;
  onCopyItem: (item: VFile) => void;
  onCutItem: (item: VFile) => void;
  onDeleteItem: (item: VFile) => void;
  onRenameItem: (item: VFile) => void;
  onChmodItem: (item: VFile) => void;
  onInspectItem: (item: VFile) => void;
  onDownloadItem: (item: VFile) => void;
  onNewFolder: () => void;
  onUploadFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentPath: string;
}

export const FileListView: React.FC<FileListViewProps> = ({
  files,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onOpenItem,
  onCopyItem,
  onCutItem,
  onDeleteItem,
  onRenameItem,
  onChmodItem,
  onInspectItem,
  onDownloadItem,
  onNewFolder,
  onUploadFiles,
  currentPath,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    let res = 0;
    if (sortBy === 'name') {
      res = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortBy === 'size') {
      res = a.size - b.size;
    } else if (sortBy === 'date') {
      res = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortAsc ? res : -res;
  });

  const getFileIcon = (file: VFile) => {
    if (file.type === 'directory') {
      return <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['zip', 'rar', '7z', 'tar', 'gz', 'obb', 'mcworld', 'mcpack'].includes(ext || '')) {
      return <FileArchive className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (['json', 'js', 'ts', 'cfg', 'ini', 'sh', 'dex', 'xml'].includes(ext || '')) {
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (['txt', 'log', 'md'].includes(ext || '')) {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const handleSort = (type: 'name' | 'size' | 'date') => {
    if (sortBy === type) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(type);
      setSortAsc(true);
    }
  };

  const allSelected = sorted.length > 0 && sorted.every((f) => selectedIds.has(f.id));

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800/80 rounded-lg overflow-hidden">
      {/* Search & Actions Bar inside Pane */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter items..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-900/90 border border-slate-700/60 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            title={allSelected ? 'Deselect all' : 'Select all'}
            className="p-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onNewFolder}
            title="Create New Folder (mkdir)"
            className="px-2 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <label
            title="Stage real file into this directory"
            className="cursor-pointer px-2 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Upload</span>
            <input
              type="file"
              multiple
              onChange={onUploadFiles}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/60 text-[11px] font-medium text-slate-400 select-none">
        <div
          onClick={() => handleSort('name')}
          className="col-span-7 sm:col-span-6 flex items-center gap-1.5 cursor-pointer hover:text-slate-200"
        >
          <span>Name</span>
          {sortBy === 'name' && (
            <span className="text-emerald-400 font-mono">{sortAsc ? '▲' : '▼'}</span>
          )}
        </div>
        <div
          onClick={() => handleSort('size')}
          className="col-span-3 sm:col-span-2 text-right cursor-pointer hover:text-slate-200"
        >
          <span>Size</span>
          {sortBy === 'size' && (
            <span className="text-emerald-400 font-mono ml-0.5">{sortAsc ? '▲' : '▼'}</span>
          )}
        </div>
        <div className="hidden sm:block sm:col-span-2 text-center">
          <span>Permissions</span>
        </div>
        <div className="col-span-2 text-right">
          <span>Actions</span>
        </div>
      </div>

      {/* Files List View */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[560px] divide-y divide-slate-800/40">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full">
            <Folder className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400">Directory is empty</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Create a subfolder or stage files using the buttons above.
            </p>
          </div>
        ) : (
          sorted.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  onToggleSelect(item.id, e.shiftKey);
                }}
                onDoubleClick={() => onOpenItem(item)}
                className={`grid grid-cols-12 gap-2 px-3 py-1.5 items-center text-xs transition-colors cursor-pointer group select-none ${
                  isSelected
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-slate-100'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                {/* Column 1: Checkbox + Icon + Name */}
                <div className="col-span-7 sm:col-span-6 flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(item.id, false);
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer"
                  />

                  {getFileIcon(item)}

                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      title={item.name}
                      className="truncate font-medium text-slate-200 group-hover:text-emerald-300"
                    >
                      {item.name}
                    </span>

                    {item.isProtected && (
                      <span
                        title="Protected Scoped Storage path. Managed via Shizuku binder IPC."
                        className="inline-flex items-center text-[10px] text-amber-400 font-mono shrink-0"
                      >
                        <Lock className="w-3 h-3 ml-0.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Column 2: Size */}
                <div className="col-span-3 sm:col-span-2 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                  {item.type === 'directory' ? '<DIR>' : formatFileSize(item.size)}
                </div>

                {/* Column 3: Permissions (drwxrwx---) */}
                <div className="hidden sm:block sm:col-span-2 text-center font-mono text-[11px] text-slate-400">
                  {item.permissions}
                </div>

                {/* Column 4: Quick Action Icons */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectItem(item);
                    }}
                    title="Inspect file content or info"
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyItem(item);
                    }}
                    title="Copy (Shizuku cp)"
                    className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCutItem(item);
                    }}
                    title="Cut (Shizuku mv)"
                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameItem(item);
                    }}
                    title="Rename"
                    className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChmodItem(item);
                    }}
                    title="Change Permissions (chmod)"
                    className="p-1 text-slate-400 hover:text-purple-400 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadItem(item);
                    }}
                    title="Export / Download to device"
                    className="p-1 text-slate-400 hover:text-teal-400 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item);
                    }}
                    title="Delete (rm -rf)"
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer bar showing item count and path info */}
      <div className="px-3 py-1 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div>
          <span>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
          {selectedIds.size > 0 && (
            <span className="text-emerald-400 ml-2">({selectedIds.size} selected)</span>
          )}
        </div>
        <div className="truncate max-w-[200px]" title={currentPath}>
          {currentPath}
        </div>
      </div>
    </div>
  );
};
