import { BatchLabelModal } from '../../src/ui/batch-label-modal';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';
import { TFile } from '../mocks/obsidian';
import { clearBatchPageCache, recordBatchPage } from '../../src/core/pdf-exporter';

describe('BatchLabelModal (Feature 010 - US1, US2, US3)', () => {
  let mockApp: any;
  let mockPlugin: {
    app: any;
    settings: ObsidianLabelSettings;
    saveSettings: jest.Mock;
    generateLabelForNote: jest.Mock;
  };
  let files: any[];
  let writtenFiles: Map<string, ArrayBuffer>;

  beforeEach(() => {
    clearBatchPageCache();
    writtenFiles = new Map();

    files = Array.from({ length: 12 }, (_, idx) => new TFile(`Inventory/Item${idx + 1}.md`));
    files.push(new TFile('Inventory/Sub/NestedItem.md'));

    mockApp = {
      workspace: { getActiveFile: jest.fn(() => null) },
      vault: {
        getName: () => 'TestVault',
        getMarkdownFiles: () => files,
        cachedRead: jest.fn(async (f: TFile) => `Body content for ${f.basename}`),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            writtenFiles.set(path, data);
          }),
          readBinary: jest.fn(async () => new ArrayBuffer(16)),
          mkdir: jest.fn(async () => {}),
        },
      },
      metadataCache: {
        getFileCache: jest.fn((f: TFile) => {
          if (f.basename === 'Item1' || f.basename === 'Item2') {
            return { frontmatter: { tags: ['featured'] } };
          }
          return null;
        }),
      },
    };

    mockPlugin = {
      app: mockApp,
      settings: { ...DEFAULT_SETTINGS, mergeBatchPDFs: false },
      saveSettings: jest.fn(async () => {}),
      generateLabelForNote: jest.fn(async (note: TFile) => {
        const pdfPath = note.path.replace(/\.md$/, '_label.pdf');
        recordBatchPage({
          pdfPath,
          widthMm: 89,
          heightMm: 28,
        });
        return pdfPath;
      }),
    };
  });

  describe('User Story 1: Selection UI & Live Preview', () => {
    it('shows preview count, up to 10 note paths, and "... and X more" when > 10 notes match', async () => {
      const modal = new BatchLabelModal(mockApp as any, mockPlugin);
      modal.open();

      expect(modal.selectedNotes.length).toBe(13);
      expect(modal.previewContainer.textContent).toContain('13 labels will be generated');
      expect(modal.previewContainer.textContent).toContain('... and 3 more');
      expect(modal.generateButton?.disabled).toBe(false);

      // Toggle "Include subfolders" off for Inventory folder
      await (modal.folderDropdown as any)?.triggerChange('Inventory');
      expect(modal.selectedNotes.length).toBe(13);

      await (modal.includeSubfoldersToggle as any)?.triggerChange(false);
      expect(modal.selectedNotes.length).toBe(12);
      expect(modal.previewContainer.textContent).toContain('12 labels will be generated');
      expect(modal.previewContainer.textContent).toContain('... and 2 more');
    });

    it('updates selection and preview when switching to Tag or Search mode, disabling CTA when 0 match', async () => {
      const modal = new BatchLabelModal(mockApp as any, mockPlugin);
      modal.open();

      // Switch to Tag mode (initially empty tag -> 0 selected)
      await (modal.selectionMethodDropdown as any)?.triggerChange('tag');
      expect(modal.selectedNotes.length).toBe(0);
      expect(modal.previewContainer.textContent).toContain('No notes selected');
      expect(modal.generateButton?.disabled).toBe(true);

      // Type '#featured' tag -> 2 matches
      await (modal.tagInput as any)?.triggerChange('#featured');
      expect(modal.selectedNotes.length).toBe(2);
      expect(modal.previewContainer.textContent).toContain('2 labels will be generated');
      expect(modal.generateButton?.disabled).toBe(false);

      // Switch to Search mode
      await (modal.selectionMethodDropdown as any)?.triggerChange('search');
      await (modal.searchInput as any)?.triggerChange('NestedItem');
      expect(modal.selectedNotes.length).toBe(1);
      expect(modal.selectedNotes[0].path).toBe('Inventory/Sub/NestedItem.md');
    });
  });

  describe('User Story 2: Batch Generation & Fault Tolerance', () => {
    it('continues generating remaining labels when an individual note throws an error', async () => {
      const modal = new BatchLabelModal(mockApp as any, mockPlugin);
      modal.open();

      modal.selectedNotes = [files[0], files[1], files[2]];
      await modal.updatePreview();

      mockPlugin.generateLabelForNote
        .mockResolvedValueOnce('Inventory/Item1_label.pdf')
        .mockRejectedValueOnce(new Error('Disk write error'))
        .mockResolvedValueOnce('Inventory/Item3_label.pdf');

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await modal.generateBatchLabels();

      expect(mockPlugin.generateLabelForNote).toHaveBeenCalledTimes(3);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to generate label for Inventory/Item2.md:',
        expect.any(Error),
      );
      expect((modal as any).isOpen).toBe(false);

      errorSpy.mockRestore();
    });
  });

  describe('User Story 3: Multi-Page Merged PDF Output', () => {
    it('merges generated PDFs into labels_batch_YYYY-MM-DD.pdf when mergeBatchPDFs is enabled', async () => {
      mockPlugin.settings.mergeBatchPDFs = true;
      const modal = new BatchLabelModal(mockApp as any, mockPlugin);
      modal.open();

      modal.selectedNotes = [files[0], files[1], files[2]];
      await modal.generateBatchLabels();

      const expectedDate = new Date().toISOString().split('T')[0];
      const expectedMergedPath = `labels_batch_${expectedDate}.pdf`;

      expect(mockApp.vault.adapter.readBinary).toHaveBeenCalledTimes(3);
      expect(writtenFiles.has(expectedMergedPath)).toBe(true);

      const mergedBuffer = writtenFiles.get(expectedMergedPath)!;
      const pdfString = Buffer.from(mergedBuffer).toString('latin1');
      expect(pdfString.startsWith('%PDF-')).toBe(true);
      // Verify 3 page objects exist in the merged PDF
      const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g) || [];
      expect(pageMatches.length).toBe(3);
    });
  });
});
