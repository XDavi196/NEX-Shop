import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiError, type Category, type ProviderId, type Release, type Repo, formatDate, formatSize, validReleaseUrl } from './github';
import { providerOptions, providers } from './providers';
import './style.css';

const categories: { id: Category; name: string }[] = [
  { id: 'all', name: 'Todos' },
  { id: 'homebrew', name: 'Homebrews' },
  { id: 'emulators', name: 'Emuladores' },
  { id: 'ports', name: 'Ports e recomps' },
];

function App() {
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
    const timer = setTimeout(() => setTerm(query), 450);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
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
  }, [term, category, page, providerId, refreshCount]);

  async function openProject(fullName: string) {
    const provider = providers[providerId];
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

  return (
    <main className="shell">
      <header>
        <b>NEX <em>SHOP</em></b>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub oficial ↗</a>
      </header>

      <h1>Projetos para <em>jogar e criar.</em></h1>
      <p>Consulte projetos e releases públicos nas plataformas oficiais.</p>

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
          <button type="button" onClick={() => setRepo(null)}>← Voltar</button>
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
              {release.assets.filter(asset => validReleaseUrl(asset.browser_download_url, providerId)).map(asset => (
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
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
