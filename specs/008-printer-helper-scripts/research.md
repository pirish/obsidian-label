# Research & Technical Decisions: Printer Helper Scripts & Auto-Print

**Feature**: `008-printer-helper-scripts`
**Date**: 2026-10-07

---

## 1. Process Execution & Child Process Management in Obsidian Desktop

### Context & Need
Obsidian runs as an Electron application on desktop platforms (Linux, macOS, Windows). To invoke external OS scripts (Bash and PowerShell), the plugin must interface with Node's `child_process` subsystem without blocking Electron's renderer thread or triggering unbounded background tasks.

### Decision
Use `child_process.exec` (or `execFile`) with a strict `timeout: 10000` (10 seconds), `windowsHide: true`, and explicit error/stderr capture.

### Rationale
- `timeout: 10000` satisfies clarification requirement FR-018: if CUPS or PowerShell hangs on an unreachable or paused printer, Node automatically sends `SIGTERM` / terminates the spawned subshell.
- `windowsHide: true` prevents abrupt PowerShell console window flashes on Windows when background printing is triggered.
- Promise-wrapped execution ensures asynchronous, non-blocking execution while enabling straightforward unit and integration testing via mocks.

### Alternatives Considered
- Direct native node addons / bindings: Rejected due to Constitution Principle VI (no native binaries permitted).
- Web Print API (`window.print()`): Rejected because `window.print()` opens the full browser print dialogue with interactive user prompts, defeating the purpose of headless automated printing.

---

## 2. Cross-Platform Script Formats & CLI Invocations

### Context & Need
Different operating systems handle command-line PDF printing differently:
- Linux / macOS utilize CUPS via `lp` or `lpr`.
- Windows utilizes PowerShell with default shell verb (`Start-Process -FilePath $PdfPath -Verb PrintTo -ArgumentList "$PrinterName"`).

### Decision
1. **Linux / macOS (`scripts/print-label.sh`)**:
   - Shell: POSIX Bash (`#!/bin/bash`).
   - Printer verification: `lpstat -p "$PRINTER_NAME" &>/dev/null`. If missing, lists available printers with `lpstat -p | awk '{print $2}'`.
   - Print invocation: `lp -d "$PRINTER_NAME" -o fit-to-page "$PDF_PATH"`.
2. **Windows (`scripts/print-label.ps1`)**:
   - Shell: PowerShell (`powershell -ExecutionPolicy Bypass -File ...`).
   - Parameter declaration: `param([string]$PdfPath, [string]$PrinterName)`.
   - Printer verification: `Get-Printer | Select-Object -ExpandProperty Name`.
   - Print invocation: `Start-Process -FilePath $PdfPath -Verb PrintTo -ArgumentList "`"$PrinterName`""`.
   - Flag: `-ExecutionPolicy Bypass` ensures execution succeeds even if the user's default PowerShell execution policy is `Restricted`.

### Rationale
- Completely native to the target OS with zero third-party packages or interpreters needed (no Python, Ruby, or external CLI binaries).
- Clean diagnostic error outputs if the printer name is misspelled or uninstalled.
- Quoted argument passing prevents injection or path splitting when vault directories or printer names contain spaces.

### Alternatives Considered
- Direct `lp` execution from Node without wrapper script: Evaluated, but external scripts allow users to customize vendor-specific CUPS options (e.g. roll media cuts, thermal density, page rotation) outside plugin code.

---

## 3. Bundled Script Location & Discovery Strategy

### Context & Need
The plugin needs to find the bundled helper scripts reliably regardless of whether Obsidian is running in standard vaults, custom vault locations, or automated Jest test environments.

### Decision
Implement a multi-tier script discovery strategy in `src/printer/script-detector.ts`:
1. If `settings.printScriptPath` is populated and points to an existing file: return `settings.printScriptPath`.
2. Check relative to plugin directory:
   - Resolve `vaultBasePath = (app.vault.adapter as any).getBasePath?.() || (app.vault.adapter as any).basePath`.
   - Candidate 1: `<vaultBasePath>/.obsidian/plugins/obsidian-label/scripts/print-label.<ext>`
   - Candidate 2: Direct repository root `scripts/print-label.<ext>` (for dev / testing / symlinked setups).
3. If no file is detected on disk: return `null`.

### Rationale
- Supports standard Obsidian Community Plugin installs out-of-the-box with zero user path configuration.
- Allows power users to point to custom wrappers anywhere on their filesystem.
- Gracefully returns `null` so the caller can display a helpful Notice with instructions rather than throwing an unhandled exception.

---

## 4. Batch Regeneration Guard & Safety

### Context & Need
Feature 005 introduced "Regenerate All Labels in Vault". If a user has 200 notes with existing labels and triggers batch regeneration, auto-printing every label blindly could immediately drain an entire physical roll.

### Decision
Extend `BatchConfirmModal` to inspect `settings.autoPrint && settings.printerName`:
- If auto-print is enabled, the modal displays an explicit checkbox toggle: *"Send all regenerated labels to printer (<printerName>)"* (defaulting to unchecked).
- If unchecked, `regenerateAllLabels` regenerates the PDFs silently without printing.
- If checked, `regenerateAllLabels` prints each successfully regenerated label sequentially with rate pacing.

### Rationale
- Satisfies Q1 user clarification directly.
- Eliminates the risk of catastrophic accidental printing while providing the power user option to reprint an entire batch when intended.
