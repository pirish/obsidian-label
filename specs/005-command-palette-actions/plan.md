# Implementation Plan: Command Palette Label Actions & Batch Generation

**Branch**: `005-command-palette-actions` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-command-palette-actions/spec.md`

## Summary

This feature adds native Obsidian Command Palette integration for rapid keyboard-driven label generation. It implements three commands:
1. `generate-label-current-note`: Instant label generation for the active note using active settings.
2. `generate-label-custom`: Opens `CustomLabelModal` allowing per-note overrides (preset, custom dimensions, QR placement) with an optional toggle to save overrides into the note's frontmatter.
3. `regenerate-all-labels`: Batch regeneration pass that presents a `BatchConfirmModal` before updating all notes in the vault that already have existing label PDFs, skipping `.trash`, `.obsidian`, and template folders.

## Technical Context

**Language/Version**: TypeScript 5.7+ (targeting ECMAScript 2022 / Node 22 / Obsidian Runtime)  
**Primary Dependencies**: `obsidian` (Community Plugin API: `Plugin`, `Command`, `checkCallback`, `Modal`, `Notice`, `TFile`, `App`), `jspdf` (^2.5.2), `qrcode` (^1.5.4)  
**Storage**: Local Obsidian Vault files (`.pdf`), note YAML frontmatter, plugin `data.json`  
**Testing**: Jest 29+ (`ts-jest`), `canvas` (^3.1.0), mock Obsidian UI test harness (`tests/mocks/obsidian.ts`)  
**Target Platform**: Obsidian Desktop (Windows, macOS, Linux)  
**Project Type**: Obsidian Community Plugin commands, modal dialogs, and batch file processing  
**Performance Goals**: Active note generation in <1000ms; batch regeneration at >= 5 labels/sec without freezing UI; palette command check in <10ms  
**Constraints**: 100% offline, zero network requests or telemetry, non-blocking asynchronous batch iteration  
**Scale/Scope**:
- Commands registration and orchestrator service (`src/commands/`)
- Modal dialogs (`src/ui/custom-label-modal.ts`, `src/ui/batch-confirm-modal.ts`)
- Plugin entrypoint integration (`src/main.ts`)
- Unit and integration tests (`tests/unit/`, `tests/integration/`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|---|---|---|---|
| **I. Privacy First** | Local execution, 0 telemetry, 0 network | **PASS** | Commands and batch operations execute strictly locally within the active vault. |
| **II. Design for Scale** | Modular commands, decoupled orchestration | **PASS** | Command logic is cleanly abstracted into reusable services and modals. |
| **III. Minimal External Dependencies** | Uses official Obsidian Plugin API only | **PASS** | Leverages standard `addCommand`, `checkCallback`, `Modal`, `Notice`, and `processFrontMatter`. |
| **IV. Flexibility** | Configurable presets, per-note overrides, frontmatter defaults | **PASS** | 3-tier hierarchy: modal overrides > note frontmatter > global plugin defaults. |
| **V. User Experience** | Native Command Palette, confirmation dialogs, notice feedback | **PASS** | Instant palette execution, safety confirmation modal, and summary notices. |
| **VI. Cross-Platform Compatibility** | Universal PDF output, platform-independent path handling | **PASS** | Works across Windows, macOS, and Linux without native binaries. |

*Gate Status: ALL GATES PASS (Zero violations).*

## Project Structure

### Documentation (this feature)

```text
specs/005-command-palette-actions/
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Entities: CustomLabelOverride, Frontmatter, BatchRegenerateResult
├── quickstart.md        # Runnable verification scenarios
├── contracts/           # TypeScript interface contracts
│   └── commands.ts      # Command handlers, modal dialogs, and orchestrator contracts
├── checklists/
│   └── requirements.md  # Specification quality checklist
├── spec.md              # Feature specification
└── tasks.md             # Actionable task list (created by /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── commands/                   # NEW: Command actions & orchestrator
│   ├── orchestrator.ts         # Note settings resolver & generateLabelForNote
│   ├── batch-processor.ts      # Vault scan & batch regeneration service
│   └── register.ts             # Plugin command registration helpers
├── core/                       # Core generation engine (Features 001-003)
├── settings/                   # Settings models & mappers (Feature 004)
├── ui/                         # UI components
│   ├── settings-tab.ts         # Plugin settings tab (Feature 004)
│   ├── preview-modal.ts        # Preview modal (Feature 004)
│   ├── custom-label-modal.ts   # NEW: Per-note custom settings modal
│   └── batch-confirm-modal.ts  # NEW: Batch regeneration confirmation modal
├── index.ts                    # Public module exports
└── main.ts                     # Obsidian plugin entrypoint

tests/
├── mocks/
│   └── obsidian.ts             # Mock Obsidian API harness (App, TFile, Command, Modal)
├── unit/
│   ├── commands.test.ts        # NEW: Command registration and conditional callbacks
│   ├── orchestrator.test.ts    # NEW: Frontmatter resolution and label generation
│   ├── custom-label-modal.test.ts # NEW: Custom modal overrides & frontmatter saving
│   └── batch-regeneration.test.ts # NEW: Batch existing PDF filtering & confirmation
└── integration/
    └── commands-integration.test.ts # NEW: End-to-end command palette & batch scenarios
```

**Structure Decision**: Adds `src/commands/` for command logic, orchestrator services, and batch processing, and places new modal dialogs in `src/ui/`.

## Complexity Tracking

*No violations to justify. Architecture adheres strictly to all constitutional principles.*
