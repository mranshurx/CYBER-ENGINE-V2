export type FileType = 'file' | 'directory';

export interface VFile {
  id: string;
  name: string;
  path: string; // e.g. /storage/emulated/0/Android/data
  type: FileType;
  size: number; // in bytes
  updatedAt: string; // ISO string
  permissions: string; // e.g. "drwxrwx---" or "-rw-rw----"
  owner: string; // e.g. "u0_a124" or "shell"
  group: string; // e.g. "sdcard_rw" or "everybody"
  content?: string; // for text preview or base64
  isProtected?: boolean; // scoped storage restricted like Android/data
  mimeType?: string;
}

export interface TransferItem {
  id: string;
  sourcePath: string;
  destPath: string;
  sourceFile: VFile;
  action: 'copy' | 'move';
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'conflict';
  progress: number; // 0 - 100
  bytesTransferred: number;
  totalBytes: number;
  error?: string;
  timestamp: number;
}

export interface ShizukuState {
  isAvailable: boolean;
  isAuthorized: boolean;
  version: number;
  patchVersion: number;
  uid: number; // 2000 = shell, 0 = root
  mode: 'adb' | 'root' | 'wireless_adb';
  serviceStatus: 'running' | 'stopped' | 'connecting';
  deviceName: string;
  androidVersion: number;
  securityPatch: string;
}

export interface CommandLog {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  exitCode: number;
  isShizuku: boolean;
}

export type ConflictResolution = 'overwrite' | 'skip' | 'rename';

export interface ClipboardState {
  items: VFile[];
  action: 'copy' | 'cut' | null;
  sourceDir: string;
}
