import { Plugin } from 'obsidian';
import { defaultGenerator, LabelGenerator } from './index';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from './settings/types';
import { ObsidianLabelSettingTab } from './ui/settings-tab';
import { PreviewModal } from './ui/preview-modal';

/**
 * Obsidian Label Community Plugin Entrypoint
 */
export default class ObsidianLabelPlugin extends Plugin {
  public generator: LabelGenerator = defaultGenerator;
  public settings: ObsidianLabelSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ObsidianLabelSettingTab(this.app, this));
    console.log('Obsidian Label Plugin loaded successfully.');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async generatePreviewLabel(): Promise<void> {
    const modal = new PreviewModal(this.app, this.settings, undefined, this.generator);
    modal.open();
  }

  onunload(): void {
    console.log('Obsidian Label Plugin unloaded.');
  }
}
