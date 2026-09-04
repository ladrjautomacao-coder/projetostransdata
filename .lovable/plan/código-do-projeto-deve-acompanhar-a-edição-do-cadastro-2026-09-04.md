# Código do projeto deve acompanhar a edição do cadastro

## Situação atual (verificada)

A regra que recalcula o código já existe no banco, mas ela só é acionada **no momento do cadastro**. Na edição ela nunca roda — por isso, ao corrigir a cidade (ou UF/país, tipo, seguimento, nome da empresa), o código continua com o valor antigo.

## O que será feito

- Ativar a mesma regra também na hora de salvar uma edição.
- Quando qualquer campo usado na composição do código mudar, o código é recalculado automaticamente: Cidade (3) + UF ou sigla do país (2) + Tipo (2) + Seguimento (3) + Sequencial (4) + "-" + Empresa.
- O **sequencial de 4 dígitos é preservado**, ou seja, o projeto não recebe um número novo — só as partes que dependem dos dados corrigidos mudam.
- Se o usuário editar campos que não entram no código (datas, frota, observações etc.), o código permanece intacto.
- A alteração do código fica registrada no histórico de alterações do projeto, como qualquer outro campo.

## Detalhes técnicos

- Recriar o gatilho `trg_projects_set_code` em `public.projects` como `BEFORE INSERT OR UPDATE`, mantendo a função `public.projects_set_code()` já existente (ela já trata o caso de UPDATE e preserva o sequencial extraído do código atual).
- Nenhuma mudança de front-end é necessária; a tela de detalhe já relê o projeto após salvar e passará a exibir o código atualizado.
- Projetos já cadastrados não são alterados retroativamente — o novo código é aplicado na próxima vez que o projeto for salvo.
