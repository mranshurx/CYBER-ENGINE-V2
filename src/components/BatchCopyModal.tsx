import React, { useState } from 'react';
import { VFile, ShizukuState, ConflictResolution } from '../types';
import { vfs } from '../utils/fileSystem';
import { generateRishCopyCommand, generateRishChmodCommand, generateRishMkdirCommand } from '../utils/shizukuCommands';
import {
  Gamepad2,
  Package,
  ShieldCheck,
  HardDrive,
  Copy,
  CheckCircle2,
  FolderSync,
  Play,
} from 'lucide-react';

interface BatchCopyModalProps {
  shizukuState: ShizukuState;
  onQueueTransfer: (
    sourceFiles: VFile[],
    destDir: string,
    action: 'copy' | 'move',
    conflict: ConflictResolution
  ) => void;
  onLogCommand: (cmd: string, out: string, exitCode: number) => void;
  onNavigateTo: (path: string) => void;
}

export const BatchCopyModal: React.FC<BatchCopyModalProps> = ({
  shizukuState,
  onQueueTransfer,
  onLogCommand,
  onNavigateTo,
}) => {
  const [activeRecipe, setActiveRecipe] = useState<
    'gameSave' | 'obbInstaller' | 'permissionFix' | 'appBackup'
  >('gameSave');

  const [selectedGame, setSelectedGame] = useState('minecraft');
  const [obbSourceFile, setObbSourceFile] = useState(
    '/storage/emulated/0/Download/patch.1043.com.ea.gp.apexmobile.obb'
  );
  const [detectedPackage, setDetectedPackage] = useState('com.ea.gp.apexmobile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableDownloads = vfs.listDirectory('/storage/emulated/0/Download');

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Recipe 1: Game Save Injector
  const handleInjectGameSave = () => {
    let sourcePath = '';
    let destDir = '';

    if (selectedGame === 'minecraft') {
      sourcePath = '/storage/emulated/0/Download/minecraft_ultrashaders_v2.mcpack';
      destDir =
        '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games/minecraftWorlds';
    } else if (selectedGame === 'pubg') {
      sourcePath = '/storage/emulated/0/Download/Active.sav';
      destDir = '/storage/emulated/0/Android/data/com.pubg.imobile/files';
    } else if (selectedGame === 'ppsspp') {
      sourcePath = '/storage/emulated/0/Download/ULES01505_GOW_100pct_save.zip';
      destDir = '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/SAVEDATA';
    } else if (selectedGame === 'retroarch') {
      sourcePath = '/storage/emulated/0/Download/retroarch_optimal_vulkan.cfg';
      destDir = '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP';
    }

    const item = vfs.getItem(sourcePath);
    if (!item) {
      triggerToast(`Source file not found at ${sourcePath}`);
      return;
    }

    onQueueTransfer([item], destDir, 'copy', 'overwrite');

    const cmd = generateRishCopyCommand(sourcePath, destDir);
    onLogCommand(
      cmd,
      `[Shizuku UID ${shizukuState.uid}] Game config/mod injected successfully into '${destDir}'`,
      0
    );

    triggerToast(`Injected mod/save to ${destDir}!`);
  };

  // Recipe 2: OBB Installer
  const handleInstallObb = () => {
    const item = vfs.getItem(obbSourceFile);
    if (!item) {
      triggerToast(`OBB file not found at ${obbSourceFile}`);
      return;
    }

    const targetDir = `/storage/emulated/0/Android/obb/${detectedPackage}`;

    // Ensure directory exists in VFS
    if (!vfs.getItem(targetDir)) {
      vfs.createDirectory('/storage/emulated/0/Android/obb', detectedPackage);
    }

    onQueueTransfer([item], targetDir, 'copy', 'overwrite');

    const mkdirCmd = generateRishMkdirCommand(targetDir);
    const copyCmd = generateRishCopyCommand(item.path, targetDir);
    const chmodCmd = generateRishChmodCommand(targetDir, '775');

    onLogCommand(
      `${mkdirCmd} && ${copyCmd} && ${chmodCmd}`,
      `[Shizuku UID ${shizukuState.uid}] OBB package installed in '${targetDir}' with 775 permissions.`,
      0
    );

    triggerToast(`Installed OBB to ${targetDir}`);
  };

  // Recipe 3: Fix Permissions
  const handleFixPermissions = () => {
    const path = '/storage/emulated/0/Android/data';
    const cmd = generateRishChmodCommand(path, '775', true);
    onLogCommand(
      cmd,
      `[Shizuku UID ${shizukuState.uid}] Recursively changed permissions of '${path}' to 775. All apps can now access authorized files.`,
      0
    );
    triggerToast('Scoped storage permissions updated to 775!');
  };

  // Recipe 4: Backup App Data
  const handleBackupAppData = () => {
    const srcDir = '/storage/emulated/0/Android/data/com.mojang.minecraftpe';
    const targetDir = '/storage/emulated/0/Documents';
    const item = vfs.getItem(srcDir);
    if (!item) {
      triggerToast('Source directory not found');
      return;
    }

    onQueueTransfer([item], targetDir, 'copy', 'overwrite');
    const cmd = generateRishCopyCommand(srcDir, targetDir);
    onLogCommand(
      cmd,
      `[Shizuku UID ${shizukuState.uid}] Backup created in '${targetDir}/com.mojang.minecraftpe'`,
      0
    );
    triggerToast(`Backed up to ${targetDir}`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <h2 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
          Batch Copy-Paste &amp; Automation Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Automated recipes designed to bypass Android 11–15 Scoped Storage for games, mods, and backups using Shizuku privileged IPC.
        </p>
      </div>

      {/* Recipe Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveRecipe('gameSave')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeRecipe === 'gameSave'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Game Mod / Save Injector</span>
        </button>

        <button
          onClick={() => setActiveRecipe('obbInstaller')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeRecipe === 'obbInstaller'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Game OBB Installer</span>
        </button>

        <button
          onClick={() => setActiveRecipe('permissionFix')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeRecipe === 'permissionFix'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Fix Permissions (chmod 775)</span>
        </button>

        <button
          onClick={() => setActiveRecipe('appBackup')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeRecipe === 'appBackup'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FolderSync className="w-4 h-4" />
          <span>Backup App Data</span>
        </button>
      </div>

      {/* Recipe 1 View */}
      {activeRecipe === 'gameSave' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Inject Save File or Mod into /Android/data</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Normal file managers get "Access Denied" or empty folders here. Shizuku uses UID 2000 to paste directly into protected app data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Target Game Profile:</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
              >
                <option value="minecraft">Minecraft Bedrock (com.mojang.minecraftpe)</option>
                <option value="pubg">PUBG / BGMI Config (com.pubg.imobile)</option>
                <option value="ppsspp">PPSSPP Emulator (org.ppsspp.ppsspp)</option>
                <option value="retroarch">RetroArch Config (com.retroarch)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Target Destination:</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 truncate">
                {selectedGame === 'minecraft' && '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games/'}
                {selectedGame === 'pubg' && '/storage/emulated/0/Android/data/com.pubg.imobile/files/Active.sav'}
                {selectedGame === 'ppsspp' && '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/SAVEDATA/'}
                {selectedGame === 'retroarch' && '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <span className="text-slate-500">Shizuku Command to execute:</span>
            <div className="text-emerald-400 mt-1 break-all">
              {selectedGame === 'minecraft' &&
                `rish -c "cp -r -f -p '/storage/emulated/0/Download/minecraft_ultrashaders_v2.mcpack' '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games/minecraftWorlds/'"`}
              {selectedGame === 'pubg' &&
                `rish -c "cp -f '/storage/emulated/0/Download/Active.sav' '/storage/emulated/0/Android/data/com.pubg.imobile/files/Active.sav'"`}
              {selectedGame === 'ppsspp' &&
                `rish -c "cp -r -f '/storage/emulated/0/Download/ULES01505_GOW_100pct_save.zip' '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/SAVEDATA/'"`}
              {selectedGame === 'retroarch' &&
                `rish -c "cp -f '/storage/emulated/0/Download/retroarch_optimal_vulkan.cfg' '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/ppsspp.ini'"`}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleInjectGameSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute Shizuku Injection</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipe 2 View */}
      {activeRecipe === 'obbInstaller' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Automated OBB File Installer</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an OBB file from Downloads. This recipe automatically parses the package identifier, creates the target folder in <code className="text-emerald-400 font-mono">/Android/obb/&lt;package_name&gt;</code>, and copies the file with system permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Source OBB Archive:</label>
              <select
                value={obbSourceFile}
                onChange={(e) => {
                  const val = e.target.value;
                  setObbSourceFile(val);
                  // Extract package if matching standard main.xxx.com.package.obb pattern
                  const match = val.match(/\.(com\.[a-zA-Z0-9_.]+)\.obb/);
                  if (match) {
                    setDetectedPackage(match[1]);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
              >
                {availableDownloads
                  .filter((f) => f.name.endsWith('.obb') || f.name.endsWith('.zip'))
                  .map((f) => (
                    <option key={f.path} value={f.path}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Package Identifier:</label>
              <input
                type="text"
                value={detectedPackage}
                onChange={(e) => setDetectedPackage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <span className="text-slate-500">Pipeline to run:</span>
            <div className="text-emerald-400 mt-1 break-all">
              {`rish -c "mkdir -p '/storage/emulated/0/Android/obb/${detectedPackage}' && cp -f '${obbSourceFile}' '/storage/emulated/0/Android/obb/${detectedPackage}/' && chmod -R 775 '/storage/emulated/0/Android/obb/${detectedPackage}'"`}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleInstallObb}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Install OBB Package</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipe 3 View */}
      {activeRecipe === 'permissionFix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Fix Scoped Storage Directory Permissions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sometimes after manual copying or system updates, files inside `/Android/data` have restrictive read/write permissions (`0600`), causing games or apps to crash on launch. Running `chmod -R 775` restores full access.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 space-y-2">
            <div className="text-amber-400 font-semibold">Target Command:</div>
            <div className="text-emerald-400">
              rish -c "chmod -R 775 '/storage/emulated/0/Android/data'"
            </div>
            <div className="text-slate-500 text-[11px]">
              Sets read/write/execute permissions for Owner and Group (sdcard_rw / ext_data_rw).
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleFixPermissions}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Run Permissions Fix (chmod 775)</span>
            </button>
          </div>
        </div>
      )}

      {/* Recipe 4 View */}
      {activeRecipe === 'appBackup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Full App Data Backup</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copies your entire game saves, configs, and private cache from `/Android/data/com.mojang.minecraftpe` to `/storage/emulated/0/Documents/` where you can safely edit, cloud-sync, or transfer it.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 space-y-2">
            <div className="text-slate-400">Source: /storage/emulated/0/Android/data/com.mojang.minecraftpe</div>
            <div className="text-slate-400">Destination: /storage/emulated/0/Documents/</div>
            <div className="text-emerald-400">
              rish -c "cp -r -f -p '/storage/emulated/0/Android/data/com.mojang.minecraftpe' '/storage/emulated/0/Documents/'"
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleBackupAppData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Execute Backup</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
