import ObsidianLabelPlugin from '../../src/main';
import { App, Menu, MockWorkspace, TFile } from '../../tests/mocks/obsidian';

describe('File Explorer Context Menu Integration (Quickstart Scenarios)', () => {
  let mockApp: App;
  let mockWorkspace: MockWorkspace;
  let plugin: ObsidianLabelPlugin;
  let noteA: TFile;
  let noteB: TFile;
  let noteC: TFile;
  let imageFile: TFile;
  let canvasFile: TFile;
  let folderObj: any;
  let writtenFiles: Map<string, Uint8Array>;

  beforeEach(() => {
    writtenFiles = new Map();
    mockWorkspace = new MockWorkspace();

    noteA = new TFile('Notes/Alpha.md');
    noteB = new TFile('Research/Beta.md');
    noteC = new TFile('Archive/Gamma.md');
    imageFile = new TFile('Assets/diagram.png');
    canvasFile = new TFile('Boards/overview.canvas');
    folderObj = { path: 'Notes', name: 'Notes' };

    mockWorkspace.activeFile = noteA;

    mockApp = {
      workspace: mockWorkspace,
      vault: {
        getName: jest.fn(() => 'LabVault'),
        getMarkdownFiles: jest.fn(() => [noteA, noteB, noteC]),
        adapter: {
          exists: jest.fn(async (path: string) => writtenFiles.has(path)),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, new Uint8Array(data));
          }),
          mkdir: jest.fn(async () => {}),
        },
      },
    };

    plugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
  });

  describe('Scenario 1: Single Note File Context Menu (User Story 1 - P1 MVP)', () => {
    it('registers file-menu, displays "Generate Label" with "tag" icon, and outputs PDF on click', async () => {
      await plugin.onload();

      const menu = new Menu();
      mockWorkspace.trigger('file-menu', menu, noteA);

      expect(menu.items.length).toBe(1);
      const item = menu.items[0];
      expect(item.title).toBe('Generate Label');
      expect(item.icon).toBe('tag');

      // Click the menu item
      await item.triggerClick();

      // Check generated PDF
      const expectedPath = 'Notes/Alpha_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);
      const pdfBytes = writtenFiles.get(expectedPath)!;
      expect(pdfBytes.length).toBeGreaterThan(0);
      expect(String.fromCharCode(...pdfBytes.slice(0, 5))).toBe('%PDF-');
    });
  });

  describe('Scenario 2: Non-Markdown & Folder Exclusion (User Story 1 - P1 MVP)', () => {
    it('omits context menu item when target is an image, canvas, or folder', async () => {
      await plugin.onload();

      // Test image file
      const menuImage = new Menu();
      mockWorkspace.trigger('file-menu', menuImage, imageFile);
      expect(menuImage.items.length).toBe(0);

      // Test canvas file
      const menuCanvas = new Menu();
      mockWorkspace.trigger('file-menu', menuCanvas, canvasFile);
      expect(menuCanvas.items.length).toBe(0);

      // Test folder
      const menuFolder = new Menu();
      mockWorkspace.trigger('file-menu', menuFolder, folderObj);
      expect(menuFolder.items.length).toBe(0);
    });
  });

  describe('Scenario 3: Target File Independence (User Story 2 - P2)', () => {
    it('generates label strictly for right-clicked note when active editor has a different note open', async () => {
      await plugin.onload();

      // Note A is active in workspace
      mockWorkspace.activeFile = noteA;

      // User right-clicks Note B in the file explorer
      const menu = new Menu();
      mockWorkspace.trigger('file-menu', menu, noteB);
      expect(menu.items.length).toBe(1);

      await menu.items[0].triggerClick();

      // Verify Note B was generated, not Note A
      expect(writtenFiles.has('Research/Beta_label.pdf')).toBe(true);
      expect(writtenFiles.has('Notes/Alpha_label.pdf')).toBe(false);
    });
  });

  describe('Scenario 4: Multi-File Selection Batch Generation (User Story 3 - P3)', () => {
    it('displays "Generate Labels" for multi-selection and generates all selected notes on click', async () => {
      await plugin.onload();

      const menu = new Menu();
      mockWorkspace.trigger('files-menu', menu, [noteA, noteB, noteC]);

      expect(menu.items.length).toBe(1);
      const item = menu.items[0];
      expect(item.title).toBe('Generate Labels');
      expect(item.icon).toBe('tag');

      // Click multi-file menu item
      await item.triggerClick();

      // All 3 notes should have PDFs written
      expect(writtenFiles.has('Notes/Alpha_label.pdf')).toBe(true);
      expect(writtenFiles.has('Research/Beta_label.pdf')).toBe(true);
      expect(writtenFiles.has('Archive/Gamma_label.pdf')).toBe(true);
    });
  });

  describe('Scenario 5: Mixed Multi-Selection Exclusion (User Story 3 - P3)', () => {
    it('generates labels only for markdown notes in mixed selection and excludes non-markdown files', async () => {
      await plugin.onload();

      // Mixed selection with 2 notes and 1 image
      const menuMixed = new Menu();
      mockWorkspace.trigger('files-menu', menuMixed, [noteA, imageFile, noteB]);
      expect(menuMixed.items.length).toBe(1);
      expect(menuMixed.items[0].title).toBe('Generate Labels');

      await menuMixed.items[0].triggerClick();

      expect(writtenFiles.has('Notes/Alpha_label.pdf')).toBe(true);
      expect(writtenFiles.has('Research/Beta_label.pdf')).toBe(true);
      expect(writtenFiles.has('Assets/diagram_label.pdf')).toBe(false);

      // Pure non-markdown multi-selection
      const menuNonMd = new Menu();
      mockWorkspace.trigger('files-menu', menuNonMd, [imageFile, canvasFile, folderObj]);
      expect(menuNonMd.items.length).toBe(0);
    });
  });
});
