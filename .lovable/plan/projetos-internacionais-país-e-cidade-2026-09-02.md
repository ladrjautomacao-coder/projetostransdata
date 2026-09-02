# Projetos internacionais: País e Cidade

## O que muda no cadastro

- No card de dados do projeto passa a existir o campo **País**, sempre visível, com **Brasil** pré-selecionado.
- Com **Brasil** selecionado: comportamento atual (select de UF + cidade).
- Com outro país: o campo de UF é substituído por **Cidade** em formato de lista de seleção com busca, pré-carregada com as principais cidades daquele país.
- Cidade e país são obrigatórios; UF só é obrigatória quando o país é Brasil.

## Código do projeto

Mesmo formato de hoje, trocando a UF pela sigla do país quando internacional:

```text
BUE  AR  VE  NEW  0012  -EMPRESA
 |    |   |   |    |       |
 |    |   |   |    |       nome da empresa
 |    |   |   |    sequencial global (4 dígitos)
 |    |   |   seguimento
 |    |   tipo do projeto
 |    sigla do país (Brasil continua usando a UF)
 cidade (3 primeiras letras)
```

## Onde o país aparece

- Detalhes do projeto: País junto de Cidade/UF, com edição pelo mesmo padrão do cadastro.
- Lista de projetos, Kanban, Painel Comercial e busca: exibem "Cidade/UF" no Brasil e "Cidade — País" nos internacionais. Filtros de estado passam a listar também países internacionais.

## Base de países e cidades

- Lista completa de países (nome + sigla de 2 letras).
- Cidades pré-carregadas por país: capitais e principais cidades (aprox. 30–60 por país nos países mais relevantes; demais países com capital e maiores cidades). Novos itens podem ser adicionados depois por migração.

## Detalhes técnicos

- Migração:
  - `countries(code char(2) pk, name text, active bool)` e `country_cities(id, country_code fk, name, sort_order)` — leitura para `authenticated`, escrita apenas admin; RLS habilitada com GRANTs.
  - `projects.country_code char(2) not null default 'BR'`; `projects.state` passa a ser nullable, com trigger de validação exigindo `state` quando `country_code = 'BR'`.
  - `generate_project_code` / `preview_project_code` ganham parâmetro de país: usam `state` quando BR e `country_code` caso contrário. Trigger `projects_set_code` atualizado.
  - Seed dos países e das cidades principais.
- Frontend:
  - `src/pages/NewProject.tsx` e `src/pages/ProjectDetail.tsx`: select de País, select de UF condicional, combobox de cidade (busca) para internacionais, validação e preview de código.
  - Helper `src/lib/location.ts` para formatar "Cidade/UF" ou "Cidade — País".
  - Ajuste de exibição/filtros em `ProjectList.tsx`, `ProjectManagement.tsx`, `KanbanFilters.tsx`, `KanbanCard.tsx`, `VisaoComercial.tsx`, `ProjectFollowUpCard.tsx` e `CommandPalette.tsx`.
