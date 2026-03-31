
-- Create order_status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'ready', 'delivered');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  measurement_id UUID REFERENCES public.measurements(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Orders RLS: tenant users can view orders in their tenant
CREATE POLICY "Tenant users can view orders"
  ON public.orders FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins can delete orders"
  ON public.orders FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can manage all orders"
  ON public.orders FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Notifications RLS: users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tenant users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Platform admins can manage all notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to auto-create notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _customer_user_id UUID;
  _msg TEXT;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := now();

  -- Build message
  CASE NEW.status
    WHEN 'in_progress' THEN _msg := 'Your order is now being worked on';
    WHEN 'ready' THEN _msg := 'Your dress is ready for pickup/delivery';
    WHEN 'delivered' THEN _msg := 'Your dress has been delivered';
    ELSE _msg := 'Your order status has been updated';
  END CASE;

  -- Find the user who created the order (the customer-side user)
  _customer_user_id := NEW.created_by;

  INSERT INTO public.notifications (tenant_id, user_id, order_id, message)
  VALUES (NEW.tenant_id, _customer_user_id, NEW.id, _msg);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_notification
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();
