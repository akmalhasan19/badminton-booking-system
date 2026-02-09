CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT community_messages_content_not_empty CHECK (LENGTH(TRIM(content)) > 0 OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS community_messages_community_id_idx ON public.community_messages(community_id);
CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON public.community_messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_messages_user_id_idx ON public.community_messages(user_id);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT unique_user_reaction_per_message UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_user_id_idx ON public.message_reactions(user_id);

-- Create dm_conversations table
CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT users_not_same CHECK (user_a_id != user_b_id),
  CONSTRAINT unique_dm_per_community UNIQUE (community_id, user_a_id, user_b_id),
  CONSTRAINT dm_user_order CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS dm_conversations_community_id_idx ON public.dm_conversations(community_id);
CREATE INDEX IF NOT EXISTS dm_conversations_users_idx ON public.dm_conversations(community_id, user_a_id, user_b_id);
CREATE INDEX IF NOT EXISTS dm_conversations_updated_at_idx ON public.dm_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT dm_messages_content_not_empty CHECK (LENGTH(TRIM(content)) > 0 OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS dm_messages_conversation_id_idx ON public.dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS dm_messages_created_at_idx ON public.dm_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_messages_sender_id_idx ON public.dm_messages(sender_id);

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  
  CONSTRAINT unique_user_presence_per_community UNIQUE (user_id, community_id)
);

CREATE INDEX IF NOT EXISTS user_presence_community_id_idx ON public.user_presence(community_id);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Anyone can view community messages') THEN
        CREATE POLICY "Anyone can view community messages" ON public.community_messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.community_members 
                WHERE community_id = public.community_messages.community_id 
                AND user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Members can insert messages') THEN
        CREATE POLICY "Members can insert messages" ON public.community_messages FOR INSERT WITH CHECK (
            auth.uid() = user_id
            AND EXISTS (
                SELECT 1 FROM public.community_members 
                WHERE community_id = public.community_messages.community_id 
                AND user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Users can update own messages or admins can update any') THEN
        CREATE POLICY "Users can update own messages or admins can update any" ON public.community_messages FOR UPDATE USING (
            auth.uid() = user_id 
            OR EXISTS (
                SELECT 1 FROM public.community_members 
                WHERE community_id = public.community_messages.community_id 
                AND user_id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Users can delete own messages or admins can delete any') THEN
        CREATE POLICY "Users can delete own messages or admins can delete any" ON public.community_messages FOR DELETE USING (
            auth.uid() = user_id 
            OR EXISTS (
                SELECT 1 FROM public.community_members 
                WHERE community_id = public.community_messages.community_id 
                AND user_id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'Anyone can view reactions') THEN
        CREATE POLICY "Anyone can view reactions" ON public.message_reactions FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.community_messages cm
                INNER JOIN public.community_members cmember ON cm.community_id = cmember.community_id
                WHERE cm.id = public.message_reactions.message_id
                AND cmember.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'Members can add reactions') THEN
        CREATE POLICY "Members can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (
            auth.uid() = user_id
            AND EXISTS (
                SELECT 1 FROM public.community_messages cm
                INNER JOIN public.community_members cmember ON cm.community_id = cmember.community_id
                WHERE cm.id = public.message_reactions.message_id
                AND cmember.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'Users can delete own reactions') THEN
        CREATE POLICY "Users can delete own reactions" ON public.message_reactions FOR DELETE USING (
            auth.uid() = user_id
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dm_conversations' AND policyname = 'Users can view their DM conversations') THEN
        CREATE POLICY "Users can view their DM conversations" ON public.dm_conversations FOR SELECT USING (
            auth.uid() = user_a_id OR auth.uid() = user_b_id
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dm_conversations' AND policyname = 'Members can create DM conversations') THEN
        CREATE POLICY "Members can create DM conversations" ON public.dm_conversations FOR INSERT WITH CHECK (
            (auth.uid() = user_a_id OR auth.uid() = user_b_id)
            AND EXISTS (
                SELECT 1 FROM public.community_members cm1
                INNER JOIN public.community_members cm2 ON cm1.community_id = cm2.community_id
                WHERE cm1.community_id = public.dm_conversations.community_id
                AND cm1.user_id = user_a_id
                AND cm2.user_id = user_b_id
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dm_messages' AND policyname = 'Users can view DM messages in their conversations') THEN
        CREATE POLICY "Users can view DM messages in their conversations" ON public.dm_messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.dm_conversations dc
                WHERE dc.id = public.dm_messages.conversation_id
                AND (dc.user_a_id = auth.uid() OR dc.user_b_id = auth.uid())
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dm_messages' AND policyname = 'Users can send DM messages') THEN
        CREATE POLICY "Users can send DM messages" ON public.dm_messages FOR INSERT WITH CHECK (
            auth.uid() = sender_id
            AND EXISTS (
                SELECT 1 FROM public.dm_conversations dc
                WHERE dc.id = public.dm_messages.conversation_id
                AND (dc.user_a_id = auth.uid() OR dc.user_b_id = auth.uid())
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dm_messages' AND policyname = 'Users can update own DM messages') THEN
        CREATE POLICY "Users can update own DM messages" ON public.dm_messages FOR UPDATE USING (
            auth.uid() = sender_id
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dm_messages' AND policyname = 'Users can delete own DM messages') THEN
        CREATE POLICY "Users can delete own DM messages" ON public.dm_messages FOR DELETE USING (
            auth.uid() = sender_id
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Anyone in community can view presence') THEN
        CREATE POLICY "Anyone in community can view presence" ON public.user_presence FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.community_members cm
                WHERE cm.community_id = public.user_presence.community_id
                AND cm.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Users can update their own presence') THEN
        CREATE POLICY "Users can update their own presence" ON public.user_presence FOR UPDATE USING (
            auth.uid() = user_id
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Users can insert their presence') THEN
        CREATE POLICY "Users can insert their presence" ON public.user_presence FOR INSERT WITH CHECK (
            auth.uid() = user_id
        );
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.handle_community_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_community_messages_updated_at_trigger') THEN
        CREATE TRIGGER handle_community_messages_updated_at_trigger BEFORE UPDATE ON public.community_messages
        FOR EACH ROW EXECUTE FUNCTION public.handle_community_messages_updated_at();
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.handle_dm_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_dm_messages_updated_at_trigger') THEN
        CREATE TRIGGER handle_dm_messages_updated_at_trigger BEFORE UPDATE ON public.dm_messages
        FOR EACH ROW EXECUTE FUNCTION public.handle_dm_messages_updated_at();
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.handle_dm_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_dm_conversations_updated_at_trigger') THEN
        CREATE TRIGGER handle_dm_conversations_updated_at_trigger BEFORE UPDATE ON public.dm_conversations
        FOR EACH ROW EXECUTE FUNCTION public.handle_dm_conversations_updated_at();
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.update_dm_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dm_conversations 
  SET updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dm_conversation_on_new_message') THEN
        CREATE TRIGGER update_dm_conversation_on_new_message AFTER INSERT ON public.dm_messages
        FOR EACH ROW EXECUTE FUNCTION public.update_dm_conversation_updated_at();
    END IF;
END
$$;