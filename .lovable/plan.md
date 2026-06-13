## Objetivo

Restringir a movimentação de cards no Kanban (`/projetos/gestao`): cada gerente só pode arrastar/mover cards de **projetos em que ele é o gerente vinculado** (`projects.manager_id`). Outros cards ficam apenas visíveis (somente leitura para o gerente, sem arrastar).

Regras:
- **Admin** (e qualquer usuário com role `admin`) → acesso irrestrito, move qualquer card.
- **Gerente de projetos** → move só os cards cujo `manager_id` corresponde ao seu próprio `team_member.id` (vínculo via email).
- **Demais usuários** → somente visualização (não movem nada).
- Filtro de gerente no Kanban continua igual; mudar o filtro apenas muda o que está visível, não muda quem pode mover.

## Como identificar o gerente logado

- Buscar em `team_members` o registro cujo `email = auth.user.email` e `role = 'gerente_projetos'`.
- Guardar o `currentManagerId` (`string | null`) num estado/contexto local da página.
- `canEditCard(project)` = `isAdmin || project.manager_id === currentManagerId`.

## Mudanças

### Backend
- Incluir `manager_id` no `select` de `loadProjects` em `src/pages/ProjectManagement.tsx` (hoje só vem `manager.full_name`), para alimentar a verificação no frontend.
- **RLS em `projects` (defesa em profundidade)**: criar policy `UPDATE` que permita atualizar somente quando `has_role(auth.uid(),'admin')` **ou** `manager_id IN (select id from team_members where email = auth.email())`. Manter as policies de `SELECT` como estão (todos enxergam).

### Frontend — `src/pages/ProjectManagement.tsx`
- Carregar `currentManagerId` e `isAdmin` no mount.
- No `onDragEnd`, ignorar (com `toast` "Você só pode mover seus próprios projetos") se `canEditCard(project)` for falso.
- Passar `canEdit` para cada `<KanbanCard>`.

### Frontend — `src/components/kanban/KanbanCard.tsx`
- Receber prop `canEdit: boolean`.
- Repassar para `<Draggable isDragDisabled={!canEdit}>`.
- Ajustar visual: quando `!canEdit`, trocar `cursor-grab` por `cursor-default`, reduzir hover/sombra de arraste e (opcional) ícone de cadeado discreto no canto do card para indicar "somente leitura".
- Clique no card continua abrindo o detalhe normalmente.

### Fora de escopo
- Permissão de edição na página de detalhe do projeto (não foi pedido nesta etapa).
- Mudar o filtro de gerente do Kanban.
- Restringir SELECT de projetos por gerente.
