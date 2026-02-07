ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS address TEXT;

CREATE INDEX IF NOT EXISTS communities_location_idx ON public.communities (latitude, longitude);

CREATE OR REPLACE FUNCTION public.get_nearby_communities(
  user_lat DOUBLE PRECISION,
  user_long DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 8.0,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  sport TEXT,
  logo_url TEXT,
  cover_url TEXT,
  member_count BIGINT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.description,
    c.sport,
    c.logo_url,
    c.cover_url,
    (SELECT COUNT(*) FROM public.community_members cm WHERE cm.community_id = c.id) AS member_count,
    c.city,
    c.latitude,
    c.longitude,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(c.latitude)) *
        cos(radians(c.longitude) - radians(user_long)) +
        sin(radians(user_lat)) * sin(radians(c.latitude))
      )
    ) AS distance_km
  FROM
    public.communities c
  WHERE
    c.latitude IS NOT NULL 
    AND c.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(c.latitude)) *
        cos(radians(c.longitude) - radians(user_long)) +
        sin(radians(user_lat)) * sin(radians(c.latitude))
      )
    ) <= radius_km
  ORDER BY
    distance_km ASC
  LIMIT limit_count;
END;
$$;