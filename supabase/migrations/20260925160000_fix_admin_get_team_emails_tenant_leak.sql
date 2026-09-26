-- admin_get_team_emails() foi criada antes do multi-tenant (13/06) e ficou de
-- fora da blindagem da Fase 1: por ser SECURITY DEFINER, ela ignora a política
-- RESTRICTIVE "tenant guard" de team_members e só checava "é admin?" — não
-- "admin de qual empresa?". Resultado: um admin de qualquer cliente via a
-- equipe (nomes + e-mails) de todos os outros clientes. Corrigido adicionando
-- o mesmo filtro tenant_guard() usado em todas as outras funções desde então.
CREATE OR REPLACE FUNCTION public.admin_get_team_emails()
RETURNS TABLE(id uuid, full_name text, email text, role text, active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.full_name, t.email, t.role, t.active
  FROM public.team_members t
  WHERE has_role(auth.uid(),'admin'::app_role)
    AND public.tenant_guard(t.tenant_id)
$$;
