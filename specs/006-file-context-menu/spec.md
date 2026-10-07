# Feature Specification: File Explorer Context Menu Label Action

**Feature Branch**: `006-file-context-menu`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Users browsing the file explorer should be able to right-click any note and generate its label, without opening it first. Register a file context menu item that triggers label generation for the selected file."

## Clarifications

### Session 2026-10-06

- Q: Should the right-click file context menu include an additional "Generate Label with Custom Settings..." item alongside "Generate Label"? → A: Option A (Single "Generate Label" item only; minimalist and fast execution using active/frontmatter settings).
- Q: If a label PDF already exists for the selected note, should clicking "Generate Label" in the context menu overwrite it directly or prompt for confirmation? → A: Option A (Overwrite directly without prompt, consistent with single-note Command Palette behavior).
- Q: Should right-clicking on multiple selected files in the file explorer support batch label generation, or is this feature strictly limited to right-clicking a single note? → A: Option B (Support both single file via `file-menu` and multi-file selection via `files-menu`, generating labels for all selected `.md` notes).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Label Generation via File Context Menu (Priority: P1) 🎯 MVP

As an Obsidian user browsing files in the file explorer navigation tree, I want to right-click on any Markdown note and select "Generate Label" from the context menu, so that a print-ready PDF label is generated instantly for that note without having to open it in an editor pane first.

**Why this priority**: Right-clicking in the file explorer is the primary mouse-driven paradigm in desktop Obsidian for interacting with files without switching active workspace tabs.

**Independent Test**: Right-click any markdown file in the file explorer, verify that "Generate Label" appears with a tag icon, click the item, and verify that a PDF label is generated in the configured vault directory with an informative completion notification.

**Acceptance Scenarios**:

1. **Given** a user right-clicks on a markdown note (`.md`) in the file explorer, **When** the context menu opens, **Then** an action titled "Generate Label" with a tag icon is displayed in the menu.
2. **Given** the "Generate Label" context menu item is clicked, **When** the action runs, **Then** a PDF label is generated for that specific note using active settings (and any per-note frontmatter defaults), directly overwriting any pre-existing label PDF without prompting, saved to the configured output path, and an Obsidian `Notice` is displayed with the relative file path.
3. **Given** a user right-clicks on a non-markdown file (such as a PNG image, canvas, or PDF) or a folder, **When** the context menu opens, **Then** the "Generate Label" option is omitted.
4. **Given** an unexpected rendering or file writing failure during context menu label generation, **When** the command executes, **Then** an error notification is displayed detailing the failure without crashing the plugin.

---

### User Story 2 - Context Menu Availability Across Workspace File Navigation Views (Priority: P2)

As a user organizing vault content across different workspace panes (such as file explorer sidebar, bookmarks list, or search result listings), I want the "Generate Label" context menu action to be available consistently wherever files can be right-clicked in Obsidian.

**Why this priority**: Users navigate notes through varied navigation surfaces; ensuring the menu item hooks into native file menu events provides a uniform experience across all file-listing views.

**Independent Test**: Open various file navigation views in Obsidian, right-click a markdown note, and verify "Generate Label" is present and functional across all surfaces.

**Acceptance Scenarios**:

1. **Given** a markdown file right-clicked in any native Obsidian view that emits a file context menu, **When** the menu opens, **Then** "Generate Label" appears and is clickable.
2. **Given** a note selected via right-click while a different note is currently active in the editor pane, **When** "Generate Label" is clicked, **Then** the label is generated strictly for the right-clicked note and not the editor's active note.

---

### User Story 3 - Multi-File Context Menu Batch Generation (Priority: P3)

As an inventory or collection manager organizing groups of items in the file explorer, I want to select multiple Markdown files, right-click, and select "Generate Labels", so that labels are generated for all selected notes in a single batch operation without manual note-by-note execution.

**Why this priority**: Enhances multi-item productivity by allowing users to label entire batches of files directly from the explorer tree.

**Independent Test**: Multi-select 3 markdown notes in the file explorer, right-click, select "Generate Labels", and verify that all 3 notes have PDF labels generated with a summary completion notice.

**Acceptance Scenarios**:

1. **Given** multiple files selected in the file explorer where at least one is a Markdown file, **When** the user right-clicks the selection, **Then** an action titled "Generate Labels" with a tag icon is displayed in the menu.
2. **Given** the "Generate Labels" item is clicked on a multi-file selection, **When** the action runs, **Then** the system iterates through each selected Markdown file, generates its PDF label (overwriting existing labels without prompting), skips any selected non-markdown files/folders, and displays a summary notice (e.g. "Generated 3 labels").
3. **Given** a multi-file selection containing zero Markdown files (e.g. only folders or images), **When** the user right-clicks, **Then** the "Generate Labels" action is omitted.

---

### Edge Cases

- **Right-clicking Folders**: The context menu MUST NOT display "Generate Label" when a directory or folder is right-clicked.
- **Non-Markdown Assets**: Files with extensions other than `.md` (e.g. `.png`, `.canvas`, `.pdf`, `.json`) MUST NOT display "Generate Label".
- **Target Note Unfocused**: The action MUST generate the label for the right-clicked target note without opening or switching editor focus to that note.
- **Mixed Multi-Selection**: In multi-file selections containing both Markdown notes and other assets/folders, only Markdown notes are processed; non-markdown files are silently ignored.
- **Special Characters in Filename**: Notes with spaces, emojis, or punctuation in their filename must generate valid Obsidian URIs and PDF paths without encoding corruption.
- **Concurrent Invocations**: Triggering multiple file menu generations in rapid succession must process each file safely without file locking errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST register an event listener for Obsidian's native `file-menu` workspace event during plugin startup.
- **FR-002**: System MUST add a context menu item titled "Generate Label" with the standard Obsidian icon `tag`.
- **FR-003**: System MUST verify that the target file is a Markdown file (`.md`) before adding the single-file menu item, ensuring it is never displayed for folders or non-markdown assets.
- **FR-004**: System MUST trigger label generation strictly for the selected file when the menu item is clicked, independent of which note is currently active in the workspace editor.
- **FR-005**: System MUST resolve settings using the established hierarchy (per-note YAML frontmatter overrides > vault global defaults) when generating labels from the context menu.
- **FR-006**: System MUST display an Obsidian `Notice` on successful single-note generation showing the relative path of the created PDF label file.
- **FR-007**: System MUST handle canvas rendering or file writing errors gracefully by alerting the user with an error `Notice` rather than failing silently.
- **FR-008**: System MUST execute all context menu operations 100% offline within the local Obsidian environment without network requests or external dependencies.
- **FR-009**: System MUST register an event listener for Obsidian's native `files-menu` workspace event for multi-file selections during plugin startup.
- **FR-010**: System MUST add a context menu item titled "Generate Labels" with icon `tag` when at least one selected item is a Markdown file (`.md`).
- **FR-011**: When "Generate Labels" is selected from `files-menu`, system MUST iterate through all selected Markdown files, generate each label using active settings (overwriting existing labels without prompting), and display a completion `Notice` summarizing the total count of successfully generated labels.

### Key Entities

- **TargetNoteFile**: The specific Markdown file (`TFile`) selected and passed via the native file context menu event.
- **FileMenuItem**: The menu item component registered onto Obsidian's `Menu` with title, icon, and click handler.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger label generation for any vault note directly from the file explorer in under 1 second without opening the note first.
- **SC-002**: 100% of non-markdown files and folders right-clicked in Obsidian omit the "Generate Label" menu item.
- **SC-003**: 100% of context menu invocations generate a label for the right-clicked file rather than the currently focused editor note.
- **SC-004**: 100% of context menu label generation operations run offline with zero external network connectivity.
- **SC-005**: 100% of multi-file selections filter out non-markdown items and process all selected notes with a clear summary count.

## Assumptions

- Target environment is Obsidian Desktop running community plugins supporting the `workspace.on('file-menu', ...)` and `workspace.on('files-menu', ...)` events.
- Output directory routing follows the user's active settings configured in `ObsidianLabelSettings`.
- Right-clicking a note does not alter the active file in the editor workspace.
- Standard Markdown files (`.md`) are the only file types eligible for physical note labels.
