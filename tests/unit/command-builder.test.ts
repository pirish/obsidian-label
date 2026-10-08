import {
  buildPrintCommand,
  detectScriptType,
  escapeQuotes,
} from '../../src/printer/command-builder';

describe('Command Builder (Foundational)', () => {
  describe('detectScriptType', () => {
    it('detects bash script dialect from .sh extension', () => {
      expect(detectScriptType('scripts/print-label.sh')).toBe('bash');
      expect(detectScriptType('/opt/custom/print.SH')).toBe('bash');
    });

    it('detects powershell script dialect from .ps1 extension', () => {
      expect(detectScriptType('scripts\\print-label.ps1')).toBe('powershell');
      expect(detectScriptType('C:\\tools\\print.PS1')).toBe('powershell');
    });

    it('returns unknown for unsupported extensions or empty strings', () => {
      expect(detectScriptType('print.bat')).toBe('unknown');
      expect(detectScriptType('print.py')).toBe('unknown');
      expect(detectScriptType('')).toBe('unknown');
    });
  });

  describe('escapeQuotes', () => {
    it('escapes embedded double-quotes', () => {
      expect(escapeQuotes('Brother "QL-800"')).toBe('Brother \\"QL-800\\"');
      expect(escapeQuotes('standard text')).toBe('standard text');
    });

    it('returns empty string on empty input', () => {
      expect(escapeQuotes('')).toBe('');
    });
  });

  describe('buildPrintCommand', () => {
    it('builds standard Bash command with safely quoted arguments', () => {
      const command = buildPrintCommand(
        'scripts/print-label.sh',
        'vault/Inventory/Oscilloscope.pdf',
        'Dymo-LabelWriter-450',
      );
      expect(command).toBe(
        'bash "scripts/print-label.sh" "vault/Inventory/Oscilloscope.pdf" "Dymo-LabelWriter-450"',
      );
    });

    it('builds Windows PowerShell command with ExecutionPolicy Bypass', () => {
      const command = buildPrintCommand(
        'C:\\Obsidian\\plugins\\obsidian-label\\scripts\\print-label.ps1',
        'C:\\Vault\\Notes\\Item A.pdf',
        'Brother QL-800',
      );
      expect(command).toBe(
        'powershell -ExecutionPolicy Bypass -File "C:\\Obsidian\\plugins\\obsidian-label\\scripts\\print-label.ps1" -PdfPath "C:\\Vault\\Notes\\Item A.pdf" -PrinterName "Brother QL-800"',
      );
    });

    it('escapes embedded quotes in file paths and printer names', () => {
      const command = buildPrintCommand(
        '/scripts/print.sh',
        '/path/to/"special" item.pdf',
        'Label "Thermal" Printer',
      );
      expect(command).toBe(
        'bash "/scripts/print.sh" "/path/to/\\"special\\" item.pdf" "Label \\"Thermal\\" Printer"',
      );
    });

    it('throws when required parameters are missing', () => {
      expect(() => buildPrintCommand('', 'label.pdf', 'Printer')).toThrow(
        'Script path is required',
      );
      expect(() => buildPrintCommand('print.sh', '', 'Printer')).toThrow('PDF path is required');
      expect(() => buildPrintCommand('print.sh', 'label.pdf', '')).toThrow(
        'Printer name is required',
      );
    });

    it('throws when script type is unsupported', () => {
      expect(() => buildPrintCommand('print.exe', 'label.pdf', 'Printer')).toThrow(
        'Unsupported script type',
      );
    });
  });
});
