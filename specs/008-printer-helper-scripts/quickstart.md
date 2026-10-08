# Quickstart Validation Guide: Printer Helper Scripts & Auto-Print

**Feature**: `008-printer-helper-scripts`
**Date**: 2026-10-07

---

## Scenario 1: Standalone Bash Helper Script Validation (Linux/macOS)

### Prerequisites
- Bash environment with CUPS (`lp`, `lpstat`) installed.
- Sample PDF file at `test-sample.pdf`.

### Execution
```bash
# 1. Verify missing arguments error
./scripts/print-label.sh
# Expected: Usage: ./print-label.sh <pdf-path> <printer-name> (exit code 1)

# 2. Verify missing PDF error
./scripts/print-label.sh "non-existent.pdf" "MyPrinter"
# Expected: Error: PDF file not found: non-existent.pdf (exit code 1)

# 3. Verify missing printer error and available printer list
./scripts/print-label.sh "test-sample.pdf" "NonExistentPrinter123"
# Expected: Error: Printer not found: NonExistentPrinter123
# Followed by list of available system printers from lpstat
```

---

## Scenario 2: Standalone PowerShell Helper Script Validation (Windows)

### Prerequisites
- Windows PowerShell 5.1+ or PowerShell Core 7+.
- Sample PDF file at `test-sample.pdf`.

### Execution
```powershell
# 1. Verify missing PDF error
powershell -ExecutionPolicy Bypass -File .\scripts\print-label.ps1 -PdfPath "non-existent.pdf" -PrinterName "Dymo"
# Expected: PDF file not found: non-existent.pdf (exit code 1)

# 2. Verify invalid printer error
powershell -ExecutionPolicy Bypass -File .\scripts\print-label.ps1 -PdfPath "test-sample.pdf" -PrinterName "NonExistentPrinter123"
# Expected: Printer not found: NonExistentPrinter123
# Followed by list of available system printers from Get-Printer
```

---

## Scenario 3: In-Plugin Auto-Print upon Label Generation (US1 MVP)

### Setup
1. In Obsidian Settings → Obsidian Label:
   - Enable **Auto-Print Labels**: `true`
   - Set **Printer Name**: `Dymo-LabelWriter-450`
   - Leave **Print Script Path**: blank (auto-detect)

### Execution
1. Open a note `Inventory/Sensor A.md`.
2. Run Command Palette: **Generate Label for Current Note**.
3. Verify:
   - PDF is saved to `Inventory/Sensor A_label.pdf`.
   - Helper script is invoked with `Inventory/Sensor A_label.pdf` and `Dymo-LabelWriter-450`.
   - Obsidian Notice appears: `Label sent to printer: Dymo-LabelWriter-450`.

---

## Scenario 4: Settings "Test Print" Button (US1 & Clarification Q2)

### Setup
1. In Obsidian Settings → Obsidian Label:
   - Enable **Auto-Print Labels**: `true`
   - Set **Printer Name**: `Dymo-LabelWriter-450`

### Execution
1. Click **Test Print** in the settings tab.
2. Verify:
   - A sample test label PDF is rendered and dispatched to `Dymo-LabelWriter-450`.
   - Obsidian Notice confirms: `Test label sent to printer: Dymo-LabelWriter-450`.

---

## Scenario 5: Batch Regeneration Confirmation Guard (Clarification Q1)

### Setup
1. In Obsidian Settings → Obsidian Label:
   - Enable **Auto-Print Labels**: `true`
   - Set **Printer Name**: `Dymo-LabelWriter-450`

### Execution
1. Run Command Palette: **Regenerate All Labels in Vault**.
2. Modal opens displaying:
   - Count of eligible notes.
   - Checkbox: *"Also send regenerated labels to printer (Dymo-LabelWriter-450)"* (unchecked by default).
3. Confirm with checkbox unchecked:
   - Labels are regenerated and saved to disk.
   - Zero print jobs are dispatched.
4. Confirm with checkbox checked:
   - Labels are regenerated and each is sequentially sent to the printer.
