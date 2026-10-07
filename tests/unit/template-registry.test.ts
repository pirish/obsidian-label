import {
  deleteCustomTemplate,
  duplicateTemplate,
  getAllTemplates,
  getBuiltinTemplates,
  resolveTemplate,
  saveCustomTemplate,
  validateTemplate,
} from '../../src/templates/registry';
import { BUILTIN_TEMPLATES } from '../../src/templates/builtin';
import { LabelTemplate } from '../../src/templates/types';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from '../../src/settings/types';

describe('Template Registry & Validation Service (Foundational)', () => {
  let sampleSettings: ObsidianLabelSettings;
  let customTpl: LabelTemplate;

  beforeEach(() => {
    customTpl = {
      id: 'custom-hardware',
      name: 'Custom Hardware',
      description: 'Special shelf label',
      labelSize: { width: 70, height: 35, dpi: 300 },
      layout: {
        qrCodePlacement: 'left',
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
        customFields: ['part_no'],
        titleMaxLength: 25,
      },
      isBuiltin: false,
    };

    sampleSettings = {
      ...DEFAULT_SETTINGS,
      defaultTemplate: 'standard',
      customTemplates: [customTpl],
    };
  });

  describe('getBuiltinTemplates & getAllTemplates', () => {
    it('returns the 3 immutable built-in templates', () => {
      const builtins = getBuiltinTemplates();
      expect(builtins.length).toBe(3);
      expect(builtins.map((b) => b.id)).toEqual(['standard', 'compact', 'inventory']);
      expect(builtins[0].isBuiltin).toBe(true);
    });

    it('returns both built-in and user custom templates in getAllTemplates', () => {
      const all = getAllTemplates(sampleSettings);
      expect(all.length).toBe(4);
      expect(all.some((t) => t.id === 'custom-hardware')).toBe(true);
      expect(all.some((t) => t.id === 'standard')).toBe(true);
    });
  });

  describe('resolveTemplate', () => {
    it('resolves an explicitly requested template by ID', () => {
      const resolved = resolveTemplate(sampleSettings, 'inventory');
      expect(resolved.id).toBe('inventory');
      expect(resolved.labelSize.width).toBe(100);
    });

    it('resolves custom template by ID', () => {
      const resolved = resolveTemplate(sampleSettings, 'custom-hardware');
      expect(resolved.id).toBe('custom-hardware');
      expect(resolved.name).toBe('Custom Hardware');
    });

    it('falls back to settings.defaultTemplate when no ID is provided', () => {
      sampleSettings.defaultTemplate = 'compact';
      const resolved = resolveTemplate(sampleSettings);
      expect(resolved.id).toBe('compact');
    });

    it('falls back to "standard" template when requested ID is unknown', () => {
      const resolved = resolveTemplate(sampleSettings, 'non-existent-id');
      expect(resolved.id).toBe('standard');
    });
  });

  describe('validateTemplate', () => {
    it('passes for a well-formed template', () => {
      const errors = validateTemplate(customTpl);
      expect(errors).toEqual([]);
    });

    it('rejects empty name or name exceeding 50 characters', () => {
      expect(validateTemplate({ ...customTpl, name: '' })).toContain('Template name is required.');
      expect(validateTemplate({ ...customTpl, name: 'a'.repeat(51) })).toContain(
        'Template name cannot exceed 50 characters.',
      );
    });

    it('rejects invalid or uppercase IDs', () => {
      expect(validateTemplate({ ...customTpl, id: 'INVALID ID!' })).toContain(
        'Template ID must contain only lowercase alphanumeric characters and hyphens.',
      );
    });

    it('rejects collisions with reserved built-in template IDs', () => {
      const errors = validateTemplate({ ...customTpl, id: 'standard' });
      expect(errors).toContain(
        'Template ID "standard" conflicts with a reserved built-in template ID.',
      );
    });

    it('rejects collisions with other custom template IDs', () => {
      const errors = validateTemplate({ ...customTpl, id: 'existing-id' }, [
        { ...customTpl, id: 'existing-id' },
      ]);
      expect(errors).toContain('Template ID "existing-id" is already in use by another template.');
    });

    it('rejects dimensions out of allowable range (15mm to 300mm)', () => {
      const errors = validateTemplate({
        ...customTpl,
        labelSize: { width: 10, height: 400, dpi: 300 },
      });
      expect(errors).toContain('Label width must be between 15 mm and 300 mm.');
      expect(errors).toContain('Label height must be between 15 mm and 300 mm.');
    });

    it('rejects margins that exceed label boundaries', () => {
      const errors = validateTemplate({
        ...customTpl,
        labelSize: { width: 50, height: 30, dpi: 300 },
        layout: {
          ...customTpl.layout,
          margins: { top: 20, bottom: 15, left: 30, right: 25 },
        },
      });
      expect(errors).toContain('Horizontal margins (left + right) must be less than label width.');
      expect(errors).toContain('Vertical margins (top + bottom) must be less than label height.');
    });
  });

  describe('saveCustomTemplate & deleteCustomTemplate', () => {
    it('appends a new custom template to settings', () => {
      const newTpl: LabelTemplate = { ...customTpl, id: 'new-tpl', name: 'New Template' };
      const updated = saveCustomTemplate(sampleSettings, newTpl);
      expect(updated.customTemplates.length).toBe(2);
      expect(updated.customTemplates.some((t) => t.id === 'new-tpl')).toBe(true);
    });

    it('updates an existing custom template in place', () => {
      const modified: LabelTemplate = { ...customTpl, name: 'Updated Hardware' };
      const updated = saveCustomTemplate(sampleSettings, modified);
      expect(updated.customTemplates.length).toBe(1);
      expect(updated.customTemplates[0].name).toBe('Updated Hardware');
    });

    it('deletes custom template and preserves other templates', () => {
      const { updatedSettings, wasActive } = deleteCustomTemplate(
        sampleSettings,
        'custom-hardware',
      );
      expect(updatedSettings.customTemplates.length).toBe(0);
      expect(wasActive).toBe(false);
    });

    it('reverts defaultTemplate to "standard" when the deleted template was active', () => {
      sampleSettings.defaultTemplate = 'custom-hardware';
      const { updatedSettings, wasActive } = deleteCustomTemplate(
        sampleSettings,
        'custom-hardware',
      );
      expect(wasActive).toBe(true);
      expect(updatedSettings.defaultTemplate).toBe('standard');
    });

    it('refuses to delete built-in templates', () => {
      const { updatedSettings, wasActive } = deleteCustomTemplate(sampleSettings, 'standard');
      expect(wasActive).toBe(false);
      expect(updatedSettings).toBe(sampleSettings);
    });
  });

  describe('duplicateTemplate', () => {
    it('creates an independent custom copy with unique ID and copy name', () => {
      const duplicated = duplicateTemplate(BUILTIN_TEMPLATES[0]);
      expect(duplicated.id).not.toBe('standard');
      expect(duplicated.id).toContain('standard-copy');
      expect(duplicated.name).toBe('Standard (Copy)');
      expect(duplicated.isBuiltin).toBe(false);
      expect(duplicated.labelSize.width).toBe(89);
    });
  });
});
