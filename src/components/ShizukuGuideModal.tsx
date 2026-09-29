import React, { useState } from 'react';
import {
  BookOpen,
  Smartphone,
  ShieldCheck,
  Terminal,
  HelpCircle,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const ShizukuGuideModal: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
            Shizuku &amp; Android Scoped Storage Guide
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Everything you need to know about copying and pasting files into protected Android directories without root.
        </p>
      </div>

      {/* Section 1: The Problem & The Solution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Why is /Android/data and /Android/obb Locked?</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Starting in <strong>Android 11</strong> and tightened further in <strong>Android 13, 14, and 15</strong>, Google introduced strict <em>Scoped Storage</em> enforcement. The system Document Provider explicitly blocks third-party file managers from viewing or writing to:
        </p>
        <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 font-mono">
          <li>/storage/emulated/0/Android/data (App configs, game saves, mods, cache)</li>
          <li>/storage/emulated/0/Android/obb (Large game asset expansion packs)</li>
        </ul>
        <p className="text-xs text-slate-300 leading-relaxed">
          Even granting the <code className="text-emerald-400 font-mono">MANAGE_EXTERNAL_STORAGE</code> permission will still return <em className="text-rose-400">ACCESS_DENIED</em>.
        </p>
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
          <span className="text-emerald-400 font-semibold">How Shizuku Solves It:</span> Shizuku acts as an on-device IPC bridge that runs with <strong>ADB Shell privileges (UID 2000)</strong> or <strong>Root (UID 0)</strong>. Because the Android Debug Bridge is immune to Scoped Storage filters, Shizuku can copy, move, and edit any file seamlessly.
        </div>
      </div>

      {/* Section 2: Step-by-Step Wireless Debugging Setup */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>How to Setup Shizuku on Android 11 to 15 (No Root Required)</span>
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              1
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Enable Developer Options</strong>
              Go to Android <strong>Settings &gt; About phone</strong>. Tap <strong>Build Number</strong> 7 times until you see <em>"You are now a developer"</em>.
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              2
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Turn on Wireless Debugging</strong>
              Go to <strong>Settings &gt; System &gt; Developer options</strong>. Find <strong>Wireless debugging</strong> and toggle it ON. (Ensure you are connected to Wi-Fi).
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              3
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Pair with Shizuku</strong>
              Open the <strong>Shizuku app</strong>. Tap <strong>Pairing</strong>. In Developer Options, tap <em>"Pair device with pairing code"</em>. Enter the 6-digit code in the Shizuku notification prompt.
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
              4
            </div>
            <div className="text-xs text-slate-300">
              <strong className="text-white block mb-0.5">Start the Service &amp; Authorize</strong>
              Return to Shizuku and tap <strong>Start</strong>. Once running with UID 2000, tap <strong>Authorized Applications</strong> and toggle ON your file manager or this web bridge!
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Rish & Command Cheatsheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Shizuku `rish` Copy-Paste Cheatsheet</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <div className="font-mono text-emerald-300 truncate">
              rish -c "cp -r -f -p /sdcard/Download/mod.zip /sdcard/Android/data/com.game/files/"
            </div>
            <button
              onClick={() =>
                handleCopy(
                  'rish -c "cp -r -f -p /sdcard/Download/mod.zip /sdcard/Android/data/com.game/files/"',
                  'cp'
                )
              }
              className="p-1 text-slate-400 hover:text-white"
            >
              {copiedCode === 'cp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <div className="font-mono text-emerald-300 truncate">
              rish -c "chmod -R 775 /sdcard/Android/data"
            </div>
            <button
              onClick={() => handleCopy('rish -c "chmod -R 775 /sdcard/Android/data"', 'chmod')}
              className="p-1 text-slate-400 hover:text-white"
            >
              {copiedCode === 'chmod' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
            <div className="font-mono text-emerald-300 truncate">
              rish -c "mkdir -p /sdcard/Android/obb/com.activision.callofduty.shooter"
            </div>
            <button
              onClick={() =>
                handleCopy(
                  'rish -c "mkdir -p /sdcard/Android/obb/com.activision.callofduty.shooter"',
                  'mkdir'
                )
              }
              className="p-1 text-slate-400 hover:text-white"
            >
              {copiedCode === 'mkdir' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
