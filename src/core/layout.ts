import { QRPlacement } from './types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComputedLayout {
  contentBounds: Rect;
  qrBounds: Rect;
  textBounds: Rect;
}

export interface PixelMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Computes spatial bounding rectangles for the QR code and text region
 * based on placement strategy and margin constraints.
 */
export function computeLayout(
  canvasWidthPx: number,
  canvasHeightPx: number,
  margins: PixelMargins,
  placement: QRPlacement = 'left',
  qrSizeRatio = 0.65
): ComputedLayout {
  const contentWidth = Math.max(0, canvasWidthPx - (margins.left + margins.right));
  const contentHeight = Math.max(0, canvasHeightPx - (margins.top + margins.bottom));

  const contentBounds: Rect = {
    x: margins.left,
    y: margins.top,
    width: contentWidth,
    height: contentHeight,
  };

  const gap = Math.round(Math.min(contentWidth, contentHeight) * 0.05); // 5% proportional gap

  let qrBounds: Rect;
  let textBounds: Rect;

  switch (placement) {
    case 'right': {
      const qrDim = Math.round(Math.min(contentHeight * qrSizeRatio, contentWidth * 0.5));
      qrBounds = {
        x: contentBounds.x + contentBounds.width - qrDim,
        y: contentBounds.y + Math.round((contentBounds.height - qrDim) / 2),
        width: qrDim,
        height: qrDim,
      };
      textBounds = {
        x: contentBounds.x,
        y: contentBounds.y,
        width: Math.max(0, qrBounds.x - contentBounds.x - gap),
        height: contentBounds.height,
      };
      break;
    }

    case 'top': {
      const qrDim = Math.round(Math.min(contentWidth * qrSizeRatio, contentHeight * 0.5));
      qrBounds = {
        x: contentBounds.x + Math.round((contentBounds.width - qrDim) / 2),
        y: contentBounds.y,
        width: qrDim,
        height: qrDim,
      };
      textBounds = {
        x: contentBounds.x,
        y: qrBounds.y + qrBounds.height + gap,
        width: contentBounds.width,
        height: Math.max(0, contentBounds.y + contentBounds.height - (qrBounds.y + qrBounds.height + gap)),
      };
      break;
    }

    case 'bottom': {
      const qrDim = Math.round(Math.min(contentWidth * qrSizeRatio, contentHeight * 0.5));
      qrBounds = {
        x: contentBounds.x + Math.round((contentBounds.width - qrDim) / 2),
        y: contentBounds.y + contentBounds.height - qrDim,
        width: qrDim,
        height: qrDim,
      };
      textBounds = {
        x: contentBounds.x,
        y: contentBounds.y,
        width: contentBounds.width,
        height: Math.max(0, qrBounds.y - contentBounds.y - gap),
      };
      break;
    }

    case 'center': {
      const qrDim = Math.round(Math.min(contentWidth, contentHeight) * qrSizeRatio);
      qrBounds = {
        x: contentBounds.x + Math.round((contentBounds.width - qrDim) / 2),
        y: contentBounds.y + Math.round((contentBounds.height - qrDim) / 2),
        width: qrDim,
        height: qrDim,
      };
      textBounds = {
        x: contentBounds.x,
        y: qrBounds.y + qrBounds.height + gap,
        width: contentBounds.width,
        height: Math.max(0, contentBounds.y + contentBounds.height - (qrBounds.y + qrBounds.height + gap)),
      };
      break;
    }

    case 'left':
    default: {
      const qrDim = Math.round(Math.min(contentHeight * qrSizeRatio, contentWidth * 0.5));
      qrBounds = {
        x: contentBounds.x,
        y: contentBounds.y + Math.round((contentBounds.height - qrDim) / 2),
        width: qrDim,
        height: qrDim,
      };
      textBounds = {
        x: qrBounds.x + qrBounds.width + gap,
        y: contentBounds.y,
        width: Math.max(0, contentBounds.x + contentBounds.width - (qrBounds.x + qrBounds.width + gap)),
        height: contentBounds.height,
      };
      break;
    }
  }

  return {
    contentBounds,
    qrBounds,
    textBounds,
  };
}
