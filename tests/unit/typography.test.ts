import {
  wrapWords,
  truncateWithEllipsis,
  formatMetadataFields,
  fitAndWrapText,
} from '../../src/core/typography';
import { createCanvas } from 'canvas';

describe('Typography Module', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    const canvas = createCanvas(800, 600);
    ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  });

  describe('wrapWords', () => {
    it('wraps multiple words across lines based on maxWidth', () => {
      ctx.font = '16px sans-serif';
      const text = 'This is a long title that needs to wrap onto multiple lines of text';
      const lines = wrapWords(ctx, text, 150);
      expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        expect(ctx.measureText(line).width).toBeLessThanOrEqual(150);
      }
    });

    it('preserves explicit newlines', () => {
      ctx.font = '16px sans-serif';
      const text = 'Line One\nLine Two';
      const lines = wrapWords(ctx, text, 500);
      expect(lines).toEqual(['Line One', 'Line Two']);
    });
  });

  describe('truncateWithEllipsis', () => {
    it('truncates overflowing text and appends ellipsis', () => {
      ctx.font = '16px sans-serif';
      const text = 'Supercalifragilisticexpialidocious text that will never fit';
      const truncated = truncateWithEllipsis(ctx, text, 100);
      expect(truncated.endsWith('...')).toBe(true);
      expect(ctx.measureText(truncated).width).toBeLessThanOrEqual(100);
    });

    it('leaves text unchanged if it fits', () => {
      ctx.font = '16px sans-serif';
      const text = 'Fits';
      expect(truncateWithEllipsis(ctx, text, 200)).toBe('Fits');
    });
  });

  describe('formatMetadataFields', () => {
    const metadata = {
      Location: 'Shelf 4B',
      Category: 'Sensors',
    };

    it('formats vertical stacking with default separator', () => {
      const lines = formatMetadataFields(metadata, 'vertical', ': ');
      expect(lines).toEqual(['Location: Shelf 4B', 'Category: Sensors']);
    });

    it('formats horizontal orientation with separator and bullet connector', () => {
      const lines = formatMetadataFields(metadata, 'horizontal', ': ');
      expect(lines).toEqual(['Location: Shelf 4B • Category: Sensors']);
    });

    it('returns empty array when no fields present', () => {
      expect(formatMetadataFields({})).toEqual([]);
      expect(formatMetadataFields(undefined)).toEqual([]);
    });
  });

  describe('fitAndWrapText', () => {
    it('scales down font size when text exceeds available height', () => {
      const text = 'Heading One\nHeading Two\nHeading Three\nHeading Four\nHeading Five';
      const result = fitAndWrapText(
        ctx,
        text,
        'sans-serif',
        40, // initial font size
        12, // min font size
        300, // max width
        80, // max height (constrained)
      );

      expect(result.fontSizePx).toBeLessThan(40);
      expect(result.totalHeightPx).toBeLessThanOrEqual(80);
    });

    it('truncates with ellipsis when text overflows at minFontSize', () => {
      const text =
        'Very long note title that has far too many words to fit in a tiny space even at minimum font size';
      const result = fitAndWrapText(
        ctx,
        text,
        'sans-serif',
        16,
        10,
        80, // tight width
        25, // very small height (fits only 1 or 2 lines)
      );

      expect(result.isTruncated).toBe(true);
      const lastLine = result.lines[result.lines.length - 1];
      expect(lastLine).toContain('...');
    });
  });
});
