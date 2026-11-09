-- =====================================================================
-- NIFLAX: skema Supabase lengkap
-- Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
-- Aman dijalankan ulang (memakai "if not exists" / "or replace").
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- 1. KONTEN PUBLIK (dibaca semua orang, ditulis lewat service_role/Edge Function)
-- ---------------------------------------------------------------------
create table if not exists public.news (
  id           bigint generated always as identity primary key,
  title        text not null check (char_length(title) between 5 and 300),
  summary      text,
  url          text unique,                  -- tautan ke sumber asli (kunci anti-duplikat saat impor RSS)
  image_url    text,
  category     text not null default 'Nasional',
  source       text,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  fts tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')),   'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
  ) stored
);
create index if not exists news_fts_idx       on public.news using gin (fts);
create index if not exists news_title_trgm    on public.news using gin (title extensions.gin_trgm_ops);
create index if not exists news_published_idx on public.news (published_at desc);
create index if not exists news_category_idx  on public.news (category, published_at desc);

create table if not exists public.videos (
  id               bigint generated always as identity primary key,
  title            text not null,
  youtube_id       text not null unique,
  channel          text,
  category         text,
  duration_seconds int,
  published_at     timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(channel, ''))
  ) stored
);
create index if not exists videos_fts_idx on public.videos using gin (fts);

create table if not exists public.products (
  id         bigint generated always as identity primary key,
  name       text not null,
  price      integer not null check (price >= 0),     -- Rupiah, tanpa desimal
  old_price  integer check (old_price >= 0),
  image_url  text,
  url        text,                                    -- tautan toko / afiliasi
  store      text,
  category   text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(store, ''))
  ) stored
);
create index if not exists products_fts_idx on public.products using gin (fts);

create table if not exists public.comics (
  id          bigint generated always as identity primary key,
  title       text not null,
  genre       text,
  cover_url   text,
  url         text,
  weekly_rank int,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. AKUN, KOMUNITAS, BERITA TERSIMPAN
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Buat profil otomatis saat ada pengguna baru mendaftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.communities (
  id           bigint generated always as identity primary key,
  name         text not null,
  slug         text not null unique,
  description  text,
  member_count integer not null default 0,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored
);
create index if not exists communities_fts_idx on public.communities using gin (fts);

create table if not exists public.community_members (
  community_id bigint not null references public.communities (id) on delete cascade,
  user_id      uuid   not null references auth.users (id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists community_members_user_idx on public.community_members (user_id);

-- Jaga member_count tetap akurat
create or replace function public.sync_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update communities set member_count = member_count + 1 where id = new.community_id;
  elsif tg_op = 'DELETE' then
    update communities set member_count = greatest(member_count - 1, 0) where id = old.community_id;
  end if;
  return null;
end $$;

drop trigger if exists community_members_count on public.community_members;
create trigger community_members_count
  after insert or delete on public.community_members
  for each row execute function public.sync_member_count();

create table if not exists public.saved_news (
  user_id    uuid   not null references auth.users (id) on delete cascade,
  news_id    bigint not null references public.news (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, news_id)
);

-- ---------------------------------------------------------------------
-- 3. RIWAYAT PENCARIAN + KATA KUNCI POPULER
-- ---------------------------------------------------------------------
create table if not exists public.searches (
  id         bigint generated always as identity primary key,
  query      text not null check (char_length(query) between 2 and 100),
  scope      text not null default 'all' check (scope in ('all','news','image','video','community')),
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists searches_recent_idx on public.searches (created_at desc);
create index if not exists searches_query_idx  on public.searches (query text_pattern_ops);

-- Frontend memanggil ini (bukan insert langsung), supaya input dibersihkan di server
create or replace function public.log_search(p_query text, p_scope text default 'all')
returns void language plpgsql security definer set search_path = public as $$
declare
  q text := lower(regexp_replace(trim(coalesce(p_query, '')), '\s+', ' ', 'g'));
begin
  if char_length(q) < 2 or char_length(q) > 100 then return; end if;
  insert into searches (query, scope, user_id)
  values (q, case when p_scope in ('all','news','image','video','community') then p_scope else 'all' end, auth.uid());
end $$;

-- View "trending": 10 kata kunci terbanyak dalam 7 hari terakhir.
-- Namanya & kolomnya sama dengan yang dibaca js/api.js (keyword, rank).
create or replace view public.trending as
select keyword, rank
from (
  select query as keyword,
         (row_number() over (order by count(*) desc, max(created_at) desc))::int as rank
  from public.searches
  where created_at > now() - interval '7 days'
  group by query
) t
where rank <= 10
order by rank;

-- Autocomplete: saran kata kunci dari pencarian orang lain
create or replace function public.suggest_keywords(p_prefix text, p_limit int default 8)
returns table (keyword text, hits bigint)
language sql stable security definer set search_path = public as $$
  select query, count(*)
  from searches
  where char_length(trim(p_prefix)) >= 2
    and created_at > now() - interval '30 days'
    and query like replace(replace(lower(trim(p_prefix)), '%', '\%'), '_', '\_') || '%'
  group by query
  order by count(*) desc
  limit least(p_limit, 20)
$$;

-- ---------------------------------------------------------------------
-- 4. FUNGSI PENCARIAN TEKS
-- ---------------------------------------------------------------------
-- Pencarian berita (tab "Berita"), bisa difilter kategori dan dipaginasi
create or replace function public.search_news(
  p_query text, p_category text default null, p_limit int default 20, p_offset int default 0)
returns table (id bigint, title text, summary text, url text, image_url text,
               category text, source text, published_at timestamptz, rank real)
language sql stable as $$
  with q as (
    select websearch_to_tsquery('simple', p_query) as tsq,
           '%' || replace(replace(trim(p_query), '%', '\%'), '_', '\_') || '%' as pat
    where char_length(trim(p_query)) >= 2
  )
  select n.id, n.title, n.summary, n.url, n.image_url, n.category, n.source, n.published_at,
         (ts_rank(n.fts, q.tsq) + case when n.title ilike q.pat then 0.2 else 0 end)::real
  from public.news n, q
  where (n.fts @@ q.tsq or n.title ilike q.pat)
    and (p_category is null or n.category = p_category)
  order by 9 desc, n.published_at desc
  limit least(p_limit, 50) offset greatest(p_offset, 0)
$$;

-- Pencarian gabungan (tab "Semua"): berita, video, produk, komunitas
create or replace function public.search_all(p_query text, p_limit int default 30)
returns table (kind text, id bigint, title text, snippet text, url text,
               image_url text, published_at timestamptz, rank real)
language sql stable as $$
  with q as (
    select websearch_to_tsquery('simple', p_query) as tsq,
           '%' || replace(replace(trim(p_query), '%', '\%'), '_', '\_') || '%' as pat
    where char_length(trim(p_query)) >= 2
  )
  select * from (
    select 'news'::text as kind, n.id, n.title, n.summary as snippet, n.url, n.image_url, n.published_at,
           (ts_rank(n.fts, q.tsq) + case when n.title ilike q.pat then 0.2 else 0 end)::real as rank
    from public.news n, q
    where n.fts @@ q.tsq or n.title ilike q.pat
    union all
    select 'video', v.id, v.title, v.channel,
           'https://www.youtube.com/watch?v=' || v.youtube_id,
           'https://i.ytimg.com/vi/' || v.youtube_id || '/hqdefault.jpg', v.published_at,
           (ts_rank(v.fts, q.tsq) + case when v.title ilike q.pat then 0.2 else 0 end)::real
    from public.videos v, q
    where v.fts @@ q.tsq or v.title ilike q.pat
    union all
    select 'product', p.id, p.name, 'Rp' || p.price::text, p.url, p.image_url, p.created_at,
           (ts_rank(p.fts, q.tsq) + case when p.name ilike q.pat then 0.2 else 0 end)::real
    from public.products p, q
    where p.active and (p.fts @@ q.tsq or p.name ilike q.pat)
    union all
    select 'community', c.id, c.name, c.description, null::text, null::text, c.created_at,
           (ts_rank(c.fts, q.tsq) + case when c.name ilike q.pat then 0.2 else 0 end)::real
    from public.communities c, q
    where c.fts @@ q.tsq or c.name ilike q.pat
  ) r
  order by r.rank desc, r.published_at desc nulls last
  limit least(p_limit, 100)
$$;

revoke all on function public.log_search(text, text) from public;
grant execute on function public.log_search(text, text)       to anon, authenticated;
grant execute on function public.suggest_keywords(text, int)  to anon, authenticated;
grant execute on function public.search_news(text, text, int, int) to anon, authenticated;
grant execute on function public.search_all(text, int)        to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. KEAMANAN (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.news              enable row level security;
alter table public.videos            enable row level security;
alter table public.products          enable row level security;
alter table public.comics            enable row level security;
alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.profiles          enable row level security;
alter table public.saved_news        enable row level security;
alter table public.searches          enable row level security;   -- tanpa policy: tidak ada yang bisa baca/tulis langsung

-- Konten publik: semua orang boleh membaca, hanya service_role yang menulis
drop policy if exists "public read" on public.news;
drop policy if exists "public read" on public.videos;
drop policy if exists "public read" on public.products;
drop policy if exists "public read" on public.comics;
drop policy if exists "public read" on public.communities;
create policy "public read" on public.news        for select to anon, authenticated using (true);
create policy "public read" on public.videos      for select to anon, authenticated using (true);
create policy "public read" on public.products    for select to anon, authenticated using (active);
create policy "public read" on public.comics      for select to anon, authenticated using (true);
create policy "public read" on public.communities for select to anon, authenticated using (true);

-- Profil: hanya pemilik
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Keanggotaan komunitas: lihat, gabung, dan keluar hanya untuk diri sendiri
drop policy if exists "own membership read"   on public.community_members;
drop policy if exists "own membership join"   on public.community_members;
drop policy if exists "own membership leave"  on public.community_members;
create policy "own membership read"  on public.community_members for select to authenticated using (user_id = auth.uid());
create policy "own membership join"  on public.community_members for insert to authenticated with check (user_id = auth.uid());
create policy "own membership leave" on public.community_members for delete to authenticated using (user_id = auth.uid());

-- Berita tersimpan: hanya pemilik
drop policy if exists "own saved" on public.saved_news;
create policy "own saved" on public.saved_news for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- View trending hanya membuka hasil agregat (bukan isi tabel searches)
grant select on public.trending to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. DATA AWAL: dihapus di v13. Niflax tidak lagi memasukkan data contoh.
--    Jika database lamamu sudah berisi data contoh, jalankan supabase/v13-bersih-dan-seed.sql.
-- ---------------------------------------------------------------------
