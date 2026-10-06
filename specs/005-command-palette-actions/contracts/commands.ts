/**
 * Contract: Command Palette Actions & Modal Dialogs
 * Feature: 005-command-palette-actions
 */

import { App, Modal, TFile } from 'obsidian';
import { ExportedPDFResult } from '../../../src/core/types';
import {
  LabelPresetOption,
  ObsidianLabelSettings,
  QRPlacementOption,
} from '../../../src/settings/types';

export interface CustomLabelOverride {
  defaultLabelSize?: LabelPresetOption;
  customWidth?: number;
  customHeight?: number;
  qrCodePlacement?: QRPlacementOption;
  qrCodeSize?: number;
  saveToFrontmatter?: boolean;
}

export interface BatchRegenerateResult {
  totalEligible: number;
  regeneratedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ path: string; message: string }>;
}

/**
 * Resolves effective configuration for a note:
 * Overrides > Frontmatter > Global Settings
 */
export declare function resolveEffectiveSettingsForNote(
  app: App,
  file: TFile,
  globalSettings: ObsidianLabelSettings,
  overrides?: CustomLabelOverride,
): Promise<ObsidianLabelSettings>;

/**
 * Generates and saves a label PDF for a specific markdown note.
 */
export declare function generateLabelForNote(
  app: App,
  file: TFile,
  settings: ObsidianLabelSettings,
  overrides?: CustomLabelOverride,
): Promise<ExportedPDFResult>;

/**
 * Discovers and regenerates all notes in the vault that already have existing label PDFs.
 */
export declare function regenerateAllLabels(
  app: App,
  settings: ObsidianLabelSettings,
  onProgress?: (current: number, total: number) => void,
): Promise<BatchRegenerateResult>;

/**
 * Modal dialog for per-note custom settings overrides.
 */
export declare class CustomLabelModal extends Modal {
  constructor(
    app: App,
    file: TFile,
    currentSettings: ObsidianLabelSettings,
    onGenerate: (overrides: CustomLabelOverride) => Promise<void>,
  );
  onOpen(): void;
  onClose(): void;
}

/**
 * Confirmation dialog before vault batch regeneration.
 */
export declare class BatchConfirmModal extends Modal {
  constructor(
    app: App,
    eligibleCount: number,
    onConfirm: () => Promise<void>,
  );
  onOpen(): void;
  onClose(): void;
}
