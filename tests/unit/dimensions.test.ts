import {
  mmToPixels,
  pixelsToMm,
  pointsToPixels,
  calculatePixelDimensions,
  DEFAULT_DPI,
} from '../../src/core/dimensions';

describe('Dimensions Module', () => {
  describe('mmToPixels', () => {
    it('accurately converts 40mm at 300 DPI (Phomemo width)', () => {
      // (40 / 25.4) * 300 = 472.44... -> 472
      expect(mmToPixels(40, 300)).toBe(472);
    });

    it('accurately converts 30mm at 300 DPI (Phomemo height)', () => {
      // (30 / 25.4) * 300 = 354.33... -> 354
      expect(mmToPixels(30, 300)).toBe(354);
    });

    it('accurately converts 89mm at 300 DPI (Dymo width)', () => {
      // (89 / 25.4) * 300 = 1051.18... -> 1051
      expect(mmToPixels(89, 300)).toBe(1051);
    });

    it('accurately converts 28mm at 300 DPI (Dymo height)', () => {
      // (28 / 25.4) * 300 = 330.70... -> 331
      expect(mmToPixels(28, 300)).toBe(331);
    });

    it('returns 0 for negative or zero values', () => {
      expect(mmToPixels(0)).toBe(0);
      expect(mmToPixels(-10)).toBe(0);
      expect(mmToPixels(10, 0)).toBe(0);
    });
  });

  describe('pixelsToMm', () => {
    it('converts pixels back to physical millimeters', () => {
      const mm = 40;
      const px = mmToPixels(mm, 300);
      const recoveredMm = pixelsToMm(px, 300);
      expect(Math.abs(recoveredMm - mm)).toBeLessThan(0.1);
    });
  });

  describe('pointsToPixels', () => {
    it('converts 12pt font at 300 DPI', () => {
      // (12 / 72) * 300 = 50
      expect(pointsToPixels(12, 300)).toBe(50);
    });
  });

  describe('calculatePixelDimensions', () => {
    it('calculates full dimension object using default 300 DPI', () => {
      const result = calculatePixelDimensions({ width: 62, height: 100 });
      expect(result.dpi).toBe(DEFAULT_DPI);
      expect(result.widthPx).toBe(732);
      expect(result.heightPx).toBe(1181);
    });

    it('respects custom DPI >= 72', () => {
      const result = calculatePixelDimensions({ width: 50.8, height: 25.4, dpi: 200 });
      expect(result.dpi).toBe(200);
      expect(result.widthPx).toBe(400); // 2 inches * 200
      expect(result.heightPx).toBe(200); // 1 inch * 200
    });
  });
});
