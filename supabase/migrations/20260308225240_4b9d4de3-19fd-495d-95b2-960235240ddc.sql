
-- Allow authenticated users to SELECT a tenant by slug (needed during registration flow)
CREATE POLICY "Users can view tenant by slug during registration"
ON public.tenants
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
