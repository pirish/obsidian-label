# Research: File Explorer Context Menu Label Action

**Feature**: `specs/006-file-context-menu`  
**Date**: 2026-10-06  
**Status**: Completed  

---

## Technical Context & Decisions

### 1. Obsidian Workspace File Context Menu Events

#### Decision
Register two native Obsidian workspace events on plugin startup using `plugin.registerEvent`:
1. `workspace.on('file-menu', (menu: Menu, file: TAbstractFile, source: string, leaf?: WorkspaceLeaf) => void)` for single-item right-click interactions.
2. `workspace.on('files-menu', (menu: Menu, files: TAbstractFile[], source: string) => void)` for multi-item selection right-click interactions.

#### Rationale
- `file-menu` is the official Obsidian event emitted when a user opens a context menu on an individual file or folder anywhere in the workspace (including file explorer, sidebar, and bookmarks).
- `files-menu` is the native Obsidian event emitted when a user selects multiple items in the file explorer and right-clicks.
- Wrapping both listeners in `plugin.registerEvent(...)` guarantees that Obsidian cleans them up automatically on plugin unload, preventing memory leaks and duplicate handler registrations.

#### Alternatives Considered
- *Overriding DOM contextmenu events directly on `.nav-file`*: Rejected because it bypasses Obsidian's native menu abstraction, breaks accessibility, risks breakage with custom themes, and violates Constitution Principle III (Minimal External Dependencies & standard Obsidian APIs).
- *Single-file only without multi-selection*: Rejected during clarification (Option B selected) to enhance bulk labeling workflow directly from the file explorer.

---

### 2. File Type Filtering & Folder Exclusions

#### Decision
Use the existing type guard `isMarkdownFile(file)` to strictly validate target files:
- In `file-menu`: Only add the menu item if `isMarkdownFile(file)` returns `true`. If `file` is a `TFolder` or a non-markdown `TFile` (e.g., `.png`, `.pdf`, `.canvas`), the event listener does nothing.
- In `files-menu`: Filter the `files` array with `const mdFiles = files.filter(isMarkdownFile);`. Only add the "Generate Labels" menu item if `mdFiles.length > 0`.

#### Rationale
- Physical labels in `obsidian-label` represent notes with titles and Obsidian URIs (`obsidian://open?vault=...&file=...`). Folders and binary attachments do not have Markdown note semantics.
- Pre-filtering avoids cluttering Obsidian's context menu for irrelevant file types.

#### Alternatives Considered
- *Displaying a disabled menu item for non-markdown files*: Rejected because Obsidian context menus do not support disabled items natively; standard Obsidian plugin pattern is omitting non-applicable menu items.

---

### 3. Orchestrator Integration & Batch Execution

#### Decision
Reuse the proven label generation pipeline from Feature 005:
- For single file (`file-menu`): Call `generateLabelForNote(app, file, settings, undefined, generator)` from `src/commands/orchestrator.ts`. It resolves frontmatter overrides, generates the QR code and canvas, exports the PDF, directly overwrites any pre-existing PDF, and shows the success Notice `Label generated: <path>`.
- For multi-file (`files-menu`): Implement a helper `generateLabelsForSelectedNotes(app, files, settings, generator)` that iterates through the filtered markdown files, yielding to the event loop (`setTimeout(resolve, 0)`) every 5 files to maintain UI responsiveness, and posts a summary Notice `Generated ${successCount} labels.`.

#### Rationale
- Reusing `generateLabelForNote` preserves settings hierarchy consistency (`frontmatter > globalSettings`), error reporting, and output directory routing without code duplication.
- Asynchronous batch loop yielding prevents UI thread lockups during large multi-file operations.

#### Alternatives Considered
- *Opening CustomLabelModal on right-click*: Rejected during clarification (Option A selected) to keep the context menu interaction immediate and keyboard/mouse streamlined.

---

### 4. Menu Presentation & Icons

#### Decision
- Menu Title:
  - Single file: `"Generate Label"`
  - Multi-file: `"Generate Labels"`
- Menu Icon: `"tag"` (standard Lucide icon bundled in Obsidian)
- Location: Appended via standard `menu.addItem(...)` without modifying other menu items.

#### Rationale
- The user specification explicitly requests the title `"Generate Label"` and icon `"tag"`.
- Lucide `"tag"` is bundled natively into every Obsidian desktop version and aligns with labeling/tagging metaphors.
