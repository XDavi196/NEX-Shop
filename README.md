# NEX Shop

Aplicativo independente para descobrir projetos de jogos em repositórios e releases públicos do GitHub e do GitLab. Consultas públicas não exigem conta nem token pessoal.

## O que funciona nesta versão

- Pesquisa de projetos públicos nas APIs REST oficiais do GitHub e GitLab.
- Categorias de busca: homebrews, emuladores e ports/recomps.
- Resultados paginados, detalhes do projeto, licença declarada e atividade recente quando a API informa esses dados.
- Até dez releases por projeto, notas da versão, indicação de pré-lançamento e links para releases e ativos publicados nos domínios oficiais.
- Cache temporário em memória e mensagens para falha de rede, projeto ausente e limites de API.
- Os arquivos abrem no navegador; a NEX Shop não instala nem executa downloads.

**Limitações:** as categorias ainda funcionam como termos de busca das plataformas, não como catálogo curado e validado pela NEX. A presença de um projeto nos resultados não confirma sua categoria, compatibilidade, licença, segurança ou prontidão para uso. Verifique os requisitos e a origem antes de baixar. O suporte a release do GitLab mostra apenas links diretos hospedados no domínio gitlab.com; links externos não são apresentados como ativos para download.

Ainda não estão implementados download gerenciado, instalação/atualização/reparo/desinstalação, biblioteca instalada, catálogo editável validado, fornecedor GitLab self-managed, SteamGridDB, ScreenScraper, preferências de temas/música ou instalação assistida de APK. O repositório NEX 2 Frontend é separado; consulte o README dele para o estado atual.

## Desenvolvimento

Requer Node.js 22 ou superior e pnpm 10 ou superior.

    pnpm install --frozen-lockfile
    pnpm dev

Validar testes: pnpm test. Build web: pnpm build.

## Builds para Windows e Android

No GitHub, abra **Actions → Build and release NEX Shop → Run workflow**. O fluxo instala dependências travadas pelo pnpm-lock.yaml, roda testes e build web e então tenta gerar os pacotes em runners separados. O pré-release v0.2.0 documentado pelo workflow usa NEX-Shop-Setup.exe (instalador NSIS) e NEX-Shop-Android-debug.apk.

Esses pacotes são builds de teste: o instalador Windows não tem assinatura digital e o APK de depuração não está assinado para publicação na Play Store.

### Android local

Instale Android Studio com Android SDK Platform 35, Build Tools 35 e JDK 21. Com Node.js e pnpm configurados:

    pnpm install --frozen-lockfile
    pnpm build
    pnpm exec cap add android
    pnpm exec cap sync android
    cd android
    ./gradlew assembleDebug

No Windows, use gradlew.bat assembleDebug. O APK fica em android/app/build/outputs/apk/debug/app-debug.apk.

### Windows local

Instale Rust stable, Visual Studio C++ Build Tools e WebView2 Runtime. Depois:

    pnpm install --frozen-lockfile
    pnpm tauri build --bundles nsis

O instalador fica em src-tauri/target/release/bundle/nsis/.

## Fontes de dados e privacidade

O código consulta https://api.github.com e https://gitlab.com/api/v4 sem credenciais. As URLs de downloads são validadas para HTTPS e para caminhos de release hospedados na plataforma correspondente. A NEX Shop não recebe senha, token pessoal, mensagens ou dados de conta do usuário.
