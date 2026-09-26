import { Plugin } from 'obsidian';
import { defaultGenerator, LabelGenerator } from './index';

/**
 * Obsidian Label Community Plugin Entrypoint
 */
export default class ObsidianLabelPlugin extends Plugin {
  public generator: LabelGenerator = defaultGenerator;

  async onload(): Promise<void> {
    console.log('Obsidian Label Plugin loaded successfully.');
  }

  onunload(): void {
    console.log('Obsidian Label Plugin unloaded.');
  }
}
