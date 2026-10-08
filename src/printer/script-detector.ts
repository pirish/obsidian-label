import * as fs from 'fs';
import * as path from 'path';
import { PrintScriptInfo, ScriptType } from './types';
import { detectScriptType } from './command-builder';

export interface ScriptDetectorOptions {
  /** Optional custom path override */
  customPath?: string;

  /** Vault base filesystem path */
  vaultBasePath?: string;

  /** Target platform override for testing ('win32' | 'linux' | 'darwin') */
  platform?: string;

  /** Custom file existence checker for testing/mocking */
  fileExists?: (path: string) => boolean;
}

/**
 * Resolves appropriate print helper script from custom path or bundled defaults.
 */
export function detectPrintScript(options: ScriptDetectorOptions = {}): PrintScriptInfo | null {
  const fileExists = options.fileExists || fs.existsSync;
  const platform =
    options.platform || (typeof process !== 'undefined' ? process.platform : 'linux');
  const customPath = options.customPath?.trim();

  // 1. Tier 1: Explicit user-configured custom path
  if (customPath && customPath.length > 0) {
    const exists = fileExists(customPath);
    const scriptType = detectScriptType(customPath);
    return {
      scriptPath: customPath,
      scriptType,
      exists,
    };
  }

  // 2. Tier 2: Auto-detect bundled script matching host OS
  const scriptName = platform === 'win32' ? 'print-label.ps1' : 'print-label.sh';
  const scriptType: ScriptType = platform === 'win32' ? 'powershell' : 'bash';

  const candidates: string[] = [];

  if (options.vaultBasePath) {
    candidates.push(
      path.join(
        options.vaultBasePath,
        '.obsidian',
        'plugins',
        'obsidian-label',
        'scripts',
        scriptName,
      ),
    );
    candidates.push(path.join(options.vaultBasePath, 'scripts', scriptName));
  }

  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    candidates.push(path.join(process.cwd(), 'scripts', scriptName));
  }

  for (const candidate of candidates) {
    try {
      if (fileExists(candidate)) {
        return {
          scriptPath: candidate,
          scriptType,
          exists: true,
        };
      }
    } catch {
      // Continue searching next candidate
    }
  }

  return null;
}
