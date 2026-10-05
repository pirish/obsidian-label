import {
  validateLabel,
  isValidColor,
  validateURIConfig,
  validateQROptions,
} from '../../src/core/validator';
import {
  LabelConfig,
  LabelContent,
  ObsidianURIConfig,
  QRDataURLOptions,
} from '../../src/core/types';

describe('Validator Module', () => {
  const validConfig: LabelConfig = {
    size: { width: 40, height: 30, dpi: 300 },
    layout: {
      qrCodePlacement: 'left',
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
    },
    style: {
      fontFamily: 'sans-serif',
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#333333',
    },
  };

  const validContent: LabelContent = {
    noteTitle: 'Workshop Multimeter',
    obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter',
  };

  it('validates a completely valid configuration and content', () => {
    const result = validateLabel(validConfig, validContent);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe('Dimension Validation', () => {
    it('fails when width is 0 or negative', () => {
      const config = { ...validConfig, size: { ...validConfig.size, width: -5 } };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'size.width', code: 'INVALID_DIMENSIONS' }),
        ]),
      );
    });

    it('fails when DPI is below 72', () => {
      const config = { ...validConfig, size: { ...validConfig.size, dpi: 50 } };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'size.dpi', code: 'INVALID_DPI' }),
        ]),
      );
    });
  });

  describe('Margin Validation', () => {
    it('fails when margins exceed label width', () => {
      const config: LabelConfig = {
        ...validConfig,
        size: { width: 20, height: 20 },
        layout: { margins: { left: 15, right: 10 } },
      };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'layout.margins', code: 'MARGINS_EXCEED_BOUNDS' }),
        ]),
      );
    });

    it('fails when margins are negative', () => {
      const config: LabelConfig = {
        ...validConfig,
        layout: { margins: { top: -1 } },
      };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'layout.margins', code: 'NEGATIVE_MARGINS' }),
        ]),
      );
    });
  });

  describe('Color and Style Validation', () => {
    it('validates hex colors correctly', () => {
      expect(isValidColor('#FFF')).toBe(true);
      expect(isValidColor('#FFFFFF')).toBe(true);
      expect(isValidColor('#12345678')).toBe(true);
      expect(isValidColor('invalid-color')).toBe(false);
    });

    it('fails when font color is invalid hex', () => {
      const config = {
        ...validConfig,
        style: { ...validConfig.style, fontColor: 'not-a-color' },
      };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'style.fontColor', code: 'INVALID_COLOR' }),
        ]),
      );
    });
  });

  describe('Content Validation', () => {
    it('fails when note title is empty or whitespace', () => {
      const content = { ...validContent, noteTitle: '   ' };
      const result = validateLabel(validConfig, content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'noteTitle', code: 'EMPTY_TITLE' }),
        ]),
      );
    });

    it('fails when obsidian URI does not start with obsidian://', () => {
      const content = { ...validContent, obsidianUri: 'https://example.com' };
      const result = validateLabel(validConfig, content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'obsidianUri', code: 'INVALID_URI_SCHEME' }),
        ]),
      );
    });
  });

  describe('URI Configuration Validation', () => {
    it('passes for valid vault and file path', () => {
      const config: ObsidianURIConfig = {
        vault: 'My Vault',
        filePath: 'Notes/Project.md',
      };
      const result = validateURIConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes with valid heading or block anchor subpath', () => {
      expect(
        validateURIConfig({ vault: 'V', filePath: 'N.md', subpath: '#Overview' }).isValid,
      ).toBe(true);
      expect(validateURIConfig({ vault: 'V', filePath: 'N.md', subpath: '^abc123' }).isValid).toBe(
        true,
      );
    });

    it('fails when vault name is empty or not string', () => {
      expect(validateURIConfig({ vault: '', filePath: 'N.md' }).errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'EMPTY_VAULT' })]),
      );
      expect(validateURIConfig({ vault: '   ', filePath: 'N.md' }).errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'EMPTY_VAULT' })]),
      );
      expect(
        validateURIConfig({ vault: 123 as unknown as string, filePath: 'N.md' }).errors,
      ).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'INVALID_VAULT_TYPE' })]));
    });

    it('fails when filePath is empty or not string', () => {
      expect(validateURIConfig({ vault: 'V', filePath: '' }).errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'EMPTY_FILE_PATH' })]),
      );
      expect(validateURIConfig({ vault: 'V', filePath: '   ' }).errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'EMPTY_FILE_PATH' })]),
      );
      expect(validateURIConfig({ vault: 'V', filePath: null as unknown as string }).errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_FILE_PATH_TYPE' })]),
      );
    });

    it('fails when subpath has invalid format', () => {
      expect(
        validateURIConfig({ vault: 'V', filePath: 'N.md', subpath: 'invalid-anchor' }).errors,
      ).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'INVALID_SUBPATH' })]));
    });
  });

  describe('QR Options Validation', () => {
    it('passes for undefined options or empty options', () => {
      expect(validateQROptions(undefined).isValid).toBe(true);
      expect(validateQROptions({}).isValid).toBe(true);
    });

    it('passes for all valid error correction levels', () => {
      const levels: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H'];
      for (const level of levels) {
        expect(validateQROptions({ errorCorrectionLevel: level }).isValid).toBe(true);
      }
    });

    it('fails for invalid error correction level', () => {
      const result = validateQROptions({ errorCorrectionLevel: 'X' as unknown as 'M' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_EC_LEVEL' })]),
      );
    });

    it('validates margin non-negative integer', () => {
      expect(validateQROptions({ margin: 0 }).isValid).toBe(true);
      expect(validateQROptions({ margin: 4 }).isValid).toBe(true);
      expect(validateQROptions({ margin: -1 }).isValid).toBe(false);
      expect(validateQROptions({ margin: 1.5 }).isValid).toBe(false);
    });

    it('validates darkColor and lightColor', () => {
      expect(validateQROptions({ darkColor: '#000000', lightColor: '#FFFFFF' }).isValid).toBe(true);
      expect(validateQROptions({ darkColor: 'invalid' }).isValid).toBe(false);
      expect(validateQROptions({ lightColor: 'invalid' }).isValid).toBe(false);
    });

    it('validates width for QRDataURLOptions', () => {
      const validUrl: QRDataURLOptions = { width: 300 };
      expect(validateQROptions(validUrl).isValid).toBe(true);

      const invalidUrl: QRDataURLOptions = { width: -50 };
      expect(validateQROptions(invalidUrl).isValid).toBe(false);
      expect(validateQROptions(invalidUrl).errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_QR_WIDTH' })]),
      );
    });

    it('integrates into validateLabel when qrOptions are supplied', () => {
      const config: LabelConfig = {
        ...validConfig,
        qrOptions: { errorCorrectionLevel: 'INVALID' as unknown as 'M' },
      };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_EC_LEVEL' })]),
      );
    });
  });
});
