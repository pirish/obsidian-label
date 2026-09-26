# Feature Specification: Core Label Generation Engine

**Feature Branch**: `001-label-generation-engine`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Core Label Generation Engine: The plugin needs a flexible, extensible label generation system that can render text, QR codes, and metadata onto various label sizes. This is the foundation all other features build on."

## Clarifications

### Session 2026-09-25

- Q: What output artifacts should the label generation engine deliver when rendering is requested? (FR-012) → A: Dual output: both an immediate visual preview image (for instant UI display) and standard PDF data (for printing/exporting)
- Q: How should the generation engine communicate validation failures and unrenderable configurations to callers? (FR-011) → A: Return a structured result object with a list of field-specific validation errors (e.g., { success: false, errors: [...] })
- Q: What QR code error correction level should the generation engine use by default when encoding Obsidian URIs? (FR-002) → A: Medium (Level M, ~15% recovery) by default, with optional per-label configuration
- Q: How should the generation engine format and handle boundary constraints for custom metadata fields? (FR-007) → A: Provide user options for rendering direction (vertical stack vs. horizontal inline) and separator characters, with automatic font scaling and boundary truncation
- Q: Should direct physical printer communication and OS helper script execution be explicitly declared out-of-scope for this core engine feature? → A: Exclude physical printing; engine is strictly responsible for rendering preview images and PDF documents

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Note Label Generation with QR Code (Priority: P1)

As an Obsidian user organizing physical items, I want to generate a standard physical label for my active note containing its title and a scannable QR code that directly opens the note, so that I can affix it to physical objects and instantly access their digital notes.

**Why this priority**: This represents the foundational MVP value proposition of the plugin. Without generating an accurate, readable, and scannable label containing note identity and its Obsidian URI, no other plugin feature delivers value.

**Independent Test**: Can be fully tested by providing a note title and Obsidian URI, applying default dimensions (e.g., Phomemo 40x30mm), and generating a label output that displays a legible title alongside an instantly scannable QR code.

**Acceptance Scenarios**:

1. **Given** a note with title "Workshop Multimeter" and Obsidian URI `obsidian://open?vault=Personal&file=Equipment%2FMultimeter`, **When** label generation is triggered with default settings (Phomemo 40mm x 30mm, QR placed on left), **Then** a high-resolution label is generated displaying the QR code on the left and "Workshop Multimeter" on the right.
2. **Given** a generated label containing an encoded Obsidian URI, **When** scanned using a smartphone camera or handheld QR scanner, **Then** the decoded payload exactly matches the target `obsidian://` URI without intermediate redirects or tracking links.

---

### User Story 2 - Customizable Layout, Styling, and Metadata Display (Priority: P2)

As a user with diverse labeling needs, I want to configure layout arrangements (QR code placement, margins, alignments), visual styles (fonts, colors, borders), and optional custom metadata fields (e.g., location, serial number, status), so that my labels conform to my specific organizational needs and visual preferences.

**Why this priority**: Different physical objects and printer types demand different layouts (e.g., vertical tags, centered codes, or multi-field asset inventory labels). Configurable styling and metadata make the plugin broadly useful.

**Independent Test**: Can be tested by providing note metadata, changing QR code placement (right, top, bottom, center), adjusting margins, and applying custom font colors and borders, verifying that all elements render in their intended positions without overlap.

**Acceptance Scenarios**:

1. **Given** a note with custom metadata fields `{"Location": "Shelf B", "Asset ID": "A-402"}`, **When** label generation is executed with custom fields enabled, **Then** the metadata key-value pairs are rendered below the note title in distinct secondary typography without obscuring the QR code.
2. **Given** a label configuration specifying top QR placement and center text alignment, **When** the label is generated, **Then** the QR code is centered in the upper section and the text content is centered in the lower section, respecting configured margin boundaries.
3. **Given** a label style specifying custom border width and border color, **When** the label is generated, **Then** a uniform border is drawn around the label perimeter within outer bounds.

---

### User Story 3 - Label Format Presets & Custom Physical Sizing (Priority: P3)

As a user with specific label rolls or pre-cut sheets, I want to select from popular hardware presets (Phomemo, Dymo, Brother, Avery) or specify custom physical dimensions (width and height in millimeters) and print resolution (DPI), so that printed labels fit physical media without distortion or scaling artifacts.

**Why this priority**: Users own diverse hardware ranging from thermal roll printers to standard desktop sheet printers. Accurate physical dimension calculation guarantees that output matches real-world paper stock.

**Independent Test**: Can be tested by switching between standard presets (e.g., Dymo 89x28mm vs. Brother 62x100mm) or entering custom dimensions, verifying that generated dimensions match the exact physical proportions and target pixel densities.

**Acceptance Scenarios**:

1. **Given** a user selects the "Dymo 89mm x 28mm" preset at 300 DPI, **When** the label is generated, **Then** output pixel dimensions exactly calculate to 1051 pixels wide by 331 pixels high, preserving physical dimensions.
2. **Given** a user inputs a custom label size of 50mm width and 50mm height, **When** the label is generated, **Then** the canvas dimensions establish a 1:1 aspect ratio and element placement respects custom millimeter margins.

---

### Edge Cases

- **Extremely Long Note Titles**: When a note title exceeds the available horizontal space, the system MUST wrap text onto multiple lines. If vertical space is also exhausted, the system MUST scale down the font size down to a readable minimum, truncating with an ellipsis (`...`) if text still overflows, ensuring no overlap with borders or the QR code.
- **Micro-Scale Label Sizes**: When physical dimensions are too small (e.g., below 20mm x 15mm), the system MUST enforce a minimum readable QR code dimension (at least 15mm x 15mm for standard optical scanning) and reject or warn if remaining area cannot accommodate required text.
- **Special Characters and Emojis**: Note titles containing Unicode symbols, accented characters, slashes, or emojis MUST render accurately without glyph corruption, replacement characters, or clipping.
- **Zero or Negative Dimensions**: When a configuration supplies non-positive width, height, DPI, or margins exceeding total dimensions, the system MUST fail gracefully with clear validation errors before initiating rendering.
- **Completely Offline Vaults**: When generating labels on an air-gapped device without internet access, all operations including QR generation and document preparation MUST succeed with 100% fidelity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate digital rendering dimensions directly from physical measurements (width and height in millimeters) and print resolution (DPI, defaulting to 300 DPI).
- **FR-002**: System MUST generate two-dimensional scannable QR codes encoding direct Obsidian URIs (`obsidian://`) with zero external network dependencies or intermediary redirects, using Error Correction Level M (~15% recovery) by default while allowing optional per-configuration override.
- **FR-003**: System MUST position QR codes according to configurable placement settings: left, right, top, bottom, or center.
- **FR-004**: System MUST allow configuring QR code size as a configurable percentage of available label height or width.
- **FR-005**: System MUST render primary note titles with automatic multi-line text wrapping within the designated text region.
- **FR-006**: System MUST dynamically adapt typography to available area by wrapping lines, scaling font size, and truncating with an ellipsis when boundary limits are reached.
- **FR-007**: System MUST support rendering optional custom metadata fields below the note title with user-configurable orientation (vertical stack or horizontal inline), customizable separator characters (e.g., colons, commas, or bullets), and automatic font scaling down to a minimum readable threshold with boundary truncation.
- **FR-008**: System MUST apply configurable visual styling including font family, font size, font color, background color, border width, and border color.
- **FR-009**: System MUST enforce independent margin boundaries (top, right, bottom, left) to ensure content does not clip against printable physical edges.
- **FR-010**: System MUST provide built-in presets for standard commercial label formats: Phomemo (40mm x 30mm), Dymo (89mm x 28mm), Brother (62mm x 100mm), and Avery 5160 (66.7mm x 25.4mm), while permitting custom physical dimensions.
- **FR-011**: System MUST validate all configuration parameters (dimensions > 0, DPI >= 72, margins within bounds, valid color values) and return a structured validation result (containing a boolean success flag and field-specific error descriptors) rather than throwing unhandled exceptions.
- **FR-012**: System MUST produce dual output artifacts upon rendering: an immediate visual preview image for real-time UI display, and standard universal PDF document data suitable for file export and direct physical printing.

### Key Entities

- **Label Configuration**: The specification of physical, structural, and aesthetic settings used to produce a label, including physical dimensions (width, height, DPI), layout options (QR placement, margins, alignment), and visual styles (fonts, colors, borders).
- **Label Content**: The data elements to be rendered onto a label, including the note title, note vault path, direct Obsidian URI, and optional metadata key-value pairs.
- **Label Preset**: A named, pre-configured combination of physical dimensions and margin defaults corresponding to widely available commercial label paper and roll formats.
- **Validation Result**: The structured outcome of verifying a label configuration and content, containing an overall status flag and a collection of field-specific error diagnostics when invalid.
- **Rendered Label**: The composite artifact produced by the engine containing both a high-resolution visual preview image (for live display and verification) and standard PDF document data (for printing and saving).

### Out of Scope

- Direct physical printer discovery and hardware communication protocols.
- Operating system print queue management, CUPS spooling, or native printer driver integration.
- Execution or orchestration of external printer helper scripts (e.g., shell or Python dispatchers); the engine scope concludes upon returning the rendered preview and PDF document bytes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System generates a complete, high-resolution label preview in under 500 milliseconds on standard desktop hardware.
- **SC-002**: 100% of generated QR codes successfully scan with standard iOS and Android camera apps and decode directly into the intended `obsidian://` URI without error.
- **SC-003**: Rendered labels accurately match physical dimensions within 0.5mm tolerance when printed at 100% scale on supported label printers.
- **SC-004**: 100% of label generation operations execute fully offline with zero external network requests or telemetry.
- **SC-005**: Text titles of up to 120 characters fit within label bounds without visual clipping or overlapping the QR code across all standard presets.

## Assumptions

- The plugin runs within an environment that supports standard client-side graphic rendering and client-side PDF document generation.
- Default print resolution for thermal and inkjet label printers is 300 DPI, ensuring sharpness for compact QR codes and small text.
- Note titles and metadata values are UTF-8 encoded text.
- Physical printers are configured with appropriate operating system drivers or standard PDF printing capabilities; the plugin produces universal standard printable graphics and PDF outputs.
