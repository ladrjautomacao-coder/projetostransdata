import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { checkPerm, PermissionsShape, PermModule, PermAction, PermSection } from "@/lib/permissions";

export function usePermissions() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [perms, setPerms] = useState<PermissionsShape | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setPerms(null); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc("get_effective_permissions", { _user_id: user.id });
    if (!error) setPerms((data as PermissionsShape) || {});
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const can = useCallback(
    (module: PermModule, action: PermAction, section?: PermSection) =>
      checkPerm(perms, module, action, section, isAdmin),
    [perms, isAdmin]
  );

  const scope: "all" | "own" = perms?.scope === "own" ? "own" : "all";

  return { can, perms, scope, loading, reload: load };
}
