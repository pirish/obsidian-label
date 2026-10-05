/**
 * Contract: PDF Exporter Engine
 * Feature: 003-pdf-export
 */

import { LabelConfig } from '../../../src/core/types';

export interface PDFDimensions {
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Pure generator: exports a rendered HTML5 Canvas to a binary PDF (Uint8Array).
 *
 * @param canvas HTMLCanvasElement containing the rendered label
 * @param widthMm Physical label width in millimeters
 * @param heightMm Physical label height in millimeters
 * @returns Raw binary PDF bytes
 */
export declare function exportCanvasToPDF(
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number
): Uint8Array;

/**
 * Pure generator: exports a rendered HTML5 Canvas to a browser Blob.
 *
 * @param canvas HTMLCanvasElement containing the rendered label
 * @param widthMm Physical label width in millimeters
 * @param heightMm Physical label height in millimeters
 * @returns Blob representing application/pdf
 */
export declare function exportCanvasToPDFBlob(
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number
): Blob;
