import React from 'react';
import { TransferItem } from '../types';
import { formatFileSize } from '../utils/fileSystem';
import {
  X,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface TransferQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transfers: TransferItem[];
  onClearCompleted: () => void;
}

export const TransferQueueDrawer: React.FC<TransferQueueDrawerProps> = ({
  isOpen,
  onClose,
  transfers,
  onClearCompleted,
}) => {
  if (!isOpen) return null;

  const activeCount = transfers.filter(
    (t) => t.status === 'transferring' || t.status === 'pending'
  ).length;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Transfer Queue</h3>
          <span className="text-xs font-mono text-slate-400">({transfers.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {transfers.some((t) => t.status === 'completed') && (
            <button
              onClick={onClearCompleted}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear Done
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List of transfers */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {transfers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No active or recent copy-paste operations.
          </div>
        ) : (
          transfers.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col gap-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                  <span
                    className={`text-[10px] font-mono px-1 py-0.2 rounded uppercase ${
                      item.action === 'copy'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {item.action}
                  </span>
                  <span className="truncate">{item.sourceFile.name}</span>
                </div>

                <div>
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </span>
                  )}
                  {item.status === 'transferring' && (
                    <span className="text-[11px] font-mono text-amber-400">
                      {item.progress}%
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Failed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Path preview */}
              <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate font-mono">
                <span className="truncate">{item.sourcePath}</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
                <span className="truncate text-slate-300">{item.destPath}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.status === 'completed'
                      ? 'bg-emerald-500'
                      : item.status === 'failed'
                      ? 'bg-rose-500'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{formatFileSize(item.totalBytes)}</span>
                {item.status === 'transferring' && <span>~48 MB/s (Shizuku IPC)</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-xs font-mono text-slate-400 flex items-center justify-between">
        <span>Active jobs: {activeCount}</span>
        <span>UID 2000 IPC Buffer</span>
      </div>
    </div>
  );
};
