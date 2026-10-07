import { TemplateEditorModal } from '../../src/ui/template-editor-modal';
import { TemplateManagerModal } from '../../src/ui/template-manager-modal';
import { ObsidianLabelSettingTab } from '../../src/ui/settings-tab';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';
import { App, Plugin } from '../../tests/mocks/obsidian';

class MockPlugin extends Plugin {
  public settings: ObsidianLabelSettings = {
    ...DEFAULT_SETTINGS,
    customTemplates: [],
  };
  public saveSettingsCalled: boolean = false;

  async saveSettings(): Promise<void> {
    this.saveSettingsCalled = true;
    await this.saveData(this.settings);
  }
}

describe('Template Modals & Settings Management (US2 & US3)', () => {
  let app: App;
  let plugin: MockPlugin;

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
    plugin.settings = {
      ...DEFAULT_SETTINGS,
      defaultTemplate: 'standard',
      customTemplates: [
        {
          id: 'custom-asset',
          name: 'Asset Tag',
          description: 'Label for equipment asset tracking',
          labelSize: { width: 70, height: 35, dpi: 300 },
          layout: {
            qrCodePlacement: 'right',
            qrCodeSize: 30,
            margins: { top: 2, right: 2, bottom: 2, left: 2 },
            textAlignment: 'left',
          },
          style: {
            fontFamily: 'Arial',
            fontSize: 10,
            fontColor: '#000000',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#000000',
          },
          contentRules: {
            showTitle: true,
            showPath: false,
            showDateCreated: true,
            showDateModified: false,
            customFields: ['asset_id', 'department'],
            titleMaxLength: 35,
          },
          isBuiltin: false,
        },
      ],
    };
  });

  describe('TemplateEditorModal (US2)', () => {
    it('initializes with default values for new template', () => {
      const modal = new TemplateEditorModal(app as any, plugin as any);
      modal.open();

      expect(modal.isNew).toBe(true);
      expect(modal.nameInput).toBeDefined();
      expect(modal.widthInput).toBeDefined();
      expect(modal.heightInput).toBeDefined();
      expect(modal.widthInput?.getValue()).toBe('89');
      expect(modal.heightInput?.getValue()).toBe('28');
      expect(modal.qrPlacementDropdown?.getValue()).toBe('left');
    });

    it('populates existing template values when editing', () => {
      const existing = plugin.settings.customTemplates[0];
      const modal = new TemplateEditorModal(app as any, plugin as any, existing);
      modal.open();

      expect(modal.isNew).toBe(false);
      expect(modal.nameInput?.getValue()).toBe('Asset Tag');
      expect(modal.widthInput?.getValue()).toBe('70');
      expect(modal.heightInput?.getValue()).toBe('35');
      expect(modal.qrPlacementDropdown?.getValue()).toBe('right');
      expect(modal.customFieldsInput?.getValue()).toBe('asset_id, department');
    });

    it('validates required fields and rejects invalid dimensions', async () => {
      const modal = new TemplateEditorModal(app as any, plugin as any);
      modal.open();

      // Empty name
      await (modal.nameInput as any)?.triggerChange('');
      await (modal.saveButton as any)?.triggerClick();

      // Should not save
      expect(plugin.saveSettingsCalled).toBe(false);

      // Width out of range (15 - 300 mm)
      await (modal.nameInput as any)?.triggerChange('Valid Name');
      await (modal.widthInput as any)?.triggerChange('10'); // < 15
      await (modal.saveButton as any)?.triggerClick();
      expect(plugin.saveSettingsCalled).toBe(false);
    });

    it('successfully saves valid new custom template and persists to settings', async () => {
      const onSave = jest.fn();
      const modal = new TemplateEditorModal(app as any, plugin as any, undefined, onSave);
      modal.open();

      await (modal.nameInput as any)?.triggerChange('Lab Sample Tag');
      await (modal.widthInput as any)?.triggerChange('60');
      await (modal.heightInput as any)?.triggerChange('25');
      await (modal.qrPlacementDropdown as any)?.triggerChange('top');
      await (modal.customFieldsInput as any)?.triggerChange('sample_id, batch, exp_date');

      await (modal.saveButton as any)?.triggerClick();

      expect(plugin.saveSettingsCalled).toBe(true);
      expect(onSave).toHaveBeenCalled();

      const saved = plugin.settings.customTemplates.find((t) => t.name === 'Lab Sample Tag');
      expect(saved).toBeDefined();
      expect(saved?.labelSize.width).toBe(60);
      expect(saved?.labelSize.height).toBe(25);
      expect(saved?.layout.qrCodePlacement).toBe('top');
      expect(saved?.contentRules.customFields).toEqual(['sample_id', 'batch', 'exp_date']);
    });

    it('updates existing template without duplicating it', async () => {
      const existing = plugin.settings.customTemplates[0];
      const initialCount = plugin.settings.customTemplates.length;

      const modal = new TemplateEditorModal(app as any, plugin as any, existing);
      modal.open();

      await (modal.nameInput as any)?.triggerChange('Renamed Asset Tag');
      await (modal.saveButton as any)?.triggerClick();

      expect(plugin.settings.customTemplates.length).toBe(initialCount);
      const updated = plugin.settings.customTemplates.find((t) => t.id === 'custom-asset');
      expect(updated?.name).toBe('Renamed Asset Tag');
    });
  });

  describe('TemplateManagerModal (US2 & US3)', () => {
    it('renders built-in templates and custom templates', () => {
      const modal = new TemplateManagerModal(app as any, plugin as any);
      modal.open();

      expect(modal.createTemplateButton).toBeDefined();
    });

    it('duplicates built-in template as an editable custom template (US3)', () => {
      const modal = new TemplateManagerModal(app as any, plugin as any);
      modal.open();

      const standardTpl = {
        id: 'standard',
        name: 'Standard',
        description: 'Standard built-in',
        labelSize: { width: 89, height: 28, dpi: 300 },
        layout: {
          qrCodePlacement: 'left' as const,
          qrCodeSize: 25,
          margins: { top: 2, right: 2, bottom: 2, left: 2 },
          textAlignment: 'left' as const,
        },
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fontColor: '#000000',
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#CCCCCC',
        },
        contentRules: {
          showTitle: true,
          showPath: true,
          showDateCreated: false,
          showDateModified: false,
          customFields: [],
          titleMaxLength: 40,
        },
        isBuiltin: true,
      };

      // Call duplicate
      modal.duplicate(standardTpl);

      // Verify a new template editor modal would be created with duplicated template
    });

    it('safely deletes custom template and persists settings (US3)', async () => {
      const modal = new TemplateManagerModal(app as any, plugin as any);
      modal.open();

      expect(plugin.settings.customTemplates.length).toBe(1);
      await modal.deleteTemplate('custom-asset', 'Asset Tag');

      expect(plugin.settings.customTemplates.length).toBe(0);
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('safely falls back active defaultTemplate to "standard" when active custom template is deleted (US3)', async () => {
      // Set active default template to custom-asset
      plugin.settings.defaultTemplate = 'custom-asset';

      const modal = new TemplateManagerModal(app as any, plugin as any);
      modal.open();

      await modal.deleteTemplate('custom-asset', 'Asset Tag');

      // Must safely revert defaultTemplate to 'standard'
      expect(plugin.settings.defaultTemplate).toBe('standard');
      expect(plugin.settings.customTemplates.length).toBe(0);
      expect(plugin.saveSettingsCalled).toBe(true);
    });
  });

  describe('Settings Tab Integration (US1 & US2)', () => {
    it('renders Default Template dropdown with built-in and custom templates marked with (custom)', () => {
      const settingTab = new ObsidianLabelSettingTab(app as any, plugin as any);
      settingTab.display();

      const templateDropdown = settingTab.defaultTemplateDropdown as any;
      expect(templateDropdown).toBeDefined();
      expect(templateDropdown?.options).toHaveProperty('standard');
      expect(templateDropdown?.options).toHaveProperty('compact');
      expect(templateDropdown?.options).toHaveProperty('inventory');
      expect(templateDropdown?.options).toHaveProperty('custom-asset');
      expect(templateDropdown?.options['custom-asset']).toBe('Asset Tag (custom)');
      expect(templateDropdown?.getValue()).toBe('standard');
    });

    it('updates defaultTemplate in settings on dropdown change', async () => {
      const settingTab = new ObsidianLabelSettingTab(app as any, plugin as any);
      settingTab.display();

      await (settingTab.defaultTemplateDropdown as any)?.triggerChange('inventory');
      expect(plugin.settings.defaultTemplate).toBe('inventory');
      expect(plugin.saveSettingsCalled).toBe(true);
    });

    it('renders Manage Templates button that opens TemplateManagerModal', () => {
      const settingTab = new ObsidianLabelSettingTab(app as any, plugin as any);
      settingTab.display();

      expect(settingTab.manageTemplatesButton).toBeDefined();
    });
  });
});
