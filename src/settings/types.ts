/**
 * Settings Schema & Default Values
 * Obsidian Label Community Plugin
 */

import { LabelTemplate } from '../templates/types';

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
  printScriptPath: string;
  defaultTemplate: string;
  customTemplates: LabelTemplate[];
  mergeBatchPDFs: boolean;
}

export const DEFAULT_SETTINGS: ObsidianLabelSettings = {
  defaultLabelSize: 'dymo-standard',
  customWidth: 89,
  customHeight: 28,
  qrCodePlacement: 'left',
  qrCodeSize: 25,
  fontFamily: 'Arial',
  fontSize: 12,
  fontColor: '#000000',
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#CCCCCC',
  outputFolder: 'same-as-note',
  customOutputPath: '_labels',
  includeTimestamp: false,
  printerName: '',
  autoPrint: false,
  printScriptPath: '',
  defaultTemplate: 'standard',
  customTemplates: [],
  mergeBatchPDFs: false,
};

/**
 * Standard preset dimension mappings in millimeters.
 */
export const PRESET_DIMENSIONS: Record<
  Exclude<LabelPresetOption, 'custom'>,
  { width: number; height: number; name: string }
> = {
  'dymo-standard': { width: 89, height: 28, name: 'Dymo Standard (89×28mm)' },
  'brother-62mm': { width: 62, height: 100, name: 'Brother 62mm (62×100mm)' },
  'avery-5160': { width: 66.7, height: 25.4, name: 'Avery 5160 (66.7×25.4mm)' },
  'phomemo-40x30': { width: 40, height: 30, name: 'Phomemo 40×30mm (40×30mm)' },
  'generic-square-50': { width: 50, height: 50, name: 'Square 50×50mm (50×50mm)' },
};
