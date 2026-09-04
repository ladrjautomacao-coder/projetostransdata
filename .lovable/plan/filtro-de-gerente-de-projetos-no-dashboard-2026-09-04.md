# Filtro de Gerente de Projetos no Dashboard

## O que será feito

Adicionar um novo seletor "Todos os Gerentes" na barra de filtros do Dashboard, ao lado dos filtros de Status, Projeto, Estado, Cidade e Solução.

- A lista traz todos os gerentes que aparecem nos projetos carregados, em ordem alfabética, mais a opção "Sem gerente" quando houver projetos sem responsável.
- Ao escolher um gerente, todos os indicadores e gráficos da tela (total de projetos, frota, estados, status, cidades, soluções e o gráfico "Projetos por Gerente") passam a considerar apenas os projetos daquele gerente.
- O botão de limpar filtros também zera esse novo filtro, e ele conta como "filtro ativo".

## Detalhes técnicos

- `src/pages/Dashboard.tsx`: novo estado `filterManager` (padrão `"all"`), lista derivada `managers` a partir de `projects`, condição adicional em `filteredProjects`, inclusão em `hasActiveFilters` e no reset de filtros, e o `Select` correspondente na grade de filtros.
- Sem alterações no banco de dados.
