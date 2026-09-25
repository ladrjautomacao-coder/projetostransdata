import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const companyName = (body.company_name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const fullName = (body.full_name ?? "").trim() || email;

    if (!companyName || !email || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Preencha nome da empresa, e-mail e uma senha com pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Slug único: parte do nome da empresa, com sufixo se já existir.
    let baseSlug = slugify(body.slug || companyName) || "cliente";
    let slug = baseSlug;
    for (let i = 0; i < 20; i++) {
      const { data: existing } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tenant, error: tenantErr } = await admin
      .from("tenants")
      .insert({ name: companyName, slug, status: "trial", trial_ends_at: trialEndsAt })
      .select("id, slug")
      .single();
    if (tenantErr || !tenant) {
      return new Response(JSON.stringify({ error: tenantErr?.message ?? "Erro ao criar cliente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await admin.from("tenant_branding").insert({ tenant_id: tenant.id });

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, tenant_id: tenant.id },
    });
    if (createErr) {
      await admin.from("tenants").delete().eq("id", tenant.id);
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = created.user!.id;

    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (roleErr) throw roleErr;

    return new Response(JSON.stringify({ success: true, slug: tenant.slug, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
