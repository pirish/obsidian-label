# Tasks: Core Label Generation Engine

**Feature**: Core Label Generation Engine  
**Directory**: `specs/001-label-generation-engine`  
**Date**: 2026-09-25  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency management, and build configuration.

- [x] T001 Initialize TypeScript project configuration and npm scripts in `package.json` and `tsconfig.json`
- [x] T002 [P] Configure code formatting and linting rules in `.eslintrc.js` and `.prettierrc`
- [x] T003 [P] Configure Jest test runner and TypeScript preprocessor in `jest.config.js`
- [x] T004 [P] Install and configure core runtime dependencies (`qrcode`, `jspdf`) and test types in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core mathematical models, contracts, and validation infrastructure that MUST be complete before user stories begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 [P] Create core TypeScript type definitions and interfaces in `src/core/types.ts` (matching contracts/label-engine-api.ts)
- [x] T006 [P] Implement physical millimeter to pixel DPI conversion functions in `src/core/dimensions.ts`
- [x] T007 [P] Implement configuration and content validation engine with structured diagnostic errors in `src/core/validator.ts`
- [x] T008 [P] Implement pure TypeScript/JS QR matrix generator with Error Correction Level M default in `src/core/qr.ts`
- [x] T009 [P] Write unit tests for physical dimension math in `tests/unit/dimensions.test.ts`
- [x] T010 [P] Write unit tests for configuration validator rules in `tests/unit/validator.test.ts`
- [x] T011 [P] Write unit tests for QR matrix generation and Obsidian URI encoding in `tests/unit/qr.test.ts`

**Checkpoint**: Foundation ready — User Story 1 (MVP) implementation can now begin.

---

## Phase 3: User Story 1 - Single Note Label Generation with QR Code (Priority: P1) 🎯 MVP

**Goal**: Generate a standard physical label for an active note containing its title and an instantly scannable `obsidian://` QR code with dual output (instant PNG preview data URL and print-ready PDF bytes).

**Independent Test**: Provide note title and Obsidian URI, execute generator with default dimensions (40x30mm) and left QR placement, and verify output yields valid base64 PNG data URL and valid `%PDF` document bytes encoding the exact URI.

### Tests for User Story 1 ⚠️

- [x] T012 [P] [US1] Write unit tests for basic layout positioning and dual-output generation in `tests/unit/generator.test.ts`

### Implementation for User Story 1

- [x] T013 [P] [US1] Implement basic typography word-wrapping and baseline drawing in `src/core/typography.ts`
- [x] T014 [US1] Implement 2D Canvas renderer for QR code placement (left) and note title in `src/core/canvas-renderer.ts`
- [x] T015 [US1] Implement client-side PDF document compiler producing binary bytes from canvas output in `src/core/pdf-exporter.ts`
- [x] T016 [US1] Implement core `LabelGenerator` class coordinating validation, canvas rendering, and PDF export in `src/core/label-generator.ts`
- [x] T017 [US1] Export public API contract and instantiate default generator in `src/index.ts`
- [x] T018 [US1] Write integration test verifying end-to-end P1 MVP label generation and QR optical scannability in `tests/integration/e2e-generation.test.ts`

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Customizable Layout, Styling, and Metadata Display (Priority: P2)

**Goal**: Enable custom spatial arrangements (QR placement: right, top, bottom, center), margins, visual styles (colors, fonts, borders), and custom metadata rendering (vertical stack or horizontal inline with custom separators) with dynamic font scaling down to 6pt.

**Independent Test**: Provide note metadata with custom fields, switch QR placements and styling options, and verify that text auto-scales, metadata renders in secondary typography, and borders render cleanly without overlapping the QR code.

### Tests for User Story 2 ⚠️

- [x] T019 [P] [US2] Write unit tests for dynamic font scaling and boundary truncation in `tests/unit/typography.test.ts`
- [x] T020 [P] [US2] Write unit tests for spatial layout strategies (right, top, bottom, center) in `tests/unit/layout.test.ts`

### Implementation for User Story 2

- [x] T021 [US2] Implement spatial partitioning and coordinate calculation for all QR placement options in `src/core/layout.ts`
- [x] T022 [US2] Implement dynamic font scaling down to minimum font size (6pt) with ellipsis truncation on overflow in `src/core/typography.ts`
- [x] T023 [US2] Implement custom metadata formatting (orientation: vertical/horizontal, custom separators) in `src/core/typography.ts`
- [x] T024 [US2] Implement custom styling rendering (perimeter border stroke, background fill, font family/color) in `src/core/canvas-renderer.ts`
- [x] T025 [US2] Integrate layout and styling enhancements into `LabelGenerator` in `src/core/label-generator.ts`
- [x] T026 [US2] Add integration test scenarios for custom styling, metadata orientation, and long title auto-scaling in `tests/integration/e2e-generation.test.ts`

**Checkpoint**: User Stories 1 AND 2 are functional and independently testable.

---

## Phase 5: User Story 3 - Label Format Presets & Custom Physical Sizing (Priority: P3)

**Goal**: Provide built-in commercial hardware presets (Phomemo 40x30mm, Dymo 89x28mm, Brother 62x100mm, Avery 5160 66.7x25.4mm) and support arbitrary custom physical dimensions in millimeters at target DPI.

**Independent Test**: Switch between all standard presets and custom dimensions, verifying that generated pixel dimensions match millimeter calculations within 0.5mm tolerance at 300 DPI.

### Implementation for User Story 3

- [x] T027 [P] [US3] Define standard hardware preset catalog (Phomemo, Dymo, Brother, Avery 5160) with default layouts in `src/core/presets.ts`
- [x] T028 [US3] Implement `getPreset(id)` and `listPresets()` methods in `src/core/label-generator.ts`
- [x] T029 [US3] Add preset lookup exports to public module entrypoint in `src/index.ts`
- [x] T030 [P] [US3] Add integration tests validating all built-in presets and custom mm dimension scaling in `tests/integration/e2e-generation.test.ts`

**Checkpoint**: All three user stories are completely implemented and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Packaging, documentation, and end-to-end verification.

- [x] T031 Create minimal Obsidian plugin lifecycle entrypoint stub importing the generator in `src/main.ts`
- [x] T032 [P] Add comprehensive JSDoc comments to public interfaces in `src/core/types.ts`
- [x] T033 Execute complete end-to-end quickstart validation scenarios defined in `specs/001-label-generation-engine/quickstart.md`
- [x] T034 Run full test suite, linter, and typechecker ensuring zero errors (`npm run lint && npm test && npx tsc --noEmit`)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
     │
     ▼
Phase 2: Foundational (Blocking Prerequisites)
     │
     ▼
Phase 3: User Story 1 (P1 MVP)
     │
     ▼
Phase 4: User Story 2 (P2 Layout & Styling)
     │
     ▼
Phase 5: User Story 3 (P3 Presets & Sizing)
     │
     ▼
Phase 6: Polish & Verification
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational (Phase 2). Delivers standalone MVP value.
- **User Story 2 (P2)**: Depends on User Story 1 canvas renderer and typography foundation.
- **User Story 3 (P3)**: Depends on core generator; integrates preset configurations.

### Parallel Opportunities

- **Setup Phase**: T002, T003, and T004 can be executed concurrently once T001 is created.
- **Foundational Phase**: T005, T006, T007, and T008 can be developed in parallel, followed by test suites T009, T010, and T011 in parallel.
- **User Story 1**: T012 and T013 can be drafted in parallel before integrating into T014, T015, and T016.
- **User Story 2**: T019, T020 can be written in parallel before completing layout/scaling in T021-T025.
- **User Story 3**: T027 and T030 can be created concurrently.

---

## Parallel Example: User Story 1

```bash
# Launch parallel model/utility tasks:
Task: "Implement basic typography word-wrapping and baseline drawing in src/core/typography.ts"
Task: "Write unit tests for basic layout positioning and dual-output generation in tests/unit/generator.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`package.json`, `tsconfig.json`, `jest.config.js`).
2. Complete Phase 2: Foundational (Types, Dimensions, Validator, QR matrix generator).
3. Complete Phase 3: User Story 1 (Basic Typography, Canvas Renderer, PDF Exporter, `LabelGenerator`).
4. **STOP and VALIDATE**: Verify that a 40x30mm label with title and Obsidian QR code generates valid preview data URL and PDF data.

### Incremental Delivery

1. Setup + Foundation $\to$ Core building blocks validated with unit tests.
2. User Story 1 $\to$ Functional MVP producing scannable physical labels.
3. User Story 2 $\to$ Advanced layout placements, dynamic typography scaling, custom fields, and borders.
4. User Story 3 $\to$ Hardware preset catalog (Phomemo, Dymo, Brother, Avery).
5. Polish $\to$ Full validation against `quickstart.md` and typecheck.
