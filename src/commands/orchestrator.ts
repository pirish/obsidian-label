import { App, Notice, TFile } from 'obsidian';
import { LabelGenerator } from '../core/label-generator';
import { ExportedPDFResult, LabelContent } from '../core/types';
import { generateObsidianURI } from '../core/uri';
import { settingsToLabelConfig, settingsToPDFExportOptions } from '../settings/mappers';
import { LabelPresetOption, ObsidianLabelSettings, QRPlacementOption } from '../settings/types';
import { resolveTemplate } from '../templates/registry';
import { resolveContentLines } from '../templates/extractor';

export interface CustomLabelOverride {
  templateId?: string;
  defaultLabelSize?: LabelPresetOption;
  customWidth?: number;
  customHeight?: number;
  qrCodePlacement?: QRPlacementOption;
  qrCodeSize?: number;
  saveToFrontmatter?: boolean;
}

/**
 * Resolves effective configuration for a note:
 * Overrides (highest) > Frontmatter (middle) > Template defaults > Global Settings (fallback)
 */
export async function resolveEffectiveSettingsForNote(
  app: App,
  file: TFile,
  globalSettings: ObsidianLabelSettings,
  overrides?: CustomLabelOverride,
): Promise<ObsidianLabelSettings> {
  const effective: ObsidianLabelSettings = { ...globalSettings };

  // 1. Read note frontmatter metadata if available
  const fileCache = app.metadataCache?.getFileCache ? app.metadataCache.getFileCache(file) : null;
  const fm = fileCache?.frontmatter || {};

  // Resolve active template from hierarchy:
  // overrides.templateId > fm.template || fm.label_template > globalSettings.defaultTemplate > 'standard'
  const targetTemplateId =
    overrides?.templateId || fm.template || fm.label_template || globalSettings.defaultTemplate;

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

  // Granular frontmatter overrides take precedence over template settings
  if (fm.label_size) effective.defaultLabelSize = fm.label_size as LabelPresetOption;
  else if (fm.labelSize) effective.defaultLabelSize = fm.labelSize as LabelPresetOption;

  if (typeof fm.custom_width === 'number') effective.customWidth = fm.custom_width;
  else if (typeof fm.customWidth === 'number') effective.customWidth = fm.customWidth;

  if (typeof fm.custom_height === 'number') effective.customHeight = fm.custom_height;
  else if (typeof fm.customHeight === 'number') effective.customHeight = fm.customHeight;

  if (fm.qr_placement) effective.qrCodePlacement = fm.qr_placement as QRPlacementOption;
  else if (fm.qrPlacement) effective.qrCodePlacement = fm.qrPlacement as QRPlacementOption;

  if (typeof fm.qr_size === 'number') effective.qrCodeSize = fm.qr_size;
  else if (typeof fm.qrSize === 'number') effective.qrCodeSize = fm.qrSize;

  // 2. Apply temporary overrides
  if (overrides) {
    if (overrides.templateId) effective.defaultTemplate = overrides.templateId;
    if (overrides.defaultLabelSize) effective.defaultLabelSize = overrides.defaultLabelSize;
    if (typeof overrides.customWidth === 'number') effective.customWidth = overrides.customWidth;
    if (typeof overrides.customHeight === 'number') effective.customHeight = overrides.customHeight;
    if (overrides.qrCodePlacement) effective.qrCodePlacement = overrides.qrCodePlacement;
    if (typeof overrides.qrCodeSize === 'number') effective.qrCodeSize = overrides.qrCodeSize;

    // 3. Persist to frontmatter if user requested
    if (overrides.saveToFrontmatter && app.fileManager?.processFrontMatter) {
      await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, any>) => {
        if (overrides.templateId) {
          frontmatter['template'] = overrides.templateId;
        }
        if (overrides.defaultLabelSize) {
          frontmatter['label_size'] = overrides.defaultLabelSize;
        }
        if (typeof overrides.customWidth === 'number') {
          frontmatter['custom_width'] = overrides.customWidth;
        }
        if (typeof overrides.customHeight === 'number') {
          frontmatter['custom_height'] = overrides.customHeight;
        }
        if (overrides.qrCodePlacement) {
          frontmatter['qr_placement'] = overrides.qrCodePlacement;
        }
        if (typeof overrides.qrCodeSize === 'number') {
          frontmatter['qr_size'] = overrides.qrCodeSize;
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

    // Resolve template content rules
    const fileCache = app.metadataCache?.getFileCache ? app.metadataCache.getFileCache(file) : null;
    const fm = fileCache?.frontmatter || {};
    const targetTemplateId =
      overrides?.templateId ||
      fm.template ||
      fm.label_template ||
      effectiveSettings.defaultTemplate;
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

    const contentLines = resolveContentLines(file, template.contentRules, app.metadataCache);

    const content: LabelContent = {
      noteTitle,
      obsidianUri,
      notePath,
      contentLines,
    };

    const result = await generator.exportLabelPDF(app.vault, config, content, exportOptions);

    if (showNotice) {
      new Notice(`Label generated: ${result.filePath}`);
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
