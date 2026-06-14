
-- 1) app_settings: chave/valor JSON com metadata e RLS admin-only para escrita
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  value_type text NOT NULL DEFAULT 'number',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete settings"
  ON public.app_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) Seed default settings (Nível A)
INSERT INTO public.app_settings (key, value, category, label, description, value_type) VALUES
  ('sla.kanban.green_max_days',   '7'::jsonb,   'sla',        'SLA Verde — até X dias',                   'Cards com até X dias desde a última atualização ficam verdes.', 'number'),
  ('sla.kanban.yellow_max_days',  '15'::jsonb,  'sla',        'SLA Amarelo — até X dias',                 'Cards entre verde+1 e X dias ficam amarelos.', 'number'),
  ('sla.kanban.orange_max_days',  '30'::jsonb,  'sla',        'SLA Laranja — até X dias',                 'Cards entre amarelo+1 e X dias ficam laranjas. Acima disso, vermelhos.', 'number'),
  ('alerts.dzero_window_days',    '7'::jsonb,   'alerts',     'Aviso D-zero — janela em dias',            'Projetos com D-zero dentro de X dias entram em alerta.', 'number'),
  ('alerts.stuck_days',           '30'::jsonb,  'alerts',     'Parado há mais de X dias',                 'Projetos sem atualização há mais de X dias entram em alerta.', 'number'),
  ('alerts.polling_seconds',      '60'::jsonb,  'alerts',     'Intervalo de atualização (segundos)',      'De quanto em quanto tempo a central de alertas recarrega.', 'number'),
  ('storage.preview_url_ttl_seconds',  '60'::jsonb,  'storage', 'Expiração da URL de visualização (s)',  'Tempo de validade do link assinado para visualizar anexos.', 'number'),
  ('storage.download_url_ttl_seconds', '300'::jsonb, 'storage', 'Expiração da URL de download (s)',      'Tempo de validade do link assinado para baixar anexos.', 'number'),
  ('validation.company_name_max',  '200'::jsonb,  'validation', 'Tamanho máx. — Nome da empresa',         NULL, 'number'),
  ('validation.city_max',          '100'::jsonb,  'validation', 'Tamanho máx. — Cidade',                  NULL, 'number'),
  ('validation.pilot_info_max',    '2000'::jsonb, 'validation', 'Tamanho máx. — Info do piloto',          NULL, 'number'),
  ('validation.kanban_note_max',   '500'::jsonb,  'validation', 'Tamanho máx. — Observação no card',      NULL, 'number'),
  ('attachment.categories', '[
    {"value":"contrato","label":"Contrato"},
    {"value":"proposta","label":"Proposta Comercial"},
    {"value":"ata","label":"Ata de Reunião"},
    {"value":"outros","label":"Demais Documentos"}
  ]'::jsonb, 'catalog', 'Categorias de anexo', 'Tipos disponíveis ao cadastrar um anexo.', 'json'),
  ('team.roles', '[
    {"value":"executivo_vendas","label":"Executivo de Vendas"},
    {"value":"gerente_projetos","label":"Gerente de Projetos"}
  ]'::jsonb, 'catalog', 'Funções da equipe', 'Papéis disponíveis ao cadastrar membros de equipe.', 'json');
