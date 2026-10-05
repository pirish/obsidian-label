/**
 * Contract: QR Code Encoder
 * Feature: 002-obsidian-uri-qr
 */

import { QRErrorCorrectionLevel, QROptions, ValidationResult } from '../../../src/core/types';
import { QRMatrix } from '../../../src/core/qr';

/**
 * Options for raster data URL export.
 */
export interface QRDataURLOptions extends QROptions {
  /** Target pixel size of the generated raster image (default: 256) */
  width?: number;
  /** Dark module color (hex or CSS, default: '#000000') */
  darkColor?: string;
  /** Light background color (hex, CSS, or 'transparent', default: '#FFFFFF') */
  lightColor?: string;
}

/**
 * Validates QROptions or QRDataURLOptions.
 *
 * @param options QR options to validate
 * @returns Structured validation result
 */
export declare function validateQROptions(options: QROptions | QRDataURLOptions): ValidationResult;

/**
 * Generates an in-memory QR matrix from the input text payload.
 * Runs 100% locally and synchronously.
 *
 * @param text The text or URI to encode
 * @param options QR generation options (errorCorrectionLevel, margin)
 * @returns QRMatrix interface
 */
export declare function generateQRMatrix(
  text: string,
  options?: QROptions
): QRMatrix;

/**
 * Asynchronously generates a Base64-encoded PNG data URL encoding the text payload.
 *
 * @param text The text or URI to encode
 * @param options QR data URL options (dimensions, error correction, colors, margin)
 * @returns Promise resolving to `data:image/png;base64,...`
 */
export declare function generateQRDataURL(
  text: string,
  options?: QRDataURLOptions
): Promise<string>;

/**
 * Draws a QR code matrix directly onto an HTML5 2D canvas context.
 * Performs sub-pixel module alignment to prevent hairline gaps.
 *
 * @param ctx 2D rendering context
 * @param matrix In-memory QR code matrix
 * @param x Origin X coordinate in pixels
 * @param y Origin Y coordinate in pixels
 * @param targetSizePx Outer bounding dimension of the QR code in pixels
 * @param darkColor Module color (hex, default '#000000')
 * @param lightColor Background fill color (hex, default '#FFFFFF')
 */
export declare function drawQRMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: QRMatrix,
  x: number,
  y: number,
  targetSizePx: number,
  darkColor?: string,
  lightColor?: string
): void;
