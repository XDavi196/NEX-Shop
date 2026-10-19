<p align="center">
  <img src="src-tauri/icons/app-icon.svg" width="112" alt="Logo original da NEX Shop">
</p>

<h1 align="center">NEX Shop</h1>

<p align="center">Uma loja independente de homebrews, emuladores e ports para Windows e Android.</p>

A NEX Shop descobre projetos comunitários e consulta metadados e versões publicadas nas APIs oficiais do GitHub e do GitLab. Os dois estilos visuais — moderno e retrô — têm identidade própria da NEX e não representam um produto oficial da Nintendo.

## Prévia da loja

![Prévia da home da NEX Shop: navegação lateral, busca e cartões de projetos](docs/media/home-preview.svg)

A imagem mostra uma amostra visual da home. A versão atual pesquisa repositórios e releases e abre as páginas oficiais dos projetos.

## Baixar · v0.3.0

[Instalador Windows](https://github.com/XDavi196/NEX-Shop/releases/download/v0.3.0/NEX-Shop-Setup.exe) · [APK Android de depuração](https://github.com/XDavi196/NEX-Shop/releases/download/v0.3.0/NEX-Shop-Android-debug.apk) · [Notas da versão](https://github.com/XDavi196/NEX-Shop/releases/tag/v0.3.0)

Esta é uma versão de prévia: o instalador Windows não tem assinatura digital e o APK debug não está assinado para publicação na Play Store.

## O que já funciona

- Pesquisa pública de projetos e releases no GitHub e GitLab, sem token pessoal.
- Categorias iniciais: homebrews, emuladores e ports/recomps.
- Catálogo inicial com projetos selecionados e opção de adicionar repositórios por URL.
- Detalhes, versões, notas, status de pré-lançamento e links para as fontes oficiais.
- Paginação, cache temporário e mensagens para erros de rede e limites de API.
- Estilo moderno ou retrô, com cores independentes e preferência salva no dispositivo.

## Limitações atuais

- A pesquisa por termos não equivale a uma curadoria: confira compatibilidade, requisitos, licença e origem de cada projeto.
- A seleção curada ainda é pequena; homebrews e ports precisam de validação editorial.
- A NEX Shop abre as páginas oficiais. Ela ainda não gerencia downloads, instalação, atualização, reparo ou desinstalação.
- O suporte a GitLab self-managed, SteamGridDB, ScreenScraper e música integrada ainda não está implementado.
- Não distribuímos ROMs, BIOS nem arquivos proprietários. Alguns ports exigem que você forneça arquivos do jogo original.

## Desenvolvimento

Requer Node.js 22+ e pnpm 10+.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

Para gerar o instalador Windows, instale Rust stable, Visual Studio C++ Build Tools e WebView2:

```sh
pnpm tauri build --bundles nsis
```

Para gerar o APK Android, instale Android Studio/SDK e JDK 21:

```sh
pnpm build
pnpm exec cap add android
pnpm exec cap sync android
cd android
gradlew.bat assembleDebug
```

Builds de depuração não são builds da Play Store. A instalação de programas ou APKs sempre exige ação e confirmação do usuário.

## Projetos relacionados

A NEX Shop e o [NEX 2 Frontend](https://github.com/XDavi196/NEX-2-Frontend) são aplicativos independentes; nenhum deles exige o outro.
