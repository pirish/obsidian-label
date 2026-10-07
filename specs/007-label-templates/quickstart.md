# Quickstart & Verification Guide: Label Templates & Custom Template System

**Feature**: `specs/007-label-templates`  
**Date**: 2026-10-07  
**Status**: Ready for Planning Verification  

---

## 1. Prerequisites & Test Execution

```bash
# Execute unit and integration tests
npm test

# Verify type safety and linting
npx tsc --noEmit
npm run lint
```

---

## 2. Verification Scenarios

### Scenario 1: Built-in "Standard" Template (User Story 1 - P1 MVP)

**Objective**: Verify the built-in "Standard" template outputs an 89x28 mm label with QR on the left, left-aligned typography, title, and relative path.

**Execution**:
```bash
npx jest tests/integration/template-integration.test.ts -t "Standard template"
```

**Expected Outcome**:
- Output PDF dimensions are 89 mm x 28 mm.
- QR code is placed on the left side (25 mm size).
- Text block contains the note title (truncated at 40 chars if exceeded) and relative path.
- Generation completes in under 1 second.

---

### Scenario 2: Built-in "Compact" Tag Template (User Story 1 - P1 MVP)

**Objective**: Verify the built-in "Compact" template outputs a 30x30 mm square label focusing exclusively on a prominent centered QR code.

**Execution**:
```bash
npx jest tests/integration/template-integration.test.ts -t "Compact template"
```

**Expected Outcome**:
- Output PDF dimensions are 30 mm x 30 mm.
- QR code is prominent and centered (80% size).
- Title, path, and metadata lines are omitted (`showTitle: false`, `showPath: false`).
- Generates a clean, scan-focused physical tag.

---

### Scenario 3: Built-in "Inventory" Template & Frontmatter Extraction (User Story 1 - P1 MVP)

**Objective**: Verify the built-in "Inventory" template outputs a 100x50 mm catalog card with QR on the right, Courier New font, border, creation date, and extracted frontmatter properties.

**Execution**:
```bash
npx jest tests/integration/template-integration.test.ts -t "Inventory template"
```

**Expected Outcome**:
- Output PDF dimensions are 100 mm x 50 mm with a 2px border.
- QR code is placed on the right (30 mm size).
- Frontmatter keys (`category`, `location`, `serial`, `value`) are extracted from note YAML metadata and rendered as formatted text lines.
- YAML array fields (e.g. `category: ['hardware', 'testing']`) are rendered as comma-separated text.

---

### Scenario 4: Custom Template Creation & Persistence (User Story 2 - P2)

**Objective**: Verify a user can create a custom template in the Template Manager, save it, and have it persist in plugin settings across reloads.

**Execution**:
```bash
npx jest tests/unit/template-manager.test.ts -t "create and persist custom template"
```

**Expected Outcome**:
- New custom template is saved to `settings.customTemplates`.
- Appears in the "Default Template" dropdown labeled with `(custom)`.
- Persists across simulated plugin reload (`onload()`).

---

### Scenario 5: Per-Note Frontmatter Template Override (User Story 1 & 2)

**Objective**: Verify that setting `template: inventory` in a note's frontmatter generates that note using the Inventory template, even when the vault-wide default is "Standard".

**Execution**:
```bash
npx jest tests/integration/template-integration.test.ts -t "per-note frontmatter template override"
```

**Expected Outcome**:
- Vault default template is "Standard" (89x28 mm).
- Target note contains `template: inventory` in frontmatter.
- Generated PDF for target note uses 100x50 mm dimensions, right QR placement, and inventory metadata fields.

---

### Scenario 6: Active Template Deletion Safe Fallback (User Story 3 - P3)

**Objective**: Verify that deleting a custom template currently selected as the active default resets `settings.defaultTemplate` to "Standard" without throwing errors.

**Execution**:
```bash
npx jest tests/unit/template-manager.test.ts -t "active template deletion fallback"
```

**Expected Outcome**:
- Custom template `custom-shelf` is selected as `defaultTemplate`.
- User deletes `custom-shelf` in the Template Manager.
- `settings.defaultTemplate` automatically falls back to `'standard'`.
- Subsequent label generation continues working seamlessly.
