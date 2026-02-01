-- Add goals column to partner_applications
ALTER TABLE public.partner_applications 
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
