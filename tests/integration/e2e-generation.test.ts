import { defaultGenerator } from '../../src/index';

describe('End-to-End Label Generation Integration', () => {
  it('generates MVP Phomemo 40x30mm storage bin label with valid dual output', async () => {
    const preset = defaultGenerator.getPreset('phomemo-40x30')!;
    expect(preset).toBeDefined();

    const content = {
      noteTitle: 'Workshop Multimeter',
      obsidianUri: 'obsidian://open?vault=Personal&file=Equipment%2FMultimeter',
      notePath: 'Equipment/Multimeter.md',
    };

    const result = await defaultGenerator.generate(
      {
        size: preset.size,
        layout: preset.defaultLayout,
      },
      content
    );

    // Verify dual output
    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.pdfData.length).toBeGreaterThan(100);

    // Check pixel dimensions for 40mm x 30mm at 300 DPI
    expect(result.pixelDimensions.width).toBe(472);
    expect(result.pixelDimensions.height).toBe(354);

    // Check PDF header
    const header = Buffer.from(result.pdfData.slice(0, 5)).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('generates wide Dymo 89x28mm address label with title', async () => {
    const preset = defaultGenerator.getPreset('dymo-89x28')!;
    expect(preset).toBeDefined();

    const result = await defaultGenerator.generate(
      {
        size: preset.size,
        layout: preset.defaultLayout,
      },
      {
        noteTitle: 'Taxes 2026 - Receipts & Invoices',
        obsidianUri: 'obsidian://open?vault=Finance&file=Taxes%2F2026',
      }
    );

    expect(result.pixelDimensions.width).toBe(1051);
    expect(result.pixelDimensions.height).toBe(331);
    expect(result.previewDataUrl).toBeDefined();
    expect(result.pdfData).toBeDefined();
  });

  it('generates custom styling, border, right QR placement, and vertical metadata (US2)', async () => {
    const result = await defaultGenerator.generate(
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
          fontColor: '#111111',
          backgroundColor: '#FAFAFA',
          borderWidth: 2,
          borderColor: '#444444',
        },
      },
      {
        noteTitle: 'Project Falcon PCB',
        obsidianUri: 'obsidian://open?vault=Work&file=Hardware%2FFalcon',
        customFields: {
          Location: 'Bin 4A',
          Batch: '2026-Q3',
        },
      }
    );

    expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.pdfData).toBeInstanceOf(Uint8Array);
    expect(result.pixelDimensions.width).toBe(709); // 60mm at 300 DPI
    expect(result.pixelDimensions.height).toBe(472); // 40mm at 300 DPI
  });

  it('handles 120-character long note titles gracefully with dynamic scaling (US2)', async () => {
    const longTitle =
      'Comprehensive Engineering Specification and Safety Checklist for Autonomous High-Voltage Battery Testing Chamber 2026';

    const result = await defaultGenerator.generate(
      {
        size: { width: 50, height: 30, dpi: 300 },
        layout: { qrCodePlacement: 'left', qrCodeSize: 0.6 },
        style: { fontSize: 14, minFontSize: 6 },
      },
      {
        noteTitle: longTitle,
        obsidianUri: 'obsidian://open?vault=Research&file=Chamber%2FBatteryTest',
        customFields: { Status: 'Active', Priority: 'High' },
      }
    );

    expect(result.previewDataUrl).toBeDefined();
    expect(result.pdfData.length).toBeGreaterThan(100);
  });

  describe('User Story 3: Presets & Custom Dimensions', () => {
    it('lists all 4 built-in commercial presets', () => {
      const presets = defaultGenerator.listPresets();
      expect(presets.length).toBeGreaterThanOrEqual(4);
      const ids = presets.map((p) => p.id);
      expect(ids).toContain('phomemo-40x30');
      expect(ids).toContain('dymo-89x28');
      expect(ids).toContain('brother-62x100');
      expect(ids).toContain('avery-5160');
    });

    it('generates large Brother 62mm x 100mm shipping/asset label (US3)', async () => {
      const preset = defaultGenerator.getPreset('brother-62x100')!;
      expect(preset).toBeDefined();

      const result = await defaultGenerator.generate(
        {
          size: preset.size,
          layout: preset.defaultLayout,
        },
        {
          noteTitle: 'Industrial Server Rack - Unit 12',
          obsidianUri: 'obsidian://open?vault=Infra&file=Racks%2FRack12',
          customFields: {
            IP: '192.168.1.12',
            VLAN: 'Management',
          },
        }
      );

      expect(result.pixelDimensions.width).toBe(732); // 62mm at 300 DPI
      expect(result.pixelDimensions.height).toBe(1181); // 100mm at 300 DPI
      expect(result.physicalDimensions.widthMm).toBe(62);
      expect(result.physicalDimensions.heightMm).toBe(100);
      expect(result.previewDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.pdfData).toBeInstanceOf(Uint8Array);
    });

    it('generates standard Avery 5160 (66.7mm x 25.4mm) address label (US3)', async () => {
      const preset = defaultGenerator.getPreset('avery-5160')!;
      expect(preset).toBeDefined();

      const result = await defaultGenerator.generate(
        {
          size: preset.size,
          layout: preset.defaultLayout,
        },
        {
          noteTitle: 'John Doe - Archive Box 5',
          obsidianUri: 'obsidian://open?vault=Records&file=Archives%2FBox5',
        }
      );

      expect(result.pixelDimensions.width).toBe(788); // 66.7mm at 300 DPI
      expect(result.pixelDimensions.height).toBe(300); // 25.4mm (1 inch) at 300 DPI
    });

    it('generates custom 50mm x 50mm square label with 1:1 aspect ratio (US3)', async () => {
      const result = await defaultGenerator.generate(
        {
          size: { width: 50, height: 50, dpi: 300 },
          layout: { qrCodePlacement: 'center', qrCodeSize: 0.6 },
        },
        {
          noteTitle: 'Specimen #847',
          obsidianUri: 'obsidian://open?vault=Lab&file=Specimens%2F847',
        }
      );

      expect(result.pixelDimensions.width).toBe(591);
      expect(result.pixelDimensions.height).toBe(591);
      expect(result.previewDataUrl).toBeDefined();
      expect(result.pdfData.length).toBeGreaterThan(100);
    });
  });
});

