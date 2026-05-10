-- Lists feature: user-defined lists and word membership.
-- Requires existing `words` table (already on prod).

create extension if not exists pgcrypto;

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lists_user_lower_name_uniq_idx
  on lists (user_id, lower(name));

create index if not exists lists_user_created_idx
  on lists (user_id, created_at desc);

create table if not exists list_words (
  list_id uuid not null references lists (id) on delete cascade,
  word_id uuid not null references words (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (list_id, word_id)
);

create index if not exists list_words_word_id_idx
  on list_words (word_id);

create index if not exists list_words_list_id_created_idx
  on list_words (list_id, created_at desc);