

## Plano: Reposicionar badges de integrações no card do Kanban

### Problema
Os badges de integrações estão aparecendo numa seção separada abaixo das soluções. O usuário quer que fiquem junto aos badges "Piloto" e "V. Compl.", no canto superior direito do card — empilhando abaixo deles se já existirem.

### Alteração

**`src/components/kanban/KanbanCard.tsx`**
- Remover o bloco separado de `project_integrations` que está no final do card
- Mover os badges de integrações para dentro da área superior do card (junto com "Piloto" e "V. Compl."), reorganizando o layout do header para permitir empilhamento vertical dos badges quando há múltiplos
- Usar `flex-col` nos badges do canto direito para que fiquem empilhados verticalmente (Piloto em cima, V. Compl. abaixo, integrações por último)

### Arquivo alterado
- `src/components/kanban/KanbanCard.tsx`

