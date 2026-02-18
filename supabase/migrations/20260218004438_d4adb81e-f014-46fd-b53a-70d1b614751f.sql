
-- Table for school manager pre-registrations (public, no auth required to insert)
CREATE TABLE public.gestor_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  delegation_id uuid NOT NULL REFERENCES public.delegations(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.gestor_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form) 
CREATE POLICY "Public can register"
ON public.gestor_registrations
FOR INSERT
WITH CHECK (true);

-- Admins can read and manage all registrations
CREATE POLICY "Admins manage registrations"
ON public.gestor_registrations
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Unique constraint: one pending registration per email per org
CREATE UNIQUE INDEX idx_gestor_reg_email_org 
ON public.gestor_registrations(email, org_id) 
WHERE status = 'pendente';
