
-- Insert admin role for handfabiano@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('09f68906-b353-4289-bde5-baffe6328cd2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert profile linked to JER Goiás organization
INSERT INTO public.profiles (user_id, org_id, full_name)
VALUES ('09f68906-b353-4289-bde5-baffe6328cd2', 'a0000000-0000-0000-0000-000000000001', 'Fabiano')
ON CONFLICT DO NOTHING;
