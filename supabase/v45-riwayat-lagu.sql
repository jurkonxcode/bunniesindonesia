-- =====================================================================
-- BUNNIES INDONESIA v45: riwayat dengar lagu per akun
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-schema.sql (butuh auth.users). Tidak mengubah tabel lain.
-- Tabel tidak bisa dibaca atau ditulis langsung dari browser; semua lewat fungsi di bawah.
-- Akun dihapus (delete_my_account) -> riwayat ikut terhapus (on delete cascade).
-- =====================================================================

create table if not exists public.listen_history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  track_uri   text check (track_uri is null or char_length(track_uri) <= 80),
  title       text check (title is null or char_length(title) <= 200),
  played_ms   integer not null check (played_ms between 1000 and 7200000),
  listened_at timestamptz not null default now()
);
create index if not exists listen_history_user_idx on public.listen_history (user_id, listened_at desc);
alter table public.listen_history enable row level security;
revoke all on public.listen_history from anon, authenticated;

-- Catat satu lagu yang sudah didengar. Mengabaikan < 10 detik, dan membatasi 1 catatan / 15 detik dan 1000 / hari.
create or replace function public.catat_dengar(p_uri text, p_judul text, p_ms int)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if p_ms is null or p_ms < 10000 then return; end if;
  if exists (select 1 from public.listen_history where user_id = me and listened_at > now() - interval '15 seconds') then return; end if;
  if (select count(*) from public.listen_history where user_id = me and listened_at > now() - interval '1 day') >= 1000 then return; end if;
  insert into public.listen_history (user_id, track_uri, title, played_ms)
  values (me, left(nullif(trim(p_uri), ''), 80), left(nullif(trim(p_judul), ''), 200), least(p_ms, 7200000));
end $$;

-- Ringkasan + daftar terakhir milik sendiri. hari_ini dihitung menurut WIB.
create or replace function public.riwayat_dengar(p_limit int default 20)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); res jsonb;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  select jsonb_build_object(
    'total', count(*),
    'detik', coalesce(sum(played_ms) / 1000, 0),
    'hari_ini', count(*) filter (where listened_at >= date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'),
    'terakhir', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select title as judul, track_uri as uri, listened_at as at
        from public.listen_history where user_id = me
        order by listened_at desc limit greatest(1, least(coalesce(p_limit, 20), 1000))) x)
  ) into res
  from public.listen_history where user_id = me;
  return res;
end $$;

create or replace function public.hapus_riwayat_dengar()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  delete from public.listen_history where user_id = me;
end $$;

revoke all on function public.catat_dengar(text, text, int)   from public, anon;
revoke all on function public.riwayat_dengar(int)             from public, anon;
revoke all on function public.hapus_riwayat_dengar()          from public, anon;
grant execute on function public.catat_dengar(text, text, int) to authenticated;
grant execute on function public.riwayat_dengar(int)           to authenticated;
grant execute on function public.hapus_riwayat_dengar()        to authenticated;

-- Cek (opsional): select to_regprocedure('public.catat_dengar(text,text,int)') is not null;
