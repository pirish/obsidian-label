# Quickstart & Verification Guide: File Explorer Context Menu Label Action

**Feature**: `specs/006-file-context-menu`  
**Date**: 2026-10-06  
**Status**: Ready for Implementation  

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

### Scenario 1: Single Note File Context Menu (User Story 1 - P1 MVP)

**Objective**: Verify right-clicking an individual markdown note in the file explorer displays "Generate Label" and outputs a label PDF.

**Execution**:
```bash
npx jest tests/unit/context-menu.test.ts -t "single-file menu"
```

**Expected Outcome**:
- `file-menu` event listener checks that target file is Markdown (`.md`).
- A menu item titled `"Generate Label"` with icon `"tag"` is appended to the menu.
- Clicking the item invokes `generateLabelForNote(file)` using active settings.
- Directly overwrites any pre-existing label PDF without confirmation prompts.
- A success Notice appears: `"Label generated: <filePath>"`.

---

### Scenario 2: Non-Markdown & Folder Exclusion (User Story 1 - P1 MVP)

**Objective**: Verify non-markdown assets and folders omit the context menu item.

**Execution**:
```bash
npx jest tests/unit/context-menu.test.ts -t "non-markdown"
```

**Expected Outcome**:
- When `file` is a `TFolder`, no menu item is added.
- When `file` has an extension other than `.md` (e.g. `.png`, `.canvas`, `.pdf`), no menu item is added.

---

### Scenario 3: Target File Independence (User Story 2 - P2)

**Objective**: Verify generating a label from the context menu always targets the right-clicked file, even if a different note is open in the active editor.

**Execution**:
```bash
npx jest tests/unit/context-menu.test.ts -t "target file independence"
```

**Expected Outcome**:
- Note A is active in workspace editor.
- User right-clicks Note B in the file explorer.
- Clicking "Generate Label" generates a label PDF strictly for Note B.

---

### Scenario 4: Multi-File Selection Batch Generation (User Story 3 - P3)

**Objective**: Verify right-clicking multiple selected Markdown notes offers "Generate Labels" and generates all labels with a summary notice.

**Execution**:
```bash
npx jest tests/unit/context-menu.test.ts -t "multi-file menu"
```

**Expected Outcome**:
- User selects multiple files where at least one is a Markdown file.
- `files-menu` event appends a menu item titled `"Generate Labels"` with icon `"tag"`.
- Clicking the item generates labels for all selected Markdown files, yielding to the event loop.
- A completion notice summarizes: `"Generated 3 labels."`.

---

### Scenario 5: Mixed Multi-Selection Exclusion (User Story 3 - P3)

**Objective**: Verify multi-selection containing both Markdown notes and non-markdown assets only processes Markdown notes, and pure non-markdown selections omit the menu item.

**Execution**:
```bash
npx jest tests/unit/context-menu.test.ts -t "mixed multi-selection"
```

**Expected Outcome**:
- Multi-selection with 2 notes and 1 image: "Generate Labels" generates 2 labels.
- Multi-selection with only images/folders (0 notes): "Generate Labels" is not added.
