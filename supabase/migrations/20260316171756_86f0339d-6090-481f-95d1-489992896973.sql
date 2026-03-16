
-- 1. Create the missing trigger for handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Add platform admin bypass to all tenant-scoped RLS policies

-- Categories: platform admin SELECT
CREATE POLICY "Platform admins can manage all categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Customers: platform admin ALL
CREATE POLICY "Platform admins can manage all customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Measurements: platform admin ALL
CREATE POLICY "Platform admins can manage all measurements"
  ON public.measurements FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Designs: platform admin ALL
CREATE POLICY "Platform admins can manage all designs"
  ON public.designs FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
