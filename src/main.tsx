import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, Bell, Search, Settings, Gamepad2, LibraryBig, SlidersHorizontal,
  Puzzle, Music2, Image as ImageIcon, Palette, FolderOpen, Home, Grid2X2,
  ChevronLeft, ChevronRight, Sparkles, ExternalLink, X, LoaderCircle, Star,
  Github, Monitor, Disc3, RefreshCw, Download, Boxes, Layers3
} from 'lucide-react';
import { Category, Repo, Release, GitHubError, searchRepos, getRepo, getReleases, validReleaseUrl, formatDate, formatSize } from './github';
import './style.css';

type Section = 'home' | 'library' | 'shop' | 'search' | 'manage';
const categories: { id: Category; title: string; subtitle: string; icon: React.ReactNode; tone: string; maker: string }[] = [
  { id: 'emulators', title: 'Emuladores', subtitle: 'Sistemas clássicos e atuais', icon: <Gamepad2 />, tone: 'violet', maker: 'NEX Community' },
  { id: 'ports', title: 'Ports & recompilações', subtitle: 'Jogos para novas plataformas', icon: <Boxes />, tone: 'mint', maker: 'Ports Lab' },
  { id: 'themes', title: 'Temas', subtitle: 'Personalize o seu launcher', icon: <Palette />, tone: 'purple', maker: 'Theme Studio' },
  { id: 'media', title: 'Mídia de jogos', subtitle: 'Capas, artes e vídeos', icon: <ImageIcon />, tone: 'cyan', maker: 'Game Media' },
  { id: 'audio', title: 'Áudio personalizado', subtitle: 'Músicas e sons', icon: <Music2 />, tone: 'orange', maker: 'NEX Audio' },
  { id: 'pins', title: 'Ícones & Pins', subtitle: 'Ícones e organização visual', icon: <Puzzle />, tone: 'blue', maker: 'Pixel Lab' },
];

function App() {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<Category>('emulators');
  const [section, setSection] = useState<Section>('shop');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Repo[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<GitHubError | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [detailBusy, setDetailBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    searchRepos(term || 'game', category, page, controller.signal)
      .then(data => { setRows(data.items); setTotal(data.total_count); })
      .catch((err: GitHubError) => { if (err.name !== 'AbortError') setError(err); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [term, category, page]);

  const selected = useMemo(() => categories.find(item => item.id === category), [category]);

  function chooseCategory(id: Category) {
    setCategory(id); setSection('shop'); setPage(1); setRepo(null); setQuery('');
  }

  async function showDetails(name: string) {
    setDetailBusy(true); setError(null);
    try {
      const [details, list] = await Promise.all([getRepo(name), getReleases(name)]);
      setRepo(details); setReleases(list.filter(item => !item.draft));
    } catch (err) { setError(err as GitHubError); }
    finally { setDetailBusy(false); }
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark"><Gamepad2 size={23} /></div>
        <div><div className="brand-name">NEX <span>SHOP</span></div><div className="brand-sub">CATÁLOGO DA COMUNIDADE</div></div>
      </div>
      <div className="topbar-title"><span className="mini-pill">NEX-ZNEKO</span><strong>Catálogo de Recursos</strong></div>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Buscar" onClick={() => { setSection('search'); document.getElementById('catalog-search')?.focus(); }}><Search /></button>
        <button className="icon-button" aria-label="Notificações"><Bell /></button>
        <button className="icon-button" aria-label="Configurações"><Settings /></button>
        <div className="profile-orb">NX</div>
      </div>
    </header>

    <aside className="side-rail" aria-label="Navegação principal">
      <div className="rail-cap">NEX</div>
      <button className={section === 'home' ? 'rail-item active' : 'rail-item'} onClick={() => setSection('home')}><Home /><span>Início</span></button>
      <button className={section === 'library' ? 'rail-item active' : 'rail-item'} onClick={() => setSection('library')}><LibraryBig /><span>Biblioteca</span></button>
      <button className={section === 'shop' ? 'rail-item active' : 'rail-item'} onClick={() => { setSection('shop'); setRepo(null); }}><Grid2X2 /><span>NEX Shop</span></button>
      <button className={section === 'search' ? 'rail-item active' : 'rail-item'} onClick={() => { setSection('search'); document.getElementById('catalog-search')?.focus(); }}><Search /><span>Buscar</span></button>
      <button className={section === 'manage' ? 'rail-item active' : 'rail-item'} onClick={() => setSection('manage')}><SlidersHorizontal /><span>Gerenciar<br/>recursos</span></button>
      <div className="rail-bottom"><span className="rail-status-dot" /> ONLINE</div>
    </aside>

    <section className="workspace">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Sparkles size={14}/> NEX SHOP <span>•</span> COMUNIDADE</div>
          <h1>{repo ? repo.name : section === 'library' ? 'Minha Biblioteca' : section === 'manage' ? 'Gerenciar Recursos' : section === 'home' ? 'Bem-vindo ao NEX-ZNeko' : 'Catálogo de Recursos'}</h1>
          <p>{repo ? 'Detalhes do projeto e versões publicadas.' : 'Emuladores, ports e personalizações para o seu setup.'}</p>
        </div>
        <div className="heading-decor"><span className="decor-key">✦</span><span className="decor-ring"/></div>
      </div>

      {!repo && <>
        <div className="community-strip">
          <div className="section-heading">
            <div><span className="section-kicker">ESCOLHA UMA CATEGORIA</span><h2>Destaques da Comunidade</h2></div>
            <div className="carousel-actions">
              <button aria-label="Anterior" onClick={() => document.getElementById('category-track')?.scrollBy({left:-250,behavior:'smooth'})}><ChevronLeft/></button>
              <button aria-label="Próximo" onClick={() => document.getElementById('category-track')?.scrollBy({left:250,behavior:'smooth'})}><ChevronRight/></button>
            </div>
          </div>
          <div className="category-track" id="category-track">
            {categories.map((item, index) => <button key={item.id} className={'category-card ' + item.tone + (category === item.id ? ' chosen' : '')} onClick={() => chooseCategory(item.id)}>
              <div className="creator-pill"><span className="creator-avatar">{['NX','GH','ET','UI','BGM','PIX'][index]}</span><span>{item.maker}</span></div>
              <div className="category-symbol">{item.icon}</div>
              <div className="category-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></div>
              <div className="category-meta"><span><Grid2X2 size={14}/>{['Sistemas','Jogos','Visual','Imagens','Música','Ícones'][index]}</span><span><ExternalLink size={13}/> Explorar</span></div>
            </button>)}
          </div>
        </div>

        <div className="catalog-tools">
          <div className="section-heading results-heading"><div><span className="section-kicker">RECURSOS DISPONÍVEIS</span><h2>{selected?.title || 'Todos os recursos'}</h2></div><span className="results-count">{total.toLocaleString('pt-BR')} resultados</span></div>
          <div className="search-row">
            <div className="searchbox"><Search size={19}/><input id="catalog-search" value={query} onChange={e => {setQuery(e.target.value);setPage(1)}} placeholder="Buscar emuladores, ports e recursos..."/>{query && <button className="clear-search" onClick={() => setQuery('')} aria-label="Limpar"><X size={16}/></button>}</div>
            <button className="filter-button" onClick={() => chooseCategory('all')}><SlidersHorizontal size={17}/> Todos</button>
          </div>
        </div>

        {error && <div className="error-banner"><span>{error.message}</span><button onClick={() => setPage(p => p)}><RefreshCw size={15}/> Tentar novamente</button></div>}
        {busy ? <div className="loading-state"><LoaderCircle className="spin" size={28}/><span>Carregando recursos da comunidade…</span></div> : <div className="resource-grid">
          {rows.map((item, index) => <article className="resource-card" key={item.id}>
            <div className="resource-card-top"><div className={'resource-icon tint-' + (index % 6)}>{index % 3 === 0 ? <Gamepad2/> : index % 3 === 1 ? <Disc3/> : <Layers3/>}</div><span className="language-tag">{item.language || 'Open source'}</span></div>
            <h3>{item.name}</h3><div className="owner-name"><Github size={13}/> {item.owner.login}</div>
            <p className="resource-description">{item.description || 'Projeto comunitário sem descrição cadastrada.'}</p>
            <div className="resource-stats"><span><Star size={14}/> {item.stargazers_count.toLocaleString('pt-BR')}</span><span><RefreshCw size={13}/> {formatDate(item.updated_at)}</span></div>
            <div className="resource-actions"><button onClick={() => showDetails(item.full_name)} disabled={detailBusy}>Ver detalhes</button><a href={item.html_url} target="_blank" rel="noopener noreferrer" aria-label={'Abrir ' + item.full_name}><ExternalLink size={16}/></a></div>
          </article>)}
        </div>}
        {!busy && rows.length === 0 && !error && <div className="empty-state"><FolderOpen size={32}/><strong>Nenhum recurso encontrado</strong><span>Tente outro termo ou categoria.</span></div>}
        <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/> Anterior</button><span>Página <b>{page}</b></span><button disabled={page * 24 >= total} onClick={() => setPage(p => p + 1)}>Próxima <ChevronRight size={16}/></button></div>
      </>}

      {repo && <section className="detail-panel">
        <button className="back-button" onClick={() => setRepo(null)}><ArrowLeft size={17}/> Voltar ao catálogo</button>
        <div className="detail-hero"><div className="resource-icon large"><Github size={35}/></div><div><span className="section-kicker">REPOSITÓRIO DA COMUNIDADE</span><h2>{repo.full_name}</h2><p>{repo.description || 'Sem descrição cadastrada.'}</p></div></div>
        <div className="detail-metrics"><div><Star/><strong>{repo.stargazers_count.toLocaleString('pt-BR')}</strong><span>Estrelas</span></div><div><Github/><strong>{repo.forks_count.toLocaleString('pt-BR')}</strong><span>Forks</span></div><div><Monitor/><strong>{repo.language || 'Variada'}</strong><span>Linguagem</span></div></div>
        <div className="detail-links"><a href={repo.html_url} target="_blank" rel="noopener noreferrer"><Github size={17}/> Abrir repositório <ExternalLink size={14}/></a><a href={repo.html_url + '/releases'} target="_blank" rel="noopener noreferrer"><Download size={17}/> Todas as releases <ExternalLink size={14}/></a></div>
        <div className="section-heading"><div><span className="section-kicker">VERSÕES PUBLICADAS</span><h2>Releases</h2></div></div>
        {releases.length ? releases.map(release => <article className="release-card" key={release.tag_name}><div><strong>{release.name || release.tag_name}</strong><small>{release.tag_name} {release.published_at ? '• ' + formatDate(release.published_at) : ''}</small><p>{release.body?.slice(0,240) || 'Notas de versão não fornecidas.'}</p></div><div className="release-assets">{release.assets.filter(asset => validReleaseUrl(asset.browser_download_url)).map(asset => <a href={asset.browser_download_url} key={asset.browser_download_url} target="_blank" rel="noopener noreferrer"><Download size={14}/> {asset.name} <small>{formatSize(asset.size)}</small></a>)}</div></article>) : <div className="empty-state"><FolderOpen size={28}/><strong>Nenhuma release pública encontrada</strong></div>}
        <p className="safety-note">A loja lista links públicos. Confira licença e procedência antes de instalar downloads.</p>
      </section>}

      {(section === 'home' || section === 'library' || section === 'manage') && !repo && <div className="feature-notice"><Sparkles size={24}/><div><strong>{section === 'library' ? 'Biblioteca local em desenvolvimento' : section === 'manage' ? 'Gerenciamento de recursos em desenvolvimento' : 'Seu espaço de jogos'}</strong><p>{section === 'library' ? 'A biblioteca ainda não está conectada ao armazenamento Android nesta versão.' : section === 'manage' ? 'A instalação e atualização automática de recursos ainda não está implementada.' : 'Entre na NEX Shop para explorar projetos, ports e personalizações da comunidade.'}</p><button onClick={() => setSection('shop')}>Abrir NEX Shop</button></div></div>}
      {detailBusy && <div className="busy-overlay"><LoaderCircle className="spin" size={25}/><span>Abrindo detalhes…</span></div>}
      <footer className="app-footer"><span>✦ NEX-ZNeko • Catálogo comunitário</span><span>Busca pública do GitHub • Sem token</span></footer>
    </section>

    <nav className="mobile-rail" aria-label="Navegação móvel">
      <button className={section === 'home' ? 'active' : ''} onClick={() => setSection('home')}><Home/><span>Início</span></button>
      <button className={section === 'library' ? 'active' : ''} onClick={() => setSection('library')}><LibraryBig/><span>Biblioteca</span></button>
      <button className={section === 'shop' ? 'active' : ''} onClick={() => {setSection('shop');setRepo(null)}}><Grid2X2/><span>Loja</span></button>
      <button className={section === 'search' ? 'active' : ''} onClick={() => {setSection('search');document.getElementById('catalog-search')?.focus()}}><Search/><span>Buscar</span></button>
    </nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
