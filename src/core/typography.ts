import { TextAlignment, MetadataOrientation } from './types';

export interface WrappedTextResult {
  lines: string[];
  fontSizePx: number;
  lineHeightPx: number;
  totalHeightPx: number;
  isTruncated: boolean;
}

/**
 * Splits text into lines that fit within maxWidth using ctx.measureText().
 */
export function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [];
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const metrics = ctx.measureText(testLine);

      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
  }

  return lines;
}

/**
 * Truncates a line with an ellipsis (...) so it fits within maxWidth.
 */
export function truncateWithEllipsis(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
): string {
  if (ctx.measureText(line).width <= maxWidth) {
    return line;
  }

  return appendEllipsis(ctx, line, maxWidth);
}

/**
 * Appends an ellipsis (...) to a line, trimming characters until line + ellipsis fits maxWidth.
 */
export function appendEllipsis(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
): string {
  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  if (ellipsisWidth >= maxWidth) {
    return '.';
  }

  let truncated = line;
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return truncated + ellipsis;
}

/**
 * Formats custom metadata key-value pairs based on orientation and separator.
 */
export function formatMetadataFields(
  customFields?: Record<string, string>,
  orientation: MetadataOrientation = 'vertical',
  separator: string = ': ',
): string[] {
  if (!customFields || Object.keys(customFields).length === 0) {
    return [];
  }

  const entries = Object.entries(customFields).filter(
    ([k, v]) => k.trim().length > 0 && v !== undefined,
  );

  if (entries.length === 0) {
    return [];
  }

  if (orientation === 'horizontal') {
    // Single or comma/bullet delimited line
    return [entries.map(([k, v]) => `${k}${separator}${v}`).join(' • ')];
  }

  // Vertical: each key-value on its own line
  return entries.map(([k, v]) => `${k}${separator}${v}`);
}

/**
 * Dynamically computes line wraps and scales down font size if text overflows maxAvailableHeight.
 */
export function fitAndWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  initialFontSizePx: number,
  minFontSizePx: number,
  maxWidthPx: number,
  maxHeightPx: number,
  lineHeightMultiplier = 1.2,
): WrappedTextResult {
  let currentFontSize = initialFontSizePx;
  let lines: string[] = [];
  let lineHeightPx = currentFontSize * lineHeightMultiplier;
  let totalHeightPx = 0;
  let isTruncated = false;

  // Step 1: Scale down font size until lines fit vertically or minFontSize reached
  while (currentFontSize >= minFontSizePx) {
    ctx.font = `${currentFontSize}px ${fontFamily}`;
    lines = wrapWords(ctx, text, maxWidthPx);
    lineHeightPx = currentFontSize * lineHeightMultiplier;
    totalHeightPx = lines.length * lineHeightPx;

    if (totalHeightPx <= maxHeightPx || currentFontSize <= minFontSizePx) {
      break;
    }

    currentFontSize = Math.max(minFontSizePx, currentFontSize - 1);
  }

  // Step 2: If lines still exceed maxHeight at minFontSize, truncate lines
  if (totalHeightPx > maxHeightPx && lines.length > 0) {
    isTruncated = true;
    const maxFittingLines = Math.max(1, Math.floor(maxHeightPx / lineHeightPx));
    const trimmedLines = lines.slice(0, maxFittingLines);

    // Truncate the last visible line
    ctx.font = `${currentFontSize}px ${fontFamily}`;
    trimmedLines[trimmedLines.length - 1] = appendEllipsis(
      ctx,
      trimmedLines[trimmedLines.length - 1],
      maxWidthPx,
    );

    lines = trimmedLines;
    totalHeightPx = lines.length * lineHeightPx;
  }

  return {
    lines,
    fontSizePx: currentFontSize,
    lineHeightPx,
    totalHeightPx,
    isTruncated,
  };
}

/**
 * Draws wrapped text lines onto the canvas context respecting alignment.
 */
export function drawTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  startX: number,
  startY: number,
  maxWidth: number,
  lineHeightPx: number,
  alignment: TextAlignment = 'left',
  color: string = '#000000',
): void {
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = startY + i * lineHeightPx;
    let x = startX;

    if (alignment === 'center') {
      const lineWidth = ctx.measureText(line).width;
      x = startX + Math.max(0, (maxWidth - lineWidth) / 2);
    } else if (alignment === 'right') {
      const lineWidth = ctx.measureText(line).width;
      x = startX + Math.max(0, maxWidth - lineWidth);
    }

    ctx.fillText(line, Math.round(x), Math.round(y));
  }
}
