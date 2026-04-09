

## Plano: Badge de Integrações nos cards do Kanban

### O que sera feito

Adicionar badges de integrações nos cards do Kanban, seguindo o mesmo padrão visual dos badges de "Piloto" e "V. Compl." já existentes. Cada integração vinculada ao projeto será exibida como um badge no card.

### Alterações

**1. `src/pages/ProjectManagement.tsx`**
- Adicionar `project_integrations(integration:integrations(name))` na query de projetos
- Atualizar o tipo `ProjectRow` para incluir `project_integrations`

**2. `src/components/kanban/KanbanCard.tsx`**
- Renderizar badges das integrações na área de badges existente (junto com soluções), usando um estilo visual distinto (ex: azul/indigo) para diferenciar de soluções

### Arquivos alterados
- `src/pages/ProjectManagement.tsx` (query + tipo)
- `src/components/kanban/KanbanCard.tsx` (render dos badges)

