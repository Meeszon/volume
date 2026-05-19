-- Intent Model migration (ADR-0001).
-- Drops and recreates `activities` with the new Kind/Intent/Block schema.
-- Per ADR-0001 we wipe rather than back-map: app is in early development.

drop table if exists activities;

create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  scheduled_date date not null,
  kind text not null,
  intent_leaf_id text,
  block jsonb,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

alter table activities enable row level security;

create policy "Users can manage their own activities"
  on activities for all using (auth.uid() = user_id);
