import { LabelPreset } from './types';

export const BUILTIN_PRESETS: LabelPreset[] = [
  {
    id: 'phomemo-40x30',
    name: 'Phomemo 40mm x 30mm',
    description: 'Compact continuous/gap thermal roll for bins and micro-storage',
    size: { width: 40, height: 30, dpi: 300 },
    defaultLayout: {
      qrCodePlacement: 'left',
      qrCodeSize: 0.65,
      margins: { top: 2, right: 2, bottom: 2, left: 2 },
      textAlignment: 'left',
    },
  },
  {
    id: 'dymo-89x28',
    name: 'Dymo 89mm x 28mm (Standard Address)',
    description: 'Wide format label for file folders and equipment tags',
    size: { width: 89, height: 28, dpi: 300 },
    defaultLayout: {
      qrCodePlacement: 'left',
      qrCodeSize: 0.75,
      margins: { top: 2, right: 3, bottom: 2, left: 3 },
      textAlignment: 'left',
    },
  },
  {
    id: 'brother-62x100',
    name: 'Brother 62mm x 100mm (Shipping / Large Asset)',
    description: 'Large format shipping and industrial asset label',
    size: { width: 62, height: 100, dpi: 300 },
    defaultLayout: {
      qrCodePlacement: 'top',
      qrCodeSize: 0.45,
      margins: { top: 4, right: 4, bottom: 4, left: 4 },
      textAlignment: 'center',
    },
  },
  {
    id: 'avery-5160',
    name: 'Avery 5160 (66.7mm x 25.4mm)',
    description: 'Standard desktop laser/inkjet 30-up address sheet',
    size: { width: 66.7, height: 25.4, dpi: 300 },
    defaultLayout: {
      qrCodePlacement: 'left',
      qrCodeSize: 0.7,
      margins: { top: 1.5, right: 2.5, bottom: 1.5, left: 2.5 },
      textAlignment: 'left',
    },
  },
];
