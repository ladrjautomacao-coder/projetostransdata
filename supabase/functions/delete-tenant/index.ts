import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tenant fundador (Transdata) — nunca pode ser excluído por esta função,
// mesmo por engano.
const PROTECTED_TENANT_ID = "a2f1c8e0-0000-4000-8000-000000000001";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", callerId);
    const isSuperAdmin = (callerRoles ?? []).some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const tenantId = body.tenant_id;
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tenantId === PROTECTED_TENANT_ID) {
      return new Response(JSON.stringify({ error: "Este cliente não pode ser excluído por aqui." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apaga os usuários (Admin API) — profiles/user_roles/overrides
    // cascateiam a partir daqui. O restante dos dados (projetos, equipe,
    // catálogos, marca) cascateia a partir da exclusão do tenant abaixo.
    const { data: members } = await adminClient.from("profiles").select("user_id").eq("tenant_id", tenantId);
    for (const m of members ?? []) {
      const { error: delUserErr } = await adminClient.auth.admin.deleteUser(m.user_id);
      if (delUserErr) console.error(`Erro ao excluir usuário ${m.user_id}:`, delUserErr.message);
    }

    const { error: delTenantErr } = await adminClient.from("tenants").delete().eq("id", tenantId);
    if (delTenantErr) throw delTenantErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
