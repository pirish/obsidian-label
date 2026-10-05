import { generateQRMatrix, generateQRDataURL, drawQRMatrix } from '../../src/core/qr';
import { createCanvas } from 'canvas';

describe('QR Generator Module', () => {
  const uri = 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter';

  describe('User Story 1 MVP Tests', () => {
    it('generates a valid QR matrix with default Level M error correction', () => {
      const matrix = generateQRMatrix(uri);
      expect(matrix.size).toBeGreaterThan(20);
      expect(matrix.errorCorrectionLevel).toBe('M');

      // QR finder patterns in corners should be dark
      expect(matrix.isDark(0, 0)).toBe(true);
      expect(matrix.isDark(matrix.size - 1, 0)).toBe(true);
      expect(matrix.isDark(0, matrix.size - 1)).toBe(true);
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

  describe('User Story 3: Durability & Scaling', () => {
    it('supports all selectable error correction levels (L, M, Q, H)', () => {
      const matrixL = generateQRMatrix(uri, { errorCorrectionLevel: 'L' });
      const matrixM = generateQRMatrix(uri, { errorCorrectionLevel: 'M' });
      const matrixQ = generateQRMatrix(uri, { errorCorrectionLevel: 'Q' });
      const matrixH = generateQRMatrix(uri, { errorCorrectionLevel: 'H' });

      expect(matrixL.errorCorrectionLevel).toBe('L');
      expect(matrixM.errorCorrectionLevel).toBe('M');
      expect(matrixQ.errorCorrectionLevel).toBe('Q');
      expect(matrixH.errorCorrectionLevel).toBe('H');

      // Higher error correction levels require equal or larger matrix dimensions for same payload
      expect(matrixH.size).toBeGreaterThanOrEqual(matrixL.size);
    });

    it('throws error when invalid error correction level is passed to generateQRMatrix', () => {
      expect(() => {
        generateQRMatrix(uri, { errorCorrectionLevel: 'INVALID' as unknown as 'M' });
      }).toThrow('Error correction level must be one of: L, M, Q, H.');
    });

    it('draws matrix with quiet-zone margin offset correctly', () => {
      const canvas = createCanvas(300, 300);
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
      const matrix = generateQRMatrix(uri);

      expect(() => {
        drawQRMatrix(ctx, matrix, 10, 10, 200, '#000000', '#FFFFFF', 2);
      }).not.toThrow();
    });

    it('asynchronously generates a Base64 PNG data URL', async () => {
      const dataUrl = await generateQRDataURL(uri);
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl.length).toBeGreaterThan(100);
    });

    it('generates Base64 data URL with custom options (width, errorCorrectionLevel, colors, margin)', async () => {
      const dataUrl = await generateQRDataURL(uri, {
        width: 400,
        errorCorrectionLevel: 'H',
        margin: 2,
        darkColor: '#123456',
        lightColor: '#FAFAFA',
      });

      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('throws error when invalid options are passed to generateQRDataURL', async () => {
      await expect(generateQRDataURL(uri, { margin: -2 })).rejects.toThrow(
        'QR margin must be a non-negative integer.',
      );
    });
  });
});
