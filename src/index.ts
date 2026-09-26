/**
 * Obsidian Label Generation Engine
 * Public Module Exports
 */

export * from './core/types';
export * from './core/dimensions';
export * from './core/validator';
export * from './core/presets';
export * from './core/qr';
export * from './core/layout';
export * from './core/typography';
export * from './core/canvas-renderer';
export * from './core/pdf-exporter';
export * from './core/label-generator';

import { LabelGenerator } from './core/label-generator';

// Default global generator instance
export const defaultGenerator = new LabelGenerator();
