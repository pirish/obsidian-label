import { App, Notice, TFile } from 'obsidian';
import {
  BatchPageEntry,
  clearBatchPageCache,
  getBatchPage,
  recordBatchPage,
  resolveLabelPDFPath,
} from '../core/pdf-exporter';
import { LabelGenerator } from '../core/label-generator';
import { settingsToPDFExportOptions } from '../settings/mappers';
import { ObsidianLabelSettings } from '../settings/types';
import { generateLabelForNote } from './orchestrator';
import { isMarkdownFile } from './register';

export { BatchPageEntry, clearBatchPageCache, getBatchPage, recordBatchPage };

export interface BatchRegenerateResult {
  totalEligible: number;
  regeneratedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ path: string; message: string }>;
}

export type BatchSelectionMethod = 'folder' | 'tag' | 'search';

export interface BatchSelectionCriteria {
  method: BatchSelectionMethod;
  folderPath?: string;
  includeSubfolders?: boolean;
  tag?: string;
  searchQuery?: string;
}

/**
 * Discovers all non-excluded folder paths across the vault (always starting with '/' for vault root).
 */
export function discoverVaultFolders(app: App): string[] {
  const allFiles: TFile[] =
    typeof app?.vault?.getMarkdownFiles === 'function' ? app.vault.getMarkdownFiles() : [];
  const folders = new Set<string>();

  for (const file of allFiles) {
    if (!isMarkdownFile(file) || isExcludedPath(file.path)) continue;
    const normalized = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalized.split('/');
    // Collect all ancestor folder prefixes
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      if (!isExcludedPath(current)) {
        folders.add(current);
      }
    }
  }

  return ['/', ...Array.from(folders).sort((a, b) => a.localeCompare(b))];
}

/**
 * Filters markdown notes by target folder path.
 * Supports recursive matching (includeSubfolders = true) or direct-children-only (includeSubfolders = false).
 */
export function filterNotesByFolder(
  files: TFile[],
  folderPath: string,
  includeSubfolders: boolean = true,
): TFile[] {
  const cleanFolder = (folderPath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return files.filter((file) => {
    if (!isMarkdownFile(file) || isExcludedPath(file.path)) return false;
    const normPath = file.path.replace(/\\/g, '/').replace(/^\/+/, '');

    if (cleanFolder === '') {
      // Vault root '/'
      if (includeSubfolders) {
        return true;
      }
      return !normPath.includes('/');
    }

    if (!normPath.startsWith(`${cleanFolder}/`)) {
      return false;
    }

    if (includeSubfolders) {
      return true;
    }

    const remainder = normPath.substring(cleanFolder.length + 1);
    return remainder.length > 0 && !remainder.includes('/');
  });
}

/**
 * Extracts normalized lowercase tag strings (without leading '#') for a markdown file
 * from both frontmatter (tags/tag) and inline metadataCache tags.
 */
export function extractNormalizedTagsForFile(app: App, file: TFile): string[] {
  const fileCache = app?.metadataCache?.getFileCache ? app.metadataCache.getFileCache(file) : null;
  const fm = fileCache?.frontmatter || (file as any)?.frontmatter || {};
  const rawTags: string[] = [];

  // 1. Inline tags from metadataCache
  if (Array.isArray((fileCache as any)?.tags)) {
    for (const t of (fileCache as any).tags) {
      if (t && typeof t.tag === 'string') {
        rawTags.push(t.tag);
      }
    }
  }

  // 2. Frontmatter tags / tag
  const fmTags = fm.tags ?? fm.tag;
  if (Array.isArray(fmTags)) {
    for (const item of fmTags) {
      if (item !== null && item !== undefined) {
        rawTags.push(String(item));
      }
    }
  } else if (typeof fmTags === 'string') {
    fmTags
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => rawTags.push(s));
  }

  return rawTags.map((t) => t.trim().replace(/^#+/, '').toLowerCase()).filter((t) => t.length > 0);
}

/**
 * Filters markdown notes by tag name (normalizing leading '#' and matching exact or nested subtags).
 */
export function filterNotesByTag(app: App, files: TFile[], tagQuery: string): TFile[] {
  const cleanTag = (tagQuery || '').trim().replace(/^#+/, '').toLowerCase();
  if (!cleanTag) return [];

  return files.filter((file) => {
    if (!isMarkdownFile(file) || isExcludedPath(file.path)) return false;
    const fileTags = extractNormalizedTagsForFile(app, file);
    return fileTags.some((t) => t === cleanTag || t.startsWith(`${cleanTag}/`));
  });
}

/**
 * Filters markdown notes by search query across file path, basename, and note body content.
 */
export async function filterNotesBySearch(
  app: App,
  files: TFile[],
  searchQuery: string,
): Promise<TFile[]> {
  const cleanQuery = (searchQuery || '').trim().toLowerCase();
  if (!cleanQuery) return [];

  const matched: TFile[] = [];

  for (const file of files) {
    if (!isMarkdownFile(file) || isExcludedPath(file.path)) continue;

    const pathMatch = file.path.toLowerCase().includes(cleanQuery);
    const titleMatch = (file.basename || file.name || '').toLowerCase().includes(cleanQuery);
    if (pathMatch || titleMatch) {
      matched.push(file);
      continue;
    }

    // Check note body content if vault read methods are available
    let content = '';
    try {
      if (typeof (app?.vault as any)?.cachedRead === 'function') {
        content = await (app.vault as any).cachedRead(file);
      } else if (typeof (app?.vault as any)?.read === 'function') {
        content = await (app.vault as any).read(file);
      } else if (typeof app?.vault?.adapter?.read === 'function') {
        content = await app.vault.adapter.read(file.path);
      }
    } catch {
      content = '';
    }

    if (typeof content === 'string' && content.toLowerCase().includes(cleanQuery)) {
      matched.push(file);
    }
  }

  return matched;
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
