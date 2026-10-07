import { MetadataCache, TFile } from 'obsidian';
import {
  ContentLine,
  ContentRules,
  LabelTemplate,
  TemplateLayout,
  TemplateSize,
  TemplateStyle,
} from '../data-model';
import { ObsidianLabelSettings } from '../../../src/settings/types';

/**
 * Service contract for template registry management, resolution, and validation.
 */
export interface TemplateService {
  /**
   * Retrieves the immutable built-in system templates ('standard', 'compact', 'inventory').
   */
  getBuiltinTemplates(): LabelTemplate[];

  /**
   * Retrieves all available templates (built-in + user custom templates from settings).
   */
  getAllTemplates(settings: ObsidianLabelSettings): LabelTemplate[];

  /**
   * Resolves a template by ID, falling back to 'standard' if not found.
   */
  resolveTemplate(settings: ObsidianLabelSettings, templateId?: string): LabelTemplate;

  /**
   * Validates a template definition against schema rules and returns error messages.
   * Returns an empty array if valid.
   */
  validateTemplate(
    template: Partial<LabelTemplate>,
    existingTemplates?: LabelTemplate[],
  ): string[];

  /**
   * Adds or updates a custom template in settings, maintaining uniqueness.
   */
  saveCustomTemplate(
    settings: ObsidianLabelSettings,
    template: LabelTemplate,
  ): ObsidianLabelSettings;

  /**
   * Deletes a custom template by ID from settings.
   * Automatically resets defaultTemplate to 'standard' if the deleted template was active.
   */
  deleteCustomTemplate(
    settings: ObsidianLabelSettings,
    templateId: string,
  ): { updatedSettings: ObsidianLabelSettings; wasActive: boolean };

  /**
   * Creates an editable custom copy of an existing template with a new ID and display name.
   */
  duplicateTemplate(
    sourceTemplate: LabelTemplate,
    newName: string,
  ): LabelTemplate;
}

/**
 * Service contract for evaluating content rules and extracting note metadata.
 */
export interface ContentExtractor {
  /**
   * Extracts and formats all enabled content lines from a note based on template content rules.
   */
  resolveContentLines(
    file: TFile,
    contentRules: ContentRules,
    metadataCache?: MetadataCache,
  ): ContentLine[];

  /**
   * Formats a raw frontmatter value into a clean display string (handling strings, numbers, and lists).
   */
  formatFrontmatterValue(value: unknown): string;

  /**
   * Truncates a title string with an ellipsis if it exceeds maxLength.
   */
  truncateTitle(title: string, maxLength: number): string;
}
