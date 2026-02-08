ALTER TABLE public.activity_images 
ADD COLUMN IF NOT EXISTS slot TEXT CHECK (slot IN ('main', 'sparring', 'fun'));

CREATE UNIQUE INDEX IF NOT EXISTS one_active_image_per_slot 
ON public.activity_images (slot) 
WHERE (is_active = true);