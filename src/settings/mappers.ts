import { LabelConfig, PDFExportLocation, PDFExportOptions } from '../core/types';
import { ObsidianLabelSettings, PRESET_DIMENSIONS } from './types';

/**
 * Maps plugin settings to an engine LabelConfig for generation and rendering.
 */
export function settingsToLabelConfig(settings: ObsidianLabelSettings): LabelConfig {
  let width: number;
  let height: number;

  if (settings.defaultLabelSize === 'custom') {
    width = settings.customWidth;
    height = settings.customHeight;
  } else {
    const preset = PRESET_DIMENSIONS[settings.defaultLabelSize];
    if (preset) {
      width = preset.width;
      height = preset.height;
    } else {
      width = 89;
      height = 28;
    }
  }

  return {
    size: {
      width,
      height,
      dpi: 300,
    },
    layout: {
      qrCodePlacement: settings.qrCodePlacement,
      qrCodeSize: settings.qrCodeSize / 100, // percentage to fraction
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
    },
    style: {
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      fontColor: settings.fontColor,
      backgroundColor: settings.backgroundColor,
      borderWidth: settings.borderWidth,
      borderColor: settings.borderColor,
    },
    qrOptions: {
      errorCorrectionLevel: 'M',
      darkColor: settings.fontColor,
      lightColor: settings.backgroundColor,
    },
  };
}

/**
 * Maps plugin settings to PDFExportOptions for destination routing and naming.
 */
export function settingsToPDFExportOptions(settings: ObsidianLabelSettings): PDFExportOptions {
  let location: PDFExportLocation = 'same-folder';
  if (settings.outputFolder === 'dedicated-folder') {
    location = 'dedicated-folder';
  } else if (settings.outputFolder === 'custom') {
    location = 'custom-folder';
  }

  return {
    location,
    customFolder: settings.outputFolder === 'custom' ? settings.customOutputPath : undefined,
    naming: {
      includeTimestamp: settings.includeTimestamp,
    },
  };
}
