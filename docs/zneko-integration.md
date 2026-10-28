# Integrar o catálogo da NEX Shop ao ZNeko

Este documento define o lado cliente da integração. Não presume que um ZIP é compatível com o ZNeko: primeiro é necessário validar o importador real do launcher e seus formatos de assets.

## Endpoint público

Depois que a branch do catálogo for mesclada em `main`, o endpoint será:

`https://raw.githubusercontent.com/XDavi196/NEX-Shop/main/public/catalog/themes/v1/index.json`

O JSON Schema está em `public/catalog/themes/v1/schema.json`. A API é somente de leitura. Não requer token e não deve receber cookies, credenciais ou dados privados.

## Código cliente

O módulo sem dependências de UI `src/themes.ts` da NEX Shop já exporta tipos, validação, filtro e o cliente HTTP. Copie-o para o projeto-fonte do ZNeko (ou extraia-o para um pacote compartilhado, caso ambos tenham uma base de código organizada para isso) e consulte o endpoint explícito:

```ts
import {
  getThemeCatalog,
  NEX_SHOP_THEME_CATALOG_URL,
} from './nex-shop-catalog';

const controller = new AbortController();

try {
  const catalog = await getThemeCatalog(
    controller.signal,
    NEX_SHOP_THEME_CATALOG_URL,
  );

  // Mostre apenas categorias que o ZNeko realmente implementa.
  const themes = catalog.items.filter((item) =>
    item.targetApps.includes('zneko')
  );
  renderThemes(themes);
} catch (error) {
  // Preserve o catálogo/cache anterior e informe que a atualização falhou.
  showCatalogError(error);
}

// Ao sair da tela/cancelar a pesquisa:
// controller.abort();
```

Os nomes `renderThemes` e `showCatalogError` são pontos de adaptação da UI do launcher, não funções existentes na NEX Shop.

## Requisitos para a futura integração

1. **Não dependa do Silk Pod.** O endpoint acima é a única origem do catálogo NEX.
2. **Compatibilidade explícita.** Filtre por `targetApps` e só aplique categorias/formatos que o código do ZNeko comprovar que suporta.
3. **Download seguro.** Exija HTTPS; limite tamanho, valide tipo real e estrutura ZIP; rejeite caminhos absolutos, `..`, links simbólicos perigosos e arquivos inesperados; valide SHA-256 antes de usar o pacote.
4. **Integridade e atualização.** Use o hash para detectar arquivos alterados; não execute código recebido de um tema. A instalação deve ser reversível e preservar os assets originais.
5. **Rede.** O cliente tem timeout de 12 segundos, cancelamento via `AbortSignal` e cache em memória por cinco minutos. O launcher deve manter a experiência utilizável se a origem estiver indisponível.
6. **Moderação e direitos.** O índice público deve conter apenas temas revisados, com licença/fonte e direitos de redistribuição verificados. Não envie ROMs, BIOS nem arquivos proprietários.

## Limite atual

O repositório público do ZNeko consultado durante esta implementação contém documentação, modelos e assets, mas não fornece o código-fonte da aplicação para aplicar e testar a substituição do Silk Pod diretamente. Portanto, este documento e o cliente de catálogo preparam o contrato; ainda não são uma alteração no APK do ZNeko. A integração real requer o repositório-fonte correto e a inspeção do importador de temas antes de prometer instalação automática.
