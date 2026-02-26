import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is authenticated
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
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

    // Check admin role using service role client
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST USERS (GET or POST with action=list)
    if (action === "list") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;

      // Get profiles and roles
      const { data: profiles } = await adminClient.from("profiles").select("user_id, full_name, cargo, avatar_url");
      const { data: roles } = await adminClient.from("user_roles").select("user_id, role");

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));

      const enriched = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: profileMap.get(u.id)?.full_name || u.user_metadata?.full_name || "—",
        cargo: profileMap.get(u.id)?.cargo || "—",
        role: roleMap.get(u.id) || "user",
        email_confirmed: !!u.email_confirmed_at,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
      }));

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST actions
    if (req.method === "POST" && action !== "list") {
      const body = await req.json();
      const targetUserId = body.user_id;

      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "approve") {
        const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
          email_confirm: true,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "reset_password") {
        // Generate a password reset link
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: body.email,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message: "Link de recuperação gerado" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete") {
        // Don't allow deleting yourself
        if (targetUserId === callerId) {
          return new Response(JSON.stringify({ error: "Não é possível excluir seu próprio usuário" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "toggle_ban") {
        if (targetUserId === callerId) {
          return new Response(JSON.stringify({ error: "Não é possível banir seu próprio usuário" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const banUntil = body.ban
          ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
          : "1970-01-01T00:00:00Z";
        const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
          ban_duration: body.ban ? "876000h" : "none",
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
