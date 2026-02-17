
-- Add new status values to inscription_status enum
ALTER TYPE public.inscription_status ADD VALUE IF NOT EXISTS 'rascunho';
ALTER TYPE public.inscription_status ADD VALUE IF NOT EXISTS 'enviado';
