# Research: PDF Export for Physical Label Printing

**Feature**: `specs/003-pdf-export`  
**Date**: 2026-10-04  
**Status**: Completed

## 1. jsPDF Page Sizing, Compression & Image Embedding

### Context & Requirements
- **FR-001 & FR-003**: PDF documents must match physical label dimensions in millimeters (`width` and `height`) with automatic orientation (`landscape` when `width > height`, `portrait` otherwise).
- **FR-002 & FR-004**: High resolution (300+ DPI minimum) with zero margins, filling the page surface edge-to-edge.

### Research Findings
1. **jsPDF Page Sizing & Orientation**:
   - `jsPDF({ orientation, unit: 'mm', format: [widthMm, heightMm], compress: true })` accurately sets the PDF MediaBox and CropBox in points based on the specified millimeter dimensions ($1\text{ mm} = 72 / 25.4 \approx 2.83465\text{ pt}$).
   - Passing `format: [widthMm, heightMm]` alongside orientation ensures that PDF readers render the page at the exact physical dimensions without distortion.
2. **Raster Image Embedding (`addImage`)**:
   - Embedding a PNG data URL at `(0, 0, widthMm, heightMm)` maps the source canvas raster pixels across the full physical page dimensions.
   - At 300 DPI, a $40\text{ mm} \times 30\text{ mm}$ label renders at $472 \times 354$ pixels. Embedding this raster fills the 40mm x 30mm page cleanly at 300 DPI.
   - Passing `'FAST'` compression in `addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST')` accelerates generation while maintaining lossless visual quality.
3. **Dual Export Formats**:
   - `doc.output('arraybuffer')`: Produces an `ArrayBuffer` easily converted to `Uint8Array` for Node/Electron file writing.
   - `doc.output('blob')`: Produces a browser `Blob` suitable for DOM downloads and preview URLs.

### Decision
- Retain and extend `src/core/pdf-exporter.ts` to export:
  - `exportCanvasToPDF(canvas, widthMm, heightMm): Uint8Array`
  - `exportCanvasToPDFBlob(canvas, widthMm, heightMm): Blob`
  - `exportLabelPDF(canvas, config, options): Promise<ExportedPDFResult>`

---

## 2. Obsidian Vault Storage & Binary File Writing

### Context & Requirements
- **FR-005, FR-006 & FR-007**: Store PDFs in vault (same folder as note, dedicated `_labels/` root folder, or custom path) and auto-create missing directories.
- **FR-009**: Overwrite existing files cleanly on regeneration.
- **FR-010**: 100% offline, local vault execution with zero telemetry.

### Research Findings
1. **Obsidian Vault API Methods**:
   - `app.vault.adapter.writeBinary(normalizedPath, buffer)`: Writes raw `ArrayBuffer` directly to disk, overwriting existing files if present.
   - `app.vault.adapter.exists(normalizedPath)`: Asynchronously checks if a file or directory exists.
   - `app.vault.createFolder(folderPath)` or `app.vault.adapter.mkdir(folderPath)`: Recursively or iteratively ensures that destination folders exist prior to writing.
   - `app.vault.getAbstractFileByPath(path)`: High-level Obsidian API returning `TFile` or `TFolder`.
     - If file exists: `app.vault.modifyBinary(tFile, buffer)`.
     - If file does not exist: `app.vault.createBinary(path, buffer)`.
2. **Testing & Decoupling via Minimal Interface**:
   - To maintain unit testability in Jest without a running Obsidian desktop app, create an interface abstraction `MinimalVault`:
     ```typescript
     export interface MinimalVault {
       adapter: {
         exists(path: string): Promise<boolean>;
         writeBinary(path: string, data: ArrayBuffer): Promise<void>;
         mkdir(path: string): Promise<void>;
       };
     }
     ```
   - In Obsidian runtime, `app.vault` satisfies this interface directly.

### Decision
- Implement `savePDFToVault(vault: MinimalVault, targetPath: string, data: Uint8Array | ArrayBuffer): Promise<string>`.
- Recursively verify/create destination parent directories using `vault.adapter.mkdir` or `vault.createFolder` before writing.
- Overwrite existing files cleanly via `vault.adapter.writeBinary` (or modifyBinary), handling errors with descriptive diagnostic messages.

---

## 3. Path Resolution & Filename Formatting

### Context & Requirements
- **FR-008 & Clarification**: Standardized naming defaulting to `[NoteName]_label.pdf`, with an optional setting to append date timestamp `[NoteName]_label_YYYY-MM-DD.pdf`.
- Support root notes (`MyNote.md`), nested notes (`Folder/Sub/MyNote.md`), dedicated folder (`_labels/`), and custom folders.

### Research Findings
1. **Note Base Name Extraction**:
   - Given `path = "Projects/Workshop/Multimeter.md"`, base name is `"Multimeter"` (stripping `.md`).
   - Given `path = "Multimeter.md"` (root note), base name is `"Multimeter"`.
2. **Filename Generation**:
   ```typescript
   export function generateLabelFilename(
     notePath: string,
     options?: { includeTimestamp?: boolean; date?: Date }
   ): string {
     const parts = notePath.replace(/\\/g, '/').split('/');
     const fileNameWithExt = parts[parts.length - 1] || 'label';
     const baseName = fileNameWithExt.replace(/\.md$/i, '');
     
     if (options?.includeTimestamp) {
       const d = options.date || new Date();
       const isoDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
       return `${baseName}_label_${isoDate}.pdf`;
     }
     return `${baseName}_label.pdf`;
   }
   ```
3. **Destination Path Resolution**:
   - `same-folder`: Extract directory from `notePath` (`parts.slice(0, -1).join('/')`). If empty, target directory is `""` (vault root). Result: `folder ? `${folder}/${filename}` : filename`.
   - `dedicated-folder`: Result: `_labels/${filename}`.
   - `custom-folder`: Strip leading/trailing slashes from custom path, append `/${filename}`.

### Decision
- Implement pure utility functions in `src/core/pdf-exporter.ts` (or `src/core/storage.ts`):
  - `generateLabelFilename(notePath, options)`
  - `resolveLabelPDFPath(notePath, locationOption, customFolderPath, filename)`
