# Feature Specification: Printer Helper Scripts & Auto-Print

**Feature Branch**: `008-printer-helper-scripts`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "After generating a PDF label, users often want to print it immediately. Opening the PDF, selecting the printer, and configuring settings is tedious. A helper script that sends PDFs directly to the label printer streamlines the workflow. Provide OS-specific helper scripts (Bash for Linux/macOS, PowerShell for Windows) that users can optionally configure. When enabled, the plugin can auto-print after generating a label."

---

## Clarifications

### Session 2026-10-07

- Q: Should batch label regeneration suppress auto-printing to protect physical label stock, or should it send every regenerated label to the printer? → A: Prompt with an explicit confirmation dialog before batch printing ("Auto-print is enabled. Send all X labels to printer?").
- Q: Should the plugin settings tab include a "Test Print" button to verify printer connectivity and script execution without having to generate an actual note label? → A: Add a "Test Print" button in settings that prints a sample label to verify script and printer setup.
- Q: What timeout should the plugin enforce when executing the print helper script before terminating the process and alerting the user of a stalled job? → A: 10 seconds (standard timeout; terminates stalled processes quickly and alerts the user).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Print Dispatch on Label Generation (Priority: P1) 🎯 MVP

When a user generates a label (via the Command Palette, File Explorer context menu, or Custom Label modal), and auto-print is enabled with a valid printer specified, the plugin automatically dispatches the generated PDF to an external print helper script so the physical label prints immediately without requiring manual PDF opening, viewer navigation, or OS print dialogue interactions.

**Why this priority**: Directly solves the core user friction of needing to manually locate, open, and configure print dialogues for every physical label created. Delivers a complete, independent MVP for users who want frictionless one-click label printing.

**Independent Test**: Enable auto-print in plugin settings, configure a target printer name, generate a label for an active note, and verify that the print helper script is invoked with the absolute PDF path and printer name, showing a confirmation notification upon dispatch.

**Acceptance Scenarios**:

1. **Given** auto-print is enabled and a valid printer name is configured, **When** a label is successfully generated for a note, **Then** the print helper script is invoked asynchronously with the PDF path and printer name, and an Obsidian notice confirms dispatch.
2. **Given** auto-print is disabled, **When** a label is generated, **Then** no helper script is invoked and the PDF is saved normally.
3. **Given** auto-print is enabled but no printer name has been entered, **When** a label is generated, **Then** the plugin saves the PDF, skips print invocation, and displays a notice requesting a printer name.
4. **Given** auto-print is enabled but the helper script execution fails, **When** the error occurs, **Then** the plugin displays an error notice containing the failure description while leaving the generated PDF intact.
5. **Given** auto-print is enabled and the user triggers batch regeneration across the vault, **When** the batch confirmation modal appears, **Then** it prompts with an explicit choice whether to dispatch all regenerated labels to the printer or save without printing.
6. **Given** auto-print is enabled and a printer name is configured, **When** the user clicks "Test Print" in the plugin settings tab, **Then** the system dispatches a sample test label to the printer and displays an Obsidian notice confirming dispatch or reporting the error.

---

### User Story 2 - Cross-Platform Helper Scripts & Automatic Script Discovery (Priority: P2)

Users on Linux, macOS, and Windows receive pre-packaged, native OS helper scripts (Bash for Linux/macOS with CUPS and PowerShell for Windows). The plugin automatically detects the appropriate script based on the host operating system and plugin directory location. Users who store their scripts in custom locations or use custom printing wrappers can manually override the script path in plugin settings.

**Why this priority**: Eliminates manual script writing for users while ensuring full cross-platform compatibility across all desktop environments supported by Obsidian.

**Independent Test**: Execute the Bash script on Linux/macOS or the PowerShell script on Windows directly via the terminal with test parameters, verifying that missing files and invalid printers are caught with clear diagnostics. Within Obsidian, verify that leaving the script path blank automatically resolves the bundled script.

**Acceptance Scenarios**:

1. **Given** a user runs the helper script with a non-existent PDF file path, **When** the script executes, **Then** it immediately aborts with an error stating the PDF file was not found.
2. **Given** a user runs the helper script with a printer name not recognized by the operating system, **When** the script executes, **Then** it aborts with an error listing all available printers found on the system.
3. **Given** the "Print Script Path" setting is left blank, **When** auto-print triggers, **Then** the plugin automatically discovers and runs the bundled script in the plugin's `scripts/` directory matching the host OS.
4. **Given** a user provides a custom path in "Print Script Path", **When** auto-print triggers, **Then** the specified custom script is invoked instead of the auto-detected script.

---

### User Story 3 - Printer Setup Documentation & Configuration Guidance (Priority: P3)

Users have clear, complete documentation (`docs/PRINTER_SETUP.md`) explaining how to find their exact printer name across operating systems (using `lpstat -p` on Linux/macOS and `Get-Printer` on Windows), configure settings in Obsidian, and troubleshoot common OS permission and execution policy hurdles.

**Why this priority**: Label printers often have distinct driver naming conventions and execution policy restrictions. Clear guidance ensures smooth initial onboarding and self-service troubleshooting.

**Independent Test**: Follow the steps in the setup guide on a clean environment to identify system printers, configure auto-print settings, and resolve execution barriers without needing external support.

**Acceptance Scenarios**:

1. **Given** a user seeks to configure auto-print, **When** they consult `docs/PRINTER_SETUP.md`, **Then** they find platform-specific terminal commands to inspect printer names and configure the plugin.
2. **Given** a user encounters permission or execution policy blocks (e.g. Linux `lp` group membership or Windows PowerShell execution policy), **When** they review the troubleshooting section, **Then** they find step-by-step commands to resolve the issue.

---

### Edge Cases

- **Generated PDF Write Failure**: If PDF generation or file writing fails, auto-print MUST NOT trigger.
- **Batch Regeneration Guard**: When regenerating labels for multiple notes simultaneously via vault batch operations, the system MUST require explicit user confirmation before sending the batch of labels to the printer to avoid accidental stock depletion.
- **Process Execution Timeout**: The plugin MUST enforce a strict 10-second timeout when executing external print helper scripts. If a script stalls or does not exit within 10 seconds, the child process MUST be terminated and an error notice displayed.
- **Spaces in File Paths or Printer Names**: All paths (including vault directories with spaces) and printer names (e.g., `"Dymo LabelWriter 450"`) MUST be safely escaped and quoted when passing arguments to scripts.
- **Asynchronous / Non-blocking Execution**: The print helper script MUST execute asynchronously in the background. Long-running or queued print jobs MUST NOT freeze or block the Obsidian user interface.
- **Script Missing on Disk**: If the configured custom script path or auto-detected script path does not exist on disk, the plugin MUST alert the user via an Obsidian Notice without throwing unhandled exceptions.
- **Offline Integrity**: The auto-print subsystem and helper scripts MUST operate 100% locally with zero external network or telemetry calls.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Auto-Print Labels" toggle setting to enable or disable automatic printing upon label generation.
- **FR-002**: System MUST provide a "Printer Name" setting allowing users to enter the target system printer identifier.
- **FR-003**: System MUST provide a "Print Script Path" setting allowing users to specify an optional custom helper script path.
- **FR-004**: System MUST dynamically display printer configuration settings only when "Auto-Print Labels" is enabled.
- **FR-005**: System MUST automatically detect the bundled print helper script location when "Print Script Path" is left blank.
- **FR-006**: System MUST detect the host operating system and choose the corresponding script format (Bash `.sh` for Linux/macOS, PowerShell `.ps1` for Windows).
- **FR-007**: System MUST invoke the print helper script asynchronously immediately following successful PDF export.
- **FR-008**: System MUST pass the absolute path to the generated PDF and the configured printer name as arguments to the script, properly quoted to handle whitespace.
- **FR-009**: System MUST display an Obsidian Notice confirming print dispatch when the helper script reports success.
- **FR-010**: System MUST display an Obsidian Notice detailing the error message when the helper script fails or exits with a non-zero code.
- **FR-011**: System MUST ship an executable Bash helper script (`scripts/print-label.sh`) compatible with CUPS on Linux and macOS.
- **FR-012**: System MUST ship a PowerShell helper script (`scripts/print-label.ps1`) compatible with Windows.
- **FR-013**: The helper scripts MUST validate that the input PDF file exists before attempting print dispatch.
- **FR-014**: The helper scripts MUST validate that the specified printer exists on the operating system, outputting a list of available printers if not found.
- **FR-015**: System MUST provide a comprehensive setup guide in `docs/PRINTER_SETUP.md` covering printer discovery, plugin configuration, and OS troubleshooting.
- **FR-016**: When batch regeneration is initiated while auto-print is enabled, the system MUST prompt the user with an explicit option to confirm or decline dispatching all regenerated labels to the printer.
- **FR-017**: The settings tab MUST provide a "Test Print" action button when auto-print is enabled that renders a sample test label and dispatches it through the configured helper script, notifying the user of success or error.
- **FR-018**: The system MUST enforce a 10-second execution timeout on print helper script processes, terminating any stalled process and notifying the user via an Obsidian Notice.

---

### Key Entities

- **PrintJob**: Represents an ad-hoc print request containing the target PDF file path, target printer name, and execution timestamp.
- **PrintHelperScript**: Represents an external OS script definition with script path, script type (`bash` or `powershell`), and argument formatting rules.
- **PrinterConfiguration**: User preferences bundled in plugin settings containing `autoPrint` toggle, `printerName`, and optional `printScriptPath`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When auto-print is enabled, print dispatch initiates in under 500 milliseconds following PDF generation.
- **SC-002**: Users eliminate 100% of manual PDF viewer interactions (opening file, selecting printer, setting scale) when generating physical labels.
- **SC-003**: 100% of print helper errors (missing files, invalid printer names, script execution errors, timeouts) are reported back to the user via visible Obsidian notices.
- **SC-004**: System runs 100% offline with zero outbound network requests or external dependencies beyond native OS tools (CUPS `lp`/`lpstat` on Unix, PowerShell on Windows).
- **SC-005**: Setup guide provides copy-paste commands enabling users to identify their printer name and configure the feature in under 3 minutes.
- **SC-006**: 100% of stalled or unresponsive print helper processes are terminated within 10 seconds without locking the Obsidian interface.

---

## Assumptions

- Target desktop systems have standard printing capabilities: Linux and macOS have CUPS (`lp` and `lpstat`) available; Windows has PowerShell and printer drivers installed.
- Label printers are already installed and recognized by the host operating system before configuring the plugin.
- Direct helper script execution is intended for the desktop version of Obsidian (Electron environment with Node child process capabilities).
- Core plugin remains fully functional when auto-print is disabled, maintaining full privacy and offline zero-dependency guarantees.
