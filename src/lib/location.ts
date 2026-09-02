import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Country {
  code: string;
  name: string;
}

export interface CountryCity {
  id: string;
  country_code: string;
  name: string;
}

/** Exibe "Cidade/UF" para o Brasil e "Cidade — PAÍS" para projetos internacionais. */
export function formatLocation(
  city: string | null | undefined,
  state: string | null | undefined,
  countryCode?: string | null,
): string {
  const c = city || "";
  const country = (countryCode || "BR").toUpperCase();
  if (country === "BR") return state ? `${c}/${state}` : c;
  return `${c} — ${country}`;
}

/** Carrega a lista de países ativos (ordenada com Brasil primeiro). */
export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    let active = true;
    (supabase as any)
      .from("countries")
      .select("code, name")
      .eq("active", true)
      .order("name")
      .then(({ data }: { data: Country[] | null }) => {
        if (!active) return;
        const list = data || [];
        setCountries([
          ...list.filter(c => c.code === "BR"),
          ...list.filter(c => c.code !== "BR"),
        ]);
      });
    return () => { active = false; };
  }, []);
  return countries;
}

/** Carrega as cidades cadastradas para um país (vazio quando país é Brasil ou não informado). */
export function useCountryCities(countryCode: string | null | undefined) {
  const [cities, setCities] = useState<CountryCity[]>([]);
  useEffect(() => {
    if (!countryCode || countryCode === "BR") { setCities([]); return; }
    let active = true;
    (supabase as any)
      .from("country_cities")
      .select("id, country_code, name")
      .eq("country_code", countryCode)
      .eq("active", true)
      .order("name")
      .then(({ data }: { data: CountryCity[] | null }) => {
        if (active) setCities(data || []);
      });
    return () => { active = false; };
  }, [countryCode]);
  return cities;
}
