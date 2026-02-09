CREATE SCHEMA IF NOT EXISTS extensions;

GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

ALTER EXTENSION btree_gist SET SCHEMA extensions;

ALTER FUNCTION public.is_admin() SET search_path = public;

ALTER FUNCTION public.handle_updated_at() SET search_path = public;

ALTER FUNCTION public.handle_new_user() SET search_path = public;

ALTER FUNCTION public.handle_new_community() SET search_path = public;

ALTER FUNCTION public.get_nearby_communities(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) 
SET search_path = public, extensions;

ALTER FUNCTION public.handle_community_messages_updated_at() SET search_path = public;

ALTER FUNCTION public.handle_dm_messages_updated_at() SET search_path = public;

ALTER FUNCTION public.handle_dm_conversations_updated_at() SET search_path = public;

ALTER FUNCTION public.update_dm_conversation_updated_at() SET search_path = public;

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

ALTER FUNCTION public.is_community_admin(uuid, uuid) SET search_path = public;


DROP POLICY IF EXISTS "Anyone can submit partner application" ON public.partner_applications;

CREATE POLICY "Anyone can submit partner application" ON public.partner_applications
FOR INSERT WITH CHECK (
  auth.role() = 'anon' OR auth.role() = 'authenticated'
);