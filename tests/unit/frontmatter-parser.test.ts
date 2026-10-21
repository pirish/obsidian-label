import { parseFrontmatterLabelConfig } from '../../src/frontmatter/parser';
import { DEFAULT_SETTINGS } from '../../src/settings/types';
import { createRenderingCanvas, renderCustomFields } from '../../src/core/canvas-renderer';
import { resolveContentLines } from '../../src/templates/extractor';
import { BUILTIN_TEMPLATES } from '../../src/templates/builtin';
import { TFile } from '../mocks/obsidian';

describe('Frontmatter Label Configuration Parser & Custom Fields', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseFrontmatterLabelConfig', () => {
    it('returns empty config with zero warnings when frontmatter is missing or empty', () => {
      expect(parseFrontmatterLabelConfig(null, DEFAULT_SETTINGS)).toEqual({ warnings: [] });
      expect(parseFrontmatterLabelConfig(undefined, DEFAULT_SETTINGS)).toEqual({ warnings: [] });
      expect(parseFrontmatterLabelConfig({}, DEFAULT_SETTINGS)).toEqual({ warnings: [] });
    });

    it('parses valid structured label block with template, customFields, qrCodeSize, and fontSize', () => {
      const fm = {
        label: {
          template: 'inventory',
          customFields: {
            category: 'Electronics',
            location: 'Shelf B3',
            serial: 'ABC123',
            value: '$450',
          },
          qrCodeSize: 35,
          fontSize: 14,
          labelSize: 'brother-62mm',
          customWidth: 62,
          customHeight: 100,
          qrCodePlacement: 'right',
        },
      };

      const parsed = parseFrontmatterLabelConfig(fm, DEFAULT_SETTINGS);

      expect(parsed.warnings).toHaveLength(0);
      expect(parsed.templateId).toBe('inventory');
      expect(parsed.customFields).toEqual({
        category: 'Electronics',
        location: 'Shelf B3',
        serial: 'ABC123',
        value: '$450',
      });
      expect(parsed.qrCodeSize).toBe(35);
      expect(parsed.fontSize).toBe(14);
      expect(parsed.defaultLabelSize).toBe('brother-62mm');
      expect(parsed.customWidth).toBe(62);
      expect(parsed.customHeight).toBe(100);
      expect(parsed.qrCodePlacement).toBe('right');
    });

    it('coerces numeric and boolean customFields values to strings and skips invalid values with warnings', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const fm = {
        label: {
          customFields: {
            SKU: 90210,
            active: true,
            nestedObj: { bad: 1 },
            emptyNull: null,
          },
        },
      };

      const parsed = parseFrontmatterLabelConfig(fm, DEFAULT_SETTINGS);

      expect(parsed.customFields).toEqual({
        SKU: '90210',
        active: 'true',
      });
      expect(parsed.warnings).toHaveLength(2);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it('prioritizes nested label.* properties over legacy flat frontmatter keys', () => {
      const fm = {
        template: 'compact',
        qr_size: 20,
        label_size: 'avery-5160',
        label: {
          template: 'inventory',
          qrCodeSize: 40,
          labelSize: 'phomemo-40x30',
        },
      };

      const parsed = parseFrontmatterLabelConfig(fm, DEFAULT_SETTINGS);

      expect(parsed.templateId).toBe('inventory');
      expect(parsed.qrCodeSize).toBe(40);
      expect(parsed.defaultLabelSize).toBe('phomemo-40x30');
    });

    it('ignores invalid frontmatter values and logs descriptive console warnings', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const fm = {
        label: {
          template: 'nonexistent-template',
          qrCodeSize: 95, // outside 10-50
          fontSize: -5, // non-positive
          labelSize: 'unknown-preset',
          customWidth: 0,
          customHeight: -20,
          qrCodePlacement: 'diagonal',
          customFields: 'not-an-object',
        },
      };

      const parsed = parseFrontmatterLabelConfig(fm, DEFAULT_SETTINGS);

      expect(parsed.templateId).toBeUndefined();
      expect(parsed.qrCodeSize).toBeUndefined();
      expect(parsed.fontSize).toBeUndefined();
      expect(parsed.defaultLabelSize).toBeUndefined();
      expect(parsed.customWidth).toBeUndefined();
      expect(parsed.customHeight).toBeUndefined();
      expect(parsed.qrCodePlacement).toBeUndefined();
      expect(parsed.customFields).toBeUndefined();
      expect(parsed.warnings.length).toBe(8);
      expect(warnSpy).toHaveBeenCalledTimes(8);
    });

    it('handles scalar or array label property gracefully with warning while keeping valid flat keys', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const fm = {
        qr_size: 30,
        label: 'invalid-scalar-label',
      };

      const parsed = parseFrontmatterLabelConfig(fm, DEFAULT_SETTINGS);

      expect(parsed.qrCodeSize).toBe(30);
      expect(parsed.warnings).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ignored invalid frontmatter "label" section'),
      );
    });
  });

  describe('resolveContentLines with customFields override (US2)', () => {
    it('overrides template contentRules.customFields with label.customFields while preserving exact key casing', () => {
      const file = new TFile('Warehouse/Router.md');
      const inventoryTemplate = BUILTIN_TEMPLATES.find((t) => t.id === 'inventory')!;
      const mockMetadataCache = {
        getFileCache: () => ({
          frontmatter: {
            category: 'ShouldBeIgnoredByOverride',
            location: 'AlsoIgnored',
          },
        }),
      };

      const lines = resolveContentLines(
        file as any,
        inventoryTemplate.contentRules,
        mockMetadataCache,
        {
          category: 'Electronics',
          location: 'Shelf B3',
          SKU: 'RT-8800',
        },
      );

      const customLines = lines.filter((l) => l.type === 'custom_field');
      expect(customLines).toEqual([
        { type: 'custom_field', label: 'category', text: 'Electronics' },
        { type: 'custom_field', label: 'location', text: 'Shelf B3' },
        { type: 'custom_field', label: 'SKU', text: 'RT-8800' },
      ]);
    });
  });

  describe('renderCustomFields (US2)', () => {
    it('renders key-value lines and truncates long values to fit maxWidth', () => {
      const canvas = createRenderingCanvas(200, 100);
      const ctx = canvas.getContext('2d')!;
      ctx.font = '14px Arial';
      const fillTextSpy = jest.spyOn(ctx, 'fillText');

      const nextY = renderCustomFields(
        ctx,
        {
          category: 'Electronics',
          description:
            'Extremely long description that exceeds the available width of a narrow physical label',
        },
        10,
        20,
        200,
        16,
      );

      expect(nextY).toBe(20 + 32);
      expect(fillTextSpy).toHaveBeenCalledTimes(2);
      expect(fillTextSpy.mock.calls[0][0]).toBe('category: Electronics');
      expect(fillTextSpy.mock.calls[1][0]).toContain('...');
    });
  });
});
