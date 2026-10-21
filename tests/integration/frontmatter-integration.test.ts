import { generateLabelForNote } from '../../src/commands/orchestrator';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';
import { LabelGenerator } from '../../src/core/label-generator';
import { App, TFile } from '../mocks/obsidian';

describe('Per-Note Frontmatter Configuration Integration (Feature 009)', () => {
  let mockApp: App;
  let testNote: TFile;
  let writtenFiles: Map<string, Uint8Array>;
  let settings: ObsidianLabelSettings;

  beforeEach(() => {
    writtenFiles = new Map();
    testNote = new TFile('Inventory/Server Rack B3.md');

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => testNote),
      },
      vault: {
        getName: jest.fn(() => 'DataCenterVault'),
        adapter: {
          exists: jest.fn(async (p: string) => writtenFiles.has(p)),
          writeBinary: jest.fn(async (p: string, data: ArrayBuffer) => {
            writtenFiles.set(p, new Uint8Array(data));
          }),
          mkdir: jest.fn(async () => {}),
        },
      },
      metadataCache: {
        getFileCache: jest.fn(() => null),
      },
      fileManager: {
        processFrontMatter: jest.fn(async () => {}),
      },
    };

    settings = { ...DEFAULT_SETTINGS };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies full label frontmatter config (template, customFields, qrCodeSize, fontSize) when generating PDF', async () => {
    mockApp.metadataCache!.getFileCache = jest.fn(() => ({
      frontmatter: {
        label: {
          template: 'inventory',
          customFields: {
            category: 'Electronics',
            location: 'Shelf B3',
            serial: 'ABC123',
            value: '$450',
          },
          qrCodeSize: 35,
          fontSize: 14,
        },
      },
    }));

    const generator = new LabelGenerator();
    const exportSpy = jest.spyOn(generator, 'exportLabelPDF');

    const result = await generateLabelForNote(
      mockApp as any,
      testNote as any,
      settings,
      undefined,
      generator,
    );

    expect(result.filePath).toBe('Inventory/Server Rack B3_label.pdf');
    expect(result.dimensions.widthMm).toBe(100);
    expect(result.dimensions.heightMm).toBe(50);

    expect(exportSpy).toHaveBeenCalledTimes(1);
    const [, passedConfig, passedContent] = exportSpy.mock.calls[0];

    // Verify layout and style overrides from frontmatter
    expect(passedConfig.layout?.qrCodeSize).toBeCloseTo(0.35);
    expect(passedConfig.style?.fontSize).toBe(14);

    // Verify customFields override in content and contentLines
    expect(passedContent.customFields).toEqual({
      category: 'Electronics',
      location: 'Shelf B3',
      serial: 'ABC123',
      value: '$450',
    });
    expect(passedContent.contentLines).toEqual(
      expect.arrayContaining([
        { type: 'custom_field', label: 'category', text: 'Electronics' },
        { type: 'custom_field', label: 'location', text: 'Shelf B3' },
        { type: 'custom_field', label: 'serial', text: 'ABC123' },
        { type: 'custom_field', label: 'value', text: '$450' },
      ]),
    );
  });

  it('falls back cleanly to global settings when frontmatter is absent or contains invalid values', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockApp.metadataCache!.getFileCache = jest.fn(() => ({
      frontmatter: {
        label: {
          template: 'invalid-id',
          qrCodeSize: 200,
          fontSize: -8,
        },
      },
    }));

    const generator = new LabelGenerator();
    const exportSpy = jest.spyOn(generator, 'exportLabelPDF');

    const result = await generateLabelForNote(
      mockApp as any,
      testNote as any,
      settings,
      undefined,
      generator,
    );

    expect(result.dimensions.widthMm).toBe(89);
    expect(result.dimensions.heightMm).toBe(28);
    expect(warnSpy).toHaveBeenCalledTimes(3);

    const [, passedConfig] = exportSpy.mock.calls[0];
    expect(passedConfig.layout?.qrCodeSize).toBeCloseTo(DEFAULT_SETTINGS.qrCodeSize / 100);
    expect(passedConfig.style?.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });
});
