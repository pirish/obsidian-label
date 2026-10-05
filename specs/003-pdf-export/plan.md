# Implementation Plan: PDF Export for Physical Label Printing

**Branch**: `003-pdf-export` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-pdf-export/spec.md`

## Summary

This feature implements exact-dimension, print-ready PDF export and in-vault persistence for physical label printing. The system utilizes the pure-JavaScript `jsPDF` library to convert rendered label canvases into 1:1 physical millimeter PDF pages with 0 margin offsets at 300+ DPI. It provides configurable vault storage strategies (`same-folder` by default, dedicated `_labels/` directory, or custom user paths), automatic parent folder creation, and standardized filename generation (`[NoteName]_label.pdf`) with an optional date stamp, ensuring clean in-place overwriting upon label regeneration.

## Technical Context

**Language/Version**: TypeScript 5.7+ (targeting ECMAScript 2022 / Node 22 / Obsidian Runtime)  
**Primary Dependencies**: `jspdf` (^2.5.2), `obsidian` (latest community plugin API)  
**Storage**: Obsidian Vault filesystem (`app.vault.adapter` / `app.vault.writeBinary`)  
**Testing**: Jest 29+ (`ts-jest`), `canvas` (^3.1.0) for headless canvas rendering  
**Target Platform**: Obsidian Desktop (Windows, macOS, Linux) generating universal PDFs for physical label printers  
**Project Type**: Obsidian Community Plugin core library & vault storage module  
**Performance Goals**: PDF document generation and file write in <250ms for standard label presets  
**Constraints**: 100% offline, zero external network connectivity or telemetry, exact 1:1 physical dimensions (±0.1mm)  
**Scale/Scope**: Core exporter module (`src/core/pdf-exporter.ts`), types (`src/core/types.ts`), validation rules (`src/core/validator.ts`), and unit test suite (`tests/unit/pdf-exporter.test.ts`)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|---|---|---|---|
| **I. Privacy First** | Local generation, zero telemetry, local vault storage | **PASS** | PDF files are written strictly to local vault; zero cloud transmission or telemetry. |
| **II. Design for Scale** | Modular TypeScript architecture, clear decoupling | **PASS** | Exporter separates canvas-to-PDF generation, path resolution, and vault I/O into clean functions. |
| **III. Minimal External Dependencies** | Pure JS/TS dependencies, standard browser/Electron APIs | **PASS** | Uses existing pure-JS `jspdf` dependency. Zero native C/C++ binaries in runtime bundle. |
| **IV. Flexibility** | Configurable storage destinations and naming conventions | **PASS** | Supports same folder, dedicated folder, custom folder, and optional timestamp toggles. |
| **V. User Experience** | Sensible defaults, clean overwrite on regeneration | **PASS** | Defaults to same folder with static filename; overwrites cleanly on regeneration. |
| **VI. Cross-Platform Compatibility** | Universal standard outputs, normalized paths | **PASS** | Forward-slash path normalization across Windows, macOS, Linux; standard universal PDF. |

*Gate Status: ALL GATES PASS (Zero violations).*

## Project Structure

### Documentation (this feature)

```text
specs/003-pdf-export/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Technical research & jsPDF findings
├── data-model.md        # Phase 1: Entity definitions & vault storage models
├── quickstart.md        # Phase 1: Verification scenarios & test guide
├── contracts/           # Phase 1: TypeScript interface contracts
│   ├── pdf-exporter.ts  # Contract for canvas-to-PDF export
│   └── vault-storage.ts # Contract for path resolution & vault file writing
├── checklists/
│   └── requirements.md  # Specification quality checklist
├── spec.md              # Feature specification
└── tasks.md             # Phase 2: Actionable task list (created by /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── canvas-renderer.ts   # Renders complete label to canvas
│   ├── dimensions.ts        # DPI and dimension conversions
│   ├── label-generator.ts   # Composite label generator
│   ├── layout.ts            # Spatial layout calculator
│   ├── pdf-exporter.ts      # ENHANCED: PDF export, path resolution & vault persistence
│   ├── presets.ts           # Standard hardware presets
│   ├── qr.ts                # QR matrix generator & canvas drawer
│   ├── types.ts             # UPDATED: PDF export options & storage types
│   ├── typography.ts        # Text rendering & line wrapping
│   ├── uri.ts               # Obsidian URI generation
│   └── validator.ts         # UPDATED: Validation rules for export options
├── index.ts                 # Public module exports
└── main.ts                  # Obsidian plugin entrypoint

tests/
├── unit/
│   ├── pdf-exporter.test.ts # NEW: Unit tests for PDF export, path resolution & storage
│   ├── uri.test.ts          # Unit tests for URI generator
│   ├── qr.test.ts           # Unit tests for QR generator
│   └── ...
└── integration/
    └── uri-qr-quickstart.test.ts
```

**Structure Decision**: Enhances `src/core/pdf-exporter.ts` and `src/core/types.ts` rather than introducing sprawling file sprawl, keeping the export pipeline unified and cohesive.

## Complexity Tracking

*No violations to justify. Architecture adheres strictly to all constitutional principles.*
