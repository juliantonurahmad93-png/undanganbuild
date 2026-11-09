-- Biz Invite — schema aman & terstruktur (Supabase Auth + RLS)
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Catatan: kebijakan admin menggunakan JWT (email/app_metadata/role claim), BUKAN subquery ke profiles,
-- untuk menghindari recursion RLS.

create extension if not exists pgcrypto;

-- ========== Helpers admin (JWT-based, anti-recursion) ==========
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'juliantonurahmad93@gmail.com'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() ->> 'role', '') = 'admin';
$$;

-- ========== Slug/alamat link helpers (path: domain.com/slug) ==========
create or replace function public.normalize_slug(p_slug text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(lower(trim(coalesce(p_slug, ''))), '[^a-z0-9-]+', '-', 'g'), '');
$$;

create or replace function public.is_slug_available(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare s text := public.normalize_slug(p_slug);
begin
  if s is null or char_length(s) < 3 or char_length(s) > 40 then return false; end if;
  if s ~ '^-|-$|--' then return false; end if;
  if exists (select 1 from public.invitation_settings where slug = s) then return false; end if;
  if exists (select 1 from public.profiles where subdomain = s) then return false; end if;
  return true;
end;
$$;
grant execute on function public.is_slug_available(text) to anon, authenticated;

-- ========== Wishes / RSVP ==========
create table if not exists public.wishes (
  id         uuid primary key default gen_random_uuid(),
  invitation_id uuid,
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) <= 60),
  presence   text not null default 'Hadir',
  message    text not null check (char_length(message) <= 500),
  theme      text not null default 'demo'
);
alter table public.wishes add column if not exists invitation_id uuid;
alter table public.wishes enable row level security;
drop policy if exists "wishes_read_all" on public.wishes;
drop policy if exists "wishes_insert_all" on public.wishes;
create policy "wishes_read_all" on public.wishes for select to anon, authenticated using (true);
create policy "wishes_insert_all" on public.wishes for insert to anon, authenticated with check (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'wishes') then
    alter publication supabase_realtime add table public.wishes;
  end if;
exception when undefined_object then null;
end $$;

-- ========== Leads ==========
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  couple_names text not null,
  whatsapp     text,
  email        text not null,
  plan         text,
  akad_month   text,
  theme        text,
  subdomain    text
);
alter table public.leads add column if not exists subdomain text;
alter table public.leads enable row level security;
drop policy if exists "leads_insert_all" on public.leads;
drop policy if exists "leads_read_admin" on public.leads;
create policy "leads_insert_all" on public.leads for insert to anon, authenticated with check (true);
create policy "leads_read_admin" on public.leads for select to authenticated using (public.is_admin());

-- ========== Profiles + approval ==========
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  display_name text,
  subdomain text unique,
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);
-- Pastikan FK auth.users ada bila tabel dibuat lama/tanpa constraint eksplisit (abaikan jika sudah cocok)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_id_fkey') then
    alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
  end if;
exception when others then null; end $$;
alter table public.profiles add column if not exists subdomain text;
alter table public.profiles drop column if exists password;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_subdomain_key') then
    alter table public.profiles add constraint profiles_subdomain_key unique (subdomain);
  end if;
exception when others then null; end $$;
create index if not exists profiles_subdomain_idx on public.profiles(subdomain);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check (auth.uid() = id and role = 'user' and status = 'pending');
create policy "profiles_admin_select" on public.profiles for select to authenticated using (public.is_admin());
create policy "profiles_admin_update" on public.profiles for update to authenticated using (public.is_admin()) with check (true);

-- ========== Invitation Settings (terstruktur) ==========
-- Satu user bisa punya beberapa undangan; `settings` JSONB menyimpan struktur section terstandar.
create table if not exists public.invitation_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text unique,
  theme_id text not null default 'islami-emerald',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  title text not null default 'Undangan',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.invitation_settings add column if not exists slug text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'invitation_settings_slug_key') then
    alter table public.invitation_settings add constraint invitation_settings_slug_key unique (slug);
  end if;
exception when others then null; end $$;
create index if not exists invitation_settings_user_id_idx on public.invitation_settings(user_id);
create index if not exists invitation_settings_slug_idx on public.invitation_settings(slug);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists invitation_settings_updated_at on public.invitation_settings;
create trigger invitation_settings_updated_at before update on public.invitation_settings
for each row execute procedure public.set_updated_at();

alter table public.invitation_settings enable row level security;
drop policy if exists "inv_settings_owner_select" on public.invitation_settings;
drop policy if exists "inv_settings_owner_insert" on public.invitation_settings;
drop policy if exists "inv_settings_owner_update" on public.invitation_settings;
drop policy if exists "inv_settings_owner_delete" on public.invitation_settings;
drop policy if exists "inv_settings_admin_all" on public.invitation_settings;
drop policy if exists "inv_settings_public_read" on public.invitation_settings;

create policy "inv_settings_owner_select" on public.invitation_settings for select to authenticated using (auth.uid() = user_id);
create policy "inv_settings_owner_insert" on public.invitation_settings for insert to authenticated with check (auth.uid() = user_id);
create policy "inv_settings_owner_update" on public.invitation_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inv_settings_owner_delete" on public.invitation_settings for delete to authenticated using (auth.uid() = user_id);
create policy "inv_settings_admin_all" on public.invitation_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "inv_settings_public_read" on public.invitation_settings for select to anon, authenticated using (status = 'published' and slug is not null);

-- ========== Auth trigger: profil + slug/alamat link sekali daftar ==========
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text := public.normalize_slug(new.raw_user_meta_data ->> 'subdomain');
  v_name text := coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'couple_names', '');
  v_is_admin boolean := coalesce(new.raw_user_meta_data ->> 'role','user') = 'admin';
begin
  if not v_is_admin then
    if v_slug is null or char_length(v_slug) < 3 or char_length(v_slug) > 40 or v_slug ~ '^-|-$|--' then
      raise exception 'Alamat link wajib diisi saat pendaftaran (3-40 karakter: huruf kecil, angka, tanda hubung). Contoh: domain.com/raka-nanda';
    end if;
    if exists (select 1 from public.profiles where subdomain = v_slug)
       or exists (select 1 from public.invitation_settings where slug = v_slug) then
      raise exception 'Alamat link "/%" sudah digunakan. Pilih alamat lain.', v_slug;
    end if;
  end if;

  insert into public.profiles (id, email, display_name, subdomain, role, status)
  values (
    new.id, new.email, v_name,
    case when v_is_admin then null else v_slug end,
    case when v_is_admin then 'admin' else 'user' end,
    case when v_is_admin then 'approved' else 'pending' end
  )
  on conflict (id) do update
    set email = excluded.email,
        subdomain = coalesce(public.profiles.subdomain, excluded.subdomain);

  if not v_is_admin and v_slug is not null then
    insert into public.invitation_settings (user_id, slug, theme_id, status, title, settings)
    values (
      new.id, v_slug, 'islami-emerald', 'draft', nullif(v_name, '') || ' — Undangan',
      jsonb_build_object('general', jsonb_build_object('title', coalesce(nullif(v_name,''), 'Undangan'), 'slug', v_slug, 'themeId', 'islami-emerald', 'status', 'draft', 'timezone', 'Asia/Jakarta', 'language', 'id'))
    )
    on conflict (slug) do nothing;
  end if;

  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- ========== Jadikan akun admin ==========
insert into public.profiles (id,email,display_name,subdomain,role,status)
select id,email,'Admin',null,'admin','approved' from auth.users where email = 'juliantonurahmad93@gmail.com'
on conflict (id) do update set role='admin', status='approved';

-- ========== Struktur settings (JSONB contract, contoh) ==========
-- {
--   "general": {"title","slug","themeId","status","timezone","language"},
--   "couple": {"groom":{"name","father","mother","childOrder","photoUrl","instagram"},"bride":{...}},
--   "hero": {"openingText","guestLabelEnabled","coverImageUrl"},
--   "event": {"dateDisplay","countdownIso","events":[{"type":"akad|resepsi|custom","title","date","start","end","venue","address","mapUrl","note"}]},
--   "location": {"primaryAddress","mapEmbedUrl","mapLink"},
--   "content": {"greeting","verseEnabled","verseAr","verseText","verseSource","closing"},
--   "gallery": {"enabled","images":[{"url","caption"}]},
--   "rsvp": {"enabled","fields":{"phone":false},"presenceOptions":["Hadir","Tidak Hadir","Masih Ragu"]},
--   "gift": {"enabled","note","accounts":[{"bank","number","name","qrisUrl"}]},
--   "audio": {"enabled","mode":"soft|nature|beat","url":""},
--   "privacy": {"hidePhotos":false,"maskGuestName":false}
-- }

-- ========== Public slug status (safe, bypasses RLS for existence check only) ==========
create or replace function public.get_invitation_link_status(p_slug text)
returns table(exists boolean, published boolean)
language plpgsql
security definer
set search_path = public
as $$
declare s text := public.normalize_slug(p_slug);
begin
  return query
  select true, (i.status = 'published')
  from public.invitation_settings i
  where i.slug = s
  limit 1;
  if not found then
    return query select false, false;
  end if;
end;
$$;
grant execute on function public.get_invitation_link_status(text) to anon, authenticated;

-- ========== Public fetch by slug/link (returns published only; checks invitation_settings.slug then profiles.subdomain) ==========
create or replace function public.fetch_published_invitation(p_slug text)
returns setof public.invitation_settings
language plpgsql
security definer
set search_path = public
as $$
declare s text := public.normalize_slug(p_slug);
begin
  return query
  select i.* from public.invitation_settings i
  where i.slug = s and i.status = 'published'
  limit 1;
  if found then return; end if;
  return query
  select i.* from public.invitation_settings i
  join public.profiles p on p.id = i.user_id
  where p.subdomain = s and i.status = 'published'
  order by i.updated_at desc
  limit 1;
end;
$$;
grant execute on function public.fetch_published_invitation(text) to anon, authenticated;

-- Opsional: isi slug invitation_settings dari profiles.subdomain untuk data lama
update public.invitation_settings i
set slug = p.subdomain
from public.profiles p
where i.user_id = p.id and (i.slug is null or btrim(i.slug) = '') and p.subdomain is not null
  and not exists (select 1 from public.invitation_settings x where x.slug = p.subdomain and x.id <> i.id);