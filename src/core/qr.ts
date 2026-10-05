import QRCode from 'qrcode';
import { QRDataURLOptions, QRErrorCorrectionLevel, QROptions } from './types';
import { validateQROptions } from './validator';

export interface QRMatrix {
  size: number;
  isDark(row: number, col: number): boolean;
  errorCorrectionLevel: QRErrorCorrectionLevel;
}

/**
 * Generates an in-memory QR code matrix using pure JS/TS.
 * Defaults to Error Correction Level M (~15% recovery) per project specification.
 */
export function generateQRMatrix(text: string, options?: QROptions): QRMatrix {
  if (options) {
    const validation = validateQROptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]?.message || 'Invalid QR options.');
    }
  }

  const errorCorrectionLevel = options?.errorCorrectionLevel || 'M';
  const qr = QRCode.create(text, {
    errorCorrectionLevel,
  });

  const size = qr.modules.size;
  return {
    size,
    isDark: (row: number, col: number) => {
      if (row < 0 || row >= size || col < 0 || col >= size) {
        return false;
      }
      return Boolean(qr.modules.get(row, col));
    },
    errorCorrectionLevel,
  };
}

/**
 * Generates an optical Base64 PNG data URL encoding the given text.
 * Operates 100% locally using pure JavaScript routines.
 */
export async function generateQRDataURL(text: string, options?: QRDataURLOptions): Promise<string> {
  if (options) {
    const validation = validateQROptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]?.message || 'Invalid QR options.');
    }
  }

  const errorCorrectionLevel = options?.errorCorrectionLevel || 'M';
  const margin = options?.margin !== undefined ? options.margin : 1;
  const width = options?.width || 256;
  const dark = options?.darkColor || '#000000';
  const light = options?.lightColor || '#FFFFFF';

  return QRCode.toDataURL(text, {
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark,
      light,
    },
  });
}

/**
 * Draws a QR code matrix directly onto an HTML5 2D canvas context.
 * Performs sub-pixel module alignment to prevent hairline gaps.
 * Supports configurable quiet-zone margin (in module counts).
 */
export function drawQRMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: QRMatrix,
  x: number,
  y: number,
  targetSizePx: number,
  darkColor: string = '#000000',
  lightColor?: string,
  marginModules: number = 0,
): void {
  const totalModules = matrix.size + 2 * marginModules;
  const moduleSize = targetSizePx / totalModules;

  if (lightColor && lightColor !== 'transparent') {
    ctx.fillStyle = lightColor;
    ctx.fillRect(x, y, targetSizePx, targetSizePx);
  }

  const originX = x + marginModules * moduleSize;
  const originY = y + marginModules * moduleSize;

  ctx.fillStyle = darkColor;
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (matrix.isDark(row, col)) {
        // Round sub-pixels to prevent hairline gaps between modules
        const modX = Math.round(originX + col * moduleSize);
        const modY = Math.round(originY + row * moduleSize);
        const modW = Math.round(originX + (col + 1) * moduleSize) - modX;
        const modH = Math.round(originY + (row + 1) * moduleSize) - modY;
        ctx.fillRect(modX, modY, modW, modH);
      }
    }
  }
}
