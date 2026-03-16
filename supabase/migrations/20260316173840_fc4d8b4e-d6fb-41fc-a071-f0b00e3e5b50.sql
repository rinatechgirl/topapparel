
-- 1. Create missing profile for damstech00@gmail.com
INSERT INTO public.profiles (user_id, full_name, email, tenant_id)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', ''), u.email,
  (SELECT ur.tenant_id FROM public.user_roles ur WHERE ur.user_id = u.id LIMIT 1)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- 2. Update all profiles that have null tenant_id but have a user_role with tenant_id
UPDATE public.profiles p
SET tenant_id = ur.tenant_id
FROM public.user_roles ur
WHERE p.user_id = ur.user_id
  AND p.tenant_id IS NULL
  AND ur.tenant_id IS NOT NULL;

-- 3. Fix get_user_tenant_id to fallback to user_roles when profile tenant_id is null
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() AND tenant_id IS NOT NULL LIMIT 1)
  )
$function$;

-- 4. Create a proper handle_new_user function that also handles existing users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 5. Drop the failed trigger if it exists and recreate on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
