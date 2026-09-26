import { LabelSize } from './types';

export const MM_PER_INCH = 25.4;
export const POINTS_PER_INCH = 72;
export const DEFAULT_DPI = 300;

/**
 * Converts physical millimeters to pixels at the specified DPI.
 */
export function mmToPixels(mm: number, dpi: number = DEFAULT_DPI): number {
  if (mm <= 0 || dpi <= 0) {
    return 0;
  }
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/**
 * Converts pixels to physical millimeters at the specified DPI.
 */
export function pixelsToMm(pixels: number, dpi: number = DEFAULT_DPI): number {
  if (pixels <= 0 || dpi <= 0) {
    return 0;
  }
  return (pixels * MM_PER_INCH) / dpi;
}

/**
 * Converts typographic points to pixels at the specified DPI.
 */
export function pointsToPixels(points: number, dpi: number = DEFAULT_DPI): number {
  if (points <= 0 || dpi <= 0) {
    return 0;
  }
  return Math.round((points / POINTS_PER_INCH) * dpi);
}

/**
 * Calculates pixel dimensions for a given physical label size.
 */
export function calculatePixelDimensions(size: LabelSize): {
  widthPx: number;
  heightPx: number;
  dpi: number;
} {
  const dpi = size.dpi && size.dpi >= 72 ? size.dpi : DEFAULT_DPI;
  return {
    widthPx: mmToPixels(size.width, dpi),
    heightPx: mmToPixels(size.height, dpi),
    dpi,
  };
}
