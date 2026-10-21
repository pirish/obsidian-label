import {
  LabelPresetOption,
  ObsidianLabelSettings,
  PRESET_DIMENSIONS,
  QRPlacementOption,
} from '../settings/types';
import { getAllTemplates } from '../templates/registry';
import { FrontmatterLabelSchema, ParsedFrontmatterConfig } from './types';

const VALID_PLACEMENTS: QRPlacementOption[] = ['left', 'right', 'top', 'bottom'];

const VALID_PRESETS: LabelPresetOption[] = [
  ...(Object.keys(PRESET_DIMENSIONS) as LabelPresetOption[]),
  'custom',
];

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Parses and validates per-note label configuration from a raw frontmatter object.
 * Supports both legacy flat keys and the structured `frontmatter.label` object
 * (with `frontmatter.label` taking higher precedence).
 * Logs console warnings for any invalid properties and ignores them cleanly.
 */
export function parseFrontmatterLabelConfig(
  frontmatter: Record<string, any> | null | undefined,
  globalSettings: ObsidianLabelSettings,
  logWarnings = true,
): ParsedFrontmatterConfig {
  const result: ParsedFrontmatterConfig = {
    warnings: [],
  };

  if (!frontmatter || !isPlainObject(frontmatter)) {
    return result;
  }

  const warn = (msg: string): void => {
    const fullMsg = `[Obsidian Label] ${msg}`;
    result.warnings.push(fullMsg);
    if (logWarnings) {
      console.warn(fullMsg);
    }
  };

  const allTemplates = getAllTemplates(globalSettings);
  const isValidTemplateId = (id: string): boolean => allTemplates.some((t) => t.id === id);

  const applyTemplateId = (rawVal: unknown, sourceLabel: string): void => {
    if (rawVal === undefined) return;
    if (typeof rawVal !== 'string' || rawVal.trim().length === 0) {
      warn(`Ignored invalid frontmatter "${sourceLabel}": expected a non-empty string.`);
      return;
    }
    const trimmed = rawVal.trim();
    if (!isValidTemplateId(trimmed)) {
      warn(`Ignored unknown frontmatter "${sourceLabel}" value "${trimmed}": template not found.`);
      return;
    }
    result.templateId = trimmed;
  };

  const applyLabelSize = (rawVal: unknown, sourceLabel: string): void => {
    if (rawVal === undefined) return;
    if (typeof rawVal !== 'string' || !VALID_PRESETS.includes(rawVal as LabelPresetOption)) {
      warn(
        `Ignored invalid frontmatter "${sourceLabel}" value "${String(rawVal)}": must be a valid preset or "custom".`,
      );
      return;
    }
    result.defaultLabelSize = rawVal as LabelPresetOption;
  };

  const applyPositiveDimension = (
    rawVal: unknown,
    sourceLabel: string,
    targetKey: 'customWidth' | 'customHeight',
  ): void => {
    if (rawVal === undefined) return;
    if (typeof rawVal !== 'number' || !Number.isFinite(rawVal) || rawVal <= 0) {
      warn(
        `Ignored invalid frontmatter "${sourceLabel}" value "${String(rawVal)}": must be a positive number.`,
      );
      return;
    }
    result[targetKey] = rawVal;
  };

  const applyPlacement = (rawVal: unknown, sourceLabel: string): void => {
    if (rawVal === undefined) return;
    if (typeof rawVal !== 'string' || !VALID_PLACEMENTS.includes(rawVal as QRPlacementOption)) {
      warn(
        `Ignored invalid frontmatter "${sourceLabel}" value "${String(rawVal)}": must be left, right, top, or bottom.`,
      );
      return;
    }
    result.qrCodePlacement = rawVal as QRPlacementOption;
  };

  const applyQrCodeSize = (rawVal: unknown, sourceLabel: string): void => {
    if (rawVal === undefined) return;
    if (typeof rawVal !== 'number' || !Number.isFinite(rawVal) || rawVal < 10 || rawVal > 50) {
      warn(
        `Ignored invalid frontmatter "${sourceLabel}" value "${String(rawVal)}": must be a number between 10 and 50.`,
      );
      return;
    }
    result.qrCodeSize = rawVal;
  };

  const applyFontSize = (rawVal: unknown, sourceLabel: string): void => {
    if (rawVal === undefined) return;
    if (typeof rawVal !== 'number' || !Number.isFinite(rawVal) || rawVal <= 0 || rawVal > 72) {
      warn(
        `Ignored invalid frontmatter "${sourceLabel}" value "${String(rawVal)}": must be a positive number up to 72.`,
      );
      return;
    }
    result.fontSize = rawVal;
  };

  // 1. Parse legacy flat frontmatter keys (lower priority)
  const flatTemplate =
    frontmatter.template !== undefined ? frontmatter.template : frontmatter.label_template;
  if (flatTemplate !== undefined) {
    applyTemplateId(
      flatTemplate,
      frontmatter.template !== undefined ? 'template' : 'label_template',
    );
  }

  const flatLabelSize =
    frontmatter.label_size !== undefined ? frontmatter.label_size : frontmatter.labelSize;
  if (flatLabelSize !== undefined) {
    applyLabelSize(
      flatLabelSize,
      frontmatter.label_size !== undefined ? 'label_size' : 'labelSize',
    );
  }

  const flatWidth =
    frontmatter.custom_width !== undefined ? frontmatter.custom_width : frontmatter.customWidth;
  if (flatWidth !== undefined) {
    applyPositiveDimension(
      flatWidth,
      frontmatter.custom_width !== undefined ? 'custom_width' : 'customWidth',
      'customWidth',
    );
  }

  const flatHeight =
    frontmatter.custom_height !== undefined ? frontmatter.custom_height : frontmatter.customHeight;
  if (flatHeight !== undefined) {
    applyPositiveDimension(
      flatHeight,
      frontmatter.custom_height !== undefined ? 'custom_height' : 'customHeight',
      'customHeight',
    );
  }

  const flatPlacement =
    frontmatter.qr_placement !== undefined ? frontmatter.qr_placement : frontmatter.qrPlacement;
  if (flatPlacement !== undefined) {
    applyPlacement(
      flatPlacement,
      frontmatter.qr_placement !== undefined ? 'qr_placement' : 'qrPlacement',
    );
  }

  const flatQrSize = frontmatter.qr_size !== undefined ? frontmatter.qr_size : frontmatter.qrSize;
  if (flatQrSize !== undefined) {
    applyQrCodeSize(flatQrSize, frontmatter.qr_size !== undefined ? 'qr_size' : 'qrSize');
  }

  const flatFontSize =
    frontmatter.font_size !== undefined ? frontmatter.font_size : frontmatter.fontSize;
  if (flatFontSize !== undefined) {
    applyFontSize(flatFontSize, frontmatter.font_size !== undefined ? 'font_size' : 'fontSize');
  }

  // 2. Parse structured `frontmatter.label` object (higher priority)
  if (frontmatter.label !== undefined) {
    if (!isPlainObject(frontmatter.label)) {
      warn('Ignored invalid frontmatter "label" section: expected a YAML mapping object.');
      return result;
    }

    const labelObj = frontmatter.label as FrontmatterLabelSchema;

    if (labelObj.template !== undefined) {
      applyTemplateId(labelObj.template, 'label.template');
    }

    const nestedLabelSize =
      labelObj.labelSize !== undefined ? labelObj.labelSize : labelObj.label_size;
    if (nestedLabelSize !== undefined) {
      applyLabelSize(nestedLabelSize, 'label.labelSize');
    }

    const nestedWidth =
      labelObj.customWidth !== undefined ? labelObj.customWidth : labelObj.custom_width;
    if (nestedWidth !== undefined) {
      applyPositiveDimension(nestedWidth, 'label.customWidth', 'customWidth');
    }

    const nestedHeight =
      labelObj.customHeight !== undefined ? labelObj.customHeight : labelObj.custom_height;
    if (nestedHeight !== undefined) {
      applyPositiveDimension(nestedHeight, 'label.customHeight', 'customHeight');
    }

    const nestedPlacement =
      labelObj.qrCodePlacement !== undefined ? labelObj.qrCodePlacement : labelObj.qr_placement;
    if (nestedPlacement !== undefined) {
      applyPlacement(nestedPlacement, 'label.qrCodePlacement');
    }

    const nestedQrSize = labelObj.qrCodeSize !== undefined ? labelObj.qrCodeSize : labelObj.qr_size;
    if (nestedQrSize !== undefined) {
      applyQrCodeSize(nestedQrSize, 'label.qrCodeSize');
    }

    const nestedFontSize = labelObj.fontSize !== undefined ? labelObj.fontSize : labelObj.font_size;
    if (nestedFontSize !== undefined) {
      applyFontSize(nestedFontSize, 'label.fontSize');
    }

    if (labelObj.customFields !== undefined) {
      if (!isPlainObject(labelObj.customFields)) {
        warn(
          'Ignored invalid frontmatter "label.customFields": expected a key-value mapping object.',
        );
      } else {
        const sanitizedFields: Record<string, string> = {};
        for (const [rawKey, rawVal] of Object.entries(labelObj.customFields)) {
          const key = rawKey.trim();
          if (!key) {
            warn('Ignored empty key in frontmatter "label.customFields".');
            continue;
          }
          if (
            rawVal === null ||
            rawVal === undefined ||
            typeof rawVal === 'object' ||
            typeof rawVal === 'function'
          ) {
            warn(
              `Ignored invalid value for "label.customFields.${key}": expected a string, number, or boolean.`,
            );
            continue;
          }
          const strVal = String(rawVal).trim();
          if (strVal.length > 0) {
            sanitizedFields[key] = strVal;
          }
        }
        result.customFields = sanitizedFields;
      }
    }
  }

  return result;
}
