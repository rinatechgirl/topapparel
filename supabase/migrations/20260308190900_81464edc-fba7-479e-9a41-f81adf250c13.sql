
-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Tenant admins can manage invitations
CREATE POLICY "Tenant admins can manage invitations"
ON public.invitations FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can view invitations for their email (to accept)
CREATE POLICY "Users can view own invitations"
ON public.invitations FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Platform admins can manage all
CREATE POLICY "Platform admins can manage all invitations"
ON public.invitations FOR ALL
TO authenticated
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Function to accept invitation on signup/login
CREATE OR REPLACE FUNCTION public.accept_pending_invitation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invitation RECORD;
  _user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  
  -- Find pending invitation
  SELECT * INTO _invitation FROM public.invitations
  WHERE email = _user_email AND status = 'pending'
  LIMIT 1;
  
  IF _invitation IS NOT NULL THEN
    -- Update profile with tenant_id
    UPDATE public.profiles SET tenant_id = _invitation.tenant_id WHERE user_id = auth.uid();
    
    -- Create or update user role
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (auth.uid(), _invitation.tenant_id, _invitation.role)
    ON CONFLICT (user_id, role) DO UPDATE SET tenant_id = _invitation.tenant_id;
    
    -- Mark invitation as accepted
    UPDATE public.invitations SET status = 'accepted' WHERE id = _invitation.id;
  END IF;
END;
$$;
