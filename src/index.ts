/**
 * Obsidian Label Generation Engine & UI
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
export * from './core/uri';
export * from './settings/types';
export * from './settings/validator';
export * from './settings/mappers';
export * from './ui/settings-tab';
export * from './ui/preview-modal';
export * from './ui/custom-label-modal';
export * from './ui/batch-confirm-modal';
export * from './commands/orchestrator';
export * from './commands/batch-processor';
export * from './commands/register';
export * from './commands/context-menu';

import { LabelGenerator } from './core/label-generator';

// Default global generator instance
export const defaultGenerator = new LabelGenerator();
