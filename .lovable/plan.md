# Plano — Melhorias Alto Impacto + Mobile/PWA

## Sobre o "backup nomeado"
O Lovable cria automaticamente uma versão a cada alteração no histórico (botão de versões no topo). Não existe um comando para nomear branches via agente, mas para servir como **checkpoint nomeado** vou:
- Garantir que **nada** seja alterado antes desta resposta ser aprovada;
- Após aprovar, a primeira mudança criará uma versão que você pode renomear no histórico para `backup-pre-melhorias` (clique nos 3 pontos da versão → renomear);
- Cada uma das 4 entregas abaixo será feita em **commits separados**, então cada etapa tem seu próprio ponto de restauração.

Se quiser uma garantia extra, posso também gerar um **dump SQL dos dados atuais** (projetos, kanban, history, users) para `/mnt/documents/` antes de começar — só me avise.

---

## Etapa 1 — Central de Alertas Global (sino no header)

**Onde:** `src/components/AppLayout.tsx` (header já existe), novo componente `src/components/AlertsBell.tsx`.

**O que detecta** (consulta única ao Supabase, refetch a cada 60s):
- Projetos retornados de Implementado (`reached_implemented=true AND status!='encerrado'`)
- D-zero vencendo em ≤7 dias (`d_zero_date BETWEEN today AND today+7`)
- Projetos parados >30 dias na mesma coluna (`updated_at < today-30`)
- Projetos sem gestor (`manager_id IS NULL`)

**UI:** Ícone de sino no header com badge de contagem. Popover com lista agrupada por categoria, clique navega para o projeto.

---

## Etapa 2 — SLA / Heat Map nos cards do Kanban

**Onde:** `src/components/kanban/KanbanCard.tsx`.

**Regras** (baseado em `updated_at`):
- 0–7 dias → tarja verde lateral
- 8–15 dias → tarja amarela
- 16–30 dias → tarja laranja
- >30 dias → tarja vermelha + ícone de relógio piscando

Tooltip mostra "Parado há X dias nesta etapa". Não conflita com a tarja do "retornou de Implementado" (que continua tendo prioridade visual).

---

## Etapa 3 — Command Palette (Ctrl/Cmd+K)

**Onde:** Novo `src/components/CommandPalette.tsx` montado no `AppLayout`. Usa `@/components/ui/command` (já instalado).

**O que faz:**
- Atalho global `Ctrl+K` (Windows) / `Cmd+K` (Mac)
- Busca projetos por nome da empresa, cidade, gestor
- Atalhos de navegação: Dashboard, Kanban, Lista, Acervo, Implantação, Cadastrar
- Mostra mini-info do projeto (status, sub-fase) e navega direto

---

## Etapa 4 — Mobile + PWA

**Mobile (Kanban e telas principais):**
- `KanbanColumn`: largura mínima reduzida para mobile, scroll horizontal fluido com snap
- Cards mais compactos em <768px (paddings/fontes menores, esconde campos opcionais)
- `AppSidebar` já é responsivo via SidebarProvider — apenas garantir que abre como drawer no mobile
- Dashboard: KPIs em grid 2 colunas no mobile (hoje quebra ruim)

**PWA:**
- O projeto **já tem** `vite-plugin-pwa` configurado em `vite.config.ts` com manifest e ícones
- Vou habilitar de forma segura: `registerType: autoUpdate`, **NetworkFirst** para HTML (evita ficar preso em build antigo), `navigateFallbackDenylist` para `/~oauth`, e guarda anti-iframe no `main.tsx` (já existe parcialmente)
- Não adiciono push notifications nesta rodada (exige backend dedicado de subscription + edge function); fica como próxima fase se você confirmar

---

## Ordem de execução
1. Etapa 2 (SLA) — mais baixo risco, só visual
2. Etapa 1 (Alertas) — depende de query nova mas não muda schema
3. Etapa 3 (Command Palette)
4. Etapa 4 (Mobile + PWA) — última porque mexe em build/manifest

Sem mudanças de schema. Sem migrations. Sem impacto no Dashboard ou no fluxo do Kanban.

## Validação
Após cada etapa: rebuild + verificação visual no preview (desktop e mobile 390x844).

---

**Confirma este plano para eu começar pela Etapa 1 (SLA visual)?**