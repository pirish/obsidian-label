<!--
Sync Impact Report:
- Version change: Unratified Draft → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Privacy First
  - [PRINCIPLE_2_NAME] → II. Design for Scale
  - [PRINCIPLE_3_NAME] → III. Minimal External Dependencies
  - [PRINCIPLE_4_NAME] → IV. Flexibility
  - [PRINCIPLE_5_NAME] → V. User Experience
- Added sections:
  - VI. Cross-Platform Compatibility (Core Principle)
  - Technical Standards & Constraints
  - Development Workflow & Quality Gates
- Removed sections: None
- Follow-up TODOs: None
-->

# Obsidian Label Constitution

Physical and digital organization systems often exist in silos. Obsidian excels at creating interconnected knowledge bases, but linking physical objects to their digital documentation remains manual and fragile. Users resort to hand-written labels with note names, creating brittle references that break when notes are renamed or reorganized.

Obsidian Label bridges this gap by generating professional, scannable labels that encode stable Obsidian URIs as QR codes. Whether managing inventory, organizing collections, documenting equipment, or labeling storage, users can instantly jump from any physical item to its comprehensive digital documentation. The plugin makes Obsidian a true inventory and asset management platform, not just a note-taking tool.

This plugin begins as a personal productivity tool and is architected for community distribution via Obsidian's Community Plugins marketplace, where thousands of users manage physical collections, inventories, and documentation systems.

## Core Principles

### I. Privacy First
All label generation and QR code creation MUST execute locally within Obsidian. Core functionality MUST NOT require cloud services, remote tracking endpoints, or external network connectivity. QR codes MUST encode direct Obsidian URIs (`obsidian://`) rather than external intermediary links. User data MUST remain strictly within the user's local vault, and all core workflows MUST remain fully operational offline.

### II. Design for Scale
The plugin architecture MUST support modular extensions, including custom label dimensions, diverse content layouts, and optional printer backends. Configuration schemas MUST provide a clear hierarchy supporting vault-wide defaults and granular per-note overrides. Internal code structure MUST maintain clean decoupling to encourage community contributions and long-term maintainability as a first-class Obsidian Community Plugin.

### III. Minimal External Dependencies
Core PDF generation MUST run in-plugin using standard web APIs (such as HTML5 Canvas) or self-contained browser-compatible routines. QR code generation MUST use a lightweight, local TypeScript library with zero external network calls. The plugin MUST function out-of-the-box on standard systems without mandatory helper installations; hardware-specific printer integrations MUST remain strictly optional external utilities. Use available obsidian api/function before integrating a new library.

### IV. Flexibility
The layout and rendering engine MUST support standard commercial label sheet and roll formats while accommodating custom user-defined dimensions. Users MUST be able to configure QR code placement, text fields, fonts, and metadata display. The plugin MUST provide a template system for repeatable designs and support per-note metadata overrides without invalidating vault-level defaults.

### V. User Experience
The plugin MUST integrate seamlessly into native Obsidian workflows via the Command Palette (e.g., "Generate Label for This Note") and file explorer context menus. A live visual preview MUST display prior to printing or PDF export to prevent label stock waste. The plugin SHOULD provide seamless regeneration workflows when notes are renamed or reorganized, maintaining reference integrity.

### VI. Cross-Platform Compatibility
The plugin core MUST run consistently across all desktop platforms supported by Obsidian (Windows, macOS, and Linux). Generated label outputs MUST produce standard, universal PDF files compatible with any desktop PDF viewer or label printer driver. Core code MUST NOT bundle platform-specific native binaries; any OS-level printing scripts MUST be optional, platform-isolated helpers.

## Technical Standards & Constraints

- **Language & Runtime**: TypeScript strictly typed, targeting ECMAScript features supported by the Obsidian desktop environment.
- **Platform Framework**: Obsidian Plugin API (`obsidian` package). No private or undocumented Obsidian APIs without documented fallback.
- **Rendering & Output**: Vector and raster generation via web standards (HTML5 Canvas / client-side PDF generation) with zero cloud dependencies.
- **Licensing**: MIT License, maintaining compatibility with Obsidian community distribution standards.
- **Security & Sandboxing**: Zero telemetry, zero non-consensual outbound network calls, and strict sandboxing of note content during rendering.

## Development Workflow & Quality Gates

- **Code Quality**: ESLint and Prettier configured to Obsidian community plugin standards. Zero lint errors or type check failures permitted in build pipelines.
- **Testing Requirements**: Automated unit tests using Jest for label math, coordinate layout calculations, URI escaping, and template substitution. Manual acceptance testing verified against an Obsidian test vault across multiple theme variants.
- **Release Artifacts**: Every release build MUST bundle `main.js`, `manifest.json`, and `styles.css` adhering to Obsidian distribution specifications.
- **Version Management**: Releases adhere strictly to SemVer 2.0. Version identifiers across `package.json`, `manifest.json`, and `versions.json` MUST remain synchronized.

## Governance

This Constitution is the supreme design and architectural authority for the Obsidian Label project. All technical proposals, specifications (`spec.md`), implementation plans (`plan.md`), task decompositions (`tasks.md`), and pull requests MUST strictly adhere to the principles and constraints established herein.

Amendments to this constitution require:
1. An explicit description and justification of proposed changes.
2. An impact assessment on existing templates, configuration schemas, and vault compatibility.
3. Updating this file with an incremented version number, date, and updated Sync Impact Report.

Version increments follow semantic rules:
- **MAJOR**: Incompatible principle redefinitions, removal of core principles, or governance changes that invalidate existing specifications or plugin guarantees.
- **MINOR**: Addition of new principles, sections, or material expansion of architectural requirements.
- **PATCH**: Non-semantic clarifications, typographical corrections, or formatting adjustments.

Every implementation review MUST verify offline privacy guarantees, minimal external dependencies, and cross-platform compatibility.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
