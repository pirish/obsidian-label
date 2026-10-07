import {
  formatDate,
  formatFrontmatterValue,
  resolveContentLines,
  truncateTitle,
} from '../../src/templates/extractor';
import { ContentRules } from '../../src/templates/types';
import { TFile } from '../../tests/mocks/obsidian';

describe('Content Extraction & Formatting Pipeline (Foundational)', () => {
  let sampleFile: TFile;
  let mockMetadataCache: any;

  beforeEach(() => {
    sampleFile = new TFile('Inventory/Hardware/Multimeter Pro.md');
    sampleFile.stat = {
      ctime: new Date(2026, 8, 15).getTime(), // Sep 15, 2026
      mtime: new Date(2026, 9, 1).getTime(), // Oct 1, 2026
      size: 512,
    };

    mockMetadataCache = {
      getFileCache: jest.fn(() => ({
        frontmatter: {
          category: ['Electronics', 'Testing Tools'],
          location: 'Lab Shelf B-2',
          serial: 'SN-98234',
          value: '$249.99',
          unwanted_prop: 'hidden',
        },
      })),
    };
  });

  describe('truncateTitle', () => {
    it('returns original title when length is within limit', () => {
      expect(truncateTitle('Oscilloscope', 20)).toBe('Oscilloscope');
      expect(truncateTitle('Exact Length', 12)).toBe('Exact Length');
    });

    it('truncates title with ellipsis when exceeding limit', () => {
      const truncated = truncateTitle('High-Precision Digital Multimeter Pro', 20);
      expect(truncated).toBe('High-Precision Digit...');
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('handles empty or zero maxLength edge cases', () => {
      expect(truncateTitle('', 10)).toBe('');
      expect(truncateTitle('Item', 0)).toBe('Item');
    });
  });

  describe('formatFrontmatterValue', () => {
    it('returns empty string for null or undefined values', () => {
      expect(formatFrontmatterValue(null)).toBe('');
      expect(formatFrontmatterValue(undefined)).toBe('');
    });

    it('formats plain strings and numbers', () => {
      expect(formatFrontmatterValue('Lab B')).toBe('Lab B');
      expect(formatFrontmatterValue(42)).toBe('42');
    });

    it('serializes YAML array/list properties into comma-separated text', () => {
      expect(formatFrontmatterValue(['Sensor', 'Calibrated', 'Active'])).toBe(
        'Sensor, Calibrated, Active',
      );
      expect(formatFrontmatterValue(['Single Item'])).toBe('Single Item');
    });

    it('handles empty arrays', () => {
      expect(formatFrontmatterValue([])).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats millisecond timestamp to YYYY-MM-DD', () => {
      const ts = new Date(2026, 9, 7).getTime();
      expect(formatDate(ts)).toBe('2026-10-07');
    });

    it('returns empty string for invalid timestamp', () => {
      expect(formatDate(0)).toBe('');
      expect(formatDate(NaN)).toBe('');
    });
  });

  describe('resolveContentLines', () => {
    it('resolves title, path, dates, and custom frontmatter fields in inventory format', () => {
      const rules: ContentRules = {
        showTitle: true,
        showPath: true,
        showDateCreated: true,
        showDateModified: false,
        customFields: ['category', 'location', 'serial', 'value'],
        titleMaxLength: 30,
      };

      const lines = resolveContentLines(sampleFile, rules, mockMetadataCache);

      expect(lines.length).toBe(7);
      expect(lines[0]).toEqual({ type: 'title', text: 'Multimeter Pro' });
      expect(lines[1]).toEqual({ type: 'path', text: 'Inventory/Hardware' });
      expect(lines[2]).toEqual({ type: 'date_created', label: 'Created', text: '2026-09-15' });
      expect(lines[3]).toEqual({
        type: 'custom_field',
        label: 'Category',
        text: 'Electronics, Testing Tools',
      });
      expect(lines[4]).toEqual({ type: 'custom_field', label: 'Location', text: 'Lab Shelf B-2' });
      expect(lines[5]).toEqual({ type: 'custom_field', label: 'Serial', text: 'SN-98234' });
      expect(lines[6]).toEqual({ type: 'custom_field', label: 'Value', text: '$249.99' });
    });

    it('omits disabled content fields (Compact template behavior)', () => {
      const rules: ContentRules = {
        showTitle: false,
        showPath: false,
        showDateCreated: false,
        showDateModified: false,
        customFields: [],
        titleMaxLength: 20,
      };

      const lines = resolveContentLines(sampleFile, rules, mockMetadataCache);
      expect(lines.length).toBe(0);
    });

    it('omits non-existent custom fields gracefully without throwing', () => {
      const rules: ContentRules = {
        showTitle: true,
        showPath: false,
        showDateCreated: false,
        showDateModified: false,
        customFields: ['non_existent_key_1', 'location', 'missing_field_2'],
        titleMaxLength: 40,
      };

      const lines = resolveContentLines(sampleFile, rules, mockMetadataCache);
      expect(lines.length).toBe(2);
      expect(lines[0].type).toBe('title');
      expect(lines[1]).toEqual({ type: 'custom_field', label: 'Location', text: 'Lab Shelf B-2' });
    });
  });
});
