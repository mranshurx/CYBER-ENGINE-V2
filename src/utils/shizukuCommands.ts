import { vfs } from './fileSystem';
import { CommandLog, ShizukuState } from '../types';

export const generateRishCopyCommand = (
  sourcePath: string,
  destPath: string,
  recursive = true,
  preserveAttributes = true
): string => {
  const flags = ['-f'];
  if (recursive) flags.push('-r');
  if (preserveAttributes) flags.push('-p');

  return `rish -c "cp ${flags.join(' ')} '${sourcePath}' '${destPath}'"`;
};

export const generateRishMoveCommand = (sourcePath: string, destPath: string): string => {
  return `rish -c "mv -f '${sourcePath}' '${destPath}'"`;
};

export const generateRishChmodCommand = (targetPath: string, mode = '775', recursive = true): string => {
  const flag = recursive ? '-R ' : '';
  return `rish -c "chmod ${flag}${mode} '${targetPath}'"`;
};

export const generateRishMkdirCommand = (dirPath: string): string => {
  return `rish -c "mkdir -p '${dirPath}'"`;
};

export const generateRishRemoveCommand = (targetPath: string, recursive = true): string => {
  const flag = recursive ? '-rf' : '-f';
  return `rish -c "rm ${flag} '${targetPath}'"`;
};

export const generateTermuxScript = (sourcePath: string, destPath: string, isMove = false): string => {
  const action = isMove ? 'mv -f' : 'cp -r -f -p';
  return `#!/data/data/com.termux/files/usr/bin/bash
# Shizuku File Automation Script for Termux
# Make sure Shizuku is running and rish is configured

if ! command -v rish &> /dev/null; then
    echo "[-] rish not found! Please run Shizuku and copy /data/local/tmp/rish to Termux path."
    exit 1
fi

echo "[*] Initializing privileged Shizuku file transfer..."
echo "[*] Source: ${sourcePath}"
echo "[*] Destination: ${destPath}"

rish -c "${action} '${sourcePath}' '${destPath}'"
STATUS=$?

if [ $STATUS -eq 0 ]; then
    echo "[+] Transfer completed successfully via UID 2000 (shell)."
    rish -c "chmod -R 775 '${destPath}'"
    echo "[+] Permissions synchronized (775)."
else
    echo "[-] Transfer failed with exit code $STATUS"
fi
`;
};

export const generateAdbPcScript = (sourcePath: string, destPath: string, isMove = false): string => {
  const action = isMove ? 'mv -f' : 'cp -r -f -p';
  return `# Run in Windows Command Prompt, PowerShell, or macOS/Linux Terminal
adb devices
adb shell "${action} '${sourcePath}' '${destPath}'"
adb shell "chmod -R 775 '${destPath}'"
echo "Done!"`;
};

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export const executeShizukuShell = async (
  rawCmd: string,
  state: ShizukuState
): Promise<ExecutionResult> => {
  if (!state.isAvailable || !state.isAuthorized) {
    return {
      stdout: '',
      stderr: 'sh: rish: Shizuku service is not active or authorization was denied. Please start Shizuku in Android settings.',
      exitCode: 126,
    };
  }

  // Artificial short delay to emulate IPC execution
  await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 70));

  const trimmed = rawCmd.trim();

  // Strip `rish -c "..."` wrapper if present
  let cmd = trimmed;
  if (cmd.startsWith('rish -c "') && cmd.endsWith('"')) {
    cmd = cmd.slice(9, -1);
  } else if (cmd.startsWith("rish -c '") && cmd.endsWith("'")) {
    cmd = cmd.slice(9, -1);
  } else if (cmd.startsWith('rish ')) {
    cmd = cmd.slice(5);
  } else if (cmd.startsWith('adb shell ')) {
    cmd = cmd.slice(10);
  }

  // Parse simple Unix commands: ls, cp, mv, rm, mkdir, chmod, id, whoami, pwd, cat, df
  const parts = cmd.split(/\s+/);
  const command = parts[0];

  try {
    switch (command) {
      case 'id':
        return {
          stdout: `uid=${state.uid}(${state.uid === 0 ? 'root' : 'shell'}) gid=${state.uid}(${state.uid === 0 ? 'root' : 'shell'}) groups=1004(input),1007(log),1011(adb),1015(sdcard_rw),1028(sdcard_r),3001(net_bt_admin),3002(net_bt),3003(inet),3006(net_bw_stats),3009(readproc),3011(uhid),3012(ext_data_rw),3013(ext_obb_rw) context=u:r:shell:s0`,
          stderr: '',
          exitCode: 0,
        };

      case 'whoami':
        return {
          stdout: state.uid === 0 ? 'root' : 'shell',
          stderr: '',
          exitCode: 0,
        };

      case 'pwd':
        return {
          stdout: '/storage/emulated/0',
          stderr: '',
          exitCode: 0,
        };

      case 'df':
      case 'df -h':
        return {
          stdout: `Filesystem               Size  Used Avail Use% Mounted on
/dev/block/dm-0          112G   68G   44G  61% /data
/data/media              112G   68G   44G  61% /storage/emulated
tmpfs                    5.7G  1.2M  5.7G   1% /data/local/tmp`,
          stderr: '',
          exitCode: 0,
        };

      case 'ls': {
        const targetPath = parts.find((p) => p.startsWith('/')) || '/storage/emulated/0';
        const items = vfs.listDirectory(targetPath);
        const isLong = parts.some((p) => p.includes('l'));
        if (isLong) {
          const lines = items.map((i) => {
            const date = new Date(i.updatedAt).toLocaleDateString();
            return `${i.permissions} 1 ${i.owner} ${i.group} ${String(i.size).padStart(10, ' ')} ${date} ${i.name}`;
          });
          return {
            stdout: `total ${items.length}\n` + lines.join('\n'),
            stderr: '',
            exitCode: 0,
          };
        } else {
          return {
            stdout: items.map((i) => i.name).join('  '),
            stderr: '',
            exitCode: 0,
          };
        }
      }

      case 'cp': {
        // cp -r -f -p src dest
        const cleanArgs = parts.filter((p) => !p.startsWith('-')).slice(1);
        if (cleanArgs.length < 2) {
          return { stdout: '', stderr: 'cp: missing file operand', exitCode: 1 };
        }
        const src = cleanArgs[0].replace(/['"]/g, '');
        const dest = cleanArgs[1].replace(/['"]/g, '');
        const srcItem = vfs.getItem(src);
        if (!srcItem) {
          return { stdout: '', stderr: `cp: '${src}': No such file or directory`, exitCode: 1 };
        }
        vfs.copyItem(srcItem, dest, 'overwrite');
        return {
          stdout: `[Shizuku] '${src}' -> '${dest}' copied successfully.`,
          stderr: '',
          exitCode: 0,
        };
      }

      case 'mv': {
        const cleanArgs = parts.filter((p) => !p.startsWith('-')).slice(1);
        if (cleanArgs.length < 2) {
          return { stdout: '', stderr: 'mv: missing file operand', exitCode: 1 };
        }
        const src = cleanArgs[0].replace(/['"]/g, '');
        const dest = cleanArgs[1].replace(/['"]/g, '');
        const srcItem = vfs.getItem(src);
        if (!srcItem) {
          return { stdout: '', stderr: `mv: '${src}': No such file or directory`, exitCode: 1 };
        }
        vfs.moveItem(srcItem, dest, 'overwrite');
        return {
          stdout: `[Shizuku] '${src}' -> '${dest}' moved successfully.`,
          stderr: '',
          exitCode: 0,
        };
      }

      case 'rm': {
        const target = parts.find((p) => p.startsWith('/') || p.startsWith('.'))?.replace(/['"]/g, '');
        if (!target) {
          return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 };
        }
        vfs.deleteItem(target);
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'mkdir': {
        const target = parts.find((p) => p.startsWith('/') || p.startsWith('.'))?.replace(/['"]/g, '');
        if (!target) {
          return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 };
        }
        const parent = vfs.getParentPath(target);
        const name = target.split('/').filter(Boolean).pop() || 'folder';
        vfs.createDirectory(parent, name);
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'chmod': {
        const mode = parts.find((p) => /^\d{3,4}$/.test(p)) || '775';
        const target = parts.find((p) => p.startsWith('/') || p.startsWith('.'))?.replace(/['"]/g, '');
        if (!target) {
          return { stdout: '', stderr: 'chmod: missing operand', exitCode: 1 };
        }
        const permString = mode.endsWith('777')
          ? '-rwxrwxrwx'
          : mode.endsWith('775')
          ? '-rwxrwxr-x'
          : '-rw-rw-r--';
        vfs.chmodItem(target, permString);
        return {
          stdout: `[Shizuku] Changed mode of '${target}' to ${mode}`,
          stderr: '',
          exitCode: 0,
        };
      }

      case 'cat': {
        const target = parts.find((p) => p.startsWith('/') || p.startsWith('.'))?.replace(/['"]/g, '');
        if (!target) {
          return { stdout: '', stderr: 'cat: missing operand', exitCode: 1 };
        }
        const item = vfs.getItem(target);
        if (!item) {
          return { stdout: '', stderr: `cat: ${target}: No such file or directory`, exitCode: 1 };
        }
        return {
          stdout: item.content || `[Binary data: ${item.size} bytes]`,
          stderr: '',
          exitCode: 0,
        };
      }

      default:
        return {
          stdout: `[Shizuku Shell v13.5] Process exited with code 0: '${cmd}' executed.`,
          stderr: '',
          exitCode: 0,
        };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      stdout: '',
      stderr: `rish: ${errorMsg}`,
      exitCode: 1,
    };
  }
};
