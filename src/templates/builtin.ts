import { LabelTemplate } from './types';

/**
 * Immutable system presets shipped out of the box with Obsidian Label.
 */
export const BUILTIN_TEMPLATES: LabelTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'QR code on left, title and path on right',
    labelSize: { width: 89, height: 28, dpi: 300 },
    layout: {
      qrCodePlacement: 'left',
      qrCodeSize: 25,
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
      textAlignment: 'left',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#CCCCCC',
    },
    contentRules: {
      showTitle: true,
      showPath: true,
      showDateCreated: false,
      showDateModified: false,
      customFields: [],
      titleMaxLength: 40,
    },
    isBuiltin: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'QR code only, small label for tight spaces',
    labelSize: { width: 30, height: 30, dpi: 300 },
    layout: {
      qrCodePlacement: 'center',
      qrCodeSize: 80,
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      textAlignment: 'center',
    },
    style: {
      fontFamily: 'Arial',
      fontSize: 6,
      fontColor: '#000000',
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: '#000000',
    },
    contentRules: {
      showTitle: false,
      showPath: false,
      showDateCreated: false,
      showDateModified: false,
      customFields: [],
      titleMaxLength: 20,
    },
    isBuiltin: true,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Includes custom metadata fields for cataloging',
    labelSize: { width: 100, height: 50, dpi: 300 },
    layout: {
      qrCodePlacement: 'right',
      qrCodeSize: 30,
      margins: { top: 3, right: 3, bottom: 3, left: 3 },
      textAlignment: 'left',
    },
    style: {
      fontFamily: 'Courier New',
      fontSize: 10,
      fontColor: '#000000',
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#000000',
    },
    contentRules: {
      showTitle: true,
      showPath: false,
      showDateCreated: true,
      showDateModified: false,
      customFields: ['category', 'location', 'serial', 'value'],
      titleMaxLength: 30,
    },
    isBuiltin: true,
  },
];
