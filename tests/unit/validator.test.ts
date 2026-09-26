import { validateLabel, isValidColor } from '../../src/core/validator';
import { LabelConfig, LabelContent } from '../../src/core/types';

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
        ])
      );
    });

    it('fails when DPI is below 72', () => {
      const config = { ...validConfig, size: { ...validConfig.size, dpi: 50 } };
      const result = validateLabel(config, validContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'size.dpi', code: 'INVALID_DPI' }),
        ])
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
        ])
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
        ])
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
        ])
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
        ])
      );
    });

    it('fails when obsidian URI does not start with obsidian://', () => {
      const content = { ...validContent, obsidianUri: 'https://example.com' };
      const result = validateLabel(validConfig, content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'obsidianUri', code: 'INVALID_URI_SCHEME' }),
        ])
      );
    });
  });
});
