-- 1) Tabelas de países e cidades
CREATE TABLE public.countries (
  code char(2) PRIMARY KEY,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_select_auth" ON public.countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "countries_admin_all" ON public.countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.country_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code char(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, name)
);
GRANT SELECT ON public.country_cities TO authenticated;
GRANT ALL ON public.country_cities TO service_role;
ALTER TABLE public.country_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "country_cities_select_auth" ON public.country_cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "country_cities_admin_all" ON public.country_cities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE INDEX idx_country_cities_country ON public.country_cities(country_code);

-- 2) Coluna de país nos projetos
ALTER TABLE public.projects ADD COLUMN country_code char(2) NOT NULL DEFAULT 'BR';
ALTER TABLE public.projects ALTER COLUMN state DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.projects_validate_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.country_code IS NULL OR length(trim(NEW.country_code)) <> 2 THEN
    RAISE EXCEPTION 'País inválido';
  END IF;
  NEW.country_code := upper(NEW.country_code);
  IF NEW.country_code = 'BR' AND NEW.state IS NULL THEN
    RAISE EXCEPTION 'Estado (UF) é obrigatório para projetos no Brasil';
  END IF;
  IF NEW.country_code <> 'BR' THEN
    NEW.state := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_validate_location
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_validate_location();

-- 3) Geração de código com país
DROP FUNCTION IF EXISTS public.generate_project_code(text, text, uuid, text, text);
DROP FUNCTION IF EXISTS public.preview_project_code(text, text, uuid, text, text);

CREATE FUNCTION public.generate_project_code(p_city text, p_state text, p_project_type_id uuid, p_segment text, p_company_name text, p_country text DEFAULT 'BR')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_type text; v_seq bigint; v_region text;
BEGIN
  SELECT short_code INTO v_type FROM project_types WHERE id = p_project_type_id;
  IF v_type IS NULL THEN RAISE EXCEPTION 'Tipo de projeto inválido'; END IF;
  v_region := CASE WHEN upper(coalesce(p_country,'BR')) = 'BR' THEN upper(coalesce(p_state,'')) ELSE upper(coalesce(p_country,'')) END;
  v_seq := nextval('public.projects_code_seq_v2');
  RETURN substr(public.code_token(p_city),1,3)
      || v_region
      || upper(v_type)
      || public.segment_code(p_segment)
      || lpad(v_seq::text, 4, '0')
      || '-' || public.code_token(p_company_name);
END;
$$;

CREATE FUNCTION public.preview_project_code(p_city text, p_state text, p_project_type_id uuid, p_segment text, p_company_name text, p_country text DEFAULT 'BR')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_type text; v_region text;
BEGIN
  SELECT short_code INTO v_type FROM project_types WHERE id = p_project_type_id;
  IF v_type IS NULL THEN RETURN NULL; END IF;
  v_region := CASE WHEN upper(coalesce(p_country,'BR')) = 'BR' THEN upper(coalesce(p_state,'')) ELSE upper(coalesce(p_country,'')) END;
  RETURN substr(public.code_token(p_city),1,3)
      || v_region
      || upper(v_type)
      || public.segment_code(p_segment)
      || '····'
      || '-' || public.code_token(p_company_name);
END;
$$;

REVOKE ALL ON FUNCTION public.generate_project_code(text, text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_project_code(text, text, uuid, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.projects_set_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    IF NEW.project_type_id IS NULL THEN
      RAISE EXCEPTION 'project_type_id é obrigatório para gerar o código do projeto';
    END IF;
    NEW.project_code := public.generate_project_code(
      NEW.city, NEW.state::text, NEW.project_type_id, NEW.project_segment, NEW.company_name, NEW.country_code
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Carga inicial de países
INSERT INTO public.countries(code, name) VALUES
('BR','Brasil'),('AR','Argentina'),('UY','Uruguai'),('PY','Paraguai'),('CL','Chile'),('BO','Bolívia'),
('PE','Peru'),('CO','Colômbia'),('EC','Equador'),('VE','Venezuela'),('GY','Guiana'),('SR','Suriname'),
('MX','México'),('US','Estados Unidos'),('CA','Canadá'),('PA','Panamá'),('CR','Costa Rica'),
('GT','Guatemala'),('HN','Honduras'),('SV','El Salvador'),('NI','Nicarágua'),('DO','República Dominicana'),
('CU','Cuba'),('JM','Jamaica'),('PR','Porto Rico'),
('PT','Portugal'),('ES','Espanha'),('FR','França'),('IT','Itália'),('DE','Alemanha'),('GB','Reino Unido'),
('IE','Irlanda'),('NL','Países Baixos'),('BE','Bélgica'),('CH','Suíça'),('AT','Áustria'),('SE','Suécia'),
('NO','Noruega'),('DK','Dinamarca'),('FI','Finlândia'),('PL','Polônia'),('CZ','Tchéquia'),('RO','Romênia'),
('GR','Grécia'),('TR','Turquia'),('RU','Rússia'),('UA','Ucrânia'),
('AO','Angola'),('MZ','Moçambique'),('CV','Cabo Verde'),('GW','Guiné-Bissau'),('ST','São Tomé e Príncipe'),
('ZA','África do Sul'),('NG','Nigéria'),('GH','Gana'),('KE','Quênia'),('MA','Marrocos'),('EG','Egito'),
('AE','Emirados Árabes Unidos'),('SA','Arábia Saudita'),('IL','Israel'),('QA','Catar'),
('IN','Índia'),('CN','China'),('JP','Japão'),('KR','Coreia do Sul'),('SG','Singapura'),('MY','Malásia'),
('TH','Tailândia'),('ID','Indonésia'),('PH','Filipinas'),('VN','Vietnã'),
('AU','Austrália'),('NZ','Nova Zelândia'),('TL','Timor-Leste');

-- 5) Carga inicial de cidades principais
INSERT INTO public.country_cities(country_code, name) VALUES
('AR','Buenos Aires'),('AR','Córdoba'),('AR','Rosario'),('AR','Mendoza'),('AR','La Plata'),('AR','Mar del Plata'),('AR','Salta'),('AR','Santa Fe'),('AR','San Miguel de Tucumán'),('AR','Neuquén'),('AR','Bahía Blanca'),('AR','Posadas'),
('UY','Montevidéu'),('UY','Salto'),('UY','Paysandú'),('UY','Maldonado'),('UY','Rivera'),('UY','Ciudad de la Costa'),('UY','Las Piedras'),('UY','Colonia del Sacramento'),
('PY','Assunção'),('PY','Ciudad del Este'),('PY','San Lorenzo'),('PY','Luque'),('PY','Encarnación'),('PY','Pedro Juan Caballero'),('PY','Fernando de la Mora'),
('CL','Santiago'),('CL','Valparaíso'),('CL','Viña del Mar'),('CL','Concepción'),('CL','Antofagasta'),('CL','La Serena'),('CL','Temuco'),('CL','Rancagua'),('CL','Iquique'),('CL','Puerto Montt'),('CL','Arica'),
('BO','La Paz'),('BO','Santa Cruz de la Sierra'),('BO','Cochabamba'),('BO','Sucre'),('BO','El Alto'),('BO','Oruro'),('BO','Tarija'),('BO','Potosí'),
('PE','Lima'),('PE','Arequipa'),('PE','Trujillo'),('PE','Chiclayo'),('PE','Cusco'),('PE','Piura'),('PE','Iquitos'),('PE','Huancayo'),('PE','Tacna'),
('CO','Bogotá'),('CO','Medellín'),('CO','Cali'),('CO','Barranquilla'),('CO','Cartagena'),('CO','Cúcuta'),('CO','Bucaramanga'),('CO','Pereira'),('CO','Santa Marta'),('CO','Manizales'),('CO','Ibagué'),
('EC','Quito'),('EC','Guayaquil'),('EC','Cuenca'),('EC','Santo Domingo'),('EC','Machala'),('EC','Manta'),('EC','Ambato'),('EC','Loja'),
('VE','Caracas'),('VE','Maracaibo'),('VE','Valencia'),('VE','Barquisimeto'),('VE','Maracay'),('VE','Ciudad Guayana'),('VE','Maturín'),
('GY','Georgetown'),('SR','Paramaribo'),
('MX','Cidade do México'),('MX','Guadalajara'),('MX','Monterrey'),('MX','Puebla'),('MX','Tijuana'),('MX','León'),('MX','Querétaro'),('MX','Mérida'),('MX','Cancún'),('MX','Toluca'),('MX','Chihuahua'),('MX','San Luis Potosí'),
('US','Nova York'),('US','Los Angeles'),('US','Chicago'),('US','Houston'),('US','Phoenix'),('US','Filadélfia'),('US','San Antonio'),('US','San Diego'),('US','Dallas'),('US','Austin'),('US','Miami'),('US','Orlando'),('US','Atlanta'),('US','Boston'),('US','Seattle'),('US','Denver'),('US','Washington'),('US','Las Vegas'),('US','San Francisco'),
('CA','Toronto'),('CA','Montreal'),('CA','Vancouver'),('CA','Calgary'),('CA','Ottawa'),('CA','Edmonton'),('CA','Quebec'),('CA','Winnipeg'),
('PA','Cidade do Panamá'),('PA','Colón'),('PA','David'),('PA','Santiago de Veraguas'),
('CR','San José'),('CR','Alajuela'),('CR','Cartago'),('CR','Heredia'),('CR','Liberia'),('CR','Puntarenas'),
('GT','Cidade da Guatemala'),('GT','Quetzaltenango'),('GT','Escuintla'),('GT','Mixco'),
('HN','Tegucigalpa'),('HN','San Pedro Sula'),('HN','La Ceiba'),('HN','Choloma'),
('SV','San Salvador'),('SV','Santa Ana'),('SV','San Miguel'),('SV','Soyapango'),
('NI','Manágua'),('NI','León'),('NI','Masaya'),('NI','Chinandega'),
('DO','Santo Domingo'),('DO','Santiago de los Caballeros'),('DO','La Romana'),('DO','Punta Cana'),('DO','San Pedro de Macorís'),
('CU','Havana'),('CU','Santiago de Cuba'),('CU','Camagüey'),('CU','Holguín'),
('JM','Kingston'),('JM','Montego Bay'),
('PR','San Juan'),('PR','Bayamón'),('PR','Ponce'),
('PT','Lisboa'),('PT','Porto'),('PT','Braga'),('PT','Coimbra'),('PT','Faro'),('PT','Aveiro'),('PT','Setúbal'),('PT','Funchal'),('PT','Guimarães'),('PT','Évora'),
('ES','Madri'),('ES','Barcelona'),('ES','Valência'),('ES','Sevilha'),('ES','Zaragoza'),('ES','Málaga'),('ES','Bilbao'),('ES','Múrcia'),('ES','Palma de Maiorca'),('ES','Vigo'),
('FR','Paris'),('FR','Marselha'),('FR','Lyon'),('FR','Toulouse'),('FR','Nice'),('FR','Nantes'),('FR','Bordeaux'),('FR','Lille'),
('IT','Roma'),('IT','Milão'),('IT','Nápoles'),('IT','Turim'),('IT','Florença'),('IT','Bolonha'),('IT','Veneza'),('IT','Palermo'),
('DE','Berlim'),('DE','Munique'),('DE','Hamburgo'),('DE','Frankfurt'),('DE','Colônia'),('DE','Stuttgart'),('DE','Düsseldorf'),
('GB','Londres'),('GB','Manchester'),('GB','Birmingham'),('GB','Liverpool'),('GB','Glasgow'),('GB','Edimburgo'),('GB','Bristol'),
('IE','Dublin'),('IE','Cork'),('IE','Galway'),
('NL','Amsterdã'),('NL','Roterdã'),('NL','Haia'),('NL','Utrecht'),('NL','Eindhoven'),
('BE','Bruxelas'),('BE','Antuérpia'),('BE','Gante'),('BE','Liège'),
('CH','Zurique'),('CH','Genebra'),('CH','Berna'),('CH','Basileia'),('CH','Lausanne'),
('AT','Viena'),('AT','Graz'),('AT','Salzburgo'),('AT','Linz'),
('SE','Estocolmo'),('SE','Gotemburgo'),('SE','Malmö'),
('NO','Oslo'),('NO','Bergen'),('NO','Trondheim'),
('DK','Copenhague'),('DK','Aarhus'),('DK','Odense'),
('FI','Helsinque'),('FI','Espoo'),('FI','Tampere'),
('PL','Varsóvia'),('PL','Cracóvia'),('PL','Łódź'),('PL','Wrocław'),('PL','Poznań'),('PL','Gdansk'),
('CZ','Praga'),('CZ','Brno'),('CZ','Ostrava'),
('RO','Bucareste'),('RO','Cluj-Napoca'),('RO','Timisoara'),('RO','Iasi'),
('GR','Atenas'),('GR','Tessalônica'),('GR','Patras'),
('TR','Istambul'),('TR','Ancara'),('TR','Izmir'),('TR','Bursa'),('TR','Antália'),
('RU','Moscou'),('RU','São Petersburgo'),('RU','Novosibirsk'),('RU','Ecaterimburgo'),
('UA','Kiev'),('UA','Kharkiv'),('UA','Odessa'),('UA','Lviv'),
('AO','Luanda'),('AO','Huambo'),('AO','Lobito'),('AO','Benguela'),('AO','Lubango'),('AO','Cabinda'),('AO','Malanje'),('AO','Namibe'),
('MZ','Maputo'),('MZ','Matola'),('MZ','Beira'),('MZ','Nampula'),('MZ','Quelimane'),('MZ','Tete'),('MZ','Pemba'),('MZ','Xai-Xai'),
('CV','Praia'),('CV','Mindelo'),('CV','Santa Maria'),
('GW','Bissau'),('GW','Bafatá'),
('ST','São Tomé'),
('ZA','Joanesburgo'),('ZA','Cidade do Cabo'),('ZA','Durban'),('ZA','Pretória'),('ZA','Port Elizabeth'),
('NG','Lagos'),('NG','Abuja'),('NG','Kano'),('NG','Ibadan'),
('GH','Acra'),('GH','Kumasi'),('GH','Tamale'),
('KE','Nairóbi'),('KE','Mombaça'),('KE','Kisumu'),
('MA','Casablanca'),('MA','Rabat'),('MA','Marrakech'),('MA','Tânger'),
('EG','Cairo'),('EG','Alexandria'),('EG','Gizé'),
('AE','Dubai'),('AE','Abu Dhabi'),('AE','Sharjah'),
('SA','Riade'),('SA','Jeddah'),('SA','Meca'),('SA','Damã'),
('IL','Tel Aviv'),('IL','Jerusalém'),('IL','Haifa'),
('QA','Doha'),
('IN','Nova Délhi'),('IN','Mumbai'),('IN','Bangalore'),('IN','Hyderabad'),('IN','Chennai'),('IN','Calcutá'),('IN','Pune'),
('CN','Pequim'),('CN','Xangai'),('CN','Cantão'),('CN','Shenzhen'),('CN','Chengdu'),('CN','Hong Kong'),
('JP','Tóquio'),('JP','Osaka'),('JP','Yokohama'),('JP','Nagoia'),('JP','Quioto'),('JP','Fukuoka'),
('KR','Seul'),('KR','Busan'),('KR','Incheon'),
('SG','Singapura'),
('MY','Kuala Lumpur'),('MY','Penang'),('MY','Johor Bahru'),
('TH','Bangkok'),('TH','Chiang Mai'),('TH','Phuket'),
('ID','Jacarta'),('ID','Surabaia'),('ID','Bandung'),('ID','Medan'),
('PH','Manila'),('PH','Cebu'),('PH','Davao'),
('VN','Hanói'),('VN','Ho Chi Minh'),('VN','Da Nang'),
('AU','Sydney'),('AU','Melbourne'),('AU','Brisbane'),('AU','Perth'),('AU','Adelaide'),('AU','Canberra'),
('NZ','Auckland'),('NZ','Wellington'),('NZ','Christchurch'),
('TL','Díli');