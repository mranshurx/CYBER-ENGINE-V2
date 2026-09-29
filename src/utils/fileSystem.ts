import JSZip from 'jszip';
import { VFile, ConflictResolution } from '../types';

const STORAGE_KEY = 'shizuku_file_manager_fs_v2';

export const INITIAL_FILES: VFile[] = [
  // Root paths
  {
    id: 'root-storage',
    name: 'storage',
    path: '/storage',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root',
  },
  {
    id: 'emulated',
    name: 'emulated',
    path: '/storage/emulated',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root',
  },
  {
    id: 'sdcard0',
    name: '0',
    path: '/storage/emulated/0',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwx--x',
    owner: 'root',
    group: 'sdcard_rw',
  },
  // Subfolders of /storage/emulated/0
  {
    id: 'dir-android',
    name: 'Android',
    path: '/storage/emulated/0/Android',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwx--x',
    owner: 'root',
    group: 'sdcard_rw',
  },
  {
    id: 'dir-android-data',
    name: 'data',
    path: '/storage/emulated/0/Android/data',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwx--x',
    owner: 'root',
    group: 'sdcard_rw',
    isProtected: true,
  },
  {
    id: 'dir-android-obb',
    name: 'obb',
    path: '/storage/emulated/0/Android/obb',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwx--x',
    owner: 'root',
    group: 'sdcard_rw',
    isProtected: true,
  },
  {
    id: 'dir-android-media',
    name: 'media',
    path: '/storage/emulated/0/Android/media',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwx--x',
    owner: 'root',
    group: 'sdcard_rw',
  },
  // Packages inside /storage/emulated/0/Android/data
  {
    id: 'pkg-minecraft',
    name: 'com.mojang.minecraftpe',
    path: '/storage/emulated/0/Android/data/com.mojang.minecraftpe',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a189',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-minecraft-files',
    name: 'files',
    path: '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a189',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-minecraft-games',
    name: 'games',
    path: '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a189',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-minecraft-worlds',
    name: 'minecraftWorlds',
    path: '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games/minecraftWorlds',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a189',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'file-mc-world1',
    name: 'SurvivalWorld_Endgame.mcworld',
    path: '/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games/minecraftWorlds/SurvivalWorld_Endgame.mcworld',
    type: 'file',
    size: 45289124,
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    permissions: '-rw-rw----',
    owner: 'u0_a189',
    group: 'ext_data_rw',
    isProtected: true,
    content: '[Minecraft Bedrock World Data - Seed: 849204820 - Level Name: Endgame Survival]',
  },
  // PPSSPP
  {
    id: 'pkg-ppsspp',
    name: 'org.ppsspp.ppsspp',
    path: '/storage/emulated/0/Android/data/org.ppsspp.ppsspp',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a145',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-ppsspp-files',
    name: 'files',
    path: '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a145',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-ppsspp-psp',
    name: 'PSP',
    path: '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a145',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-ppsspp-savedata',
    name: 'SAVEDATA',
    path: '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/SAVEDATA',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a145',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'file-ppsspp-ini',
    name: 'ppsspp.ini',
    path: '/storage/emulated/0/Android/data/org.ppsspp.ppsspp/files/PSP/ppsspp.ini',
    type: 'file',
    size: 8412,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    permissions: '-rw-rw----',
    owner: 'u0_a145',
    group: 'ext_data_rw',
    isProtected: true,
    content: '[General]\nFirstRun = false\nInternalResolution = 3\nRenderingMode = 1\nVSync = true\nFrameSkip = 0\n[Graphics]\nBackend = Vulkan\nDisplayAspectRatio = 16:9\n[Sound]\nEnable = true\nAudioLatency = 1',
  },
  // PUBG
  {
    id: 'pkg-pubg',
    name: 'com.pubg.imobile',
    path: '/storage/emulated/0/Android/data/com.pubg.imobile',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a202',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'pkg-pubg-files',
    name: 'files',
    path: '/storage/emulated/0/Android/data/com.pubg.imobile/files',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a202',
    group: 'ext_data_rw',
    isProtected: true,
  },
  {
    id: 'file-pubg-active',
    name: 'Active.sav',
    path: '/storage/emulated/0/Android/data/com.pubg.imobile/files/Active.sav',
    type: 'file',
    size: 42890,
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    permissions: '-rw-rw----',
    owner: 'u0_a202',
    group: 'ext_data_rw',
    isProtected: true,
    content: '[PUBG User Configuration File - Graphics: Smooth, FPS: 90FPS, Anti-Aliasing: 2X, Style: Colorful]',
  },
  // Packages inside /storage/emulated/0/Android/obb
  {
    id: 'obb-cod',
    name: 'com.activision.callofduty.shooter',
    path: '/storage/emulated/0/Android/obb/com.activision.callofduty.shooter',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a210',
    group: 'ext_obb_rw',
    isProtected: true,
  },
  {
    id: 'file-cod-obb',
    name: 'main.8841.com.activision.callofduty.shooter.obb',
    path: '/storage/emulated/0/Android/obb/com.activision.callofduty.shooter/main.8841.com.activision.callofduty.shooter.obb',
    type: 'file',
    size: 2254857830,
    updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    permissions: '-rw-rw----',
    owner: 'u0_a210',
    group: 'ext_obb_rw',
    isProtected: true,
    content: '[Binary OBB Asset Archive - Activision COD Mobile Season 8 Patch]',
  },
  {
    id: 'obb-apex',
    name: 'com.ea.gp.apexmobile',
    path: '/storage/emulated/0/Android/obb/com.ea.gp.apexmobile',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    permissions: 'drwxrwx---',
    owner: 'u0_a215',
    group: 'ext_obb_rw',
    isProtected: true,
  },
  {
    id: 'file-apex-obb',
    name: 'main.1042.com.ea.gp.apexmobile.obb',
    path: '/storage/emulated/0/Android/obb/com.ea.gp.apexmobile/main.1042.com.ea.gp.apexmobile.obb',
    type: 'file',
    size: 1528491820,
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    permissions: '-rw-rw----',
    owner: 'u0_a215',
    group: 'ext_obb_rw',
    isProtected: true,
    content: '[Binary OBB Asset Archive - Apex Legends Mobile]',
  },
  // Download folder
  {
    id: 'dir-download',
    name: 'Download',
    path: '/storage/emulated/0/Download',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwxr-x',
    owner: 'root',
    group: 'sdcard_rw',
  },
  {
    id: 'file-dl-mod1',
    name: 'minecraft_ultrashaders_v2.mcpack',
    path: '/storage/emulated/0/Download/minecraft_ultrashaders_v2.mcpack',
    type: 'file',
    size: 18459200,
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    permissions: '-rw-rw-r--',
    owner: 'u0_a99',
    group: 'sdcard_rw',
    content: '{"format_version": 2, "header": {"name": "Ultra Realism Shaders", "uuid": "7a353bf3-6a9c-4822-861c-8433ecbc6f01", "version": [2, 0, 0]}}',
  },
  {
    id: 'file-dl-pubg-mod',
    name: 'Active.sav',
    path: '/storage/emulated/0/Download/Active.sav',
    type: 'file',
    size: 43100,
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    permissions: '-rw-rw-r--',
    owner: 'u0_a99',
    group: 'sdcard_rw',
    content: '[Ultra 120 FPS Optimized Active.sav Profile for PUBG/BGMI - Shizuku Direct Copy]',
  },
  {
    id: 'file-dl-gow',
    name: 'ULES01505_GOW_100pct_save.zip',
    path: '/storage/emulated/0/Download/ULES01505_GOW_100pct_save.zip',
    type: 'file',
    size: 3240192,
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    permissions: '-rw-rw-r--',
    owner: 'u0_a99',
    group: 'sdcard_rw',
    content: '[ZIP Archive: PSP God of War Ghost of Sparta 100% Completed Save]',
  },
  {
    id: 'file-dl-apex-patch',
    name: 'patch.1043.com.ea.gp.apexmobile.obb',
    path: '/storage/emulated/0/Download/patch.1043.com.ea.gp.apexmobile.obb',
    type: 'file',
    size: 421048200,
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    permissions: '-rw-rw-r--',
    owner: 'u0_a99',
    group: 'sdcard_rw',
    content: '[Apex Mobile Patch OBB File - Version 1043]',
  },
  {
    id: 'file-dl-retroarch',
    name: 'retroarch_optimal_vulkan.cfg',
    path: '/storage/emulated/0/Download/retroarch_optimal_vulkan.cfg',
    type: 'file',
    size: 14890,
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    permissions: '-rw-rw-r--',
    owner: 'u0_a99',
    group: 'sdcard_rw',
    content: '# RetroArch Custom Optimal Settings\nvideo_driver = "vulkan"\ninput_autodetect_enable = "true"\naudio_driver = "opensles"\nvideo_vsync = "true"\nfastforward_ratio = "0.0"',
  },
  // Documents
  {
    id: 'dir-documents',
    name: 'Documents',
    path: '/storage/emulated/0/Documents',
    type: 'directory',
    size: 4096,
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    permissions: 'drwxrwxr-x',
    owner: 'root',
    group: 'sdcard_rw',
  },
  {
    id: 'file-doc-readme',
    name: 'Shizuku_CopyPaste_Guide.txt',
    path: '/storage/emulated/0/Documents/Shizuku_CopyPaste_Guide.txt',
    type: 'file',
    size: 1980,
    updatedAt: new Date().toISOString(),
    permissions: '-rw-rw-r--',
    owner: 'shell',
    group: 'sdcard_rw',
    content: `SHIZUKU FILE COPY PASTER HUB
============================
Bypassing Android 11, 12, 13, 14, 15 Scoped Storage Restrictions:

1. Android Scoped Storage blocks standard apps from reading or writing into:
   - /storage/emulated/0/Android/data
   - /storage/emulated/0/Android/obb

2. With Shizuku active (running under UID 2000 'shell' or UID 0 'root'), this app
   executes direct filesystem operations via Shizuku binder IPC or rish shell.

3. Standard Rish command to copy:
   rish -c "cp -r -f -p '/storage/emulated/0/Download/Active.sav' '/storage/emulated/0/Android/data/com.pubg.imobile/files/'"

4. Permissions check:
   rish -c "chmod -R 775 '/storage/emulated/0/Android/data/com.pubg.imobile/files/'"`,
  },
  // /data/local/tmp
  {
    id: 'dir-data',
    name: 'data',
    path: '/data',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxrwx--x',
    owner: 'system',
    group: 'system',
  },
  {
    id: 'dir-data-local',
    name: 'local',
    path: '/data/local',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'drwxr-x--x',
    owner: 'root',
    group: 'root',
  },
  {
    id: 'dir-data-local-tmp',
    name: 'tmp',
    path: '/data/local/tmp',
    type: 'directory',
    size: 4096,
    updatedAt: new Date().toISOString(),
    permissions: 'rwxrwxrwx',
    owner: 'shell',
    group: 'shell',
  },
  {
    id: 'file-rish',
    name: 'rish',
    path: '/data/local/tmp/rish',
    type: 'file',
    size: 48920,
    updatedAt: new Date().toISOString(),
    permissions: '-rwxr-xr-x',
    owner: 'shell',
    group: 'shell',
    content: '#!/system/bin/sh\n# Rikka Shizuku Shell Client (rish v13.5.4)\nexec /system/bin/app_process -Djava.class.path=/data/local/tmp/rish_shizuku.dex /system/bin rikka.shizuku.shell.ShizukuShellLoader "$@"',
  },
  {
    id: 'file-rish-dex',
    name: 'rish_shizuku.dex',
    path: '/data/local/tmp/rish_shizuku.dex',
    type: 'file',
    size: 124500,
    updatedAt: new Date().toISOString(),
    permissions: '-rw-r--r--',
    owner: 'shell',
    group: 'shell',
    content: '[DEX 039 Executable - Shizuku IPC Binder Interface v13.5]',
  }
];

export class VirtualFileSystem {
  private files: VFile[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.files = JSON.parse(stored);
        return;
      }
    } catch {
      // ignore
    }
    this.files = [...INITIAL_FILES];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.files));
    } catch {
      // quota or private browsing error
    }
  }

  public resetToDefaults() {
    this.files = [...INITIAL_FILES];
    this.saveToStorage();
  }

  public listDirectory(dirPath: string): VFile[] {
    const normalized = this.normalizePath(dirPath);
    return this.files.filter((f) => {
      const parent = this.getParentPath(f.path);
      return parent === normalized;
    }).sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  public getItem(path: string): VFile | undefined {
    const normalized = this.normalizePath(path);
    return this.files.find((f) => f.path === normalized);
  }

  public isProtectedPath(path: string): boolean {
    const normalized = this.normalizePath(path);
    return (
      normalized.startsWith('/storage/emulated/0/Android/data') ||
      normalized.startsWith('/storage/emulated/0/Android/obb') ||
      normalized.startsWith('/sdcard/Android/data') ||
      normalized.startsWith('/sdcard/Android/obb')
    );
  }

  public createDirectory(parentPath: string, name: string): VFile {
    const cleanParent = this.normalizePath(parentPath);
    const cleanName = name.trim().replace(/[\/\\]/g, '_');
    const newPath = cleanParent === '/' ? `/${cleanName}` : `${cleanParent}/${cleanName}`;

    // check if already exists
    const existing = this.getItem(newPath);
    if (existing) {
      throw new Error(`Directory or file '${cleanName}' already exists at this location.`);
    }

    const isProt = this.isProtectedPath(newPath);
    const newDir: VFile = {
      id: 'dir-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      path: newPath,
      type: 'directory',
      size: 4096,
      updatedAt: new Date().toISOString(),
      permissions: isProt ? 'drwxrwx---' : 'drwxrwxr-x',
      owner: isProt ? 'u0_a124' : 'root',
      group: isProt ? 'ext_data_rw' : 'sdcard_rw',
      isProtected: isProt,
    };

    this.files.push(newDir);
    this.saveToStorage();
    return newDir;
  }

  public createFile(parentPath: string, name: string, content = '', size?: number): VFile {
    const cleanParent = this.normalizePath(parentPath);
    const cleanName = name.trim().replace(/[\/\\]/g, '_');
    const newPath = cleanParent === '/' ? `/${cleanName}` : `${cleanParent}/${cleanName}`;

    const existing = this.getItem(newPath);
    if (existing) {
      throw new Error(`File '${cleanName}' already exists.`);
    }

    const isProt = this.isProtectedPath(newPath);
    const actualSize = size !== undefined ? size : new Blob([content]).size;

    const newFile: VFile = {
      id: 'file-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      path: newPath,
      type: 'file',
      size: actualSize,
      updatedAt: new Date().toISOString(),
      permissions: isProt ? '-rw-rw----' : '-rw-rw-r--',
      owner: isProt ? 'u0_a124' : 'shell',
      group: isProt ? 'ext_data_rw' : 'sdcard_rw',
      content,
      isProtected: isProt,
    };

    this.files.push(newFile);
    this.saveToStorage();
    return newFile;
  }

  public deleteItem(path: string): void {
    const normalized = this.normalizePath(path);
    // Delete this item and all descendants if directory
    this.files = this.files.filter(
      (f) => f.path !== normalized && !f.path.startsWith(normalized + '/')
    );
    this.saveToStorage();
  }

  public renameItem(path: string, newName: string): VFile {
    const item = this.getItem(path);
    if (!item) {
      throw new Error('Item not found');
    }
    const cleanName = newName.trim().replace(/[\/\\]/g, '_');
    const parent = this.getParentPath(item.path);
    const newPath = parent === '/' ? `/${cleanName}` : `${parent}/${cleanName}`;

    if (newPath === item.path) return item;

    if (this.getItem(newPath)) {
      throw new Error(`An item named '${cleanName}' already exists.`);
    }

    const oldPath = item.path;
    item.name = cleanName;
    item.path = newPath;
    item.updatedAt = new Date().toISOString();

    // If directory, update all children paths
    if (item.type === 'directory') {
      for (const child of this.files) {
        if (child.path.startsWith(oldPath + '/')) {
          child.path = newPath + child.path.substring(oldPath.length);
        }
      }
    }

    this.saveToStorage();
    return item;
  }

  public chmodItem(path: string, permissions: string): VFile {
    const item = this.getItem(path);
    if (!item) throw new Error('Item not found');
    item.permissions = permissions;
    this.saveToStorage();
    return item;
  }

  public copyItem(
    sourceItem: VFile,
    destDirPath: string,
    conflict: ConflictResolution = 'overwrite'
  ): VFile {
    const cleanDestDir = this.normalizePath(destDirPath);
    let targetName = sourceItem.name;
    let targetPath = cleanDestDir === '/' ? `/${targetName}` : `${cleanDestDir}/${targetName}`;

    const existing = this.getItem(targetPath);
    if (existing) {
      if (conflict === 'skip') {
        return existing;
      }
      if (conflict === 'rename') {
        const dotIndex = targetName.lastIndexOf('.');
        if (dotIndex > 0 && sourceItem.type === 'file') {
          const base = targetName.substring(0, dotIndex);
          const ext = targetName.substring(dotIndex);
          targetName = `${base}_copy_${Date.now().toString().slice(-4)}${ext}`;
        } else {
          targetName = `${targetName}_copy_${Date.now().toString().slice(-4)}`;
        }
        targetPath = cleanDestDir === '/' ? `/${targetName}` : `${cleanDestDir}/${targetName}`;
      } else if (conflict === 'overwrite') {
        this.deleteItem(targetPath);
      }
    }

    const isProt = this.isProtectedPath(targetPath);
    const copied: VFile = {
      ...sourceItem,
      id: 'f-' + Math.random().toString(36).substring(2, 9),
      name: targetName,
      path: targetPath,
      updatedAt: new Date().toISOString(),
      isProtected: isProt,
    };

    this.files.push(copied);

    // If directory, copy recursively
    if (sourceItem.type === 'directory') {
      const children = this.files.filter((f) => f.path.startsWith(sourceItem.path + '/'));
      for (const child of children) {
        const relativeSub = child.path.substring(sourceItem.path.length);
        const childDest = `${targetPath}${relativeSub}`;
        this.files.push({
          ...child,
          id: 'f-' + Math.random().toString(36).substring(2, 9),
          path: childDest,
          isProtected: this.isProtectedPath(childDest),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    this.saveToStorage();
    return copied;
  }

  public moveItem(
    sourceItem: VFile,
    destDirPath: string,
    conflict: ConflictResolution = 'overwrite'
  ): VFile {
    const copied = this.copyItem(sourceItem, destDirPath, conflict);
    this.deleteItem(sourceItem.path);
    return copied;
  }

  public async exportAsZip(folderPath: string): Promise<Blob> {
    const normalized = this.normalizePath(folderPath);
    const zip = new JSZip();

    const descendants = this.files.filter(
      (f) => f.path.startsWith(normalized + '/') || f.path === normalized
    );

    for (const f of descendants) {
      const rel = f.path.substring(normalized.length).replace(/^\//, '');
      if (f.type === 'directory') {
        if (rel) zip.folder(rel);
      } else {
        zip.file(rel || f.name, f.content || `[Simulated Binary Data: ${f.name} - ${f.size} bytes]`);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  public normalizePath(p: string): string {
    if (!p) return '/';
    let clean = p.replace(/\/+/g, '/');
    if (clean.length > 1 && clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    // resolve /sdcard alias to /storage/emulated/0
    if (clean === '/sdcard') return '/storage/emulated/0';
    if (clean.startsWith('/sdcard/')) {
      clean = '/storage/emulated/0/' + clean.substring(8);
    }
    return clean;
  }

  public getParentPath(p: string): string {
    const clean = this.normalizePath(p);
    if (clean === '/' || !clean) return '/';
    const lastSlash = clean.lastIndexOf('/');
    if (lastSlash <= 0) return '/';
    return clean.substring(0, lastSlash);
  }

  public calculateFolderSize(path: string): number {
    const normalized = this.normalizePath(path);
    return this.files
      .filter((f) => f.path.startsWith(normalized + '/') && f.type === 'file')
      .reduce((sum, f) => sum + f.size, 0);
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export const formatPermissionString = (modeStr: string): string => {
  return modeStr;
};

// Singleton instance
export const vfs = new VirtualFileSystem();
