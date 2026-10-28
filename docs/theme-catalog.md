# Catálogo de temas da NEX Shop (v1)

A NEX Shop é a fonte de catálogo planejada para a futura integração de temas do ZNeko Launcher. O Silk Pod não é uma dependência deste contrato.

## Endpoints estáticos

- Catálogo: `https://raw.githubusercontent.com/XDavi196/NEX-Shop/main/public/catalog/themes/v1/index.json`
- JSON Schema: `https://raw.githubusercontent.com/XDavi196/NEX-Shop/main/public/catalog/themes/v1/schema.json`

Durante o desenvolvimento, a interface da NEX Shop consome o mesmo catálogo por `/catalog/themes/v1/index.json`. O JSON é uma API estática, pública, somente de leitura e versionada; não exige token. GitHub Raw não é uma API de escrita e não substitui um backend para envios, autenticação ou moderação.

## Esquema

O objeto raiz contém:

- `schemaVersion`: versão inteira do contrato (atualmente `1`).
- `updatedAt`: data/hora ISO 8601 da última publicação.
- `items`: somente temas publicados após revisão.

Cada tema publicado deve declarar ID estável, nome, descrição, versão, autor, licença, URL da fonte original, categorias, aplicativos-alvo, compatibilidade, imagens de prévia e pacote ZIP. URL do pacote e das prévias deve usar HTTPS. O pacote precisa informar tamanho e SHA-256 para a etapa de download/instalação verificar a integridade do arquivo.

Categorias permitidas:

- `smart-folder-art`: arte para pastas inteligentes.
- `icons`: ícones.
- `backgrounds`: planos de fundo.
- `logos`: logos.
- `complete-themes`: conjuntos completos.
- `sound-packs`: sons e músicas.

## Exemplo de entrada

O exemplo é documentação, não um tema publicado. Troque os valores de exemplo e valide o pacote antes de adicioná-lo ao catálogo.

```json
{
  "id": "meu-tema",
  "name": "Meu tema",
  "description": "Descrição curta e fiel do pacote.",
  "version": "1.0.0",
  "author": { "name": "Nome do autor", "url": "https://github.com/autor" },
  "license": "CC-BY-4.0",
  "sourceUrl": "https://github.com/autor/meu-tema",
  "categories": ["smart-folder-art"],
  "targetApps": ["zneko"],
  "compatibility": { "zneko": "versão verificada" },
  "previewImages": ["https://example.com/preview.png"],
  "package": {
    "url": "https://github.com/autor/meu-tema/releases/download/v1/tema.zip",
    "format": "zip",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "sizeBytes": 2048
  },
  "publishedAt": "2026-10-28T00:00:00.000Z"
}
```

## Regras de publicação e consumo

1. Não inclua ROMs, BIOS, arquivos proprietários ou materiais sem os direitos necessários.
2. Não publique um item como compatível com ZNeko até testar a estrutura do pacote com o código-fonte e o instalador reais do launcher.
3. Só coloque no índice público temas revisados. O índice vazio é intencional até haver pacotes legítimos e testados.
4. Não confie apenas na extensão do arquivo: na integração de instalação, valide limite de tamanho, conteúdo ZIP, caminhos internos e hash SHA-256 antes de extrair.
5. Clientes devem usar timeout/cancelamento, cache com validade, mensagens de erro e tratamento de indisponibilidade.
6. Não coloque tokens, cookies ou segredos no JSON público.

## Estado atual

A aplicação já tem a base de leitura, validação e filtro do catálogo. Ainda não há fluxo de envio/moderação, pacotes de tema publicados, nem instalação de temas no ZNeko. Esses recursos dependem de backend e da especificação real dos formatos suportados pelo launcher.
