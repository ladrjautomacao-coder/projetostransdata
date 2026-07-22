// One-shot function to create the integration API user with a fixed email
// and the password stored in INTEGRATION_USER_PASSWORD secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL = "elesianophp@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const password = Deno.env.get("INTEGRATION_USER_PASSWORD");
    if (!password) throw new Error("INTEGRATION_USER_PASSWORD not set");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Find existing user
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

    if (existing) {
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: EMAIL,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Integração API" },
      });
      if (error) throw error;
      userId = created.user!.id;
    }

    // Remove default 'user' role and add 'integration' only (least privilege)
    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "integration" });
    if (roleErr) throw roleErr;

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email: EMAIL }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
