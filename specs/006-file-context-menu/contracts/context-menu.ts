import { App, Menu, TAbstractFile, TFile } from 'obsidian';
import { LabelGenerator } from '../../../src/core/label-generator';
import { ObsidianLabelSettings } from '../../../src/settings/types';

/**
 * Result metrics for multi-file context menu generation.
 */
export interface MultiFileGenerationResult {
  totalSelected: number;
  markdownCount: number;
  generatedCount: number;
  failedCount: number;
  errors: Array<{ path: string; message: string }>;
}

/**
 * Handler for the single-item 'file-menu' workspace event.
 */
export type FileMenuHandler = (
  menu: Menu,
  file: TAbstractFile,
  source: string,
) => void;

/**
 * Handler for the multi-item 'files-menu' workspace event.
 */
export type FilesMenuHandler = (
  menu: Menu,
  files: TAbstractFile[],
  source: string,
) => void;

/**
 * Context menu service contract.
 */
export interface FileContextMenuService {
  /**
   * Registers both 'file-menu' and 'files-menu' listeners on the plugin instance.
   */
  registerFileMenuEvents(plugin: any): void;

  /**
   * Generates labels for an array of selected markdown files.
   */
  generateLabelsForSelectedNotes(
    app: App,
    files: TFile[],
    settings: ObsidianLabelSettings,
    generator?: LabelGenerator,
    onProgress?: (current: number, total: number) => void,
  ): Promise<MultiFileGenerationResult>;
}
