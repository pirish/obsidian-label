/**
 * Core Type Definitions & Interfaces
 * Obsidian Label Generation Engine
 */

/** Placement of the QR code relative to the text block. */
export type QRPlacement = 'left' | 'right' | 'top' | 'bottom' | 'center';

/** Horizontal alignment for typography on the label. */
export type TextAlignment = 'left' | 'center' | 'right';

/** Layout direction for custom metadata key-value pairs. */
export type MetadataOrientation = 'vertical' | 'horizontal';

/** Reed-Solomon Error Correction Level for the QR matrix. */
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * Defines the physical dimensions and resolution of a label.
 */
export interface LabelSize {
  /** Physical label width in millimeters (> 0) */
  width: number;
  /** Physical label height in millimeters (> 0) */
  height: number;
  /** Target print resolution in dots-per-inch (>= 72, default: 300) */
  dpi?: number;
}

/**
 * Defines the safety margins around the outer perimeter of the label in millimeters.
 */
export interface LabelMargins {
  /** Top margin in millimeters (>= 0, default: 2) */
  top?: number;
  /** Right margin in millimeters (>= 0, default: 2) */
  right?: number;
  /** Bottom margin in millimeters (>= 0, default: 2) */
  bottom?: number;
  /** Left margin in millimeters (>= 0, default: 2) */
  left?: number;
}

/**
 * Controls spatial positioning and alignment of elements on the label.
 */
export interface LabelLayout {
  /** Spatial placement of the QR code */
  qrCodePlacement?: QRPlacement;
  /** Proportion of available dimension occupied by the QR code (0.10 - 0.95, default: 0.65) */
  qrCodeSize?: number;
  /** Outer boundary margins in millimeters */
  margins?: LabelMargins;
  /** Horizontal alignment of note title and metadata text */
  textAlignment?: TextAlignment;
  /** Orientation for rendering custom metadata fields (vertical stack or horizontal inline) */
  metadataOrientation?: MetadataOrientation;
  /** Delimiter string placed between metadata key and value (default: ': ') */
  metadataSeparator?: string;
}

/**
 * Visual styling options for typography, colors, and borders.
 */
export interface LabelStyle {
  /** CSS font family for text rendering (default: 'sans-serif') */
  fontFamily?: string;
  /** Nominal font size in points for the note title (default: 12) */
  fontSize?: number;
  /** Minimum allowable font size during dynamic scaling before truncation (default: 6) */
  minFontSize?: number;
  /** Typography fill color in hex or named CSS color (default: '#000000') */
  fontColor?: string;
  /** Label background fill color in hex or named CSS color (default: '#FFFFFF') */
  backgroundColor?: string;
  /** Perimeter border stroke width in pixels (default: 0) */
  borderWidth?: number;
  /** Perimeter border stroke color in hex or named CSS color (default: '#000000') */
  borderColor?: string;
}

/**
 * Configuration options for QR code generation.
 */
export interface QROptions {
  /** Error correction level ('L', 'M', 'Q', 'H' - default: 'M') */
  errorCorrectionLevel?: QRErrorCorrectionLevel;
  /** Quiet zone margin in QR modules (default: 1) */
  margin?: number;
  /** Dark module color (hex or named CSS color, default: '#000000') */
  darkColor?: string;
  /** Light background color (hex, named CSS color, or 'transparent', default: '#FFFFFF') */
  lightColor?: string;
}

/**
 * Options for raster data URL export.
 */
export interface QRDataURLOptions extends QROptions {
  /** Target pixel size of the generated raster image (default: 256) */
  width?: number;
}

/**
 * Input configuration for constructing an Obsidian URI.
 */
export interface ObsidianURIConfig {
  /** Target vault name (required) */
  vault: string;
  /** Relative note path from vault root (e.g. "Folder/Note.md") (required) */
  filePath: string;
  /** Optional heading (#Heading) or block identifier (^blockid) */
  subpath?: string;
}

/**
 * Minimal interface representation of Obsidian's App for URI generation.
 */
export interface MinimalObsidianApp {
  getObsidianUrl(file: MinimalTFile): string;
}

/**
 * Minimal interface representation of an Obsidian TFile.
 */
export interface MinimalTFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
}

/**
 * Complete configuration object required to generate a physical label.
 */
export interface LabelConfig {
  /** Physical target dimensions and DPI */
  size: LabelSize;
  /** Spatial placement and margin layout */
  layout?: LabelLayout;
  /** Visual presentation and colors */
  style?: LabelStyle;
  /** QR matrix generation options */
  qrOptions?: QROptions;
}

/**
 * Runtime content payload representing note identity and metadata to render.
 */
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

/**
 * Predefined hardware label preset specification.
 */
export interface LabelPreset {
  /** Unique preset identifier (e.g., 'phomemo-40x30') */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Intended use case and physical media description */
  description: string;
  /** Preset physical dimensions */
  size: LabelSize;
  /** Recommended default layout configuration */
  defaultLayout?: Partial<LabelLayout>;
}

/**
 * Describes a validation issue found in configuration or content.
 */
export interface ValidationError {
  /** Field path where the validation failed (e.g. 'size.width') */
  field: string;
  /** Standard error code */
  code: string;
  /** Human-readable diagnostic message */
  message: string;
}

/**
 * Structured validation result returned by validate().
 */
export interface ValidationResult {
  /** True if configuration and content are completely valid */
  isValid: boolean;
  /** Array of validation errors if isValid is false */
  errors: ValidationError[];
}

/**
 * Composite dual-output artifact produced upon successful rendering.
 */
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

/**
 * Core interface for the label generation engine.
 */
export interface ILabelGenerator {
  /**
   * Validates a label configuration and content payload without throwing exceptions.
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

  /**
   * Helper to construct a validated LabelContent payload with an automatically generated Obsidian URI.
   */
  createContent(
    vault: string,
    noteTitle: string,
    filePath: string,
    options?: { subpath?: string; customFields?: Record<string, string> },
  ): LabelContent;
}
