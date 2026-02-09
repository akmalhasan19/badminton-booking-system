begin;

  do $$
  begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end
  $$;

  do $$
  begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages') then
      alter publication supabase_realtime add table public.community_messages;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions') then
      alter publication supabase_realtime add table public.message_reactions;
    end if;
    
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_messages') then
      alter publication supabase_realtime add table public.dm_messages;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_conversations') then
      alter publication supabase_realtime add table public.dm_conversations;
    end if;

    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_presence') then
      alter publication supabase_realtime add table public.user_presence;
    end if;
  end
  $$;

commit;