import { discoverEligibleNotes, regenerateAllLabels } from '../../src/commands/batch-processor';
import { BatchConfirmModal } from '../../src/ui/batch-confirm-modal';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { App, TFile } from '../../tests/mocks/obsidian';

describe('Batch Label Regeneration - User Story 3 (P3)', () => {
  let mockApp: App;
  let file1: TFile;
  let file2: TFile;
  let trashFile: TFile;

  beforeEach(() => {
    file1 = new TFile('Notes/Item 1.md');
    file2 = new TFile('Notes/Item 2.md');
    trashFile = new TFile('.trash/Old Item.md');

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => file1),
      },
      vault: {
        getName: jest.fn(() => 'TestVault'),
        getMarkdownFiles: jest.fn(() => [file1, file2, trashFile]),
        adapter: {
          exists: jest.fn(async (path: string) => {
            // Only Item 1 has an existing label PDF
            return path === 'Notes/Item 1_label.pdf';
          }),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
  });

  describe('discoverEligibleNotes', () => {
    it('discovers only notes that already have existing label PDFs and ignores .trash', async () => {
      const eligible = await discoverEligibleNotes(mockApp as any, DEFAULT_SETTINGS);

      expect(eligible.length).toBe(1);
      expect(eligible[0].path).toBe('Notes/Item 1.md');
    });

    it('returns empty list when no existing label PDFs exist', async () => {
      mockApp.vault.adapter.exists = jest.fn(async () => false);

      const eligible = await discoverEligibleNotes(mockApp as any, DEFAULT_SETTINGS);
      expect(eligible.length).toBe(0);
    });
  });

  describe('regenerateAllLabels', () => {
    it('regenerates eligible notes and reports summary counts', async () => {
      const result = await regenerateAllLabels(mockApp as any, DEFAULT_SETTINGS);

      expect(result.totalEligible).toBe(1);
      expect(result.regeneratedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(mockApp.vault.adapter.writeBinary).toHaveBeenCalled();
    });

    it('handles note failure gracefully and records error in summary', async () => {
      mockApp.vault.adapter.writeBinary = jest.fn(async () => {
        throw new Error('Write failure');
      });

      const result = await regenerateAllLabels(mockApp as any, DEFAULT_SETTINGS);

      expect(result.totalEligible).toBe(1);
      expect(result.regeneratedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].path).toBe('Notes/Item 1.md');
    });
  });

  describe('BatchConfirmModal', () => {
    it('displays eligible note count and warning text', () => {
      const onConfirm = jest.fn(async () => {});
      const modal = new BatchConfirmModal(mockApp as any, 5, onConfirm);

      modal.open();

      expect(modal.contentEl.textContent).toContain('5 notes');
      expect(modal.contentEl.textContent).toContain('Existing label PDFs will be overwritten');
      expect(modal.confirmButton).toBeDefined();
      expect(modal.cancelButton).toBeDefined();
    });

    it('triggers onConfirm and dismisses dialog when confirmed', async () => {
      const onConfirm = jest.fn(async () => {});
      const modal = new BatchConfirmModal(mockApp as any, 3, onConfirm);

      modal.open();
      await (modal.confirmButton as any)?.triggerClick();

      expect(onConfirm).toHaveBeenCalled();
      expect((modal as any).isOpen).toBe(false);
    });

    it('dismisses dialog without invoking onConfirm when canceled', async () => {
      const onConfirm = jest.fn(async () => {});
      const modal = new BatchConfirmModal(mockApp as any, 3, onConfirm);

      modal.open();
      await (modal.cancelButton as any)?.triggerClick();

      expect(onConfirm).not.toHaveBeenCalled();
      expect((modal as any).isOpen).toBe(false);
    });
  });
});
