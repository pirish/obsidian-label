# Implementation Plan: File Explorer Context Menu Label Action

**Branch**: `006-file-context-menu` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-file-context-menu/spec.md`

## Summary

This feature adds native Obsidian file context menu integration (`file-menu` and `files-menu` events) for instant, mouse-driven label generation.
1. Right-clicking an individual Markdown note in the file explorer (or any file navigation surface) adds a `"Generate Label"` menu item with a `tag` icon that instantly generates and exports a label PDF using active settings.
2. Multi-selecting files and right-clicking adds a `"Generate Labels"` menu item when at least one Markdown note is selected, batch-generating labels for all selected notes and reporting a summary notice.
3. Folders and non-markdown assets are strictly excluded.

## Technical Context

**Language/Version**: TypeScript 5.7+ (targeting ECMAScript 2022 / Node 22 / Obsidian Runtime)  
**Primary Dependencies**: `obsidian` (Community Plugin API: `Plugin`, `TFile`, `TAbstractFile`, `Menu`, `MenuItem`, `Notice`, `Workspace`), `jspdf` (^2.5.2), `qrcode` (^1.5.4)  
**Storage**: Local Obsidian Vault files (`.pdf`), note YAML frontmatter  
**Testing**: Jest 29+ (`ts-jest`), `canvas` (^3.1.0), mock Obsidian UI test harness (`tests/mocks/obsidian.ts`)  
**Target Platform**: Obsidian Desktop (Windows, macOS, Linux)  
**Project Type**: Obsidian Community Plugin workspace event listeners and context menu integration  
**Performance Goals**: Context menu item injection in <5ms; note label generation from menu in <1000ms  
**Constraints**: 100% offline, zero network requests, native Obsidian workspace events (`file-menu`, `files-menu`), automatic event detachment on plugin unload via `registerEvent`  
**Scale/Scope**:
- Context menu service (`src/commands/context-menu.ts`)
- Plugin entrypoint event wiring (`src/main.ts`)
- Mock harness extensions (`tests/mocks/obsidian.ts`)
- Unit and integration tests (`tests/unit/context-menu.test.ts`, `tests/integration/context-menu-integration.test.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|---|---|---|---|
| **I. Privacy First** | Local execution, 0 telemetry, 0 network | **PASS** | File context menu operations execute 100% locally within the vault. |
| **II. Design for Scale** | Clean decoupling, reusable orchestrator | **PASS** | Reuses existing `generateLabelForNote` engine; menu event logic is isolated in `src/commands/context-menu.ts`. |
| **III. Minimal External Dependencies** | Uses native Obsidian API only | **PASS** | Uses native `workspace.on('file-menu')`, `workspace.on('files-menu')`, `menu.addItem`. |
| **IV. Flexibility** | Honors per-note YAML frontmatter overrides | **PASS** | Uses established settings resolution hierarchy (`frontmatter > globalSettings`). |
| **V. User Experience** | Native file explorer context menu integration | **PASS** | Directly fulfills Constitution Principle V requirement: *"The plugin MUST integrate seamlessly into native Obsidian workflows via the Command Palette... and file explorer context menus."* |
| **VI. Cross-Platform Compatibility** | Universal PDF output across desktop OSs | **PASS** | Works across Windows, macOS, and Linux without native OS binaries. |

*Gate Status: ALL GATES PASS (Zero violations).*

## Project Structure

### Documentation (this feature)

```text
specs/006-file-context-menu/
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Entities: FileContextMenuContext, MultiFileGenerationResult
├── quickstart.md        # Runnable verification scenarios
├── contracts/           # TypeScript interface contracts
│   └── context-menu.ts  # File menu event handlers and service interfaces
├── checklists/
│   └── requirements.md  # Specification quality checklist
├── spec.md              # Feature specification
└── tasks.md             # Actionable task list (created by /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── commands/                   # Command & menu actions
│   ├── orchestrator.ts         # Note settings resolver & generateLabelForNote (Feature 005)
│   ├── batch-processor.ts      # Vault scan & batch regeneration service (Feature 005)
│   ├── register.ts             # Palette command registration (Feature 005)
│   └── context-menu.ts         # NEW: file-menu & files-menu event registration and multi-file runner
├── core/                       # Core generation engine (Features 001-003)
├── settings/                   # Settings models & mappers (Feature 004)
├── ui/                         # UI modals (Features 004-005)
├── index.ts                    # Public module exports
└── main.ts                     # Obsidian plugin entrypoint (wires registerFileMenuEvents)

tests/
├── mocks/
│   └── obsidian.ts             # Mock Obsidian API harness (Menu, MenuItem, Workspace events)
├── unit/
│   └── context-menu.test.ts    # NEW: Unit tests for file-menu and files-menu handlers
└── integration/
    └── context-menu-integration.test.ts # NEW: Integration test for explorer menu workflows
```

**Structure Decision**: Adds `src/commands/context-menu.ts` to manage workspace file menu events and multi-file execution, alongside existing palette commands in `src/commands/`.

## Complexity Tracking

*No violations to justify. Architecture adheres strictly to all constitutional principles.*
