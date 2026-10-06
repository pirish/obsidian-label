# Implementation Plan: Plugin Settings Tab for Label Configuration

**Branch**: `004-settings-tab` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-settings-tab/spec.md`

## Summary

This feature implements an Obsidian `PluginSettingTab` UI allowing users to configure label media presets, custom dimensions, QR positioning/scaling, typography, colors, borders, PDF export locations, and print preferences directly within Obsidian's settings panel. It provides seamless data persistence via `loadData`/`saveData`, dynamic visibility for custom dimension inputs, inline validation, and an interactive `PreviewModal` that generates a live sample label using either the active editor note or a realistic fallback.

## Technical Context

**Language/Version**: TypeScript 5.7+ (targeting ECMAScript 2022 / Node 22 / Obsidian Runtime)  
**Primary Dependencies**: `obsidian` (Community Plugin API: `PluginSettingTab`, `Setting`, `Modal`, `Notice`, `App`), `jspdf` (^2.5.2), `qrcode` (^1.5.4)  
**Storage**: Obsidian Plugin Data Storage (`this.loadData()`, `this.saveData()`, persisted to `.obsidian/plugins/obsidian-label/data.json`)  
**Testing**: Jest 29+ (`ts-jest`), `canvas` (^3.1.0), mock Obsidian UI harness (`tests/mocks/obsidian.ts`)  
**Target Platform**: Obsidian Desktop (Windows, macOS, Linux)  
**Project Type**: Obsidian Community Plugin UI & settings persistence module  
**Performance Goals**: Settings load/save in <50ms; dynamic setting tab refresh in <100ms; sample label preview generated in <300ms  
**Constraints**: 100% offline, zero external network connectivity or telemetry, native Obsidian UX patterns  
**Scale/Scope**: Settings model & schema (`src/settings/types.ts`), settings tab view (`src/ui/settings-tab.ts`), preview modal (`src/ui/preview-modal.ts`), plugin entrypoint integration (`src/main.ts`), and unit/integration test suites  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|---|---|---|---|
| **I. Privacy First** | Local settings persistence, zero telemetry, local vault storage | **PASS** | Settings saved strictly to local plugin `data.json`; zero network calls or tracking. |
| **II. Design for Scale** | Decoupled UI components, clean settings model & mapper functions | **PASS** | Settings schema, mapping helpers, settings tab, and preview modal are cleanly modularized. |
| **III. Minimal External Dependencies** | Uses official Obsidian API only, no external UI frameworks | **PASS** | Leverages native `PluginSettingTab`, `Setting`, and `Modal` provided by `obsidian` package. |
| **IV. Flexibility** | Configurable presets, custom dimensions, styles, and output routing | **PASS** | Supports standard hardware presets, custom mm sizing, custom colors, fonts, and storage modes. |
| **V. User Experience** | Intuitive settings tab, instant validation, interactive preview modal | **PASS** | Native Obsidian settings panel integration; live sample preview prevents label stock waste. |
| **VI. Cross-Platform Compatibility** | Standard web fonts, cross-platform path normalization | **PASS** | Cross-platform font families and normalized vault folder paths across Windows, macOS, Linux. |

*Gate Status: ALL GATES PASS (Zero violations).*

## Project Structure

### Documentation (this feature)

```text
specs/004-settings-tab/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Technical research & Obsidian settings findings
├── data-model.md        # Phase 1: Settings entity definitions & validation rules
├── quickstart.md        # Phase 1: Verification scenarios & test guide
├── contracts/           # Phase 1: TypeScript interface contracts
│   ├── settings.ts      # Contract for settings model & mapping helpers
│   └── preview.ts       # Contract for preview modal & payload resolver
├── checklists/
│   └── requirements.md  # Specification quality checklist
├── spec.md              # Feature specification
└── tasks.md             # Phase 2: Actionable task list (created by /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── core/                # Core label generation engine (Features 001-003)
│   ├── canvas-renderer.ts
│   ├── dimensions.ts
│   ├── label-generator.ts
│   ├── layout.ts
│   ├── pdf-exporter.ts
│   ├── presets.ts
│   ├── qr.ts
│   ├── types.ts
│   ├── typography.ts
│   ├── uri.ts
│   └── validator.ts
├── settings/            # NEW: Plugin settings model, defaults & mapper helpers
│   ├── types.ts         # Settings schema & default values
│   ├── mappers.ts       # Settings to LabelConfig & PDFExportOptions mappers
│   └── validator.ts     # Settings validation rules
├── ui/                  # NEW: Obsidian UI components
│   ├── settings-tab.ts  # ObsidianLabelSettingTab implementation
│   └── preview-modal.ts # PreviewModal implementation
├── index.ts             # Public module exports
└── main.ts              # Obsidian plugin entrypoint (registers setting tab)

tests/
├── mocks/
│   └── obsidian.ts      # Mock Obsidian API harness (App, PluginSettingTab, Setting, Modal)
├── unit/
│   ├── settings.test.ts     # NEW: Settings model, defaults, and mapping tests
│   ├── settings-tab.test.ts # NEW: UI controls and dynamic field visibility tests
│   └── preview-modal.test.ts# NEW: Preview modal rendering & fallback tests
└── integration/
    └── settings-integration.test.ts # NEW: Plugin lifecycle and end-to-end integration
```

**Structure Decision**: Introduces clean `src/settings/` and `src/ui/` directories to separate configuration models and Obsidian UI components from the pure mathematical/canvas `src/core/` engine.

## Complexity Tracking

*No violations to justify. Architecture adheres strictly to all constitutional principles.*
