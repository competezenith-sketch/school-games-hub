
-- 1. ENUM for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.participant_role AS ENUM ('atleta', 'tecnico', 'dirigente', 'motorista', 'arbitro');
CREATE TYPE public.inscription_status AS ENUM ('pendente', 'validado', 'rejeitado');
CREATE TYPE public.sex_type AS ENUM ('M', 'F');

-- 2. Organizations (multi-tenant root)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  state TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Security definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 6. Competitions
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- 7. Modalities
CREATE TABLE public.modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;

-- 8. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 9. Competition Rules (ligação competition + modality + category)
CREATE TABLE public.competition_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  modality_id UUID NOT NULL REFERENCES public.modalities(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  rules_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (competition_id, modality_id, category_id)
);
ALTER TABLE public.competition_rules ENABLE ROW LEVEL SECURITY;

-- 10. Delegations
CREATE TABLE public.delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'municipio',
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;

-- 11. Participants (unified)
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  delegation_id UUID REFERENCES public.delegations(id) ON DELETE SET NULL,
  role participant_role NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date DATE,
  photo_url TEXT,
  sex sex_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, cpf)
);
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 12. Inscriptions
CREATE TABLE public.inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  competition_rule_id UUID NOT NULL REFERENCES public.competition_rules(id) ON DELETE CASCADE,
  delegation_id UUID NOT NULL REFERENCES public.delegations(id) ON DELETE CASCADE,
  status inscription_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- 13. Audit Logs (imutável)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_competition_rules_updated_at BEFORE UPDATE ON public.competition_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_delegations_updated_at BEFORE UPDATE ON public.delegations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_inscriptions_updated_at BEFORE UPDATE ON public.inscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Audit log trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  _org_id UUID;
  _action TEXT;
  _old JSONB;
  _new JSONB;
  _record_id UUID;
BEGIN
  _action := TG_OP;

  IF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    _new := NULL;
    _record_id := OLD.id;
    _org_id := OLD.org_id;
  ELSIF TG_OP = 'INSERT' THEN
    _old := NULL;
    _new := to_jsonb(NEW);
    _record_id := NEW.id;
    _org_id := NEW.org_id;
  ELSE
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _record_id := NEW.id;
    _org_id := NEW.org_id;
  END IF;

  INSERT INTO public.audit_logs (org_id, user_id, action, table_name, record_id, old_data, new_data)
  VALUES (_org_id, auth.uid(), _action, TG_TABLE_NAME, _record_id, _old, _new);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_competitions AFTER INSERT OR UPDATE OR DELETE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_participants AFTER INSERT OR UPDATE OR DELETE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_inscriptions AFTER INSERT OR UPDATE OR DELETE ON public.inscriptions FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_competition_rules AFTER INSERT OR UPDATE OR DELETE ON public.competition_rules FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_delegations AFTER INSERT OR UPDATE OR DELETE ON public.delegations FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- 16. RLS Policies (tenant isolation via org_id)

-- Organizations: users see only their org
CREATE POLICY "Users see own org" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage own org" ON public.organizations FOR ALL TO authenticated
  USING (id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE POLICY "Users see own org profiles" ON public.profiles FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User roles: only admins manage, users can read own
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tenant-scoped tables (same pattern)
CREATE POLICY "Tenant isolation" ON public.competitions FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage competitions" ON public.competitions FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant isolation" ON public.modalities FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage modalities" ON public.modalities FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant isolation" ON public.categories FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant isolation" ON public.competition_rules FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage rules" ON public.competition_rules FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant isolation" ON public.delegations FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage delegations" ON public.delegations FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant isolation" ON public.participants FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage participants" ON public.participants FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tenant isolation" ON public.inscriptions FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admins manage inscriptions" ON public.inscriptions FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Audit logs: read-only for admins of the org, no deletes/updates
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
-- Insert allowed only via trigger (SECURITY DEFINER), no direct insert policy needed

-- 17. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, org_id, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'org_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
