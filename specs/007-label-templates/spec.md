# Feature Specification: Label Templates & Custom Template System

**Feature Branch**: `007-label-templates`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Different use cases need different label designs: inventory labels emphasize metadata, collection labels prioritize titles, equipment labels include dates and IDs. A template system allows users to save and reuse label layouts. Define a template schema that bundles layout, style, and content rules. Ship with 3 built-in templates, allow users to create custom templates."

## Clarifications

### Session 2026-10-07

- Q: Should notes be able to specify a template in YAML frontmatter (e.g. `template: inventory` or `label_template: inventory`) to override the vault-wide default template, and how does it interact with existing frontmatter overrides? → A: Option A (Support `template: <id>` frontmatter override with fallback to vault default; granular note frontmatter overrides like `qr_placement` or `label_size` continue to apply on top of the resolved template).
- Q: How should the custom template editor modal be presented to the user when creating or editing a template in the Template Manager? → A: Option A (Interactive form modal with structured input controls for metadata, dimensions, layout placement, typography/colors, and content rule toggles/fields).
- Q: How should the 3 built-in templates be handled when users want to customize them? → A: Option A (Built-in templates are immutable with a "Duplicate as Custom" action in the Template Manager allowing users to easily fork and customize them).
- Q: Should the "Generate Label (Custom)..." dialog include a template selector allowing users to choose an alternative template for a one-off note generation? → A: Option A (Include a "Template" dropdown at the top of CustomLabelModal allowing instant template selection for that note).
- Q: How should the system format frontmatter properties that contain array or list values when rendering custom fields on a physical label? → A: Option A (Join array items as a comma-separated string, e.g., Category: sensor, lab).
- Q: How should the layout renderer handle situations where the enabled content fields exceed the available printable height of the label? → A: Option A (Render fields sequentially in priority order and omit any remaining fields that would exceed the printable height margin, preserving typography and preventing boundary clipping).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Built-in Templates & Template-Driven Label Generation (Priority: P1) 🎯 MVP

As an Obsidian user generating physical labels for notes across different domains (e.g. inventory, compact items, general notes), I want to choose from predefined built-in label templates that automatically configure dimensions, layout positioning, visual styling, and content fields, so that I can generate tailored, scannable labels instantly without manual per-label adjustments.

**Why this priority**: Core value of the template system. Even without creating custom templates, shipping 3 well-designed built-in templates immediately solves diverse physical labeling needs (standard items, tight-space compact objects, and metadata-rich inventory cataloging).

**Independent Test**: Select each built-in template ("Standard", "Compact", "Inventory") in plugin settings, generate labels for a sample note with frontmatter metadata, and verify that the output PDF reflects the expected dimensions, QR code placement, typography, and content fields (including note title, file path, creation date, and custom frontmatter metadata).

**Acceptance Scenarios**:

1. **Given** a user opens the plugin settings tab, **When** they view the "Default Template" setting, **Then** a dropdown displays the 3 built-in templates: "Standard", "Compact", and "Inventory".
2. **Given** the "Standard" template is selected, **When** a label is generated for a note, **Then** the label is sized to standard dimensions (89x28 mm), places the QR code on the left (25 mm), renders the note title and relative path on the right, and truncates titles exceeding 40 characters.
3. **Given** the "Compact" template is selected, **When** a label is generated for a note, **Then** the label is sized to a square tag (30x30 mm), centers a prominent QR code, hides title and path text, and produces a minimal scan-focused tag.
4. **Given** the "Inventory" template is selected, **When** a label is generated for a note with frontmatter metadata (`category`, `location`, `serial`, `value`), **Then** the label is sized to 100x50 mm, places the QR code on the right, renders title, creation date, and each existing custom frontmatter property as labelled key-value lines.
5. **Given** a note specifies a template override in its YAML frontmatter (e.g. `template: inventory` or `label_template: inventory`), **When** a label is generated for that note, **Then** the system resolves and applies that specific template over the vault default, while still allowing any explicit granular frontmatter overrides (e.g. `qr_placement`) to take top priority.

---

### User Story 2 - Custom Template Creation & Management (Priority: P2)

As a power user with specialized label stock or distinct cataloging requirements, I want to create, configure, and edit custom label templates through a dedicated template manager, so that I can save repeatable label designs matching my specific physical printers, dimensions, and metadata layouts.

**Why this priority**: Users possess diverse label printers (Brother, Dymo, Phomemo, Zebra) and varied organizational structures. Allowing custom template definitions enables infinite flexibility while preserving the simplicity of reusable presets.

**Independent Test**: Open the Template Manager from the settings tab, click "Create New Template", define custom dimensions, positioning, colors, and content rules, save the template, select it as the default template, and verify that generated labels adopt the new custom rules.

**Acceptance Scenarios**:

1. **Given** a user views the settings tab, **When** they click "Manage Templates", **Then** a modal opens displaying a list of all custom templates and an action button to "Create New Template".
2. **Given** a user clicks "Create New Template", **When** the template editor opens, **Then** an interactive form modal is presented with structured input controls for template metadata (name, description), dimensions (width, height), layout options (QR placement, size, margins, alignment), visual styles (fonts, colors, borders), and content rule toggles (title, path, dates, custom frontmatter field list, title max length).
3. **Given** a user defines a valid custom template (e.g., custom width, height, QR placement, font size, border, and frontmatter keys) and saves it, **When** the template is saved, **Then** it persists in plugin settings, appears in the Default Template dropdown marked as "(custom)", and becomes immediately selectable.
4. **Given** an existing custom template, **When** the user clicks "Edit" in the Template Manager, **Then** the template editor opens pre-populated with the template's current values, and saving updates the template without changing its unique identifier.
5. **Given** an invalid configuration in the template editor (e.g., negative dimensions, missing name, or margins exceeding label bounds), **When** the user attempts to save, **Then** the system highlights the validation errors and blocks saving.

---

### User Story 3 - Custom Template Lifecycle & Safety (Priority: P3)

As a user maintaining a library of templates, I want to safely delete or duplicate templates without risking corruption of default settings or loss of built-in templates, so that my template list stays organized and robust against accidental misconfigurations.

**Why this priority**: Lifecycle operations (deletion, duplication, fallback recovery) ensure long-term maintenance hygiene and prevent broken references when a previously selected template is removed.

**Independent Test**: Select a custom template as active default, delete that custom template in the Template Manager, verify the system reverts the default template to "Standard", and verify that built-in templates cannot be deleted or corrupted.

**Acceptance Scenarios**:

1. **Given** the list of templates in the Template Manager, **When** a user views built-in templates ("Standard", "Compact", "Inventory"), **Then** they are marked as built-in and immutable (cannot be edited or deleted), but each provides a "Duplicate as Custom" action that opens the template editor pre-populated with its configuration as a new custom template.
2. **Given** an existing custom template, **When** the user clicks "Delete", **Then** the template is removed from settings after confirmation, and the Template Manager view refreshes immediately.
3. **Given** a custom template that is currently selected as the vault's active "Default Template", **When** that template is deleted by the user, **Then** the system automatically resets the active default template to "Standard" without throwing an error.
4. **Given** a user restarts Obsidian or reloads the plugin, **When** the plugin initializes, **Then** all custom templates and the active template selection remain preserved intact.

---

### Edge Cases

- **Missing Frontmatter Fields**: When a template specifies `customFields` (e.g. `['category', 'serial']`) but a target note does not have those frontmatter keys defined, the system MUST render only the available fields without leaving awkward blank lines, undefined text, or throwing errors.
- **Title Truncation**: When a note title exceeds `titleMaxLength`, the system MUST truncate the string cleanly at the character limit and append an ellipsis (`...`) to preserve label bounds.
- **Date Availability**: When `showDateCreated` or `showDateModified` is enabled, but note file stats are missing or invalid, the system MUST omit the date row gracefully.
- **Active Template Deleted**: If an active template is deleted while assigned as the default, the system MUST fall back to the built-in "Standard" template.
- **Duplicate Template IDs/Names**: When creating a custom template, if the user enters a name or ID matching an existing template, the system MUST prevent conflicting identifier collisions.
- **Zero or Extreme Dimensions**: When custom width or height is less than minimum printable bounds (e.g. < 15 mm) or margins exceed label size, validation MUST reject the values with clear feedback.
- **Array and List Frontmatter Values**: When a frontmatter property configured in `customFields` is a YAML array or list, the system MUST format the elements into a single comma-separated string rather than displaying raw object representations.
- **Vertical Content Overflow**: When enabled content fields (title, path, dates, custom fields) exceed the available vertical printable area, the system MUST render fields in configured priority order and omit any remaining fields that would cross the bottom printable margin, preserving legible font size and preventing boundary overflow.
- **Corrupted Stored Templates**: If custom template data in vault storage becomes corrupted, the system MUST fall back to built-in templates and log a warning without crashing plugin startup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a formal template schema comprising a unique identifier, display name, description, physical label dimensions (`width`, `height`, `dpi`), layout configuration (QR placement, QR size, margins, text alignment), visual style (font family, font size, font color, background color, border width, border color), and content rules.
- **FR-002**: System MUST ship with three immutable built-in templates:
  - **Standard**: 89x28 mm, QR on left (25%), margins 2 mm, left-aligned, Arial 12pt, title and path enabled, title max length 40.
  - **Compact**: 30x30 mm, QR centered (80%), margins 1 mm, center-aligned, Arial 6pt, borderless, title and path disabled, title max length 20.
  - **Inventory**: 100x50 mm, QR on right (30%), margins 3 mm, left-aligned, Courier New 10pt with 2px border, title and creation date enabled, custom frontmatter fields `['category', 'location', 'serial', 'value']`, title max length 30.
- **FR-003**: System MUST provide a template selector in the plugin settings tab allowing users to choose the active vault-wide "Default Template" from all built-in and custom templates.
- **FR-004**: System MUST distinguish custom templates in selection menus by appending a visual indicator (e.g. `(custom)`).
- **FR-005**: System MUST provide a Template Manager interface accessible from the settings tab that lists all templates (marking built-ins as immutable with a "Duplicate as Custom" action, and custom templates with edit/delete actions).
- **FR-006**: System MUST allow users to create new custom templates and edit existing custom templates with full validation against schema rules using an interactive form modal.
- **FR-007**: System MUST validate template dimensions, ensuring positive non-zero width and height, valid margins that do not exceed label dimensions, and positive QR code sizes.
- **FR-008**: System MUST allow users to delete custom templates, and MUST automatically revert the active default template to "Standard" if the deleted template was currently selected.
- **FR-009**: System MUST persist custom templates and default template selection in vault configuration storage across application restarts.
- **FR-010**: System MUST apply the active template's dimensions, layout placement, typography, and visual styling when generating label PDFs.
- **FR-011**: System MUST evaluate content rules during label rendering:
  - If `showTitle` is true, render note title, truncated at `titleMaxLength` with ellipsis when exceeded.
  - If `showPath` is true, render relative note directory or path.
  - If `showDateCreated` is true, render note creation timestamp.
  - If `showDateModified` is true, render note modification timestamp.
  - If `customFields` contains frontmatter keys, extract matching properties from the note's YAML metadata and render them on the label. Array or list values MUST be formatted as a single comma-separated string (e.g. `Key: val1, val2`).
- **FR-012**: System MUST omit missing metadata fields without visual defects or execution errors, and MUST omit any trailing content fields that would exceed the vertical printable boundary to prevent boundary overflow and preserve typography.
- **FR-013**: System MUST operate 100% offline within Obsidian without external network calls, adhering to Constitution Principle I (Privacy First).
- **FR-014**: System MUST support per-note template overrides specified in YAML frontmatter via `template` (or `label_template`), resolving the named template prior to applying any note-specific granular property overrides.
- **FR-015**: System MUST provide a template selection dropdown in the "Generate Label (Custom)..." modal (`CustomLabelModal`), allowing users to pick an alternate template for ad-hoc generation without changing the vault-wide default.

### Key Entities

- **LabelTemplate**: The core composite entity encapsulating:
  - `id`: Unique string identifier (e.g. `standard`, `compact`, `inventory`, `custom-abc123`).
  - `name`: Human-readable display title.
  - `description`: Explanatory description of intended use case and layout.
  - `labelSize`: Physical dimensions (`width`, `height` in millimeters, `dpi`).
  - `layout`: Spatial arrangement parameters (`qrCodePlacement`, `qrCodeSize` percentage or millimeters, `margins`, `textAlignment`).
  - `style`: Visual presentation parameters (`fontFamily`, `fontSize`, `fontColor`, `backgroundColor`, `borderWidth`, `borderColor`).
  - `contentRules`: Field display toggles and metadata extraction rules.
- **ContentRules**: Data extraction and text rules:
  - `showTitle`: Boolean toggle for note title.
  - `showPath`: Boolean toggle for note path/folder.
  - `showDateCreated`: Boolean toggle for creation date.
  - `showDateModified`: Boolean toggle for last modified date.
  - `customFields`: Array of string keys corresponding to note frontmatter attributes.
  - `titleMaxLength`: Integer character limit before truncation.
- **TemplateRegistry**: The runtime catalog combining built-in templates and stored user custom templates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch the active template in settings and generate a label reflecting the new template's layout, dimensions, and styling in under 1 second.
- **SC-002**: 100% of notes processed with the "Inventory" template successfully extract and display existing frontmatter properties matching the specified `customFields`.
- **SC-003**: 100% of note titles exceeding `titleMaxLength` are truncated with an ellipsis without text overflowing the physical label boundary.
- **SC-004**: Users can create, save, and apply a custom template through the Template Manager interface in under 2 minutes without modifying raw plugin configuration files.
- **SC-005**: 100% of custom templates persist accurately across Obsidian restarts and plugin reloads.
- **SC-006**: Deleting the active default template results in zero crashes, with 100% automatic safe fallback to the "Standard" template.

## Assumptions

- Users utilize standard Obsidian frontmatter (YAML) for note metadata properties (`category`, `location`, `serial`, `value`, etc.).
- Dates are derived from Obsidian's native file stat metadata (`ctime`, `mtime`) and formatted using readable local date conventions (e.g., `YYYY-MM-DD`).
- Standard printers supported by the user accept the physical millimeter dimensions configured within the template.
- Built-in template IDs (`standard`, `compact`, `inventory`) are reserved and cannot be reused by custom templates.
- All template management and rendering operations execute locally on the desktop client without remote services.
