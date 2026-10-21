# Feature Specification: Batch Label Generator

**Feature Branch**: `010-batch-label-generator`  
**Created**: 2026-10-21  
**Status**: Draft  
**Input**: User description: "Add a batch label generator modal accessible from the command palette that lets users select multiple notes by folder, tag filter, or search query, shows a preview of how many and which notes will be generated, generates all labels with a live progress modal while continuing past individual note errors, and optionally merges all generated labels into a single multi-page PDF for efficient printing."

---

## Clarifications

### Session 2026-10-21

- Q: When selecting notes using "All notes in a folder", should the selection include notes in nested subfolders recursively or only direct child notes of that folder? → A: Include an "Include subfolders" toggle when Folder selection mode is active (defaulting to enabled).
- Q: Where should the option to merge batch labels into a single multi-page PDF (`mergeBatchPDFs`) be configurable by the user? → A: Both in the plugin Settings tab (as the saved default) and as a toggle in `BatchLabelModal` (initialized from `settings.mergeBatchPDFs`).
- Q: When `mergeBatchPDFs` is enabled, should the plugin retain the individual per-note label PDFs in addition to creating the consolidated `labels_batch_YYYY-MM-DD.pdf`, or only keep the merged PDF? → A: Keep both the individual per-note label PDFs and the merged `labels_batch_YYYY-MM-DD.pdf` file.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Criteria Note Selection & Batch Generation (Priority: P1)

When onboarding a new inventory, equipment collection, or physical archive, users need to generate labels for dozens or hundreds of notes at once rather than opening each note individually. By opening the Batch Label Generation dialog from the Command Palette, users can filter and select target notes by folder, tag, or search query, inspect a preview of the matched note count and list (up to 10 sample paths with a summary of remaining notes), and trigger batch label generation.

**Why this priority**: Selecting target notes and generating their labels in bulk is the foundational workflow that eliminates manual per-note effort.

**Independent Test**: Open the Batch Label Generation dialog from the Command Palette, test selecting notes by folder, by tag, and by search query, verify the preview count and list update accurately (and the "Generate Labels" button enables only when at least one note matches), and click "Generate Labels" to verify all selected notes receive label PDFs.

**Acceptance Scenarios**:

1. **Given** a vault with multiple folders containing Markdown notes, **When** the user opens "Batch Label Generation", selects "All notes in a folder", chooses a target folder, and toggles "Include subfolders" (enabled by default), **Then** the preview displays the count of matching notes (recursive when enabled, direct children only when disabled) and lists up to 10 note paths (plus `... and X more` if applicable), and the "Generate Labels" button becomes enabled.
2. **Given** notes tagged in frontmatter or inline (e.g., `#inventory` or `inventory`), **When** the user selects "All notes with a tag" and enters the tag name, **Then** the preview updates to show all notes matching that tag.
3. **Given** a user selecting "Search results" and typing a query string, **When** the query matches note titles, paths, or content, **Then** the preview updates with the matching notes; if zero notes match, the preview displays "No notes selected" and "Generate Labels" remains disabled.
4. **Given** a valid selection of notes in the Batch Label Generation dialog, **When** the user clicks "Generate Labels", **Then** a label PDF is generated for every selected note and a completion notice displays the total number of generated labels.

---

### User Story 2 - Live Progress Feedback & Fault-Tolerant Execution (Priority: P2)

When generating labels for a large batch of notes, users need visual feedback showing that the operation is progressing and assurance that a single corrupted or misconfigured note will not abort the entire batch run. During batch generation, a dedicated progress dialog displays the current completion count (`X / Total`) and an advancing progress bar, while logging and skipping any individual note failures so all other notes complete normally.

**Why this priority**: Large batches take several seconds; without progress feedback and fault tolerance, users cannot tell if the application has frozen or why a batch stopped partway through.

**Independent Test**: Trigger batch generation across multiple notes where one note simulatedly fails export, verify the progress dialog updates from `0 / N` to `N / N` with matching percentage width, verify the remaining `N - 1` labels are generated, and verify the final notice reports the successful count.

**Acceptance Scenarios**:

1. **Given** a batch of `N` selected notes, **When** batch generation starts, **Then** a progress modal opens showing `0 / N` and a `0%` progress bar, updating after each note (`current / N` and `(current / N) * 100%`) and closing automatically upon completion.
2. **Given** a batch of 5 notes where the 2nd note encounters a generation error, **When** batch generation runs, **Then** the error is logged with the note's path, the remaining 4 notes still generate labels, and the final notice reports `Generated 4 labels`.

---

### User Story 3 - Optional Multi-Page Merged PDF Output (Priority: P3)

Printing dozens of individual single-page PDF files one by one through a system print dialog is slow and cumbersome. When the user enables the option to merge batch PDFs into a single file, the system combines all generated label pages from the batch run into a single multi-page PDF document (`labels_batch_YYYY-MM-DD.pdf`) so the user can print the entire batch in one print job.

**Why this priority**: Merging batch labels into a single multi-page PDF streamlines physical printing for users who do not use automated CLI print scripts or who prefer reviewing a single consolidated print sheet/roll document.

**Independent Test**: Enable `mergeBatchPDFs`, run a batch label generation for 3 notes, and verify that a consolidated 3-page PDF file (`labels_batch_YYYY-MM-DD.pdf`) is saved in the vault and announced via a notice.

**Acceptance Scenarios**:

1. **Given** `mergeBatchPDFs` is enabled and a batch of `K` labels is generated, **When** the individual labels finish generating, **Then** all `K` individual per-note PDFs are retained AND a consolidated multi-page PDF containing all `K` label pages is created as `labels_batch_YYYY-MM-DD.pdf` with a notice confirming `Merged PDF created: <outputPath>`.
2. **Given** `mergeBatchPDFs` is disabled (default), **When** batch generation completes, **Then** only the individual label PDFs are saved and no merged PDF file is created.

---

### Edge Cases

- **Empty Selection**: When a folder is empty, a tag matches no notes, or a search query is blank/unmatched, the preview displays `No notes selected` and the `Generate Labels` button is disabled to prevent zero-item batch runs.
- **Excluded System & Template Folders**: Notes inside hidden directories (starting with `.`) or template directories (`templates/`, `_templates/`) are excluded from batch selection so template stubs are not accidentally labeled.
- **Tag Input Normalization**: Users may type a tag with or without a leading `#` (e.g., `#electronics` or `electronics`); both forms match notes containing that tag in YAML frontmatter `tags` or inline `#tags`.
- **Mixed Label Dimensions in Merged PDF**: Notes in a batch may use different per-note templates or sizes via frontmatter; each page in the merged multi-page PDF preserves its own individual physical page dimensions and orientation.
- **Auto-Print Suppression During Batch Runs**: During batch generation, per-note notices and individual auto-print triggers are suppressed unless explicitly confirmed, preventing notification spam and accidental printer queue flooding.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST register a Command Palette command (`Batch Generate Labels` / `Batch Label Generation`) that opens the `BatchLabelModal`.
- **FR-002**: `BatchLabelModal` MUST allow users to select notes using three selection methods:
  1. **Folder** (`folder`): Select a vault folder (including root `/` or any subfolder) to match markdown notes within that folder, accompanied by an "Include subfolders" toggle (enabled by default) to switch between recursive matching and direct-children-only matching.
  2. **Tag** (`tag`): Enter or select a tag (matching with or without leading `#` across both frontmatter `tags` and inline tags).
  3. **Search** (`search`): Enter a search query matching note paths, titles, or note content.
- **FR-003**: `BatchLabelModal` MUST display a live preview section showing:
  - `"No notes selected"` when 0 notes match.
  - `"<N> labels will be generated"` along with a list of up to 10 matching note paths (`note.path`) and `"... and <N - 10> more"` when more than 10 notes match.
- **FR-004**: The `Generate Labels` button in `BatchLabelModal` MUST be disabled when 0 notes are selected and enabled when 1 or more notes are selected.
- **FR-005**: When batch generation is triggered, the system MUST open a `ProgressModal` displaying a status counter (`0 / <total>` updating to `<current> / <total>`) and a visual progress bar updating from `0%` to `100%`, closing automatically when the batch finishes.
- **FR-006**: Batch generation MUST process each selected note sequentially, catching and logging any error on an individual note (`Failed to generate label for <path>`) without halting the rest of the batch.
- **FR-007**: Upon completing the batch, the system MUST display a notice stating `Generated <count> labels` (where `<count>` is the number of successfully generated labels) and close the `BatchLabelModal`.
- **FR-008**: System MUST support a boolean `mergeBatchPDFs` setting in both the plugin Settings tab (as the saved default) and as a toggle inside `BatchLabelModal` (initialized from `settings.mergeBatchPDFs`) that, when enabled, retains each note's individual label PDF and also merges all generated labels from the batch into a single multi-page PDF file named `labels_batch_YYYY-MM-DD.pdf`, displaying a notice `Merged PDF created: <outputPath>`.

### Key Entities

- **Batch Selection Criteria**: The active selection mode (`'folder' | 'tag' | 'search'`) and its query value (folder path, normalized tag string, or search text) used to filter vault markdown notes.
- **Batch Progress State**: Tracks `total` selected notes, `current` processed count, percentage completion (`0–100`), and collected output PDF paths/pages.
- **Merged Batch PDF**: A consolidated multi-page PDF document combining all successfully generated labels from a single batch run, named `labels_batch_YYYY-MM-DD.pdf`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can select and initiate label generation for 50+ notes in under 15 seconds using folder, tag, or search filtering compared to generating each note one by one.
- **SC-002**: 100% of valid notes in a selected batch have their labels generated even if 1 or more sibling notes in the same batch fail during rendering or export.
- **SC-003**: When multi-page PDF merging is enabled for a batch of `N` notes, the resulting `labels_batch_YYYY-MM-DD.pdf` contains exactly `N` pages matching each note's rendered label.
- **SC-004**: Progress indicator updates accurately after every processed note from `0 / N` (`0%`) to `N / N` (`100%`) without freezing the user interface.

---

## Assumptions

- Folder selection includes an "Include subfolders" toggle (defaulting to `true`) and always excludes hidden `.` directories and `templates`/`_templates` folders consistent with existing batch processor rules.
- Tag matching inspects Obsidian's `metadataCache` (both `frontmatter.tags` / `frontmatter.tag` and cached inline `tags`).
- Search query matching checks note paths/titles synchronously and note body content when available via vault read/cached read.
- Multi-page PDF generation runs 100% locally in-plugin without any external cloud service.
