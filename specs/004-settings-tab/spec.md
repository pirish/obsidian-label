# Feature Specification: Plugin Settings Tab for Label Configuration

**Feature Branch**: `004-settings-tab`  
**Created**: 2026-10-05  
**Status**: Draft  
**Input**: User description: "Users need to configure label size, layout, printer preferences, and default styles without editing JSON. Obsidian's settings tab UI provides a familiar pattern for this. Implement Obsidian PluginSettingTab with dropdowns, sliders, color pickers, and live preview for label configuration."

## Clarifications

### Session 2026-10-05

- Q: How should the sample label preview be presented to the user when they click "Preview Label" in the settings tab? → A: Option A (Dedicated pop-up modal dialog displaying the high-resolution sample label image with a "Close" button).
- Q: What note content should be rendered on the sample label when the user clicks "Preview Label" in the settings tab? → A: Option B (Dynamically use the currently open note in the active editor pane, falling back to sample data if no note is open).
- Q: Which presets should be included in the "Label Size" dropdown in the settings tab? → A: Option A (All built-in engine presets: Dymo Standard 89×28mm, Brother 62mm, Avery 5160 66.7×25.4mm, Phomemo 40×30mm, Generic Square 50×50mm, plus "Custom Size").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Label Dimensions & Preset Selection (Priority: P1) 🎯 MVP

As an Obsidian user preparing to print physical labels, I want to select from standard label presets or specify custom millimeter dimensions through an intuitive settings tab UI, so that I can configure my hardware media dimensions without editing JSON configuration files.

**Why this priority**: Physical media dimensions are the fundamental prerequisite for generating accurate labels. Without setting label dimensions, no usable or print-ready labels can be produced.

**Independent Test**: Open Obsidian Settings, select the "Obsidian Label" tab, pick a preset or configure custom width and height, and verify the settings persist across application reloads and determine default label size.

**Acceptance Scenarios**:

1. **Given** the plugin settings tab is displayed, **When** the user selects a standard preset (Dymo Standard 89×28mm, Brother 62mm, Avery 5160 66.7×25.4mm, Phomemo 40×30mm, Generic Square 50×50mm), **Then** the preset's dimensions are applied as defaults and custom dimension input fields remain hidden.
2. **Given** the user selects "Custom Size" in the Label Size dropdown, **When** the selection updates, **Then** numeric input fields for Width (mm) and Height (mm) dynamically appear.
3. **Given** custom dimension input fields, **When** the user enters valid positive dimensions (e.g. 50mm width, 25mm height), **Then** the custom dimensions are saved to plugin settings.
4. **Given** custom dimension input fields, **When** the user inputs a zero, negative, or non-numeric value, **Then** the system provides immediate validation feedback and prevents saving invalid dimensions.
5. **Given** configured label size settings, **When** the plugin or Obsidian is reloaded, **Then** the saved preset or custom dimensions are restored exactly.

---

### User Story 2 - Layout, Typography, & Visual Styling Customization (Priority: P2)

As a knowledge worker organizing inventory, I want to customize the QR code placement, QR code relative size, font family, typography size, colors, and borders using familiar dropdowns, sliders, and color inputs, so that generated labels match my aesthetic and legibility requirements.

**Why this priority**: Visual layout and styling determine how information fits on physical media; users must be able to adapt title sizing, color contrast, and QR positioning to their specific physical label stock.

**Independent Test**: Open the settings tab, change QR placement, adjust the QR size slider, pick a custom font family, font color, background color, and border settings, and verify all values persist cleanly.

**Acceptance Scenarios**:

1. **Given** the QR Code settings section, **When** the user selects a placement option (Left, Right, Top, Bottom), **Then** the layout preference is updated and saved.
2. **Given** the QR Code Size slider (range 10% to 50%), **When** the user adjusts the slider, **Then** the current percentage is dynamically displayed in a tooltip and saved.
3. **Given** the Style settings section, **When** the user selects a font family from the dropdown (e.g. Arial, Courier New, Georgia, Times New Roman, Verdana), **Then** the typography preference is saved.
4. **Given** color inputs for font, background, and border, **When** the user chooses or types valid hex colors, **Then** the colors are stored in settings.
5. **Given** border width settings, **When** the user enters a non-negative number of pixels, **Then** the border thickness is updated and saved.

---

### User Story 3 - PDF Storage Destination & Print Helper Preferences (Priority: P3)

As a user with an organized vault directory structure, I want to configure the default output destination for exported PDF labels, toggle automatic date timestamping, and configure printer preferences, so that generated labels are placed where I expect and integrate with my printing workflow.

**Why this priority**: Output location and naming defaults directly impact file organization within the user's vault, ensuring generated PDFs do not clutter note folders unless desired.

**Independent Test**: Configure the output folder option (same as note, dedicated `_labels/` folder, or custom path), toggle timestamps, and verify exported label defaults respect these settings.

**Acceptance Scenarios**:

1. **Given** the Output settings section, **When** the user selects "Same folder as note", **Then** the default export destination is set to match each source note's folder.
2. **Given** the Output settings section, **When** the user selects "Dedicated labels folder", **Then** the default export destination targets `_labels/` at the vault root.
3. **Given** the Output settings section, **When** the user selects "Custom folder" and enters a path (e.g. `PrintQueue/Pending`), **Then** the custom folder path is validated and saved.
4. **Given** the filename timestamp toggle, **When** toggled on, **Then** the default filename strategy appends `_YYYY-MM-DD`.
5. **Given** the Print Helper section, **When** the user enters an optional printer name or toggles auto-print, **Then** these preferences are stored for print workflows.

---

### User Story 4 - Live Label Sample Preview from Settings (Priority: P4)

As a user adjusting label styling in settings, I want to click a "Preview" button directly in the settings tab to generate and inspect a sample label with my active settings, so that I can immediately verify my design choices without wasting physical label stock.

**Why this priority**: Immediate visual feedback closes the loop on configuration changes and prevents trial-and-error printer waste.

**Independent Test**: Click "Preview Label" in the settings tab and verify a preview modal or display appears rendering a sample note label with current settings.

**Acceptance Scenarios**:

1. **Given** configured settings in the settings tab and an active note open in the workspace, **When** the user clicks "Preview Label", **Then** a dedicated pop-up modal dialog opens displaying the high-resolution rendered label using the active note's title and URI with a "Close" button.
2. **Given** configured settings in the settings tab and no active note open in the workspace, **When** the user clicks "Preview Label", **Then** the modal dialog renders a label using a realistic default sample note payload ("Sample Note", sample URI, and metadata).
3. **Given** invalid dimension settings currently in the tab, **When** the user clicks "Preview Label", **Then** an informative error notice appears indicating which setting must be corrected.

---

### Edge Cases

- **First-Time Plugin Initialization**: When installed or loaded for the first time without prior configuration, the plugin MUST initialize with sensible, battle-tested default settings.
- **Corrupted Settings File**: If `data.json` contains malformed JSON or corrupted types, the plugin MUST log a diagnostic warning and fall back to defaults without crashing Obsidian.
- **Dynamic Field Toggle**: Switching between predefined presets and "custom" MUST dynamically show or hide custom dimension controls without requiring the settings tab to close.
- **Invalid Custom Dimensions**: Input of non-positive numbers (<= 0), NaN, or empty values in custom dimensions MUST be flagged with inline validation errors and prevented from saving.
- **Color Validation**: Color settings MUST accept standard hex codes (e.g. `#000000`, `#FFFFFF`, `#CCCCCC`) and reject malformed color strings.
- **100% Offline Operation**: All settings viewing, saving, and preview generation MUST execute strictly locally with zero network requests or telemetry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated `PluginSettingTab` registered in Obsidian's settings panel under the title "Obsidian Label".
- **FR-002**: System MUST load and persist plugin settings across Obsidian restarts using the official Obsidian plugin data persistence API (`loadData` and `saveData`).
- **FR-003**: System MUST provide a label size dropdown with all standard built-in presets: Dymo Standard (89×28mm), Brother 62mm (62×100mm / 62×29mm), Avery 5160 (66.7×25.4mm), Phomemo 40×30mm (40×30mm), Generic Square 50×50mm (50×50mm), and a "Custom Size" option.
- **FR-004**: System MUST dynamically display custom width (mm) and custom height (mm) input fields when "Custom Size" is selected, and hide them when a standard preset is selected.
- **FR-005**: System MUST provide a QR code placement dropdown supporting Left, Right, Top, and Bottom options.
- **FR-006**: System MUST provide a QR code size slider ranging from 10% to 50% with an increment step of 5% and dynamic tooltip display.
- **FR-007**: System MUST provide style settings for font family (cross-platform options: Arial, Courier New, Georgia, Times New Roman, Verdana, system sans-serif), font size (points), font color, background color, border width, and border color.
- **FR-008**: System MUST provide output destination settings supporting: "Same folder as note" (`same-as-note`), "Dedicated labels folder" (`dedicated-folder`), and "Custom folder" (`custom`).
- **FR-009**: System MUST provide an input field for custom output folder path when "Custom folder" is selected.
- **FR-010**: System MUST provide a toggle setting to include or omit the date timestamp (`_YYYY-MM-DD`) in default exported PDF filenames.
- **FR-011**: System MUST provide print helper preference fields for an optional printer name and an auto-print toggle.
- **FR-012**: System MUST provide a "Preview Label" button that generates a label using the currently active note's title and URI if available (falling back to a default sample note payload if no note is open) and presents it in a dedicated `PreviewModal` with an explicit "Close" button.
- **FR-013**: System MUST validate all configuration inputs, rejecting non-positive dimensions, invalid color formats, and negative border widths.

### Key Entities

- **ObsidianLabelSettings**: The structured configuration entity storing all user preferences (label size preset, custom dimensions, QR layout, typography, colors, borders, output folder, timestamp toggle, and printer preferences).
- **ObsidianLabelSettingTab**: The user interface component extending Obsidian's `PluginSettingTab` that manages UI controls, input event listeners, validation, and persistence.
- **PreviewModal**: An Obsidian `Modal` component rendering a live raster preview of a sample label generated with current settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure all label dimensions, layouts, visual styles, and output destinations through a graphical UI in under 1 minute without editing JSON.
- **SC-002**: 100% of user settings modifications persist across Obsidian application restarts with zero data loss or corruption.
- **SC-003**: Toggling between presets and custom dimensions reveals or hides input fields in under 100 milliseconds without UI lag.
- **SC-004**: Clicking "Preview Label" renders and presents the sample label modal in under 300 milliseconds.
- **SC-005**: 100% of invalid inputs (non-positive dimensions, malformed hex colors) are caught with inline validation messages before saving.
- **SC-006**: 100% of settings operations run completely offline with zero external network connectivity or telemetry.

## Assumptions

- The user operates in the Obsidian desktop application environment supporting the official Obsidian Community Plugins API.
- The plugin has read/write permissions for `.obsidian/plugins/obsidian-label/data.json` within the active vault.
- Common cross-platform fonts (Arial, Courier New, Georgia, Times New Roman, Verdana, sans-serif) are available on the host operating system.
- Direct hardware printing scripts or OS-level print commands (if used) remain optional external utilities decoupled from the core plugin.
