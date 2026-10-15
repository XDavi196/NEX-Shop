# NEX Shop

Loja independente para descobrir projetos de jogos usando a API REST pública do GitHub. A pesquisa não exige conta nem token pessoal.

## Desenvolvimento

Requer Node.js 22 ou superior e pnpm 10 ou superior.

```sh
pnpm install
pnpm dev
```

Validar: `pnpm test`. Build web: `pnpm build`.

## Builds para Windows e Android

No GitHub, abra **Actions → Build and release NEX Shop → Run workflow**. O fluxo roda os testes e gera os dois pacotes em runners separados. A release de pré-lançamento `v0.2.0` só é publicada quando ambos os builds terminam com sucesso. Os arquivos anexados são `NEX-Shop-Setup.exe` (instalador NSIS) e `NEX-Shop-Android-debug.apk`.

Esses pacotes são builds de teste: o instalador Windows não tem assinatura digital e o APK de depuração não está assinado para publicação na Play Store. Revise a origem do projeto antes de instalar.

### Android local

Instale Android Studio com Android SDK Platform 35, Build Tools 35 e JDK 21. Com Node.js e pnpm configurados:

```sh
pnpm install
pnpm build
pnpm exec cap add android
pnpm exec cap sync android
cd android
./gradlew assembleDebug
```

No Windows, use `gradlew.bat assembleDebug`. O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

### Windows local

Instale Rust stable, Visual Studio C++ Build Tools e WebView2 Runtime. Depois:

```sh
pnpm install
pnpm tauri build --bundles nsis
```

O instalador fica em `src-tauri/target/release/bundle/nsis/`.

## Integração GitHub

A interface converte os resultados JSON da API em cartões e detalhes clicáveis. Combina texto com categorias, aplica debounce de 450 ms, paginação, cache de 5 minutos e tratamento de rede/limite. Downloads só são listados para arquivos anexados a releases oficiais e com URL validada. Compatibilidade de sistema e arquitetura não é inferida; confira os requisitos declarados pelo autor. A NEX Shop não executa arquivos baixados.

A base do NEX 2 Frontend ainda não está neste repositório. Este projeto não cria nem publica um APK para o NEX 2.
