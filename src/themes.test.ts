import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  filterThemes,
  getThemeCatalog,
  NEX_SHOP_THEME_CATALOG_URL,
  ThemeCatalogError,
  validateThemeCatalog,
  type ThemeItem,
} from './themes';

afterEach(() => vi.unstubAllGlobals());

const validTheme: ThemeItem = {
  id: 'neon-folders',
  name: 'Neon Folders',
  description: 'Um pacote de arte para pastas.',
  version: '1.0.0',
  author: { name: 'NEX Community', url: 'https://github.com' },
  license: 'CC-BY-4.0',
  sourceUrl: 'https://github.com/example/neon-folders',
  categories: ['smart-folder-art', 'backgrounds'],
  targetApps: ['zneko'],
  compatibility: { zneko: 'a confirmar' },
  previewImages: ['https://example.com/preview.png'],
  package: {
    url: 'https://github.com/example/neon-folders/releases/download/v1/theme.zip',
    format: 'zip',
    sha256: 'a'.repeat(64),
    sizeBytes: 2048,
  },
  publishedAt: '2026-10-28T00:00:00.000Z',
};

const validDocument = () => ({
  schemaVersion: 1,
  updatedAt: '2026-10-28T00:00:00.000Z',
  items: [{ ...validTheme, author: { ...validTheme.author }, package: { ...validTheme.package } }],
});

describe('NEX Shop theme catalog', () => {
  it('accepts an empty catalog while it is being curated', () => {
    expect(validateThemeCatalog({
      schemaVersion: 1,
      updatedAt: '2026-10-28T00:00:00.000Z',
      items: [],
    }).items).toEqual([]);
  });

  it('validates a correctly shaped theme', () => {
    expect(validateThemeCatalog(validDocument()).items[0].id).toBe('neon-folders');
  });

  it('rejects HTTP and malformed download URLs', () => {
    const document = validDocument();
    document.items[0].package.url = 'http://example.com/theme.zip';
    expect(() => validateThemeCatalog(document)).toThrow(ThemeCatalogError);
  });

  it('requires a SHA-256 digest and a positive package size', () => {
    const missingHash = validDocument();
    missingHash.items[0].package.sha256 = 'not-a-hash';
    expect(() => validateThemeCatalog(missingHash)).toThrow(ThemeCatalogError);

    const invalidSize = validDocument();
    invalidSize.items[0].package.sizeBytes = 0;
    expect(() => validateThemeCatalog(invalidSize)).toThrow(ThemeCatalogError);
  });

  it('rejects duplicate IDs', () => {
    const document = validDocument();
    document.items.push({ ...document.items[0] });
    expect(() => validateThemeCatalog(document)).toThrow(/duplicados/);
  });

  it('filters by text and category', () => {
    expect(filterThemes([validTheme], 'neon', 'all')).toHaveLength(1);
    expect(filterThemes([validTheme], '', 'smart-folder-art')).toHaveLength(1);
    expect(filterThemes([validTheme], '', 'sound-packs')).toHaveLength(0);
  });

  it('loads the public NEX Shop endpoint and validates its response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(validDocument()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const catalog = await getThemeCatalog(undefined, NEX_SHOP_THEME_CATALOG_URL);
    expect(catalog.items[0].id).toBe('neon-folders');
    expect(fetchMock.mock.calls[0][0]).toBe(NEX_SHOP_THEME_CATALOG_URL);
  });

  it('rejects an insecure catalog URL', async () => {
    await expect(getThemeCatalog(undefined, 'http://example.com/catalog.json')).rejects.toThrow(/HTTPS/);
  });

  it('handles network errors without exposing internal fetch details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(getThemeCatalog()).rejects.toThrow(/conectar ao catálogo/);
  });
});
