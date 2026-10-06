/**
 * Contract: Plugin Settings & Mapper Helpers
 * Feature: 004-settings-tab
 */

import {
  LabelConfig,
  PDFExportOptions,
  ValidationResult,
} from '../../../src/core/types';

export type LabelPresetOption =
  | 'dymo-standard'
  | 'brother-62mm'
  | 'avery-5160'
  | 'phomemo-40x30'
  | 'generic-square-50'
  | 'custom';

export type QRPlacementOption = 'left' | 'right' | 'top' | 'bottom';

export type OutputFolderOption = 'same-as-note' | 'dedicated-folder' | 'custom';

export interface ObsidianLabelSettings {
  defaultLabelSize: LabelPresetOption;
  customWidth: number;
  customHeight: number;
  qrCodePlacement: QRPlacementOption;
  qrCodeSize: number;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  borderWidth: number;
  borderColor: string;
  outputFolder: OutputFolderOption;
  customOutputPath: string;
  includeTimestamp: boolean;
  printerName: string;
  autoPrint: boolean;
}

/**
 * Validates the complete plugin settings object.
 */
export declare function validatePluginSettings(
  settings: ObsidianLabelSettings,
): ValidationResult;

/**
 * Maps the settings object into an engine LabelConfig for generation.
 */
export declare function settingsToLabelConfig(
  settings: ObsidianLabelSettings,
): LabelConfig;

/**
 * Maps the settings object into PDF export options for persistence.
 */
export declare function settingsToPDFExportOptions(
  settings: ObsidianLabelSettings,
): PDFExportOptions;
