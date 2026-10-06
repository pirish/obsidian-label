# Feature Specification: Command Palette Label Actions & Batch Generation

**Feature Branch**: `005-command-palette-actions`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Users need a quick way to generate labels for the current note without leaving the keyboard. Obsidian's Command Palette is the standard UX for this. Register commands for: 1. Generate label for current note, 2. Generate label with custom settings, 3. Regenerate all labels in vault (batch operation)"

## Clarifications

### Session 2026-10-06

- Q: Should the "Regenerate All Labels in Vault" command require an explicit confirmation modal before batch generating PDFs for all notes in the vault? → A: Option A (Confirmation modal displaying total note count with Confirm/Cancel buttons before processing).
- Q: Should custom settings configured in the "Generate Label with Custom Settings..." dialog apply only as an ephemeral one-off generation, or be saved to the note's frontmatter? → A: Option B (Optional checkbox in modal ("Save as note default") that writes overrides into note frontmatter).
- Q: Which notes in the vault should be included when executing "Regenerate All Labels in Vault"? → A: Option B (Only notes with existing label PDFs that were previously generated in the output directory).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Label Generation for Active Note (Priority: P1) 🎯 MVP

As an Obsidian user editing a note for an asset or piece of equipment, I want to trigger a single keyboard-friendly command ("Generate Label for Current Note") from the Command Palette, so that a print-ready PDF label is instantly generated and saved to my configured vault location without opening settings or running scripts.

**Why this priority**: Fast keyboard-driven invocation for the current note is the primary daily workflow for physical labeling in Obsidian.

**Independent Test**: Open any markdown note, press the Command Palette shortcut (`Cmd/Ctrl+P`), run "Generate Label for Current Note", and verify that a PDF label is generated in the configured output directory with an informative completion notification.

**Acceptance Scenarios**:

1. **Given** an active markdown note is open in the editor pane, **When** the user searches for and executes "Obsidian Label: Generate Label for Current Note" in the Command Palette, **Then** the system generates a PDF label using active plugin settings, saves it to the configured vault location, and presents a success notice displaying the relative path of the created file.
2. **Given** no active file is open in the workspace (or a non-markdown view is focused), **When** the user opens the Command Palette, **Then** the "Generate Label for Current Note" command is disabled or unavailable.
3. **Given** a note with special characters or nested vault folders, **When** the label generation command runs, **Then** the label correctly encodes the note's Obsidian URI and saves the PDF without path corruption.
4. **Given** an unexpected failure during canvas rendering or PDF creation (e.g. invalid permissions or file system error), **When** the command executes, **Then** an error notification is displayed detailing the failure without crashing the plugin.

---

### User Story 2 - Per-Note Custom Label Generation Dialog (Priority: P2)

As a user labeling an unusual item that does not match my default label size or layout, I want to trigger "Generate Label with Custom Settings..." to open a modal dialog where I can override settings for this note before generating, so that I don't have to change my global plugin settings for a single one-off label.

**Why this priority**: Users frequently have secondary label stock (e.g., small cable tags or square inventory badges) and require immediate flexibility on a per-note basis.

**Independent Test**: Open an active note, trigger "Generate Label with Custom Settings...", change the label size preset and QR placement in the dialog, click "Generate Label", and verify that the resulting PDF reflects the custom selections while global settings remain unchanged.

**Acceptance Scenarios**:

1. **Given** an active markdown note, **When** the user runs "Obsidian Label: Generate Label with Custom Settings...", **Then** an interactive modal dialog opens pre-populated with current settings defaults.
2. **Given** the custom label modal, **When** the user selects overrides (such as label size preset or QR code placement) and clicks "Generate Label", **Then** a label is produced using those overrides and saved to the vault, the modal closes, and a success notification is shown.
3. **Given** the custom label modal, **When** the user closes the modal without submitting (via Esc or Cancel), **Then** no label is generated and global settings remain untouched.
4. **Given** custom label generation overrides, **When** the user checks an optional "Save as note default" toggle in the dialog, **Then** the overrides are written into the note's YAML frontmatter (e.g. `label_size`, `qr_placement`) so subsequent generations default to those settings; if unchecked, the overrides apply strictly to the immediate generation.

---

### User Story 3 - Vault-Wide Batch Label Regeneration (Priority: P3)

As a collection manager whose vault layout or default label template has changed, I want to trigger a batch command to regenerate labels for all markdown notes in my vault, so that my entire physical collection's labels stay up to date without manual note-by-note execution.

**Why this priority**: Enables rapid onboarding, template upgrades, or recovery across hundreds of notes in a single operation.

**Independent Test**: Run "Obsidian Label: Regenerate All Labels in Vault", observe execution progress, and verify all markdown notes outside excluded directories receive freshly generated PDF labels.

**Acceptance Scenarios**:

1. **Given** a vault with multiple markdown notes, **When** the user triggers "Obsidian Label: Regenerate All Labels in Vault", **Then** an explicit confirmation modal dialog appears displaying the count of notes to process and warning that existing labels may be overwritten, and batch processing begins only after the user confirms.
2. **Given** batch regeneration in progress, **When** processing markdown notes, **Then** notes located in excluded folders (such as `.trash`, templates, or hidden directories) are automatically skipped.
3. **Given** completed batch regeneration, **When** the process finishes, **Then** a summary notification appears indicating the total number of labels successfully generated and any skipped/failed items.
4. **Given** batch regeneration scope, **When** scanning files, **Then** the system targets only notes that already have a corresponding label PDF generated in the output location, skipping notes that have not yet had labels generated.

---

### Edge Cases

- **No Active File**: Both "Generate Label for Current Note" and "Generate Label with Custom Settings..." must be conditionally enabled only when an active markdown note exists (`checkCallback`).
- **Batch Processing on Large Vaults**: Batch generation across hundreds of files must not freeze the Obsidian UI thread; progress notifications or batching must handle large volume cleanly.
- **Excluded and System Files**: Files in `.trash`, `.obsidian`, template directories, or non-markdown assets must never be processed as notes during batch runs.
- **Canvas / Export Errors**: Individual note failure during batch regeneration must be caught, logged, and included in the summary count without aborting the remainder of the batch.
- **Concurrent Invocations**: Triggering a generation command while a previous generation is active should queue or safely execute without file lock conflicts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST register an Obsidian command titled "Obsidian Label: Generate Label for Current Note" with id `generate-label-current-note`.
- **FR-002**: System MUST use a conditional callback (`checkCallback`) to ensure "Generate Label for Current Note" is enabled only when an active markdown file is currently open in the workspace.
- **FR-003**: System MUST generate a PDF label using active plugin configuration when "Generate Label for Current Note" is executed, storing it in the user's configured output folder.
- **FR-004**: System MUST display an Obsidian `Notice` indicating successful generation along with the relative path of the created PDF file.
- **FR-005**: System MUST register an Obsidian command titled "Obsidian Label: Generate Label with Custom Settings..." with id `generate-label-custom`, enabled only when an active markdown file is open.
- **FR-006**: System MUST present a dedicated `CustomLabelModal` dialog when "Generate Label with Custom Settings..." is invoked, allowing the user to override label size, custom dimensions, and QR code placement, with an optional toggle to save overrides to note frontmatter.
- **FR-007**: System MUST generate the label using the specified overrides upon confirmation in `CustomLabelModal` and dismiss the dialog cleanly.
- **FR-008**: System MUST register an Obsidian command titled "Obsidian Label: Regenerate All Labels in Vault" with id `regenerate-all-labels`.
- **FR-009**: System MUST discover notes that have an existing label PDF in the configured output location, regenerating only those files while skipping unlabelled notes and excluded folders (`.trash`, `.obsidian`).
- **FR-010**: System MUST display a confirmation modal dialog before starting batch regeneration showing the count of notes to process, and display a completion `Notice` summarizing the total count of successfully regenerated labels.
- **FR-011**: System MUST handle rendering or file system write errors gracefully by alerting the user with descriptive notices rather than failing silently.
- **FR-012**: System MUST execute 100% offline within the local Obsidian environment without network requests or external dependencies.

### Key Entities

- **LabelCommandContext**: Encapsulates the active target note (`TFile`), active vault settings, and optional per-note overrides.
- **CustomLabelOverride**: A data structure holding temporary per-note configuration overrides (label preset, custom dimensions, QR placement) specified in the modal.
- **BatchGenerationSummary**: Summary metrics representing the results of a batch regeneration pass (total notes scanned, generated count, skipped count, failure count).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate a print-ready label for the active note from the Command Palette in under 1 second without opening settings or using the mouse.
- **SC-002**: 100% of command palette invocations with no active note are cleanly disabled or rejected without runtime errors.
- **SC-003**: Custom label overrides accurately reflect in the generated PDF on 100% of custom dialog submissions without mutating global plugin settings.
- **SC-004**: Batch regeneration processes notes at a sustained throughput of at least 5 labels per second without causing application UI lockups.
- **SC-005**: 100% of batch exclusions (`.trash`, hidden directories) are honored with zero unwanted files created.

## Assumptions

- Target environment is Obsidian Desktop running community plugins with workspace active note APIs.
- Default output directory routing follows active plugin settings configured in `ObsidianLabelSettings`.
- Global settings remain unaffected when per-note overrides are applied during one-off generation.
- Standard Markdown files (`.md`) are the only file types eligible for label generation.
