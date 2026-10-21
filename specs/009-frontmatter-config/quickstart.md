# Quickstart Validation Guide: Per-Note Frontmatter Configuration

**Feature**: `009-frontmatter-config`  
**Date**: 2026-10-21

---

## Prerequisites

- Node.js 18+ and npm installed
- Repository dependencies installed via `npm install`

---

## 1. Automated Verification Commands

Run the unit and integration test suites for frontmatter configuration:

```bash
# Run frontmatter parser and custom fields rendering unit tests
npx jest tests/unit/frontmatter-parser.test.ts

# Run orchestrator and end-to-end frontmatter integration tests
npx jest tests/unit/orchestrator.test.ts tests/integration/frontmatter-integration.test.ts

# Run full test suite and typecheck
npx tsc --noEmit && npm test
```

---

## 2. Manual Verification Scenarios

### Scenario A: Full `label` Frontmatter Override
1. Create a note in your Obsidian vault with the following YAML frontmatter:
   ```yaml
   ---
   label:
     template: "inventory"
     customFields:
       category: "Electronics"
       location: "Shelf B3"
       serial: "ABC123"
       value: "$450"
     qrCodeSize: 35
     fontSize: 14
   ---
   ```
2. Run **Generate Label for Current Note** from the Command Palette.
3. Verify that:
   - The generated PDF uses the `inventory` template dimensions (`62x100mm`).
   - The QR code size is 35% and font size is 14pt.
   - The custom fields (`category: Electronics`, `location: Shelf B3`, `serial: ABC123`, `value: $450`) appear on the label.

### Scenario B: Invalid Frontmatter Resilience
1. Edit the note's frontmatter to contain invalid values:
   ```yaml
   ---
   label:
     template: "nonexistent-template"
     qrCodeSize: 999
     fontSize: -10
   ---
   ```
2. Run **Generate Label for Current Note**.
3. Verify that:
   - The label still generates using global defaults without throwing an error.
   - The Developer Console (`Ctrl+Shift+I` / `Cmd+Opt+I`) shows warnings identifying each ignored invalid frontmatter property.
