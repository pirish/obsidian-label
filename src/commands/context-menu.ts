import { App, Menu, MenuItem, Notice, TAbstractFile, TFile } from 'obsidian';
import { LabelGenerator } from '../core/label-generator';
import { ObsidianLabelSettings } from '../settings/types';
import { generateLabelForNote } from './orchestrator';
import { isMarkdownFile } from './register';

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
 * Iterates through an array of selected Markdown files and generates their labels.
 */
export async function generateLabelsForSelectedNotes(
  app: App,
  files: TFile[],
  settings: ObsidianLabelSettings,
  generator: LabelGenerator = new LabelGenerator(),
  onProgress?: (current: number, total: number) => void,
): Promise<MultiFileGenerationResult> {
  const result: MultiFileGenerationResult = {
    totalSelected: files.length,
    markdownCount: files.length,
    generatedCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (files.length === 0) {
    return result;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Yield to event loop every 5 items to keep UI responsive
      if (i > 0 && i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      await generateLabelForNote(app, file, settings, undefined, generator, false);
      result.generatedCount++;
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (err: unknown) {
      result.failedCount++;
      result.errors.push({
        path: file.path,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const summary =
    result.failedCount > 0
      ? `Batch generation complete: ${result.generatedCount} generated, ${result.failedCount} failed.`
      : `Generated ${result.generatedCount} labels.`;
  new Notice(summary);

  return result;
}

/**
 * Registers native Obsidian file context menu event handlers on the plugin instance.
 */
export function registerFileMenuEvents(plugin: any): void {
  if (!plugin?.app?.workspace?.on || typeof plugin.app.workspace.on !== 'function') {
    return;
  }

  const register =
    typeof plugin.registerEvent === 'function'
      ? (ref: any) => plugin.registerEvent(ref)
      : () => {};

  // 1. Single-file context menu: 'file-menu'
  register(
    plugin.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
      if (isMarkdownFile(file)) {
        menu.addItem((item: MenuItem) => {
          item
            .setTitle('Generate Label')
            .setIcon('tag')
            .onClick(async () => {
              try {
                await generateLabelForNote(
                  plugin.app,
                  file,
                  plugin.settings,
                  undefined,
                  plugin.generator,
                  true,
                );
              } catch (err: unknown) {
                new Notice(
                  `Error generating label: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            });
        });
      }
    }),
  );

  // 2. Multi-file selection context menu: 'files-menu'
  register(
    plugin.app.workspace.on('files-menu', (menu: Menu, files: TAbstractFile[]) => {
      const mdFiles = Array.isArray(files) ? files.filter(isMarkdownFile) : [];
      if (mdFiles.length > 0) {
        menu.addItem((item: MenuItem) => {
          item
            .setTitle('Generate Labels')
            .setIcon('tag')
            .onClick(async () => {
              try {
                await generateLabelsForSelectedNotes(
                  plugin.app,
                  mdFiles,
                  plugin.settings,
                  plugin.generator,
                );
              } catch (err: unknown) {
                new Notice(
                  `Error generating labels: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            });
        });
      }
    }),
  );
}
