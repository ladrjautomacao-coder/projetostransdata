# Painel Comercial — visão de acompanhamento (somente leitura)

Uma nova área para a equipe comercial acompanhar o andamento de todos os projetos, com os comentários do gerente de projetos e a linha da vida, sem precisar pedir report.

## O que será criado

**Nova página `/comercial` — "Acompanhamento (Visão Comercial)"**

1. **Cabeçalho com indicadores**: total de projetos, por status (Comercial, Planejamento, Implantação, Implementado, Outros) e quantos estão sem atualização há mais de X dias.
2. **Filtros** (reaproveitando o padrão do Kanban): gerente, empresa, estado, cidade, status.
3. **Lista de projetos em cards**, cada um mostrando:
   - Empresa, código do projeto, cidade/UF, gerente responsável e executivo
   - Status atual + sub-fase, com as mesmas cores do Kanban
   - Frota total / frota implantada com barra de progresso
   - **Última atualização do acompanhamento** (texto, autor, data/hora) em destaque
   - Selo "Sem atualização há N dias" quando passar do limite
4. **Painel de detalhe** (ao clicar no card, abre um drawer lateral):
   - **Linha da vida do projeto**: componente `ProjectTimeline` já existente (Comercial → Planejamento → Implantação → Implementado) com datas de contrato, D-zero e handover
   - **Histórico completo de acompanhamento**: todas as notas do campo Acompanhamento, em ordem cronológica inversa, com autor e data/hora
   - **Histórico de mudanças de status** vindo de `project_history` (quem alterou e quando)
   - Soluções/escopo e integrações do projeto
5. **Somente leitura**: nenhum botão de editar, mover card, excluir ou adicionar nota. A tela é puramente de consulta.

**Sidebar**: novo item "Visão Comercial" dentro do grupo Módulo Projetos, visível conforme permissão.

## Detalhes técnicos

- Novo módulo de permissão `visao_comercial` (ação `view`) em `src/lib/permissions.ts`; migration atualizando `role_presets` para liberar a visualização aos papéis `comercial`, `executivo`, `gerente_projetos`, `admin` e `super_admin`.
- Rota `/comercial` em `src/App.tsx` dentro do `AppLayout` protegido; a página redireciona quem não tem `can('visao_comercial','view')`.
- Nova página `src/pages/VisaoComercial.tsx` + componentes `src/components/comercial/ProjectFollowUpCard.tsx` e `ProjectFollowUpDrawer.tsx`.
- Consulta única em `projects` (mesmos campos do Kanban + `project_code`, `fleet_size`, `created_at`) reutilizando `ProjectFiltersContext` e `KanbanFilters`; `project_history` carregado sob demanda ao abrir o drawer.
- Parser das notas de acompanhamento: as entradas já são gravadas no formato `[dd/MM/yyyy HH:mm • Autor] texto`; um utilitário separa cada linha em autor/data/texto para exibição estruturada.
- O limite de dias para "sem atualização" vem de `SettingsContext` se já houver chave equivalente; caso contrário usa 15 dias como padrão.
- Nenhuma alteração nas políticas RLS existentes — a leitura continua respeitando `can_view_project`.
