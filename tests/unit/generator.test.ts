import { LabelGenerator } from '../../src/core/label-generator';
import { LabelConfig, LabelContent } from '../../src/core/types';

describe('LabelGenerator (User Story 1 MVP)', () => {
  let generator: LabelGenerator;

  beforeEach(() => {
    generator = new LabelGenerator();
  });

  const validConfig: LabelConfig = {
    size: { width: 40, height: 30, dpi: 300 },
    layout: {
      qrCodePlacement: 'left',
      qrCodeSize: 0.65,
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
    },
    style: {
      fontFamily: 'sans-serif',
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#FFFFFF',
    },
  };

  const validContent: LabelContent = {
    noteTitle: 'Workshop Multimeter',
    obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter',
  };

  it('validates configuration correctly using validate()', () => {
    const validation = generator.validate(validConfig, validContent);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('generates dual output: base64 PNG preview and binary PDF bytes', async () => {
    const result = await generator.generate(validConfig, validContent);

    // Dimensions check
    expect(result.pixelDimensions.width).toBe(472); // 40mm at 300 DPI
    expect(result.pixelDimensions.height).toBe(354); // 30mm at 300 DPI
    expect(result.physicalDimensions.widthMm).toBe(40);
    expect(result.physicalDimensions.heightMm).toBe(30);

    // Preview data URL check
    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);

    // PDF data check
    expect(result.pdfData).toBeInstanceOf(Uint8Array);
    expect(result.pdfData.length).toBeGreaterThan(100);

    // Verify PDF header magic bytes "%PDF-"
    const pdfHeader = String.fromCharCode(...result.pdfData.slice(0, 5));
    expect(pdfHeader).toBe('%PDF-');
  });

  it('rejects generation when configuration is invalid', async () => {
    const invalidConfig: LabelConfig = {
      ...validConfig,
      size: { width: -10, height: 30 },
    };

    await expect(generator.generate(invalidConfig, validContent)).rejects.toThrow(
      'Label configuration validation failed'
    );
  });
});
