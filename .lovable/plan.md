# Painel Comercial — visão de acompanhamento (somente leitura)

Nova área para a equipe comercial acompanhar o andamento de todos os projetos, com os comentários do gerente de projetos e a linha da vida, sem precisar pedir report.

## Página `/comercial` — "Acompanhamento (Visão Comercial)"

### 1. Cabeçalho com indicadores
- Total de projetos e contagem por status: Comercial, Planejamento, Implantação, Implementado, Outros.
- Contador de projetos "sem atualização há mais de X dias".
- Regra do status "Outros": corresponde ao status `suspenso` do Kanban, que agrega as sub-fases Suspenso, Cancelado e Piloto reprovado. O painel mostra a sub-fase no card para desambiguar.

### 2. Filtros, busca e ordenação
- Filtros no padrão do Kanban: gerente, empresa, estado, cidade, status.
- Campo de busca livre por nome da empresa ou código do projeto.
- Seletor de ordenação: última atualização, nome da empresa, status, dias sem atualização.
- Ordenação padrão: maior tempo sem atualização primeiro.

### 3. Lista de projetos em cards
Cada card mostra:
- Empresa, código do projeto, cidade/UF, gerente responsável e executivo.
- Status atual + sub-fase, com as mesmas cores do Kanban.
- Frota total / frota implantada com barra de progresso.
- Última nota de acompanhamento em destaque (texto, autor, data/hora).
- Selo "Sem atualização há N dias" com ícone de alerta + texto, não apenas cor.

Estados da lista:
- Loading: skeletons no formato dos cards.
- Vazio: mensagem clara com sugestão de limpar filtros (usando o `EmptyState` existente).
- Volume: carregamento paginado (lotes de 24) com botão "Carregar mais", filtros e busca aplicados no servidor.

### 4. Painel de detalhe (drawer lateral)
Ao clicar no card:
- Linha da vida do projeto usando o `ProjectTimeline` existente, com datas de contrato, D-zero e handover.
- Histórico completo de acompanhamento: todas as notas em ordem cronológica inversa, com autor e data/hora.
- Histórico de mudanças de status vindo de `project_history` (quem alterou, de/para, quando).
- Soluções/escopo e integrações do projeto.
- No mobile, o drawer vira modal fullscreen.

### 5. Atualização de dados
- Assinatura realtime na tabela `projects` (evento de UPDATE): quando o gerente grava uma nota ou muda o status, a lista atualiza sozinha e o card exibe indicação de "atualizado agora".
- Botão manual de atualizar no cabeçalho como fallback.

### 6. Exportação
- Fora da v1, por decisão consciente de escopo. O layout do cabeçalho já reserva espaço para o botão "Exportar visão atual" numa fase seguinte.

### 7. Somente leitura
- Nenhuma ação de editar, mover card, excluir ou adicionar nota. Tela puramente de consulta.

### Sidebar
- Novo item "Visão Comercial" no grupo Módulo Projetos, exibido conforme permissão.

## Detalhes técnicos
- Novo módulo de permissão `visao_comercial` (ação `view`) em `src/lib/permissions.ts`; migration atualizando `role_presets` para liberar visualização aos papéis `comercial`, `executivo`, `gerente_projetos`, `admin` e `super_admin`.
- Rota `/comercial` em `src/App.tsx` dentro do `AppLayout` protegido; a página redireciona quem não tem `can('visao_comercial','view')`.
- Nova página `src/pages/VisaoComercial.tsx` + componentes `src/components/comercial/ProjectFollowUpCard.tsx`, `ProjectFollowUpDrawer.tsx` e `ProjectFollowUpSkeleton.tsx`.
- Consulta em `projects` (campos do Kanban + `project_code`, `fleet_size`, `created_at`) reutilizando `ProjectFiltersContext` e `KanbanFilters`, com `.range()` para paginação; `project_history` carregado sob demanda ao abrir o drawer.
- Utilitário `src/lib/followUpNotes.ts` que faz o parse das notas no formato já gravado `[dd/MM/yyyy HH:mm • Autor] texto`, separando autor, data e texto; linhas fora do padrão são exibidas como texto simples.
- Limite de dias sem atualização vem de `SettingsContext` — a chave `stuckDays` já existe (padrão 30) e será reutilizada; o polling de fallback usa `pollingSeconds`.
- Realtime via canal `postgres_changes` do cliente já configurado, sem alterar RLS.
- Nenhuma alteração nas políticas RLS — leitura continua respeitando `can_view_project`.
- Skeletons com o componente `Skeleton` do shadcn, seguindo o padrão visual das demais listas.
