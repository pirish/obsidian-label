/**
 * Physical label dimensions in millimeters and print resolution.
 */
export interface TemplateSize {
  /** Width in millimeters (min: 15, max: 300) */
  width: number;

  /** Height in millimeters (min: 15, max: 300) */
  height: number;

  /** Print resolution in DPI (default: 300) */
  dpi: number;
}

/**
 * QR code placement options relative to label canvas.
 */
export type QRPlacement = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'none';

/**
 * Horizontal text alignment options.
 */
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * Inset margins in millimeters.
 */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Spatial positioning and layout parameters for QR code and text content.
 */
export interface TemplateLayout {
  /** Relative placement of QR code on label */
  qrCodePlacement: QRPlacement;

  /** Size of QR code in millimeters or percentage (10 to 100) */
  qrCodeSize: number;

  /** Inset padding from label edges in millimeters */
  margins: Margins;

  /** Text content horizontal alignment */
  textAlignment: TextAlignment;
}

/**
 * Visual and typographical styling parameters.
 */
export interface TemplateStyle {
  /** Font family (e.g. 'Arial', 'Courier New') */
  fontFamily: string;

  /** Font size in points (min: 4, max: 72) */
  fontSize: number;

  /** Hex color for text content (e.g. '#000000') */
  fontColor: string;

  /** Hex color for background fill (e.g. '#FFFFFF') */
  backgroundColor: string;

  /** Border stroke width in points/pixels (0 for borderless) */
  borderWidth: number;

  /** Hex color for border stroke (e.g. '#000000', '#CCCCCC') */
  borderColor: string;
}

/**
 * Field display toggles and metadata extraction rules.
 */
export interface ContentRules {
  /** Render note title (basename) */
  showTitle: boolean;

  /** Render note relative folder path */
  showPath: boolean;

  /** Render note creation timestamp */
  showDateCreated: boolean;

  /** Render note last modification timestamp */
  showDateModified: boolean;

  /** Array of frontmatter YAML keys to extract and render as key-value pairs */
  customFields: string[];

  /** Maximum character length for note title before truncation with ellipsis */
  titleMaxLength: number;
}

/**
 * Top-level composite template configuration entity.
 */
export interface LabelTemplate {
  /** Unique identifier (lowercase alphanumeric + hyphens; e.g. 'standard') */
  id: string;

  /** Human-readable display name */
  name: string;

  /** Explanatory description of intended use */
  description: string;

  /** Physical dimensions */
  labelSize: TemplateSize;

  /** Spatial arrangement parameters */
  layout: TemplateLayout;

  /** Visual and typographical styling */
  style: TemplateStyle;

  /** Field display toggles and frontmatter extraction rules */
  contentRules: ContentRules;

  /** Whether this template is an immutable system preset */
  isBuiltin?: boolean;
}

/**
 * Category of rendered text line.
 */
export type ContentLineType = 'title' | 'path' | 'date_created' | 'date_modified' | 'custom_field';

/**
 * Intermediate structured representation of a rendered text line on the label canvas.
 */
export interface ContentLine {
  /** Line categorization */
  type: ContentLineType;

  /** Optional label prefix (e.g. 'Category', 'Serial') */
  label?: string;

  /** Formatted text string */
  text: string;
}
