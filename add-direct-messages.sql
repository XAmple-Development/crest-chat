-- Direct Messages schema for CrestChat (1:1 and group DMs)
-- Run in Supabase SQL editor

-- Threads
create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Participants
create table if not exists public.dm_participants (
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

-- Messages
create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_edited boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Realtime
alter publication supabase_realtime add table public.dm_threads;
alter publication supabase_realtime add table public.dm_participants;
alter publication supabase_realtime add table public.dm_messages;

-- RLS
alter table public.dm_threads enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;

-- Policies: threads
drop policy if exists dm_threads_select_participant on public.dm_threads;
create policy dm_threads_select_participant on public.dm_threads
  for select using (
    exists (
      select 1 from public.dm_participants p
      where p.thread_id = dm_threads.id and p.user_id = auth.uid()
    )
  );

drop policy if exists dm_threads_insert_by_participant on public.dm_threads;
create policy dm_threads_insert_by_participant on public.dm_threads
  for insert with check (true);

drop policy if exists dm_threads_update_participant on public.dm_threads;
create policy dm_threads_update_participant on public.dm_threads
  for update using (
    exists (
      select 1 from public.dm_participants p
      where p.thread_id = dm_threads.id and p.user_id = auth.uid()
    )
  );

-- Policies: participants
drop policy if exists dm_participants_select_participant on public.dm_participants;
create policy dm_participants_select_participant on public.dm_participants
  for select using (
    exists (
      select 1 from public.dm_participants p2
      where p2.thread_id = dm_participants.thread_id and p2.user_id = auth.uid()
    )
  );

drop policy if exists dm_participants_insert_self on public.dm_participants;
create policy dm_participants_insert_self on public.dm_participants
  for insert with check (user_id = auth.uid());

drop policy if exists dm_participants_delete_self on public.dm_participants;
create policy dm_participants_delete_self on public.dm_participants
  for delete using (user_id = auth.uid());

-- Policies: messages
drop policy if exists dm_messages_select_participant on public.dm_messages;
create policy dm_messages_select_participant on public.dm_messages
  for select using (
    exists (
      select 1 from public.dm_participants p
      where p.thread_id = dm_messages.thread_id and p.user_id = auth.uid()
    )
  );

drop policy if exists dm_messages_insert_author_participant on public.dm_messages;
create policy dm_messages_insert_author_participant on public.dm_messages
  for insert with check (
    author_id = auth.uid() and exists (
      select 1 from public.dm_participants p
      where p.thread_id = dm_messages.thread_id and p.user_id = auth.uid()
    )
  );

drop policy if exists dm_messages_update_author on public.dm_messages;
create policy dm_messages_update_author on public.dm_messages
  for update using (author_id = auth.uid());

-- Helper function: create or get 1:1 DM thread
create or replace function public.create_or_get_dm_thread(target_user_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_thread_id uuid;
begin
  if target_user_id is null or target_user_id = auth.uid() then
    return null;
  end if;

  -- try to find existing thread with exactly these two participants
  select dt.id into v_thread_id
  from public.dm_threads dt
  join public.dm_participants p1 on p1.thread_id = dt.id and p1.user_id = auth.uid()
  join public.dm_participants p2 on p2.thread_id = dt.id and p2.user_id = target_user_id
  where dt.is_group = false
  limit 1;

  if v_thread_id is not null then
    return v_thread_id;
  end if;

  -- create new thread
  insert into public.dm_threads(is_group) values(false) returning id into v_thread_id;
  insert into public.dm_participants(thread_id, user_id) values (v_thread_id, auth.uid());
  insert into public.dm_participants(thread_id, user_id) values (v_thread_id, target_user_id);
  return v_thread_id;
end;
$$;


