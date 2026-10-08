import { ObsidianLabelSettingTab } from '../../src/ui/settings-tab';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';
import { App, Plugin } from '../../tests/mocks/obsidian';

class MockPlugin extends Plugin {
  public settings: ObsidianLabelSettings = { ...DEFAULT_SETTINGS };
  public saveSettingsCalled: boolean = false;
  public generatePreviewCalled: boolean = false;

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    this.saveSettingsCalled = true;
    await this.saveData(this.settings);
  }

  async generatePreviewLabel(): Promise<void> {
    this.generatePreviewCalled = true;
  }
}

describe('ObsidianLabelSettingTab (User Stories 1-3)', () => {
  let app: App;
  let plugin: MockPlugin;
  let settingTab: ObsidianLabelSettingTab;

  beforeEach(() => {
    app = {
      workspace: { getActiveFile: jest.fn(() => null) },
      vault: {
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
    plugin = new MockPlugin(app);
    settingTab = new ObsidianLabelSettingTab(app as any, plugin as any);
  });

  describe('User Story 1: Preset Selection & Dynamic Custom Dimensions (P1 MVP)', () => {
    it('renders preset dropdown with all standard presets and custom option', () => {
      settingTab.display();

      const presetDropdown = settingTab.presetDropdown as any;
      expect(presetDropdown).toBeDefined();
      expect(presetDropdown?.options).toHaveProperty('dymo-standard');
      expect(presetDropdown?.options).toHaveProperty('brother-62mm');
      expect(presetDropdown?.options).toHaveProperty('avery-5160');
      expect(presetDropdown?.options).toHaveProperty('phomemo-40x30');
      expect(presetDropdown?.options).toHaveProperty('generic-square-50');
      expect(presetDropdown?.options).toHaveProperty('custom');
      expect(presetDropdown?.getValue()).toBe('dymo-standard');
    });

    it('hides custom width and height inputs when a standard preset is selected', () => {
      plugin.settings.defaultLabelSize = 'dymo-standard';
      settingTab.display();

      expect(settingTab.customWidthInput).toBeUndefined();
      expect(settingTab.customHeightInput).toBeUndefined();
    });

    it('dynamically displays custom width and height inputs when custom is selected', async () => {
      settingTab.display();

      // Switch to custom size
      await (settingTab.presetDropdown as any)?.triggerChange('custom');

      expect(plugin.settings.defaultLabelSize).toBe('custom');
      expect(plugin.saveSettingsCalled).toBe(true);

      // Custom inputs should now exist
      expect(settingTab.customWidthInput).toBeDefined();
      expect(settingTab.customHeightInput).toBeDefined();
      expect(settingTab.customWidthInput?.getValue()).toBe('89');
      expect(settingTab.customHeightInput?.getValue()).toBe('28');
    });

    it('updates and persists valid custom dimensions', async () => {
      plugin.settings.defaultLabelSize = 'custom';
      settingTab.display();

      await (settingTab.customWidthInput as any)?.triggerChange('50');
      await (settingTab.customHeightInput as any)?.triggerChange('30');

      expect(plugin.settings.customWidth).toBe(50);
      expect(plugin.settings.customHeight).toBe(30);
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('rejects invalid or non-positive custom dimensions with feedback', async () => {
      plugin.settings.defaultLabelSize = 'custom';
      settingTab.display();

      // Trigger invalid width
      plugin.saveSettingsCalled = false;
      await (settingTab.customWidthInput as any)?.triggerChange('-10');

      // Should not save negative dimension
      expect(plugin.settings.customWidth).toBe(89); // remains previous valid
      expect(plugin.saveSettingsCalled).toBe(false);

      // Trigger non-numeric input
      await (settingTab.customHeightInput as any)?.triggerChange('abc');
      expect(plugin.settings.customHeight).toBe(28); // remains previous valid
      expect(plugin.saveSettingsCalled).toBe(false);
    });
  });

  describe('User Story 2: Layout, Typography, & Visual Styling (P2)', () => {
    it('updates QR code placement preference', async () => {
      settingTab.display();

      const qrPlacement = settingTab.qrPlacementDropdown as any;
      expect(qrPlacement).toBeDefined();

      await qrPlacement?.triggerChange('top');
      expect(plugin.settings.qrCodePlacement).toBe('top');
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('updates QR code size slider preference', async () => {
      settingTab.display();

      const qrSlider = settingTab.qrSizeSlider as any;
      expect(qrSlider).toBeDefined();

      await qrSlider?.triggerChange(35);
      expect(plugin.settings.qrCodeSize).toBe(35);
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('updates typography font family and size', async () => {
      settingTab.display();

      await (settingTab.fontFamilyDropdown as any)?.triggerChange('Georgia');
      expect(plugin.settings.fontFamily).toBe('Georgia');

      await (settingTab.fontSizeInput as any)?.triggerChange('16');
      expect(plugin.settings.fontSize).toBe(16);
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('updates colors and validates hex format', async () => {
      settingTab.display();

      // Valid font color
      await (settingTab.fontColorInput as any)?.triggerChange('#123456');
      expect(plugin.settings.fontColor).toBe('#123456');

      // Invalid color should be rejected
      plugin.saveSettingsCalled = false;
      await (settingTab.fontColorInput as any)?.triggerChange('invalid-color');
      expect(plugin.settings.fontColor).toBe('#123456'); // unchanged
      expect(plugin.saveSettingsCalled).toBe(false);

      // Background and border colors
      await (settingTab.backgroundColorInput as any)?.triggerChange('#FAFAFA');
      expect(plugin.settings.backgroundColor).toBe('#FAFAFA');

      await (settingTab.borderColorInput as any)?.triggerChange('#333333');
      expect(plugin.settings.borderColor).toBe('#333333');
    });

    it('updates border width', async () => {
      settingTab.display();

      await (settingTab.borderWidthInput as any)?.triggerChange('2');
      expect(plugin.settings.borderWidth).toBe(2);

      // Negative border rejected
      plugin.saveSettingsCalled = false;
      await (settingTab.borderWidthInput as any)?.triggerChange('-1');
      expect(plugin.settings.borderWidth).toBe(2);
      expect(plugin.saveSettingsCalled).toBe(false);
    });
  });

  describe('User Story 3: PDF Output Destination & Print Helper (P3)', () => {
    it('updates output folder destination strategy', async () => {
      settingTab.display();

      await (settingTab.outputFolderDropdown as any)?.triggerChange('dedicated-folder');
      expect(plugin.settings.outputFolder).toBe('dedicated-folder');
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('dynamically displays custom output folder input when custom is selected', async () => {
      settingTab.display();

      expect(settingTab.customOutputPathInput).toBeUndefined();

      await (settingTab.outputFolderDropdown as any)?.triggerChange('custom');
      expect(plugin.settings.outputFolder).toBe('custom');
      expect(settingTab.customOutputPathInput).toBeDefined();

      await (settingTab.customOutputPathInput as any)?.triggerChange('PrintQueue/Pending');
      expect(plugin.settings.customOutputPath).toBe('PrintQueue/Pending');
    });

    it('updates timestamp toggle', async () => {
      settingTab.display();

      await (settingTab.timestampToggle as any)?.triggerChange(true);
      expect(plugin.settings.includeTimestamp).toBe(true);
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('updates printer helper preferences and reveals script path and test button when autoPrint is enabled', async () => {
      settingTab.display();

      // Initially autoPrint is false, so printScriptPathInput and testPrintButton should be undefined
      expect(settingTab.printScriptPathInput).toBeUndefined();
      expect(settingTab.testPrintButton).toBeUndefined();

      await (settingTab.printerNameInput as any)?.triggerChange('Brother-QL-800');
      expect(plugin.settings.printerName).toBe('Brother-QL-800');

      await (settingTab.autoPrintToggle as any)?.triggerChange(true);
      expect(plugin.settings.autoPrint).toBe(true);
      expect(plugin.saveSettingsCalled).toBe(true);

      // After toggling autoPrint to true, script path and test button are revealed
      expect(settingTab.printScriptPathInput).toBeDefined();
      expect(settingTab.testPrintButton).toBeDefined();

      // Test updating printScriptPath
      await (settingTab.printScriptPathInput as any)?.triggerChange('/custom/print.sh');
      expect(plugin.settings.printScriptPath).toBe('/custom/print.sh');

      // Test clicking testPrintButton
      const testPrintSpy = jest
        .spyOn(settingTab, 'handleTestPrint')
        .mockImplementation(async () => {});
      await (settingTab.testPrintButton as any)?.triggerClick();
      expect(testPrintSpy).toHaveBeenCalled();
    });

    it('handleTestPrint informs user when printerName is not configured', async () => {
      plugin.settings.autoPrint = true;
      plugin.settings.printerName = '';
      settingTab.display();

      await settingTab.handleTestPrint();
      // Should exit without throwing
    });
  });

  describe('User Story 4: Preview Button Trigger', () => {
    it('triggers plugin.generatePreviewLabel() when preview button is clicked', async () => {
      settingTab.display();

      expect(settingTab.previewButton).toBeDefined();
      await (settingTab.previewButton as any)?.triggerClick();

      expect(plugin.generatePreviewCalled).toBe(true);
    });
  });
});
