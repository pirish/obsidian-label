# Research & Technical Decisions: Per-Note Frontmatter Configuration

**Feature**: `009-frontmatter-config`  
**Date**: 2026-10-21

---

## 1. Frontmatter Extraction & Parsing Strategy

- **Decision**: Use Obsidian's native `app.metadataCache.getFileCache(file)?.frontmatter` to read the note's parsed YAML frontmatter, and extract a dedicated `src/frontmatter/` module (`parser.ts`, `types.ts`) that validates and normalizes both the structured `frontmatter.label` object and legacy flat frontmatter keys.
- **Rationale**: Obsidian automatically parses YAML frontmatter and caches it in memory via `MetadataCache`, eliminating the need for any external YAML parsing libraries (adhering to Constitution Principle III: Minimal External Dependencies). Centralizing frontmatter parsing and validation in `src/frontmatter/parser.ts` decouples schema validation and warning emission from `orchestrator.ts`.
- **Alternatives Considered**:
  - *Manual regex/YAML parsing via `app.vault.read(file)`*: Rejected because it duplicates Obsidian's built-in YAML parser and incurs unnecessary disk I/O.
  - *Inline parsing directly inside `orchestrator.ts`*: Rejected because separating `parseFrontmatterLabelConfig` makes unit testing edge cases, type coercions, and console warnings clean and modular.

---

## 2. Configuration Precedence Hierarchy

- **Decision**: Enforce a 5-tier configuration resolution hierarchy:
  1. **Dialog Overrides** (`CustomLabelOverride` from "Generate Custom Label" modal)
  2. **Nested `label.*` Frontmatter** (`frontmatter.label.{template, customFields, qrCodeSize, fontSize, labelSize, customWidth, customHeight, qrCodePlacement}`)
  3. **Flat Legacy Frontmatter** (`frontmatter.{template, label_template, label_size, custom_width, custom_height, qr_placement, qr_size}`)
  4. **Resolved Template Defaults** (from the active template ID resolved via Tiers 1–3 or global default)
  5. **Global Plugin Settings** (`ObsidianLabelSettings`)
- **Rationale**: Allows `label.template` in frontmatter to select a template (e.g., `"inventory"`) while allowing sibling properties in the same `label` block (e.g., `label.qrCodeSize: 35`, `label.fontSize: 14`) to override that template's defaults, and still permits temporary one-off overrides from the interactive modal.
- **Alternatives Considered**:
  - *Template defaults overriding frontmatter `qrCodeSize`/`fontSize`*: Rejected because the specification explicitly requires `label.qrCodeSize` and `label.fontSize` to override the selected template's layout/style settings.

---

## 3. Custom Fields Override & Rendering (`label.customFields` & `renderCustomFields`)

- **Decision**:
  - When `label.customFields` is defined as a valid non-empty key-value object in frontmatter, its entries completely override the template's `contentRules.customFields` lookup list (per Clarification Q1) while preserving the template's `showTitle`, `showPath`, `showDateCreated`, and `showDateModified` rules.
  - Key names in `label.customFields` preserve their exact casing as written in YAML (`${key}: ${value}`, per Clarification Q2).
  - Provide a dedicated `renderCustomFields(ctx, customFields, x, y, maxWidth, lineHeight?)` helper in `src/core/canvas-renderer.ts` (and apply `truncateWithEllipsis` to all rendered content lines in `renderLabelToCanvas`) so that long custom field lines are truncated cleanly to fit `maxWidth` without overflowing the label border or overlapping the QR code.
- **Rationale**: Directly fulfills the specification's `renderCustomFields` contract while integrating seamlessly with the template `contentLines` pipeline introduced in Feature 007.
- **Alternatives Considered**:
  - *Title-casing keys in `label.customFields`*: Rejected per Clarification Q2 so users retain full control over key formatting and acronyms.

---

## 4. Validation & Warning Behavior for Invalid Frontmatter

- **Decision**: Validate each property in `frontmatter.label` independently. If any property is malformed or out of range (e.g., non-object `label`, unknown `template` ID, `qrCodeSize` outside `[10, 50]` or `isNaN`, `fontSize <= 0` or `> 72` or `isNaN`, invalid `qrCodePlacement`, non-positive `customWidth`/`customHeight`), log a descriptive `console.warn('[Obsidian Label] Ignored invalid frontmatter ...')` and ignore only that invalid property while applying all other valid properties in the block.
- **Rationale**: Partial resilience ensures a single typo in one frontmatter field does not discard the rest of the user's per-note configuration or abort label generation.
- **Alternatives Considered**:
  - *Rejecting the entire `label` block if one field is invalid*: Rejected as overly punitive for minor YAML typos.
  - *Throwing an exception*: Violates Acceptance Criterion 6 ("Invalid frontmatter values ignored (with console warning)").
