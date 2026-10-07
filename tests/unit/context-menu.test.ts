import {
  registerFileMenuEvents,
  generateLabelsForSelectedNotes,
} from '../../src/commands/context-menu';
import { LabelGenerator } from '../../src/core/label-generator';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { App, Menu, MockWorkspace, Plugin, TFile } from '../../tests/mocks/obsidian';

class MockPlugin extends Plugin {
  public settings = { ...DEFAULT_SETTINGS };
  public generator = new LabelGenerator();
  public generateLabelCalledWith: any = null;
}

describe('File Explorer Context Menu Actions', () => {
  let mockApp: App;
  let mockWorkspace: MockWorkspace;
  let plugin: MockPlugin;
  let note1: TFile;
  let note2: TFile;
  let imageFile: TFile;
  let folderObj: any;

  beforeEach(() => {
    mockWorkspace = new MockWorkspace();
    note1 = new TFile('Notes/Item 1.md');
    note2 = new TFile('Notes/Item 2.md');
    imageFile = new TFile('Assets/diagram.png');
    folderObj = { path: 'Notes', name: 'Notes' }; // not a markdown file

    mockWorkspace.activeFile = note1;

    mockApp = {
      workspace: mockWorkspace,
      vault: {
        getName: jest.fn(() => 'TestVault'),
        getMarkdownFiles: jest.fn(() => [note1, note2]),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };

    plugin = new MockPlugin(mockApp as any);
  });

  describe('User Story 1 - Single-Note File Menu (P1 MVP)', () => {
    it('appends "Generate Label" with "tag" icon when target is a markdown note', () => {
      registerFileMenuEvents(plugin as any);

      const menu = new Menu();
      mockWorkspace.trigger('file-menu', menu, note1);

      expect(menu.items.length).toBe(1);
      expect(menu.items[0].title).toBe('Generate Label');
      expect(menu.items[0].icon).toBe('tag');
    });

    it('does not append menu item when target is non-markdown file or folder', () => {
      registerFileMenuEvents(plugin as any);

      // Non-markdown file
      const menuImage = new Menu();
      mockWorkspace.trigger('file-menu', menuImage, imageFile);
      expect(menuImage.items.length).toBe(0);

      // Folder
      const menuFolder = new Menu();
      mockWorkspace.trigger('file-menu', menuFolder, folderObj);
      expect(menuFolder.items.length).toBe(0);
    });

    it('generates label for target file when menu item is clicked', async () => {
      registerFileMenuEvents(plugin as any);

      const menu = new Menu();
      mockWorkspace.trigger('file-menu', menu, note1);
      expect(menu.items.length).toBe(1);

      await menu.items[0].triggerClick();

      expect(mockApp.vault.adapter.writeBinary).toHaveBeenCalled();
    });
  });

  describe('User Story 2 - Target Note Independence (P2)', () => {
    it('generates label strictly for right-clicked note even if different note is active in workspace', async () => {
      // Active file in workspace is note1
      mockWorkspace.activeFile = note1;
      registerFileMenuEvents(plugin as any);

      const menu = new Menu();
      // Right-click targets note2
      mockWorkspace.trigger('file-menu', menu, note2);
      expect(menu.items.length).toBe(1);

      await menu.items[0].triggerClick();

      // Verify the file written matches note2's target path
      const calls = (mockApp.vault.adapter.writeBinary as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('Item 2_label.pdf');
    });
  });

  describe('User Story 3 - Multi-File Selection Context Menu (P3)', () => {
    it('appends "Generate Labels" with "tag" icon when multiple markdown notes are selected', () => {
      registerFileMenuEvents(plugin as any);

      const menu = new Menu();
      mockWorkspace.trigger('files-menu', menu, [note1, note2]);

      expect(menu.items.length).toBe(1);
      expect(menu.items[0].title).toBe('Generate Labels');
      expect(menu.items[0].icon).toBe('tag');
    });

    it('appends "Generate Labels" for mixed selection containing at least one markdown note', () => {
      registerFileMenuEvents(plugin as any);

      const menu = new Menu();
      mockWorkspace.trigger('files-menu', menu, [note1, imageFile, folderObj]);

      expect(menu.items.length).toBe(1);
      expect(menu.items[0].title).toBe('Generate Labels');
    });

    it('omits menu item when multi-selection contains zero markdown notes', () => {
      registerFileMenuEvents(plugin as any);

      const menu = new Menu();
      mockWorkspace.trigger('files-menu', menu, [imageFile, folderObj]);

      expect(menu.items.length).toBe(0);
    });

    it('generates labels for all selected markdown notes and yields progress', async () => {
      const progressTracker: number[] = [];
      const result = await generateLabelsForSelectedNotes(
        mockApp as any,
        [note1, note2],
        DEFAULT_SETTINGS,
        undefined,
        (current) => progressTracker.push(current),
      );

      expect(result.totalSelected).toBe(2);
      expect(result.generatedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(progressTracker).toEqual([1, 2]);
      expect((mockApp.vault.adapter.writeBinary as jest.Mock).mock.calls.length).toBe(2);
    });

    it('handles note failure gracefully during multi-selection batch generation', async () => {
      mockApp.vault.adapter.writeBinary = jest.fn(async (path: string) => {
        if (path.includes('Item 2')) {
          throw new Error('Write error on Item 2');
        }
      });

      const result = await generateLabelsForSelectedNotes(
        mockApp as any,
        [note1, note2],
        DEFAULT_SETTINGS,
      );

      expect(result.totalSelected).toBe(2);
      expect(result.generatedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].path).toBe('Notes/Item 2.md');
    });
  });
});
