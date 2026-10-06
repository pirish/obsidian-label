# Quickstart & Verification Guide: Plugin Settings Tab for Label Configuration

**Feature**: `specs/004-settings-tab`  
**Date**: 2026-10-05  
**Status**: Ready for Verification

This guide outlines runnable verification scenarios to validate that the Obsidian settings tab UI, default settings loading/saving, dynamic dimension visibility, visual style controls, output folder routing, and live sample preview modal function correctly end-to-end.

---

## 1. Prerequisites & Environment Setup

Verify Node.js (v18+) and execute test suite:

```bash
node -v
npm test
```

---

## 2. Verification Scenarios

### Scenario 1: Default Settings Initialization & Persistence (User Story 1 - P1 MVP)

**Objective**: Verify plugin initializes with standard defaults when no settings exist, and persists user modifications cleanly across reloads.

**Execution**:
```bash
npx jest tests/unit/settings.test.ts -t "Settings Persistence"
```

**Expected Outcome**:
- Unconfigured plugin initializes with all `DEFAULT_SETTINGS`.
- Modifications to settings are saved via `saveData` and restored via `loadData`.
- Corrupt data in storage falls back gracefully to `DEFAULT_SETTINGS` without error.

---

### Scenario 2: Dynamic Custom Dimension Toggling & Validation (User Story 1 - P1 MVP)

**Objective**: Verify preset selections hide custom dimension inputs, and choosing "Custom Size" reveals width and height controls with validation.

**Execution**:
```bash
npx jest tests/unit/settings-tab.test.ts -t "Label Size & Custom Dimensions"
```

**Expected Outcome**:
- Preset selection (`dymo-standard`, `brother-62mm`, `avery-5160`, `phomemo-40x30`, `generic-square-50`) applies preset dimensions.
- Selecting `custom` dynamically displays width and height text/numeric fields.
- Non-positive numbers (<= 0) or non-numeric inputs trigger validation errors and prevent saving.

---

### Scenario 3: QR Layout, Typography, & Visual Styling (User Story 2 - P2)

**Objective**: Verify sliders, dropdowns, and color pickers modify and validate layout and aesthetic properties.

**Execution**:
```bash
npx jest tests/unit/settings-tab.test.ts -t "Style & QR Controls"
```

**Expected Outcome**:
- QR placement (`left`, `right`, `top`, `bottom`) and QR size slider (10% to 50%) update configuration.
- Font family, font size, colors (`fontColor`, `backgroundColor`, `borderColor`), and border width update cleanly.
- Invalid hex colors or out-of-range slider values trigger validation errors.

---

### Scenario 4: Output Folder Routing & Timestamp Toggle (User Story 3 - P3)

**Objective**: Verify output destination preferences map accurately to PDF export options.

**Execution**:
```bash
npx jest tests/unit/settings.test.ts -t "Output Mapping"
```

**Expected Outcome**:
- `outputFolder: 'same-as-note'` maps to `location: 'same-folder'`.
- `outputFolder: 'dedicated-folder'` maps to `location: 'dedicated-folder'`.
- `outputFolder: 'custom'` with `customOutputPath: 'PrintQueue'` maps to `location: 'custom-folder'` with `customFolder: 'PrintQueue'`.
- `includeTimestamp` toggle correctly enables timestamping in PDF filename generation.

---

### Scenario 5: Live Sample Preview Modal with Active Note & Fallback (User Story 4 - P4)

**Objective**: Verify clicking "Preview Label" opens `PreviewModal` rendering a live preview with active note data, or realistic sample data if no note is active.

**Execution**:
```bash
npx jest tests/unit/preview-modal.test.ts -t "Preview Modal Rendering"
```

**Expected Outcome**:
- When an active markdown note is open: renders preview using note's title and URI.
- When no active note is open: renders preview using realistic sample note fallback.
- The modal renders a crisp preview image with dimensional details and an explicit "Close" button.

---

## 3. End-to-End Test Suite Execution

Run the complete test suite covering settings, UI tab, and preview modal:

```bash
npm test
npm run lint
npx tsc --noEmit
```

**Success Gate**: 100% test pass rate, 0 lint warnings/errors, and clean TypeScript compilation.
