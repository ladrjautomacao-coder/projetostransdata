## Visão Geral

Criar um **assistente conversacional (chatbot) com IA** acessível por widget flutuante em todas as páginas do sistema. O bot entende perguntas em linguagem natural sobre projetos e responde consultando dados reais (acompanhamento, status, fase, gestor, SLA, frota, etc.), respeitando o RLS já existente.

Exemplos de perguntas suportadas:
- *"Qual a última atualização do projeto Viação Cidade Verde?"*
- *"Quais projetos estão parados há mais de 15 dias?"*
- *"Quantos projetos do João estão em homologação?"*
- *"Me dê um resumo dos projetos críticos esta semana."*
- *"O que devo priorizar no projeto Expresso Azul?"*

---

## Arquitetura

```text
[Widget Flutuante (React)] 
        │  useChat (AI SDK)
        ▼
[Edge Function: project-assistant]
        │  streamText + tools (AI SDK)
        ▼
[Lovable AI Gateway → Gemini 3 Flash]
        │  tool calls
        ▼
[Supabase: queries via service role + filtro RLS por user JWT]
```

- **Frontend:** widget flutuante (`AssistantWidget.tsx`) montado no `AppLayout`, com botão circular no canto inferior direito que abre um painel de chat.
- **Backend:** Edge Function `project-assistant` que usa AI SDK + Lovable AI Gateway. As respostas chegam em **streaming** (tokens conforme gerados).
- **Tool calling:** o modelo decide quando consultar o banco através de ferramentas tipadas (Zod).
- **Sessão:** sem persistência — conversa vive apenas em memória do React; ao recarregar, começa nova.
- **Permissões:** a Edge Function valida o JWT do usuário e usa o token dele para consultar o banco — assim o RLS já configurado decide o que ele pode ver.

---

## Ferramentas do agente (tools)

O agente chama essas funções conforme a pergunta:

| Tool | Para quê |
|---|---|
| `searchProjects(query)` | Buscar projetos por nome/cidade/gestor (fuzzy) |
| `getProjectLatestUpdate(projectId)` | Última nota de Acompanhamento + status, fase, SLA |
| `getProjectDetails(projectId)` | Dados completos: gestor, frota, integrações, soluções, datas |
| `listProjectsByFilter({ status, managerId, daysStalled, isPilot, ... })` | Listas filtradas |
| `getProjectHistory(projectId, limit)` | Últimas N notas de acompanhamento |
| `getDashboardKpis({ period })` | KPIs agregados (totais, distribuição, críticos) |

Cada tool retorna JSON enxuto para não estourar o contexto do modelo.

---

## UX do Widget

- **Botão flutuante** com ícone de Sparkles + tooltip "Assistente Transdata" (canto inferior direito, z-index alto, oculto na rota `/login`).
- **Painel** (`Sheet` lateral à direita, 400px no desktop / fullscreen no mobile) com:
  - Header: avatar do bot + "Assistente Transdata" + botão fechar.
  - Lista de mensagens com markdown renderizado (`react-markdown`).
  - Estado vazio com 3-4 chips de sugestões prontas ("Projetos críticos", "Atualização do projeto…", etc.).
  - Indicador de digitação enquanto `status === "submitted"`.
  - Quando o bot menciona projetos, renderiza links clicáveis que navegam para `/projetos/:id`.
  - Input fixo no rodapé com botão de enviar (desabilitado durante streaming).
  - Botão "Nova conversa" para limpar mensagens.
- **Atalho:** `Ctrl + J` para abrir/fechar.

---

## Detalhes Técnicos

**Stack de IA**
- AI SDK (`ai`, `@ai-sdk/react`) + `@ai-sdk/openai-compatible` apontando para Lovable AI Gateway.
- Modelo padrão: `google/gemini-3-flash-preview` (rápido e barato, ótimo para function calling).
- `streamText` com `tools`, `stopWhen: stepCountIs(50)`, `toUIMessageStreamResponse`.

**Edge Function `supabase/functions/project-assistant/index.ts`**
1. CORS + valida JWT do usuário (`Authorization: Bearer ...`).
2. Cria cliente Supabase com esse token (RLS aplicado).
3. Constrói system prompt em português com: data atual, papel do usuário, contexto da Transdata, regras de fases/SLA do Kanban.
4. Define tools com `inputSchema: z.object(...)` e `execute` que consulta as tabelas `projects`, `project_notes`, `team_members`, `project_solutions`, etc.
5. Retorna `result.toUIMessageStreamResponse({ headers: corsHeaders })`.
6. Sem `verify_jwt` no `config.toml` (Lovable padrão já é `false`); JWT é validado manualmente no código.

**Frontend**
- Novo arquivo `src/components/assistant/AssistantWidget.tsx` — botão + Sheet.
- Novo arquivo `src/components/assistant/AssistantChat.tsx` — `useChat` com `DefaultChatTransport` apontando para `${VITE_SUPABASE_URL}/functions/v1/project-assistant`, header `Authorization` com o JWT do usuário logado (via `supabase.auth.getSession()`).
- Renderização via `message.parts`, com markdown + detecção de tool-calls para mostrar "Consultando dados…" enquanto o agente executa ferramentas.
- Montado uma vez em `AppLayout` (oculto se não estiver autenticado).
- Adicionar dependências: `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod` (já presente), `react-markdown`.

**Segurança**
- Edge Function nunca usa service role; sempre o JWT do usuário → RLS garante isolamento.
- Sem persistência → nenhum dado sensível guardado em banco a partir do chat.
- `LOVABLE_API_KEY` permanece server-side (já existe).

---

## Custos

- Gemini 3 Flash via Lovable AI Gateway: cobrado por requisição dos créditos do workspace. Conversas curtas (~1k tokens) são baratas; perguntas com listas grandes consomem mais.
- Sem custo de armazenamento (sem persistência).

---

## Fora de escopo (fica para depois, se desejar)

- Histórico persistente de conversas / threads.
- Bot via WhatsApp / Telegram / e-mail.
- Bot escrever no banco (ex.: registrar acompanhamento por chat) — neste momento será **somente leitura**.
- Voz (speech-to-text).

---

## Entregáveis

1. Edge Function `project-assistant` com 6 tools tipadas.
2. Componentes `AssistantWidget` + `AssistantChat`.
3. Integração no `AppLayout` com atalho `Ctrl+J`.
4. Documentação no Manual do Sistema (`/manual`) explicando como usar.
5. Atualização do PRD (`docs/PRD.md`) com a nova seção "Assistente IA".
