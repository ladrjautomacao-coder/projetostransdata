// Temporary function: full data export for migrating off Lovable Cloud to an
// independently-owned Supabase project. Super-admin only, read-only.
// Safe to delete once the migration is complete.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TABLES = [
  "app_settings",
  "city_codes",
  "countries",
  "country_cities",
  "equipment_types",
  "integrations",
  "products",
  "profiles",
  "project_attachments",
  "project_equipments",
  "project_history",
  "project_integrations",
  "project_notes",
  "project_products",
  "project_solution_features",
  "project_solutions",
  "project_types",
  "projects",
  "report_imp_files",
  "role_presets",
  "solution_features",
  "solutions",
  "team_members",
  "user_permission_overrides",
  "user_roles",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isSuperAdmin = (callerRoles ?? []).some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: requires super_admin role" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: Record<string, unknown> = {};

    for (const table of TABLES) {
      const { data, error } = await adminClient.from(table).select("*");
      result[table] = error ? { error: error.message } : data;
    }

    const { data: usersPage, error: usersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    result["auth_users"] = usersError
      ? { error: usersError.message }
      : usersPage.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at,
          user_metadata: u.user_metadata,
        }));

    const storageBuckets = ["report-imp", "database_export_26_08_26", "project-attachments", "manuals"];
    const storage: Record<string, unknown> = {};
    for (const bucket of storageBuckets) {
      const { data, error } = await adminClient.storage.from(bucket).list(undefined, {
        limit: 1000,
        sortBy: { column: "name", order: "asc" },
      });
      storage[bucket] = error ? { error: error.message } : data;
    }
    result["storage_listing"] = storage;

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("migration-export error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
