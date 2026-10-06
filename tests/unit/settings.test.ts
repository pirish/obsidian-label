import {
  DEFAULT_SETTINGS,
  ObsidianLabelSettings,
  PRESET_DIMENSIONS,
} from '../../src/settings/types';
import { validatePluginSettings } from '../../src/settings/validator';
import { settingsToLabelConfig, settingsToPDFExportOptions } from '../../src/settings/mappers';

describe('Settings Module (Foundational)', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('provides valid default configuration', () => {
      const validation = validatePluginSettings(DEFAULT_SETTINGS);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('contains expected default values', () => {
      expect(DEFAULT_SETTINGS.defaultLabelSize).toBe('dymo-standard');
      expect(DEFAULT_SETTINGS.customWidth).toBe(89);
      expect(DEFAULT_SETTINGS.customHeight).toBe(28);
      expect(DEFAULT_SETTINGS.qrCodePlacement).toBe('left');
      expect(DEFAULT_SETTINGS.qrCodeSize).toBe(25);
      expect(DEFAULT_SETTINGS.fontFamily).toBe('Arial');
      expect(DEFAULT_SETTINGS.fontSize).toBe(12);
      expect(DEFAULT_SETTINGS.fontColor).toBe('#000000');
      expect(DEFAULT_SETTINGS.backgroundColor).toBe('#FFFFFF');
      expect(DEFAULT_SETTINGS.borderWidth).toBe(1);
      expect(DEFAULT_SETTINGS.borderColor).toBe('#CCCCCC');
      expect(DEFAULT_SETTINGS.outputFolder).toBe('same-as-note');
      expect(DEFAULT_SETTINGS.customOutputPath).toBe('_labels');
      expect(DEFAULT_SETTINGS.includeTimestamp).toBe(false);
      expect(DEFAULT_SETTINGS.autoPrint).toBe(false);
    });

    it('defines PRESET_DIMENSIONS for all supported presets', () => {
      expect(PRESET_DIMENSIONS['dymo-standard']).toEqual({
        width: 89,
        height: 28,
        name: 'Dymo Standard (89×28mm)',
      });
      expect(PRESET_DIMENSIONS['brother-62mm']).toEqual({
        width: 62,
        height: 100,
        name: 'Brother 62mm (62×100mm)',
      });
      expect(PRESET_DIMENSIONS['avery-5160']).toEqual({
        width: 66.7,
        height: 25.4,
        name: 'Avery 5160 (66.7×25.4mm)',
      });
      expect(PRESET_DIMENSIONS['phomemo-40x30']).toEqual({
        width: 40,
        height: 30,
        name: 'Phomemo 40×30mm (40×30mm)',
      });
      expect(PRESET_DIMENSIONS['generic-square-50']).toEqual({
        width: 50,
        height: 50,
        name: 'Square 50×50mm (50×50mm)',
      });
    });
  });

  describe('validatePluginSettings', () => {
    let settings: ObsidianLabelSettings;

    beforeEach(() => {
      settings = { ...DEFAULT_SETTINGS };
    });

    it('passes for valid preset configuration', () => {
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('passes for valid custom dimension configuration', () => {
      settings.defaultLabelSize = 'custom';
      settings.customWidth = 50;
      settings.customHeight = 25;
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('fails when defaultLabelSize is invalid', () => {
      settings.defaultLabelSize = 'unknown-preset' as any;
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_PRESET' })]),
      );
    });

    it('fails when custom dimensions are zero or negative when custom is active', () => {
      settings.defaultLabelSize = 'custom';
      settings.customWidth = 0;
      settings.customHeight = -5;
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'INVALID_CUSTOM_WIDTH' }),
          expect.objectContaining({ code: 'INVALID_CUSTOM_HEIGHT' }),
        ]),
      );
    });

    it('fails when qrCodePlacement is invalid', () => {
      settings.qrCodePlacement = 'diagonal' as any;
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_QR_PLACEMENT' })]),
      );
    });

    it('fails when qrCodeSize is out of range (10 to 50)', () => {
      settings.qrCodeSize = 5;
      expect(validatePluginSettings(settings).isValid).toBe(false);

      settings.qrCodeSize = 55;
      expect(validatePluginSettings(settings).isValid).toBe(false);
    });

    it('fails when colors are invalid hex', () => {
      settings.fontColor = 'not-a-color';
      expect(validatePluginSettings(settings).isValid).toBe(false);

      settings.fontColor = '#000000';
      settings.backgroundColor = 'xyz';
      expect(validatePluginSettings(settings).isValid).toBe(false);

      settings.backgroundColor = '#FFFFFF';
      settings.borderColor = 'blue-gray';
      expect(validatePluginSettings(settings).isValid).toBe(false);
    });

    it('fails when borderWidth is negative', () => {
      settings.borderWidth = -1;
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INVALID_BORDER_WIDTH' })]),
      );
    });

    it('fails when custom output folder is selected but path is empty', () => {
      settings.outputFolder = 'custom';
      settings.customOutputPath = '   ';
      const result = validatePluginSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'EMPTY_CUSTOM_OUTPUT' })]),
      );
    });
  });

  describe('settingsToLabelConfig Mapper', () => {
    it('maps preset dimensions accurately', () => {
      const dymoConfig = settingsToLabelConfig(DEFAULT_SETTINGS);
      expect(dymoConfig.size.width).toBe(89);
      expect(dymoConfig.size.height).toBe(28);
      expect(dymoConfig.size.dpi).toBe(300);

      const brotherSettings: ObsidianLabelSettings = {
        ...DEFAULT_SETTINGS,
        defaultLabelSize: 'brother-62mm',
      };
      const brotherConfig = settingsToLabelConfig(brotherSettings);
      expect(brotherConfig.size.width).toBe(62);
      expect(brotherConfig.size.height).toBe(100);

      const phomemoSettings: ObsidianLabelSettings = {
        ...DEFAULT_SETTINGS,
        defaultLabelSize: 'phomemo-40x30',
      };
      const phomemoConfig = settingsToLabelConfig(phomemoSettings);
      expect(phomemoConfig.size.width).toBe(40);
      expect(phomemoConfig.size.height).toBe(30);
    });

    it('maps custom dimensions when custom is selected', () => {
      const customSettings: ObsidianLabelSettings = {
        ...DEFAULT_SETTINGS,
        defaultLabelSize: 'custom',
        customWidth: 45,
        customHeight: 35,
      };
      const config = settingsToLabelConfig(customSettings);
      expect(config.size.width).toBe(45);
      expect(config.size.height).toBe(35);
    });

    it('converts QR percentage to proportion fraction', () => {
      const config = settingsToLabelConfig({
        ...DEFAULT_SETTINGS,
        qrCodeSize: 35,
      });
      expect(config.layout?.qrCodeSize).toBeCloseTo(0.35);
    });

    it('maps typography, colors, and borders correctly', () => {
      const styledSettings: ObsidianLabelSettings = {
        ...DEFAULT_SETTINGS,
        fontFamily: 'Verdana',
        fontSize: 14,
        fontColor: '#112233',
        backgroundColor: '#F0F0F0',
        borderWidth: 2,
        borderColor: '#445566',
      };
      const config = settingsToLabelConfig(styledSettings);
      expect(config.style?.fontFamily).toBe('Verdana');
      expect(config.style?.fontSize).toBe(14);
      expect(config.style?.fontColor).toBe('#112233');
      expect(config.style?.backgroundColor).toBe('#F0F0F0');
      expect(config.style?.borderWidth).toBe(2);
      expect(config.style?.borderColor).toBe('#445566');
      expect(config.qrOptions?.darkColor).toBe('#112233');
      expect(config.qrOptions?.lightColor).toBe('#F0F0F0');
    });
  });

  describe('settingsToPDFExportOptions Mapper', () => {
    it('maps same-as-note to same-folder', () => {
      const opts = settingsToPDFExportOptions({
        ...DEFAULT_SETTINGS,
        outputFolder: 'same-as-note',
      });
      expect(opts.location).toBe('same-folder');
      expect(opts.customFolder).toBeUndefined();
    });

    it('maps dedicated-folder accurately', () => {
      const opts = settingsToPDFExportOptions({
        ...DEFAULT_SETTINGS,
        outputFolder: 'dedicated-folder',
      });
      expect(opts.location).toBe('dedicated-folder');
      expect(opts.customFolder).toBeUndefined();
    });

    it('maps custom folder and forwards customOutputPath', () => {
      const opts = settingsToPDFExportOptions({
        ...DEFAULT_SETTINGS,
        outputFolder: 'custom',
        customOutputPath: 'PrintQueue/Pending',
      });
      expect(opts.location).toBe('custom-folder');
      expect(opts.customFolder).toBe('PrintQueue/Pending');
    });

    it('forwards includeTimestamp toggle', () => {
      const optsTrue = settingsToPDFExportOptions({
        ...DEFAULT_SETTINGS,
        includeTimestamp: true,
      });
      expect(optsTrue.naming?.includeTimestamp).toBe(true);

      const optsFalse = settingsToPDFExportOptions({
        ...DEFAULT_SETTINGS,
        includeTimestamp: false,
      });
      expect(optsFalse.naming?.includeTimestamp).toBe(false);
    });
  });
});
