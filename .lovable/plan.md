# Plano: Card "retornado de Implementado" — dashboard congelado e alerta visual

## Comportamento desejado
Quando um projeto atinge **Implementado** pela primeira vez e depois é movido de volta para qualquer outra coluna:
1. Dashboard continua contabilizando o projeto como Implementado (frota e contagem).
2. Linha do tempo do detalhe não regride — Implementado segue marcado como atingido.
3. Card recebe alerta visual claro no Kanban.

## Alterações

### 1. Banco — nova flag em `projects`
Migração adicionando:
- `reached_implemented` boolean default `false`
- `reached_implemented_at` timestamptz nullable

Backfill: setar `true` + `updated_at` para todos os projetos já com `status = 'encerrado'`. Uma vez `true`, nunca volta a `false`.

### 2. Kanban — gravar a flag (`ProjectManagement.tsx`)
No `onDragEnd`, quando destino for `encerrado` e o projeto ainda não tiver a flag, incluir `reached_implemented: true, reached_implemented_at: now()` no update. Demais movimentos não tocam na flag.

### 3. Alerta no card (`KanbanCard.tsx`) — opção escolhida: borda + bolinha
Quando `reached_implemented === true` **e** `status !== 'encerrado'`:
- Borda esquerda vermelha: `border-l-4 border-l-red-500` + leve `bg-red-50/30 dark:bg-red-950/10` (substitui a borda âmbar/esmeralda se houver).
- Bolinha pulsante vermelha no canto superior direito (`animate-ping` + dot sólido).
- Envolto em `Tooltip`: **"Projeto retornou de Implementado em DD/MM/AAAA"** (data formatada de `reached_implemented_at`).

### 4. Dashboard — congelar contabilização (`Dashboard.tsx`)
Criar helper `effectiveStatus(p) = p.reached_implemented ? 'encerrado' : p.status` e aplicar em todas as agregações por status:
- `statusCounts` (contagem por status).
- `fleetByStatus`: substituir `p.status` por `effectiveStatus(p)` na lógica atual (linhas ~440–457). Assim a frota restante deixa de migrar para Comercial/etc. e permanece em Implementado.
- Drill-down "Frota por Status" (lista expandida por status, ~linha 767): filtrar projetos pelo `effectiveStatus`.
- Demais gráficos/segmentações por status seguem o mesmo helper.

Não muda: total de projetos, total de estados, frota total contratada.

### 5. Timeline do detalhe (`ProjectTimeline.tsx` + `ProjectDetail.tsx`) — opção escolhida: mostrar fase atual + marca
- Nova prop `reachedImplemented?: boolean` e `reachedImplementedAt?: string`.
- `currentIndex` continua refletindo o `status` atual (fase atual destacada normalmente).
- Quando `reachedImplemented` for true: a etapa "Implementado" recebe selo verde permanente (check) + label menor "já atingido"; etapas entre a atual e Implementado também ficam visualmente concluídas (verdes).
- Pequeno badge acima da timeline: "Já atingiu Implementado em DD/MM/AAAA".

### 6. Selects e tipos
Incluir `reached_implemented, reached_implemented_at` nos `select(...)` de `projects` em `Dashboard.tsx`, `ProjectManagement.tsx`, `ProjectDetail.tsx`. `types.ts` é regenerado automaticamente.

## Arquivos
- `supabase/migrations/<novo>.sql`
- `src/pages/ProjectManagement.tsx`
- `src/components/kanban/KanbanCard.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/ProjectTimeline.tsx`
- `src/pages/ProjectDetail.tsx`

## Resultado
- Atlântico (exemplo): move Implementado → Comercial/Aguardando contrato. Dashboard intacto. Card aparece com borda vermelha + bolinha pulsante. Tooltip com a data. Timeline do detalhe segue mostrando Implementado como atingido.
- Card voltando para Implementado: alerta some, segue comportamento normal.
- Projetos que nunca tocaram Implementado: nada muda.
