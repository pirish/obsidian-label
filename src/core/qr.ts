import QRCode from 'qrcode';
import { QRErrorCorrectionLevel, QROptions } from './types';

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
 * Draws a QR code matrix directly onto an HTML5 2D canvas context.
 */
export function drawQRMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: QRMatrix,
  x: number,
  y: number,
  targetSizePx: number,
  darkColor: string = '#000000',
  lightColor?: string,
): void {
  const moduleSize = targetSizePx / matrix.size;

  if (lightColor && lightColor !== 'transparent') {
    ctx.fillStyle = lightColor;
    ctx.fillRect(x, y, targetSizePx, targetSizePx);
  }

  ctx.fillStyle = darkColor;
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (matrix.isDark(row, col)) {
        // Round sub-pixels to prevent hairline gaps between modules
        const modX = Math.round(x + col * moduleSize);
        const modY = Math.round(y + row * moduleSize);
        const modW = Math.round(x + (col + 1) * moduleSize) - modX;
        const modH = Math.round(y + (row + 1) * moduleSize) - modY;
        ctx.fillRect(modX, modY, modW, modH);
      }
    }
  }
}
