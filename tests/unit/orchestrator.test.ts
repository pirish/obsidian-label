import {
  generateLabelForNote,
  resolveEffectiveSettingsForNote,
} from '../../src/commands/orchestrator';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { App, TFile } from '../../tests/mocks/obsidian';

describe('Label Generation Orchestrator (Foundational)', () => {
  let mockApp: App;
  let mockFile: TFile;

  beforeEach(() => {
    mockFile = new TFile('Inventory/Sensor A.md');
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => mockFile),
      },
      vault: {
        getName: jest.fn(() => 'TestVault'),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
      metadataCache: {
        getFileCache: jest.fn(() => null),
      },
      fileManager: {
        processFrontMatter: jest.fn(async (_file: any, fn: any) => {
          const fm: Record<string, any> = {};
          fn(fm);
        }),
      },
    };
  });

  describe('resolveEffectiveSettingsForNote', () => {
    it('uses global settings when no frontmatter and no overrides exist', async () => {
      const effective = await resolveEffectiveSettingsForNote(
        mockApp as any,
        mockFile as any,
        DEFAULT_SETTINGS,
      );
      expect(effective).toEqual(DEFAULT_SETTINGS);
    });

    it('applies note frontmatter properties over global settings', async () => {
      mockApp.metadataCache!.getFileCache = jest.fn(() => ({
        frontmatter: {
          label_size: 'brother-62mm',
          qr_placement: 'top',
          qr_size: 35,
        },
      }));

      const effective = await resolveEffectiveSettingsForNote(
        mockApp as any,
        mockFile as any,
        DEFAULT_SETTINGS,
      );

      expect(effective.defaultLabelSize).toBe('brother-62mm');
      expect(effective.qrCodePlacement).toBe('top');
      expect(effective.qrCodeSize).toBe(35);
      // Fallback preserved
      expect(effective.fontFamily).toBe(DEFAULT_SETTINGS.fontFamily);
    });

    it('prioritizes temporary overrides over note frontmatter and global settings', async () => {
      mockApp.metadataCache!.getFileCache = jest.fn(() => ({
        frontmatter: {
          label_size: 'brother-62mm',
          qr_placement: 'top',
        },
      }));

      const effective = await resolveEffectiveSettingsForNote(
        mockApp as any,
        mockFile as any,
        DEFAULT_SETTINGS,
        {
          defaultLabelSize: 'phomemo-40x30',
          qrCodePlacement: 'right',
        },
      );

      expect(effective.defaultLabelSize).toBe('phomemo-40x30');
      expect(effective.qrCodePlacement).toBe('right');
    });

    it('updates note frontmatter when saveToFrontmatter is true', async () => {
      const savedFrontmatter: Record<string, any> = {};
      mockApp.fileManager!.processFrontMatter = jest.fn(async (_file: any, fn: any) => {
        fn(savedFrontmatter);
      });

      await resolveEffectiveSettingsForNote(mockApp as any, mockFile as any, DEFAULT_SETTINGS, {
        defaultLabelSize: 'custom',
        customWidth: 50,
        customHeight: 30,
        qrCodePlacement: 'bottom',
        saveToFrontmatter: true,
      });

      expect(mockApp.fileManager!.processFrontMatter).toHaveBeenCalled();
      expect(savedFrontmatter['label_size']).toBe('custom');
      expect(savedFrontmatter['custom_width']).toBe(50);
      expect(savedFrontmatter['custom_height']).toBe(30);
      expect(savedFrontmatter['qr_placement']).toBe('bottom');
      expect(savedFrontmatter['label']).toEqual({
        labelSize: 'custom',
        customWidth: 50,
        customHeight: 30,
        qrCodePlacement: 'bottom',
      });
    });

    it('applies nested label.* frontmatter overrides for template, qrCodeSize, and fontSize', async () => {
      mockApp.metadataCache!.getFileCache = jest.fn(() => ({
        frontmatter: {
          label: {
            template: 'inventory',
            qrCodeSize: 35,
            fontSize: 14,
          },
        },
      }));

      const effective = await resolveEffectiveSettingsForNote(
        mockApp as any,
        mockFile as any,
        DEFAULT_SETTINGS,
      );

      expect(effective.defaultTemplate).toBe('inventory');
      expect(effective.customWidth).toBe(100);
      expect(effective.customHeight).toBe(50);
      expect(effective.qrCodeSize).toBe(35);
      expect(effective.fontSize).toBe(14);
    });
  });

  describe('generateLabelForNote', () => {
    it('generates and saves PDF to vault with success notice', async () => {
      const result = await generateLabelForNote(mockApp as any, mockFile as any, DEFAULT_SETTINGS);

      expect(result).toBeDefined();
      expect(result.filePath).toBe('Inventory/Sensor A_label.pdf');
      expect(mockApp.vault.adapter.writeBinary).toHaveBeenCalled();
    });

    it('propagates error and displays notice on failure', async () => {
      mockApp.vault.adapter.writeBinary = jest.fn(async () => {
        throw new Error('Disk full');
      });

      await expect(
        generateLabelForNote(mockApp as any, mockFile as any, DEFAULT_SETTINGS),
      ).rejects.toThrow('Disk full');
    });
  });
});
