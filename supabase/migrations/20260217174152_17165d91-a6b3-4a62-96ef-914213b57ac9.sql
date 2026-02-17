-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  competition_id UUID NOT NULL REFERENCES public.competitions(id),
  competition_rule_id UUID REFERENCES public.competition_rules(id),
  delegation_a_id UUID NOT NULL REFERENCES public.delegations(id),
  delegation_b_id UUID NOT NULL REFERENCES public.delegations(id),
  score_a INTEGER,
  score_b INTEGER,
  winner_delegation_id UUID REFERENCES public.delegations(id),
  status TEXT NOT NULL DEFAULT 'agendado',
  match_date DATE,
  match_time TIME,
  location TEXT,
  match_number INTEGER,
  scanned_sheet_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.matches
  FOR SELECT USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins manage matches" ON public.matches
  FOR ALL USING (org_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_matches
  AFTER INSERT OR UPDATE OR DELETE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_log();

-- Storage bucket for scanned sheets
INSERT INTO storage.buckets (id, name, public) VALUES ('match-sheets', 'match-sheets', true);

CREATE POLICY "Auth upload match sheets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'match-sheets');

CREATE POLICY "Auth update match sheets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'match-sheets');

CREATE POLICY "Public read match sheets" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'match-sheets');