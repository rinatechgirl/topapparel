
-- Allow users to insert their own role (needed during tenant registration)
CREATE POLICY "Users can insert own role during registration"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
