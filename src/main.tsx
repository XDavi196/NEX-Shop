import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Category,
  Repo,
  Release,
  GitHubError,
  searchRepos,
  getRepo,
  getReleases,
  validReleaseUrl,
  formatDate,
  formatSize,
} from './github';
import {
  filterThemes,
  getThemeCatalog,
  THEME_CATEGORIES,
  THEME_CATEGORY_LABELS,
  ThemeCatalogError,
  ThemeCategoryFilter,
  ThemeItem,
} from './themes';
import './style.css';

const cats: { id: Category; name: string }[] = [
  { id: 'all', name: 'Todos' },
  { id: 'emulators', name: 'Emuladores' },
  { id: 'ports', name: 'Game ports' },
  { id: 'homebrew', name: 'Homebrews' },
  { id: 'opensource', name: 'Jogos open source' },
  { id: 'tools', name: 'Ferramentas' },
  { id: 'launchers', name: 'Launchers' },
  { id: 'android', name: 'Android' },
  { id: 'windows', name: 'Windows' },
];

function App() {
  const [mode, setMode] = useState<'projects' | 'themes'>('projects');
  const [q, Q] = useState('');
  const [term, T] = useState('');
  const [cat, C] = useState<Category>('all');
  const [page, P] = useState(1);
  const [rows, R] = useState<Repo[]>([]);
  const [total, N] = useState(0);
  const [busy, B] = useState(false);
  const [err, E] = useState<GitHubError | null>(null);
  const [repo, D] = useState<Repo | null>(null);
  const [releases, L] = useState<Release[]>([]);
  const [themeQuery, setThemeQuery] = useState('');
  const [themeCategory, setThemeCategory] = useState<ThemeCategoryFilter>('all');
  const [themeItems, setThemeItems] = useState<ThemeItem[]>([]);
  const [themeBusy, setThemeBusy] = useState(false);
  const [themeError, setThemeError] = useState<Error | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => T(q), 450);
    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => {
    if (mode !== 'projects') return;
    const controller = new AbortController();
    B(true);
    E(null);
    searchRepos(term, cat, page, controller.signal)
      .then((data) => {
        R(data.items);
        N(data.total_count);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          E(error instanceof GitHubError ? error : new GitHubError(error.message));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) B(false);
      });
    return () => controller.abort();
  }, [mode, term, cat, page]);

  useEffect(() => {
    if (mode !== 'themes') return;
    const controller = new AbortController();
    setThemeBusy(true);
    setThemeError(null);
    getThemeCatalog(controller.signal)
      .then((catalog) => setThemeItems(catalog.items))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          setThemeError(error instanceof ThemeCatalogError ? error : new Error(error.message));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setThemeBusy(false);
      });
    return () => controller.abort();
  }, [mode]);

  const visibleThemes = useMemo(
    () => filterThemes(themeItems, themeQuery, themeCategory),
    [themeItems, themeQuery, themeCategory],
  );

  async function details(name: string) {
    try {
      const [repoData, repoReleases] = await Promise.all([getRepo(name), getReleases(name)]);
      D(repoData);
      L(repoReleases);
    } catch (error) {
      E(error instanceof GitHubError ? error : new GitHubError('Não foi possível carregar os detalhes do projeto.'));
    }
  }

  function renderThemeCard(theme: ThemeItem) {
    return (
      <article className="theme-card" key={theme.id}>
        {theme.previewImages[0] ? (
          <img className="theme-preview" src={theme.previewImages[0]} alt={'Prévia de ' + theme.name} loading="lazy" />
        ) : (
          <div className="theme-preview theme-preview-empty" aria-label="Sem imagem de prévia">
            Prévia indisponível
          </div>
        )}
        <div className="theme-card-content">
          <div className="theme-tags">
            {theme.categories.map((category) => (
              <span className="theme-tag" key={category}>{THEME_CATEGORY_LABELS[category]}</span>
            ))}
          </div>
          <h2>{theme.name}</h2>
          <p>{theme.description}</p>
          <small>Por {theme.author.name} · v{theme.version}</small>
          <p className="theme-meta">Licença: {theme.license} · Pacote: {formatSize(theme.package.sizeBytes)}</p>
          <p className="theme-links">
            <a href={theme.sourceUrl} target="_blank" rel="noopener noreferrer">Fonte do projeto ↗</a>
            {' · '}
            <a href={theme.package.url} target="_blank" rel="noopener noreferrer">Abrir pacote ↗</a>
          </p>
          <small className="theme-integrity">SHA-256 informado; a instalação automática ainda não está disponível.</small>
        </div>
      </article>
    );
  }

  return (
    <main className="shell">
      <header>
        <b>NEX <em>SHOP</em></b>
        <a href="https://github.com/XDavi196/NEX-Shop" target="_blank" rel="noopener noreferrer">Projeto no GitHub ↗</a>
      </header>

      <div className="mode-switch" aria-label="Seções da NEX Shop">
        <button className={mode === 'projects' ? 'sel' : ''} onClick={() => setMode('projects')}>Projetos</button>
        <button className={mode === 'themes' ? 'sel' : ''} onClick={() => setMode('themes')}>Catálogo de temas</button>
      </div>

      {mode === 'projects' ? (
        <>
          <h1>Projetos para <em>jogar e criar.</em></h1>
          <p>Pesquisa pública do GitHub, sem token.</p>
          <input value={q} onChange={(event) => { Q(event.target.value); P(1); }} placeholder="Pesquisar jogos e ferramentas…" aria-label="Pesquisar projetos" />
          <nav>
            {cats.map((item) => (
              <button key={item.id} className={cat === item.id ? 'sel' : ''} onClick={() => { C(item.id); P(1); }}>
                {item.name}
              </button>
            ))}
          </nav>

          {err && (
            <section className="error">
              {err.message}
              <button disabled={!!err.retryAt && Date.now() < err.retryAt} onClick={() => P((current) => current)}>Tentar novamente</button>
            </section>
          )}

          {repo ? (
            <section className="project-detail">
              <button onClick={() => D(null)}>← Voltar</button>
              <h2>{repo.name}</h2>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">Abrir no GitHub ↗</a>
              <p>{repo.description}</p>
              <p>{repo.language || 'Linguagem não informada'} · {repo.license?.name || 'Licença não informada'} · Atualizado {formatDate(repo.updated_at)}</p>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">Consultar licença/arquivos ↗</a>
              <h3>Releases</h3>
              {releases.filter((release) => !release.draft).map((release) => (
                <article key={release.tag_name}>
                  <b>{release.name || release.tag_name}</b>
                  {release.published_at && ' · ' + formatDate(release.published_at)}
                  {release.assets.filter((asset) => validReleaseUrl(asset.browser_download_url)).map((asset) => (
                    <p key={asset.browser_download_url}>
                      <a href={asset.browser_download_url} target="_blank" rel="noopener noreferrer">
                        Baixar {asset.name} ({formatSize(asset.size)}) ↗
                      </a>
                    </p>
                  ))}
                </article>
              ))}
              <p>Projetos públicos não são automaticamente seguros. Downloads não são executados pela NEX Shop.</p>
            </section>
          ) : (
            <>
              <small>{total.toLocaleString('pt-BR')} repositórios · {busy ? 'Buscando…' : 'GitHub REST'}</small>
              <section className="grid">
                {rows.map((item) => (
                  <article key={item.id}>
                    <small>{item.language || 'Linguagem não informada'} · ★ {item.stargazers_count.toLocaleString()}</small>
                    <h2><a href={item.html_url} target="_blank" rel="noopener noreferrer">{item.full_name} ↗</a></h2>
                    <p>{item.description || 'Sem descrição informada.'}</p>
                    <a href={item.owner.html_url} target="_blank" rel="noopener noreferrer">{item.owner.login} ↗</a>
                    {' · '}Atualizado {formatDate(item.updated_at)}
                    <p>
                      <button onClick={() => details(item.full_name)}>Ver detalhes</button>
                      {' '}
                      <a href={item.html_url} target="_blank" rel="noopener noreferrer">Abrir no GitHub ↗</a>
                    </p>
                  </article>
                ))}
              </section>
              <footer>
                <button disabled={page <= 1} onClick={() => P(page - 1)}>Anterior</button>
                {' '}Página {page}{' '}
                <button disabled={busy || rows.length === 0} onClick={() => P(page + 1)}>Próxima</button>
              </footer>
            </>
          )}
        </>
      ) : (
        <>
          <h1>Temas para <em>personalizar.</em></h1>
          <p>Catálogo da comunidade NEX Shop. Esta mesma fonte será consumida pelo conector do ZNeko.</p>
          <input
            value={themeQuery}
            onChange={(event) => setThemeQuery(event.target.value)}
            placeholder="Pesquisar temas, autores e categorias…"
            aria-label="Pesquisar temas"
          />
          <nav className="theme-categories">
            <button className={themeCategory === 'all' ? 'sel' : ''} onClick={() => setThemeCategory('all')}>Todas</button>
            {THEME_CATEGORIES.map((category) => (
              <button
                key={category}
                className={themeCategory === category ? 'sel' : ''}
                onClick={() => setThemeCategory(category)}
              >
                {THEME_CATEGORY_LABELS[category]}
              </button>
            ))}
          </nav>
          {themeError && (
            <section className="error">
              {themeError.message}
              <button onClick={() => setMode('projects')}>Voltar aos projetos</button>
            </section>
          )}
          {themeBusy ? (
            <p role="status">Carregando catálogo de temas…</p>
          ) : !themeError && visibleThemes.length === 0 ? (
            <section className="theme-empty">
              <h2>{themeItems.length === 0 ? 'O catálogo está sendo preparado' : 'Nenhum tema encontrado'}</h2>
              <p>
                {themeItems.length === 0
                  ? 'Ainda não há temas publicados. Nenhum tema fictício foi adicionado: as primeiras entradas serão publicadas depois de revisar os arquivos, a licença e a compatibilidade.'
                  : 'Tente outra busca ou escolha uma categoria diferente.'}
              </p>
              {themeItems.length === 0 && <small>Formato v1 · Catálogo público somente de leitura · HTTPS</small>}
            </section>
          ) : (
            <section className="theme-grid">
              {visibleThemes.map(renderThemeCard)}
            </section>
          )}
          <p className="theme-footnote">A NEX Shop exibe metadados e links. A instalação automática de pacotes e a compatibilidade real com o ZNeko ainda exigem validação do formato do launcher.</p>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
