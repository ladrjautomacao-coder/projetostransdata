ALTER TABLE public.projects ADD COLUMN complementary_sale boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN complementary_fleet integer NOT NULL DEFAULT 0;