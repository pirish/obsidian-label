# Quickstart & Verification Guide: PDF Export for Physical Label Printing

**Feature**: `specs/003-pdf-export`  
**Date**: 2026-10-04  
**Status**: Ready for Verification

This guide outlines runnable verification scenarios to validate that PDF export, physical dimension sizing, vault storage path resolution, recursive directory creation, and clean regeneration function correctly end-to-end.

---

## 1. Prerequisites & Environment Setup

Verify Node.js (v18+) and ensure test suite passes:

```bash
node -v
npm test
```

---

## 2. Verification Scenarios

### Scenario 1: Exact-Dimension Print-Ready PDF Generation (User Story 1 - P1 MVP)

**Objective**: Verify exported PDF documents match configured physical dimensions in millimeters with correct orientation and edge-to-edge content.

**Execution**:
```bash
npx jest tests/unit/pdf-exporter.test.ts -t "Exact Dimensions"
```

**Expected Outcome**:
- 40mm x 30mm produces landscape orientation with exact page dimensions `[40, 30]`.
- 30mm x 50mm produces portrait orientation with exact page dimensions `[30, 50]`.
- PDF binary buffer begins with standard magic header `%PDF-`.

---

### Scenario 2: Configurable Vault Storage Location Resolution (User Story 2 - P2)

**Objective**: Verify correct destination path resolution across all three storage location modes.

**Execution**:
```bash
npx jest tests/unit/pdf-exporter.test.ts -t "Path Resolution"
```

**Expected Outcome**:
- `same-folder`: `Technology/Projects/MyNote.md` → `Technology/Projects/MyNote_label.pdf`.
- `same-folder` for root note: `MyNote.md` → `MyNote_label.pdf` (no leading `/`).
- `dedicated-folder`: `Technology/Projects/MyNote.md` → `_labels/MyNote_label.pdf`.
- `custom-folder`: `PrintQueue/Pending/` → `PrintQueue/Pending/MyNote_label.pdf`.

---

### Scenario 3: Recursive Directory Auto-Creation & Vault Persistence (User Story 2 - P2)

**Objective**: Verify missing vault directories are automatically created before writing PDF files.

**Execution**:
```bash
npx jest tests/unit/pdf-exporter.test.ts -t "Vault Directory Creation"
```

**Expected Outcome**:
- Non-existent folder paths (e.g. `Archive/Labels/2026/`) trigger recursive folder creation.
- Binary data is persisted to vault without throwing `ENOENT` errors.

---

### Scenario 4: Standardized Filename Formatting & Timestamp Toggles (User Story 3 - P3)

**Objective**: Verify filename generation adheres to `[NoteName]_label.pdf` with optional date stamps.

**Execution**:
```bash
npx jest tests/unit/pdf-exporter.test.ts -t "Filename Generation"
```

**Expected Outcome**:
- Default (no timestamp): `MyNote_label.pdf`.
- With timestamp: `MyNote_label_2026-10-04.pdf`.
- Special characters in note name (e.g. spaces, `&`, `+`) produce valid, sanitized filenames.

---

### Scenario 5: Clean Overwrite on Label Regeneration (User Story 3 - P3)

**Objective**: Verify re-exporting a label overwrites the existing file cleanly with 0% corruption.

**Execution**:
```bash
npx jest tests/unit/pdf-exporter.test.ts -t "Overwriting on Regeneration"
```

**Expected Outcome**:
- Existing file at destination path is replaced.
- Overwrite executes smoothly with zero file lock contention.

---

## 3. End-to-End Test Suite Execution

Run the complete test suite covering PDF generation and vault storage:

```bash
npm test
npm run lint
npx tsc --noEmit
```

**Success Gate**: 100% test pass rate, 0 lint warnings/errors, and clean TypeScript compilation.
