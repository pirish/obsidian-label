import { LabelConfig, LabelContent, ValidationError, ValidationResult } from './types';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

/**
 * Validates a color string (hex or standard color names).
 */
export function isValidColor(color?: string): boolean {
  if (!color) return true;
  if (HEX_COLOR_REGEX.test(color)) return true;
  // Common named CSS colors
  const namedColors = ['transparent', 'black', 'white', 'red', 'green', 'blue', 'gray', 'grey'];
  return namedColors.includes(color.toLowerCase());
}

/**
 * Validates a label configuration and content payload.
 * Returns structured validation results without throwing exceptions.
 */
export function validateLabel(config: LabelConfig, content: LabelContent): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Physical Dimensions Validation
  if (!config.size || typeof config.size.width !== 'number' || config.size.width <= 0) {
    errors.push({
      field: 'size.width',
      code: 'INVALID_DIMENSIONS',
      message: 'Label width must be a positive number of millimeters.',
    });
  }

  if (!config.size || typeof config.size.height !== 'number' || config.size.height <= 0) {
    errors.push({
      field: 'size.height',
      code: 'INVALID_DIMENSIONS',
      message: 'Label height must be a positive number of millimeters.',
    });
  }

  if (config.size && config.size.dpi !== undefined && (typeof config.size.dpi !== 'number' || config.size.dpi < 72)) {
    errors.push({
      field: 'size.dpi',
      code: 'INVALID_DPI',
      message: 'Print resolution (DPI) must be at least 72.',
    });
  }

  // 2. Margins Validation
  if (config.size && config.size.width > 0 && config.size.height > 0) {
    const margins = config.layout?.margins;
    const top = margins?.top ?? 2;
    const right = margins?.right ?? 2;
    const bottom = margins?.bottom ?? 2;
    const left = margins?.left ?? 2;

    if (top < 0 || right < 0 || bottom < 0 || left < 0) {
      errors.push({
        field: 'layout.margins',
        code: 'NEGATIVE_MARGINS',
        message: 'Margins cannot be negative.',
      });
    }

    if (left + right >= config.size.width) {
      errors.push({
        field: 'layout.margins',
        code: 'MARGINS_EXCEED_BOUNDS',
        message: 'Horizontal margins (left + right) must be less than label width.',
      });
    }

    if (top + bottom >= config.size.height) {
      errors.push({
        field: 'layout.margins',
        code: 'MARGINS_EXCEED_BOUNDS',
        message: 'Vertical margins (top + bottom) must be less than label height.',
      });
    }
  }

  // 3. Layout Validation
  if (config.layout?.qrCodeSize !== undefined) {
    if (config.layout.qrCodeSize < 0.1 || config.layout.qrCodeSize > 0.95) {
      errors.push({
        field: 'layout.qrCodeSize',
        code: 'INVALID_QR_SIZE',
        message: 'QR code size must be between 0.10 and 0.95 (10% to 95%).',
      });
    }
  }

  // 4. Style Validation
  if (config.style) {
    if (config.style.fontColor && !isValidColor(config.style.fontColor)) {
      errors.push({
        field: 'style.fontColor',
        code: 'INVALID_COLOR',
        message: 'Font color must be a valid hex color (e.g. #000000).',
      });
    }

    if (config.style.backgroundColor && !isValidColor(config.style.backgroundColor)) {
      errors.push({
        field: 'style.backgroundColor',
        code: 'INVALID_COLOR',
        message: 'Background color must be a valid hex color (e.g. #FFFFFF).',
      });
    }

    if (config.style.borderColor && !isValidColor(config.style.borderColor)) {
      errors.push({
        field: 'style.borderColor',
        code: 'INVALID_COLOR',
        message: 'Border color must be a valid hex color (e.g. #000000).',
      });
    }

    if (config.style.borderWidth !== undefined && config.style.borderWidth < 0) {
      errors.push({
        field: 'style.borderWidth',
        code: 'INVALID_BORDER_WIDTH',
        message: 'Border width must be non-negative.',
      });
    }

    if (config.style.fontSize !== undefined && config.style.fontSize <= 0) {
      errors.push({
        field: 'style.fontSize',
        code: 'INVALID_FONT_SIZE',
        message: 'Font size must be greater than 0.',
      });
    }

    if (config.style.minFontSize !== undefined && config.style.minFontSize <= 0) {
      errors.push({
        field: 'style.minFontSize',
        code: 'INVALID_MIN_FONT_SIZE',
        message: 'Minimum font size must be greater than 0.',
      });
    }

    if (
      config.style.fontSize !== undefined &&
      config.style.minFontSize !== undefined &&
      config.style.minFontSize > config.style.fontSize
    ) {
      errors.push({
        field: 'style.minFontSize',
        code: 'MIN_EXCEEDS_FONT_SIZE',
        message: 'Minimum font size cannot exceed primary font size.',
      });
    }
  }

  // 5. Content Validation
  if (!content || !content.noteTitle || content.noteTitle.trim().length === 0) {
    errors.push({
      field: 'noteTitle',
      code: 'EMPTY_TITLE',
      message: 'Note title must not be empty.',
    });
  }

  if (!content || !content.obsidianUri || !content.obsidianUri.startsWith('obsidian://')) {
    errors.push({
      field: 'obsidianUri',
      code: 'INVALID_URI_SCHEME',
      message: 'Obsidian URI must begin with "obsidian://".',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
