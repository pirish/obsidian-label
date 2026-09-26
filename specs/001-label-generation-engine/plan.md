# Implementation Plan: Core Label Generation Engine

**Branch**: `001-label-generation-engine` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-label-generation-engine/spec.md`

## Summary

The Core Label Generation Engine provides a local-first, client-side rendering pipeline that transforms note metadata (title, Obsidian URI, and custom frontmatter properties) into physical labels. Using the standard HTML5 2D Canvas API for high-resolution graphics and dynamic typography calculations, alongside a pure TypeScript QR generator and client-side PDF document compiler (`jspdf`), the engine produces a dual-output artifact: an instant visual preview image (PNG data URL) for zero-lag UI display and standard universal PDF bytes for direct printing and file export.

## Technical Context

**Language/Version**: TypeScript 5.x (targeting ES2022 / desktop Chromium/Electron environment in Obsidian, strict mode enabled)

**Primary Dependencies**:
- `obsidian`: Obsidian Plugin API (peer/dev dependency)
- `qrcode`: In-memory pure JavaScript/TypeScript QR code generator
- `jspdf`: Client-side pure JavaScript PDF document generator

**Storage**: Obsidian Plugin Data Storage (`data.json` via Obsidian `Plugin.loadData()` / `Plugin.saveData()`) for persisting custom user presets and default configurations

**Testing**: Jest + `ts-jest` for automated unit tests (dimension math, coordinate boundaries, QR matrix verification, text wrapping, validation); headless canvas mock for offscreen rendering verification

**Target Platform**: Desktop Obsidian (Windows, macOS, Linux on Electron runtime)

**Project Type**: Obsidian Community Plugin with modular core library architecture

**Performance Goals**:
- High-resolution label preview generated in $< 500\text{ms}$ on standard desktop hardware (SC-001)
- $100\%$ optical scan reliability with standard mobile camera apps (SC-002)

**Constraints**:
- $100\%$ offline capable with zero external network requests or telemetry (Constitution Principle I & SC-004)
- Print dimensions accurate within $0.5\text{mm}$ tolerance at target DPI (SC-003)
- Zero native Node.js binaries or platform-exclusive print drivers in core (Constitution Principle III & VI)

**Scale/Scope**: Self-contained rendering engine handling presets, custom dimensions, QR generation, typography scaling, preview rasterization, and PDF compilation. Physical print spooling and external helper scripts are strictly out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Requirement | Status | Verification & Evidence |
| :--- | :--- | :---: | :--- |
| **I. Privacy First** | All generation must execute locally; zero telemetry; direct `obsidian://` URIs; offline-capable. | **PASS** | Rendering operates 100% in-engine via standard Canvas API and pure JS QR generator. Zero remote network calls. |
| **II. Design for Scale** | Modular architecture; hierarchical config (vault defaults + per-note); community plugin ready. | **PASS** | Clear separation between core rendering, validation, presets, and presentation layers. |
| **III. Minimal External Dependencies** | Canvas/PDF in-plugin; pure TS QR library; printer integration strictly optional. | **PASS** | Uses standard HTML5 Canvas and lightweight pure JS libraries (`qrcode`, `jspdf`). Zero native C/C++ addons. |
| **IV. Flexibility** | Multi-dimension support (rolls & sheets); configurable layout, typography, metadata; custom sizes. | **PASS** | Supports standard presets (Phomemo, Dymo, Brother, Avery) and custom mm dimensions. Configurable QR placement and metadata orientation. |
| **V. User Experience** | Live visual preview before print; single-click regeneration; intuitive UI integration. | **PASS** | Dual-output design produces instant Base64 preview data URL for live modal rendering alongside printable PDF data. |
| **VI. Cross-Platform** | Identical behavior across Windows, macOS, Linux; universal PDF output; zero native OS binaries. | **PASS** | Electron Canvas standard + PDF 1.4/1.7 universal export ensures cross-platform equivalence. |

**Gate Result**: **PASS**. All constitutional principles and governance requirements are satisfied without exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/001-label-generation-engine/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 technical decisions & architecture
├── data-model.md        # Phase 1 entity definitions & validation rules
├── quickstart.md        # Phase 1 end-to-end validation guide
├── contracts/           # Phase 1 public interface contracts
│   └── label-engine-api.ts
├── checklists/          # Quality validation checklists
│   └── requirements.md
└── tasks.md             # Phase 2 task decomposition (/speckit-tasks output)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── types.ts              # Data types, enums, and API interfaces (matches contracts)
│   ├── dimensions.ts         # Physical mm to pixel conversions and DPI calculation
│   ├── validator.ts          # Structured configuration and content validator
│   ├── presets.ts            # Built-in hardware presets (Phomemo, Dymo, Brother, Avery)
│   ├── qr.ts                 # Pure TypeScript/JS QR matrix generator with Level M default
│   ├── typography.ts         # Text measurement, multi-line wrapping, scaling, truncation
│   ├── layout.ts             # Spatial positioning and bounding box calculation
│   ├── canvas-renderer.ts    # 2D canvas drawing and raster preview data URL generation
│   ├── pdf-exporter.ts       # jsPDF document creation and binary export
│   └── label-generator.ts    # Core ILabelGenerator implementation coordinating pipeline
├── index.ts                  # Public library exports for the core engine
└── main.ts                   # Obsidian plugin lifecycle entrypoint

tests/
├── unit/
│   ├── dimensions.test.ts    # DPI and millimeter-to-pixel math
│   ├── validator.test.ts     # Input validation rules and diagnostic error codes
│   ├── qr.test.ts            # QR matrix generation and Obsidian URI encoding
│   ├── typography.test.ts    # Word wrapping, dynamic scaling, and truncation
│   ├── layout.test.ts        # Placement strategies (left, right, top, bottom, center)
│   └── generator.test.ts     # Complete generator pipeline and dual output verification
└── integration/
    └── e2e-generation.test.ts# End-to-end preset and custom rendering tests
```

**Structure Decision**: Single modular project. The core label generation engine resides under `src/core/` as a decoupled, independently testable library that does not depend on Obsidian UI classes. The outer plugin entrypoint (`main.ts`) imports the core engine, preparing for subsequent UI commands and settings tabs.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No constitutional violations or unjustified complexity introduced. All gates pass cleanly.*
