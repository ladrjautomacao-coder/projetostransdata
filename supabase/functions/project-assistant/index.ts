import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PHASE_LABELS: Record<string, string> = {
  planejamento: "Planejamento",
  execucao: "Execução",
  homologacao: "Homologação",
  encerrado: "Implementado",
  suspenso: "Suspenso/Outros",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData } = await authClient.auth.getUser(jwt);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client: o assistente tem acesso TOTAL aos dados (bypass RLS).
    // Validação de permissão já foi feita acima via super_admin role.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: requires super_admin role" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
    const model = gateway("google/gemini-3-flash-preview");

    const tools = {
      searchProjects: tool({
        description: "Busca projetos por nome da empresa, cidade, estado ou nome do gestor. Use quando o usuário mencionar o nome de um projeto/cliente.",
        inputSchema: z.object({
          query: z.string().describe("Termo de busca: nome da empresa, cidade ou gestor"),
        }),
        execute: async ({ query }) => {
          const q = `%${query}%`;
          const { data } = await supabase
            .from("projects")
            .select("id, company_name, city, state, status, sub_phase, updated_at, manager:team_members!projects_manager_id_fkey(full_name)")
            .or(`company_name.ilike.${q},city.ilike.${q}`)
            .limit(15);
          return (data ?? []).map((p: any) => ({
            id: p.id,
            empresa: p.company_name,
            cidade: `${p.city}/${p.state}`,
            fase: PHASE_LABELS[p.status] ?? p.status,
            sub_fase: p.sub_phase,
            gestor: p.manager?.full_name ?? null,
          }));
        },
      }),

      getProjectLatestUpdate: tool({
        description: "Retorna a última nota de Acompanhamento do projeto, junto com fase e gestor.",
        inputSchema: z.object({
          projectId: z.string().uuid(),
        }),
        execute: async ({ projectId }) => {
          const [{ data: p }, { data: notes }] = await Promise.all([
            supabase.from("projects")
              .select("company_name, city, state, status, sub_phase, d_zero_date, is_pilot, complementary_sale, manager:team_members!projects_manager_id_fkey(full_name)")
              .eq("id", projectId).maybeSingle(),
            supabase.from("project_notes")
              .select("content, created_at, created_by")
              .eq("project_id", projectId).order("created_at", { ascending: false }).limit(1),
          ]);
          if (!p) return { error: "Projeto não encontrado" };
          const lastNote = notes?.[0];
          let authorName: string | null = null;
          if (lastNote?.created_by) {
            const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", lastNote.created_by).maybeSingle();
            authorName = prof?.full_name ?? null;
          }
          return {
            empresa: (p as any).company_name,
            cidade: `${(p as any).city}/${(p as any).state}`,
            fase: PHASE_LABELS[(p as any).status] ?? (p as any).status,
            sub_fase: (p as any).sub_phase,
            gestor: (p as any).manager?.full_name ?? null,
            d_zero: (p as any).d_zero_date,
            piloto: (p as any).is_pilot,
            venda_complementar: (p as any).complementary_sale,
            ultima_atualizacao: lastNote ? {
              data: lastNote.created_at,
              autor: authorName,
              texto: lastNote.content,
            } : null,
          };
        },
      }),

      getProjectHistory: tool({
        description: "Retorna as últimas N notas de Acompanhamento de um projeto, em ordem cronológica reversa.",
        inputSchema: z.object({
          projectId: z.string().uuid(),
          limit: z.number().int().min(1).max(20).default(5),
        }),
        execute: async ({ projectId, limit }) => {
          const { data } = await supabase
            .from("project_notes")
            .select("content, created_at, created_by")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(limit);
          return (data ?? []).map((n: any) => ({
            data: n.created_at, texto: n.content,
          }));
        },
      }),

      getProjectDetails: tool({
        description: "Retorna dados completos de um projeto (frota, soluções, integrações, datas).",
        inputSchema: z.object({ projectId: z.string().uuid() }),
        execute: async ({ projectId }) => {
          const { data: p } = await supabase
            .from("projects")
            .select(`id, company_name, city, state, status, sub_phase, contract_date, d_zero_date, handover_date,
                     fleet_size, implemented_fleet, complementary_sale, complementary_fleet, is_pilot, pilot_info,
                     observations, updated_at,
                     manager:team_members!projects_manager_id_fkey(full_name),
                     executive:team_members!projects_executive_id_fkey(full_name),
                     project_solutions(solution:solutions(name)),
                     project_integrations(integration:integrations(name))`)
            .eq("id", projectId).maybeSingle();
          if (!p) return { error: "Projeto não encontrado" };
          const x = p as any;
          return {
            empresa: x.company_name,
            cidade: `${x.city}/${x.state}`,
            fase: PHASE_LABELS[x.status] ?? x.status,
            sub_fase: x.sub_phase,
            gestor: x.manager?.full_name,
            executivo: x.executive?.full_name,
            datas: { contrato: x.contract_date, d_zero: x.d_zero_date, handover: x.handover_date },
            frota: { contratada: x.fleet_size, implementada: x.implemented_fleet, complementar: x.complementary_fleet },
            piloto: x.is_pilot, info_piloto: x.pilot_info,
            venda_complementar: x.complementary_sale,
            solucoes: x.project_solutions?.map((s: any) => s.solution?.name).filter(Boolean) ?? [],
            integracoes: x.project_integrations?.map((i: any) => i.integration?.name).filter(Boolean) ?? [],
            observacoes: x.observations,
          };
        },
      }),

      listProjectsByFilter: tool({
        description: "Lista projetos com filtros combináveis. Use para perguntas como 'projetos do gestor X', 'projetos em homologação'.",
        inputSchema: z.object({
          status: z.enum(["planejamento", "execucao", "homologacao", "encerrado", "suspenso"]).optional(),
          managerName: z.string().optional().describe("Nome (parcial) do gestor"),
          isPilot: z.boolean().optional(),
          complementarySale: z.boolean().optional(),
          limit: z.number().int().min(1).max(50).default(20),
        }),
        execute: async ({ status, managerName, isPilot, complementarySale, limit }) => {
          let q = supabase
            .from("projects")
            .select("id, company_name, city, state, status, sub_phase, is_pilot, complementary_sale, fleet_size, implemented_fleet, manager:team_members!projects_manager_id_fkey(id, full_name)")
            .order("updated_at", { ascending: true })
            .limit(limit);
          if (status) q = q.eq("status", status);
          if (isPilot !== undefined) q = q.eq("is_pilot", isPilot);
          if (complementarySale !== undefined) q = q.eq("complementary_sale", complementarySale);
          if (managerName) {
            const { data: mgrs } = await supabase.from("team_members").select("id").ilike("full_name", `%${managerName}%`);
            const ids = (mgrs ?? []).map((m: any) => m.id);
            if (ids.length === 0) return [];
            q = q.in("manager_id", ids);
          }
          const { data } = await q;
          return (data ?? []).map((p: any) => ({
            id: p.id,
            empresa: p.company_name,
            cidade: `${p.city}/${p.state}`,
            fase: PHASE_LABELS[p.status] ?? p.status,
            sub_fase: p.sub_phase,
            gestor: p.manager?.full_name ?? null,
            piloto: p.is_pilot,
            venda_complementar: p.complementary_sale,
            frota: { contratada: p.fleet_size ?? 0, implementada: p.implemented_fleet ?? 0 },
          }));
        },
      }),

      getDashboardKpis: tool({
        description: "Retorna KPIs agregados: total de projetos, distribuição por fase, quantidade de pilotos, vendas complementares e projetos críticos (parados >30 dias).",
        inputSchema: z.object({}),
        execute: async () => {
          const { data } = await supabase
            .from("projects")
            .select("status, is_pilot, complementary_sale, updated_at, fleet_size, implemented_fleet");
          const rows = data ?? [];
          const byStatus: Record<string, number> = {};
          let pilots = 0, complementares = 0, criticos = 0, frotaContratada = 0, frotaImplementada = 0;
          for (const r of rows as any[]) {
            byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
            if (r.is_pilot) pilots++;
            if (r.complementary_sale) complementares++;
            const days = r.updated_at ? Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 86_400_000) : 0;
            if (days > 30 && r.status !== "encerrado" && r.status !== "suspenso") criticos++;
            frotaContratada += r.fleet_size ?? 0;
            frotaImplementada += r.implemented_fleet ?? 0;
          }
          return {
            total: rows.length,
            por_fase: Object.fromEntries(Object.entries(byStatus).map(([k, v]) => [PHASE_LABELS[k] ?? k, v])),
            pilotos: pilots,
            vendas_complementares: complementares,
            criticos_parados_mais_30_dias: criticos,
            frota: { contratada: frotaContratada, implementada: frotaImplementada },
          };
        },
      }),
    };

    const today = new Date().toLocaleDateString("pt-BR", { dateStyle: "full" });
    const system = `Você é o Assistente Transdata. Hoje é ${today}.

ESCOPO ÚNICO: este assistente faz APENAS uma coisa — informar a **última atualização (Acompanhamento)** de um projeto. Não responda a nenhum outro tipo de pergunta. Se o usuário pedir qualquer outra coisa (KPIs, listas, dashboards, criação, edição), responda em uma frase: "Este assistente informa apenas a última atualização de um projeto. Diga o nome da empresa ou cidade do projeto desejado." e pare.

FLUXO OBRIGATÓRIO:

1) Se o usuário ainda não informou empresa/cidade, responda APENAS com:
   "Informe o **nome da empresa** ou a **cidade** do projeto."
   Nada mais. Não chame ferramentas.

2) Quando o usuário informar um termo de busca, chame \`searchProjects\` com esse termo.

3) Avalie o resultado:
   - **0 resultados:** responda "Nenhum projeto encontrado para \\"<termo>\\". Tente outro nome ou cidade." E pare.
   - **1 resultado:** chame imediatamente \`getProjectLatestUpdate\` com o id retornado e apresente a última atualização (formato abaixo).
   - **2+ resultados:** NÃO chame \`getProjectLatestUpdate\`. Liste as opções como bullets clicáveis e peça para o usuário escolher. Use EXATAMENTE este formato em cada bullet:
     \`- [Nome da Empresa — Cidade/UF](#ask:Última atualização do projeto <UUID>)\`
     (substitua <UUID> pelo id real do projeto). Acima da lista, escreva: "Encontrei mais de um projeto. Selecione:".

4) Quando a mensagem do usuário começar com "Última atualização do projeto " seguida de um UUID, extraia o UUID e chame \`getProjectLatestUpdate\` direto com ele.

FORMATO DA "ÚLTIMA ATUALIZAÇÃO" (Markdown GFM):

### Última Atualização — Nome da Empresa

- **Empresa:** [Nome](/projetos/<id>)
- **Cidade:** Cidade/UF
- **Status:** Fase · Sub-fase (capitalizado: Planejamento, Execução, Homologação, Implementado, Suspenso)
- **Gestor:** nome ou "—"

Em seguida, adicione um separador \`---\` e o bloco de acompanhamento abaixo. Este bloco precisa deixar EXPLÍCITO que se trata da última nota registrada pelo gestor:

---

**📝 Último acompanhamento registrado**

> Texto integral da última nota de Acompanhamento.

*Registrado por **Autor** em dd/mm/aaaa.*

Se o autor não for conhecido, escreva *Registrado em dd/mm/aaaa (autor não identificado).* Se não houver nenhuma nota de Acompanhamento, substitua o bloco inteiro por: "**Nenhum acompanhamento registrado até o momento.**"

REGRAS DE COMUNICAÇÃO:
- Português do Brasil, tom corporativo, direto, sem emojis, sem exclamações, sem preâmbulos ("Claro!", "Aqui está"). Nunca exponha IDs, JSON, SQL ou nomes de ferramentas no texto (UUIDs só dentro dos links \`#ask:\`).
- Use apenas as ferramentas \`searchProjects\` e \`getProjectLatestUpdate\`. Ignore as demais.`;

    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (err) {
    console.error("project-assistant error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
