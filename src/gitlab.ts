import { ApiError, prioritizeStableReleases, type Category, type Repo, type Release, type ReleaseAsset, type SearchPage } from './github';
import type { ReleaseProvider } from './provider';

const API = 'https://gitlab.com/api/v4';
const TTL = 5 * 60_000;
const PAGE_SIZE = 24;
const cache = new Map<string, { until: number; value: unknown; headers: Record<string, string> }>();
const categoryTerms: Record<Category, string> = {
  all: '',
  emulators: 'emulator',
  ports: 'game-port',
  homebrew: 'homebrew',
};

type GitLabNamespace = { name?: string; full_path?: string; web_url?: string };
type GitLabProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  description: string | null;
  namespace?: GitLabNamespace;
  star_count?: number;
  last_activity_at?: string;
  created_at?: string;
  default_branch?: string | null;
  topics?: string[];
  archived?: boolean;
};
type GitLabRelease = {
  tag_name: string;
  name: string | null;
  released_at: string | null;
  description: string | null;
  assets?: { links?: Array<{ name?: string; direct_asset_url?: string | null; url?: string }> };
};

function retryTime(response: Response): number | undefined {
  const retryAfter = Number(response.headers.get('Retry-After'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Date.now() + retryAfter * 1000;
  const reset = Number(response.headers.get('RateLimit-Reset'));
  return Number.isFinite(reset) && reset > 0 ? reset * 1000 : undefined;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<{ data: T; response: Response }> {
  const url = `${API}${path}`;
  const hit = cache.get(url);
  if (hit && hit.until > Date.now()) return { data: hit.value as T, response: new Response(null, { status: 200, headers: hit.headers }) };

  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Falha de rede ao conectar à API pública do GitLab. Verifique a conexão e tente novamente.');
  }

  if (!response.ok) {
    const retryAt = retryTime(response);
    if (response.status === 429 || response.status === 403) {
      throw new ApiError(
        'O GitLab limitou temporariamente as consultas públicas.' + (retryAt ? ` Tente novamente ${new Date(retryAt).toLocaleTimeString('pt-BR')}.` : ''),
        response.status,
        retryAt,
      );
    }
    if (response.status === 404) throw new ApiError('Este projeto ou release não foi encontrado no GitLab.', 404);
    throw new ApiError(`O GitLab respondeu com erro (${response.status}). Tente novamente mais tarde.`, response.status);
  }

  let data: T;
  try {
    data = await response.json() as T;
  } catch {
    throw new ApiError('O GitLab retornou uma resposta inválida. Tente novamente mais tarde.', response.status);
  }
  const headers: Record<string, string> = {};
  for (const name of ['X-Total', 'X-Total-Pages', 'X-Next-Page']) {
    const value = response.headers.get(name);
    if (value) headers[name] = value;
  }
  cache.set(url, { value: data, until: Date.now() + TTL, headers });
  return { data, response };
}

function projectPath(fullName: string): string {
  const normalized = fullName.trim().replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '');
  if (!normalized || normalized.split('/').length < 2 || normalized.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new ApiError('Informe o caminho público do projeto no formato grupo/projeto.');
  }
  return encodeURIComponent(normalized);
}

function mapProject(project: GitLabProject): Repo {
  const namespace = project.namespace?.full_path || project.path_with_namespace.split('/').slice(0, -1).join('/');
  const ownerUrl = project.namespace?.web_url || `${new URL(project.web_url).origin}/${namespace.split('/').map(encodeURIComponent).join('/')}`;
  return {
    id: project.id,
    name: project.name,
    full_name: project.path_with_namespace,
    html_url: project.web_url,
    description: project.description,
    owner: { login: namespace, html_url: ownerUrl },
    language: null,
    stargazers_count: project.star_count ?? 0,
    updated_at: project.last_activity_at ?? project.created_at ?? '',
    default_branch: project.default_branch ?? '',
    topics: project.topics ?? [],
    license: null,
    forks_count: 0,
    open_issues_count: 0,
    created_at: project.created_at ?? '',
    homepage: null,
    archived: project.archived ?? false,
    disabled: false,
    provider: 'gitlab',
  };
}

function isGitLabDirectAsset(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'gitlab.com' && /\/-\/releases\/[^/]+\/downloads\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

function mapRelease(release: GitLabRelease, projectUrl: string): Release {
  const prerelease = /(?:^|[-_.])(?:alpha|beta|rc|nightly|preview|experimental|dev)(?:[-_.\d]|$)/i.test(release.tag_name);
  const assets: ReleaseAsset[] = (release.assets?.links ?? [])
    .filter(asset => typeof asset.direct_asset_url === 'string' && isGitLabDirectAsset(asset.direct_asset_url))
    .map(asset => ({
      name: asset.name || 'Ativo da release',
      size: 0,
      browser_download_url: asset.direct_asset_url!,
      content_type: 'application/octet-stream',
      download_count: 0,
    }));
  return {
    tag_name: release.tag_name,
    name: release.name,
    html_url: `${projectUrl.replace(/\/$/, '')}/-/releases/${encodeURIComponent(release.tag_name)}`,
    published_at: release.released_at,
    body: release.description,
    draft: false,
    prerelease,
    assets,
  };
}

export const gitLabProvider: ReleaseProvider = {
  id: 'gitlab',
  label: 'GitLab',
  async search(query, category, page, signal): Promise<SearchPage> {
    const terms = [query.trim(), categoryTerms[category]].filter(Boolean).join(' ') || 'game';
    const params = new URLSearchParams({ search: terms, order_by: 'star_count', sort: 'desc', page: String(page), per_page: String(PAGE_SIZE), simple: 'true' });
    const { data, response } = await get<GitLabProject[]>(`/projects?${params}`, signal);
    const totalHeader = response.headers.get('X-Total');
    const total = totalHeader && Number.isFinite(Number(totalHeader)) ? Number(totalHeader) : (page - 1) * PAGE_SIZE + data.length;
    return { items: data.map(mapProject), total_count: total, incomplete_results: false };
  },
  async getProject(fullName, signal): Promise<Repo> {
    const { data } = await get<GitLabProject>(`/projects/${projectPath(fullName)}`, signal);
    return mapProject(data);
  },
  async getReleases(fullName, signal): Promise<Release[]> {
    const path = projectPath(fullName);
    const { data } = await get<GitLabRelease[]>(`/projects/${path}/releases?per_page=10`, signal);
    const projectUrl = `https://gitlab.com/${fullName.trim().replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '').split('/').map(encodeURIComponent).join('/')}`;
    return prioritizeStableReleases(data.map(release => mapRelease(release, projectUrl)));
  },
};
