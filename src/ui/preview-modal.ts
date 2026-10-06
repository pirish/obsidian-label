import { App, ButtonComponent, Modal, Notice } from 'obsidian';
import { LabelGenerator } from '../core/label-generator';
import { LabelContent } from '../core/types';
import { generateObsidianURI } from '../core/uri';
import { settingsToLabelConfig } from '../settings/mappers';
import { ObsidianLabelSettings } from '../settings/types';
import { validatePluginSettings } from '../settings/validator';

export interface PreviewPayload extends LabelContent {
  isSampleFallback: boolean;
}

/**
 * Resolves preview content using the currently active editor note,
 * falling back to a sample note payload if no note is active.
 */
export function resolvePreviewContent(app: App): PreviewPayload {
  const activeFile = app.workspace?.getActiveFile ? app.workspace.getActiveFile() : null;

  if (activeFile && (activeFile.basename || activeFile.name)) {
    const noteTitle = activeFile.basename || activeFile.name;
    const vaultName = typeof app.vault?.getName === 'function' ? app.vault.getName() : 'Obsidian';
    const filePath = activeFile.path || noteTitle;
    const obsidianUri = generateObsidianURI(vaultName, filePath);

    return {
      noteTitle,
      obsidianUri,
      notePath: filePath,
      isSampleFallback: false,
    };
  }

  return {
    noteTitle: 'Sample Equipment Note',
    obsidianUri: 'obsidian://open?vault=SampleVault&file=Equipment%2FLab%20Sensor%20A',
    notePath: 'Equipment/Lab Sensor A.md',
    customFields: {
      Serial: 'SN-90210',
      Location: 'Rack 4B',
    },
    isSampleFallback: true,
  };
}

/**
 * Modal dialog for rendering a live sample label preview.
 */
export class PreviewModal extends Modal {
  public settings: ObsidianLabelSettings;
  public previewContent: PreviewPayload;
  public generator: LabelGenerator;
  public previewImageEl?: HTMLElement;
  public closeButton?: ButtonComponent;

  constructor(
    app: App,
    settings: ObsidianLabelSettings,
    previewContent?: PreviewPayload,
    generator: LabelGenerator = new LabelGenerator(),
  ) {
    super(app);
    this.settings = settings;
    this.previewContent = previewContent || resolvePreviewContent(app);
    this.generator = generator;
  }

  async onOpen(): Promise<void> {
    const { contentEl, titleEl } = this;
    contentEl.empty();

    if (typeof (titleEl as any).setText === 'function') {
      (titleEl as any).setText('Label Preview');
    } else {
      titleEl.textContent = 'Label Preview';
    }

    // Validate settings before attempting render
    const validation = validatePluginSettings(this.settings);
    if (!validation.isValid) {
      new Notice(`Cannot preview: ${validation.errors[0].message}`);
      const errorDiv = contentEl.createDiv({ cls: 'obsidian-label-preview-error' });
      if (typeof (errorDiv as any).setText === 'function') {
        (errorDiv as any).setText(validation.errors[0].message);
      } else {
        errorDiv.textContent = validation.errors[0].message;
      }
      this.createCloseButton(contentEl);
      return;
    }

    // Source indication banner
    const bannerEl = contentEl.createDiv({ cls: 'obsidian-label-preview-banner' });
    if (this.previewContent.isSampleFallback) {
      bannerEl.createEl('p', {
        text: 'Previewing Sample Note (no active note detected)',
        cls: 'setting-item-description',
      });
    } else {
      bannerEl.createEl('p', {
        text: `Previewing Active Note: ${this.previewContent.noteTitle}`,
        cls: 'setting-item-description',
      });
    }

    // Dimension and preset details
    const dimensionInfo = contentEl.createDiv({ cls: 'obsidian-label-preview-info' });
    const config = settingsToLabelConfig(this.settings);
    const presetName =
      this.settings.defaultLabelSize === 'custom'
        ? `Custom (${this.settings.customWidth}×${this.settings.customHeight}mm)`
        : `${this.settings.defaultLabelSize} (${config.size.width}×${config.size.height}mm)`;

    dimensionInfo.createEl('div', {
      text: `Size: ${presetName} • QR: ${this.settings.qrCodePlacement} (${this.settings.qrCodeSize}%)`,
      cls: 'setting-item-description',
    });

    // Generate preview
    try {
      const rendered = await this.generator.generate(config, this.previewContent);
      const imgContainer = contentEl.createDiv({
        cls: 'obsidian-label-preview-image-container',
      });
      const img = imgContainer.createEl('img', {
        cls: 'obsidian-label-preview-image',
      });
      img.setAttribute('src', rendered.previewDataUrl);
      img.setAttribute('alt', `Preview of ${this.previewContent.noteTitle}`);
      this.previewImageEl = img;
    } catch (err: any) {
      const errorDiv = contentEl.createDiv({ cls: 'obsidian-label-preview-error' });
      const msg = `Preview generation failed: ${err.message || String(err)}`;
      if (typeof (errorDiv as any).setText === 'function') {
        (errorDiv as any).setText(msg);
      } else {
        errorDiv.textContent = msg;
      }
    }

    this.createCloseButton(contentEl);
  }

  private createCloseButton(container: HTMLElement): void {
    const buttonContainer = container.createDiv({ cls: 'modal-button-container' });
    this.closeButton = new ButtonComponent(buttonContainer).setButtonText('Close').onClick(() => {
      this.close();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
