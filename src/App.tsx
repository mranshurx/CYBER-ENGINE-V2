import React, { useState, useEffect, useCallback } from 'react';
import { HARDCODED_TARGET_PATH } from './where-to-copy';
import targetPathRaw from './where-to-copy/target_path.txt?raw';
import { vfs } from './utils/fileSystem';
import {
  checkShizukuStatus,
  requestShizukuPermission,
  openShizukuApp,
  pasteFilesToDestination,
  ShizukuStatus,
} from './services/shizuku';
import {
  Zap,
  Check,
  RefreshCw,
  AlertCircle,
  Key,
  Lock,
  Unlock,
  LogOut,
  FolderSync,
  ExternalLink,
  Smartphone,
  Cpu,
  Globe,
  CheckCircle2,
} from 'lucide-react';

const RAW_KEY_URL =
  'https://raw.githubusercontent.com/mranshurx/CYBER-ENGINE-V2/refs/heads/main/key.txt';

// Helper to fetch live keys directly from GitHub online with simple CORS requests (no custom headers)
async function fetchOnlineValidKeys(): Promise<string[]> {
  const cleanKeys = (text: string) =>
    text
      .split(/[\r\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);

  const timestamp = Date.now();
  const randomSalt = Math.floor(Math.random() * 1000000);

  // 1. Primary: Direct raw GitHub URL (Simple GET request without custom headers to avoid CORS preflight 403)
  try {
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/mranshurx/CYBER-ENGINE-V2/refs/heads/main/key.txt?_t=${timestamp}_${randomSalt}`
    );

    if (rawRes.ok) {
      const text = await rawRes.text();
      const keys = cleanKeys(text);
      if (keys.length > 0) return keys;
    }
  } catch (rawErr) {
    console.warn('Primary raw key fetch failed:', rawErr);
  }

  // 2. Secondary: Direct /main/ branch raw URL
  try {
    const altRes = await fetch(
      `https://raw.githubusercontent.com/mranshurx/CYBER-ENGINE-V2/main/key.txt?_t=${timestamp}_${randomSalt}`
    );

    if (altRes.ok) {
      const text = await altRes.text();
      const keys = cleanKeys(text);
      if (keys.length > 0) return keys;
    }
  } catch (altErr) {
    console.warn('Secondary raw key fetch failed:', altErr);
  }

  // 3. Fallback: Fast jsDelivr CDN
  try {
    const cdnRes = await fetch(
      `https://cdn.jsdelivr.net/gh/mranshurx/CYBER-ENGINE-V2@main/key.txt?_t=${timestamp}`
    );

    if (cdnRes.ok) {
      const text = await cdnRes.text();
      const keys = cleanKeys(text);
      if (keys.length > 0) return keys;
    }
  } catch (cdnErr) {
    console.warn('jsDelivr key fetch failed:', cdnErr);
  }

  // 4. Fallback: GitHub REST API
  try {
    const apiRes = await fetch(
      `https://api.github.com/repos/mranshurx/CYBER-ENGINE-V2/contents/key.txt?ref=main&_t=${timestamp}`
    );

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.content && data.encoding === 'base64') {
        const decoded = atob(data.content.replace(/\s/g, ''));
        const keys = cleanKeys(decoded);
        if (keys.length > 0) return keys;
      }
    }
  } catch (apiErr) {
    console.warn('GitHub API key fetch failed:', apiErr);
  }

  throw new Error('Unable to connect to GitHub. Please check your internet connection.');
}

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

  // Shizuku native states
  const [shizuku, setShizuku] = useState<ShizukuStatus | null>(null);
  const [isRequestingPerm, setIsRequestingPerm] = useState<boolean>(false);
  const [isRefreshingShizuku, setIsRefreshingShizuku] = useState<boolean>(false);

  // Activation & status states
  const [status, setStatus] = useState<'idle' | 'pasting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [pasteMethod, setPasteMethod] = useState<string>('');

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

  const files = getAnshuFiles();

  // Refresh Shizuku status
  const refreshShizuku = useCallback(async () => {
    setIsRefreshingShizuku(true);
    try {
      const s = await checkShizukuStatus();
      setShizuku(s);
      return s;
    } catch {
      return null;
    } finally {
      setIsRefreshingShizuku(false);
    }
  }, []);

  // Online verification against GitHub
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
      // 100% online verification from GitHub
      const validKeys = await fetchOnlineValidKeys();

      const isValid = validKeys.some(
        (valid) => valid.toLowerCase() === trimmedInput.toLowerCase()
      );

      if (isValid) {
        localStorage.setItem('cyber_engine_auth_key', trimmedInput);
        setIsAuthenticated(true);
        setAuthError(null);
        setTimeout(() => refreshShizuku(), 100);
      } else {
        // If the key was changed on GitHub and is no longer valid, clear local storage
        localStorage.removeItem('cyber_engine_auth_key');
        setIsAuthenticated(false);
        setAuthError(
          'Access Denied: Invalid key. If you just updated key.txt on GitHub, please enter the new key.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!isSilent) {
        setAuthError(msg);
      } else {
        // In silent mode, if offline, allow cached key only if already saved
        const savedKey = localStorage.getItem('cyber_engine_auth_key');
        if (savedKey && savedKey.toLowerCase() === trimmedInput.toLowerCase()) {
          setIsAuthenticated(true);
        }
      }
    } finally {
      setIsVerifying(false);
      setIsInitialCheckDone(true);
    }
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

  // Poll Shizuku status when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshShizuku();
      const interval = setInterval(refreshShizuku, 3500);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshShizuku]);

  // Request Shizuku permission handler
  const handleRequestShizuku = async () => {
    setIsRequestingPerm(true);
    setStatus('pasting');
    setStatusMessage('Requesting Shizuku authorization dialog...');
    try {
      const res = await requestShizukuPermission();
      const updated = await refreshShizuku();
      if (res.granted || updated?.shizukuPermission) {
        setStatus('idle');
        setStatusMessage('');
      } else {
        setStatus('error');
        setStatusMessage(res.message || 'Shizuku permission not granted by user.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setStatusMessage(`Shizuku error: ${msg}`);
    } finally {
      setIsRequestingPerm(false);
    }
  };

  // Launch Shizuku app
  const handleOpenShizuku = async () => {
    await openShizukuApp();
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

    if (files.length === 0) {
      setStatus('error');
      setStatusMessage('No files found in /src/anshu-on-top/. Please add files and try again.');
      return;
    }

    const cleanDest = targetPath.replace(/\/+$/, '');
    if (!cleanDest) {
      setStatus('error');
      setStatusMessage('Target directory path in /src/where-to-copy/ is empty.');
      return;
    }

    // On Android: check Shizuku status
    const currentStatus = await refreshShizuku();
    if (currentStatus?.isAndroid) {
      // If Shizuku permission not granted yet, ask for it immediately
      if (!currentStatus.shizukuPermission && !currentStatus.rootAvailable) {
        setStatus('pasting');
        setStatusMessage('Requesting Shizuku authorization dialog...');
        const req = await requestShizukuPermission();
        if (!req.granted) {
          setStatus('error');
          setStatusMessage(
            req.message || 'Shizuku permission is required. Please allow CYBER ENGINE in the prompt.'
          );
          return;
        }
      }
    }

    setStatus('pasting');
    setStatusMessage('Pasting files into target directory...');

    try {
      // 1. Execute native paste via Shizuku / Root / Direct
      const payload = files.map((f) => ({
        name: f.relPath,
        content: f.content,
        isBase64: false,
      }));

      const pasteRes = await pasteFilesToDestination(cleanDest, payload);

      if (!pasteRes.success) {
        throw new Error(pasteRes.message || 'Paste operation failed.');
      }

      // 2. Also sync to web VFS
      try {
        const parts = cleanDest.split('/').filter(Boolean);
        let curr = '';
        for (const seg of parts) {
          const parent = curr || '/';
          curr = `${curr}/${seg}`;
          if (!vfs.getItem(curr)) {
            try {
              vfs.createDirectory(parent, seg);
            } catch {
              // ignore
            }
          }
        }

        for (const file of files) {
          const fullDestPath = `${cleanDest}/${file.relPath}`;
          const parentDir = vfs.getParentPath(fullDestPath);
          if (vfs.getItem(fullDestPath)) {
            vfs.deleteItem(fullDestPath);
          }
          const size = new Blob([file.content]).size;
          vfs.createFile(parentDir, file.relPath.split('/').pop() || 'file', file.content, size);
        }
      } catch {
        // VFS error non-fatal
      }

      setPasteMethod(pasteRes.method);
      setStatus('success');
      setStatusMessage(
        `Pasted ${files.length} file${files.length > 1 ? 's' : ''} to destination!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setStatusMessage(msg);
    }
  };

  // Initial loading state
  if (!isInitialCheckDone) {
    return (
      <div className="min-h-screen bg-[#06090e] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying Online Key...</span>
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
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 justify-center">
              <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Online GitHub Verification</span>
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 font-mono">
                  ENTER ACTIVATION KEY:
                </label>
                <span className="text-[10px] font-mono text-emerald-400/80">
                  LIVE CHECK
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={authKeyInput}
                  onChange={(e) => {
                    setAuthKeyInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter key..."
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
                  <span>CHECKING GITHUB ONLINE...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>VERIFY & AUTHORIZE</span>
                </>
              )}
            </button>

            <p className="text-[10px] font-mono text-slate-500 text-center">
              Keys are checked live from key.txt on GitHub
            </p>
          </form>
        </div>
      </div>
    );
  }

  // SCREEN 2: AUTHORIZED MAIN DASHBOARD
  const isShizukuReady = shizuku?.shizukuPermission;
  const isShizukuAvailableNoPerm = shizuku?.shizukuAvailable && !shizuku?.shizukuPermission;
  const isShizukuOffline = shizuku?.isAndroid && !shizuku?.shizukuAvailable && !shizuku?.rootAvailable;

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col items-center justify-between p-4 selection:bg-emerald-500/20 relative">
      {/* Top Header & Shizuku Status Bar */}
      <header className="w-full max-w-md pt-2 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Cabinet_Grotesk'] font-bold text-sm text-white tracking-wide">
                CYBER ENGINE V2
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span>ONLINE KEY:</span>
                <span className="text-emerald-400 font-bold">{authKeyInput.toUpperCase()}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshShizuku()}
              disabled={isRefreshingShizuku}
              title="Refresh status"
              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingShizuku ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              title="Lock / Logout"
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>

        {/* Shizuku Status Badge / Bar */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>SUBSYSTEM:</span>
            </span>

            {isShizukuReady && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SHIZUKU CONNECTED & PERMITTED
              </span>
            )}

            {isShizukuAvailableNoPerm && (
              <button
                onClick={handleRequestShizuku}
                disabled={isRequestingPerm}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold hover:bg-amber-900/60 transition-colors animate-pulse"
              >
                <span>GRANT SHIZUKU PERMISSION</span>
              </button>
            )}

            {shizuku?.rootAvailable && !shizuku?.shizukuAvailable && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                ROOT (SU) ACTIVE
              </span>
            )}

            {isShizukuOffline && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => refreshShizuku()}
                  disabled={isRefreshingShizuku}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingShizuku ? 'animate-spin' : ''}`} />
                  <span>RECHECK</span>
                </button>

                <button
                  onClick={handleOpenShizuku}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold hover:bg-rose-900/60 transition-colors"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>OPEN SHIZUKU</span>
                </button>
              </div>
            )}

            {!shizuku?.isAndroid && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                WEB PREVIEW
              </span>
            )}
          </div>

          {/* Action prompt if Shizuku needs attention */}
          {shizuku?.isAndroid && !shizuku?.shizukuPermission && (
            <div className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-lg flex items-center justify-between gap-2">
              <span className="leading-tight">
                Shizuku permission required for Android/data folder access:
              </span>
              <button
                onClick={handleRequestShizuku}
                disabled={isRequestingPerm}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold uppercase text-[11px] shrink-0 active:scale-95 shadow transition-all"
              >
                {isRequestingPerm ? 'Requesting...' : 'Request Permission'}
              </button>
            </div>
          )}

          {!shizuku?.isAndroid && (
            <div className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/30 border border-cyan-500/20 p-2 rounded-lg text-center">
              Web Preview Environment — Shizuku system permission dialog will appear when running the built APK on your Android device.
            </div>
          )}

          {isShizukuOffline && (
            <div className="text-[11px] font-mono text-slate-300 bg-slate-950/50 border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 leading-tight">
                If Shizuku service is running in background, tap to connect:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => refreshShizuku()}
                  disabled={isRefreshingShizuku}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold uppercase text-[10px] inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingShizuku ? 'animate-spin' : ''}`} />
                  <span>Connect</span>
                </button>
                <button
                  onClick={handleOpenShizuku}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold uppercase text-[10px] inline-flex items-center gap-1"
                >
                  <span>Open App</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Center: BIG ACTIVATE BUTTON */}
      <main className="flex flex-col items-center gap-6 max-w-sm w-full text-center my-auto py-6">
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
        <div className="min-h-[44px] flex items-center justify-center text-center px-4 w-full">
          {status === 'pasting' && (
            <span className="text-xs font-mono text-emerald-400 animate-pulse flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{statusMessage || 'Executing Shizuku paste...'}</span>
            </span>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{statusMessage}</span>
              </div>
              {pasteMethod && (
                <span className="text-[10px] font-mono text-slate-500">
                  METHOD: {pasteMethod.toUpperCase()} PRIVILEGES
                </span>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-rose-300 bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-500/40 text-left">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Target Destination Info */}
      <footer className="w-full max-w-md pb-2">
        <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex flex-col gap-1.5 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <FolderSync className="w-3.5 h-3.5 text-emerald-500" />
              <span>TARGET DESTINATION</span>
            </span>
            <span>{files.length} file{files.length !== 1 ? 's' : ''} ready</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-900/90 px-2 py-1 rounded border border-slate-800" title={targetPath}>
            {targetPath || 'Path not specified'}
          </p>
        </div>
      </footer>
    </div>
  );
}
