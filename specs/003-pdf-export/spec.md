# Feature Specification: PDF Export for Physical Label Printing

**Feature Branch**: `003-pdf-export`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "PDF Export: Labels must be exported as PDF files that can be sent to label printers. PDFs are universal, high-quality, and supported by all printer software. Use jsPDF library to create PDFs from the Canvas element. Save to vault with configurable location and naming convention."

## Clarifications

### Session 2026-10-04

- Q: Should the generated PDF filename include the date timestamp (YYYY-MM-DD) by default, or default to a static filename ([NoteName]_label.pdf) that cleanly overwrites on regeneration? → A: Option A (Static filename [NoteName]_label.pdf by default, with an optional setting/toggle to append date timestamp [NoteName]_label_YYYY-MM-DD.pdf)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exact-Dimension Print-Ready PDF Generation (Priority: P1) 🎯 MVP

As an Obsidian user printing physical labels, I want the system to export my generated label as a PDF whose page dimensions exactly match the physical label stock (in millimeters), so that I can send the file directly to my label printer or standard print dialog with 100% scaling and no clipping or misaligned margins.

**Why this priority**: Delivering print-ready, dimensionally accurate PDFs is the fundamental bridge between on-screen label design and physical media printing. Without exact 1:1 page dimensions and print resolution, physical labels will not print accurately.

**Independent Test**: Generate a label with dimensions 40mm x 30mm, export to PDF, open in a PDF viewer, and verify the document page properties report exactly 40.0mm by 30.0mm and render crisp graphics at 300+ DPI.

**Acceptance Scenarios**:

1. **Given** a label configured with 40mm width and 30mm height, **When** PDF export is triggered, **Then** the generated PDF has a page size of exactly 40mm by 30mm in landscape orientation.
2. **Given** a label configured with 30mm width and 50mm height, **When** PDF export is triggered, **Then** the generated PDF has a page size of exactly 30mm by 50mm in portrait orientation.
3. **Given** a rendered label canvas, **When** exported to PDF, **Then** the canvas raster image fills the entire PDF page from edge to edge (0,0 offset) without default document margins.

---

### User Story 2 - Configurable Vault Storage Locations (Priority: P2)

As a user with an organized vault structure, I want to configure where exported label PDFs are stored—either alongside the source note, in a dedicated central labels directory (e.g. `_labels/`), or in a custom vault folder—so that my files stay neat and organized according to my personal vault conventions.

**Why this priority**: Users have distinct organizational strategies; some prefer keeping asset labels adjacent to documentation, while others prefer aggregating all printable assets into a single directory for bulk printing.

**Independent Test**: Configure the storage setting to each of the three modes (same folder, dedicated `_labels/`, custom path) and export a label; verify the PDF file is saved to the expected vault folder in each case.

**Acceptance Scenarios**:

1. **Given** the storage location setting is set to "Same folder as note" and the note is at `Technology/Projects/MyNote.md`, **When** the label PDF is exported, **Then** the PDF is saved to `Technology/Projects/MyNote_label.pdf`.
2. **Given** the storage location setting is set to "Dedicated labels folder (`_labels/`)", **When** a label PDF is exported for any note, **Then** the file is placed in `_labels/` at the root of the vault.
3. **Given** the storage location setting specifies a custom path `PrintQueue/Pending/`, **When** a label PDF is exported, **Then** the PDF is placed into `PrintQueue/Pending/`.
4. **Given** a destination folder that does not yet exist in the vault, **When** export occurs, **Then** the system automatically creates the folder structure before writing the PDF.

---

### User Story 3 - Flexible File Naming & Label Regeneration (Priority: P3)

As an asset manager updating note details or reprinting damaged labels, I want filenames to reflect the note title with an optional date stamp, and I want regenerating a label to overwrite previous versions cleanly so that I never clutter my vault with stale duplicate files.

**Why this priority**: Preventing file clutter and providing predictable naming ensures reference integrity and seamless reprinting when notes are updated.

**Independent Test**: Export a label PDF, verify the naming pattern with and without timestamp, update the note title or design, re-export, and verify the existing PDF is cleanly overwritten without file locks or errors.

**Acceptance Scenarios**:

1. **Given** a note named `MyNote.md` and timestamp disabled, **When** exported, **Then** the filename is formatted as `MyNote_label.pdf`.
2. **Given** timestamp enabled and current date `2026-10-04`, **When** exported, **Then** the filename is formatted as `MyNote_label_2026-10-04.pdf`.
3. **Given** an existing label PDF with the same target filename, **When** a regeneration is triggered, **Then** the existing file is replaced with the newly rendered PDF without errors.

---

### Edge Cases

- **Root-Level Notes**: For notes located directly in the vault root (no parent folder), saving in "same folder as note" MUST place the PDF in the vault root without leading slash path errors.
- **Deeply Nested Note Paths**: Notes nested across multiple directory tiers MUST have their directory paths resolved accurately without truncation.
- **Non-Existent Target Directories**: If the user configures a custom path or the dedicated `_labels/` folder does not exist, the system MUST recursively create all missing parent directories prior to writing the file.
- **Special Characters in Note Names**: Note names containing spaces, punctuation, or non-ASCII characters MUST generate valid file system names without throwing file I/O exceptions.
- **Completely Offline Environments**: All PDF creation, image embedding, and file writing operations MUST execute 100% locally within the vault with zero network calls.
- **File System Overwrite Conflicts**: When overwriting an existing PDF file that is currently open in an external previewer, the system MUST handle potential write errors gracefully and report a clear diagnostic message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate standard PDF documents whose page dimensions exactly match the configured physical label dimensions in millimeters (`width` and `height`).
- **FR-002**: System MUST render PDF documents at a minimum print resolution of 300 DPI matching the source label rendering canvas.
- **FR-003**: System MUST automatically configure PDF page orientation based on physical dimensions (landscape when `width > height`, portrait otherwise).
- **FR-004**: System MUST export the label raster graphics with 0 margin offset, filling 100% of the PDF page surface for direct 1:1 hardware printing.
- **FR-005**: System MUST support saving exported PDFs to the same vault directory as the source note by default.
- **FR-006**: System MUST support user-configurable storage location options: (1) Same folder as note, (2) Dedicated `_labels/` folder in vault root, and (3) Custom vault folder path.
- **FR-007**: System MUST automatically construct destination file paths, creating any missing intermediate folders within the vault before saving.
- **FR-008**: System MUST generate standardized label filenames defaulting to `[NoteName]_label.pdf` to ensure clean in-place overwriting upon regeneration, and support an optional setting/toggle to append a date timestamp (`[NoteName]_label_YYYY-MM-DD.pdf`).
- **FR-009**: System MUST allow overwriting existing label PDF files upon regeneration to prevent duplicate file accumulation.
- **FR-010**: System MUST execute all PDF generation and vault file storage operations 100% locally with zero external network connectivity or telemetry.

### Key Entities

- **Label PDF Document**: A binary PDF document consisting of a single page sized to exact physical label dimensions containing the rendered label raster graphic.
- **Storage Location Strategy**: The operational configuration defining where exported PDFs are written within the vault (`same-folder`, `dedicated-folder`, `custom-folder`).
- **Export Naming Configuration**: The rule set governing output filename construction, including note base name extraction, label suffix, and date timestamp inclusion.
- **Vault File Destination**: The resolved absolute and vault-relative target path where the PDF binary blob is persisted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of exported PDF documents match the configured label dimensions (width and height in millimeters) within ±0.1mm when inspected in standard PDF viewers or printed at 100% scale.
- **SC-002**: Exported PDF documents render cleanly at 300 DPI without raster pixelation or blurriness under 10x optical magnification.
- **SC-003**: PDF generation and file writing completes in under 250 milliseconds on standard desktop hardware for any supported label preset.
- **SC-004**: 100% of PDF export operations run fully offline with zero external network dependencies or telemetry.
- **SC-005**: Regenerating an existing label PDF replaces the target file in the vault with 0% data corruption and 0 orphaned locks.

## Assumptions

- The user's Obsidian vault has write permissions in the target directories.
- The label printer driver or operating system print dialog supports standard PDF printing at 100% (actual size) scaling.
- Note filenames follow standard Obsidian naming conventions with UTF-8 character encoding.
- The `jsPDF` pure-JavaScript library runs within Obsidian's Electron/Node.js desktop environment.
