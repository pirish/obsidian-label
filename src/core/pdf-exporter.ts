import { jsPDF } from 'jspdf';
import { MinimalVault, PDFDimensions, PDFExportOptions, PDFNamingOptions } from './types';

/**
 * Calculates physical PDF page dimensions and orientation.
 * Landscape when width > height, portrait otherwise.
 */
export function getPDFDimensions(widthMm: number, heightMm: number): PDFDimensions {
  if (widthMm <= 0 || heightMm <= 0) {
    throw new Error('PDF page dimensions must be positive numbers.');
  }
  return {
    widthMm,
    heightMm,
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
  };
}

/**
 * Compiles a rendered canvas image into a universal, printable PDF document.
 * Returns raw binary PDF bytes (Uint8Array).
 */
export function exportCanvasToPDF(
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number,
): Uint8Array {
  const { orientation } = getPDFDimensions(widthMm, heightMm);

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');

  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}

/**
 * Compiles a rendered canvas image into a browser/DOM Blob representing application/pdf.
 */
export function exportCanvasToPDFBlob(
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number,
): Blob {
  const { orientation } = getPDFDimensions(widthMm, heightMm);

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');

  return doc.output('blob');
}

/**
 * Generates standardized label filename based on note path and naming options.
 *
 * @param notePath Vault-relative note path (e.g., "Folder/MyNote.md")
 * @param options Naming options (e.g., includeTimestamp, date)
 * @returns Filename (e.g., "MyNote_label.pdf" or "MyNote_label_2026-10-04.pdf")
 */
export function generateLabelFilename(notePath: string, options?: PDFNamingOptions): string {
  // Normalize Windows backslashes and strip directory components
  const normalized = notePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const rawFileName = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;

  // Strip .md extension
  const baseName = rawFileName.replace(/\.md$/i, '') || 'label';

  if (options?.includeTimestamp) {
    const dateObj = options.date ?? new Date();
    const dateStr = dateObj.toISOString().split('T')[0];
    return `${baseName}_label_${dateStr}.pdf`;
  }

  return `${baseName}_label.pdf`;
}

/**
 * Resolves the full vault destination path for the exported PDF.
 *
 * @param notePath Vault-relative note path
 * @param options Export options (location, customFolder, naming)
 * @returns Full normalized vault path (e.g., "Folder/MyNote_label.pdf" or "_labels/MyNote_label.pdf")
 */
export function resolveLabelPDFPath(notePath: string, options?: PDFExportOptions): string {
  const filename = generateLabelFilename(notePath, options?.naming);
  const location = options?.location ?? 'same-folder';

  if (location === 'dedicated-folder') {
    return `_labels/${filename}`;
  }

  if (location === 'custom-folder') {
    const rawFolder = options?.customFolder ?? '';
    const cleanFolder = rawFolder.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
    return cleanFolder ? `${cleanFolder}/${filename}` : filename;
  }

  // Default: 'same-folder'
  const normalized = notePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash >= 0) {
    const dir = normalized.substring(0, lastSlash);
    return `${dir}/${filename}`;
  }

  return filename;
}

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
export async function savePDFToVault(
  vault: MinimalVault,
  targetPath: string,
  pdfData: Uint8Array | ArrayBuffer,
): Promise<string> {
  const normalizedPath = targetPath.replace(/\\/g, '/').replace(/^\/+/, '');

  try {
    // If target has parent directories, ensure they exist recursively
    const lastSlash = normalizedPath.lastIndexOf('/');
    if (lastSlash > 0) {
      const dirPath = normalizedPath.substring(0, lastSlash);
      const segments = dirPath.split('/');
      let currentPath = '';

      for (const segment of segments) {
        if (!segment) continue;
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        const exists = await vault.adapter.exists(currentPath);
        if (!exists) {
          await vault.adapter.mkdir(currentPath);
        }
      }
    }

    const buffer: ArrayBuffer =
      pdfData instanceof Uint8Array
        ? (pdfData.buffer.slice(
            pdfData.byteOffset,
            pdfData.byteOffset + pdfData.byteLength,
          ) as ArrayBuffer)
        : pdfData;

    await vault.adapter.writeBinary(normalizedPath, buffer);
    return normalizedPath;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save PDF to vault at '${normalizedPath}': ${errorMsg}`);
  }
}
