---

description: "Task list for Feature 010: Batch Label Generator"
---

# Tasks: Batch Label Generator

**Input**: Design documents from `/specs/010-batch-label-generator/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit and integration tests are included per the project's Constitution testing gate and feature specification.

**Organization**: Tasks are grouped by user story (`US1`, `US2`, `US3`) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`, `US3`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend mock test harness and settings schema required across all batch generator stories

- [X] T001 Extend `MockHTMLElement` (`createEl`, `createDiv`, `createSpan` string class shorthand) and `App.vault.adapter.readBinary` / `cachedRead` in `tests/mocks/obsidian.ts`
- [X] T002 [P] Add `mergeBatchPDFs: boolean` (default `false`) to `ObsidianLabelSettings` and `DEFAULT_SETTINGS` in `src/settings/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core batch selection filtering types and multi-page PDF export primitives that support the user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Define `BatchSelectionMethod`, `BatchSelectionCriteria`, and `BatchPageEntry` interfaces and implement `discoverVaultFolders`, `filterNotesByFolder` (supporting `includeSubfolders`), `filterNotesByTag` (normalizing `#tag` and `tag`), and `filterNotesBySearch` in `src/commands/batch-processor.ts`
- [X] T004 [P] Implement `mergeBatchPDFPages` multi-page PDF builder using `jsPDF` (`doc.addPage([widthMm, heightMm], orientation)`) in `src/core/pdf-exporter.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Multi-Criteria Note Selection & Batch Generation (Priority: P1) 🎯 MVP

**Goal**: Allow users to open `BatchLabelModal` from the Command Palette, filter notes by folder (with `"Include subfolders"` toggle), tag, or search query, preview the matched count and up to 10 note paths (`... and X more`), and generate labels for all selected notes.

**Independent Test**: Open `BatchLabelModal` from the Command Palette, select notes by folder (toggling `"Include subfolders"`), by tag, and by search query, verify the preview count and list update accurately (and `"Generate Labels"` enables only when `> 0` notes match), and trigger batch label generation.

### Tests for User Story 1

- [X] T005 [P] [US1] Write unit tests for `discoverVaultFolders`, `filterNotesByFolder` (recursive vs direct children, hidden/template exclusions), `filterNotesByTag` (`#tag` and `tag` in frontmatter & inline), and `filterNotesBySearch` in `tests/unit/batch-filter.test.ts`
- [X] T006 [P] [US1] Write unit tests for `BatchLabelModal` selection modes, preview list rendering (`0`, `<= 10`, `> 10` notes), and CTA button disabled/enabled state in `tests/unit/batch-label-modal.test.ts`

### Implementation for User Story 1

- [X] T007 [US1] Implement `BatchLabelModal` (`onOpen`, `showSelectionUI` for `'folder'` with `"Include subfolders"` toggle, `'tag'`, and `'search'`, and `updatePreview`) in `src/ui/batch-label-modal.ts`
- [X] T008 [US1] Add `generateLabelForNote(file: TFile)` (returning `filePath` and caching rendered page dimensions/image for batch runs) and `openBatchLabelModal()` to `ObsidianLabelPlugin` in `src/main.ts`
- [X] T009 [US1] Register the `batch-generate-labels` (`Batch Label Generation`) Command Palette command in `src/commands/register.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Live Progress Feedback & Fault-Tolerant Execution (Priority: P2)

**Goal**: Display a live `ProgressModal` (`0 / <total>` status counter and `0%–100%` progress bar) during batch generation while catching and logging individual note errors so remaining notes complete and the final notice reports the successful label count.

**Independent Test**: Run batch generation across multiple notes where one note throws an error, verify `ProgressModal` updates from `0 / N` (`0%`) to `N / N` (`100%`) and closes on completion, verify remaining notes still generate labels, and verify the final notice states `Generated <count> labels`.

### Tests for User Story 2

- [X] T010 [P] [US2] Write unit tests for `ProgressModal` initialization (`0 / total`, `0%`) and `update(current)` (`current / total`, `${percentage}%`) in `tests/unit/progress-modal.test.ts`
- [X] T011 [P] [US2] Add unit tests for `BatchLabelModal.generateBatchLabels()` progress tracking, fault-tolerant continuation on single-note error, and final `Generated <count> labels` notice in `tests/unit/batch-label-modal.test.ts`

### Implementation for User Story 2

- [X] T012 [P] [US2] Implement `ProgressModal` (`total`, `current`, `progressBar`, `statusText`, `onOpen`, `update`) in `src/ui/progress-modal.ts`
- [X] T013 [US2] Integrate `ProgressModal`, sequential per-note error handling (`console.error(\`Failed to generate label for ${note.path}:\`, error)`), and completion notice (`Generated ${pdfPaths.length} labels`) into `BatchLabelModal.generateBatchLabels()` in `src/ui/batch-label-modal.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Optional Multi-Page Merged PDF Output (Priority: P3)

**Goal**: Allow users to enable `mergeBatchPDFs` (in both the plugin Settings tab and `BatchLabelModal`) to combine all generated labels from a batch run into a consolidated multi-page PDF (`labels_batch_YYYY-MM-DD.pdf`) while retaining each note's individual label PDF.

**Independent Test**: Enable `mergeBatchPDFs`, generate a batch of 3 notes, and verify that all 3 individual label PDFs are retained AND `labels_batch_YYYY-MM-DD.pdf` is written to the vault with 3 pages and announced via `Merged PDF created: labels_batch_YYYY-MM-DD.pdf`.

### Tests for User Story 3

- [X] T014 [P] [US3] Add unit tests for `BatchLabelModal.mergePDFs(pdfPaths)` and `mergeBatchPDFs` toggle behavior in `tests/unit/batch-label-modal.test.ts`
- [X] T015 [P] [US3] Write end-to-end integration tests covering Command Palette invocation, folder/tag/search batch generation, fault tolerance, and multi-page `labels_batch_YYYY-MM-DD.pdf` creation in `tests/integration/batch-generator-integration.test.ts`

### Implementation for User Story 3

- [X] T016 [P] [US3] Add `mergeBatchPDFsToggle` (`Merge Batch PDFs into Single File`) under `PDF Export & Storage` in `src/ui/settings-tab.ts`
- [X] T017 [US3] Implement `mergePDFs(pdfPaths: string[]): Promise<string>` and the `"Merge into single multi-page PDF"` toggle inside `BatchLabelModal` in `src/ui/batch-label-modal.ts`

**Checkpoint**: All user stories (`US1`, `US2`, `US3`) are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Public exports, documentation updates, and full quality-gate validation

- [X] T018 [P] Export `BatchLabelModal`, `ProgressModal`, `mergeBatchPDFPages`, and batch note filter functions in `src/index.ts`
- [X] T019 [P] Document the Batch Label Generation workflow (`BatchLabelModal`, folder/tag/search filters, and multi-page PDF merging) in `README.md`
- [X] T020 Run full verification suite (`npx tsc --noEmit`, `npm run lint`, `npm run format`, and `npm test`) per `specs/010-batch-label-generator/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately (`T001`, `T002`)
- **Foundational (Phase 2)**: Depends on Setup completion (`T003`, `T004`) - BLOCKS all user stories
- **User Story 1 (Phase 3 - P1)**: Depends on Phase 2 (`T005`–`T009`)
- **User Story 2 (Phase 4 - P2)**: Depends on Phase 2 and integrates into `BatchLabelModal` (`T010`–`T013`)
- **User Story 3 (Phase 5 - P3)**: Depends on Phase 2 and integrates into `BatchLabelModal` and `ObsidianLabelSettingTab` (`T014`–`T017`)
- **Polish (Phase 6)**: Depends on Phases 3–5 completion (`T018`–`T020`)

### Parallel Opportunities

- **Phase 1**: `T001` (`tests/mocks/obsidian.ts`) and `T002` (`src/settings/types.ts`) can run in parallel.
- **Phase 2**: `T003` (`src/commands/batch-processor.ts`) and `T004` (`src/core/pdf-exporter.ts`) can run in parallel.
- **Phase 3 (US1)**: `T005` (`tests/unit/batch-filter.test.ts`) and `T006` (`tests/unit/batch-label-modal.test.ts`) can run in parallel.
- **Phase 4 (US2)**: `T010` (`tests/unit/progress-modal.test.ts`), `T011` (`tests/unit/batch-label-modal.test.ts`), and `T012` (`src/ui/progress-modal.ts`) can run in parallel.
- **Phase 5 (US3)**: `T014` (`tests/unit/batch-label-modal.test.ts`), `T015` (`tests/integration/batch-generator-integration.test.ts`), and `T016` (`src/ui/settings-tab.ts`) can run in parallel.
- **Phase 6**: `T018` (`src/index.ts`) and `T019` (`README.md`) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Run US1 unit test tasks in parallel:
Task: "T005 [P] [US1] Write unit tests for discoverVaultFolders, filterNotesByFolder, filterNotesByTag, and filterNotesBySearch in tests/unit/batch-filter.test.ts"
Task: "T006 [P] [US1] Write unit tests for BatchLabelModal selection modes, preview list rendering, and CTA button state in tests/unit/batch-label-modal.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`–`T002`)
2. Complete Phase 2: Foundational (`T003`–`T004`)
3. Complete Phase 3: User Story 1 (`T005`–`T009`)
4. **STOP and VALIDATE**: Verify multi-criteria note selection and preview in `BatchLabelModal`

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (`US1`) → Note selection & batch generation MVP
3. Add User Story 2 (`US2`) → `ProgressModal` & fault-tolerant execution
4. Add User Story 3 (`US3`) → Multi-page PDF merging (`labels_batch_YYYY-MM-DD.pdf`) & Settings toggle
5. Complete Polish (`T018`–`T020`) → Ready for release
