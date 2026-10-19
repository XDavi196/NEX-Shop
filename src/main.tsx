import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiError, type Category, type ProviderId, type Release, type Repo, formatDate, formatSize, validReleaseUrl } from './github';
import { providerOptions, providers } from './providers';
import { curatedCatalog, parseOfficialProjectUrl, type CatalogEntry } from './catalog';
import './style.css';

const categories: { id: Category; name: string }[] = [
  { id: 'all', name: 'Todos' },
  { id: 'homebrew', name: 'Homebrews' },
  { id: 'emulators', name: 'Emuladores' },
  { id: 'ports', name: 'Ports e recomps' },
];

type Appearance = { style: 'modern' | 'retro'; color: 'default' | 'black' | 'white' | 'red' };
const DEFAULT_APPEARANCE: Appearance = { style: 'modern', color: 'default' };

function App() {
  const [appearance, setAppearance] = useState<Appearance>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('nex-shop-appearance') || 'null');
      if (saved && typeof saved === 'object') {
        const value = saved as Partial<Appearance>;
        return {
          style: value.style === 'retro' ? 'retro' : 'modern',
          color: value.color === 'black' || value.color === 'white' || value.color === 'red' ? value.color : 'default',
        };
      }
    } catch { /* Use the default appearance when storage is unavailable or invalid. */ }
    return DEFAULT_APPEARANCE;
  });
  const [view, setView] = useState<'catalog' | 'search'>('catalog');
  const [activeNav, setActiveNav] = useState('highlights');
  const [manualUrl, setManualUrl] = useState('');
  const [manualCategory, setManualCategory] = useState<Category>('homebrew');
  const [manualError, setManualError] = useState('');
  const [userEntries, setUserEntries] = useState<CatalogEntry[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('nex-shop-user-catalog') || '[]');
      return Array.isArray(saved) ? saved.filter((item): item is CatalogEntry => item && typeof item.id === 'string' && typeof item.project === 'string' && (item.provider === 'github' || item.provider === 'gitlab')) : [];
    } catch { return []; }
  });
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [providerId, setProviderId] = useState<ProviderId>('github');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Repo[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    document.documentElement.dataset.shopStyle = appearance.style;
    document.documentElement.dataset.shopColor = appearance.color;
    try { localStorage.setItem('nex-shop-appearance', JSON.stringify(appearance)); } catch { /* Appearance remains active for this session. */ }
  }, [appearance]);

  useEffect(() => {
    if (view !== 'search') return;
    const timer = setTimeout(() => setTerm(query), 450);
    return () => clearTimeout(timer);
  }, [query, view]);

  useEffect(() => {
    if (view !== 'search') return;
    const controller = new AbortController();
    const provider = providers[providerId];
    setBusy(true);
    setError(null);
    provider.search(term, category, page, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setRows(result.items);
        setTotal(result.total_count);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || (reason instanceof DOMException && reason.name === 'AbortError')) return;
        setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível carregar os projetos. Tente novamente.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [term, category, page, providerId, refreshCount, view]);

  useEffect(() => {
    try { localStorage.setItem('nex-shop-user-catalog', JSON.stringify(userEntries)); } catch { /* Storage may be unavailable in private mode. */ }
  }, [userEntries]);

  async function openProject(fullName: string, source: ProviderId = providerId) {
    const provider = providers[source];
    try {
      setError(null);
      const [details, versions] = await Promise.all([
        provider.getProject(fullName),
        provider.getReleases(fullName),
      ]);
      setRepo(details);
      setReleases(versions);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason : new ApiError('Não foi possível carregar os detalhes do projeto.'));
    }
  }

  function changeProvider(id: ProviderId) {
    setProviderId(id);
    setPage(1);
    setRepo(null);
    setReleases([]);
  }

  function addManualProject() {
    const parsed = parseOfficialProjectUrl(manualUrl);
    if (!parsed) {
      setManualError('Use a URL HTTPS de um repositório oficial no GitHub ou GitLab.');
      return;
    }
    if ([...curatedCatalog, ...userEntries].some(item => item.provider === parsed.provider && item.project.toLowerCase() === parsed.project.toLowerCase())) {
      setManualError('Este projeto já está no catálogo.');
      return;
    }
    const projectParts = parsed.project.split('/');
    const projectName = projectParts[projectParts.length - 1] || parsed.project;
    setUserEntries(current => [...current, {
      id: `${parsed.provider}:${parsed.project}`, name: projectName, provider: parsed.provider, project: parsed.project,
      category: manualCategory === 'all' ? 'homebrew' : manualCategory, targets: [],
      note: 'Adicionado por você. Confira a origem, os requisitos e a compatibilidade antes de baixar.', verifiedAt: new Date().toISOString().slice(0, 10),
    }]);
    setManualUrl('');
    setManualError('');
  }

  const catalogEntries = [...curatedCatalog, ...userEntries]
    .filter(item => category === 'all' || item.category === category)
    .filter(item => `${item.name} ${item.project} ${item.note}`.toLowerCase().includes(query.trim().toLowerCase()));

  function navigate(id: string) {
    setActiveNav(id);
    setRepo(null);
    setReleases([]);
    if (id === 'search') { setView('search'); return; }
    setView('catalog');
    if (id === 'highlights') setCategory('all');
    if (id === 'homebrew' || id === 'emulators' || id === 'ports') setCategory(id);
  }

  return (
    <main className="console-shell" data-shop-style={appearance.style} data-shop-color={appearance.color}>
      <aside className="console-sidebar">
        <a className="brand" href="#home" onClick={event => { event.preventDefault(); navigate('highlights'); }} aria-label="NEX Shop, início"><span className="brand-mark">N</span><span>NEX <b>SHOP</b></span></a>
        <div className="side-label">EXPLORAR</div>
        <nav className="side-nav" aria-label="Navegação da loja">
          <button className={activeNav === 'highlights' ? 'active' : ''} onClick={() => navigate('highlights')}><span>✦</span>Destaques</button>
          <button className={activeNav === 'search' ? 'active' : ''} onClick={() => navigate('search')}><span>⌕</span>Buscar projetos</button>
          <button className={activeNav === 'homebrew' ? 'active' : ''} onClick={() => navigate('homebrew')}><span>◈</span>Homebrews</button>
          <button className={activeNav === 'emulators' ? 'active' : ''} onClick={() => navigate('emulators')}><span>▣</span>Emuladores</button>
          <button className={activeNav === 'ports' ? 'active' : ''} onClick={() => navigate('ports')}><span>⌘</span>Ports e recomps</button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="side-label appearance-heading">APARÊNCIA</div>
        <div className="sidebar-appearance">
          <label>Interface<select aria-label="Estilo da interface" value={appearance.style} onChange={event => setAppearance(current => ({ ...current, style: event.target.value as Appearance['style'] }))}><option value="modern">Moderno · console atual</option><option value="retro">Retrô · eShop clássica</option></select></label>
          <label>Cor<select aria-label="Cor da interface" value={appearance.color} onChange={event => setAppearance(current => ({ ...current, color: event.target.value as Appearance['color'] }))}><option value="default">Padrão do estilo</option><option value="black">Preto</option><option value="white">Branco</option><option value="red">Vermelho NEX</option></select></label>
        </div>
        <a className="side-footer" href="https://github.com/XDavi196/NEX-Shop" target="_blank" rel="noopener noreferrer">NEX Shop · fontes oficiais ↗</a>
      </aside>

      <section className="storefront">
        <header className="store-topbar">
          <div className="breadcrumb"><span>NEX SHOP</span><i>/</i>{view === 'search' ? 'Buscar projetos' : categories.find(item => item.id === category)?.name}</div>
          <div className="top-actions"><label className="top-search"><span>⌕</span><input aria-label="Pesquisar na loja" value={query} onChange={event => { setQuery(event.target.value); if (view === 'search') setPage(1); }} onFocus={() => { if (view !== 'search') navigate('search'); }} placeholder="Buscar projetos" /></label><div className="profile-chip">N</div></div>
        </header>
        <div className="store-content">
          {view === 'catalog' && !repo && <>
            <section className="welcome-row"><div><span className="eyebrow">A VITRINE NEX</span><h1>{category === 'all' ? <>Descubra seu próximo <em>projeto.</em></> : <>{categories.find(item => item.id === category)?.name} <em>em destaque.</em></>}</h1><p>Projetos da comunidade, com links para suas fontes e releases oficiais.</p></div><div className="catalog-count"><strong>{catalogEntries.length.toString().padStart(2, '0')}</strong><span>PROJETOS<br/>NA VITRINE</span></div></section>
            <div className="shelf-heading"><div><span className="eyebrow">SELEÇÃO NEX</span><h2>{category === 'all' ? 'Em destaque' : categories.find(item => item.id === category)?.name}</h2></div><span className="shelf-meta">{catalogEntries.length} itens <b>·</b> fontes verificáveis</span></div>
            <p className="catalog-disclaimer">Seleção inicial conferida manualmente. Confira versão, requisitos e compatibilidade na página oficial do projeto.</p>
            <section className="grid store-grid" aria-label="Projetos do catálogo">
              {catalogEntries.map((item, index) => (
                <article className="store-card" key={item.id}>
                  <button className={`cover-art cover-${index % 5}`} type="button" aria-label={`Ver releases de ${item.name}`} onClick={() => { setView('search'); setProviderId(item.provider); void openProject(item.project, item.provider); }}><span className="cover-orbit"/><span className="cover-kicker">NEX COMMUNITY · {item.category.toUpperCase()}</span><span className="cover-title">{item.name}</span><span className="cover-caption">{item.targets.join('  /  ') || 'PROJETO DA COMUNIDADE'}</span><span className="cover-open">↗</span></button>
                  <div className="card-info"><div><h3>{item.name}</h3><small>{categories.find(entry => entry.id === item.category)?.name} <b>·</b> {item.provider === 'github' ? 'GitHub' : 'GitLab'}</small></div><button className="card-arrow" type="button" aria-label={`Ver versões de ${item.name}`} onClick={() => { setView('search'); setProviderId(item.provider); void openProject(item.project, item.provider); }}>↗</button></div>
                  <p className="card-note">{item.note}</p>
                  <div className="card-bottom"><span>{item.targets.join(' · ') || 'Plataforma não informada'}</span><a href={`https://${item.provider === 'github' ? 'github.com' : 'gitlab.com'}/${item.project}`} target="_blank" rel="noopener noreferrer">Repositório oficial</a></div>
                </article>
              ))}
            </section>
            {catalogEntries.length === 0 && <div className="empty-shelf"><b>Nenhum projeto nesta seleção ainda.</b><span>A vitrine é curada e vai crescer por etapas.</span></div>}
            <section className="manual-entry" aria-labelledby="manual-entry-title"><div className="shelf-heading"><div><span className="eyebrow">TRAGA UM PROJETO</span><h2 id="manual-entry-title">Adicionar repositório</h2></div></div><p>Inclua uma URL oficial HTTPS do GitHub ou GitLab. O projeto fica salvo somente neste dispositivo.</p><div className="manual-form"><label>URL do projeto<input value={manualUrl} onChange={event => setManualUrl(event.target.value)} placeholder="https://github.com/organizacao/projeto" /></label><label>Categoria<select value={manualCategory} onChange={event => setManualCategory(event.target.value as Category)}><option value="homebrew">Homebrew</option><option value="emulators">Emulador</option><option value="ports">Port ou recomp</option></select></label><button type="button" onClick={addManualProject}>Adicionar à vitrine</button></div>{manualError && <p role="alert" className="error-text">{manualError}</p>}</section>
          </>}

      {view === 'search' && <>
      <div className="provider-switch" role="group" aria-label="Fonte de projetos">
        {providerOptions.map(option => (
          <button
            key={option.id}
            type="button"
            className={providerId === option.id ? 'sel' : ''}
            aria-pressed={providerId === option.id}
            onClick={() => changeProvider(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <input
        aria-label="Pesquisar projetos"
        value={query}
        onChange={event => { setQuery(event.target.value); setPage(1); }}
        placeholder="Pesquisar projetos…"
      />

      <nav aria-label="Categorias">
        {categories.map(item => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? 'sel' : ''}
            aria-pressed={category === item.id}
            onClick={() => { setCategory(item.id); setPage(1); }}
          >
            {item.name}
          </button>
        ))}
      </nav>
      <p className="catalog-disclaimer">
        Resultados vêm de buscas públicas. A NEX ainda não valida automaticamente categoria, compatibilidade, licença ou segurança de cada projeto.
      </p>

      {error && (
        <section className="error" role="alert">
          {error.message}
          <button
            type="button"
            disabled={!!error.retryAt && Date.now() < error.retryAt}
            onClick={() => setRefreshCount(current => current + 1)}
          >
            Tentar novamente
          </button>
        </section>
      )}

      {repo ? (
        <section className="detail">
          <button type="button" onClick={() => setRepo(null)}>← Voltar à busca</button>
          <h2>{repo.name}</h2>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">Abrir projeto oficial ↗</a>
          <p>{repo.description || 'Sem descrição informada pelo projeto.'}</p>
          <p>
            {repo.language || 'Linguagem não informada'} · {repo.license?.name || 'Licença não informada'} ·
            {' '}Atualizado {repo.updated_at ? formatDate(repo.updated_at) : 'sem data'}
          </p>
          <h3>Releases oficiais</h3>
          {releases.length === 0 && <p>Este projeto não publicou releases disponíveis pela API.</p>}
          {releases.filter(release => !release.draft).map(release => (
            <article key={release.tag_name}>
              <b>{release.name || release.tag_name}</b>
              {release.prerelease && <small> · Pré-lançamento</small>}
              {release.published_at && <span> · {formatDate(release.published_at)}</span>}
              <p>
                <a href={release.html_url} target="_blank" rel="noopener noreferrer">Ver release oficial ↗</a>
              </p>
              {release.body && (
                <details>
                  <summary>Notas da versão</summary>
                  <pre className="release-notes">{release.body}</pre>
                </details>
              )}
              {release.assets.filter(asset => validReleaseUrl(asset.browser_download_url, repo.provider ?? providerId)).map(asset => (
                <p key={asset.browser_download_url}>
                  <a href={asset.browser_download_url} target="_blank" rel="noopener noreferrer">
                    Baixar {asset.name} {asset.size > 0 && '(' + formatSize(asset.size) + ')'} ↗
                  </a>
                </p>
              ))}
            </article>
          ))}
          <p>Downloads abrem os arquivos publicados pelo projeto. A NEX Shop não executa arquivos baixados.</p>
        </section>
      ) : (
        <>
          <small>{total.toLocaleString('pt-BR')} repositórios · {busy ? 'Buscando…' : providerOptions.find(option => option.id === providerId)?.label}</small>
          <section className="grid">
            {rows.map(item => (
              <article key={item.id}>
                <small>{item.language || 'Linguagem não informada'} · ★ {item.stargazers_count.toLocaleString()}</small>
                <h2><a href={item.html_url} target="_blank" rel="noopener noreferrer">{item.full_name} ↗</a></h2>
                <p>{item.description || 'Sem descrição informada.'}</p>
                <a href={item.owner.html_url} target="_blank" rel="noopener noreferrer">{item.owner.login} ↗</a>
                {item.updated_at && <span> · Atualizado {formatDate(item.updated_at)}</span>}
                <p>
                  <button type="button" onClick={() => openProject(item.full_name)}>Ver detalhes</button>
                  {' '}<a href={item.html_url} target="_blank" rel="noopener noreferrer">Abrir projeto ↗</a>
                </p>
              </article>
            ))}
          </section>
          {!busy && rows.length === 0 && !error && <p>Nenhum projeto encontrado.</p>}
          <footer>
            <button type="button" disabled={page <= 1 || busy} onClick={() => setPage(current => current - 1)}>Anterior</button>
            {' '}Página {page}{' '}
            <button type="button" disabled={busy || rows.length === 0} onClick={() => setPage(current => current + 1)}>Próxima</button>
          </footer>
        </>
      )}
      </>}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
