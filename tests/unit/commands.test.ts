import { registerLabelCommands } from '../../src/commands/register';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { App, Plugin, TFile } from '../../tests/mocks/obsidian';

class MockCommandPlugin extends Plugin {
  public settings = { ...DEFAULT_SETTINGS };
  public generateLabelCalledWith: any = null;

  async generateLabelForCurrentNote(file: any): Promise<void> {
    this.generateLabelCalledWith = file;
  }

  async showCustomLabelDialog(file: any): Promise<void> {
    this.generateLabelCalledWith = file;
  }

  async regenerateAllLabels(): Promise<void> {}
}

describe('Command Palette Actions - User Story 1 (P1 MVP)', () => {
  let mockApp: App;
  let plugin: MockCommandPlugin;

  beforeEach(() => {
    mockApp = {
      workspace: {
        getActiveFile: jest.fn(() => null),
      },
      vault: {
        getName: jest.fn(() => 'TestVault'),
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
    plugin = new MockCommandPlugin(mockApp as any);
  });

  describe('generate-label-current-note command', () => {
    it('registers command with expected id and name', () => {
      registerLabelCommands(plugin as any);

      const command = plugin.commands.get('generate-label-current-note');
      expect(command).toBeDefined();
      expect(command?.id).toBe('generate-label-current-note');
      expect(command?.name).toBe('Generate Label for Current Note');
      expect(command?.checkCallback).toBeDefined();
    });

    it('returns false when checking and no active file is open', () => {
      registerLabelCommands(plugin as any);
      const command = plugin.commands.get('generate-label-current-note')!;

      mockApp.workspace.getActiveFile = jest.fn(() => null);

      const isAvailable = command.checkCallback!(true);
      expect(isAvailable).toBe(false);
      expect(plugin.generateLabelCalledWith).toBeNull();
    });

    it('returns false when checking and active file is non-markdown', () => {
      registerLabelCommands(plugin as any);
      const command = plugin.commands.get('generate-label-current-note')!;

      const imageFile = new TFile('Images/photo.png');
      mockApp.workspace.getActiveFile = jest.fn(() => imageFile);

      const isAvailable = command.checkCallback!(true);
      expect(isAvailable).toBe(false);
      expect(plugin.generateLabelCalledWith).toBeNull();
    });

    it('returns true when checking and active file is a markdown note', () => {
      registerLabelCommands(plugin as any);
      const command = plugin.commands.get('generate-label-current-note')!;

      const mdFile = new TFile('Notes/Equipment.md');
      mockApp.workspace.getActiveFile = jest.fn(() => mdFile);

      const isAvailable = command.checkCallback!(true);
      expect(isAvailable).toBe(true);
      expect(plugin.generateLabelCalledWith).toBeNull();
    });

    it('executes generation action when checking is false and active file is markdown', () => {
      registerLabelCommands(plugin as any);
      const command = plugin.commands.get('generate-label-current-note')!;

      const mdFile = new TFile('Notes/Equipment.md');
      mockApp.workspace.getActiveFile = jest.fn(() => mdFile);

      const isAvailable = command.checkCallback!(false);
      expect(isAvailable).toBe(true);
      expect(plugin.generateLabelCalledWith).toBe(mdFile);
    });
  });

  describe('generate-label-custom command (User Story 2)', () => {
    it('registers command with expected id and name', () => {
      registerLabelCommands(plugin as any);

      const command = plugin.commands.get('generate-label-custom');
      expect(command).toBeDefined();
      expect(command?.id).toBe('generate-label-custom');
      expect(command?.name).toBe('Generate Label with Custom Settings...');
      expect(command?.checkCallback).toBeDefined();
    });

    it('returns false when checking and no active file is open', () => {
      registerLabelCommands(plugin as any);
      const command = plugin.commands.get('generate-label-custom')!;

      mockApp.workspace.getActiveFile = jest.fn(() => null);

      const isAvailable = command.checkCallback!(true);
      expect(isAvailable).toBe(false);
    });

    it('opens custom label dialog when checking is false and active file is markdown', () => {
      registerLabelCommands(plugin as any);
      const command = plugin.commands.get('generate-label-custom')!;

      const mdFile = new TFile('Equipment/Laser.md');
      mockApp.workspace.getActiveFile = jest.fn(() => mdFile);

      const isAvailable = command.checkCallback!(false);
      expect(isAvailable).toBe(true);
      expect(plugin.generateLabelCalledWith).toBe(mdFile);
    });
  });

  describe('regenerate-all-labels command (User Story 3)', () => {
    it('registers command with expected id and name', () => {
      registerLabelCommands(plugin as any);

      const command = plugin.commands.get('regenerate-all-labels');
      expect(command).toBeDefined();
      expect(command?.id).toBe('regenerate-all-labels');
      expect(command?.name).toBe('Regenerate All Labels in Vault');
      expect(command?.callback).toBeDefined();
    });

    it('invokes regenerateAllLabels when callback is triggered', () => {
      const spy = jest.spyOn(plugin, 'regenerateAllLabels');
      registerLabelCommands(plugin as any);

      const command = plugin.commands.get('regenerate-all-labels')!;
      command.callback!();

      expect(spy).toHaveBeenCalled();
    });
  });
});
