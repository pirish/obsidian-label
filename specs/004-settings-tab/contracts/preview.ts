/**
 * Contract: Preview Modal & Payload Resolver
 * Feature: 004-settings-tab
 */

import { App, Modal } from 'obsidian';
import { LabelContent } from '../../../src/core/types';
import { ObsidianLabelSettings } from './settings';

export interface PreviewPayload extends LabelContent {
  isSampleFallback: boolean;
}

/**
 * Resolves content to be used for the sample preview:
 * uses the active editor note if available, otherwise realistic sample payload.
 */
export declare function resolvePreviewContent(app: App): PreviewPayload;

/**
 * Interactive modal dialog displaying a rendered label preview.
 */
export declare class PreviewModal extends Modal {
  constructor(
    app: App,
    settings: ObsidianLabelSettings,
    previewContent?: PreviewPayload,
  );
  onOpen(): void;
  onClose(): void;
}
