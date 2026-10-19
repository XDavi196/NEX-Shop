import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type Category, validReleaseUrl } from './github';
import { gitLabProvider } from './gitlab';

afterEach(() => vi.unstubAllGlobals());

describe('GitLab REST pública', () => {
  it('pesquisa projetos públicos sem token e mapeia o resultado para o modelo comum', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: 41,
      name: 'Demo Game',
      path_with_namespace: 'studio/group/demo-game',
      web_url: 'https://gitlab.com/studio/group/demo-game',
      description: 'Projeto público',
      namespace: { full_path: 'studio/group', web_url: 'https://gitlab.com/studio/group' },
      star_count: 12,
      last_activity_at: '2026-06-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
      default_branch: 'main',
      topics: ['homebrew'],
      archived: false,
    }]), { headers: { 'X-Total': '38' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await gitLabProvider.search('demo', 'homebrew' as Category, 2);

    expect(result.total_count).toBe(38);
    expect(result.items[0]).toMatchObject({
      id: 41,
      full_name: 'studio/group/demo-game',
      provider: 'gitlab',
      stargazers_count: 12,
      owner: { login: 'studio/group', html_url: 'https://gitlab.com/studio/group' },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/api/v4/projects?');
    expect(url).toContain('search=demo+homebrew');
    expect(url).toContain('page=2');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('codifica caminhos de grupos aninhados ao consultar projetos e releases', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 9,
      name: 'Nested',
      path_with_namespace: 'studio/subgroup/nested',
      web_url: 'https://gitlab.com/studio/subgroup/nested',
      description: null,
      namespace: { full_path: 'studio/subgroup' },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await gitLabProvider.getProject('studio/subgroup/nested');

    expect(fetchMock.mock.calls[0][0]).toContain('/projects/studio%2Fsubgroup%2Fnested');
  });

  it('normaliza releases, marca pré-lançamentos e só expõe ativos diretos do GitLab', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        tag_name: 'v1.0.0-rc1',
        name: 'Release candidate',
        released_at: '2026-06-02T00:00:00.000Z',
        description: 'Notas de teste',
        assets: { links: [
          { name: 'demo.apk', direct_asset_url: 'https://gitlab.com/studio/demo/-/releases/v1.0.0-rc1/downloads/demo.apk' },
          { name: 'external.zip', direct_asset_url: 'https://example.com/demo.zip' },
          { name: 'external-link.zip', url: 'https://gitlab.com/studio/demo/-/releases/v1.0.0-rc1/downloads/other.zip' },
        ] },
      },
      {
        tag_name: 'v1.0.0',
        name: null,
        released_at: null,
        description: null,
        assets: { links: [] },
      },
    ])));
    vi.stubGlobal('fetch', fetchMock);

    const releases = await gitLabProvider.getReleases('studio/demo');

    expect(releases[1]).toMatchObject({
      tag_name: 'v1.0.0-rc1',
      prerelease: true,
      body: 'Notas de teste',
      assets: [{ name: 'demo.apk', size: 0 }],
    });
    expect(releases[1].html_url).toBe('https://gitlab.com/studio/demo/-/releases/v1.0.0-rc1');
    expect(releases[0].prerelease).toBe(false);
    expect(releases[1].assets).toHaveLength(1);
  });

  it('converte limite de requisições em erro compreensível com tempo de espera', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', {
      status: 429,
      headers: { 'Retry-After': '30' },
    })));

    await expect(gitLabProvider.search('rate-limit-test-unique', 'all', 1))
      .rejects.toMatchObject({ message: expect.stringContaining('limitou'), status: 429, retryAt: expect.any(Number) });
    await expect(gitLabProvider.getProject('../project')).rejects.toBeInstanceOf(ApiError);
  });

  it('aceita somente links de download HTTPS em releases oficiais do GitLab', () => {
    expect(validReleaseUrl('https://gitlab.com/group/project/-/releases/v1/downloads/app.apk', 'gitlab')).toBe(true);
    expect(validReleaseUrl('http://gitlab.com/group/project/-/releases/v1/downloads/app.apk', 'gitlab')).toBe(false);
    expect(validReleaseUrl('https://example.com/group/project/-/releases/v1/downloads/app.apk', 'gitlab')).toBe(false);
    expect(validReleaseUrl('https://gitlab.com/group/project/-/blob/main/app.apk', 'gitlab')).toBe(false);
  });
});
