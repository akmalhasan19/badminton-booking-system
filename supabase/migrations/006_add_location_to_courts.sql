-- Add location columns to courts table
ALTER TABLE public.courts 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS floor_type TEXT DEFAULT 'Vinyl'; -- Default to Vinyl

-- Using DO block to seed data safely
DO $$
DECLARE
    v_court_id UUID;
BEGIN
    -- Check if we have courts, if not insert sample
    IF NOT EXISTS (SELECT 1 FROM public.courts) THEN
        INSERT INTO public.courts (name, description, floor_type, latitude, longitude, address, city)
        VALUES 
        ('GOR Juara (Court 1)', 'Professional grade vinyl court with good lighting.', 'Vinyl Pro', -6.2088, 106.8456, 'Jl. Sudirman No. 1', 'Jakarta'),
        ('GOR Juara (Court 2)', 'Professional grade vinyl court.', 'Vinyl Pro', -6.2088, 106.8456, 'Jl. Sudirman No. 1', 'Jakarta'),
        ('GOR Badminton Tebet', 'Standard parquet flooring.', 'Teak Wood', -6.2260, 106.8584, 'Jl. Tebet Raya', 'Jakarta South'),
        ('GOR Cilandak Sport', 'Durable rubber flooring.', 'Rubber', -6.2922, 106.8041, 'Jl. Cilandak KKO', 'Jakarta South');
    ELSE
        -- Update existing to have some location data if missing
        UPDATE public.courts 
        SET 
            latitude = CASE WHEN latitude IS NULL THEN -6.2088 + (random() * 0.05) ELSE latitude END,
            longitude = CASE WHEN longitude IS NULL THEN 106.8456 + (random() * 0.05) ELSE longitude END,
            floor_type = CASE WHEN floor_type IS NULL THEN 'Vinyl Pro' ELSE floor_type END
        WHERE latitude IS NULL OR floor_type IS NULL;
    END IF;
END $$;
