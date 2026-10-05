import { LabelGenerator } from '../../src/core/label-generator';

describe('Quickstart Guide Verification (quickstart.md)', () => {
  let generator: LabelGenerator;

  beforeEach(() => {
    generator = new LabelGenerator();
  });

  it('verifies Scenario A: Generate Standard Phomemo Storage Bin Label (P1 MVP Flow)', async () => {
    const preset = generator.getPreset('phomemo-40x30')!;
    expect(preset).toBeDefined();

    const result = await generator.generate(
      { size: preset.size, layout: preset.defaultLayout },
      {
        noteTitle: 'Workshop Multimeter',
        obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter',
        notePath: 'Equipment/Multimeter.md',
      },
    );

    expect(result.pixelDimensions.width).toBe(472);
    expect(result.pixelDimensions.height).toBe(354);
    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.pdfData.length).toBeGreaterThan(100);

    const pdfHeader = String.fromCharCode(...result.pdfData.slice(0, 5));
    expect(pdfHeader).toBe('%PDF-');
  });

  it('verifies Scenario B: Custom Dimensions with Metadata Key-Value Pairs (P2 Flow)', async () => {
    const result = await generator.generate(
      {
        size: { width: 60, height: 40, dpi: 300 },
        layout: {
          qrCodePlacement: 'right',
          textAlignment: 'left',
          metadataOrientation: 'vertical',
          metadataSeparator: ': ',
        },
        style: {
          fontFamily: 'sans-serif',
          fontSize: 14,
          borderWidth: 2,
          borderColor: '#333333',
        },
      },
      {
        noteTitle: 'Project Falcon PCB',
        obsidianUri: 'obsidian://open?vault=Work&file=Hardware%2FFalcon',
        customFields: {
          Location: 'Bin 4A',
          Batch: '2026-Q3',
        },
      },
    );

    expect(result.previewDataUrl).toBeDefined();
    expect(result.pixelDimensions.width).toBe(709);
    expect(result.pixelDimensions.height).toBe(472);
  });

  it('verifies Scenario C: Validation Rejection Handling', () => {
    const validation = generator.validate(
      {
        size: { width: -10, height: 30, dpi: 300 },
      },
      {
        noteTitle: '',
        obsidianUri: 'https://example.com/unsupported',
      },
    );

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toHaveLength(3);

    const errorCodes = validation.errors.map((e) => e.code);
    expect(errorCodes).toContain('INVALID_DIMENSIONS');
    expect(errorCodes).toContain('EMPTY_TITLE');
    expect(errorCodes).toContain('INVALID_URI_SCHEME');
  });
});
