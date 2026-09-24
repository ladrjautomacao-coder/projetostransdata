import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoTransdata from "@/assets/logo-transdata.png";

interface TenantBranding {
  portalName: string;
  logoUrl: string;
  primaryColor: string | null;
  sidebarColor: string | null;
  accentColor: string | null;
}

const DEFAULT_BRANDING: TenantBranding = {
  portalName: "GP Transdata",
  logoUrl: logoTransdata,
  primaryColor: null,
  sidebarColor: null,
  accentColor: null,
};

const TenantBrandingContext = createContext<TenantBranding>(DEFAULT_BRANDING);

export const useTenantBranding = () => useContext(TenantBrandingContext);

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    const root = document.documentElement;

    if (!profile?.tenant_id) {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-background");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-ring");
      setBranding(DEFAULT_BRANDING);
      return;
    }

    let cancelled = false;

    supabase
      .from("tenant_branding")
      .select("portal_name, logo_url, primary_color, sidebar_color, accent_color")
      .eq("tenant_id", profile.tenant_id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;

        const next: TenantBranding = {
          portalName: data?.portal_name || DEFAULT_BRANDING.portalName,
          logoUrl: data?.logo_url || DEFAULT_BRANDING.logoUrl,
          primaryColor: data?.primary_color ?? null,
          sidebarColor: data?.sidebar_color ?? null,
          accentColor: data?.accent_color ?? null,
        };
        setBranding(next);

        if (next.primaryColor) {
          root.style.setProperty("--primary", next.primaryColor);
          root.style.setProperty("--ring", next.primaryColor);
        }
        if (next.sidebarColor) {
          root.style.setProperty("--sidebar-background", next.sidebarColor);
        }
        if (next.accentColor) {
          root.style.setProperty("--sidebar-primary", next.accentColor);
          root.style.setProperty("--sidebar-ring", next.accentColor);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.tenant_id]);

  return <TenantBrandingContext.Provider value={branding}>{children}</TenantBrandingContext.Provider>;
}
