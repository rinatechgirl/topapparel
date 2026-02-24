
-- Add new measurement columns for outfit-type-based dynamic forms
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS outfit_type text,
  ADD COLUMN IF NOT EXISTS measurement_gender text,
  ADD COLUMN IF NOT EXISTS bust numeric,
  ADD COLUMN IF NOT EXISTS dress_length numeric,
  ADD COLUMN IF NOT EXISTS round_sleeve numeric,
  ADD COLUMN IF NOT EXISTS neck_depth numeric,
  ADD COLUMN IF NOT EXISTS back_width numeric,
  ADD COLUMN IF NOT EXISTS thigh numeric,
  ADD COLUMN IF NOT EXISTS knee numeric,
  ADD COLUMN IF NOT EXISTS ankle numeric,
  ADD COLUMN IF NOT EXISTS trouser_length numeric,
  ADD COLUMN IF NOT EXISTS top_length numeric,
  ADD COLUMN IF NOT EXISTS shirt_length numeric,
  ADD COLUMN IF NOT EXISTS neck_size numeric;

-- Add back view image and uploaded_by to designs
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS back_view_image_url text,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid;
