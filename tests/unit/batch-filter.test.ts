import {
  discoverVaultFolders,
  extractNormalizedTagsForFile,
  filterNotesByFolder,
  filterNotesBySearch,
  filterNotesByTag,
} from '../../src/commands/batch-processor';
import { TFile } from '../mocks/obsidian';

describe('Batch Note Selection Filters (Feature 010 - US1)', () => {
  let files: any[];
  let mockApp: any;
  let fileContents: Record<string, string>;
  let fileCaches: Record<string, any>;

  beforeEach(() => {
    files = [
      new TFile('RootNote.md'),
      new TFile('Inventory/Server.md'),
      new TFile('Inventory/Router.md'),
      new TFile('Inventory/Tools/Multimeter.md'),
      new TFile('Inventory/Tools/SolderingIron.md'),
      new TFile('Archive/OldBox.md'),
      new TFile('templates/ItemTemplate.md'),
      new TFile('_templates/BaseTemplate.md'),
      new TFile('.obsidian/config.md'),
      new TFile('Inventory/Diagram.png'),
    ];

    fileContents = {
      'RootNote.md': 'Welcome to the lab documentation.',
      'Inventory/Server.md': 'Rack server serial SRV-9001 located in Cage B.',
      'Inventory/Router.md': 'Core network router with SFP+ uplink.',
      'Inventory/Tools/Multimeter.md': 'Fluke digital multimeter for voltage testing.',
      'Inventory/Tools/SolderingIron.md': 'Temperature controlled soldering station.',
      'Archive/OldBox.md': 'Decommissioned cables and adapters.',
    };

    fileCaches = {
      'Inventory/Server.md': {
        frontmatter: { tags: ['inventory', 'hardware/network'] },
      },
      'Inventory/Router.md': {
        frontmatter: { tags: '#inventory, #network' },
      },
      'Inventory/Tools/Multimeter.md': {
        tags: [{ tag: '#tools' }, { tag: '#inventory/calibrated' }],
      },
      'Archive/OldBox.md': {
        frontmatter: { tag: 'archived' },
      },
    };

    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => null),
      },
      vault: {
        getName: () => 'TestVault',
        getMarkdownFiles: () => files,
        cachedRead: jest.fn(async (file: TFile) => fileContents[file.path] || ''),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
          read: jest.fn(async (path: string) => fileContents[path] || ''),
        },
      },
      metadataCache: {
        getFileCache: jest.fn((file: TFile) => fileCaches[file.path] || null),
      },
    };
  });

  describe('discoverVaultFolders', () => {
    it('discovers root and all non-excluded folder paths sorted alphabetically', () => {
      const folders = discoverVaultFolders(mockApp);
      expect(folders).toEqual(['/', 'Archive', 'Inventory', 'Inventory/Tools']);
    });
  });

  describe('filterNotesByFolder', () => {
    it('matches notes in folder and nested subfolders when includeSubfolders is true', () => {
      const matched = filterNotesByFolder(files, 'Inventory', true);
      expect(matched.map((f) => f.path)).toEqual([
        'Inventory/Server.md',
        'Inventory/Router.md',
        'Inventory/Tools/Multimeter.md',
        'Inventory/Tools/SolderingIron.md',
      ]);
    });

    it('matches only direct child notes when includeSubfolders is false', () => {
      const matched = filterNotesByFolder(files, 'Inventory', false);
      expect(matched.map((f) => f.path)).toEqual(['Inventory/Server.md', 'Inventory/Router.md']);
    });

    it('matches all non-excluded vault notes for root "/" when includeSubfolders is true', () => {
      const matched = filterNotesByFolder(files, '/', true);
      expect(matched.map((f) => f.path)).toEqual([
        'RootNote.md',
        'Inventory/Server.md',
        'Inventory/Router.md',
        'Inventory/Tools/Multimeter.md',
        'Inventory/Tools/SolderingIron.md',
        'Archive/OldBox.md',
      ]);
    });

    it('matches only top-level root notes for "/" when includeSubfolders is false', () => {
      const matched = filterNotesByFolder(files, '/', false);
      expect(matched.map((f) => f.path)).toEqual(['RootNote.md']);
    });
  });

  describe('filterNotesByTag', () => {
    it('normalizes tags with or without leading # across frontmatter and inline tags', () => {
      const withHash = filterNotesByTag(mockApp, files, '#inventory');
      const withoutHash = filterNotesByTag(mockApp, files, 'INVENTORY');

      expect(withHash.map((f) => f.path)).toEqual([
        'Inventory/Server.md',
        'Inventory/Router.md',
        'Inventory/Tools/Multimeter.md',
      ]);
      expect(withoutHash.map((f) => f.path)).toEqual(withHash.map((f) => f.path));
    });

    it('matches inline tags and singular frontmatter tag key', () => {
      const tools = filterNotesByTag(mockApp, files, 'tools');
      expect(tools.map((f) => f.path)).toEqual(['Inventory/Tools/Multimeter.md']);

      const archived = filterNotesByTag(mockApp, files, '#archived');
      expect(archived.map((f) => f.path)).toEqual(['Archive/OldBox.md']);
    });

    it('returns empty array when tag query is blank or unmatched', () => {
      expect(filterNotesByTag(mockApp, files, '   ')).toEqual([]);
      expect(filterNotesByTag(mockApp, files, '#nonexistent')).toEqual([]);
    });

    it('extractNormalizedTagsForFile extracts all normalized tags', () => {
      const serverFile = files.find((f) => f.path === 'Inventory/Server.md')!;
      expect(extractNormalizedTagsForFile(mockApp, serverFile)).toEqual([
        'inventory',
        'hardware/network',
      ]);
    });
  });

  describe('filterNotesBySearch', () => {
    it('matches notes by title, path, or body content case-insensitively', async () => {
      const byTitle = await filterNotesBySearch(mockApp, files, 'multimeter');
      expect(byTitle.map((f) => f.path)).toEqual(['Inventory/Tools/Multimeter.md']);

      const byContent = await filterNotesBySearch(mockApp, files, 'SRV-9001');
      expect(byContent.map((f) => f.path)).toEqual(['Inventory/Server.md']);

      const byFolder = await filterNotesBySearch(mockApp, files, 'inventory/tools');
      expect(byFolder.map((f) => f.path)).toEqual([
        'Inventory/Tools/Multimeter.md',
        'Inventory/Tools/SolderingIron.md',
      ]);
    });

    it('returns empty array when search query is blank or matches no notes', async () => {
      expect(await filterNotesBySearch(mockApp, files, '')).toEqual([]);
      expect(await filterNotesBySearch(mockApp, files, 'zzzz_no_match')).toEqual([]);
    });
  });
});
