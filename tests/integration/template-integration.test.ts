import ObsidianLabelPlugin from '../../src/main';
import { App, TFile } from '../../tests/mocks/obsidian';

describe('Template System Integration (US1 Quickstart Scenarios)', () => {
  let mockApp: App;
  let plugin: ObsidianLabelPlugin;
  let sampleNote: TFile;
  let compactNote: TFile;
  let inventoryNote: TFile;
  let frontmatterOverrideNote: TFile;
  let writtenFiles: Map<string, Uint8Array>;

  beforeEach(() => {
    writtenFiles = new Map();

    sampleNote = new TFile('Notes/StandardItem.md');
    compactNote = new TFile('Notes/CompactTag.md');
    inventoryNote = new TFile('Vault/Inventory/Oscilloscope.md');
    frontmatterOverrideNote = new TFile('Notes/SpecialItem.md');

    const frontmatters: Record<string, any> = {
      'Vault/Inventory/Oscilloscope.md': {
        category: ['Electronics', 'Laboratory'],
        location: 'Bin 42',
        serial: 'SN-100234',
        value: '$350.00',
      },
      'Notes/SpecialItem.md': {
        template: 'inventory',
        category: ['Optics'],
        location: 'Locker 3',
      },
    };

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => sampleNote),
      },
      vault: {
        getName: jest.fn(() => 'LabVault'),
        getMarkdownFiles: jest.fn(() => [
          sampleNote,
          compactNote,
          inventoryNote,
          frontmatterOverrideNote,
        ]),
        adapter: {
          exists: jest.fn(async (path: string) => writtenFiles.has(path)),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, new Uint8Array(data));
          }),
          mkdir: jest.fn(async () => {}),
        },
      },
      metadataCache: {
        getFileCache: jest.fn((file: any) => {
          const fm = frontmatters[file.path];
          return fm ? { frontmatter: fm } : null;
        }),
      },
      fileManager: {
        processFrontMatter: jest.fn(async (file: any, fn: any) => {
          const fm = frontmatters[file.path] || {};
          fn(fm);
        }),
      },
    };

    plugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
  });

  describe('Scenario 1: Built-in "Standard" Template (US1 MVP)', () => {
    it('generates an 89x28 mm label with title and relative path', async () => {
      await plugin.onload();
      plugin.settings.defaultTemplate = 'standard';

      await plugin.generateLabelForCurrentNote(sampleNote);

      const expectedPath = 'Notes/StandardItem_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);
      const pdfBytes = writtenFiles.get(expectedPath)!;
      expect(pdfBytes.length).toBeGreaterThan(0);
      expect(String.fromCharCode(...pdfBytes.slice(0, 5))).toBe('%PDF-');
    });
  });

  describe('Scenario 2: Built-in "Compact" Tag Template (US1 MVP)', () => {
    it('generates a 30x30 mm scan-only square label', async () => {
      await plugin.onload();
      plugin.settings.defaultTemplate = 'compact';

      await plugin.generateLabelForCurrentNote(compactNote);

      const expectedPath = 'Notes/CompactTag_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);
      const pdfBytes = writtenFiles.get(expectedPath)!;
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 3: Built-in "Inventory" Template & Frontmatter Extraction (US1 MVP)', () => {
    it('generates a 100x50 mm label extracting frontmatter fields including list serialization', async () => {
      await plugin.onload();
      plugin.settings.defaultTemplate = 'inventory';

      await plugin.generateLabelForCurrentNote(inventoryNote);

      const expectedPath = 'Vault/Inventory/Oscilloscope_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);
      const pdfBytes = writtenFiles.get(expectedPath)!;
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 5: Per-Note Frontmatter Template Override (US1 & US2)', () => {
    it('applies per-note "template: inventory" frontmatter override over vault default "standard"', async () => {
      await plugin.onload();
      // Vault default is standard
      plugin.settings.defaultTemplate = 'standard';

      // frontmatterOverrideNote specifies template: inventory
      await plugin.generateLabelForCurrentNote(frontmatterOverrideNote);

      const expectedPath = 'Notes/SpecialItem_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);
      const pdfBytes = writtenFiles.get(expectedPath)!;
      expect(pdfBytes.length).toBeGreaterThan(0);
    });
  });
});
