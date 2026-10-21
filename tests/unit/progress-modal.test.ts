import { ProgressModal } from '../../src/ui/progress-modal';
import { App } from '../mocks/obsidian';

describe('ProgressModal (Feature 010 - US2)', () => {
  let mockApp: App;

  beforeEach(() => {
    mockApp = {
      workspace: { getActiveFile: jest.fn(() => null) },
      vault: {
        adapter: {
          exists: jest.fn(async () => true),
          writeBinary: jest.fn(async () => {}),
          mkdir: jest.fn(async () => {}),
        },
      },
    };
  });

  it('initializes with 0 / total status text and 0% progress bar width on open', () => {
    const modal = new ProgressModal(mockApp as any, 20);
    modal.open();

    expect((modal as any).isOpen).toBe(true);
    expect(modal.contentEl.textContent).toContain('Generating Labels');
    expect(modal.statusText.textContent).toBe('0 / 20');
    expect(modal.progressBar.style.width).toBe('0%');
  });

  it('updates status text and progress bar percentage width on update(current)', () => {
    const modal = new ProgressModal(mockApp as any, 4);
    modal.open();

    modal.update(1);
    expect(modal.current).toBe(1);
    expect(modal.statusText.textContent).toBe('1 / 4');
    expect(modal.progressBar.style.width).toBe('25%');

    modal.update(2);
    expect(modal.statusText.textContent).toBe('2 / 4');
    expect(modal.progressBar.style.width).toBe('50%');

    modal.update(4);
    expect(modal.statusText.textContent).toBe('4 / 4');
    expect(modal.progressBar.style.width).toBe('100%');

    modal.close();
    expect((modal as any).isOpen).toBe(false);
  });
});
