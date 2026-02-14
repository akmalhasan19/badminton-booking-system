CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_old_webhook_logs(p_retention_days INTEGER DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.webhook_logs
    WHERE created_at < NOW() - make_interval(days => p_retention_days);
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_old_webhook_logs_daily') THEN
        PERFORM cron.schedule(
            'purge_old_webhook_logs_daily',
            '30 3 * * *',
            $job$SELECT public.purge_old_webhook_logs(30);$job$
        );
    END IF;
END $$;
