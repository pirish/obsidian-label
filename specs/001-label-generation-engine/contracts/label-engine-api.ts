/**
 * Contract: Core Label Generation Engine API
 * Feature: 001-label-generation-engine
 * 
 * Defines the public interfaces and execution contracts for the label generation engine.
 */

export type QRPlacement = 'left' | 'right' | 'top' | 'bottom' | 'center';
export type TextAlignment = 'left' | 'center' | 'right';
export type MetadataOrientation = 'vertical' | 'horizontal';
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface LabelSize {
  /** Physical label width in millimeters (> 0) */
  width: number;
  /** Physical label height in millimeters (> 0) */
  height: number;
  /** Target print resolution in dots-per-inch (>= 72, default: 300) */
  dpi?: number;
}

export interface LabelMargins {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface LabelLayout {
  qrCodePlacement?: QRPlacement;
  /** Proportion of primary dimension occupied by QR code (0.15 - 0.95, default: 0.65) */
  qrCodeSize?: number;
  margins?: LabelMargins;
  textAlignment?: TextAlignment;
  metadataOrientation?: MetadataOrientation;
  metadataSeparator?: string;
}

export interface LabelStyle {
  fontFamily?: string;
  fontSize?: number;
  minFontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
}

export interface QROptions {
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  margin?: number;
}

export interface LabelConfig {
  size: LabelSize;
  layout?: LabelLayout;
  style?: LabelStyle;
  qrOptions?: QROptions;
}

export interface LabelContent {
  /** Primary title to render on the label */
  noteTitle: string;
  /** Direct Obsidian URI (must start with obsidian://) */
  obsidianUri: string;
  /** Optional vault-relative file path */
  notePath?: string;
  /** Optional key-value pairs (frontmatter properties) to render */
  customFields?: Record<string, string>;
}

export interface LabelPreset {
  id: string;
  name: string;
  description: string;
  size: LabelSize;
  defaultLayout?: Partial<LabelLayout>;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface RenderedLabel {
  /** Base64-encoded PNG data URL for live preview */
  previewDataUrl: string;
  /** Universal PDF document data bytes */
  pdfData: Uint8Array;
  /** Dimensions of the rendered raster surface in pixels */
  pixelDimensions: {
    width: number;
    height: number;
  };
  /** Physical dimensions and resolution applied */
  physicalDimensions: {
    widthMm: number;
    heightMm: number;
    dpi: number;
  };
}

export interface ILabelGenerator {
  /**
   * Validates a label configuration and content payload.
   * Returns a structured validation result without throwing exceptions.
   */
  validate(config: LabelConfig, content: LabelContent): ValidationResult;

  /**
   * Generates dual output artifacts (live preview data URL and printable PDF bytes).
   * Rejects if configuration is invalid.
   */
  generate(config: LabelConfig, content: LabelContent): Promise<RenderedLabel>;

  /**
   * Retrieves a standard hardware preset by ID.
   */
  getPreset(presetId: string): LabelPreset | undefined;

  /**
   * Lists all available standard hardware presets.
   */
  listPresets(): LabelPreset[];
}
