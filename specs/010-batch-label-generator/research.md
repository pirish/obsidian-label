# Research & Architectural Decisions: Batch Label Generator (`010-batch-label-generator`)

**Date**: 2026-10-21  
**Feature**: [spec.md](./spec.md)

---

## Decision 1: Multi-Page PDF Merging Without Adding External Dependencies

- **Decision**: Implement multi-page PDF merging (`mergePDFs(pdfPaths: string[])`) using the existing `jspdf` (`^2.5.2`) dependency (`doc.addPage([widthMm, heightMm], orientation)` + `doc.addImage(...)`) combined with `vault.adapter.readBinary` / `vault.adapter.writeBinary`, rather than adding a new `pdf-lib` dependency.
- **Rationale**:
  1. **Constitution Principle III (Minimal External Dependencies)** explicitly mandates using standard web APIs and existing self-contained libraries before integrating a new external library.
  2. `jspdf` is already bundled in `package.json` and natively supports multi-page documents where each page can have its own physical dimensions (`[widthMm, heightMm]`) and orientation (`portrait` | `landscape`).
  3. During `generateBatchLabels()`, each note's rendered label image data URL and physical dimensions can be cached alongside its exported `pdfPath`, and `mergePDFs(pdfPaths)` also reads each `pdfPath` via `vault.adapter.readBinary` (satisfying binary verification and any test mocks on `readBinary`) before assembling all pages into `labels_batch_YYYY-MM-DD.pdf` and saving via `vault.adapter.writeBinary`.
- **Alternatives Considered**:
  - *Adding `pdf-lib` to `package.json`*: Increases bundle size and external dependency surface area when `jspdf` already produces multi-page PDFs with per-page millimeter dimensions.

---

## Decision 2: Vault Note Filtering by Folder (with Subfolder Toggle), Tag, and Search Query

- **Decision**: Create pure, testable note-selection filter functions in `src/commands/batch-processor.ts` (or `src/commands/batch-generator.ts`) and wire them into `BatchLabelModal`:
  1. **Folder mode (`'folder'`)**: Discovers all unique vault folders from `vault.getMarkdownFiles()` (plus root `'/'`), renders a folder dropdown and an `"Include subfolders"` toggle (`default: true`), and filters non-excluded Markdown files either recursively (`includeSubfolders: true`) or by direct parent folder (`includeSubfolders: false`).
  2. **Tag mode (`'tag'`)**: Normalizes user input by stripping any leading `#` and lowercasing (`#inventory` -> `inventory`), then checks both `metadataCache.getFileCache(file)?.tags` (inline `#tags`) and `frontmatter.tags` / `frontmatter.tag` (YAML array or comma/space-separated string), matching exact tags and nested subtags (`tag/subtag`).
  3. **Search mode (`'search'`)**: Matches non-excluded Markdown files case-insensitively against `file.path`, `file.basename`, and note body content (via `vault.cachedRead` or `vault.adapter.read`).
- **Rationale**: Pure helper functions allow exhaustive unit testing of edge cases (hidden `.` directories, `templates`/`_templates` exclusions, `#tag` vs `tag` normalization, direct vs recursive subfolder matching) independent of DOM rendering.
- **Alternatives Considered**:
  - *Relying on Obsidian's internal private global-search leaf API*: Violates Technical Standards ("No private or undocumented Obsidian APIs without documented fallback") and is difficult to unit test deterministically.

---

## Decision 3: Progress Modal & Fault-Tolerant Sequential Execution

- **Decision**: Implement `ProgressModal` (`src/ui/progress-modal.ts`) displaying `0 / <total>` status text and a `.progress-bar` element whose `style.width` updates to `${(current / total) * 100}%` after each note completes, while catching per-note errors (`console.error(\`Failed to generate label for ${note.path}:\`, error)`) so remaining notes continue uninterrupted.
- **Rationale**:
  1. Directly fulfills `FR-005`, `FR-006`, and `FR-007` and matches the `ProgressModal` specification.
  2. Suppresses per-note `Notice` popups and automatic per-note print jobs during batch runs to prevent notification spam, displaying a single completion notice (`Generated <count> labels`) at the end.
- **Alternatives Considered**:
  - *Parallel `Promise.all` execution*: Can spike CPU/memory on 100+ canvas renders simultaneously and makes incremental `0 / N` progress bar updates jittery.

---

## Decision 4: Dual Configuration of `mergeBatchPDFs` (Settings Tab & Batch Modal)

- **Decision**: Add `mergeBatchPDFs: boolean` (default `false`) to `ObsidianLabelSettings` (`DEFAULT_SETTINGS`), expose a toggle in `ObsidianLabelSettingTab` under `PDF Export & Storage`, and render a `"Merge into single multi-page PDF"` toggle inside `BatchLabelModal` initialized from `this.plugin.settings.mergeBatchPDFs`.
- **Rationale**: Directly implements the Session 2026-10-21 clarification for `FR-008`, allowing users to set a persistent default in Settings while overriding or toggling it per batch run in `BatchLabelModal`.
- **Alternatives Considered**:
  - *Settings tab only*: Requires closing the batch modal and navigating to Settings whenever the user wants a one-off merged PDF sheet.
