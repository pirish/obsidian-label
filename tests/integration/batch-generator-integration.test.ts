import ObsidianLabelPlugin from '../../src/main';
import { ObsidianLabelSettingTab } from '../../src/ui/settings-tab';
import { BatchLabelModal } from '../../src/ui/batch-label-modal';
import { TFile } from '../mocks/obsidian';

describe('Batch Label Generator End-to-End Integration (Feature 010)', () => {
  let mockApp: any;
  let plugin: ObsidianLabelPlugin;
  let writtenFiles: Map<string, ArrayBuffer>;
  let vaultFiles: any[];

  beforeEach(async () => {
    writtenFiles = new Map();
    vaultFiles = [
      new TFile('Hardware/Oscilloscope.md'),
      new TFile('Hardware/PowerSupply.md'),
      new TFile('Hardware/Probes/LogicProbe.md'),
      new TFile('Docs/Manual.md'),
    ];

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => vaultFiles[0]),
        on: jest.fn(),
      },
      vault: {
        getName: () => 'LabVault',
        getMarkdownFiles: () => vaultFiles,
        cachedRead: jest.fn(async (file: TFile) => `Content of ${file.basename}`),
        adapter: {
          exists: jest.fn(async (path: string) => writtenFiles.has(path)),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, data);
          }),
          readBinary: jest.fn(async (path: string) => {
            return writtenFiles.get(path) || new ArrayBuffer(0);
          }),
          mkdir: jest.fn(async () => {}),
        },
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => {
          if (file.path === 'Hardware/Probes/LogicProbe.md') {
            return {
              frontmatter: {
                tags: ['bench-gear'],
                label: {
                  labelSize: 'generic-square-50',
                },
              },
            };
          }
          if (file.path.startsWith('Hardware/')) {
            return {
              frontmatter: {
                tags: ['bench-gear'],
              },
            };
          }
          return null;
        }),
      },
    };

    plugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
    await plugin.onload();
  });

  it('registers the batch-generate-labels command in Command Palette', () => {
    const cmd = (plugin as any).commands.get('batch-generate-labels');
    expect(cmd).toBeDefined();
    expect(cmd.name).toBe('Batch Label Generation');
  });

  it('exposes Merge Batch PDFs toggle in Settings Tab and persists changes', async () => {
    const tab = new ObsidianLabelSettingTab(mockApp as any, plugin);
    tab.display();

    expect(tab.mergeBatchPDFsToggle).toBeDefined();
    expect(tab.mergeBatchPDFsToggle?.getValue()).toBe(false);

    await (tab.mergeBatchPDFsToggle as any)?.triggerChange(true);
    expect(plugin.settings.mergeBatchPDFs).toBe(true);
  });

  it('generates individual per-note PDFs AND a consolidated multi-page PDF preserving per-note dimensions', async () => {
    const modal = new BatchLabelModal(mockApp as any, plugin);
    modal.open();

    // Select Hardware folder (3 notes including subfolderHardware/Probes/LogicProbe.md)
    await (modal.folderDropdown as any)?.triggerChange('Hardware');
    expect(modal.selectedNotes.length).toBe(3);

    // Enable Merge into single multi-page PDF via modal toggle
    await (modal.mergeToggle as any)?.triggerChange(true);
    expect(plugin.settings.mergeBatchPDFs).toBe(true);

    // Trigger batch generation via CTA button
    await (modal.generateButton as any)?.triggerClick();

    // Verify all 3 individual PDFs are retained in the vault
    expect(writtenFiles.has('Hardware/Oscilloscope_label.pdf')).toBe(true);
    expect(writtenFiles.has('Hardware/PowerSupply_label.pdf')).toBe(true);
    expect(writtenFiles.has('Hardware/Probes/LogicProbe_label.pdf')).toBe(true);

    // Verify consolidated multi-page PDF was created with 3 pages
    const expectedDate = new Date().toISOString().split('T')[0];
    const mergedPath = `labels_batch_${expectedDate}.pdf`;
    expect(writtenFiles.has(mergedPath)).toBe(true);

    const mergedBytes = writtenFiles.get(mergedPath)!;
    const pdfText = Buffer.from(mergedBytes).toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g) || [];
    expect(pageMatches.length).toBe(3);
  });
});
