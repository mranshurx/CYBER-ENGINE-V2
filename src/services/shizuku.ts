import { registerPlugin, Capacitor } from '@capacitor/core';

export interface ShizukuStatus {
  isAndroid: boolean;
  shizukuAvailable: boolean;
  shizukuPermission: boolean;
  shizukuVersion?: number;
  shizukuUid?: number;
  rootAvailable: boolean;
}

export interface PasteFileItem {
  name: string;
  content: string;
  isBase64?: boolean;
}

export interface PasteResult {
  success: boolean;
  method: 'shizuku' | 'root' | 'direct' | 'simulation';
  count: number;
  targetDir: string;
  message: string;
  output?: string;
}

export interface ShizukuPluginInterface {
  checkStatus(): Promise<ShizukuStatus>;
  requestPermission(): Promise<{ granted: boolean; message?: string }>;
  pasteFiles(options: { targetDir: string; files: PasteFileItem[] }): Promise<PasteResult>;
  openShizuku(): Promise<{ opened: boolean; message?: string }>;
}

const ShizukuNative = registerPlugin<ShizukuPluginInterface>('ShizukuPlugin');

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const checkShizukuStatus = async (): Promise<ShizukuStatus> => {
  if (isNativeAndroid()) {
    try {
      return await ShizukuNative.checkStatus();
    } catch (err) {
      console.warn('Shizuku checkStatus native call failed:', err);
      return {
        isAndroid: true,
        shizukuAvailable: false,
        shizukuPermission: false,
        rootAvailable: false,
      };
    }
  }

  // Web Browser Simulation
  return {
    isAndroid: false,
    shizukuAvailable: true,
    shizukuPermission: true,
    shizukuVersion: 13,
    shizukuUid: 2000,
    rootAvailable: false,
  };
};

export const requestShizukuPermission = async (): Promise<{ granted: boolean; message?: string }> => {
  if (isNativeAndroid()) {
    try {
      return await ShizukuNative.requestPermission();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { granted: false, message: msg };
    }
  }

  return { granted: true, message: 'Browser simulation: Permission granted' };
};

export const openShizukuApp = async (): Promise<{ opened: boolean; message?: string }> => {
  if (isNativeAndroid()) {
    try {
      return await ShizukuNative.openShizuku();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { opened: false, message: msg };
    }
  }

  window.open('https://shizuku.rikka.app/', '_blank');
  return { opened: true, message: 'Opened Shizuku guide' };
};

export const pasteFilesToDestination = async (
  targetDir: string,
  files: PasteFileItem[]
): Promise<PasteResult> => {
  if (isNativeAndroid()) {
    return await ShizukuNative.pasteFiles({ targetDir, files });
  }

  // Web fallback simulation
  return {
    success: true,
    method: 'simulation',
    count: files.length,
    targetDir,
    message: `[Web Preview] Simulated paste of ${files.length} file(s) into ${targetDir}`,
  };
};
