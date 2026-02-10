INSERT INTO storage.buckets (id, name, public)
VALUES ('community_chat_attachments', 'community_chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community members can view chat attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'community_chat_attachments'
    AND EXISTS (
        SELECT 1
        FROM public.community_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.community_id::text = split_part(name, '/', 1)
    )
);

CREATE POLICY "Community members can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'community_chat_attachments'
    AND auth.uid() = owner
    AND EXISTS (
        SELECT 1
        FROM public.community_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.community_id::text = split_part(name, '/', 1)
    )
);

CREATE POLICY "Community members can update chat attachments"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'community_chat_attachments'
    AND auth.uid() = owner
    AND EXISTS (
        SELECT 1
        FROM public.community_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.community_id::text = split_part(name, '/', 1)
    )
)
WITH CHECK (
    bucket_id = 'community_chat_attachments'
    AND auth.uid() = owner
    AND EXISTS (
        SELECT 1
        FROM public.community_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.community_id::text = split_part(name, '/', 1)
    )
);

CREATE POLICY "Community members can delete chat attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'community_chat_attachments'
    AND auth.uid() = owner
    AND EXISTS (
        SELECT 1
        FROM public.community_members cm
        WHERE cm.user_id = auth.uid()
        AND cm.community_id::text = split_part(name, '/', 1)
    )
);
