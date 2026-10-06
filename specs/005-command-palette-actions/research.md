# Research & Technical Decisions: Command Palette Label Actions & Batch Generation

**Feature**: `specs/005-command-palette-actions`  
**Date**: 2026-10-06  
**Status**: Completed

## 1. Technical Decisions

### Decision 1: Command Palette Registration & Conditional Availability (`checkCallback`)
- **Decision**: Use Obsidian's official `checkCallback` API for `generate-label-current-note` and `generate-label-custom` commands.
- **Rationale**: Obsidian's `checkCallback: (checking: boolean) => boolean` pattern enables the command palette to dynamically evaluate whether an active note is open. When `checking` is true, checking `app.workspace.getActiveFile()` and verifying its extension is `.md` determines visibility. When `checking` is false, the action executes.
- **Alternatives Considered**:
  - `callback` without check: Command would always appear, but clicking it without an active file would require an annoying error Notice. `checkCallback` provides native, seamless Obsidian UX.

### Decision 2: Per-Note Settings Hierarchy & Frontmatter Persistence
- **Decision**: Implement a 3-tier configuration resolution hierarchy:
  1. Temporary modal overrides passed at runtime (highest priority)
  2. Per-note frontmatter metadata in note YAML (`label_size`, `custom_width`, `custom_height`, `qr_placement`)
  3. Global plugin settings from `this.settings` (baseline defaults)
  When "Save as note default" is checked in `CustomLabelModal`, use Obsidian's `app.fileManager.processFrontMatter` to update frontmatter cleanly.
- **Rationale**: Respects the principle of flexible defaults while ensuring user notes are never mutated unless explicitly requested via the modal checkbox.
- **Alternatives Considered**:
  - Global settings only: Doesn't allow customizing specific labels without affecting all future labels.
  - Separate JSON mapping file: Brittle when notes are renamed or moved; Obsidian frontmatter stays attached to the note.

### Decision 3: Batch Regeneration Discovery & Existing Label Matching
- **Decision**: For "Regenerate All Labels in Vault", inspect `app.vault.getMarkdownFiles()`, filter out `.trash`, `.obsidian`, and template folders, and check whether `resolveLabelPDFPath(file.path, exportOptions)` already exists on the vault adapter (`vault.adapter.exists`).
- **Rationale**: Conforms directly to the clarified specification (Option B: only regenerate notes with existing label PDFs). This prevents unwanted generation of hundreds of new PDFs for notes the user never wanted to label.
- **Alternatives Considered**:
  - Blindly processing all vault markdown files: Would create unwanted PDF files for every note in the vault, potentially creating hundreds of unwanted files.
  - Tag-based filtering: Requires users to manually tag every note with `#label`.

### Decision 4: Batch Confirmation Dialog & UI Responsiveness
- **Decision**: Present `BatchConfirmModal` showing the count of notes to regenerate and an explicit warning before execution. During batch iteration, yield the execution thread between items (`setTimeout(..., 0)`) to ensure Obsidian's UI never freezes, updating notice metrics upon completion.
- **Rationale**: Batch writes can overwrite multiple files. A confirmation modal prevents accidental palette activation, and asynchronous yielding keeps Obsidian smooth and responsive.
- **Alternatives Considered**:
  - Synchronous blocking `for` loop: Could cause frame drops or UI stuttering on large vaults with hundreds of notes.

---

## 2. Best Practices & API References

- **Obsidian Command API**:
  ```typescript
  this.addCommand({
    id: 'generate-label-current-note',
    name: 'Generate Label for Current Note',
    checkCallback: (checking: boolean) => {
      const activeFile = this.app.workspace.getActiveFile();
      const isMarkdown = activeFile && activeFile.extension === 'md';
      if (isMarkdown) {
        if (!checking) {
          this.generateLabelForNote(activeFile);
        }
        return true;
      }
      return false;
    }
  });
  ```
- **Obsidian Frontmatter Update**:
  ```typescript
  if (app.fileManager?.processFrontMatter) {
    await app.fileManager.processFrontMatter(file, (frontmatter: any) => {
      if (overrides.defaultLabelSize) frontmatter['label_size'] = overrides.defaultLabelSize;
      if (overrides.customWidth) frontmatter['custom_width'] = overrides.customWidth;
      if (overrides.customHeight) frontmatter['custom_height'] = overrides.customHeight;
      if (overrides.qrCodePlacement) frontmatter['qr_placement'] = overrides.qrCodePlacement;
    });
  }
  ```
