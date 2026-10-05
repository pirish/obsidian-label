import {
  ExportedPDFResult,
  ILabelGenerator,
  LabelConfig,
  LabelContent,
  LabelPreset,
  MinimalVault,
  PDFExportOptions,
  RenderedLabel,
  ValidationResult,
} from './types';
import { calculatePixelDimensions } from './dimensions';
import { validateLabel, validatePDFExportOptions } from './validator';
import { renderLabelToCanvas } from './canvas-renderer';
import {
  exportCanvasToPDF,
  getPDFDimensions,
  resolveLabelPDFPath,
  savePDFToVault,
} from './pdf-exporter';
import { BUILTIN_PRESETS } from './presets';
import { generateObsidianURI } from './uri';

export class LabelGenerator implements ILabelGenerator {
  private presets: Map<string, LabelPreset>;

  constructor(customPresets: LabelPreset[] = []) {
    this.presets = new Map();
    for (const preset of [...BUILTIN_PRESETS, ...customPresets]) {
      this.presets.set(preset.id, preset);
    }
  }

  /**
   * Helper to construct a validated LabelContent payload with an automatically generated Obsidian URI.
   */
  createContent(
    vault: string,
    noteTitle: string,
    filePath: string,
    options?: { subpath?: string; customFields?: Record<string, string> },
  ): LabelContent {
    const obsidianUri = generateObsidianURI(vault, filePath, options?.subpath);
    return {
      noteTitle,
      obsidianUri,
      notePath: filePath,
      customFields: options?.customFields,
    };
  }

  /**
   * Validates a label configuration and content payload.
   * Returns a structured validation result without throwing.
   */
  validate(config: LabelConfig, content: LabelContent): ValidationResult {
    return validateLabel(config, content);
  }

  /**
   * Generates dual output artifacts (visual preview PNG data URL and printable PDF bytes).
   * Rejects if configuration is invalid.
   */
  async generate(config: LabelConfig, content: LabelContent): Promise<RenderedLabel> {
    const validation = this.validate(config, content);
    if (!validation.isValid) {
      const errorMsgs = validation.errors.map((e) => `[${e.field}] ${e.message}`).join(', ');
      throw new Error(`Label configuration validation failed: ${errorMsgs}`);
    }

    const { widthPx, heightPx, dpi } = calculatePixelDimensions(config.size);

    // Render Canvas & PNG Preview Data URL
    const renderResult = renderLabelToCanvas(config, content, widthPx, heightPx, dpi);

    // Compile Universal PDF Document Data
    const pdfData = exportCanvasToPDF(renderResult.canvas, config.size.width, config.size.height);

    return {
      previewDataUrl: renderResult.previewDataUrl,
      pdfData,
      pixelDimensions: {
        width: widthPx,
        height: heightPx,
      },
      physicalDimensions: {
        widthMm: config.size.width,
        heightMm: config.size.height,
        dpi,
      },
    };
  }

  /**
   * Retrieves a standard hardware preset by ID.
   */
  getPreset(presetId: string): LabelPreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * Lists all available standard hardware presets.
   */
  listPresets(): LabelPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Generates dual output and saves the print-ready PDF directly into the Obsidian vault.
   * Recursively creates missing directories and overwrites existing files cleanly.
   */
  async exportLabelPDF(
    vault: MinimalVault,
    config: LabelConfig,
    content: LabelContent,
    options?: PDFExportOptions,
  ): Promise<ExportedPDFResult> {
    const notePath = content.notePath || content.noteTitle;
    const optValidation = validatePDFExportOptions(options, notePath);
    if (!optValidation.isValid) {
      const errorMsgs = optValidation.errors.map((e) => `[${e.field}] ${e.message}`).join(', ');
      throw new Error(`PDF export options validation failed: ${errorMsgs}`);
    }

    const rendered = await this.generate(config, content);
    const targetPath = resolveLabelPDFPath(notePath, options);
    const savedPath = await savePDFToVault(vault, targetPath, rendered.pdfData);
    const dimensions = getPDFDimensions(config.size.width, config.size.height);

    return {
      filePath: savedPath,
      pdfData: rendered.pdfData,
      fileSize: rendered.pdfData.byteLength,
      dimensions,
    };
  }
}
