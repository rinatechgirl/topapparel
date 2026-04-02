
-- Add pending_price_confirmation to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_price_confirmation' BEFORE 'pending';

-- Add whatsapp_phone column to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS whatsapp_phone text;
