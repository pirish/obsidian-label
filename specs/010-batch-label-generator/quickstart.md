# Quickstart & Validation Guide: Batch Label Generator (`010-batch-label-generator`)

**Date**: 2026-10-21  
**Feature**: [spec.md](./spec.md)

---

## Prerequisites

- Node.js 18+ and npm installed.
- Repository dependencies installed (`npm install`).

---

## Automated Verification Commands

Run the full test suite, type-checker, and linter:

```bash
# Run unit and integration tests
npm test

# Verify TypeScript compilation
npx tsc --noEmit

# Verify ESLint & Prettier compliance
npm run lint
```

---

## End-to-End Validation Scenarios

### Scenario 1: Select Notes by Folder (Recursive vs Direct Children)
1. Open the Command Palette (`Ctrl/Cmd + P`) and run **Obsidian Label: Batch Label Generation**.
2. Verify **Selection Method** defaults to **All notes in a folder** and the **Include subfolders** toggle is enabled.
3. Choose a folder containing notes and nested subfolders (e.g., `Inventory`).
4. Verify the **Preview** section displays `<N> labels will be generated`, lists up to 10 note paths, shows `... and <N - 10> more` if more than 10 notes match, and enables **Generate Labels**.
5. Toggle **Include subfolders** off and verify the preview count updates to include only direct child notes of `Inventory`.

### Scenario 2: Select Notes by Tag & Search Query
1. Switch **Selection Method** to **All notes with a tag** and type `#inventory` (or `inventory`).
2. Verify all notes with `tags: [inventory]` in frontmatter or `#inventory` inline appear in the preview list.
3. Switch **Selection Method** to **Search results** and enter a keyword matching note titles or body text.
4. Enter a non-matching string (e.g., `zzzz_no_match`) and verify the preview displays `No notes selected` and **Generate Labels** is disabled.

### Scenario 3: Progress Indicator, Fault Tolerance & Multi-Page PDF Merging
1. Enable **Merge into single multi-page PDF** (either in Settings or in the Batch Label Generation modal).
2. Select 3+ notes and click **Generate Labels**.
3. Verify the **Generating Labels** progress modal opens (`0 / N`, `0%`), advances after each note (`current / N`, `percentage%`), and closes upon completion.
4. Verify individual per-note label PDFs are saved in the vault AND `labels_batch_YYYY-MM-DD.pdf` is created with `N` pages, accompanied by `Merged PDF created: labels_batch_YYYY-MM-DD.pdf` and `Generated N labels` notices.
