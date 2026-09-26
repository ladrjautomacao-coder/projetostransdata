-- Bug de fundação da Fase 1: profiles/projects/team_members/products/
-- project_types/solutions/solution_features/integrations/equipment_types
-- ganharam DEFAULT de tenant_id fixo pra Transdata (só pra não quebrar o
-- app enquanto o front-end não sabia de tenants ainda). Isso nunca foi
-- corrigido depois: qualquer INSERT feito por um usuário logado de OUTRO
-- tenant caía no DEFAULT (Transdata) e era rejeitado pela RESTRICTIVE
-- "tenant guard" — na prática, nenhum tenant além da Transdata conseguia
-- cadastrar projeto, membro de equipe, produto, tipo de projeto, solução,
-- integração ou tipo de equipamento.
--
-- Corrige na raiz: o tenant_id passa a ser sempre derivado da sessão de
-- quem está inserindo (nunca do que o cliente manda), então nenhuma tela
-- do front precisa ser alterada. service_role (edge functions) continua
-- livre pra definir o tenant_id manualmente, já que auth.uid() é nulo
-- nesse contexto.
CREATE OR REPLACE FUNCTION public.set_tenant_id_from_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.tenant_id := public.get_my_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.project_types
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.solutions
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.solution_features
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
CREATE TRIGGER trg_set_tenant_id BEFORE INSERT ON public.equipment_types
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
