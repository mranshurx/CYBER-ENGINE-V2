import React, { useState } from 'react';
import { VFile, ShizukuState, ClipboardState, ConflictResolution } from '../types';
import { vfs } from '../utils/fileSystem';
import { generateRishCopyCommand, generateRishMoveCommand } from '../utils/shizukuCommands';
import { FileListView } from './FileListView';
import {
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  ChevronRight,
  FolderUp,
  RotateCcw,
  ClipboardPaste,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Copy,
  Scissors,
  CheckCircle,
} from 'lucide-react';

interface DualPaneExplorerProps {
  shizukuState: ShizukuState;
  onQueueTransfer: (
    sourceFiles: VFile[],
    destDir: string,
    action: 'copy' | 'move',
    conflict: ConflictResolution
  ) => void;
  onInspectFile: (file: VFile) => void;
  onDownloadFile: (file: VFile) => void;
  onLogCommand: (cmd: string, out: string, exitCode: number) => void;
}

const PRESET_BOOKMARKS = [
  { label: 'Internal Storage', path: '/storage/emulated/0', icon: 'sd' },
  { label: 'Download', path: '/storage/emulated/0/Download', icon: 'dl' },
  { label: 'Android / data (Protected)', path: '/storage/emulated/0/Android/data', icon: 'prot' },
  { label: 'Android / obb (Protected)', path: '/storage/emulated/0/Android/obb', icon: 'prot' },
  { label: 'data / local / tmp (Rish)', path: '/data/local/tmp', icon: 'tmp' },
  { label: 'Documents', path: '/storage/emulated/0/Documents', icon: 'doc' },
];

export const DualPaneExplorer: React.FC<DualPaneExplorerProps> = ({
  shizukuState,
  onQueueTransfer,
  onInspectFile,
  onDownloadFile,
  onLogCommand,
}) => {
  // Left pane path & selection
  const [leftPath, setLeftPath] = useState('/storage/emulated/0/Download');
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set());

  // Right pane path & selection
  const [rightPath, setRightPath] = useState('/storage/emulated/0/Android/data');
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set());

  // Clipboard state
  const [clipboard, setClipboard] = useState<ClipboardState>({
    items: [],
    action: null,
    sourceDir: '',
  });

  // Conflict resolution strategy
  const [conflictPolicy, setConflictPolicy] = useState<ConflictResolution>('overwrite');

  // Input dialog states
  const [modalType, setModalType] = useState<
    'newFolder' | 'rename' | 'chmod' | null
  >(null);
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');
  const [targetItem, setTargetItem] = useState<VFile | null>(null);
  const [inputText, setInputText] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Get directory contents
  const leftFiles = vfs.listDirectory(leftPath);
  const rightFiles = vfs.listDirectory(rightPath);

  // Selection helpers
  const handleToggleSelect = (pane: 'left' | 'right', id: string) => {
    const current = pane === 'left' ? leftSelected : rightSelected;
    const setter = pane === 'left' ? setLeftSelected : setRightSelected;
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setter(next);
  };

  const handleSelectAll = (pane: 'left' | 'right') => {
    const files = pane === 'left' ? leftFiles : rightFiles;
    const setter = pane === 'left' ? setLeftSelected : setRightSelected;
    setter(new Set(files.map((f) => f.id)));
  };

  const handleClearSelection = (pane: 'left' | 'right') => {
    const setter = pane === 'left' ? setLeftSelected : setRightSelected;
    setter(new Set());
  };

  // Navigation helpers
  const navigateTo = (pane: 'left' | 'right', newPath: string) => {
    const normalized = vfs.normalizePath(newPath);
    if (pane === 'left') {
      setLeftPath(normalized);
      setLeftSelected(new Set());
    } else {
      setRightPath(normalized);
      setRightSelected(new Set());
    }
  };

  const navigateUp = (pane: 'left' | 'right') => {
    const current = pane === 'left' ? leftPath : rightPath;
    const parent = vfs.getParentPath(current);
    navigateTo(pane, parent);
  };

  const handleOpenItem = (pane: 'left' | 'right', item: VFile) => {
    if (item.type === 'directory') {
      navigateTo(pane, item.path);
    } else {
      onInspectFile(item);
    }
  };

  // Swap panes
  const handleSwapPanes = () => {
    const tempPath = leftPath;
    setLeftPath(rightPath);
    setRightPath(tempPath);
    setLeftSelected(new Set());
    setRightSelected(new Set());
  };

  // Direct transfer between panes
  const handleTransferLeftToRight = (action: 'copy' | 'move') => {
    if (leftSelected.size === 0) {
      showToast('Please select at least one item from the left pane.');
      return;
    }
    const selectedItems = leftFiles.filter((f) => leftSelected.has(f.id));
    onQueueTransfer(selectedItems, rightPath, action, conflictPolicy);

    // Generate command log for visibility
    const firstItem = selectedItems[0];
    const logCmd =
      action === 'copy'
        ? generateRishCopyCommand(firstItem.path, rightPath)
        : generateRishMoveCommand(firstItem.path, rightPath);
    onLogCommand(
      logCmd,
      `[Shizuku rish UID ${shizukuState.uid}] Enqueued ${selectedItems.length} item(s) to '${rightPath}'`,
      0
    );

    setLeftSelected(new Set());
    showToast(`${action === 'copy' ? 'Copied' : 'Moved'} ${selectedItems.length} item(s) to ${rightPath}`);
  };

  const handleTransferRightToLeft = (action: 'copy' | 'move') => {
    if (rightSelected.size === 0) {
      showToast('Please select at least one item from the right pane.');
      return;
    }
    const selectedItems = rightFiles.filter((f) => rightSelected.has(f.id));
    onQueueTransfer(selectedItems, leftPath, action, conflictPolicy);

    const firstItem = selectedItems[0];
    const logCmd =
      action === 'copy'
        ? generateRishCopyCommand(firstItem.path, leftPath)
        : generateRishMoveCommand(firstItem.path, leftPath);
    onLogCommand(
      logCmd,
      `[Shizuku rish UID ${shizukuState.uid}] Enqueued ${selectedItems.length} item(s) to '${leftPath}'`,
      0
    );

    setRightSelected(new Set());
    showToast(`${action === 'copy' ? 'Copied' : 'Moved'} ${selectedItems.length} item(s) to ${leftPath}`);
  };

  // Clipboard operations (Copy, Cut, Paste)
  const handleSetClipboard = (item: VFile, action: 'copy' | 'cut') => {
    setClipboard({
      items: [item],
      action,
      sourceDir: vfs.getParentPath(item.path),
    });
    showToast(`${action === 'copy' ? 'Copied' : 'Cut'} '${item.name}' to clipboard`);
  };

  const handlePasteClipboard = (targetDir: string) => {
    if (clipboard.items.length === 0 || !clipboard.action) return;
    onQueueTransfer(
      clipboard.items,
      targetDir,
      clipboard.action === 'cut' ? 'move' : 'copy',
      conflictPolicy
    );

    const logCmd =
      clipboard.action === 'copy'
        ? generateRishCopyCommand(clipboard.items[0].path, targetDir)
        : generateRishMoveCommand(clipboard.items[0].path, targetDir);

    onLogCommand(
      logCmd,
      `[Shizuku rish UID ${shizukuState.uid}] Pasted ${clipboard.items.length} item(s) into '${targetDir}'`,
      0
    );

    showToast(`Pasted ${clipboard.items.length} item(s) into ${targetDir}`);
    if (clipboard.action === 'cut') {
      setClipboard({ items: [], action: null, sourceDir: '' });
    }
  };

  // Upload handler
  const handleUploadFiles = (pane: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const targetDir = pane === 'left' ? leftPath : rightPath;

    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === 'string' ? reader.result : '';
        try {
          vfs.createFile(targetDir, f.name, content, f.size);
          showToast(`Uploaded '${f.name}' to ${targetDir}`);
        } catch (err: unknown) {
          const errM = err instanceof Error ? err.message : String(err);
          showToast(`Error: ${errM}`);
        }
      };
      if (f.name.endsWith('.txt') || f.name.endsWith('.json') || f.name.endsWith('.cfg') || f.name.endsWith('.ini')) {
        reader.readAsText(f);
      } else {
        reader.readAsDataURL(f);
      }
    });
    e.target.value = '';
  };

  // Modal actions (New Folder, Rename, Chmod)
  const openNewFolderModal = (pane: 'left' | 'right') => {
    setActivePane(pane);
    setModalType('newFolder');
    setInputText('New_Folder');
  };

  const openRenameModal = (item: VFile) => {
    setTargetItem(item);
    setModalType('rename');
    setInputText(item.name);
  };

  const openChmodModal = (item: VFile) => {
    setTargetItem(item);
    setModalType('chmod');
    setInputText(item.permissions);
  };

  const handleConfirmModal = () => {
    if (!inputText.trim()) return;
    try {
      if (modalType === 'newFolder') {
        const parent = activePane === 'left' ? leftPath : rightPath;
        vfs.createDirectory(parent, inputText.trim());
        showToast(`Created folder '${inputText.trim()}'`);
        onLogCommand(
          `rish -c "mkdir -p '${parent}/${inputText.trim()}'"`,
          `Directory created.`,
          0
        );
      } else if (modalType === 'rename' && targetItem) {
        vfs.renameItem(targetItem.path, inputText.trim());
        showToast(`Renamed to '${inputText.trim()}'`);
        onLogCommand(
          `rish -c "mv '${targetItem.path}' '${vfs.getParentPath(targetItem.path)}/${inputText.trim()}'"`,
          `Item renamed.`,
          0
        );
      } else if (modalType === 'chmod' && targetItem) {
        vfs.chmodItem(targetItem.path, inputText.trim());
        showToast(`Permissions updated to '${inputText.trim()}'`);
        onLogCommand(
          `rish -c "chmod ${inputText.trim()} '${targetItem.path}'"`,
          `Permissions updated.`,
          0
        );
      }
    } catch (err: unknown) {
      const errM = err instanceof Error ? err.message : String(err);
      showToast(`Error: ${errM}`);
    }
    setModalType(null);
    setTargetItem(null);
  };

  const handleDeleteItem = (item: VFile) => {
    if (window.confirm(`Are you sure you want to delete '${item.name}'? (Shizuku: rm -rf)`)) {
      vfs.deleteItem(item.path);
      showToast(`Deleted '${item.name}'`);
      onLogCommand(`rish -c "rm -rf '${item.path}'"`, `Deleted successfully.`, 0);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Notice Toast */}
      {feedbackNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Control Bar: Bookmarks & Conflict Policy */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Quick Paths:
          </span>
          {PRESET_BOOKMARKS.map((bm) => (
            <button
              key={bm.path}
              onClick={() => {
                // If left is closer or right is protected, send to right if protected
                if (bm.path.includes('Android/')) {
                  navigateTo('right', bm.path);
                  showToast(`Opened ${bm.label} in Right Pane`);
                } else {
                  navigateTo('left', bm.path);
                  showToast(`Opened ${bm.label} in Left Pane`);
                }
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded transition-colors whitespace-nowrap"
            >
              {bm.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Conflict Policy:</span>
            <select
              value={conflictPolicy}
              onChange={(e) => setConflictPolicy(e.target.value as ConflictResolution)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="overwrite">Overwrite existing</option>
              <option value="skip">Skip duplicates</option>
              <option value="rename">Auto-rename (copy_1)</option>
            </select>
          </div>

          <button
            onClick={handleSwapPanes}
            title="Swap Left and Right Panes"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Clipboard Bar if active */}
      {clipboard.items.length > 0 && (
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            {clipboard.action === 'copy' ? (
              <Copy className="w-4 h-4 text-emerald-400" />
            ) : (
              <Scissors className="w-4 h-4 text-amber-400" />
            )}
            <span>
              <strong>{clipboard.items.length}</strong> item ready to{' '}
              {clipboard.action === 'copy' ? 'copy' : 'move'}:{' '}
              <span className="font-mono text-slate-300">{clipboard.items[0].name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePasteClipboard(leftPath)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paste in Left</span>
            </button>
            <button
              onClick={() => handlePasteClipboard(rightPath)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-white" />
              <span>Paste in Right</span>
            </button>
            <button
              onClick={() => setClipboard({ items: [], action: null, sourceDir: '' })}
              className="px-2 py-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Dual-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Pane (Source/Origin) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          {/* Path Header */}
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                onClick={() => navigateUp('left')}
                title="Go to parent directory"
                className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded transition-colors"
              >
                <FolderUp className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 text-xs font-mono text-slate-300 truncate flex-1 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 shrink-0">L:</span>
                <span className="truncate">{leftPath}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {vfs.isProtectedPath(leftPath) ? (
                <span
                  title="Protected Android Scoped Storage directory. Shizuku active."
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Scoped</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  Standard
                </span>
              )}
            </div>
          </div>

          {/* Left File List */}
          <FileListView
            files={leftFiles}
            selectedIds={leftSelected}
            onToggleSelect={(id) => handleToggleSelect('left', id)}
            onSelectAll={() => handleSelectAll('left')}
            onClearSelection={() => handleClearSelection('left')}
            onOpenItem={(item) => handleOpenItem('left', item)}
            onCopyItem={(item) => handleSetClipboard(item, 'copy')}
            onCutItem={(item) => handleSetClipboard(item, 'cut')}
            onDeleteItem={handleDeleteItem}
            onRenameItem={openRenameModal}
            onChmodItem={openChmodModal}
            onInspectItem={onInspectFile}
            onDownloadItem={onDownloadFile}
            onNewFolder={() => openNewFolderModal('left')}
            onUploadFiles={(e) => handleUploadFiles('left', e)}
            currentPath={leftPath}
          />
        </div>

        {/* Center Transfer Bridge & Actions */}
        <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-2.5 p-3 bg-slate-900/40 border border-slate-800 rounded-lg lg:my-auto">
          <div className="text-center hidden lg:block mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Shizuku Bridge
            </span>
          </div>

          <button
            onClick={() => handleTransferLeftToRight('copy')}
            disabled={leftSelected.size === 0}
            className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              leftSelected.size > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <span>Copy to Right</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            onClick={() => handleTransferLeftToRight('move')}
            disabled={leftSelected.size === 0}
            className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              leftSelected.size > 0
                ? 'bg-amber-600/90 hover:bg-amber-500 text-white'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <span>Move to Right</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>

          <div className="w-full h-px bg-slate-800 my-1 hidden lg:block" />

          <button
            onClick={() => handleTransferRightToLeft('copy')}
            disabled={rightSelected.size === 0}
            className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              rightSelected.size > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Copy to Left</span>
          </button>

          <button
            onClick={() => handleTransferRightToLeft('move')}
            disabled={rightSelected.size === 0}
            className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              rightSelected.size > 0
                ? 'bg-amber-600/90 hover:bg-amber-500 text-white'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Move to Left</span>
          </button>
        </div>

        {/* Right Pane (Destination/Protected Target) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          {/* Path Header */}
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                onClick={() => navigateUp('right')}
                title="Go to parent directory"
                className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800/80 border border-slate-700/80 rounded transition-colors"
              >
                <FolderUp className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 text-xs font-mono text-slate-300 truncate flex-1 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 shrink-0">R:</span>
                <span className="truncate">{rightPath}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {vfs.isProtectedPath(rightPath) ? (
                <span
                  title="Protected Android Scoped Storage directory. Shizuku active."
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Scoped</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  Standard
                </span>
              )}
            </div>
          </div>

          {/* Right File List */}
          <FileListView
            files={rightFiles}
            selectedIds={rightSelected}
            onToggleSelect={(id) => handleToggleSelect('right', id)}
            onSelectAll={() => handleSelectAll('right')}
            onClearSelection={() => handleClearSelection('right')}
            onOpenItem={(item) => handleOpenItem('right', item)}
            onCopyItem={(item) => handleSetClipboard(item, 'copy')}
            onCutItem={(item) => handleSetClipboard(item, 'cut')}
            onDeleteItem={handleDeleteItem}
            onRenameItem={openRenameModal}
            onChmodItem={openChmodModal}
            onInspectItem={onInspectFile}
            onDownloadItem={onDownloadFile}
            onNewFolder={() => openNewFolderModal('right')}
            onUploadFiles={(e) => handleUploadFiles('right', e)}
            currentPath={rightPath}
          />
        </div>
      </div>

      {/* Modal for New Folder, Rename, Chmod */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="font-semibold text-white text-sm">
              {modalType === 'newFolder' && 'Create New Directory'}
              {modalType === 'rename' && `Rename '${targetItem?.name}'`}
              {modalType === 'chmod' && `Modify Permissions for '${targetItem?.name}'`}
            </h3>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                {modalType === 'newFolder' && 'Directory Name:'}
                {modalType === 'rename' && 'New Name:'}
                {modalType === 'chmod' && 'Permission String (e.g. -rwxrwxrwx or 775):'}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmModal()}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/80 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setModalType(null);
                  setTargetItem(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModal}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
