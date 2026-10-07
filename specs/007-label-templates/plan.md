# Implementation Plan: Label Templates & Custom Template System

**Branch**: `007-label-templates` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-label-templates/spec.md`

## Summary

This feature implements a comprehensive template engine and management system for Obsidian Label. It defines a formal template schema bundling physical dimensions (`labelSize`), spatial geometry (`layout`), visual styling (`style`), and metadata field display toggles (`contentRules`).
1. Ships with three immutable built-in templates: **Standard** (89x28 mm, QR left, title & path), **Compact** (30x30 mm, QR center, scan-only tag), and **Inventory** (100x50 mm, QR right, Courier New, title, date, frontmatter keys: category, location, serial, value).
2. Introduces a dedicated `TemplateManagerModal` and `TemplateEditorModal` in the settings tab for creating, editing, deleting, and duplicating custom templates.
3. Extends the generation orchestrator and canvas renderer to evaluate content rules, serializing YAML frontmatter arrays as comma-separated values, truncating long titles with ellipses, and omitting overflow fields.
4. Updates `CustomLabelModal` and note YAML frontmatter parsing to allow ad-hoc and per-note template assignment (`template: <id>`) with safe fallback to `'standard'`.

## Technical Context

**Language/Version**: TypeScript 5.7+ (targeting ECMAScript 2022 / Node 22 / Obsidian Runtime)  
**Primary Dependencies**: `obsidian` (Community Plugin API: `Plugin`, `TFile`, `Setting`, `Modal`, `Notice`, `MetadataCache`), `jspdf` (^2.5.2), `qrcode` (^1.5.4)  
**Storage**: Local Obsidian vault settings (`data.json`), note YAML frontmatter  
**Testing**: Jest 29+ (`ts-jest`), `canvas` (^3.1.0), mock Obsidian UI test harness (`tests/mocks/obsidian.ts`)  
**Target Platform**: Obsidian Desktop (Windows, macOS, Linux)  
**Project Type**: Obsidian Community Plugin template engine and UI modals  
**Performance Goals**: Template resolution in <5ms; note label generation with full template content in <1000ms  
**Constraints**: 100% offline, zero network requests, immutable built-in presets, automatic fallback to 'standard' on deleted active templates  
**Scale/Scope**:
- Template schema & registry (`src/templates/types.ts`, `src/templates/builtin.ts`, `src/templates/registry.ts`)
- Content line extraction & formatting (`src/templates/extractor.ts`)
- Canvas renderer dynamic multiline support (`src/core/canvas-renderer.ts`, `src/core/layout.ts`)
- Settings tab integration (`src/settings/types.ts`, `src/ui/settings-tab.ts`)
- Template UI modals (`src/ui/template-manager-modal.ts`, `src/ui/template-editor-modal.ts`, update `src/ui/custom-label-modal.ts`)
- Orchestrator template hierarchy (`src/commands/orchestrator.ts`)
- Comprehensive unit and integration test suites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|---|---|---|---|
| **I. Privacy First** | Local execution, 0 telemetry, 0 network | **PASS** | Template definition, storage, and rendering run 100% locally within Obsidian. |
| **II. Design for Scale** | Clean modular architecture, clear hierarchy | **PASS** | Decoupled template registry, clear hierarchy: `ad-hoc modal > per-note frontmatter > vault default > 'standard' fallback`. |
| **III. Minimal External Dependencies** | Uses native Obsidian API and standard web APIs | **PASS** | No external template engines; uses standard TypeScript schemas and Canvas API. |
| **IV. Flexibility** | Support custom dimensions, layouts, per-note overrides, and template system | **PASS** | Fulfills explicit Constitution Principle IV mandate: *"The plugin MUST provide a template system for repeatable designs and support per-note metadata overrides without invalidating vault-level defaults."* |
| **V. User Experience** | Native modal management, settings selector, live integration | **PASS** | Seamless settings tab dropdown, full visual Template Manager and Editor modals. |
| **VI. Cross-Platform Compatibility** | Universal PDF output across desktop OSs | **PASS** | Pure TypeScript implementation, universal PDF rendering. |

*Gate Status: ALL GATES PASS (Zero violations).*

## Project Structure

### Documentation (this feature)

```text
specs/007-label-templates/
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Entities: LabelTemplate, ContentRules, TemplateSize, TemplateLayout, TemplateStyle
├── quickstart.md        # Runnable verification scenarios
├── contracts/           # TypeScript interface contracts
│   └── template-service.ts # Template management and extraction contracts
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── templates/                  # NEW: Template system module
│   ├── types.ts                # Template interfaces (LabelTemplate, ContentRules, etc.)
│   ├── builtin.ts              # Immutable built-in presets (Standard, Compact, Inventory)
│   ├── registry.ts             # Template resolution, validation, duplication, and CRUD helpers
│   └── extractor.ts            # Metadata extraction, title truncation, array serialization
├── core/
│   ├── canvas-renderer.ts      # Updated: Multiline template content rendering and overflow omission
│   ├── layout.ts               # Layout boundary calculations with template margins & placement
│   ├── label-generator.ts      # Template-aware label generation
│   └── dimensions.ts           # Millimeter to point dimension helpers
├── settings/
│   ├── types.ts                # Updated: defaultTemplate and customTemplates in ObsidianLabelSettings
│   └── validator.ts            # Settings validation
├── ui/
│   ├── settings-tab.ts         # Updated: Default Template dropdown and Manage Templates button
│   ├── template-manager-modal.ts # NEW: Template list, duplicate, edit, delete modal
│   ├── template-editor-modal.ts  # NEW: Interactive template creation/editing form modal
│   └── custom-label-modal.ts   # Updated: Template selector dropdown for ad-hoc generation
├── commands/
│   └── orchestrator.ts         # Updated: Template hierarchy resolution (modal > frontmatter > default)
├── index.ts                    # Public module exports
└── main.ts                     # Plugin entrypoint wiring

tests/
├── mocks/
│   └── obsidian.ts             # Mock Obsidian API harness
├── unit/
│   ├── template-registry.test.ts # NEW: Unit tests for template loading, validation, CRUD, fallback
│   ├── template-extractor.test.ts # NEW: Unit tests for frontmatter, arrays, title truncation
│   └── template-modals.test.ts   # NEW: Unit tests for TemplateManagerModal and TemplateEditorModal
└── integration/
    └── template-integration.test.ts # NEW: E2E integration tests for quickstart scenarios
```

**Structure Decision**: Houses all template schema definitions, built-ins, and registry logic in a dedicated `src/templates/` directory, cleanly decoupled from UI modals in `src/ui/` and generation orchestration in `src/commands/`.

## Complexity Tracking

*No violations to justify. Architecture adheres strictly to all constitutional principles.*
