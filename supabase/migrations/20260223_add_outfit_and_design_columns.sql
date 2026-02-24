-- Migration: Add fields for Measurement scaling and Design dual-views

-- 1. Measurements Table Updates
ALTER TABLE public.measurements
ADD COLUMN outfit_type TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN measurement_data JSONB;

-- Note: We retain existing columns for backward compatibility but will migrate to using measurement_data

-- 2. Designs Table Updates
ALTER TABLE public.designs
ADD COLUMN front_view_image_url TEXT,
ADD COLUMN back_view_image_url TEXT;

-- For backwards compatibility, copy existing image_url to front_view_image_url if needed
UPDATE public.designs SET front_view_image_url = image_url WHERE image_url IS NOT NULL;
