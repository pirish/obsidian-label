# Quickstart & Verification Guide: Command Palette Label Actions & Batch Generation

**Feature**: `specs/005-command-palette-actions`  
**Date**: 2026-10-06  
**Status**: Ready for Implementation

This guide outlines runnable verification scenarios to validate that command palette actions, custom label overrides, frontmatter defaults, and vault batch regeneration execute correctly end-to-end.

---

## 1. Prerequisites & Test Execution

```bash
# Execute unit and integration tests
npm test

# Verify type safety and lint
npx tsc --noEmit
npm run lint
```

---

## 2. Verification Scenarios

### Scenario 1: Command Palette "Generate Label for Current Note" (User Story 1 - P1 MVP)

**Objective**: Verify instant keyboard label generation for the currently active markdown note.

**Execution**:
```bash
npx jest tests/unit/commands.test.ts -t "Generate Label for Current Note"
```

**Expected Outcome**:
- When an active markdown file is open in the workspace, `checkCallback` returns `true`.
- The command generates a valid PDF label using active settings and saves it to the vault.
- An Obsidian `Notice` appears indicating: `"Label generated: <filePath>"`.
- When no file or a non-markdown file is open, `checkCallback` returns `false` (command disabled).

---

### Scenario 2: Custom Label Override Modal & Frontmatter (User Story 2 - P2)

**Objective**: Verify `CustomLabelModal` allows per-note overrides of size and QR placement, with optional frontmatter persistence.

**Execution**:
```bash
npx jest tests/unit/custom-label-modal.test.ts
```

**Expected Outcome**:
- Invocations open `CustomLabelModal` populated with current settings.
- Overrides (e.g., custom dimensions or preset) apply directly to generated PDF.
- When "Save as note default" is checked, overrides are persisted to note YAML frontmatter (`label_size`, etc.).
- When canceled or dismissed via Esc, no label is generated and settings/files remain unchanged.

---

### Scenario 3: Vault Batch Regeneration with Confirmation (User Story 3 - P3)

**Objective**: Verify batch regeneration discovers existing label PDFs and prompts for confirmation before updating.

**Execution**:
```bash
npx jest tests/unit/batch-regeneration.test.ts
```

**Expected Outcome**:
- Triggering "Regenerate All Labels in Vault" presents `BatchConfirmModal` displaying the total eligible note count.
- Only notes that already have a corresponding label PDF in the output directory are queued for regeneration.
- Notes in `.trash`, `.obsidian`, and template folders are skipped.
- Upon completion, an Obsidian Notice summarizes results (e.g. `"Regenerated 5 labels"`).

---

### Scenario 4: End-to-End Command & Lifecycle Integration

**Objective**: Full integration test across commands, modals, and file system operations.

**Execution**:
```bash
npx jest tests/integration/commands-integration.test.ts
```

**Expected Outcome**:
- All registered commands appear in plugin lifecycle.
- Error handling displays informative notices if canvas rendering or vault writing fails.
- 100% of operations run completely offline with 0 network calls.
