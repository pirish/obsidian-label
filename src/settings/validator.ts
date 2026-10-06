import { ValidationError, ValidationResult } from '../core/types';
import { isValidColor } from '../core/validator';
import {
  LabelPresetOption,
  ObsidianLabelSettings,
  OutputFolderOption,
  QRPlacementOption,
} from './types';

const VALID_PRESETS: LabelPresetOption[] = [
  'dymo-standard',
  'brother-62mm',
  'avery-5160',
  'phomemo-40x30',
  'generic-square-50',
  'custom',
];

const VALID_QR_PLACEMENTS: QRPlacementOption[] = ['left', 'right', 'top', 'bottom'];

const VALID_OUTPUT_FOLDERS: OutputFolderOption[] = ['same-as-note', 'dedicated-folder', 'custom'];

/**
 * Validates a plugin settings object.
 */
export function validatePluginSettings(settings: ObsidianLabelSettings): ValidationResult {
  const errors: ValidationError[] = [];

  // Preset validation
  if (!VALID_PRESETS.includes(settings.defaultLabelSize)) {
    errors.push({
      field: 'defaultLabelSize',
      code: 'INVALID_PRESET',
      message: 'Label size preset must be a valid option.',
    });
  }

  // Custom dimension validation
  if (settings.defaultLabelSize === 'custom') {
    if (
      typeof settings.customWidth !== 'number' ||
      isNaN(settings.customWidth) ||
      settings.customWidth <= 0
    ) {
      errors.push({
        field: 'customWidth',
        code: 'INVALID_CUSTOM_WIDTH',
        message: 'Custom width must be a positive number of millimeters.',
      });
    }

    if (
      typeof settings.customHeight !== 'number' ||
      isNaN(settings.customHeight) ||
      settings.customHeight <= 0
    ) {
      errors.push({
        field: 'customHeight',
        code: 'INVALID_CUSTOM_HEIGHT',
        message: 'Custom height must be a positive number of millimeters.',
      });
    }
  }

  // QR placement validation
  if (!VALID_QR_PLACEMENTS.includes(settings.qrCodePlacement)) {
    errors.push({
      field: 'qrCodePlacement',
      code: 'INVALID_QR_PLACEMENT',
      message: 'QR code placement must be left, right, top, or bottom.',
    });
  }

  // QR size validation
  if (
    typeof settings.qrCodeSize !== 'number' ||
    isNaN(settings.qrCodeSize) ||
    settings.qrCodeSize < 10 ||
    settings.qrCodeSize > 50
  ) {
    errors.push({
      field: 'qrCodeSize',
      code: 'INVALID_QR_SIZE',
      message: 'QR code size must be between 10% and 50%.',
    });
  }

  // Font size validation
  if (typeof settings.fontSize !== 'number' || isNaN(settings.fontSize) || settings.fontSize <= 0) {
    errors.push({
      field: 'fontSize',
      code: 'INVALID_FONT_SIZE',
      message: 'Font size must be greater than 0.',
    });
  }

  // Color validation
  if (!isValidColor(settings.fontColor)) {
    errors.push({
      field: 'fontColor',
      code: 'INVALID_FONT_COLOR',
      message: 'Font color must be a valid hex color (e.g. #000000).',
    });
  }

  if (!isValidColor(settings.backgroundColor)) {
    errors.push({
      field: 'backgroundColor',
      code: 'INVALID_BG_COLOR',
      message: 'Background color must be a valid hex color (e.g. #FFFFFF).',
    });
  }

  if (!isValidColor(settings.borderColor)) {
    errors.push({
      field: 'borderColor',
      code: 'INVALID_BORDER_COLOR',
      message: 'Border color must be a valid hex color (e.g. #CCCCCC).',
    });
  }

  // Border width validation
  if (
    typeof settings.borderWidth !== 'number' ||
    isNaN(settings.borderWidth) ||
    settings.borderWidth < 0
  ) {
    errors.push({
      field: 'borderWidth',
      code: 'INVALID_BORDER_WIDTH',
      message: 'Border width must be a non-negative integer.',
    });
  }

  // Output folder validation
  if (!VALID_OUTPUT_FOLDERS.includes(settings.outputFolder)) {
    errors.push({
      field: 'outputFolder',
      code: 'INVALID_OUTPUT_FOLDER',
      message: "Output folder must be 'same-as-note', 'dedicated-folder', or 'custom'.",
    });
  }

  if (
    settings.outputFolder === 'custom' &&
    (!settings.customOutputPath || settings.customOutputPath.trim().length === 0)
  ) {
    errors.push({
      field: 'customOutputPath',
      code: 'EMPTY_CUSTOM_OUTPUT',
      message: 'Custom output path must not be empty.',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
