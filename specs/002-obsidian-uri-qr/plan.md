# Implementation Plan: Obsidian URI Generation & QR Encoding

**Branch**: `002-obsidian-uri-qr` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-obsidian-uri-qr/spec.md`

## Summary

This feature implements the core Obsidian URI generator and optical QR code encoding pipeline. The system constructs canonical `obsidian://open?vault=<vault>&file=<path>` deep-link URIs adhering strictly to RFC 3986 percent-encoding rules, utilizing Obsidian's native `app.getObsidianUrl()` API when available in-app with a standalone RFC fallback for headless testing and CLI execution. The generated URI is encoded into an optical-grade QR code matrix and raster PNG data URL using the pure-TypeScript `qrcode` library, supporting selectable error correction levels (L, M, Q, H), quiet-zone margins, and dark/light color styling.

## Technical Context

**Language/Version**: TypeScript 5.7+ (targeting ECMAScript 2022 / Node 22 / Obsidian Runtime)  
**Primary Dependencies**: `qrcode` (^1.5.4), `@types/qrcode` (^1.5.5), `obsidian` (latest community plugin API)  
**Storage**: Stateless in-memory computation (no disk storage or database requirements)  
**Testing**: Jest 29+ (`ts-jest`), `canvas` (^3.1.0) for headless 2D context verification  
**Target Platform**: Obsidian Desktop (macOS, Windows, Linux) generating physical labels scannable by mobile cameras (iOS, Android)  
**Project Type**: Obsidian Community Plugin core library module  
**Performance Goals**: QR matrix generation executes in <50ms for any standard note path (<15ms expected)  
**Constraints**: 100% offline execution, zero external network connectivity or telemetry, strict RFC 3986 query escaping, sub-pixel canvas rendering  
**Scale/Scope**: Core generator modules (`src/core/uri.ts`, `src/core/qr.ts`, `src/core/validator.ts`), contract specifications, and test suites  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|---|---|---|---|
| **I. Privacy First** | Local generation, zero telemetry, direct `obsidian://` URIs | **PASS** | QR codes encode direct URIs; no redirect intermediaries or tracking endpoints. 100% offline. |
| **II. Design for Scale** | Modular TypeScript architecture, clear decoupling | **PASS** | Decoupled URI generator (`uri.ts`) and QR encoder (`qr.ts`) cleanly separable from renderer. |
| **III. Minimal External Dependencies** | Lightweight pure JS/TS dependencies, no native binaries | **PASS** | Uses existing pure-JS `qrcode` dependency. Zero native C/C++ dependencies in runtime bundle. |
| **IV. Flexibility** | Configurable QR parameters, dimensions, and error correction | **PASS** | Selectable error correction levels (L, M, Q, H), customizable margins, and high-contrast color pairs. |
| **V. User Experience** | Native Obsidian integration, clear diagnostics, regeneration | **PASS** | Native `app.getObsidianUrl()` integration; clear validation diagnostics; regeneration for renames. |
| **VI. Cross-Platform Compatibility** | Universal standard outputs, no OS-specific code | **PASS** | URIs adhere universally across iOS, Android, macOS, Windows, and Linux. |

*Gate Status: ALL GATES PASS (Zero violations).*

## Project Structure

### Documentation (this feature)

```text
specs/002-obsidian-uri-qr/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Technical research & RFC findings
├── data-model.md        # Phase 1: Entity definitions & validation rules
├── quickstart.md        # Phase 1: Verification scenarios & test guide
├── contracts/           # Phase 1: TypeScript interface contracts
│   ├── uri-generator.ts # Contract for Obsidian URI generator
│   └── qr-encoder.ts    # Contract for QR matrix & data URL encoder
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
│   ├── pdf-exporter.ts      # jsPDF export wrapper
│   ├── presets.ts           # Standard hardware presets
│   ├── qr.ts                # QR matrix generator & canvas drawer (extended with data URL)
│   ├── types.ts             # Core type definitions & interfaces
│   ├── typography.ts        # Text rendering & line wrapping
│   ├── uri.ts               # NEW: Obsidian URI generation & RFC 3986 encoding
│   └── validator.ts         # Validation rules (extended with URI & QR options)
├── index.ts                 # Public module exports
└── main.ts                  # Obsidian plugin entrypoint

tests/
├── unit/
│   ├── uri.test.ts          # NEW: Unit tests for URI generator & RFC 3986 encoding
│   ├── qr.test.ts           # Unit tests for QR matrix, options, and data URL
│   ├── validator.test.ts    # Unit tests for validation rules
│   └── ...
└── integration/
    └── label-generator.test.ts # End-to-end integration tests
```

**Structure Decision**: Maintains the single-project modular architecture established in Feature 001. New functionality is encapsulated cleanly in `src/core/uri.ts` and enhanced in `src/core/qr.ts` and `src/core/validator.ts`, with full re-export from `src/index.ts`.

## Complexity Tracking

*No violations to justify. Architecture adheres strictly to all constitutional principles.*
