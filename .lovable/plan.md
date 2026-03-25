

# Gestão de Projetos — Kanban com Filtros Laterais

## Objetivo
Criar uma nova página "Gestão de Projetos" acessível via card no módulo de Projetos, com visualização Kanban (colunas por status) e painel de filtros lateral. Os filtros aplicados nesta tela devem ser compartilhados com o restante do sistema via contexto React.

## Arquitetura

### 1. Contexto global de filtros — `src/contexts/ProjectFiltersContext.tsx` (novo)
- Estado compartilhado: `managerId`, `companyName`, `state`, `city`, `status`
- Provider no `AppLayout` para que qualquer página consuma os filtros
- Funções `setFilter()` e `clearFilters()`
- A página `ProjectList` e outras que listam projetos passam a consumir este contexto

### 2. Página Kanban — `src/pages/ProjectManagement.tsx` (novo)
Layout dividido em duas áreas:

```text
┌──────────────┬──────────────────────────────────────────┐
│  FILTROS     │  KANBAN BOARD                            │
│  (sidebar)   │                                          │
│              │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  GP          │  │Plan. │ │Impl. │ │Encer.│ │Susp. │    │
│  Empresa     │  │      │ │      │ │      │ │      │    │
│  Estado      │  │ Card │ │ Card │ │ Card │ │ Card │    │
│  Cidade      │  │ Card │ │ Card │ │      │ │      │    │
│  Status      │  │      │ │      │ │      │ │      │    │
│              │  └──────┘ └──────┘ └──────┘ └──────┘    │
│  [Limpar]    │                                          │
└──────────────┴──────────────────────────────────────────┘
```

- **Painel de filtros (esquerda, ~250px):** Inputs/selects para GP, empresa (busca), estado, cidade, status. Botão "Limpar filtros". Filtros atualizam o contexto global.
- **Board Kanban (direita):** 4 colunas correspondendo aos status do enum `project_status`: Planejamento, Implantação, Encerrado, Suspenso.
- **Cards:** Exibem empresa, cidade/estado, GP, executivo, soluções (badges), data D-zero. Click no card navega para `/projetos/:id`.
- Cada coluna mostra contador de projetos.
- Sem drag-and-drop entre colunas (alteração de status via detalhe do projeto).

### 3. Rota e navegação
- **`src/App.tsx`**: Adicionar rota `/projetos/gestao` → `ProjectManagement`
- **`src/pages/Projects.tsx`**: Adicionar card "Gestão de Projetos" com ícone `Kanban` (lucide) para todos os usuários

### 4. Integração dos filtros no `ProjectList`
- `ProjectList.tsx` passa a ler os filtros do contexto global como valores iniciais dos seus filtros locais, garantindo que filtros aplicados na gestão reflitam na listagem e vice-versa.

### 5. Wrapper do contexto
- **`src/components/AppLayout.tsx`**: Envolver o conteúdo com `ProjectFiltersProvider`

## Arquivos alterados/criados
| Arquivo | Ação |
|---|---|
| `src/contexts/ProjectFiltersContext.tsx` | Criar |
| `src/pages/ProjectManagement.tsx` | Criar |
| `src/pages/Projects.tsx` | Adicionar card |
| `src/App.tsx` | Adicionar rota |
| `src/components/AppLayout.tsx` | Adicionar Provider |
| `src/pages/ProjectList.tsx` | Consumir contexto de filtros |

## O que NÃO muda
- Banco de dados, RLS, edge functions — sem alterações
- Funcionalidades existentes permanecem intactas
- Dashboard e demais rotas não são afetadas

