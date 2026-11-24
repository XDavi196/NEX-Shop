# Contribuindo com a NEX Shop

Obrigado por considerar uma contribuição! Este guia explica como propor mudanças de forma pequena, verificável e alinhada ao escopo atual do projeto.

## Escopo do projeto

A NEX Shop é uma interface para descobrir projetos comunitários e consultar informações e releases publicados nas plataformas de origem.

No estado atual, a aplicação:
- pesquisa repositórios públicos do GitHub;
- apresenta metadados e releases disponíveis nas fontes oficiais;
- abre páginas de origem e links de release para o usuário.

A NEX Shop **não** instala, executa, atualiza ou desinstala jogos e programas. Não envie ROMs, BIOS, chaves, arquivos proprietários ou credenciais para o repositório.

## Ambiente de desenvolvimento

Consulte também a seção **Desenvolvimento** do [README](README.md).

Requisitos atuais:
- Node.js 22 ou superior;
- pnpm 10 ou superior.

Prepare o ambiente e execute as verificações:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

Antes de abrir um pull request, confirme que os testes e o build terminam sem erros. Se uma alteração exigir uma ferramenta ou SDK adicional, documente a versão e os passos necessários.

## Como propor uma alteração

1. Abra ou consulte uma issue para explicar o problema ou a melhoria.
2. Crie uma branch com um nome descritivo, por exemplo `fix/release-link-validation` ou `docs/android-setup`.
3. Faça uma alteração focada. Evite misturar refatorações sem relação com o objetivo.
4. Acrescente ou atualize testes quando mudar comportamento.
5. Atualize a documentação quando mudar comandos, requisitos, limitações ou comportamento visível.
6. Abra o pull request contra `main`, descrevendo o problema, a solução e as verificações executadas.

## Checklist do pull request

- [ ] A alteração está relacionada ao escopo da NEX Shop.
- [ ] Não foram incluídos segredos, tokens, chaves privadas, ROMs ou BIOS.
- [ ] Os testes relevantes foram executados.
- [ ] `pnpm build` foi executado quando houve alteração no código da aplicação.
- [ ] A documentação foi atualizada quando necessário.
- [ ] As limitações ainda existentes não foram descritas como funcionalidades concluídas.

## Boas práticas

- Prefira as APIs públicas e oficiais. Não adicione tokens pessoais ou credenciais de usuário ao cliente.
- Preserve mensagens úteis para estados de carregamento, erro, ausência de resultados e limite de requisições.
- Valide URLs antes de apresentá-las como links de download.
- Não faça a aplicação executar arquivos baixados automaticamente.
- Evite adicionar dependências quando a plataforma já oferece uma solução adequada.
- Não altere o fluxo de publicação de releases sem explicar o impacto e testar o caminho correspondente.

## Relato de problemas

Para bugs e sugestões comuns, use a aba [Issues](../../issues). Inclua o sistema operacional, a versão da NEX Shop, os passos para reproduzir, o resultado esperado e o resultado observado. Remova tokens, dados pessoais e outros segredos de logs e capturas de tela.
