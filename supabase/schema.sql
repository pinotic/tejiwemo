-- Jalankan skrip ini di Supabase SQL Editor (Dashboard Supabase -> SQL Editor -> New query)

-- 1. Tabel penyimpanan state Portal Warga (kas, divisi, berita, agenda, usulan, hero, identitas web, notifikasi)
create table if not exists public.rt_app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. Tabel akun Pengurus & Superadmin (terpisah dari data publik)
create table if not exists public.rt_auth_users (
  id text primary key,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('pengurus', 'superadmin')),
  display_name text not null,
  position text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- 3. Aktifkan Row Level Security (RLS)
alter table public.rt_app_state enable row level security;
alter table public.rt_auth_users enable row level security;

-- rt_app_state boleh dibaca oleh client (anon) untuk fitur Supabase Realtime;
-- semua proses tulis tetap melewati Backend API (/api/*) memakai SUPABASE_SERVICE_ROLE_KEY.
drop policy if exists "Public read rt_app_state" on public.rt_app_state;
create policy "Public read rt_app_state"
  on public.rt_app_state
  for select
  to anon, authenticated
  using (true);

-- Catatan: rt_auth_users sengaja TIDAK diberi policy untuk anon/authenticated
-- sehingga hanya backend dengan SUPABASE_SERVICE_ROLE_KEY yang bisa membaca/mengubah akun & password.

-- 4. Aktifkan Supabase Realtime pada tabel rt_app_state
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rt_app_state'
  ) then
    alter publication supabase_realtime add table public.rt_app_state;
  end if;
end $$;
