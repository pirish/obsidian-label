import { PreviewModal, resolvePreviewContent } from '../../src/ui/preview-modal';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';
import { App } from '../../tests/mocks/obsidian';

describe('Preview Modal & Payload Resolver (User Story 4)', () => {
  let mockApp: App;

  beforeEach(() => {
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => null),
      },
      vault: {
        getName: jest.fn(() => 'TestVault'),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
  });

  describe('resolvePreviewContent', () => {
    it('uses active note title and path when a markdown file is active in workspace', () => {
      mockApp.workspace.getActiveFile = jest.fn(() => ({
        basename: 'Laser Cutter Manual',
        name: 'Laser Cutter Manual.md',
        path: 'Workshop/Tools/Laser Cutter Manual.md',
      }));

      const payload = resolvePreviewContent(mockApp as any);

      expect(payload.isSampleFallback).toBe(false);
      expect(payload.noteTitle).toBe('Laser Cutter Manual');
      expect(payload.notePath).toBe('Workshop/Tools/Laser Cutter Manual.md');
      expect(payload.obsidianUri).toBe(
        'obsidian://open?vault=TestVault&file=Workshop%2FTools%2FLaser%20Cutter%20Manual.md',
      );
    });

    it('falls back to realistic sample payload when no active file is open', () => {
      mockApp.workspace.getActiveFile = jest.fn(() => null);

      const payload = resolvePreviewContent(mockApp as any);

      expect(payload.isSampleFallback).toBe(true);
      expect(payload.noteTitle).toBe('Sample Equipment Note');
      expect(payload.notePath).toBe('Equipment/Lab Sensor A.md');
      expect(payload.obsidianUri).toContain('obsidian://open?vault=');
      expect(payload.customFields).toEqual({
        Serial: 'SN-90210',
        Location: 'Rack 4B',
      });
    });
  });

  describe('PreviewModal Rendering & Lifecycle', () => {
    it('renders preview with active note data and generates image element', async () => {
      mockApp.workspace.getActiveFile = jest.fn(() => ({
        basename: 'Microscope Specs',
        name: 'Microscope Specs.md',
        path: 'Lab/Microscope Specs.md',
      }));

      const modal = new PreviewModal(mockApp as any, { ...DEFAULT_SETTINGS });
      modal.open();
      // Allow async render in onOpen to finish
      await modal.onOpen();

      expect((modal as any).isOpen).toBe(true);
      expect(modal.previewContent.isSampleFallback).toBe(false);
      expect(modal.previewContent.noteTitle).toBe('Microscope Specs');

      // Check title and content
      expect(modal.titleEl.textContent).toBe('Label Preview');
      expect(modal.contentEl.textContent).toContain('Previewing Active Note: Microscope Specs');
      expect(modal.contentEl.textContent).toContain('dymo-standard');

      // Check generated image element
      expect(modal.previewImageEl).toBeDefined();
      const src = modal.previewImageEl?.getAttribute('src');
      expect(src).toMatch(/^data:image\/png;base64,/);

      // Check close button
      expect(modal.closeButton).toBeDefined();
      (modal.closeButton as any)?.triggerClick();
      expect((modal as any).isOpen).toBe(false);
    });

    it('renders preview with sample fallback when no file is active', async () => {
      mockApp.workspace.getActiveFile = jest.fn(() => null);

      const modal = new PreviewModal(mockApp as any, { ...DEFAULT_SETTINGS });
      modal.open();
      await modal.onOpen();

      expect(modal.previewContent.isSampleFallback).toBe(true);
      expect(modal.contentEl.textContent).toContain('Previewing Sample Note');
      expect(modal.previewImageEl).toBeDefined();
      expect(modal.previewImageEl?.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });

    it('displays error and aborts rendering if settings are invalid', async () => {
      const invalidSettings: ObsidianLabelSettings = {
        ...DEFAULT_SETTINGS,
        defaultLabelSize: 'custom',
        customWidth: -50, // invalid width
      };

      const modal = new PreviewModal(mockApp as any, invalidSettings);
      modal.open();
      await modal.onOpen();

      expect(modal.contentEl.textContent).toContain('Custom width must be a positive number');
      expect(modal.previewImageEl).toBeUndefined();
      expect(modal.closeButton).toBeDefined();
    });
  });
});
