DROP TRIGGER IF EXISTS trg_projects_set_code ON public.projects;
CREATE TRIGGER trg_projects_set_code
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_set_code();