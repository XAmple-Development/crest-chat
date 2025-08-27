-- Supabase Messaging-Focused Discord-like Schema
-- Safe to run in a fresh project. Review before applying to an existing DB.

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.user_status as enum ('online','idle','dnd','invisible','offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.channel_type as enum ('text','voice','announcement');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_type as enum ('default','system','user_join','user_leave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.server_privacy as enum ('public','private');
exception when duplicate_object then null; end $$;

-- Helper: updated_at trigger
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: is member of server (moved below server_members creation)

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  email text not null,
  avatar_url text,
  bio text,
  status public.user_status not null default 'online',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_timestamp
before update on public.profiles
for each row execute function public.trigger_set_timestamp();

-- User Settings
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  theme text not null default 'dark',
  notifications boolean not null default true,
  display_name text,
  bio text,
  status public.user_status not null default 'online',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_timestamp
before update on public.user_settings
for each row execute function public.trigger_set_timestamp();

-- Servers
create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  privacy_level public.server_privacy not null default 'public',
  invite_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists servers_owner_idx on public.servers(owner_id);

create trigger servers_set_timestamp
before update on public.servers
for each row execute function public.trigger_set_timestamp();

-- Channels
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  name text not null,
  description text,
  type public.channel_type not null default 'text',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channels_server_idx on public.channels(server_id);
create index if not exists channels_server_position_idx on public.channels(server_id, position);

create trigger channels_set_timestamp
before update on public.channels
for each row execute function public.trigger_set_timestamp();

-- Server Members
create table if not exists public.server_members (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(server_id, user_id)
);

create index if not exists server_members_server_user_idx on public.server_members(server_id, user_id);

-- Helper: is member of server (now that server_members exists)
create or replace function public.is_member(p_server_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.server_members sm
    where sm.server_id = p_server_id
      and sm.user_id = auth.uid()
  );
$$;

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  type public.message_type not null default 'default',
  is_pinned boolean not null default false,
  is_edited boolean not null default false,
  is_deleted boolean not null default false,
  mentions_everyone boolean not null default false,
  mention_roles text[] not null default '{}',
  mention_users text[] not null default '{}',
  embeds jsonb,
  attachments jsonb,
  reactions jsonb,
  flags integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_channel_created_idx on public.messages(channel_id, created_at);
create index if not exists messages_author_idx on public.messages(author_id);

create trigger messages_set_timestamp
before update on public.messages
for each row execute function public.trigger_set_timestamp();

-- Invites (optional, supports join by code)
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists invites_server_idx on public.invites(server_id);

-- Invite function: join_server_by_invite(code)
create or replace function public.join_server_by_invite(invite_code_param text)
returns boolean
language plpgsql
as $$
declare
  v_invite record;
  v_is_member boolean;
begin
  if invite_code_param is null then
    return false;
  end if;

  select * into v_invite
  from public.invites i
  where i.code = invite_code_param
    and i.active = true
    and (i.expires_at is null or i.expires_at > now())
    and (i.max_uses is null or i.uses < i.max_uses)
  limit 1;

  if not found then
    return false;
  end if;

  -- already a member?
  select exists (
    select 1 from public.server_members sm
    where sm.server_id = v_invite.server_id and sm.user_id = auth.uid()
  ) into v_is_member;

  if not v_is_member then
    insert into public.server_members(server_id, user_id)
    values (v_invite.server_id, auth.uid())
    on conflict do nothing;
  end if;

  update public.invites
  set uses = uses + 1,
      active = case when max_uses is not null and uses + 1 >= max_uses then false else active end
  where id = v_invite.id;

  return true;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.servers enable row level security;
alter table public.channels enable row level security;
alter table public.server_members enable row level security;
alter table public.messages enable row level security;
alter table public.invites enable row level security;

-- Profiles policies
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- User settings policies
drop policy if exists user_settings_select_own_or_public on public.user_settings;
create policy user_settings_select_own_or_public on public.user_settings
  for select using (true);

drop policy if exists user_settings_insert_self on public.user_settings;
create policy user_settings_insert_self on public.user_settings
  for insert with check (user_id = auth.uid());

drop policy if exists user_settings_update_self on public.user_settings;
create policy user_settings_update_self on public.user_settings
  for update using (user_id = auth.uid());

-- Servers policies
drop policy if exists servers_select_public_or_member on public.servers;
create policy servers_select_public_or_member on public.servers
  for select using (
    privacy_level = 'public'::public.server_privacy
    or public.is_member(id)
  );

drop policy if exists servers_insert_owner_self on public.servers;
create policy servers_insert_owner_self on public.servers
  for insert with check (owner_id = auth.uid());

drop policy if exists servers_update_owner_only on public.servers;
create policy servers_update_owner_only on public.servers
  for update using (owner_id = auth.uid());

drop policy if exists servers_delete_owner_only on public.servers;
create policy servers_delete_owner_only on public.servers
  for delete using (owner_id = auth.uid());

-- Channels policies
drop policy if exists channels_select_members_only on public.channels;
create policy channels_select_members_only on public.channels
  for select using (public.is_member(server_id));

drop policy if exists channels_cud_owner_only on public.channels;
create policy channels_cud_owner_only on public.channels
  for all using (
    exists (
      select 1 from public.servers s
      where s.id = channels.server_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.servers s
      where s.id = channels.server_id and s.owner_id = auth.uid()
    )
  );

-- Server members policies
drop policy if exists server_members_select_same_server on public.server_members;
create policy server_members_select_same_server on public.server_members
  for select using (
    public.is_member(server_id)
  );

drop policy if exists server_members_insert_self on public.server_members;
create policy server_members_insert_self on public.server_members
  for insert with check (user_id = auth.uid());

drop policy if exists server_members_delete_self on public.server_members;
create policy server_members_delete_self on public.server_members
  for delete using (user_id = auth.uid());

-- Messages policies
drop policy if exists messages_select_members_only on public.messages;
create policy messages_select_members_only on public.messages
  for select using (
    exists (
      select 1
      from public.channels c
      join public.server_members sm on sm.server_id = c.server_id
      where c.id = messages.channel_id and sm.user_id = auth.uid()
    )
  );

drop policy if exists messages_insert_author_member on public.messages;
create policy messages_insert_author_member on public.messages
  for insert with check (
    author_id = auth.uid() and exists (
      select 1
      from public.channels c
      join public.server_members sm on sm.server_id = c.server_id
      where c.id = messages.channel_id and sm.user_id = auth.uid()
    )
  );

drop policy if exists messages_update_author_or_owner on public.messages;
create policy messages_update_author_or_owner on public.messages
  for update using (
    author_id = auth.uid() or exists (
      select 1
      from public.channels c
      join public.servers s on s.id = c.server_id
      where c.id = messages.channel_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists messages_delete_author_or_owner on public.messages;
create policy messages_delete_author_or_owner on public.messages
  for delete using (
    author_id = auth.uid() or exists (
      select 1
      from public.channels c
      join public.servers s on s.id = c.server_id
      where c.id = messages.channel_id and s.owner_id = auth.uid()
    )
  );

-- Invites policies (members can read, owners manage)
drop policy if exists invites_select_members on public.invites;
create policy invites_select_members on public.invites
  for select using (
    public.is_member(server_id)
  );

drop policy if exists invites_cud_owner_only on public.invites;
create policy invites_cud_owner_only on public.invites
  for all using (
    exists (
      select 1 from public.servers s
      where s.id = invites.server_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.servers s
      where s.id = invites.server_id and s.owner_id = auth.uid()
    )
  );

-- Realtime publication
-- Supabase listens on the "supabase_realtime" publication by default
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.servers;
alter publication supabase_realtime add table public.server_members;
alter publication supabase_realtime add table public.profiles;

-- Optional sanity defaults
comment on table public.messages is 'Channel messages with soft-delete and edit flags; realtime enabled.';
comment on function public.join_server_by_invite(text) is 'Join a server by invite code, returns true on success.';


