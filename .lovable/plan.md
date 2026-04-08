

## Plano: Botão "Voltar" com navegação inteligente

### Problema
O botão "Voltar" em `ProjectDetail.tsx` sempre navega para `/projetos/lista`. Quando o usuário vem do Kanban (`/projetos/gestao`), deveria retornar ao Kanban.

### Solução
Usar `useLocation` para detectar a origem da navegação. Se houver state indicando que veio do Kanban, voltar para `/projetos/gestao`. Caso contrário, manter o comportamento atual (`/projetos/lista`).

### Alterações

**1. `src/pages/ProjectDetail.tsx`**
- Importar `useLocation`
- Ler `location.state?.from` para determinar a rota de retorno
- Alterar o `onClick` do botão Voltar para `navigate(location.state?.from || "/projetos/lista")`

**2. `src/components/kanban/KanbanCard.tsx`**
- Alterar o `navigate` ao clicar no card para passar state: `navigate(\`/projetos/\${p.id}\`, { state: { from: "/projetos/gestao" } })`

### Arquivos alterados
- `src/pages/ProjectDetail.tsx` (2 linhas)
- `src/components/kanban/KanbanCard.tsx` (1 linha)

