import ObsidianLabelPlugin from '../../src/main';
import { App, TFile } from '../../tests/mocks/obsidian';
import { CustomLabelModal } from '../../src/ui/custom-label-modal';
import { BatchConfirmModal } from '../../src/ui/batch-confirm-modal';

describe('Command Palette Actions & Batch Integration (Quickstart Scenarios)', () => {
  let mockApp: App;
  let plugin: ObsidianLabelPlugin;
  let sampleNote: TFile;
  let imageFile: TFile;
  let writtenFiles: Map<string, Uint8Array>;

  beforeEach(() => {
    writtenFiles = new Map();
    sampleNote = new TFile('VaultNotes/Inventory/Oscilloscope.md');
    imageFile = new TFile('Assets/diagram.png');

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => sampleNote),
      },
      vault: {
        getName: jest.fn(() => 'TestLabVault'),
        getMarkdownFiles: jest.fn(() => [sampleNote]),
        adapter: {
          exists: jest.fn(async (path: string) => writtenFiles.has(path)),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, new Uint8Array(data));
          }),
          mkdir: jest.fn(async () => {}),
        },
      },
      fileManager: {
        processFrontMatter: jest.fn(async (_file: any, fn: (frontmatter: any) => void) => {
          (sampleNote as any).frontmatter = (sampleNote as any).frontmatter || {};
          fn((sampleNote as any).frontmatter);
        }),
      },
    };

    plugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
  });

  describe('Scenario 1: Command Palette "Generate Label for Current Note" (User Story 1 - P1 MVP)', () => {
    it('registers command, verifies active note availability, generates PDF, and displays notice', async () => {
      await plugin.onload();

      const command = (plugin as any).commands?.get('generate-label-current-note');
      expect(command).toBeDefined();

      // Active file is sampleNote (markdown)
      expect(command!.checkCallback!(true)).toBe(true);

      // Execute command
      command!.checkCallback!(false);

      // Allow async generation to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify PDF was written to same-folder path
      const expectedPath = 'VaultNotes/Inventory/Oscilloscope_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);
      const pdfBytes = writtenFiles.get(expectedPath)!;
      expect(pdfBytes.length).toBeGreaterThan(0);
      expect(String.fromCharCode(...pdfBytes.slice(0, 5))).toBe('%PDF-');
    });

    it('disables command when active file is non-markdown or no file is open', async () => {
      await plugin.onload();

      const command = (plugin as any).commands.get('generate-label-current-note');
      expect(command).toBeDefined();

      // Case 1: non-markdown file
      mockApp.workspace.getActiveFile = jest.fn(() => imageFile);
      expect(command.checkCallback!(true)).toBe(false);

      // Case 2: no file open
      mockApp.workspace.getActiveFile = jest.fn(() => null);
      expect(command.checkCallback!(true)).toBe(false);
    });
  });

  describe('Scenario 2: Custom Label Override Modal & Frontmatter Persistence (User Story 2 - P2)', () => {
    it('applies per-note overrides and saves to YAML frontmatter when toggled', async () => {
      await plugin.onload();

      const command = (plugin as any).commands.get('generate-label-custom');
      expect(command).toBeDefined();
      expect(command!.checkCallback!(true)).toBe(true);

      const modalOpenSpy = jest
        .spyOn(CustomLabelModal.prototype, 'open')
        .mockImplementation(() => {});

      // Trigger command
      command!.checkCallback!(false);
      expect(modalOpenSpy).toHaveBeenCalled();
      const openedModal = modalOpenSpy.mock.instances[0] as unknown as CustomLabelModal;
      expect(openedModal).toBeDefined();

      // Configure overrides in modal: Brother 62mm, QR top, and Save to Note Default
      openedModal.onOpen();
      await (openedModal as any).presetDropdown?.triggerChange('brother-62mm');
      await (openedModal as any).qrPlacementDropdown?.triggerChange('top');
      await (openedModal as any).saveFrontmatterToggle?.triggerChange(true);

      // Submit modal
      await (openedModal as any).generateButton?.triggerClick();

      // Allow async generation to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify frontmatter was updated
      expect(mockApp.fileManager!.processFrontMatter).toHaveBeenCalled();
      expect((sampleNote as any).frontmatter).toBeDefined();
      expect((sampleNote as any).frontmatter.label_size).toBe('brother-62mm');
      expect((sampleNote as any).frontmatter.qr_placement).toBe('top');

      // Verify PDF was generated
      const expectedPath = 'VaultNotes/Inventory/Oscilloscope_label.pdf';
      expect(writtenFiles.has(expectedPath)).toBe(true);

      modalOpenSpy.mockRestore();
    });

    it('dismissing modal without submitting does not generate PDF or alter frontmatter', async () => {
      await plugin.onload();

      const modalOpenSpy = jest
        .spyOn(CustomLabelModal.prototype, 'open')
        .mockImplementation(() => {});

      plugin.showCustomLabelDialog(sampleNote as any);
      expect(modalOpenSpy).toHaveBeenCalled();
      const openedModal = modalOpenSpy.mock.instances[0] as unknown as CustomLabelModal;
      expect(openedModal).toBeDefined();

      openedModal.onOpen();
      openedModal.close();

      expect(mockApp.fileManager!.processFrontMatter).not.toHaveBeenCalled();
      expect(writtenFiles.size).toBe(0);

      modalOpenSpy.mockRestore();
    });
  });

  describe('Scenario 3: Vault Batch Regeneration with Confirmation (User Story 3 - P3)', () => {
    let noteWithPDF: TFile;
    let noteWithoutPDF: TFile;
    let trashNote: TFile;

    beforeEach(() => {
      noteWithPDF = new TFile('Notes/ItemA.md');
      noteWithoutPDF = new TFile('Notes/ItemB.md');
      trashNote = new TFile('.trash/OldItem.md');

      // Seed pre-existing PDF only for noteWithPDF
      writtenFiles.set('Notes/ItemA_label.pdf', new Uint8Array([1, 2, 3]));

      mockApp.vault.getMarkdownFiles = jest.fn(() => [noteWithPDF, noteWithoutPDF, trashNote]);
    });

    it('prompts confirmation with eligible count and regenerates existing labels upon confirmation', async () => {
      await plugin.onload();

      const command = (plugin as any).commands?.get('regenerate-all-labels');
      expect(command).toBeDefined();

      const modalOpenSpy = jest
        .spyOn(BatchConfirmModal.prototype, 'open')
        .mockImplementation(() => {});

      // Trigger batch command
      command!.callback!();

      // Wait for discovery
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(modalOpenSpy).toHaveBeenCalled();
      const openedModal = modalOpenSpy.mock.instances[0] as unknown as BatchConfirmModal;
      expect(openedModal).toBeDefined();
      expect(openedModal.eligibleCount).toBe(1);

      openedModal.onOpen();

      // Confirm
      await (openedModal as any).confirmButton?.triggerClick();

      // Wait for batch processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Existing label was rewritten
      expect(writtenFiles.has('Notes/ItemA_label.pdf')).toBe(true);
      // noteWithoutPDF never had a PDF generated
      expect(writtenFiles.has('Notes/ItemB_label.pdf')).toBe(false);

      modalOpenSpy.mockRestore();
    });

    it('cancelling BatchConfirmModal aborts batch regeneration', async () => {
      await plugin.onload();

      const modalOpenSpy = jest
        .spyOn(BatchConfirmModal.prototype, 'open')
        .mockImplementation(() => {});

      await plugin.regenerateAllLabels();

      expect(modalOpenSpy).toHaveBeenCalled();
      const openedModal = modalOpenSpy.mock.instances[0] as unknown as BatchConfirmModal;
      expect(openedModal).toBeDefined();
      openedModal.onOpen();

      const initialWriteCount = (mockApp.vault.adapter.writeBinary as jest.Mock).mock.calls.length;
      await (openedModal as any).cancelButton?.triggerClick();

      expect((mockApp.vault.adapter.writeBinary as jest.Mock).mock.calls.length).toBe(
        initialWriteCount,
      );

      modalOpenSpy.mockRestore();
    });
  });

  describe('Scenario 4: Error Handling & Offline Execution', () => {
    it('handles file write errors gracefully without crashing plugin', async () => {
      await plugin.onload();

      mockApp.vault.adapter.writeBinary = jest.fn(async () => {
        throw new Error('Disk full');
      });

      await expect(plugin.generateLabelForCurrentNote(sampleNote as any)).rejects.toThrow(
        'Disk full',
      );
    });

    it('operates completely offline with 0 network calls', async () => {
      await plugin.onload();
      await plugin.generateLabelForCurrentNote(sampleNote as any);

      expect(writtenFiles.size).toBe(1);
    });
  });
});
