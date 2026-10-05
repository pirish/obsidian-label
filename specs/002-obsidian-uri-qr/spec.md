# Feature Specification: Obsidian URI Generation & QR Encoding

**Feature Branch**: `002-obsidian-uri-qr`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Labels must encode stable Obsidian URIs as scannable QR codes. These URIs need to work across vault reorganizations (note renames, folder moves) and open the correct note when scanned on any device with Obsidian installed."

## Clarifications

### Session 2026-10-03

- Q: How should the URI generator format file paths for markdown notes when constructing Obsidian URIs? (FR-001) → A: Use Obsidian's built-in getObsidianUrl() API when running inside Obsidian, with an RFC-compliant fallback generator for offline/standalone execution
- Q: How should vault reorganizations (such as note renames or folder moves) be handled for printed physical labels? → A: Regenerate label for moves or renames (static standard URIs are encoded at generation time; reference integrity across vault reorganization is maintained via label regeneration)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standard Obsidian URI Generation and Optical QR Encoding (Priority: P1) 🎯 MVP

As an Obsidian user affixing labels to physical items, I want the system to generate a scannable QR code that encodes a valid, direct Obsidian URI for my active note, so that scanning the label on a mobile phone or tablet instantly opens that note in Obsidian.

**Why this priority**: This delivers the core value proposition of physical-to-digital linking. Without generating valid Obsidian URIs and optical-grade QR codes, physical labels cannot navigate to digital documentation.

**Independent Test**: Provide a note path and vault name, generate the URI and QR code, scan with a standard smartphone camera, and verify it decodes directly into the `obsidian://open?vault=...` URI and launches the target note.

**Acceptance Scenarios**:

1. **Given** a vault name "Personal" and a note path "Workshop/Tools/Multimeter.md", **When** URI generation is triggered, **Then** the system outputs `obsidian://open?vault=Personal&file=Workshop%2FTools%2FMultimeter.md`.
2. **Given** a generated QR code encoding an Obsidian URI, **When** scanned using an iOS or Android device with Obsidian installed, **Then** the device prompts to open Obsidian and navigates directly to the target note.

---

### User Story 2 - Resilient Encoding with Special Characters & Vault Names with Spaces (Priority: P2)

As a user with organized vaults containing nested folders, spaces, and punctuation in note titles, I want URIs and QR codes to handle all special characters, spaces, and Unicode glyphs robustly, so that links never break due to encoding errors.

**Why this priority**: Real-world Obsidian vaults commonly contain spaces, non-ASCII characters, and symbols (e.g., "Research & Development", "C++ & Rust", "2026/09/Project 🚀").

**Independent Test**: Generate URIs for vault names with spaces and paths containing ampersands, slashes, and non-ASCII Unicode characters, and verify correct URL percent-encoding and scanning fidelity.

**Acceptance Scenarios**:

1. **Given** a vault named "Work & Life" and a note path "Projects/C++ & Rust/Notes 2026.md", **When** URI generation is executed, **Then** spaces and symbols are properly percent-encoded (`vault=Work%20%26%20Life&file=Projects%2FC%2B%2B%20%26%20Rust%2FNotes%202026.md`) without double-encoding slashes within query parameters.
2. **Given** a note containing Unicode characters (e.g., "München/Reiseführer 🇩🇪.md"), **When** encoded into a QR code, **Then** scanning decodes the exact Unicode representation without character corruption.

---

### User Story 3 - Configurable QR Durability & Optical Scaling (Priority: P3)

As an asset manager printing labels for harsh or outdoor environments, I want to configure the QR error correction level (L, M, Q, H) and customize high-contrast styling and quiet-zone margins, so that labels remain readable even if scratched, faded, or dirty.

**Why this priority**: Physical labels on equipment, tools, and storage containers endure real-world wear; higher error correction ensures physical longevity.

**Independent Test**: Generate QR codes with Error Correction Level H (30% recovery) and custom high-contrast color pairs; verify the matrix density increases and recovers data when a portion of the code is obscured.

**Acceptance Scenarios**:

1. **Given** a user selects Error Correction Level H for high-wear environments, **When** the QR code is generated, **Then** the matrix density increases to support up to 30% data recovery while remaining scannable.
2. **Given** a compact label size requiring minimum quiet zone, **When** rendered with a 1-module margin, **Then** scanning remains optical-grade across diverse lighting conditions and camera angles.

---

### Edge Cases

- **Deeply Nested Note Paths**: Paths with 10 or more directory levels MUST encode accurately without URI truncation or overflow.
- **Root-Level Notes**: Notes in the vault root (no parent folder) MUST generate paths without leading slashes (e.g., `file=MyNote.md` rather than `file=%2FMyNote.md`).
- **Vault Reorganizations (Renames/Moves)**: Because physical printed QR codes encode static URIs, reference integrity when notes are renamed or relocated across folders is addressed by regenerating the label with the new URI path.
- **Heading and Block References**: URIs containing optional heading anchors (`#Heading`) or block identifiers (`^blockid`) MUST be properly structured without corrupting query parameter delimiters.
- **Completely Offline Environments**: All URI formatting, percent-encoding, and QR matrix generation operations MUST execute 100% locally with zero external network connectivity.
- **Micro-Scale Physical Dimensions**: When rendered on compact labels, the QR generator MUST maintain minimum module dimensions so optical smartphone cameras can reliably focus and scan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST construct valid, standardized Obsidian URIs adhering to the `obsidian://open?vault=<vault-name>&file=<path>` URI protocol, utilizing Obsidian's native `app.getObsidianUrl(file)` API when running within the active Obsidian application context and providing an RFC-compliant fallback generator (`generateObsidianURI(vault, filePath)`) for standalone CLI execution and headless testing.
- **FR-002**: System MUST apply RFC 3986 percent-encoding to vault names and relative file paths, properly encoding spaces, punctuation, and Unicode characters.
- **FR-003**: System MUST omit leading slashes from file paths to ensure universal cross-platform URI compatibility across desktop and mobile Obsidian apps.
- **FR-004**: System MUST generate two-dimensional scannable QR codes directly encoding the generated Obsidian URI with zero external network requests or tracking redirects.
- **FR-005**: System MUST support selectable QR Error Correction Levels: Level L (~7% recovery), Level M (~15% recovery, default), Level Q (~25% recovery), and Level H (~30% recovery).
- **FR-006**: System MUST scale QR code dimensions proportionally to fit designated label bounds while maintaining minimum physical dimensions for camera readability.
- **FR-007**: System MUST provide configurable quiet-zone margins around the QR code matrix (defaulting to at least 1 module width) to ensure reliable optical isolation from surrounding text and borders.
- **FR-008**: System MUST support configurable visual contrast pairing (dark modules and light background) to ensure sufficient contrast ratios for barcode scanners.
- **FR-009**: System MUST validate input parameters, rejecting non-string vault names, empty file paths, or invalid error correction level selections with clear diagnostic errors.
- **FR-010**: System MUST deliver generated QR codes in both high-resolution vector/raster formats and direct canvas drawing commands for integration with label generation pipelines.

### Key Entities

- **Obsidian URI**: A standardized deep-link protocol string (`obsidian://open?...`) referencing a specific note within a named Obsidian vault.
- **URI Configuration**: The parameters required to construct an Obsidian URI, including vault identifier, relative note path, and optional heading or block reference.
- **QR Code Specification**: The physical and structural parameters governing the generation of a QR code, including error correction level, quiet zone margin, target pixel/physical dimensions, and module colors.
- **QR Matrix**: The calculated two-dimensional grid of dark and light modules encoding the URI payload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of generated Obsidian URIs follow the standard URI protocol and successfully open the target note in Obsidian on iOS, Android, macOS, Windows, and Linux.
- **SC-002**: 100% of generated QR codes scan successfully on standard smartphone cameras (iOS Camera app and Android Google Lens/Camera) under normal ambient lighting.
- **SC-003**: QR code generation executes in under 50 milliseconds for any standard vault path on desktop hardware.
- **SC-004**: 100% of URI formatting and QR matrix generation operations run fully offline with zero external network connectivity or telemetry.
- **SC-005**: QR codes generated with Level H error correction remain readable when up to 25% of the symbol surface is obscured or damaged.

## Assumptions

- The scanning device has the Obsidian application installed with system handler registration for the `obsidian://` protocol.
- Vault names and file paths are UTF-8 encoded text strings.
- QR codes will be printed on high-contrast media (e.g., white thermal paper with black thermal activation) or displayed on high-contrast digital previews.
- Notes renamed or relocated across folders in Obsidian require regenerating physical labels to update encoded URIs; dynamic in-situ redirection across renames without label reprint is out of scope for the static QR generator.
