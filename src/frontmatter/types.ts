import { LabelPresetOption, QRPlacementOption } from '../settings/types';

/**
 * Raw structure of the `label` block inside a Markdown note's YAML frontmatter.
 */
export interface FrontmatterLabelSchema {
  template?: unknown;
  customFields?: unknown;
  qrCodeSize?: unknown;
  qr_size?: unknown;
  fontSize?: unknown;
  font_size?: unknown;
  labelSize?: unknown;
  label_size?: unknown;
  customWidth?: unknown;
  custom_width?: unknown;
  customHeight?: unknown;
  custom_height?: unknown;
  qrCodePlacement?: unknown;
  qr_placement?: unknown;
}

/**
 * Validated and sanitized frontmatter label configuration for a note.
 */
export interface ParsedFrontmatterConfig {
  /** Resolved template ID if valid in frontmatter */
  templateId?: string;
  /** Sanitized custom fields map from label.customFields */
  customFields?: Record<string, string>;
  /** QR code size percentage override (10 to 50) */
  qrCodeSize?: number;
  /** Font size override in points (> 0 and <= 72) */
  fontSize?: number;
  /** Label preset option override */
  defaultLabelSize?: LabelPresetOption;
  /** Custom width override in mm (> 0) */
  customWidth?: number;
  /** Custom height override in mm (> 0) */
  customHeight?: number;
  /** QR code placement override */
  qrCodePlacement?: QRPlacementOption;
  /** Validation warnings emitted for ignored malformed fields */
  warnings: string[];
}
