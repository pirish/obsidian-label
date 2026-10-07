import { ObsidianLabelSettings } from '../settings/types';
import { BUILTIN_TEMPLATES } from './builtin';
import { LabelTemplate } from './types';

/**
 * Retrieves the immutable built-in system templates.
 */
export function getBuiltinTemplates(): LabelTemplate[] {
  return [...BUILTIN_TEMPLATES];
}

/**
 * Retrieves all available templates (built-in + user custom templates from settings).
 */
export function getAllTemplates(settings: ObsidianLabelSettings): LabelTemplate[] {
  const custom = Array.isArray(settings?.customTemplates) ? settings.customTemplates : [];
  return [...BUILTIN_TEMPLATES, ...custom];
}

/**
 * Resolves a template by ID, checking built-in and custom templates with fallback to 'standard'.
 */
export function resolveTemplate(
  settings: ObsidianLabelSettings,
  templateId?: string,
): LabelTemplate {
  const all = getAllTemplates(settings);

  // 1. Check explicitly requested template ID
  if (templateId) {
    const found = all.find((t) => t.id === templateId);
    if (found) return found;
  }

  // 2. Check vault-configured defaultTemplate
  if (settings?.defaultTemplate) {
    const foundDefault = all.find((t) => t.id === settings.defaultTemplate);
    if (foundDefault) return foundDefault;
  }

  // 3. Fallback to built-in 'standard' template
  return (
    all.find((t) => t.id === 'standard') ||
    BUILTIN_TEMPLATES[0] || {
      id: 'standard',
      name: 'Standard',
      description: 'Standard fallback',
      labelSize: { width: 89, height: 28, dpi: 300 },
      layout: {
        qrCodePlacement: 'left',
        qrCodeSize: 25,
        margins: { top: 2, right: 2, bottom: 2, left: 2 },
        textAlignment: 'left',
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
    }
  );
}

/**
 * Validates a template definition against schema and boundary rules.
 * Returns an array of human-readable error messages (empty if valid).
 */
export function validateTemplate(
  template: Partial<LabelTemplate>,
  existingTemplates: LabelTemplate[] = [],
  originalId?: string,
): string[] {
  const errors: string[] = [];

  // Name validation
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required.');
  } else if (template.name.trim().length > 50) {
    errors.push('Template name cannot exceed 50 characters.');
  }

  // ID validation
  const id = template.id?.trim() || '';
  if (!id) {
    errors.push('Template ID is required.');
  } else if (!/^[a-z0-9-]+$/.test(id)) {
    errors.push('Template ID must contain only lowercase alphanumeric characters and hyphens.');
  } else {
    // Check collision with built-in IDs if not original ID
    const isBuiltinId = BUILTIN_TEMPLATES.some((b) => b.id === id);
    if (isBuiltinId && originalId !== id) {
      errors.push(`Template ID "${id}" conflicts with a reserved built-in template ID.`);
    }

    // Check collision with other custom templates
    const isDuplicate = existingTemplates.some(
      (t) => t.id === id && (!originalId || t.id !== originalId),
    );
    if (isDuplicate) {
      errors.push(`Template ID "${id}" is already in use by another template.`);
    }
  }

  // Label dimensions validation
  const width = template.labelSize?.width;
  const height = template.labelSize?.height;
  if (width === undefined || width < 15 || width > 300) {
    errors.push('Label width must be between 15 mm and 300 mm.');
  }
  if (height === undefined || height < 15 || height > 300) {
    errors.push('Label height must be between 15 mm and 300 mm.');
  }

  // Margins validation
  if (template.layout?.margins && width && height) {
    const { top, right, bottom, left } = template.layout.margins;
    if (top < 0 || right < 0 || bottom < 0 || left < 0) {
      errors.push('Margins cannot be negative.');
    }
    if (left + right >= width) {
      errors.push('Horizontal margins (left + right) must be less than label width.');
    }
    if (top + bottom >= height) {
      errors.push('Vertical margins (top + bottom) must be less than label height.');
    }
  }

  // QR code size validation
  const qrSize = template.layout?.qrCodeSize;
  if (qrSize !== undefined && (qrSize < 10 || qrSize > 100)) {
    errors.push('QR code size must be between 10 and 100.');
  }

  // Typography validation
  const fontSize = template.style?.fontSize;
  if (fontSize !== undefined && (fontSize < 4 || fontSize > 72)) {
    errors.push('Font size must be between 4 and 72 points.');
  }

  const borderWidth = template.style?.borderWidth;
  if (borderWidth !== undefined && borderWidth < 0) {
    errors.push('Border width must be non-negative.');
  }

  // Content rules validation
  const titleMaxLength = template.contentRules?.titleMaxLength;
  if (titleMaxLength !== undefined && titleMaxLength < 1) {
    errors.push('Title maximum length must be at least 1 character.');
  }

  return errors;
}

/**
 * Adds or updates a custom template in settings.
 */
export function saveCustomTemplate(
  settings: ObsidianLabelSettings,
  template: LabelTemplate,
): ObsidianLabelSettings {
  const customTemplates = Array.isArray(settings.customTemplates)
    ? [...settings.customTemplates]
    : [];

  const existingIndex = customTemplates.findIndex((t) => t.id === template.id);
  const cleanTemplate: LabelTemplate = {
    ...template,
    isBuiltin: false,
  };

  if (existingIndex >= 0) {
    customTemplates[existingIndex] = cleanTemplate;
  } else {
    customTemplates.push(cleanTemplate);
  }

  return {
    ...settings,
    customTemplates,
  };
}

/**
 * Deletes a custom template by ID from settings.
 * If the deleted template was the active default, resets defaultTemplate to 'standard'.
 */
export function deleteCustomTemplate(
  settings: ObsidianLabelSettings,
  templateId: string,
): { updatedSettings: ObsidianLabelSettings; wasActive: boolean } {
  // Built-in templates cannot be deleted
  if (BUILTIN_TEMPLATES.some((b) => b.id === templateId)) {
    return { updatedSettings: settings, wasActive: false };
  }

  const customTemplates = Array.isArray(settings.customTemplates)
    ? settings.customTemplates.filter((t) => t.id !== templateId)
    : [];

  const wasActive = settings.defaultTemplate === templateId;
  const defaultTemplate = wasActive ? 'standard' : settings.defaultTemplate;

  return {
    updatedSettings: {
      ...settings,
      customTemplates,
      defaultTemplate,
    },
    wasActive,
  };
}

/**
 * Generates an editable custom copy of an existing template with a unique ID.
 */
export function duplicateTemplate(sourceTemplate: LabelTemplate, newName?: string): LabelTemplate {
  const name = newName || `${sourceTemplate.name} (Copy)`;
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const id = `${baseSlug || 'custom'}-${Date.now().toString(36).slice(-4)}`;

  return {
    ...JSON.parse(JSON.stringify(sourceTemplate)),
    id,
    name,
    isBuiltin: false,
  };
}
