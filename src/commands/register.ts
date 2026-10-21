import { TFile } from 'obsidian';

/**
 * Checks whether a given file object is a valid markdown file.
 */
export function isMarkdownFile(file: any): file is TFile {
  if (!file) return false;
  if (file.extension === 'md') return true;
  if (typeof file.path === 'string' && file.path.endsWith('.md')) return true;
  return false;
}

/**
 * Registers all Obsidian Label palette commands onto the plugin instance.
 */
export function registerLabelCommands(plugin: any): void {
  // Command 1: Generate Label for Current Note (User Story 1 - P1 MVP)
  plugin.addCommand({
    id: 'generate-label-current-note',
    name: 'Generate Label for Current Note',
    checkCallback: (checking: boolean) => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (isMarkdownFile(activeFile)) {
        if (!checking) {
          plugin.generateLabelForCurrentNote(activeFile);
        }
        return true;
      }
      return false;
    },
  });

  // Command 2: Generate Label with Custom Settings... (User Story 2 - P2)
  plugin.addCommand({
    id: 'generate-label-custom',
    name: 'Generate Label with Custom Settings...',
    checkCallback: (checking: boolean) => {
      const activeFile = plugin.app.workspace.getActiveFile();
      if (isMarkdownFile(activeFile)) {
        if (!checking) {
          plugin.showCustomLabelDialog(activeFile);
        }
        return true;
      }
      return false;
    },
  });

  // Command 3: Regenerate All Labels in Vault (User Story 3 - P3)
  plugin.addCommand({
    id: 'regenerate-all-labels',
    name: 'Regenerate All Labels in Vault',
    callback: () => {
      plugin.regenerateAllLabels();
    },
  });

  // Command 4: Batch Label Generation (Feature 010)
  plugin.addCommand({
    id: 'batch-generate-labels',
    name: 'Batch Label Generation',
    callback: () => {
      if (typeof plugin.openBatchLabelModal === 'function') {
        plugin.openBatchLabelModal();
      }
    },
  });
}
