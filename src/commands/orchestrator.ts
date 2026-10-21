import { App, Notice, TFile } from 'obsidian';
import { LabelGenerator } from '../core/label-generator';
import { ExportedPDFResult, LabelContent } from '../core/types';
import { generateObsidianURI } from '../core/uri';
import { settingsToLabelConfig, settingsToPDFExportOptions } from '../settings/mappers';
import { LabelPresetOption, ObsidianLabelSettings, QRPlacementOption } from '../settings/types';
import { resolveTemplate } from '../templates/registry';
import { resolveContentLines } from '../templates/extractor';
import { defaultPrintService } from '../printer/print-service';
import { parseFrontmatterLabelConfig } from '../frontmatter/parser';

export interface CustomLabelOverride {
  templateId?: string;
  defaultLabelSize?: LabelPresetOption;
  customWidth?: number;
  customHeight?: number;
  qrCodePlacement?: QRPlacementOption;
  qrCodeSize?: number;
  fontSize?: number;
  customFields?: Record<string, string>;
  saveToFrontmatter?: boolean;
}

/**
 * Resolves effective configuration for a note:
 * Overrides (highest) > Nested label.* Frontmatter > Flat Frontmatter > Template defaults > Global Settings (fallback)
 */
export async function resolveEffectiveSettingsForNote(
  app: App,
  file: TFile,
  globalSettings: ObsidianLabelSettings,
  overrides?: CustomLabelOverride,
): Promise<ObsidianLabelSettings> {
  const effective: ObsidianLabelSettings = { ...globalSettings };

  // 1. Read and validate note frontmatter metadata if available
  const fileCache = app.metadataCache?.getFileCache ? app.metadataCache.getFileCache(file) : null;
  const fm = fileCache?.frontmatter || (file as any)?.frontmatter || {};
  const parsedFm = parseFrontmatterLabelConfig(fm, globalSettings, true);

  // Resolve active template from hierarchy:
  // overrides.templateId > parsedFm.templateId > globalSettings.defaultTemplate > 'standard'
  const targetTemplateId =
    overrides?.templateId || parsedFm.templateId || globalSettings.defaultTemplate;

  const template = resolveTemplate(globalSettings, targetTemplateId);
  if (template) {
    effective.defaultTemplate = template.id;
    if (template.id !== 'standard') {
      effective.defaultLabelSize = 'custom';
      effective.customWidth = template.labelSize.width;
      effective.customHeight = template.labelSize.height;
    } else {
      effective.customWidth = template.labelSize.width;
      effective.customHeight = template.labelSize.height;
    }
    effective.qrCodePlacement = template.layout.qrCodePlacement as any;
    effective.qrCodeSize = template.layout.qrCodeSize;
    effective.fontFamily = template.style.fontFamily;
    effective.fontSize = template.style.fontSize;
    effective.fontColor = template.style.fontColor;
    effective.backgroundColor = template.style.backgroundColor;
    effective.borderWidth = template.style.borderWidth;
    effective.borderColor = template.style.borderColor;
  }

  // 2. Granular frontmatter overrides take precedence over template settings
  if (parsedFm.defaultLabelSize) {
    effective.defaultLabelSize = parsedFm.defaultLabelSize;
  }
  if (typeof parsedFm.customWidth === 'number') {
    effective.customWidth = parsedFm.customWidth;
  }
  if (typeof parsedFm.customHeight === 'number') {
    effective.customHeight = parsedFm.customHeight;
  }
  if (parsedFm.qrCodePlacement) {
    effective.qrCodePlacement = parsedFm.qrCodePlacement;
  }
  if (typeof parsedFm.qrCodeSize === 'number') {
    effective.qrCodeSize = parsedFm.qrCodeSize;
  }
  if (typeof parsedFm.fontSize === 'number') {
    effective.fontSize = parsedFm.fontSize;
  }

  // 3. Apply temporary dialog overrides (highest priority)
  if (overrides) {
    if (overrides.templateId) effective.defaultTemplate = overrides.templateId;
    if (overrides.defaultLabelSize) effective.defaultLabelSize = overrides.defaultLabelSize;
    if (typeof overrides.customWidth === 'number') effective.customWidth = overrides.customWidth;
    if (typeof overrides.customHeight === 'number') effective.customHeight = overrides.customHeight;
    if (overrides.qrCodePlacement) effective.qrCodePlacement = overrides.qrCodePlacement;
    if (typeof overrides.qrCodeSize === 'number') effective.qrCodeSize = overrides.qrCodeSize;
    if (typeof overrides.fontSize === 'number') effective.fontSize = overrides.fontSize;

    // 4. Persist to frontmatter if user requested (dual-compatible: nested label.* + legacy flat keys)
    if (overrides.saveToFrontmatter && app.fileManager?.processFrontMatter) {
      await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, any>) => {
        if (
          typeof frontmatter['label'] !== 'object' ||
          frontmatter['label'] === null ||
          Array.isArray(frontmatter['label'])
        ) {
          frontmatter['label'] = {};
        }

        if (overrides.templateId) {
          frontmatter['template'] = overrides.templateId;
          frontmatter['label']['template'] = overrides.templateId;
        }
        if (overrides.defaultLabelSize) {
          frontmatter['label_size'] = overrides.defaultLabelSize;
          frontmatter['label']['labelSize'] = overrides.defaultLabelSize;
        }
        if (typeof overrides.customWidth === 'number') {
          frontmatter['custom_width'] = overrides.customWidth;
          frontmatter['label']['customWidth'] = overrides.customWidth;
        }
        if (typeof overrides.customHeight === 'number') {
          frontmatter['custom_height'] = overrides.customHeight;
          frontmatter['label']['customHeight'] = overrides.customHeight;
        }
        if (overrides.qrCodePlacement) {
          frontmatter['qr_placement'] = overrides.qrCodePlacement;
          frontmatter['label']['qrCodePlacement'] = overrides.qrCodePlacement;
        }
        if (typeof overrides.qrCodeSize === 'number') {
          frontmatter['qr_size'] = overrides.qrCodeSize;
          frontmatter['label']['qrCodeSize'] = overrides.qrCodeSize;
        }
        if (typeof overrides.fontSize === 'number') {
          frontmatter['font_size'] = overrides.fontSize;
          frontmatter['label']['fontSize'] = overrides.fontSize;
        }
        if (overrides.customFields) {
          frontmatter['label']['customFields'] = { ...overrides.customFields };
        }
      });
    }
  }

  return effective;
}

/**
 * Generates and saves a label PDF for a specific markdown note.
 */
export async function generateLabelForNote(
  app: App,
  file: TFile,
  settings: ObsidianLabelSettings,
  overrides?: CustomLabelOverride,
  generator: LabelGenerator = new LabelGenerator(),
  showNotice: boolean = true,
): Promise<ExportedPDFResult> {
  try {
    const effectiveSettings = await resolveEffectiveSettingsForNote(app, file, settings, overrides);

    const config = settingsToLabelConfig(effectiveSettings);
    const exportOptions = settingsToPDFExportOptions(effectiveSettings);

    // Resolve template content rules and frontmatter customFields override
    const fileCache = app.metadataCache?.getFileCache ? app.metadataCache.getFileCache(file) : null;
    const fm = fileCache?.frontmatter || (file as any)?.frontmatter || {};
    const parsedFm = parseFrontmatterLabelConfig(fm, settings, false);
    const targetTemplateId =
      overrides?.templateId || parsedFm.templateId || effectiveSettings.defaultTemplate;
    const template = resolveTemplate(effectiveSettings, targetTemplateId);

    if (!config.layout) {
      config.layout = {};
    }
    if (template.layout.margins) {
      config.layout.margins = template.layout.margins;
    }
    if (template.layout.textAlignment) {
      config.layout.textAlignment = template.layout.textAlignment;
    }

    const vaultName = typeof app.vault?.getName === 'function' ? app.vault.getName() : 'Obsidian';
    const noteTitle = file.basename || file.name || 'Untitled';
    const notePath = file.path;
    const obsidianUri = generateObsidianURI(vaultName, notePath);

    const customFieldsOverride = overrides?.customFields ?? parsedFm.customFields;
    const contentLines = resolveContentLines(
      file,
      template.contentRules,
      app.metadataCache,
      customFieldsOverride,
    );

    const content: LabelContent = {
      noteTitle,
      obsidianUri,
      notePath,
      customFields: customFieldsOverride,
      contentLines,
    };

    const result = await generator.exportLabelPDF(app.vault, config, content, exportOptions);

    if (showNotice) {
      new Notice(`Label generated: ${result.filePath}`);
    }

    // Auto-print dispatch
    if (effectiveSettings.autoPrint) {
      if (!effectiveSettings.printerName || effectiveSettings.printerName.trim().length === 0) {
        if (showNotice) {
          new Notice('Auto-print skipped: No printer name specified in settings.');
        }
      } else {
        const printResult = await defaultPrintService.printLabel(
          {
            pdfPath: result.filePath,
            printerName: effectiveSettings.printerName,
            scriptPath: effectiveSettings.printScriptPath || undefined,
          },
          {
            timeoutMs: 10000,
          },
        );

        if (printResult.success) {
          if (showNotice) {
            new Notice(`Label sent to printer: ${effectiveSettings.printerName}`);
          }
        } else {
          const failureMsg = printResult.timedOut
            ? `Print job timed out after 10s for printer "${effectiveSettings.printerName}".`
            : `Print failed for "${effectiveSettings.printerName}": ${printResult.stderr || printResult.stdout || 'Unknown error'}`;
          if (showNotice) {
            new Notice(failureMsg);
          }
        }
      }
    }

    return result;
  } catch (err: any) {
    const errorMsg = `Failed to generate label for "${file.basename}": ${err.message || String(err)}`;
    if (showNotice) {
      new Notice(errorMsg);
    }
    throw new Error(errorMsg);
  }
}
