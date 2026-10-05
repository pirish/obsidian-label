import { computeLayout, PixelMargins } from '../../src/core/layout';

describe('Layout Module', () => {
  const margins: PixelMargins = { top: 20, right: 20, bottom: 20, left: 20 };
  const widthPx = 500;
  const heightPx = 300;

  it('computes left placement correctly', () => {
    const layout = computeLayout(widthPx, heightPx, margins, 'left', 0.65);

    expect(layout.qrBounds.x).toBe(margins.left);
    expect(layout.textBounds.x).toBeGreaterThan(layout.qrBounds.x + layout.qrBounds.width);
    expect(layout.textBounds.width).toBeGreaterThan(0);
    expect(layout.textBounds.height).toBe(heightPx - (margins.top + margins.bottom));
  });

  it('computes right placement correctly', () => {
    const layout = computeLayout(widthPx, heightPx, margins, 'right', 0.65);

    expect(layout.textBounds.x).toBe(margins.left);
    expect(layout.qrBounds.x).toBeGreaterThan(layout.textBounds.x + layout.textBounds.width);
    expect(layout.qrBounds.x + layout.qrBounds.width).toBeLessThanOrEqual(widthPx - margins.right);
  });

  it('computes top placement correctly', () => {
    const layout = computeLayout(widthPx, heightPx, margins, 'top', 0.5);

    expect(layout.qrBounds.y).toBe(margins.top);
    expect(layout.textBounds.y).toBeGreaterThan(layout.qrBounds.y + layout.qrBounds.height);
    expect(layout.textBounds.width).toBe(widthPx - (margins.left + margins.right));
  });

  it('computes bottom placement correctly', () => {
    const layout = computeLayout(widthPx, heightPx, margins, 'bottom', 0.5);

    expect(layout.textBounds.y).toBe(margins.top);
    expect(layout.qrBounds.y).toBeGreaterThan(layout.textBounds.y);
    expect(layout.qrBounds.y + layout.qrBounds.height).toBeLessThanOrEqual(
      heightPx - margins.bottom,
    );
  });

  it('computes center placement correctly', () => {
    const layout = computeLayout(widthPx, heightPx, margins, 'center', 0.5);

    expect(layout.qrBounds.x).toBeGreaterThan(margins.left);
    expect(layout.qrBounds.y).toBeGreaterThan(margins.top);
  });
});
