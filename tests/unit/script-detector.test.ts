import * as path from 'path';
import { detectPrintScript } from '../../src/printer/script-detector';

describe('Script Detector (Foundational)', () => {
  it('resolves explicit custom path and verifies existence', () => {
    const existingCustom = '/home/user/custom-print.sh';
    const mockFileExists = (p: string) => p === existingCustom;

    const detected = detectPrintScript({
      customPath: existingCustom,
      fileExists: mockFileExists,
    });

    expect(detected).toEqual({
      scriptPath: existingCustom,
      scriptType: 'bash',
      exists: true,
    });
  });

  it('marks non-existent custom path as exists: false', () => {
    const missingCustom = '/missing/path/print.ps1';
    const mockFileExists = () => false;

    const detected = detectPrintScript({
      customPath: missingCustom,
      fileExists: mockFileExists,
    });

    expect(detected).toEqual({
      scriptPath: missingCustom,
      scriptType: 'powershell',
      exists: false,
    });
  });

  it('auto-detects bundled Bash script for Linux / macOS in plugin directory', () => {
    const vaultPath = '/home/user/Vault';
    const expectedScript = path.join(
      vaultPath,
      '.obsidian',
      'plugins',
      'obsidian-label',
      'scripts',
      'print-label.sh',
    );

    const mockFileExists = (p: string) => p === expectedScript;

    const detected = detectPrintScript({
      vaultBasePath: vaultPath,
      platform: 'linux',
      fileExists: mockFileExists,
    });

    expect(detected).toEqual({
      scriptPath: expectedScript,
      scriptType: 'bash',
      exists: true,
    });
  });

  it('auto-detects bundled PowerShell script for Windows in plugin directory', () => {
    const vaultPath = 'C:\\Vault';
    const expectedScript = path.join(
      vaultPath,
      '.obsidian',
      'plugins',
      'obsidian-label',
      'scripts',
      'print-label.ps1',
    );

    const mockFileExists = (p: string) => p === expectedScript;

    const detected = detectPrintScript({
      vaultBasePath: vaultPath,
      platform: 'win32',
      fileExists: mockFileExists,
    });

    expect(detected).toEqual({
      scriptPath: expectedScript,
      scriptType: 'powershell',
      exists: true,
    });
  });

  it('falls back to repository root scripts directory if plugin directory not found', () => {
    const repoScript = path.join(process.cwd(), 'scripts', 'print-label.sh');
    const mockFileExists = (p: string) => p === repoScript;

    const detected = detectPrintScript({
      vaultBasePath: '/empty/vault',
      platform: 'darwin',
      fileExists: mockFileExists,
    });

    expect(detected).toEqual({
      scriptPath: repoScript,
      scriptType: 'bash',
      exists: true,
    });
  });

  it('returns null if no candidate script file exists on disk', () => {
    const mockFileExists = () => false;

    const detected = detectPrintScript({
      vaultBasePath: '/empty/vault',
      fileExists: mockFileExists,
    });

    expect(detected).toBeNull();
  });
});
