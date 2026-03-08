
-- Drop the restrictive INSERT policy and replace with one that works
DROP POLICY IF EXISTS "Anyone authenticated can register tenant" ON public.tenants;

-- Allow any authenticated user to insert a tenant
CREATE POLICY "Anyone authenticated can register tenant"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to read tenants they just inserted (by matching slug query)
-- This is already covered by "Users can view own tenant" once profile is updated
-- But we need the insert+select to work, so we use RETURNING workaround in code
