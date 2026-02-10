-- Migration: 20260210120000_add_notifications_backend.sql
-- Description: Add notifications and notification preferences backend tables

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('booking_confirmed', 'booking_cancelled', 'payment_reminder', 'points_earned', 'system', 'promo')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_created_at_idx
ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx
ON public.notifications (user_id, read);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    account_email BOOLEAN NOT NULL DEFAULT true,
    account_push BOOLEAN NOT NULL DEFAULT false,
    exclusive_email BOOLEAN NOT NULL DEFAULT true,
    exclusive_push BOOLEAN NOT NULL DEFAULT false,
    reminder_email BOOLEAN NOT NULL DEFAULT true,
    reminder_push BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON public.notifications
            FOR SELECT
            USING (auth.uid() = user_id OR public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON public.notifications
            FOR UPDATE
            USING (auth.uid() = user_id OR public.is_admin())
            WITH CHECK (auth.uid() = user_id OR public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert their own notifications') THEN
        CREATE POLICY "Users can insert their own notifications" ON public.notifications
            FOR INSERT
            WITH CHECK (auth.uid() = user_id OR public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service Role can manage notifications') THEN
        CREATE POLICY "Service Role can manage notifications" ON public.notifications
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can view their own notification preferences') THEN
        CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
            FOR SELECT
            USING (auth.uid() = user_id OR public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can insert their own notification preferences') THEN
        CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
            FOR INSERT
            WITH CHECK (auth.uid() = user_id OR public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can update their own notification preferences') THEN
        CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
            FOR UPDATE
            USING (auth.uid() = user_id OR public.is_admin())
            WITH CHECK (auth.uid() = user_id OR public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Service Role can manage notification preferences') THEN
        CREATE POLICY "Service Role can manage notification preferences" ON public.notification_preferences
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_notification_preferences') THEN
        CREATE TRIGGER set_updated_at_notification_preferences BEFORE UPDATE ON public.notification_preferences
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;
