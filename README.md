# NEX Shop

Loja independente para descoberta de projetos de jogos no GitHub. Esta entrega contém o conector público e uma interface web responsiva.

## Executar

Requer Node.js 20+ e conexão com a internet.

```sh
npm install
npm run dev
```

Build web: `npm run build`. Testes automatizados: `npm test`. O projeto ainda não inclui empacotadores ou builds nativos para Windows/Android.

## GitHub REST

Pesquisa sem token em `GET https://api.github.com/search/repositories`; categorias, texto, debounce de 450 ms, paginação de 24 itens, ordenação por estrelas, cache em memória de 5 minutos e tratamento de erros/limites de uso. Detalhes e releases vêm dos endpoints oficiais. Links externos abrem com `noopener noreferrer`; downloads só aparecem para assets HTTPS das releases oficiais. A loja não executa downloads nem assume compatibilidade não declarada pelo projeto.

`src/github.ts` é o conector compartilhável entre a NEX Shop independente e a versão integrada ao NEX 2 Frontend. Essa integração com o código do NEX 2 ainda depende do frontend, que não estava neste workspace.
