import { LabelConfig, LabelContent } from './types';
import { mmToPixels, pointsToPixels } from './dimensions';
import { generateQRMatrix, drawQRMatrix } from './qr';
import { computeLayout, PixelMargins } from './layout';
import {
  fitAndWrapText,
  formatMetadataFields,
  drawTextLines,
  truncateWithEllipsis,
} from './typography';

/**
 * Renders custom key-value fields onto a 2D canvas context with horizontal ellipsis truncation.
 * Returns the next vertical Y coordinate after rendering all lines.
 */
export function renderCustomFields(
  ctx: CanvasRenderingContext2D,
  customFields: Record<string, string>,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 16,
): number {
  let currentY = y;
  if (!customFields || maxWidth <= 0) {
    return currentY;
  }

  for (const [key, value] of Object.entries(customFields)) {
    if (!key || value === undefined) continue;
    const text = `${key}: ${value}`;
    const truncated = truncateWithEllipsis(ctx, text, maxWidth);
    ctx.fillText(truncated, Math.round(x), Math.round(currentY));
    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Creates an HTML5 Canvas element in browser or headless Node.js/Jest environment.
 */
export function createRenderingCanvas(widthPx: number, heightPx: number): HTMLCanvasElement {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    return canvas;
  }
  // Headless Node.js / Jest fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createCanvas } = require('canvas');
  return createCanvas(widthPx, heightPx) as unknown as HTMLCanvasElement;
}

export interface CanvasRenderResult {
  canvas: HTMLCanvasElement;
  previewDataUrl: string;
  widthPx: number;
  heightPx: number;
}

/**
 * Renders complete label graphics onto a 2D canvas surface.
 */
export function renderLabelToCanvas(
  config: LabelConfig,
  content: LabelContent,
  widthPx: number,
  heightPx: number,
  dpi: number,
): CanvasRenderResult {
  const canvas = createRenderingCanvas(widthPx, heightPx);
  const ctx = canvas.getContext('2d')!;

  // 1. Background Fill
  const bgColor = config.style?.backgroundColor || '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, widthPx, heightPx);

  // 2. Perimeter Border (if configured)
  const borderWidth = config.style?.borderWidth ?? 0;
  if (borderWidth > 0) {
    const borderColor = config.style?.borderColor || '#000000';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    const halfBorder = borderWidth / 2;
    ctx.strokeRect(halfBorder, halfBorder, widthPx - borderWidth, heightPx - borderWidth);
  }

  // 3. Compute Margins in Pixels
  const margins = config.layout?.margins;
  const pixelMargins: PixelMargins = {
    top: mmToPixels(margins?.top ?? 2, dpi),
    right: mmToPixels(margins?.right ?? 2, dpi),
    bottom: mmToPixels(margins?.bottom ?? 2, dpi),
    left: mmToPixels(margins?.left ?? 2, dpi),
  };

  // 4. Compute Spatial Layout Partitioning
  const placement = config.layout?.qrCodePlacement || 'left';
  const qrSizeRatio = config.layout?.qrCodeSize ?? 0.65;
  const layout = computeLayout(widthPx, heightPx, pixelMargins, placement, qrSizeRatio);

  // 5. Generate and Draw QR Code (if layout allocates QR area)
  const fontColor = config.style?.fontColor || '#000000';
  if (layout.qrBounds.width > 0 && layout.qrBounds.height > 0) {
    const darkColor = config.qrOptions?.darkColor || fontColor;
    const lightColor = config.qrOptions?.lightColor || 'transparent';
    const qrMargin = config.qrOptions?.margin ?? 0;
    const qrMatrix = generateQRMatrix(content.obsidianUri, config.qrOptions);
    drawQRMatrix(
      ctx,
      qrMatrix,
      layout.qrBounds.x,
      layout.qrBounds.y,
      layout.qrBounds.width,
      darkColor,
      lightColor,
      qrMargin,
    );
  }

  // 6. Typography Formatting & Rendering
  const fontFamily = config.style?.fontFamily || 'sans-serif';
  const initialFontSizePt = config.style?.fontSize ?? 12;
  const minFontSizePt = config.style?.minFontSize ?? 6;
  const initialFontSizePx = pointsToPixels(initialFontSizePt, dpi);
  const minFontSizePx = pointsToPixels(minFontSizePt, dpi);

  if (layout.textBounds.width > 0 && layout.textBounds.height > 0) {
    if (content.contentLines !== undefined) {
      // Template contentLines rendering with sequential overflow omission
      if (content.contentLines.length > 0) {
        ctx.font = `${initialFontSizePx}px ${fontFamily}`;
        const lineHeightPx = Math.round(initialFontSizePx * 1.3);
        const maxLines = Math.floor(layout.textBounds.height / lineHeightPx);

        const visibleLines: string[] = [];
        for (const line of content.contentLines) {
          if (visibleLines.length >= maxLines) break;
          const lineStr = line.label ? `${line.label}: ${line.text}` : line.text;
          const truncatedStr = truncateWithEllipsis(ctx, lineStr, layout.textBounds.width);
          visibleLines.push(truncatedStr);
        }

        if (visibleLines.length > 0) {
          const totalHeightPx = visibleLines.length * lineHeightPx;
          const textYOffset = Math.max(
            0,
            Math.round((layout.textBounds.height - totalHeightPx) / 2),
          );

          drawTextLines(
            ctx,
            visibleLines,
            layout.textBounds.x,
            layout.textBounds.y + textYOffset,
            layout.textBounds.width,
            lineHeightPx,
            config.layout?.textAlignment || 'left',
            fontColor,
          );
        }
      }
    } else {
      // Legacy text rendering fallback
      const metadataLines = formatMetadataFields(
        content.customFields,
        config.layout?.metadataOrientation ?? 'vertical',
        config.layout?.metadataSeparator ?? ': ',
      );

      const fullTextToRender = [content.noteTitle, ...metadataLines].join('\n');

      const typography = fitAndWrapText(
        ctx,
        fullTextToRender,
        fontFamily,
        initialFontSizePx,
        minFontSizePx,
        layout.textBounds.width,
        layout.textBounds.height,
      );

      // Vertically center text block in text bounds if space remains
      const textYOffset = Math.max(
        0,
        Math.round((layout.textBounds.height - typography.totalHeightPx) / 2),
      );

      drawTextLines(
        ctx,
        typography.lines,
        layout.textBounds.x,
        layout.textBounds.y + textYOffset,
        layout.textBounds.width,
        typography.lineHeightPx,
        config.layout?.textAlignment || 'left',
        fontColor,
      );
    }
  }

  const previewDataUrl = canvas.toDataURL('image/png');

  return {
    canvas,
    previewDataUrl,
    widthPx,
    heightPx,
  };
}
