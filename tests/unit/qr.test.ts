import { generateQRMatrix, drawQRMatrix } from '../../src/core/qr';
import { createCanvas } from 'canvas';

describe('QR Generator Module', () => {
  const uri = 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter';

  it('generates a valid QR matrix with default Level M error correction', () => {
    const matrix = generateQRMatrix(uri);
    expect(matrix.size).toBeGreaterThan(20);
    expect(matrix.errorCorrectionLevel).toBe('M');

    // QR finder patterns in corners should be dark
    expect(matrix.isDark(0, 0)).toBe(true);
    expect(matrix.isDark(matrix.size - 1, 0)).toBe(true);
    expect(matrix.isDark(0, matrix.size - 1)).toBe(true);
  });

  it('supports custom error correction level Q', () => {
    const matrix = generateQRMatrix(uri, { errorCorrectionLevel: 'Q' });
    expect(matrix.errorCorrectionLevel).toBe('Q');
  });

  it('draws matrix onto canvas context without error', () => {
    const canvas = createCanvas(300, 300);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    const matrix = generateQRMatrix(uri);

    expect(() => {
      drawQRMatrix(ctx, matrix, 10, 10, 200, '#000000', '#FFFFFF');
    }).not.toThrow();
  });
});
