
-- ═══ RLS policies for gestor_escola ═══

-- Participants: gestores manage their delegation's participants
CREATE POLICY "Gestores manage own delegation participants"
ON public.participants
FOR ALL
USING (
  delegation_id = get_user_delegation_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- Inscriptions: gestores manage their delegation's inscriptions
CREATE POLICY "Gestores manage own delegation inscriptions"
ON public.inscriptions
FOR ALL
USING (
  delegation_id = get_user_delegation_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- Delegations: gestores see own delegation
CREATE POLICY "Gestores see own delegation"
ON public.delegations
FOR SELECT
USING (
  id = get_user_delegation_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- Competitions: gestores read competitions in their org
CREATE POLICY "Gestores read competitions"
ON public.competitions
FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- Competition rules: gestores read rules
CREATE POLICY "Gestores read competition rules"
ON public.competition_rules
FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- Modalities: gestores read
CREATE POLICY "Gestores read modalities"
ON public.modalities
FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- Categories: gestores read
CREATE POLICY "Gestores read categories"
ON public.categories
FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'gestor_escola')
);

-- ═══ Enable RLS on tables that are missing it ═══

ALTER TABLE public.administrative_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read administrative_fees" ON public.administrative_fees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage administrative_fees" ON public.administrative_fees FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.age_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read age_categories" ON public.age_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage age_categories" ON public.age_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.competition_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read competition_stages" ON public.competition_stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage competition_stages" ON public.competition_stages FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.delegation_staff_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read delegation_staff_rules" ON public.delegation_staff_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage delegation_staff_rules" ON public.delegation_staff_rules FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.disciplinary_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read disciplinary_rules" ON public.disciplinary_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage disciplinary_rules" ON public.disciplinary_rules FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.modality_athlete_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read modality_athlete_limits" ON public.modality_athlete_limits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage modality_athlete_limits" ON public.modality_athlete_limits FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.registration_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read registration_periods" ON public.registration_periods FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage registration_periods" ON public.registration_periods FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read scoring_rules" ON public.scoring_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage scoring_rules" ON public.scoring_rules FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.stage_team_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read stage_team_quotas" ON public.stage_team_quotas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage stage_team_quotas" ON public.stage_team_quotas FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.uniform_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read uniform_rules" ON public.uniform_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage uniform_rules" ON public.uniform_rules FOR ALL USING (has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
