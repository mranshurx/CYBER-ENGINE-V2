import React, { useState, useEffect } from 'react';
import { HARDCODED_TARGET_PATH } from './where-to-copy';
import targetPathRaw from './where-to-copy/target_path.txt?raw';
import { vfs } from './utils/fileSystem';
import {
  Zap,
  Check,
  RefreshCw,
  AlertCircle,
  Key,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  LogOut,
} from 'lucide-react';

const KEY_URL =
  'https://raw.githubusercontent.com/mranshurx/CYBER-ENGINE-V2/refs/heads/main/key.txt';

// Eagerly glob all files placed in the anshu-on-top folder
const codeFilesGlob = import.meta.glob('./anshu-on-top/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export default function App() {
  // Authorization states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authKeyInput, setAuthKeyInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState<boolean>(false);

  // Activation & status states
  const [status, setStatus] = useState<'idle' | 'pasting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Target path from where-to-copy
  const targetPath = (HARDCODED_TARGET_PATH || targetPathRaw || '').trim();

  // Extract all files from anshu-on-top (ignoring .gitkeep)
  const getAnshuFiles = () => {
    const list: { relPath: string; content: string }[] = [];
    for (const [rawKey, content] of Object.entries(codeFilesGlob)) {
      const relPath = rawKey.replace(/^\.\/anshu-on-top\//, '');
      if (relPath && relPath !== '.gitkeep') {
        list.push({ relPath, content: content as string });
      }
    }
    return list;
  };

  // Check saved key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('cyber_engine_auth_key');
    if (savedKey) {
      setAuthKeyInput(savedKey);
      verifyKeyAgainstGithub(savedKey, true);
    } else {
      setIsInitialCheckDone(true);
    }
  }, []);

  // Fetch and verify key from GitHub repository
  const verifyKeyAgainstGithub = async (keyToTest: string, isSilent = false) => {
    const trimmedInput = keyToTest.trim();
    if (!trimmedInput) {
      if (!isSilent) setAuthError('Please enter an authorization key.');
      setIsInitialCheckDone(true);
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      // Cache-busting query to ensure freshest key from GitHub
      const res = await fetch(`${KEY_URL}?t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch key from GitHub`);
      }

      const remoteRaw = await res.text();
      // Parse valid keys (supports single key, multi-line, or comma-separated)
      const validKeys = remoteRaw
        .split(/[\r\n,]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const isValid = validKeys.some(
        (valid) => valid.toLowerCase() === trimmedInput.toLowerCase()
      );

      if (isValid) {
        localStorage.setItem('cyber_engine_auth_key', trimmedInput);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setIsAuthenticated(false);
        setAuthError('Access Denied: Invalid key. Please check key.txt on GitHub.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Fallback: If offline or rate-limited but matches previously verified key
      const savedKey = localStorage.getItem('cyber_engine_auth_key');
      if (savedKey && savedKey.toLowerCase() === trimmedInput.toLowerCase()) {
        setIsAuthenticated(true);
      } else {
        setAuthError(`Verification failed: ${msg}. Check network or GitHub URL.`);
      }
    } finally {
      setIsVerifying(false);
      setIsInitialCheckDone(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cyber_engine_auth_key');
    setIsAuthenticated(false);
    setAuthKeyInput('');
    setAuthError(null);
    setStatus('idle');
  };

  // Main ACTIVATE Click Handler
  const handleActivate = async () => {
    if (status === 'pasting') return;

    setStatus('pasting');
    setStatusMessage('Connecting to Shizuku UID 2000 (shell)...');

    const files = getAnshuFiles();

    // Visual feedback delay
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (files.length === 0) {
      setStatus('error');
      setStatusMessage(
        'anshu-on-top folder is empty. Place your files in /src/anshu-on-top/ and click ACTIVATE.'
      );
      return;
    }

    try {
      const cleanDest = targetPath.replace(/\/+$/, '');

      // Ensure destination directory exists
      const parts = cleanDest.split('/').filter(Boolean);
      let curr = '';
      for (const seg of parts) {
        const parent = curr || '/';
        curr = `${curr}/${seg}`;
        if (!vfs.getItem(curr)) {
          try {
            vfs.createDirectory(parent, seg);
          } catch {
            // Already exists
          }
        }
      }

      // Copy all files from anshu-on-top into destination
      for (const file of files) {
        const fullDestPath = `${cleanDest}/${file.relPath}`;
        const parentDir = vfs.getParentPath(fullDestPath);

        // Ensure subdirectories exist if any
        if (parentDir && !vfs.getItem(parentDir)) {
          const subparts = parentDir.split('/').filter(Boolean);
          let subCurr = '';
          for (const s of subparts) {
            const p = subCurr || '/';
            subCurr = `${subCurr}/${s}`;
            if (!vfs.getItem(subCurr)) {
              try {
                vfs.createDirectory(p, s);
              } catch {
                // ignore
              }
            }
          }
        }

        // Delete existing file if present
        if (vfs.getItem(fullDestPath)) {
          vfs.deleteItem(fullDestPath);
        }

        const size = new Blob([file.content]).size;
        vfs.createFile(parentDir, file.relPath.split('/').pop() || 'file', file.content, size);
      }

      // Apply chmod 775
      vfs.chmodItem(cleanDest, '-rwxrwxr-x');

      setStatus('success');
      setStatusMessage(`Pasted ${files.length} file${files.length > 1 ? 's' : ''} to ${cleanDest}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setStatusMessage(`Error: ${msg}`);
    }
  };

  // Initial loading state
  if (!isInitialCheckDone) {
    return (
      <div className="min-h-screen bg-[#06090e] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying Authorization...</span>
        </div>
      </div>
    );
  }

  // SCREEN 1: KEY AUTHORIZATION PAGE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/20">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {/* Logo / Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-2xl shadow-emerald-950/60 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-emerald-400">
                <Lock className="w-7 h-7" />
              </div>
            </div>
            <h1 className="font-['Cabinet_Grotesk'] text-2xl font-bold tracking-tight text-white mt-1">
              CYBER ENGINE V2
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Key Authorization Required
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyKeyAgainstGithub(authKeyInput);
            }}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-4 shadow-2xl"
          >
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-2 flex items-center justify-between">
                <span>ENTER ACTIVATION KEY:</span>
                <span className="text-[10px] text-slate-500">GitHub Verified</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={authKeyInput}
                  onChange={(e) => {
                    setAuthKeyInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter key (e.g. ANSHU)..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-emerald-300 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors uppercase tracking-wider"
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || !authKeyInput.trim()}
              className={`w-full py-3 rounded-xl font-['Cabinet_Grotesk'] font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all select-none shadow-lg ${
                isVerifying || !authKeyInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
              }`}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>CHECKING GITHUB...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>AUTHORIZE ACCESS</span>
                </>
              )}
            </button>

            {/* Remote URL Info */}
            <div className="pt-2 border-t border-slate-800/80 text-center">
              <a
                href={KEY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-slate-500 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <span>Synced with GitHub key.txt</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // SCREEN 2: AUTHORIZED - ONE CLEAN ACTIVATE BUTTON
  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500/20 relative">
      {/* Top right session status & logout */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Authorized: {authKeyInput.toUpperCase()}</span>
        </span>
        <button
          onClick={handleLogout}
          title="Lock / Logout"
          className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
        {/* ONE BIG ACTIVATE BUTTON */}
        <button
          onClick={handleActivate}
          disabled={status === 'pasting'}
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center font-['Cabinet_Grotesk'] text-3xl sm:text-4xl font-black tracking-wider uppercase transition-all duration-300 transform select-none shadow-2xl active:scale-95 ${
            status === 'pasting'
              ? 'bg-slate-900 border-4 border-emerald-500/60 text-emerald-400 shadow-emerald-500/20 cursor-wait'
              : status === 'success'
              ? 'bg-emerald-600 hover:bg-emerald-500 border-4 border-emerald-400 text-white shadow-emerald-600/40 hover:scale-105'
              : 'bg-emerald-500 hover:bg-emerald-400 border-4 border-emerald-300 text-slate-950 shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105'
          }`}
        >
          {status === 'pasting' ? (
            <>
              <RefreshCw className="w-12 h-12 animate-spin text-emerald-400 mb-2" />
              <span className="text-xl sm:text-2xl font-bold">PASTING</span>
            </>
          ) : status === 'success' ? (
            <>
              <Check className="w-12 h-12 text-white mb-2 stroke-[3]" />
              <span>ACTIVATED</span>
            </>
          ) : (
            <>
              <Zap className="w-14 h-14 text-slate-950 fill-slate-950 mb-2" />
              <span>ACTIVATE</span>
            </>
          )}
        </button>

        {/* Clean status feedback below button */}
        <div className="min-h-[40px] flex items-center justify-center text-center px-4">
          {status === 'pasting' && (
            <span className="text-xs font-mono text-emerald-400 animate-pulse">
              Executing Shizuku paste via UID 2000...
            </span>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
