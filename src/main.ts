import { Notice, Plugin, TFile } from 'obsidian';
import { generateLabelForNote } from './commands/orchestrator';
import { discoverEligibleNotes, regenerateAllLabels } from './commands/batch-processor';
import { registerLabelCommands } from './commands/register';
import { registerFileMenuEvents } from './commands/context-menu';
import { defaultGenerator, LabelGenerator } from './index';
import { DEFAULT_SETTINGS, ObsidianLabelSettings } from './settings/types';
import { ObsidianLabelSettingTab } from './ui/settings-tab';
import { PreviewModal } from './ui/preview-modal';
import { CustomLabelModal } from './ui/custom-label-modal';
import { BatchConfirmModal } from './ui/batch-confirm-modal';

/**
 * Obsidian Label Community Plugin Entrypoint
 */
export default class ObsidianLabelPlugin extends Plugin {
  public generator: LabelGenerator = defaultGenerator;
  public settings: ObsidianLabelSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ObsidianLabelSettingTab(this.app, this));
    registerLabelCommands(this);
    registerFileMenuEvents(this);
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

  async generateLabelForCurrentNote(file: TFile): Promise<void> {
    await generateLabelForNote(this.app, file, this.settings, undefined, this.generator);
  }

  async showCustomLabelDialog(file: TFile): Promise<void> {
    const modal = new CustomLabelModal(this.app, file, this.settings, async (overrides) => {
      await generateLabelForNote(this.app, file, this.settings, overrides, this.generator);
    });
    modal.open();
  }

  async regenerateAllLabels(): Promise<void> {
    const eligible = await discoverEligibleNotes(this.app, this.settings);
    if (eligible.length === 0) {
      new Notice('No existing label PDFs found to regenerate.');
      return;
    }
    const modal = new BatchConfirmModal(this.app, eligible.length, async () => {
      await regenerateAllLabels(this.app, this.settings, this.generator);
    });
    modal.open();
  }

  onunload(): void {
    console.log('Obsidian Label Plugin unloaded.');
  }
}
