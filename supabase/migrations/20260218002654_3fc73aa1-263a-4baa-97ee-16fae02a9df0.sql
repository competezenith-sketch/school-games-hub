
-- Step 1: Add gestor_escola to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_escola';

-- Step 2: Add delegation_id to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS delegation_id uuid REFERENCES public.delegations(id) ON DELETE SET NULL;

-- Step 3: Create helper function
CREATE OR REPLACE FUNCTION public.get_user_delegation_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT delegation_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;
