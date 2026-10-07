import { TFile } from 'obsidian';
import { ContentLine, ContentRules } from './types';

/**
 * Truncates a title string with an ellipsis if it exceeds the specified maximum length.
 */
export function truncateTitle(title: string, maxLength: number): string {
  if (!title) return '';
  if (maxLength <= 0) return title;
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength).trimEnd()}...`;
}

/**
 * Formats a raw frontmatter value into a clean string representation.
 * Serializes YAML arrays/lists into comma-separated strings (e.g. ['sensor', 'lab'] -> 'sensor, lab').
 */
export function formatFrontmatterValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== null && v !== undefined && String(v).trim().length > 0)
      .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v).trim()))
      .join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value).trim();
}

/**
 * Formats a millisecond timestamp to a standard YYYY-MM-DD date string.
 */
export function formatDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return '';
  try {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Resolves note directory or relative path.
 */
export function resolveNotePath(file: TFile): string {
  if (file.parent?.path && file.parent.path !== '/' && file.parent.path !== '.') {
    return file.parent.path;
  }
  const parts = file.path.split('/');
  if (parts.length > 1) {
    parts.pop();
    return parts.join('/');
  }
  return file.path;
}

/**
 * Evaluates template ContentRules against a note and its metadata cache,
 * producing an ordered array of structured ContentLines.
 */
export function resolveContentLines(
  file: TFile,
  contentRules: ContentRules,
  metadataCache?: any,
): ContentLine[] {
  const lines: ContentLine[] = [];
  if (!contentRules) return lines;

  // 1. Note Title
  if (contentRules.showTitle) {
    const title = truncateTitle(file.basename, contentRules.titleMaxLength || 40);
    if (title) {
      lines.push({
        type: 'title',
        text: title,
      });
    }
  }

  // 2. Note Relative Folder Path
  if (contentRules.showPath) {
    const pathText = resolveNotePath(file);
    if (pathText) {
      lines.push({
        type: 'path',
        text: pathText,
      });
    }
  }

  // 3. Creation Date
  if (contentRules.showDateCreated && file.stat?.ctime) {
    const dateStr = formatDate(file.stat.ctime);
    if (dateStr) {
      lines.push({
        type: 'date_created',
        label: 'Created',
        text: dateStr,
      });
    }
  }

  // 4. Last Modification Date
  if (contentRules.showDateModified && file.stat?.mtime) {
    const dateStr = formatDate(file.stat.mtime);
    if (dateStr) {
      lines.push({
        type: 'date_modified',
        label: 'Modified',
        text: dateStr,
      });
    }
  }

  // 5. Custom Frontmatter Fields
  if (Array.isArray(contentRules.customFields) && contentRules.customFields.length > 0) {
    const fileCache = metadataCache?.getFileCache ? metadataCache.getFileCache(file) : null;
    const frontmatter = fileCache?.frontmatter || (file as any).frontmatter || {};

    for (const rawKey of contentRules.customFields) {
      const key = rawKey.trim();
      if (!key) continue;

      // Lookup exact key or case-insensitive match
      const matchingKey = Object.keys(frontmatter).find(
        (k) => k.toLowerCase() === key.toLowerCase(),
      );

      if (matchingKey && frontmatter[matchingKey] !== undefined) {
        const formattedVal = formatFrontmatterValue(frontmatter[matchingKey]);
        if (formattedVal.length > 0) {
          // Format label nicely (e.g. 'category' -> 'Category', 'serial_no' -> 'Serial No')
          const label = key.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

          lines.push({
            type: 'custom_field',
            label,
            text: formattedVal,
          });
        }
      }
    }
  }

  return lines;
}
