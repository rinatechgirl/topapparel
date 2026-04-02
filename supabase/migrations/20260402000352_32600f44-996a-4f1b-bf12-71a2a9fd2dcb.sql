
-- Update the notification trigger to handle the new status and also notify on INSERT
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer_user_id UUID;
  _design_title TEXT;
  _msg TEXT;
BEGIN
  -- Get design title for richer messages
  SELECT title INTO _design_title FROM public.designs WHERE id = NEW.design_id;

  -- On INSERT: notify the designer/tenant about the new order
  IF TG_OP = 'INSERT' THEN
    -- Notify the customer
    INSERT INTO public.notifications (tenant_id, user_id, order_id, message)
    VALUES (NEW.tenant_id, NEW.created_by, NEW.id,
      'Your order for "' || COALESCE(_design_title, 'a design') || '" has been submitted. The designer will review it soon.');

    RETURN NEW;
  END IF;

  -- On UPDATE: only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := now();

  -- Build message
  CASE NEW.status
    WHEN 'pending' THEN _msg := 'Your order for "' || COALESCE(_design_title, 'a design') || '" has been confirmed. Work will begin soon.';
    WHEN 'in_progress' THEN _msg := 'Your order for "' || COALESCE(_design_title, 'a design') || '" is now being worked on';
    WHEN 'ready' THEN _msg := 'Your dress "' || COALESCE(_design_title, '') || '" is ready for pickup/delivery!';
    WHEN 'delivered' THEN _msg := 'Your dress "' || COALESCE(_design_title, '') || '" has been delivered. Thank you!';
    ELSE _msg := 'Your order status has been updated';
  END CASE;

  -- Notify the customer who created the order
  _customer_user_id := NEW.created_by;

  INSERT INTO public.notifications (tenant_id, user_id, order_id, message)
  VALUES (NEW.tenant_id, _customer_user_id, NEW.id, _msg);

  RETURN NEW;
END;
$function$;

-- Drop old trigger and recreate to fire on both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();

-- Allow customers to view their own orders (created_by = auth.uid())
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Allow customers to insert orders for themselves
CREATE POLICY "Customers can place orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow customers to insert their own measurements
CREATE POLICY "Customers can insert own measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow customers to view their own measurements
CREATE POLICY "Customers can view own measurements"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Allow customers to insert their own customer record
CREATE POLICY "Customers can create own record"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow customers to view their own customer record
CREATE POLICY "Customers can view own record"
  ON public.customers FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
