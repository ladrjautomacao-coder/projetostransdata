## Objetivo

Após o projeto atingir **Implementado**, se ele for movido para outro Kanban (Comercial, Planejamento, Implantação, Outros), a Linha do Tempo deve **continuar** mostrando esse novo passo (e os seguintes, caso haja mais movimentações), em vez de parar em "Implementado". Isso garante rastreabilidade completa do percurso do projeto.

## Mudança proposta (apenas UI / leitura)

Arquivo: `src/pages/ProjectDetail.tsx` (seção "Linha do Tempo", linhas ~409–520).

1. **Buscar histórico pós-Implementado** da tabela `project_history`:
   - Consultar registros do `project_id` atual onde `change_type = 'status_change'` (ou equivalente já gravado), `created_at >= reached_implemented_at`, ordenados por data.
   - Extrair sequência de status para os quais o projeto foi movido depois de atingir Implementado, deduplicando movimentações consecutivas para o mesmo status.
   - Caso o `project_history` não esteja registrando mudanças de status (a verificar no código que faz update do status), usar como fallback apenas o **status atual** + `updated_at` como único passo adicional.

2. **Compor a timeline dinâmica** quando `reached_implemented === true`:
   - Manter os 4 passos fixos atuais: Contratação → D-zero → Handover → Implementado (sempre marcado como "Já atingido").
   - **Anexar** N passos extras, um para cada movimentação posterior:
     - Label: nome amigável da fase (`statusLabels[status]`, ex.: "Comercial", "Planejamento", "Implantação", "Outros").
     - Data: `created_at` da mudança (formato dd/MM/yyyy).
     - Marcado como concluído (✓) para etapas intermediárias; a **última** recebe o destaque de "etapa atual" (pulse/glow animado) em vez do "Implementado".
   - Numeração contínua (5, 6, 7…).

3. **Banner vermelho existente** ("Projeto já atingiu Implementado em … e foi movido para …") permanece, pois resume o estado atual.

4. **Estilo visual** dos passos extras: igual aos demais (círculo numerado), mas com um indicador sutil de "retorno" — por exemplo, borda em `border-red-400` quando o status atual não é `encerrado`, para reforçar que está fora do fluxo ideal. Sem novas cores fora dos tokens do design system.

## Detalhes técnicos

- Adicionar `useEffect` que dispara após carregar o `project` e quando `reached_implemented` for `true`, consultando `project_history` via supabase client.
- Estado novo: `postImplementedSteps: { status: ProjectStatus; date: string }[]`.
- Render: substituir o array `timeline` fixo por `[...baseTimeline, ...postImplementedSteps.map(...)]`.
- `currentMilestoneIndex` passa a ser `timeline.length - 1` quando há passos pós-Implementado.
- Sem mudanças no banco: `project_history` já existe; verificar (no código de update) que mudanças de status estão sendo gravadas — se não estiverem, planejar instrumentar isso em uma etapa separada antes de ativar a UI completa.

## Fora de escopo

- Mudanças no Kanban, em outras telas, ou em regras de negócio do fluxo de status.
- Edição manual desses passos pelo usuário.
