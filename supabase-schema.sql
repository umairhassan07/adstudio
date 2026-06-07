-- Run this in your Supabase SQL editor

create table if not exists business_dna (
  id          uuid default gen_random_uuid() primary key,
  session_id  text not null unique,
  data        jsonb not null default '{}',
  updated_at  timestamptz default now()
);

create table if not exists ads (
  id          uuid default gen_random_uuid() primary key,
  session_id  text not null,
  title       text,
  brand       text,
  platform    text,
  format      text,
  category    text,
  thumbnail   text,
  clones      int default 0,
  tags        text[] default '{}',
  created_at  timestamptz default now()
);

-- Indexes for fast session lookups
create index if not exists ads_session_idx on ads(session_id);
create index if not exists dna_session_idx on business_dna(session_id);

-- Disable RLS for now (enable + add policies when you add auth)
alter table business_dna disable row level security;
alter table ads disable row level security;
