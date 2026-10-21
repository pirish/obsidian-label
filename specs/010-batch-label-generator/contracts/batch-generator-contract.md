# Contract: Batch Label Generator UI & API (`010-batch-label-generator`)

**Date**: 2026-10-21  
**Feature**: [spec.md](../spec.md)

---

## 1. Command Palette Registration (`src/commands/register.ts`)

| Command ID | Command Name | Trigger Behavior |
| :--- | :--- | :--- |
| `batch-generate-labels` | `Batch Label Generation` | Invokes `plugin.openBatchLabelModal()` which opens `new BatchLabelModal(this.app, this)`. Available unconditionally from the Command Palette. |

---

## 2. `BatchLabelModal` Contract (`src/ui/batch-label-modal.ts`)

```typescript
export class BatchLabelModal extends Modal {
  public plugin: ObsidianLabelPlugin;
  public selectedNotes: TFile[] = [];
  public selectionMethod: 'folder' | 'tag' | 'search' = 'folder';
  public selectedFolder: string = '';
  public includeSubfolders: boolean = true;
  public selectedTag: string = '';
  public searchQuery: string = '';
  public mergeBatchPDFs: boolean = false;

  public selectionContainer!: HTMLElement;
  public previewContainer!: HTMLElement;
  public generateButton?: ButtonComponent;

  constructor(appOrPlugin: App | ObsidianLabelPlugin, plugin?: ObsidianLabelPlugin);

  onOpen(): void;
  showSelectionUI(method: string): void;
  updatePreview(): Promise<void>;
  generateBatchLabels(): Promise<void>;
  mergePDFs(pdfPaths: string[]): Promise<string>;
}
```

### UI Elements & DOM Contract
1. **Header**: `h2` with text `'Batch Label Generation'`.
2. **Selection Method Section**:
   - `h3` with text `'Select Notes'`.
   - `Setting` named `'Selection Method'` with dropdown options:
     - `'folder'`: `'All notes in a folder'`
     - `'tag'`: `'All notes with a tag'`
     - `'search'`: `'Search results'`
   - `.selection-container` `div` populated dynamically by `showSelectionUI(method)`:
     - When `method === 'folder'`: Folder dropdown (`'/'` for vault root plus all vault folders) and `'Include subfolders'` toggle (default `true`).
     - When `method === 'tag'`: Tag text input (accepting `#tag` or `tag`).
     - When `method === 'search'`: Search query text input.
3. **Preview Section**:
   - `h3` with text `'Preview'`.
   - `.preview-container` `div` updated by `updatePreview()`:
     - When `selectedNotes.length === 0`: `<p>No notes selected</p>`, and `Generate Labels` button is disabled (`setDisabled(true)`).
     - When `selectedNotes.length > 0`:
       - `<p>${selectedNotes.length} labels will be generated</p>`
       - `<ul>` containing up to 10 `<li>` items with `note.path`
       - If `selectedNotes.length > 10`: `<p>... and ${selectedNotes.length - 10} more</p>`
       - `Generate Labels` button is enabled (`setDisabled(false)`).
4. **Merge Option & Action Button**:
   - `'Merge into single multi-page PDF'` toggle initialized from `plugin.settings.mergeBatchPDFs`.
   - `'Generate Labels'` CTA button (`setCta()`, initially disabled until `selectedNotes.length > 0`).

---

## 3. `ProgressModal` Contract (`src/ui/progress-modal.ts`)

```typescript
export class ProgressModal extends Modal {
  public total: number;
  public current: number = 0;
  public progressBar!: HTMLDivElement;
  public statusText!: HTMLParagraphElement;

  constructor(app: App, total: number);
  onOpen(): void;
  update(current: number): void;
}
```

### UI Elements & DOM Contract
- `h2` with text `'Generating Labels'`
- `this.statusText`: `<p>` initialized to `'0 / ${this.total}'` and updated on `update(current)` to `'${current} / ${this.total}'`.
- `.progress-container` containing `.progress-bar` (`this.progressBar`) initialized with `style.width = '0%'` and updated on `update(current)` to `style.width = '${(current / this.total) * 100}%'`.

---

## 4. PDF Merging Contract (`mergePDFs`)

- **Input**: `pdfPaths: string[]` (vault-relative paths of generated label PDFs).
- **Behavior**:
  1. Reads each `pdfPath` via `this.app.vault.adapter.readBinary(pdfPath)` (when available).
  2. Combines all `K` label pages into a single multi-page PDF document preserving per-page physical dimensions (`widthMm`, `heightMm`, `orientation`).
  3. Writes binary output via `this.app.vault.adapter.writeBinary(outputPath, mergedBytes)` where `outputPath = 'labels_batch_' + new Date().toISOString().split('T')[0] + '.pdf'`.
  4. Displays `new Notice(\`Merged PDF created: ${outputPath}\`)` and returns `outputPath`.
