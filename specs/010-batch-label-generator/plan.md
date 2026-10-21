# Implementation Plan: Batch Label Generator

**Branch**: `010-batch-label-generator` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-batch-label-generator/spec.md`

## Summary

Add a **Batch Label Generator** workflow (`BatchLabelModal` and `ProgressModal`) accessible from the Obsidian Command Palette (`Batch Label Generation`) that allows users to:
1. Select multiple Markdown notes across the vault by **Folder** (with an `"Include subfolders"` toggle defaulting to enabled), by **Tag** (normalizing `#tag` and `tag` across frontmatter and inline tags), or by **Search query** (matching paths, titles, and note body content).
2. Preview the live count (`<N> labels will be generated` or `No notes selected`) and sample list of up to 10 matching note paths (`... and <N - 10> more` when `> 10`), enabling the `Generate Labels` CTA button only when 1 or more notes match.
3. Generate labels sequentially with a live `ProgressModal` (`0 / <total>` status counter and `0%–100%` progress bar) while catching and logging individual note failures so the rest of the batch completes uninterrupted.
4. Optionally merge all generated labels from the batch into a single multi-page PDF document (`labels_batch_YYYY-MM-DD.pdf`) while retaining each note's individual label PDF, controlled via `mergeBatchPDFs` in both the plugin Settings tab and `BatchLabelModal`.

## Technical Context

**Language/Version**: TypeScript 5.7+ (ES2022 target)  
**Primary Dependencies**: `obsidian` (Plugin API), `jspdf` (`^2.5.2`), `qrcode` (`^1.5.4`)  
**Storage**: Local Obsidian Vault filesystem (`app.vault.adapter.writeBinary`, `app.vault.adapter.readBinary`, `plugin.loadData` / `plugin.saveData`)  
**Testing**: Jest 29 + `ts-jest` + `canvas` (Node HTML5 Canvas test environment)  
**Target Platform**: Obsidian Desktop (Windows, macOS, Linux)  
**Project Type**: Obsidian Community Plugin  
**Performance Goals**: Live preview filtering for 500+ vault notes in <50ms; non-blocking sequential batch generation with UI progress updates after each note  
**Constraints**: 100% offline execution; zero new external npm dependencies (reuse `jspdf` for multi-page PDF generation); strict TypeScript and ESLint compliance  
**Scale/Scope**: Vaults containing 10 to 1,000+ Markdown notes across nested folder hierarchies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Pre-Design Status | Post-Design Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **I. Privacy First** | PASS | PASS | All note filtering, label rendering, and multi-page PDF merging execute 100% locally inside the user's vault with zero network calls. |
| **II. Design for Scale** | PASS | PASS | Note filtering logic (`filterNotesByFolder`, `filterNotesByTag`, `filterNotesBySearch`) and multi-page PDF export (`mergeBatchPDFPages`) are cleanly separated from modal UI components (`BatchLabelModal`, `ProgressModal`). |
| **III. Minimal External Dependencies** | PASS | PASS | Multi-page PDF merging reuses the existing `jspdf` dependency (`doc.addPage([widthMm, heightMm], orientation)`) and Obsidian's `vault.adapter` API without adding `pdf-lib` or any new external package. |
| **IV. Flexibility** | PASS | PASS | Respects per-note frontmatter overrides and templates during batch runs; preserves individual page dimensions (`widthMm × heightMm`) in merged multi-page PDFs. |
| **V. User Experience** | PASS | PASS | Integrates into Command Palette, shows live selection preview before batch execution, provides `ProgressModal` feedback, and suppresses per-note notification/auto-print spam during batch runs. |
| **VI. Cross-Platform Compatibility** | PASS | PASS | Normalizes `/` and `\` path separators across Windows, macOS, and Linux; outputs universal multi-page PDFs. |

## Project Structure

### Documentation (this feature)

```text
specs/010-batch-label-generator/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── batch-generator-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── commands/
│   ├── batch-processor.ts       # Extend with folder/tag/search note filters & batch page cache
│   ├── orchestrator.ts          # Per-note label generation & effective settings resolution
│   └── register.ts              # Register 'batch-generate-labels' Command Palette command
├── core/
│   └── pdf-exporter.ts          # Add multi-page PDF assembly helper using jsPDF
├── settings/
│   └── types.ts                 # Add mergeBatchPDFs: boolean (default: false) to ObsidianLabelSettings
├── ui/
│   ├── batch-label-modal.ts     # NEW: BatchLabelModal (folder/tag/search UI, preview, batch runner, mergePDFs)
│   ├── progress-modal.ts        # NEW: ProgressModal (0 / N counter & percentage progress bar)
│   └── settings-tab.ts          # Add 'Merge Batch PDFs' toggle in PDF Export & Storage section
├── index.ts                     # Export BatchLabelModal, ProgressModal, and batch filter helpers
└── main.ts                      # Add generateLabelForNote(note) & openBatchLabelModal() on ObsidianLabelPlugin

tests/
├── mocks/
│   └── obsidian.ts              # Support string cls shorthand in createDiv/createEl & adapter.readBinary
├── unit/
│   ├── batch-filter.test.ts     # NEW: Unit tests for folder (recursive/direct), tag, and search filtering
│   ├── progress-modal.test.ts   # NEW: Unit tests for ProgressModal DOM & progress bar updates
│   └── batch-label-modal.test.ts# NEW: Unit tests for BatchLabelModal preview, fault tolerance & PDF merging
└── integration/
    └── batch-generator-integration.test.ts # NEW: End-to-end command palette -> BatchLabelModal -> multi-page PDF test
```

**Structure Decision**: Single-project Obsidian plugin layout matching Features 001–009. New UI modals live in `src/ui/batch-label-modal.ts` and `src/ui/progress-modal.ts`, reusable filtering logic lives in `src/commands/batch-processor.ts`, and multi-page PDF compilation lives in `src/core/pdf-exporter.ts`.

## Complexity Tracking

No Constitution violations—table not required.
