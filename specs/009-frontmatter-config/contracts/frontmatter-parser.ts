/**
 * Interface Contracts: Per-Note Frontmatter Configuration (009-frontmatter-config)
 */

import { LabelPresetOption, ObsidianLabelSettings, QRPlacementOption } from '../../../src/settings/types';

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

/**
 * Parses and validates per-note label configuration from a raw frontmatter object.
 * Logs console warnings for any invalid properties and ignores them cleanly.
 */
export type ParseFrontmatterLabelConfigFn = (
  frontmatter: Record<string, unknown> | null | undefined,
  globalSettings: ObsidianLabelSettings,
) => ParsedFrontmatterConfig;

/**
 * Renders custom key-value fields onto a 2D canvas context with horizontal truncation.
 * Returns the next vertical Y coordinate after rendering all lines.
 */
export type RenderCustomFieldsFn = (
  ctx: CanvasRenderingContext2D,
  customFields: Record<string, string>,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight?: number,
) => number;
