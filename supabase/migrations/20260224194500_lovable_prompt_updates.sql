ALTER TABLE public.measurements ADD COLUMN IF NOT EXISTS unit text DEFAULT 'cm';
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS gender text;
