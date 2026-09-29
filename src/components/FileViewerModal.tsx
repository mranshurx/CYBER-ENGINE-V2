import React, { useState } from 'react';
import { VFile } from '../types';
import { formatFileSize } from '../utils/fileSystem';
import { X, Copy, Download, Check, FileText, Info, ShieldAlert } from 'lucide-react';

interface FileViewerModalProps {
  file: VFile | null;
  onClose: () => void;
  onDownload: (file: VFile) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const handleCopy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isTextual =
    file.name.endsWith('.txt') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.cfg') ||
    file.name.endsWith('.ini') ||
    file.name.endsWith('.sh') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.xml');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{file.name}</h3>
              <p className="text-[11px] font-mono text-slate-400 truncate">{file.path}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTextual && file.content && (
              <button
                onClick={handleCopy}
                className="p-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded transition-colors flex items-center gap-1"
                title="Copy contents"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              onClick={() => onDownload(file)}
              className="p-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded transition-colors"
              title="Download to device"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Metadata Overview */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500">Size:</span>{' '}
            <span className="text-slate-200 tabular-nums">{formatFileSize(file.size)}</span>
          </div>
          <div>
            <span className="text-slate-500">Mode:</span>{' '}
            <span className="text-slate-200">{file.permissions}</span>
          </div>
          <div>
            <span className="text-slate-500">Owner:</span>{' '}
            <span className="text-slate-200">{file.owner}:{file.group}</span>
          </div>
          <div>
            <span className="text-slate-500">Scoped:</span>{' '}
            <span className={file.isProtected ? 'text-amber-400' : 'text-slate-400'}>
              {file.isProtected ? 'Yes (Shizuku)' : 'No'}
            </span>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300">
          {file.type === 'directory' ? (
            <div className="py-8 text-center text-slate-500">
              This is a directory. Double click it in the explorer pane to view its children.
            </div>
          ) : isTextual && file.content ? (
            <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px] text-emerald-300/90">
              {file.content}
            </pre>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs">
                Binary or packaged asset. Previewing file header bytes:
              </div>
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div>00000000: 50 4B 03 04 14 00 00 00 08 00 5A 8E 7F 56 3B A1  PK........Z..V;.</div>
                <div>00000010: 7C 89 2A 04 00 00 8F 12 00 00 12 00 00 00 61 73  |.*...........as</div>
                <div>00000020: 73 65 74 73 2F 62 69 6E 2F 44 61 74 61 2F 73 68  sets/bin/Data/sh</div>
                <div>00000030: 61 72 65 64 61 73 73 65 74 73 30 2E 61 73 73 65  aredassets0.asse</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
