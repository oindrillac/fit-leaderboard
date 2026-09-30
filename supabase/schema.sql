-- Step Squad — full database setup.
-- Paste this whole file into the Supabase SQL Editor and hit Run. Safe to re-run.

-- ---------------------------------------------------------------- the squad

create table if not exists public.participants (
  id    smallint primary key,
  name  text not null,
  emoji text not null
);

insert into public.participants (id, name, emoji) values
  (1,  'Shruti',    '🦋'),
  (2,  'Delilah',   '🌊'),
  (3,  'Rasika',    '🌿'),
  (4,  'Sweta',     '☀️'),
  (5,  'Oindrilla', '🌸'),
  (6,  'Fatima',    '🍀'),
  (7,  'Nehali',    '🔮'),
  (8,  'Sajal',     '⭐'),
  (9,  'Judith',    '🦄'),
  (10, 'Sunita',    '🌻'),
  (11, 'Angela',    '🌺'),
  (12, 'Janet',     '🍁'),
  (13, 'Mariola',   '🌙'),
  (14, 'Roshni',    '✨'),
  (15, 'Shefali',   '🌷')
on conflict (id) do update set name = excluded.name, emoji = excluded.emoji;

-- ------------------------------------------------------------- the entries

create table if not exists public.entries (
  participant_id smallint not null references public.participants (id) on delete cascade,
  day            date     not null,
  steps          integer  not null check (steps >= 0 and steps <= 200000),
  screenshot_url text,
  note           text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (participant_id, day)
);

-- Points are computed by the database, so the app and the leaderboard can
-- never disagree about the scoring rules: 8k+ = 10, 10k+ = 15, 12k+ = 20,
-- under 8k = 0. A generated column's expression can't be altered in place,
-- so this drops and re-adds it — safe to re-run whenever the rules change.
alter table public.entries drop column if exists points;
alter table public.entries add column points integer generated always as (
  case
    when steps >= 12000 then 20
    when steps >= 10000 then 15
    when steps >= 8000  then 10
    else 0
  end
) stored;

-- Challenge 2.0's window (Oct 1 – Dec 29, 2026). A plain ALTER so re-running
-- this script after the dates change actually moves the constraint, since
-- `create table if not exists` above is a no-op once the table exists.
alter table public.entries drop constraint if exists entries_in_window;
alter table public.entries add constraint entries_in_window
  check (day between date '2026-10-01' and date '2026-12-29');

create index if not exists entries_day_idx on public.entries (day);

-- ---------------------------------------------------------------- access
-- Open by design: the squad, one shared link, no passwords. Anyone with
-- the URL can read and write. If that ever stops feeling right, replace the
-- write policies below with ones gated on a shared passcode.

alter table public.participants enable row level security;
alter table public.entries      enable row level security;

drop policy if exists participants_read on public.participants;
create policy participants_read on public.participants for select using (true);

drop policy if exists entries_read   on public.entries;
drop policy if exists entries_insert on public.entries;
drop policy if exists entries_update on public.entries;
drop policy if exists entries_delete on public.entries;

create policy entries_read   on public.entries for select using (true);
create policy entries_insert on public.entries for insert with check (true);
create policy entries_update on public.entries for update using (true) with check (true);
create policy entries_delete on public.entries for delete using (true);

-- --------------------------------------------------- live updates for all
-- So a leaderboard open on someone else's phone moves the moment you save.

do $$
begin
  alter publication supabase_realtime add table public.entries;
exception
  when duplicate_object then null;
end
$$;

-- ------------------------------------------------------------ screenshots

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do update set public = true;

drop policy if exists screenshots_read   on storage.objects;
drop policy if exists screenshots_write  on storage.objects;
drop policy if exists screenshots_update on storage.objects;

create policy screenshots_read on storage.objects
  for select using (bucket_id = 'screenshots');
create policy screenshots_write on storage.objects
  for insert with check (bucket_id = 'screenshots');
create policy screenshots_update on storage.objects
  for update using (bucket_id = 'screenshots');
