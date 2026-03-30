create extension if not exists pgcrypto;

create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  text text not null,
  meaning text,
  example text,
  tags text[] not null default '{}',
  is_hard boolean not null default false,
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  times_wrong integer not null default 0,
  last_seen timestamptz,
  last_correct timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists words_user_created_idx on words (user_id, created_at desc);
create index if not exists words_user_updated_idx on words (user_id, updated_at desc);
