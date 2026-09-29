import React from 'react';
import { ShizukuState } from '../types';
import { ShieldCheck, ShieldAlert, Terminal, Layers, BookOpen, Usb, ArrowRightLeft } from 'lucide-react';

interface TopBarProps {
  currentTab: 'explorer' | 'batch' | 'terminal' | 'guide' | 'adbridge';
  onSelectTab: (tab: 'explorer' | 'batch' | 'terminal' | 'guide' | 'adbridge') => void;
  shizukuState: ShizukuState;
  onToggleShizuku: () => void;
  pendingTransfersCount: number;
  onOpenTransfers: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  shizukuState,
  onToggleShizuku,
  pendingTransfersCount,
  onOpenTransfers,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm shadow-inner">
            SZ
          </div>
          <span className="font-['Cabinet_Grotesk'] text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            Shizuku File Hub
          </span>
        </div>

        {/* Zone 2: Navigation Links (Text with active underlines) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => onSelectTab('explorer')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentTab === 'explorer'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Dual Explorer</span>
          </button>

          <button
            onClick={() => onSelectTab('batch')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentTab === 'batch'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Batch Tasks</span>
          </button>

          <button
            onClick={() => onSelectTab('terminal')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentTab === 'terminal'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Rish Console</span>
          </button>

          <button
            onClick={() => onSelectTab('adbridge')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentTab === 'adbridge'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span>WebADB Bridge</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              currentTab === 'guide'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Setup Guide</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Shizuku Status */}
        <div className="flex items-center gap-2.5">
          {pendingTransfersCount > 0 && (
            <button
              onClick={onOpenTransfers}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{pendingTransfersCount} transfers</span>
            </button>
          )}

          <button
            onClick={onToggleShizuku}
            title={shizukuState.isAuthorized ? 'Click to toggle Shizuku simulation state' : 'Click to authorize Shizuku'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 ${
              shizukuState.isAuthorized && shizukuState.serviceStatus === 'running'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
            }`}
          >
            {shizukuState.isAuthorized && shizukuState.serviceStatus === 'running' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono">Shizuku UID {shizukuState.uid} Active</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-mono">Shizuku Paused</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
