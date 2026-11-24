# Política de segurança

A NEX Shop consulta metadados de projetos e informações de releases em plataformas públicas. A segurança da aplicação, dos usuários e dos projetos consultados é importante.

## Versões abrangidas

A política se aplica ao código mantido neste repositório e às versões publicadas pela conta oficial do projeto. Como a aplicação ainda está em desenvolvimento, informe também o commit ou a versão que você testou.

## Como relatar uma vulnerabilidade

**Não publique detalhes de uma vulnerabilidade ainda não corrigida em uma issue, discussão ou pull request público.**

1. Se a opção **Security → Report a vulnerability** estiver disponível neste repositório, use-a para enviar um aviso privado.
2. Caso a opção não esteja disponível, entre em contato com o mantenedor por um canal privado do GitHub e solicite um meio seguro para compartilhar os detalhes. Não inclua a prova de conceito em uma issue pública.

Inclua, quando possível:
- uma descrição objetiva do problema e seu impacto;
- a versão, tag ou commit afetado;
- os passos mínimos para reproduzir;
- uma prova de conceito que não acesse dados de terceiros;
- logs relevantes com tokens, cookies, credenciais e dados pessoais removidos.

O mantenedor confirmará o recebimento quando possível, avaliará a reprodução e poderá solicitar informações adicionais. Não há prazo de resposta garantido para este projeto comunitário.

## Escopo de segurança

Exemplos de relatos relevantes incluem:
- execução não intencional de arquivos ou comandos;
- validação incorreta de URLs que permita apresentar destinos enganosos;
- exposição de tokens, credenciais ou dados privados;
- falhas no tratamento de conteúdo externo que afetem a aplicação;
- problemas nas integrações de desktop ou Android mantidas neste repositório.

A NEX Shop não controla o código, os releases ou a infraestrutura dos repositórios de terceiros que consulta. Vulnerabilidades em um projeto externo devem ser relatadas aos mantenedores desse projeto.

## Práticas seguras para testes

- Teste somente contas, dispositivos, repositórios e serviços que você controla ou tem autorização para avaliar.
- Não tente acessar dados privados de outros usuários.
- Não envie tokens, chaves privadas, cookies ou arquivos de credenciais em issues, commits ou logs.
- Não use downloads de terceiros como prova de que um projeto é seguro. Verifique a origem, a licença e os requisitos diretamente na página oficial.
- A NEX Shop abre páginas e links para o usuário; ela não deve executar automaticamente arquivos baixados.

## Divulgação coordenada

Solicitamos que detalhes técnicos exploráveis permaneçam privados enquanto o mantenedor investiga e prepara uma correção. Após a correção ou mitigação, as partes podem combinar a divulgação pública com informações suficientes para que os usuários entendam o impacto e a atualização recomendada.

Esta política não representa uma garantia de suporte, auditoria ou prazo de correção.
