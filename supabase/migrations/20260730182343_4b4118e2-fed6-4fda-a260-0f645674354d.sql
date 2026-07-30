CREATE OR REPLACE FUNCTION public.can_view_project(_project_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_scope text;
  v_mgr uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
     OR public.has_role(auth.uid(),'integration') THEN
    RETURN true;
  END IF;
  IF public.has_permission(auth.uid(),'visao_comercial','view') THEN
    RETURN true;
  END IF;
  IF NOT public.has_permission(auth.uid(),'projects','view') THEN
    RETURN false;
  END IF;
  v_scope := public.get_user_scope(auth.uid());
  IF v_scope <> 'own' THEN RETURN true; END IF;
  v_mgr := public.get_my_manager_id();
  IF v_mgr IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.manager_id = v_mgr);
END;
$function$;