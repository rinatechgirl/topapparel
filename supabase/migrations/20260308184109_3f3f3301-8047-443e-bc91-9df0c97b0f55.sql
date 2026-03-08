
-- Create tenant status enum
CREATE TYPE public.tenant_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  business_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  country TEXT,
  logo_url TEXT,
  description TEXT,
  status tenant_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Add tenant_id to all existing tables
ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.measurements ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.designs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add gender column to designs (was missing from schema)
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS gender TEXT;

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND tenant_id IS NULL
  )
$$;

-- TENANTS RLS
CREATE POLICY "Platform admins can manage all tenants" ON public.tenants
  FOR ALL TO authenticated USING (public.is_platform_admin());

CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT TO authenticated USING (id = public.get_user_tenant_id());

CREATE POLICY "Anyone authenticated can register tenant" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (true);

-- Drop and recreate RLS policies for CUSTOMERS with tenant isolation
DROP POLICY IF EXISTS "Authenticated can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

CREATE POLICY "Tenant users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant users can insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant users can update customers" ON public.customers
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant admins can delete customers" ON public.customers
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'));

-- Drop and recreate RLS policies for MEASUREMENTS with tenant isolation
DROP POLICY IF EXISTS "Authenticated can view measurements" ON public.measurements;
DROP POLICY IF EXISTS "Authenticated can insert measurements" ON public.measurements;
DROP POLICY IF EXISTS "Authenticated can update measurements" ON public.measurements;
DROP POLICY IF EXISTS "Admins can delete measurements" ON public.measurements;

CREATE POLICY "Tenant users can view measurements" ON public.measurements
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant users can insert measurements" ON public.measurements
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant users can update measurements" ON public.measurements
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant admins can delete measurements" ON public.measurements
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'));

-- Drop and recreate RLS policies for DESIGNS with tenant isolation
DROP POLICY IF EXISTS "Authenticated can view designs" ON public.designs;
DROP POLICY IF EXISTS "Admins can insert designs" ON public.designs;
DROP POLICY IF EXISTS "Admins can update designs" ON public.designs;
DROP POLICY IF EXISTS "Admins can delete designs" ON public.designs;

CREATE POLICY "Tenant users can view designs" ON public.designs
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant users can insert designs" ON public.designs
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant users can update designs" ON public.designs
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant admins can delete designs" ON public.designs
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'));

-- Drop and recreate RLS policies for CATEGORIES with tenant isolation
DROP POLICY IF EXISTS "Authenticated can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Tenant users can view categories" ON public.categories
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Tenant admins can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tenant admins can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tenant admins can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin'));

-- Update PROFILES RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Platform admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_platform_admin());

-- Update USER_ROLES RLS
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Tenant admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (
    tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Platform admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_platform_admin());

-- Update handle_new_user to NOT auto-insert profile/role (will be done during tenant onboarding)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create a basic profile without tenant_id
  -- Tenant assignment happens during onboarding
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  RETURN NEW;
END;
$function$;

-- Clear existing data as requested by user
DELETE FROM public.measurements;
DELETE FROM public.designs;
DELETE FROM public.customers;
DELETE FROM public.categories;
