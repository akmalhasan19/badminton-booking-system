CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_old_chat_messages(p_retention_days INTEGER DEFAULT 90)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.community_messages
    WHERE created_at < NOW() - make_interval(days => p_retention_days);

    DELETE FROM public.dm_messages
    WHERE created_at < NOW() - make_interval(days => p_retention_days);
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_old_chat_messages_daily') THEN
        PERFORM cron.schedule(
            'purge_old_chat_messages_daily',
            '0 3 * * *',
            $job$SELECT public.purge_old_chat_messages(90);$job$
        );
    END IF;
END $$;
