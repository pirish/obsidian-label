# Feature Specification: Per-Note Frontmatter Configuration

**Feature Branch**: `009-frontmatter-config`  
**Created**: 2026-10-21  
**Status**: Draft  
**Input**: User description: "Allow notes to specify label configuration in YAML frontmatter (`label` section including `template`, `customFields`, `qrCodeSize`, `fontSize`, and layout/size options), falling back to global settings if not specified, ignoring invalid frontmatter values with a warning, rendering custom fields on labels, and documenting frontmatter schema in README."

---

## Clarifications

### Session 2026-10-21

- Q: When a note specifies `label.customFields` in its frontmatter and also uses a template that defines its own custom field rules, how should the two sets of custom fields be combined? → A: Override template custom fields (`label.customFields` completely replaces the template's custom field lookup list while retaining the template's title, path, and date display rules).
- Q: How should the key names in `label.customFields` be formatted when drawn as `key: value` lines on the label? → A: Preserve exact key text (`${key}: ${value}` as written in frontmatter without auto-title-casing).
- Q: When a user checks "Save overrides to note frontmatter" in the "Generate Custom Label" modal, how should those overrides be written to the note's YAML frontmatter? → A: Dual-compatible persistence (write overrides into the nested `label:` frontmatter object while also maintaining flat key compatibility).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Structured Frontmatter Label Overrides (Priority: P1)

Users managing diverse physical items in their vault need certain notes to persistently use specific label templates, QR code sizes, typography sizes, or dimensions without manually re-entering overrides in a dialog every time they generate or regenerate a label. By defining a structured `label` block in a note's frontmatter metadata, the user's per-note preferences are automatically applied whenever a label is generated for that note.

**Why this priority**: Persistent per-note configuration is the core value proposition of this feature, eliminating repetitive manual adjustments and ensuring batch label regeneration preserves individual item formatting.

**Independent Test**: Add a `label` section to a note's frontmatter specifying a template, QR code size, and font size, trigger label generation for the note, and verify the generated label reflects the frontmatter settings rather than the global defaults.

**Acceptance Scenarios**:

1. **Given** a note with a `label` frontmatter section specifying `template: "inventory"`, **When** the user generates a label for the note, **Then** the label uses the "inventory" template layout, dimensions, and styling rules.
2. **Given** a note with `label.qrCodeSize: 35` and `label.fontSize: 14` in frontmatter, **When** a label is generated, **Then** the QR code proportion is set to 35% and the primary typography size is set to 14pt, overriding both global and template defaults.
3. **Given** a note without any `label` frontmatter section (or with partial properties specified), **When** a label is generated, **Then** all unspecified properties fall back cleanly to the active template and global plugin settings.
4. **Given** a note with frontmatter overrides, **When** the user invokes "Generate Custom Label" and specifies temporary dialog overrides, **Then** the temporary dialog selections take precedence over the note's frontmatter values for that generation run.

---

### User Story 2 - Custom Key-Value Fields from Frontmatter (Priority: P2)

Users cataloging inventory, electronics, or storage containers often want specific key-value pairs (such as `category`, `location`, `serial`, or `value`) printed directly on the physical label alongside the note title and QR code. By providing a `customFields` map inside the note's `label` frontmatter block, those labeled attributes are automatically formatted and rendered on the label.

**Why this priority**: Displaying item-specific metadata directly on the physical label makes labels human-readable at a glance without requiring a QR scan for basic identification.

**Independent Test**: Add `label.customFields` with multiple key-value pairs to a note's frontmatter, generate the label, and verify each `key: value` pair is rendered legibly on the label canvas and truncated cleanly if it exceeds available width.

**Acceptance Scenarios**:

1. **Given** a note with `label.customFields` containing `{ category: "Electronics", location: "Shelf B3", serial: "ABC123" }`, **When** a label is generated, **Then** the label displays each attribute formatted as `key: value` below the note title.
2. **Given** a note where a custom field value is longer than the available text width on the label, **When** the label is rendered, **Then** the text line is truncated with an ellipsis so it does not overflow the label border or overlap the QR code.
3. **Given** a note that specifies both a template with custom field rules and explicit `label.customFields`, **When** a label is generated, **Then** the explicit `label.customFields` entries completely override the template's custom field lookup list (while keeping the template's title, path, and date display rules).

---

### User Story 3 - Graceful Validation & Schema Documentation (Priority: P3)

Users editing note metadata by hand may occasionally introduce typos or out-of-range numbers in their frontmatter (such as an unknown template ID, a negative font size, or a QR code size outside the 10–50% range). Rather than failing label generation or crashing, the system ignores invalid individual frontmatter properties, logs a clear diagnostic warning, falls back to valid defaults, and provides clear documentation in `README.md` so users know the exact schema.

**Why this priority**: Resilient fallback behavior protects the user workflow from syntax mistakes, while clear documentation enables self-service adoption of frontmatter configuration.

**Independent Test**: Configure a note with invalid frontmatter values (e.g., `qrCodeSize: 999`, `fontSize: -5`, `template: "nonexistent"`), generate a label, and verify that generation succeeds using default values while emitting a descriptive warning for each ignored property.

**Acceptance Scenarios**:

1. **Given** a note with `label.qrCodeSize: 90` (outside the valid 10–50 range) or a non-numeric `label.fontSize`, **When** a label is generated, **Then** the invalid property is ignored, a console warning is logged identifying the invalid field, and the default setting is used instead.
2. **Given** a note with `label.template: "unknown-id"`, **When** a label is generated, **Then** the system logs a warning and falls back to the global default template.
3. **Given** a user consulting the project `README.md`, **When** they look up "Per-Note Configuration", **Then** they find complete YAML frontmatter examples and a reference list of all supported `label` options and valid value ranges.

---

### Edge Cases

- **Malformed `label` Frontmatter Property**: What happens if `label` in YAML frontmatter is a scalar string, boolean, or array instead of an object (e.g., `label: "urgent"`)? The system MUST ignore the non-object `label` value with a warning and fall back to flat legacy frontmatter keys or global settings without throwing an error.
- **Non-String Values in `customFields`**: What happens when a user writes numbers, booleans, or null values in `customFields` (e.g., `serial: 12345`, `active: true`)? Numeric and boolean values MUST be coerced cleanly to strings (`"12345"`, `"true"`), while null, undefined, or nested object/array values without simple scalar representation are skipped with a warning.
- **Coexistence with Legacy Flat Frontmatter Keys**: What happens if a note has both nested `label.*` properties and flat frontmatter keys (`template`, `qr_size`, `label_size`)? Nested `label.*` properties take precedence over flat root-level keys, while maintaining backward compatibility for notes that still use flat keys.
- **Vertical Overflow of Custom Fields**: What happens when a user defines more `customFields` entries than can vertically fit in the label's text area? The renderer MUST stop drawing additional lines once the vertical boundary of the printable text region is reached, preventing text from drawing outside the label canvas.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST read per-note label configuration from the nested `label` object in a note's YAML frontmatter metadata when generating, previewing, or batch-regenerating labels.
- **FR-002**: System MUST enforce the following configuration precedence hierarchy from highest to lowest:
  1. Explicit one-time dialog overrides ("Generate Custom Label")
  2. Nested `label.*` frontmatter properties on the note
  3. Flat legacy frontmatter properties on the note (backward compatibility)
  4. Resolved template defaults (from the active template)
  5. Global plugin settings
- **FR-003**: System MUST support `label.template` (string) in frontmatter to select a built-in or user-defined custom template by ID for that note.
- **FR-004**: System MUST support `label.customFields` (key-value map) in frontmatter and include those key-value pairs formatted as `${key}: ${value}` (preserving exact key casing as written in frontmatter) in the rendered label text lines, overriding any template-defined `contentRules.customFields` lookup list while preserving the template's title, path, and date rules.
- **FR-005**: System MUST truncate individual custom field lines that exceed the available horizontal text width of the label so they do not overlap the QR code or margins.
- **FR-006**: System MUST support `label.qrCodeSize` (number between 10 and 50 representing percentage of label dimension) in frontmatter to override the QR code size proportion.
- **FR-007**: System MUST support `label.fontSize` (positive number in points) in frontmatter to override the nominal typography size on the label.
- **FR-008**: System MUST also support optional layout and sizing overrides inside the `label` frontmatter object (`labelSize`, `customWidth`, `customHeight`, `qrCodePlacement`) consistent with existing per-note override capabilities.
- **FR-009**: When `CustomLabelModal` ("Save overrides to note frontmatter") persists user overrides to a note, it MUST write them into the nested `label:` frontmatter object while also maintaining legacy flat key compatibility.
- **FR-010**: System MUST validate frontmatter override values before applying them; any invalid value (such as a non-existent template ID, `qrCodeSize` outside `10–50`, non-positive `fontSize` or dimensions, or invalid placement) MUST be ignored with a descriptive console warning, falling back to the next level in the configuration hierarchy.
- **FR-011**: System MUST update `README.md` with a "Per-Note Configuration" section documenting the YAML `label` frontmatter schema, example snippets, and supported options.

### Key Entities

- **Frontmatter Label Config (`label`)**: A structured metadata object within a note's YAML frontmatter containing optional `template`, `customFields`, `qrCodeSize`, `fontSize`, `labelSize`, `customWidth`, `customHeight`, and `qrCodePlacement` attributes.
- **Custom Fields Map (`customFields`)**: An ordered dictionary of string keys and scalar values defined under `label.customFields` that are formatted into `key: value` display lines on the physical label.
- **Frontmatter Validation Result**: The sanitized set of valid per-note overrides along with any diagnostic warnings generated for malformed or out-of-range fields.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of supported properties in the `label` frontmatter block (`template`, `customFields`, `qrCodeSize`, `fontSize`, and dimension/placement overrides) automatically apply during single-note and batch label generation without manual user intervention.
- **SC-002**: 100% of notes lacking frontmatter or containing malformed/out-of-range `label` frontmatter values still generate valid PDF labels by falling back to template/global defaults and emitting a warning, resulting in zero unhandled exceptions.
- **SC-003**: Custom fields defined in `label.customFields` render legibly on the label with zero horizontal text overflow beyond the designated text bounding box across all built-in label presets.
- **SC-004**: Users can configure a note's persistent label layout in under 30 seconds by copying the documented YAML snippet from `README.md`.

---

## Assumptions

- Notes are standard Markdown files within the user's vault where metadata is parsed locally by Obsidian's metadata cache.
- Valid range for `qrCodeSize` in frontmatter matches the plugin settings slider bounds (`10` to `50` percent).
- Valid range for `fontSize` in frontmatter is any positive number (`> 0`, up to `72` pt consistent with template style bounds).
- Existing flat frontmatter keys (`template`, `label_template`, `label_size`, `custom_width`, `custom_height`, `qr_placement`, `qr_size`) remain supported as a lower-priority fallback so existing vaults do not break.
