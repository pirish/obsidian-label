# Research & Architecture Decisions: Label Templates & Custom Template System

**Feature Branch**: `007-label-templates`  
**Date**: 2026-10-07  
**Status**: Completed  

---

## 1. Template Schema & Storage Architecture

### Context
Users require tailored label layouts for distinct applications (e.g., inventory cataloging, compact parts labeling, standard document references). The system must bundle dimensions, layout geometry, visual styling, and content extraction rules into reusable templates.

### Decision
- Store custom templates in `plugin.settings.customTemplates` (`LabelTemplate[]`) inside the plugin's native `data.json` storage.
- Maintain immutable built-in templates (`standard`, `compact`, `inventory`) as static constants in `src/templates/builtin.ts`.
- Expose a unified registry helper `getTemplateRegistry(settings)` and `resolveTemplateById(id, settings)` that returns built-in or custom templates with guaranteed fallback to `standard`.

### Rationale
- Storing custom templates in plugin settings avoids creating hidden template files in the user vault, guarantees atomic persistence via `plugin.saveData()`, and ensures seamless synchronization with existing settings backups.
- Reserving built-in template IDs (`standard`, `compact`, `inventory`) prevents namespace collisions and ensures the plugin always has uncorrupted fallback templates available.

### Alternatives Considered
- *Separate Template Files in Vault (e.g. `.obsidian/templates/*.json`)*: Rejected due to unnecessary file system overhead, potential sync races, and added complexity during vault migrations.
- *Strict Markdown Note Templates*: Rejected because physical label layouts contain numeric millimeter dimensions, DPI, and layout geometry that map cleanly to structured typed JSON interfaces.

---

## 2. Content Rules & Dynamic Text Layout Architecture

### Context
Templates define `contentRules` controlling which metadata fields are rendered:
- `showTitle` (with `titleMaxLength` truncation)
- `showPath`
- `showDateCreated` and `showDateModified`
- `customFields`: frontmatter property keys (e.g. `['category', 'location', 'serial', 'value']`)
Fixed physical label dimensions risk boundary overflows when multiple fields are enabled.

### Decision
- Introduce a dedicated metadata extraction pipeline `resolveContentLines(file, contentRules, metadataCache)`:
  - Formats note title, truncating at `titleMaxLength` with ellipsis (`...`).
  - Formats creation and modification dates using ISO/local date formatting (`YYYY-MM-DD`).
  - Extracts frontmatter keys from Obsidian's `metadataCache`. For YAML arrays (e.g. `tags: ['a', 'b']`), joins elements into comma-separated text (`a, b`).
  - Returns a structured array of text lines `{ label?: string; value: string; type: ContentLineType }`.
- In `canvas-renderer.ts`, measure available text height against `contentRules`. Render lines sequentially; if rendering an additional line would exceed the bottom margin (`currentY + lineHeight > maxY`), gracefully omit remaining lines to maintain legibility and prevent clipping.

### Rationale
- Separating content extraction from raster rendering makes content formatting easily testable in unit tests without canvas mocks.
- Sequential rendering with truncation prevents font scaling down to unreadable microscales while strictly preserving physical label boundaries.

### Alternatives Considered
- *Proportional Font Scaling*: Dynamically shrinking font size when fields overflow. Rejected because tiny font sizes (<5pt) become unreadable when printed on low-resolution thermal label printers (203/300 DPI).
- *Strict Text Clipping*: Allowing text to draw past the margin and clipping at the border. Rejected because half-rendered text lines look defective and unprofessional.

---

## 3. Template Resolution Hierarchy & Orchestrator Integration

### Context
Features 004, 005, and 006 established an orchestrator (`generateLabelForNote`) that resolves effective settings (`frontmatter > globalSettings`). With the introduction of templates, the resolution order must accommodate:
1. Ad-hoc modal selection (in `CustomLabelModal`)
2. Per-note YAML frontmatter template declaration (`template: inventory` or `label_template: inventory`)
3. Vault-wide default template setting (`settings.defaultTemplate`)
4. Granular per-note overrides (e.g., `qr_placement: top` or `custom_width: 50`)

### Decision
The resolution hierarchy proceeds as:
```text
1. Resolve Active Template:
   Ad-hoc Modal Override Template > Note Frontmatter Template > Vault Default Template > 'standard' Fallback

2. Derive Base Settings from Active Template:
   Width, Height, Margins, QR Placement, QR Size, Typography, Content Rules

3. Apply Granular Overrides (if specified):
   Frontmatter granular overrides (e.g. label_size, qr_placement) > Template Defaults
   Ad-hoc modal granular overrides > All
```

### Rationale
- Completely preserves backwards compatibility with existing notes using `label_size` or `qr_placement` frontmatter keys.
- Allows users to designate templates at both the vault level and per-note level while still allowing emergency fine-tuning via individual frontmatter properties.

### Alternatives Considered
- *Templates Replace Granular Overrides Entirely*: Disallow frontmatter properties other than `template`. Rejected because power users often need a standard template with a one-off QR placement change.

---

## 4. UI Modals & Template Management Workflows

### Context
Users need accessible UI tools to manage their template library and create new templates without editing raw JSON.

### Decision
- **Settings Tab Integration**:
  - Add "Default Template" dropdown to `settings-tab.ts` listing all built-in and custom templates (custom templates labeled with `(custom)`).
  - Add "Manage Templates" setting button that opens `TemplateManagerModal`.
- **`TemplateManagerModal`**:
  - Displays list of built-in templates with description and "Duplicate as Custom" button (immutable, no delete).
  - Displays list of custom templates with description, "Edit" button, and "Delete" button (with confirmation).
  - Deleting an active template automatically reverts `settings.defaultTemplate` to `'standard'`.
  - Top "Create New Template" button opens `TemplateEditorModal`.
- **`TemplateEditorModal`**:
  - Interactive form modal with grouped settings: General (Name, Description), Physical Dimensions (Width, Height in mm), Layout (QR Placement, QR Size, Margins, Text Alignment), Style (Font Family, Font Size, Colors, Border), and Content Rules (Toggles for Title, Path, Dates; Title Max Length; Custom Frontmatter Fields input).
  - Validation ensures name is non-empty, dimensions are >= 15 mm, and margins do not exceed label dimensions.
- **`CustomLabelModal` Integration**:
  - Add a "Template" dropdown at the top of the modal, allowing users to pick any template for their ad-hoc generation.

### Rationale
- Matches Obsidian's native Modal and Setting design paradigms.
- Safe lifecycle management ensures built-in templates cannot be broken or deleted, and deleting the active template never leaves the plugin in an invalid state.
