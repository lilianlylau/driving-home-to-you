create extension if not exists pgcrypto;

create table public.drives (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique check (short_id ~ '^[A-Za-z0-9_-]{12,32}$'),
  note_text text not null check (char_length(btrim(note_text)) between 1 and 500),
  voice_object_path text unique,
  voice_duration_ms integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  deleted_at timestamptz,
  delete_token_hash text not null check (char_length(delete_token_hash) = 64),
  constraint drives_voice_metadata check ((voice_object_path is null and voice_duration_ms is null) or (voice_object_path is not null and voice_duration_ms between 1 and 120000)),
  constraint drives_expiry_after_creation check (expires_at > created_at)
);
create index drives_short_id_active_idx on public.drives (short_id) where deleted_at is null;
create index drives_cleanup_idx on public.drives (expires_at, deleted_at);

create table public.drive_songs (
  drive_id uuid not null references public.drives(id) on delete cascade,
  position smallint not null check (position between 0 and 2),
  source text not null default 'itunes' check (source = 'itunes'),
  source_track_id text not null check (char_length(source_track_id) between 1 and 100),
  title text not null check (char_length(title) between 1 and 200),
  artist text not null check (char_length(artist) between 1 and 200),
  preview_url text not null check (char_length(preview_url) between 1 and 2048),
  artwork_url text check (artwork_url is null or char_length(artwork_url) between 1 and 2048),
  primary key (drive_id, position),
  unique (drive_id, source, source_track_id)
);

create table public.api_rate_limits (
  scope text not null check (scope in ('global_create', 'client_create', 'client_read', 'client_delete', 'client_search')),
  client_hash text not null check (char_length(client_hash) = 64),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (scope, client_hash, window_started_at)
);
create index api_rate_limits_cleanup_idx on public.api_rate_limits (window_started_at);

alter table public.drives enable row level security;
alter table public.drive_songs enable row level security;
alter table public.api_rate_limits enable row level security;
revoke all on public.drives, public.drive_songs, public.api_rate_limits from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice-memos', 'voice-memos', false, 5242880, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
revoke all on storage.objects from anon, authenticated;

create or replace function public.create_drive_with_songs(p_short_id text, p_note_text text, p_voice_object_path text, p_voice_duration_ms integer, p_delete_token_hash text, p_songs jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_drive_id uuid;
begin
  if p_songs is null or jsonb_typeof(p_songs) <> 'array' or jsonb_array_length(p_songs) not between 1 and 3 then
    raise exception using errcode = '22023', message = 'invalid song count';
  end if;
  insert into public.drives(short_id, note_text, voice_object_path, voice_duration_ms, delete_token_hash)
  values (p_short_id, p_note_text, p_voice_object_path, p_voice_duration_ms, p_delete_token_hash)
  returning id into new_drive_id;
  insert into public.drive_songs(drive_id, position, source, source_track_id, title, artist, preview_url, artwork_url)
  select new_drive_id, song.position, 'itunes', song.source_track_id, song.title, song.artist, song.preview_url, song.artwork_url
  from jsonb_to_recordset(p_songs) as song(position smallint, source_track_id text, title text, artist text, preview_url text, artwork_url text);
  if (select count(*) from public.drive_songs where drive_id = new_drive_id) <> jsonb_array_length(p_songs)
    or (select min(position) from public.drive_songs where drive_id = new_drive_id) <> 0
    or (select max(position) from public.drive_songs where drive_id = new_drive_id) <> jsonb_array_length(p_songs) - 1 then
    raise exception using errcode = '22023', message = 'invalid songs';
  end if;
  return new_drive_id;
end; $$;
revoke all on function public.create_drive_with_songs(text, text, text, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_drive_with_songs(text, text, text, integer, text, jsonb) to service_role;

create or replace function public.take_rate_limit(p_scope text, p_client_hash text, p_window_seconds integer, p_limit integer)
returns table(allowed boolean, remaining integer, retry_after integer, request_count integer)
language plpgsql security definer set search_path = '' as $$
declare bucket timestamptz; current_count integer;
begin
  if p_window_seconds not between 1 and 86400 or p_limit not between 1 and 100000 then
    raise exception using errcode = '22023', message = 'invalid rate limit';
  end if;
  bucket := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.api_rate_limits(scope, client_hash, window_started_at, request_count) values (p_scope, p_client_hash, bucket, 1)
  on conflict (scope, client_hash, window_started_at) do update set request_count = public.api_rate_limits.request_count + 1
  returning public.api_rate_limits.request_count into current_count;
  return query select current_count <= p_limit, greatest(p_limit - current_count, 0),
    greatest(ceil(extract(epoch from bucket + make_interval(secs => p_window_seconds) - now()))::integer, 1), current_count;
end; $$;
revoke all on function public.take_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_rate_limit(text, text, integer, integer) to service_role;
