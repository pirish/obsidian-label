import ObsidianLabelPlugin from '../../src/main';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { settingsToLabelConfig, settingsToPDFExportOptions } from '../../src/settings/mappers';
import { ObsidianLabelSettingTab } from '../../src/ui/settings-tab';
import { PreviewModal } from '../../src/ui/preview-modal';
import { App } from '../../tests/mocks/obsidian';

describe('Settings Tab & Persistence Integration (Quickstart Scenarios)', () => {
  let mockApp: App;
  let plugin: ObsidianLabelPlugin;

  beforeEach(() => {
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => null),
      },
      vault: {
        getName: jest.fn(() => 'MainVault'),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
    plugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
  });

  describe('Scenario 1: Default Settings Initialization & Persistence', () => {
    it('initializes with DEFAULT_SETTINGS when no stored data exists', async () => {
      await plugin.onload();
      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
      expect(plugin.settings.defaultLabelSize).toBe('dymo-standard');
      expect(plugin.settings.qrCodePlacement).toBe('left');
    });

    it('persists modified settings across simulated plugin reloads', async () => {
      await plugin.onload();

      // Modify settings
      plugin.settings.defaultLabelSize = 'brother-62mm';
      plugin.settings.fontSize = 14;
      plugin.settings.fontColor = '#112233';
      plugin.settings.outputFolder = 'dedicated-folder';
      await plugin.saveSettings();

      // Create a new plugin instance simulating restart
      const reloadedPlugin = new ObsidianLabelPlugin(mockApp as any, {} as any);
      // Transfer stored data from first plugin
      (reloadedPlugin as any).storedData = await plugin.loadData();
      await reloadedPlugin.onload();

      expect(reloadedPlugin.settings.defaultLabelSize).toBe('brother-62mm');
      expect(reloadedPlugin.settings.fontSize).toBe(14);
      expect(reloadedPlugin.settings.fontColor).toBe('#112233');
      expect(reloadedPlugin.settings.outputFolder).toBe('dedicated-folder');
      // Verify other fields remain default
      expect(reloadedPlugin.settings.qrCodePlacement).toBe(DEFAULT_SETTINGS.qrCodePlacement);
    });

    it('falls back gracefully to DEFAULT_SETTINGS if stored data is empty or partial', async () => {
      (plugin as any).storedData = { fontSize: 18 };
      await plugin.onload();

      expect(plugin.settings.fontSize).toBe(18);
      expect(plugin.settings.defaultLabelSize).toBe('dymo-standard');
      expect(plugin.settings.fontFamily).toBe('Arial');
    });
  });

  describe('Scenario 2: Dynamic Custom Dimension Toggling & Validation', () => {
    it('toggles custom dimension visibility and updates settings via setting tab UI', async () => {
      await plugin.onload();
      const tab = new ObsidianLabelSettingTab(mockApp as any, plugin);
      tab.display();

      // Initially standard preset -> no custom inputs
      expect(tab.customWidthInput).toBeUndefined();
      expect(tab.customHeightInput).toBeUndefined();

      // Select Custom
      await (tab.presetDropdown as any)?.triggerChange('custom');
      expect(plugin.settings.defaultLabelSize).toBe('custom');
      expect(tab.customWidthInput).toBeDefined();
      expect(tab.customHeightInput).toBeDefined();

      // Enter valid custom dimensions
      await (tab.customWidthInput as any)?.triggerChange('60');
      await (tab.customHeightInput as any)?.triggerChange('40');
      expect(plugin.settings.customWidth).toBe(60);
      expect(plugin.settings.customHeight).toBe(40);

      // Verify mapping to engine config uses custom dimensions
      const config = settingsToLabelConfig(plugin.settings);
      expect(config.size.width).toBe(60);
      expect(config.size.height).toBe(40);

      // Select standard preset -> custom inputs hidden again
      await (tab.presetDropdown as any)?.triggerChange('brother-62mm');
      expect(tab.customWidthInput).toBeUndefined();
      expect(tab.customHeightInput).toBeUndefined();
      const brotherConfig = settingsToLabelConfig(plugin.settings);
      expect(brotherConfig.size.width).toBe(62);
      expect(brotherConfig.size.height).toBe(100);
    });
  });

  describe('Scenario 3: QR Layout, Typography, & Visual Styling', () => {
    it('adjusts visual properties and validates input changes', async () => {
      await plugin.onload();
      const tab = new ObsidianLabelSettingTab(mockApp as any, plugin);
      tab.display();

      // QR layout adjustments
      await (tab.qrPlacementDropdown as any)?.triggerChange('right');
      await (tab.qrSizeSlider as any)?.triggerChange(40);
      expect(plugin.settings.qrCodePlacement).toBe('right');
      expect(plugin.settings.qrCodeSize).toBe(40);

      // Typography adjustments
      await (tab.fontFamilyDropdown as any)?.triggerChange('Courier New');
      await (tab.fontSizeInput as any)?.triggerChange('15');
      expect(plugin.settings.fontFamily).toBe('Courier New');
      expect(plugin.settings.fontSize).toBe(15);

      // Color adjustments
      await (tab.fontColorInput as any)?.triggerChange('#003366');
      await (tab.backgroundColorInput as any)?.triggerChange('#F0F0F0');
      await (tab.borderColorInput as any)?.triggerChange('#444444');
      await (tab.borderWidthInput as any)?.triggerChange('3');

      expect(plugin.settings.fontColor).toBe('#003366');
      expect(plugin.settings.backgroundColor).toBe('#F0F0F0');
      expect(plugin.settings.borderColor).toBe('#444444');
      expect(plugin.settings.borderWidth).toBe(3);

      // Engine config reflects styling accurately
      const config = settingsToLabelConfig(plugin.settings);
      expect(config.layout?.qrCodePlacement).toBe('right');
      expect(config.layout?.qrCodeSize).toBe(0.4);
      expect(config.style?.fontFamily).toBe('Courier New');
      expect(config.style?.fontSize).toBe(15);
      expect(config.style?.fontColor).toBe('#003366');
      expect(config.style?.backgroundColor).toBe('#F0F0F0');
      expect(config.style?.borderWidth).toBe(3);
    });
  });

  describe('Scenario 4: Output Folder Routing & Timestamp Toggle', () => {
    it('maps output folder strategy and timestamp preference to PDFExportOptions', async () => {
      await plugin.onload();
      const tab = new ObsidianLabelSettingTab(mockApp as any, plugin);
      tab.display();

      // Same as note
      let exportOptions = settingsToPDFExportOptions(plugin.settings);
      expect(exportOptions.location).toBe('same-folder');
      expect(exportOptions.naming?.includeTimestamp).toBe(false);

      // Dedicated folder
      await (tab.outputFolderDropdown as any)?.triggerChange('dedicated-folder');
      await (tab.timestampToggle as any)?.triggerChange(true);
      exportOptions = settingsToPDFExportOptions(plugin.settings);
      expect(exportOptions.location).toBe('dedicated-folder');
      expect(exportOptions.naming?.includeTimestamp).toBe(true);

      // Custom folder
      await (tab.outputFolderDropdown as any)?.triggerChange('custom');
      expect(tab.customOutputPathInput).toBeDefined();
      await (tab.customOutputPathInput as any)?.triggerChange('Archive/Labels');
      exportOptions = settingsToPDFExportOptions(plugin.settings);
      expect(exportOptions.location).toBe('custom-folder');
      expect(exportOptions.customFolder).toBe('Archive/Labels');
    });
  });

  describe('Scenario 5: Live Sample Preview Modal with Active Note & Fallback', () => {
    it('generates sample label preview with active note from settings tab preview trigger', async () => {
      mockApp.workspace.getActiveFile = jest.fn(() => ({
        basename: 'Lab Inventory 01',
        name: 'Lab Inventory 01.md',
        path: 'Inventory/Lab Inventory 01.md',
      }));

      await plugin.onload();
      const tab = new ObsidianLabelSettingTab(mockApp as any, plugin);
      tab.display();

      // Trigger preview button
      expect(tab.previewButton).toBeDefined();
      const previewSpy = jest.spyOn(plugin, 'generatePreviewLabel');
      await (tab.previewButton as any)?.triggerClick();
      expect(previewSpy).toHaveBeenCalled();

      // Open PreviewModal directly to verify rendering pipeline
      const modal = new PreviewModal(mockApp as any, plugin.settings, undefined, plugin.generator);
      modal.open();
      await modal.onOpen();

      expect((modal as any).isOpen).toBe(true);
      expect(modal.previewContent.isSampleFallback).toBe(false);
      expect(modal.previewContent.noteTitle).toBe('Lab Inventory 01');
      expect(modal.previewImageEl).toBeDefined();
      expect(modal.previewImageEl?.getAttribute('src')).toMatch(/^data:image\/png;base64,/);

      // Dismiss modal
      (modal.closeButton as any)?.triggerClick();
      expect((modal as any).isOpen).toBe(false);
    });

    it('generates fallback sample preview when no file is active', async () => {
      mockApp.workspace.getActiveFile = jest.fn(() => null);

      await plugin.onload();
      const modal = new PreviewModal(mockApp as any, plugin.settings, undefined, plugin.generator);
      modal.open();
      await modal.onOpen();

      expect(modal.previewContent.isSampleFallback).toBe(true);
      expect(modal.previewContent.noteTitle).toBe('Sample Equipment Note');
      expect(modal.previewImageEl).toBeDefined();
      expect(modal.previewImageEl?.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });
  });
});
