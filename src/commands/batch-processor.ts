import { App, Notice, TFile } from 'obsidian';
import { resolveLabelPDFPath } from '../core/pdf-exporter';
import { LabelGenerator } from '../core/label-generator';
import { settingsToPDFExportOptions } from '../settings/mappers';
import { ObsidianLabelSettings } from '../settings/types';
import { generateLabelForNote } from './orchestrator';
import { isMarkdownFile } from './register';

export interface BatchRegenerateResult {
  totalEligible: number;
  regeneratedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ path: string; message: string }>;
}

/**
 * Checks whether a file path is located in an excluded system or template directory.
 */
export function isExcludedPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments.some((segment) => {
    return (
      segment.startsWith('.') ||
      segment.toLowerCase() === 'templates' ||
      segment.toLowerCase() === '_templates'
    );
  });
}

/**
 * Scans markdown notes across the vault and returns only those notes that
 * already have an existing generated label PDF in the configured output directory.
 */
export async function discoverEligibleNotes(
  app: App,
  settings: ObsidianLabelSettings,
): Promise<TFile[]> {
  const allFiles: TFile[] =
    typeof app.vault?.getMarkdownFiles === 'function' ? app.vault.getMarkdownFiles() : [];
  const exportOptions = settingsToPDFExportOptions(settings);
  const eligible: TFile[] = [];

  for (const file of allFiles) {
    if (!isMarkdownFile(file)) continue;
    if (isExcludedPath(file.path)) continue;

    const targetPDFPath = resolveLabelPDFPath(file.path, exportOptions);
    const exists = await app.vault.adapter.exists(targetPDFPath);
    if (exists) {
      eligible.push(file);
    }
  }

  return eligible;
}

/**
 * Iterates through eligible notes and regenerates their label PDFs asynchronously.
 */
export async function regenerateAllLabels(
  app: App,
  settings: ObsidianLabelSettings,
  generator: LabelGenerator = new LabelGenerator(),
  onProgress?: (current: number, total: number) => void,
  alsoPrint: boolean = false,
): Promise<BatchRegenerateResult> {
  const eligibleNotes = await discoverEligibleNotes(app, settings);

  const result: BatchRegenerateResult = {
    totalEligible: eligibleNotes.length,
    regeneratedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (eligibleNotes.length === 0) {
    new Notice('No existing label PDFs found to regenerate.');
    return result;
  }

  const effectiveBatchSettings: ObsidianLabelSettings = {
    ...settings,
    autoPrint: alsoPrint && settings.autoPrint,
  };

  for (let i = 0; i < eligibleNotes.length; i++) {
    const note = eligibleNotes[i];
    try {
      // Yield to event loop every 5 items to keep UI responsive
      if (i > 0 && i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      await generateLabelForNote(app, note, effectiveBatchSettings, undefined, generator, false);
      result.regeneratedCount++;
      if (onProgress) {
        onProgress(i + 1, eligibleNotes.length);
      }
    } catch (err: any) {
      result.failedCount++;
      result.errors.push({
        path: note.path,
        message: err.message || String(err),
      });
    }
  }

  const printSummary = effectiveBatchSettings.autoPrint
    ? ` and dispatched to printer "${settings.printerName}"`
    : '';
  const summary =
    result.failedCount > 0
      ? `Batch regeneration complete: ${result.regeneratedCount} regenerated${printSummary}, ${result.failedCount} failed.`
      : `Regenerated ${result.regeneratedCount} labels${printSummary}.`;
  new Notice(summary);

  return result;
}
