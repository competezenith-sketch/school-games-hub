
-- Add type and gender to modalities
ALTER TABLE public.modalities
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'coletivo',
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'misto';

-- Add year range to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS year_min integer,
  ADD COLUMN IF NOT EXISTS year_max integer;
