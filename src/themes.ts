export const THEME_CATEGORIES = [
  'smart-folder-art',
  'icons',
  'backgrounds',
  'logos',
  'complete-themes',
  'sound-packs',
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];
export type ThemeCategoryFilter = ThemeCategory | 'all';

export const THEME_CATEGORY_LABELS: Record<ThemeCategory, string> = {
  'smart-folder-art': 'Smart folder art',
  icons: 'Ícones',
  backgrounds: 'Planos de fundo',
  logos: 'Logos',
  'complete-themes': 'Temas completos',
  'sound-packs': 'Sons e músicas',
};

export type ThemePackage = {
  url: string;
  format: 'zip';
  sha256: string;
  sizeBytes: number;
};

export type ThemeItem = {
  id: string;
  name: string;
  description: string;
  version: string;
  author: { name: string; url?: string };
  license: string;
  sourceUrl: string;
  categories: ThemeCategory[];
  targetApps: string[];
  compatibility: Record<string, string>;
  previewImages: string[];
  package: ThemePackage;
  publishedAt: string;
};

export type ThemeCatalogDocument = {
  schemaVersion: 1;
  updatedAt: string;
  items: ThemeItem[];
};

export class ThemeCatalogError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ThemeCatalogError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDate(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function validateThemeItem(value: unknown): value is ThemeItem {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) return false;
  if (!isNonEmptyString(value.name) || !isNonEmptyString(value.description)) return false;
  if (!isNonEmptyString(value.version) || !isNonEmptyString(value.license)) return false;
  if (!isHttpsUrl(value.sourceUrl) || !isIsoDate(value.publishedAt)) return false;
  if (!Array.isArray(value.categories) || value.categories.length === 0) return false;
  if (!value.categories.every((category) => THEME_CATEGORIES.includes(category as ThemeCategory))) return false;
  if (!Array.isArray(value.targetApps) || value.targetApps.length === 0) return false;
  if (!value.targetApps.every(isNonEmptyString)) return false;
  if (!Array.isArray(value.previewImages) || !value.previewImages.every(isHttpsUrl)) return false;
  if (!isRecord(value.author) || !isNonEmptyString(value.author.name)) return false;
  if (value.author.url !== undefined && !isHttpsUrl(value.author.url)) return false;
  if (!isRecord(value.compatibility)) return false;
  if (!isRecord(value.package)) return false;
  if (!isHttpsUrl(value.package.url) || value.package.format !== 'zip') return false;
  if (typeof value.package.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(value.package.sha256)) return false;
  if (!Number.isSafeInteger(value.package.sizeBytes) || Number(value.package.sizeBytes) <= 0) return false;
  return true;
}

export function validateThemeCatalog(value: unknown): ThemeCatalogDocument {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isIsoDate(value.updatedAt) || !Array.isArray(value.items)) {
    throw new ThemeCatalogError('O catálogo de temas está em um formato inválido.');
  }

  const seen = new Set<string>();
  for (const item of value.items) {
    if (!validateThemeItem(item)) {
      throw new ThemeCatalogError('O catálogo contém um tema com metadados inválidos. A entrada foi recusada.');
    }
    if (seen.has(item.id)) {
      throw new ThemeCatalogError('O catálogo contém IDs de temas duplicados.');
    }
    seen.add(item.id);
  }

  return value as unknown as ThemeCatalogDocument;
}

export async function getThemeCatalog(signal?: AbortSignal): Promise<ThemeCatalogDocument> {
  let response: Response;
  try {
    response = await fetch('/catalog/themes/v1/index.json', {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ThemeCatalogError('Não foi possível conectar ao catálogo de temas da NEX Shop.');
  }

  if (!response.ok) {
    throw new ThemeCatalogError('O catálogo de temas respondeu com erro (' + response.status + ').', response.status);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ThemeCatalogError('O catálogo de temas retornou JSON inválido.');
  }

  return validateThemeCatalog(data);
}

export function filterThemes(
  items: ThemeItem[],
  query: string,
  category: ThemeCategoryFilter,
): ThemeItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  return items.filter((item) => {
    const categoryMatches = category === 'all' || item.categories.includes(category);
    if (!categoryMatches) return false;
    if (!normalizedQuery) return true;
    const searchable = [
      item.name,
      item.description,
      item.author.name,
      item.categories.map((entry) => THEME_CATEGORY_LABELS[entry]).join(' '),
    ].join(' ').toLocaleLowerCase('pt-BR');
    return searchable.includes(normalizedQuery);
  });
}
