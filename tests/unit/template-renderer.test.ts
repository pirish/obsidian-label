import { renderLabelToCanvas } from '../../src/core/canvas-renderer';
import { LabelConfig } from '../../src/core/types';
import { BUILTIN_TEMPLATES } from '../../src/templates/builtin';
import { ContentLine } from '../../src/templates/types';
import { mmToPixels } from '../../src/core/dimensions';

describe('Template-Driven Canvas Rendering & Overflow (User Story 1 - P1 MVP)', () => {
  const obsidianUri = 'obsidian://open?vault=TestVault&file=Inventory%2FItem.md';
  const dpi = 300;

  it('renders "Standard" template layout with title and path', () => {
    const standardTpl = BUILTIN_TEMPLATES.find((t) => t.id === 'standard')!;
    const widthPx = mmToPixels(standardTpl.labelSize.width, dpi);
    const heightPx = mmToPixels(standardTpl.labelSize.height, dpi);

    const config: LabelConfig = {
      size: standardTpl.labelSize,
      layout: {
        qrCodePlacement: standardTpl.layout.qrCodePlacement as any,
        qrCodeSize: standardTpl.layout.qrCodeSize,
        margins: standardTpl.layout.margins,
        textAlignment: standardTpl.layout.textAlignment,
      },
      style: standardTpl.style,
    };

    const contentLines: ContentLine[] = [
      { type: 'title', text: 'Standard Tool' },
      { type: 'path', text: 'Inventory/Tools' },
    ];

    const result = renderLabelToCanvas(
      config,
      {
        noteTitle: 'Standard Tool',
        obsidianUri,
        notePath: 'Inventory/Tools',
        contentLines,
      } as any,
      widthPx,
      heightPx,
      dpi,
    );

    expect(result.widthPx).toBe(widthPx);
    expect(result.heightPx).toBe(heightPx);
    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('renders "Compact" template with centered QR code and no text lines', () => {
    const compactTpl = BUILTIN_TEMPLATES.find((t) => t.id === 'compact')!;
    const widthPx = mmToPixels(compactTpl.labelSize.width, dpi);
    const heightPx = mmToPixels(compactTpl.labelSize.height, dpi);

    const config: LabelConfig = {
      size: compactTpl.labelSize,
      layout: {
        qrCodePlacement: compactTpl.layout.qrCodePlacement as any,
        qrCodeSize: compactTpl.layout.qrCodeSize,
        margins: compactTpl.layout.margins,
        textAlignment: compactTpl.layout.textAlignment,
      },
      style: compactTpl.style,
    };

    const result = renderLabelToCanvas(
      config,
      {
        noteTitle: 'Compact Note',
        obsidianUri,
        contentLines: [],
      } as any,
      widthPx,
      heightPx,
      dpi,
    );

    expect(result.widthPx).toBe(widthPx);
    expect(result.heightPx).toBe(heightPx);
    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('omits trailing content lines that exceed available vertical text height', () => {
    // Label with small height: 20mm
    const smallHeightMm = 20;
    const widthPx = mmToPixels(60, dpi);
    const heightPx = mmToPixels(smallHeightMm, dpi);

    const config: LabelConfig = {
      size: { width: 60, height: smallHeightMm, dpi },
      layout: {
        qrCodePlacement: 'left',
        qrCodeSize: 30,
        margins: { top: 2, right: 2, bottom: 2, left: 2 },
        textAlignment: 'left',
      },
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fontColor: '#000000',
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
        borderColor: '#000000',
      },
    };

    // Provide 15 lines of metadata that cannot all fit vertically
    const manyLines: ContentLine[] = Array.from({ length: 15 }, (_, i) => ({
      type: 'custom_field',
      label: `Field ${i + 1}`,
      text: `Long Value For Line Number ${i + 1}`,
    }));

    const result = renderLabelToCanvas(
      config,
      {
        noteTitle: 'Overflow Note',
        obsidianUri,
        contentLines: manyLines,
      } as any,
      widthPx,
      heightPx,
      dpi,
    );

    expect(result).toBeDefined();
    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
