import { generateObsidianURI, generateNativeObsidianURI, encodeURIParam } from '../../src/core/uri';
import { MinimalObsidianApp, MinimalTFile } from '../../src/core/types';

describe('Obsidian URI Generator Module', () => {
  describe('Standard URI Generation (US1 - MVP)', () => {
    it('generates a valid obsidian://open URI for nested paths', () => {
      const uri = generateObsidianURI('Personal', 'Workshop/Tools/Multimeter.md');
      expect(uri).toBe('obsidian://open?vault=Personal&file=Workshop%2FTools%2FMultimeter.md');
    });

    it('generates a valid URI for root-level notes without leading slash', () => {
      const uri = generateObsidianURI('Personal', 'MyNote.md');
      expect(uri).toBe('obsidian://open?vault=Personal&file=MyNote.md');
    });

    it('strips leading forward and backward slashes from relative file paths', () => {
      expect(generateObsidianURI('Vault', '/Notes/Doc.md')).toBe(
        'obsidian://open?vault=Vault&file=Notes%2FDoc.md',
      );
      expect(generateObsidianURI('Vault', '///Notes/Doc.md')).toBe(
        'obsidian://open?vault=Vault&file=Notes%2FDoc.md',
      );
      expect(generateObsidianURI('Vault', '\\Notes\\Doc.md')).toBe(
        'obsidian://open?vault=Vault&file=Notes%2FDoc.md',
      );
    });

    it('throws an error for empty or invalid vault name', () => {
      expect(() => generateObsidianURI('', 'Note.md')).toThrow('Vault name must not be empty.');
      expect(() => generateObsidianURI('   ', 'Note.md')).toThrow('Vault name must not be empty.');
    });

    it('throws an error for empty or invalid file path', () => {
      expect(() => generateObsidianURI('Vault', '')).toThrow('File path must not be empty.');
      expect(() => generateObsidianURI('Vault', '   ')).toThrow('File path must not be empty.');
    });
  });

  describe('Native Obsidian API Integration (US1 - MVP)', () => {
    const mockFile: MinimalTFile = {
      path: 'Hardware/3D Printer.md',
      name: '3D Printer.md',
      basename: '3D Printer',
      extension: 'md',
    };

    it('calls app.getObsidianUrl when app is available', () => {
      const mockApp: MinimalObsidianApp = {
        getObsidianUrl: jest
          .fn()
          .mockReturnValue('obsidian://open?vault=Lab&file=Hardware%2F3D%20Printer.md'),
      };

      const uri = generateNativeObsidianURI(mockApp, mockFile);
      expect(mockApp.getObsidianUrl).toHaveBeenCalledWith(mockFile);
      expect(uri).toBe('obsidian://open?vault=Lab&file=Hardware%2F3D%20Printer.md');
    });

    it('falls back to generateObsidianURI when app is undefined', () => {
      const uri = generateNativeObsidianURI(undefined, mockFile, 'FallbackVault');
      expect(uri).toBe('obsidian://open?vault=FallbackVault&file=Hardware%2F3D%20Printer.md');
    });

    it('throws error when app is undefined and no vaultFallback is provided', () => {
      expect(() => generateNativeObsidianURI(undefined, mockFile)).toThrow(
        'Cannot generate Obsidian URI without an active App instance or vaultFallback.',
      );
    });
  });

  describe('RFC 3986 Parameter Encoding Helper', () => {
    it('properly encodes standard and unreserved characters', () => {
      expect(encodeURIParam('Hello World')).toBe('Hello%20World');
      expect(encodeURIParam('foo&bar=baz+qux')).toBe('foo%26bar%3Dbaz%2Bqux');
      expect(encodeURIParam("user's (special) *item*!")).toBe(
        'user%27s%20%28special%29%20%2Aitem%2A%21',
      );
    });
  });

  describe('Special Characters, Spaces & Unicode (US2)', () => {
    it('handles spaces and ampersands in vault names and file paths', () => {
      const uri = generateObsidianURI('Work & Life', 'Projects/C++ & Rust/Notes 2026.md');
      expect(uri).toBe(
        'obsidian://open?vault=Work%20%26%20Life&file=Projects%2FC%2B%2B%20%26%20Rust%2FNotes%202026.md',
      );
    });

    it('handles Unicode and emoji glyphs accurately without corruption', () => {
      const uri = generateObsidianURI('Reisen', 'München/Reiseführer 🇩🇪.md');
      expect(uri).toBe(
        'obsidian://open?vault=Reisen&file=M%C3%BCnchen%2FReisef%C3%BChrer%20%F0%9F%87%A9%F0%9F%87%AA.md',
      );
      // Verify URL decoding matches original UTF-8 text
      const parsed = new URL(uri);
      expect(parsed.searchParams.get('vault')).toBe('Reisen');
      expect(parsed.searchParams.get('file')).toBe('München/Reiseführer 🇩🇪.md');
    });

    it('handles deeply nested directories without truncation', () => {
      const nestedPath = 'L1/L2/L3/L4/L5/L6/L7/L8/L9/L10/L11/L12/DeeplyNestedNote.md';
      const uri = generateObsidianURI('DeepVault', nestedPath);
      expect(uri).toContain(
        'L1%2FL2%2FL3%2FL4%2FL5%2FL6%2FL7%2FL8%2FL9%2FL10%2FL11%2FL12%2FDeeplyNestedNote.md',
      );

      const parsed = new URL(uri);
      expect(parsed.searchParams.get('file')).toBe(nestedPath);
    });

    it('attaches heading subpath anchor correctly', () => {
      const uri = generateObsidianURI('MyVault', 'Projects/App.md', '#Technical Architecture');
      expect(uri).toBe(
        'obsidian://open?vault=MyVault&file=Projects%2FApp.md%23Technical%20Architecture',
      );

      const parsed = new URL(uri);
      expect(parsed.searchParams.get('file')).toBe('Projects/App.md#Technical Architecture');
    });

    it('attaches block identifier subpath anchor correctly', () => {
      const uri = generateObsidianURI('MyVault', 'Projects/App.md', '^summary-block');
      expect(uri).toBe('obsidian://open?vault=MyVault&file=Projects%2FApp.md%5Esummary-block');

      const parsed = new URL(uri);
      expect(parsed.searchParams.get('file')).toBe('Projects/App.md^summary-block');
    });
  });
});
