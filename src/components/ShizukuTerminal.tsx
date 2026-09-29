import React, { useState, useRef, useEffect } from 'react';
import { ShizukuState, CommandLog } from '../types';
import { executeShizukuShell, generateTermuxScript, generateAdbPcScript } from '../utils/shizukuCommands';
import {
  Terminal,
  Play,
  Trash2,
  Copy,
  Download,
  Check,
  ShieldCheck,
  ShieldAlert,
  Code2,
} from 'lucide-react';

interface ShizukuTerminalProps {
  shizukuState: ShizukuState;
  logs: CommandLog[];
  onAddLog: (log: CommandLog) => void;
  onClearLogs: () => void;
}

export const ShizukuTerminal: React.FC<ShizukuTerminalProps> = ({
  shizukuState,
  logs,
  onAddLog,
  onClearLogs,
}) => {
  const [inputCommand, setInputCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || inputCommand).trim();
    if (!cmd || isExecuting) return;

    setIsExecuting(true);
    const result = await executeShizukuShell(cmd, shizukuState);

    const newLog: CommandLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      command: cmd,
      output: result.stderr ? result.stderr : result.stdout,
      exitCode: result.exitCode,
      isShizuku: cmd.includes('rish') || cmd.startsWith('cp') || cmd.startsWith('mv') || cmd.startsWith('rm'),
    };

    onAddLog(newLog);
    setIsExecuting(false);
    if (!cmdToRun) setInputCommand('');
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(key);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleDownloadSh = () => {
    const sampleScript = generateTermuxScript(
      '/storage/emulated/0/Download/Active.sav',
      '/storage/emulated/0/Android/data/com.pubg.imobile/files/'
    );
    const blob = new Blob([sampleScript], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shizuku_copy_paste.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Terminal Header & Quick Buttons */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Shizuku `rish` Command Console</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Environment: Android /system/bin/sh</span>
              <span>·</span>
              <span className={shizukuState.isAuthorized ? 'text-emerald-400' : 'text-rose-400'}>
                UID {shizukuState.uid} ({shizukuState.isAuthorized ? 'Privileged' : 'Unauthorized'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              handleCopyText(
                generateTermuxScript(
                  '/storage/emulated/0/Download/*',
                  '/storage/emulated/0/Android/data/<package>/'
                ),
                'termux'
              )
            }
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
          >
            {copiedScript === 'termux' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Copy Termux Script</span>
          </button>

          <button
            onClick={handleDownloadSh}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Download .sh</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-700/60 rounded transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Quick Commands */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-mono text-[11px]">Presets:</span>
        <button
          onClick={() => handleRunCommand('rish -c "id"')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700/50"
        >
          Check UID (id)
        </button>
        <button
          onClick={() => handleRunCommand('rish -c "ls -la /storage/emulated/0/Android/data"')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700/50"
        >
          ls -la /Android/data
        </button>
        <button
          onClick={() => handleRunCommand('rish -c "ls -la /storage/emulated/0/Android/obb"')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700/50"
        >
          ls -la /Android/obb
        </button>
        <button
          onClick={() => handleRunCommand('df -h')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700/50"
        >
          Disk Usage (df -h)
        </button>
        <button
          onClick={() => handleRunCommand('rish -c "chmod -R 775 /storage/emulated/0/Android/data"')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700/50"
        >
          Fix Permissions (chmod 775)
        </button>
      </div>

      {/* Terminal Screen */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs flex flex-col min-h-[420px] max-h-[580px] shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="text-slate-500 pb-3 border-b border-slate-900 leading-relaxed select-none">
          <div className="text-emerald-400 font-semibold">
            Rikka Shizuku IPC Shell Client (rish v13.5.4)
          </div>
          <div>Service status: active | UID {shizukuState.uid} ({shizukuState.uid === 0 ? 'root' : 'shell'})</div>
          <div>Bypassing Android 11+ Scoped Storage (/Android/data &amp; /Android/obb)</div>
        </div>

        {/* Output Logs */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-500 font-bold">$</span>
                <span className="text-slate-200 font-semibold">{log.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto tabular-nums">{log.timestamp}</span>
              </div>
              <pre
                className={`whitespace-pre-wrap pl-4 text-[11px] leading-relaxed ${
                  log.exitCode === 0 ? 'text-slate-300' : 'text-rose-400'
                }`}
              >
                {log.output}
              </pre>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand();
          }}
          className="pt-2 border-t border-slate-900 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-bold select-none">$</span>
          <input
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            placeholder="Type Shizuku command (e.g. rish -c 'cp -rf /sdcard/Download/file.obb /sdcard/Android/obb/com.game/')..."
            className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-0 text-xs font-mono"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputCommand.trim() || isExecuting}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
              inputCommand.trim() && !isExecuting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Exec</span>
          </button>
        </form>
      </div>
    </div>
  );
};
