/**
 * Contract: Vault Storage & Path Resolver
 * Feature: 003-pdf-export
 */

import {
  MinimalVault,
  PDFExportLocation,
  PDFExportOptions,
  PDFNamingOptions,
  ExportedPDFResult,
} from '../data-model';

/**
 * Generates standardized label filename based on note path and naming options.
 *
 * @param notePath Vault-relative note path (e.g., "Folder/MyNote.md")
 * @param options Naming options (e.g., includeTimestamp, date)
 * @returns Filename (e.g., "MyNote_label.pdf" or "MyNote_label_2026-10-04.pdf")
 */
export declare function generateLabelFilename(
  notePath: string,
  options?: PDFNamingOptions
): string;

/**
 * Resolves the full vault destination path for the exported PDF.
 *
 * @param notePath Vault-relative note path
 * @param options Export options (location, customFolder, naming)
 * @returns Full normalized vault path (e.g., "Folder/MyNote_label.pdf" or "_labels/MyNote_label.pdf")
 */
export declare function resolveLabelPDFPath(
  notePath: string,
  options?: PDFExportOptions
): string;

/**
 * Persists raw PDF binary data into the Obsidian vault at the specified path.
 * Creates any missing parent directories recursively before writing.
 * Overwrites existing files cleanly on regeneration.
 *
 * @param vault MinimalVault instance (e.g. app.vault)
 * @param targetPath Vault-relative file path
 * @param pdfData Uint8Array or ArrayBuffer containing PDF bytes
 * @returns Promise resolving to the saved normalized vault path
 */
export declare function savePDFToVault(
  vault: MinimalVault,
  targetPath: string,
  pdfData: Uint8Array | ArrayBuffer
): Promise<string>;
