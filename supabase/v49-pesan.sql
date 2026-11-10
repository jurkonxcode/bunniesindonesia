-- =====================================================================
-- BUNNIES INDONESIA v49: profil publik terhubung, pesan langsung (DM)
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- Jalankan SETELAH v47-profil-hub.sql.
--   1. Opsi terima_pesan (bawaan MATI). DM hanya bisa dikirim ke yang sudah mengaktifkannya.
--   2. Tabel dm_threads, dm_messages, dm_reports (tanpa akses langsung dari browser).
--   3. Fungsi: set_terima_pesan, kirim_pesan, daftar_pesan, baca_pesan, lapor_pesan.
--   4. list_comments dan my_profile/public_profile ikut mengembalikan username (untuk tautan profil).
--   5. penulis_username: pemetaan id penulis -> username untuk tautan di daftar tulisan.
-- Pemblokiran: blocked_users dicek dua arah. Pengirim atau penerima yang diblokir tidak bisa DM.
-- =====================================================================

alter table public.profiles add column if not exists terima_pesan boolean not null default false;

create table if not exists public.dm_threads (
  id      bigint generated always as identity primary key,
  a       uuid not null references auth.users (id) on delete cascade,
  b       uuid not null references auth.users (id) on delete cascade,
  last_at timestamptz not null default now(),
  check (a < b),
  unique (a, b)
);
create table if not exists public.dm_messages (
  id         bigint generated always as identity primary key,
  thread_id  bigint not null references public.dm_threads (id) on delete cascade,
  sender     uuid not null references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  status     text not null default 'open' check (status in ('open','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at);
create index if not exists dm_messages_sender_idx on public.dm_messages (sender, created_at desc);
create table if not exists public.dm_reports (
  message_id bigint not null references public.dm_messages (id) on delete cascade,
  reporter   uuid not null references auth.users (id) on delete cascade,
  alasan     text,
  created_at timestamptz not null default now(),
  primary key (message_id, reporter)
);
alter table public.dm_threads  enable row level security;
alter table public.dm_messages enable row level security;
alter table public.dm_reports  enable row level security;

-- ---------------------------------------------------------------------
-- Opsi terima pesan
-- ---------------------------------------------------------------------
create or replace function public.set_terima_pesan(p boolean)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  insert into public.profiles (id, terima_pesan) values (me, coalesce(p, false))
  on conflict (id) do update set terima_pesan = excluded.terima_pesan, updated_at = now();
end $$;

-- ---------------------------------------------------------------------
-- Kirim pesan. Mengembalikan id percakapan.
-- ---------------------------------------------------------------------
create or replace function public.kirim_pesan(p_username text, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); tgt uuid; txt text; n int; tid bigint;
begin
  if me is null then raise exception 'Masuk dulu untuk mengirim pesan.'; end if;
  if exists (select 1 from public.blocked_users where user_id = me) then
    raise exception 'Akunmu sedang dibatasi. Hubungi kami lewat halaman Kontak.';
  end if;
  txt := btrim(regexp_replace(coalesce(p_body, ''), '[\x01-\x08\x0B\x0C\x0E-\x1F]', '', 'g'));
  if char_length(txt) < 1 or char_length(txt) > 1000 then raise exception 'Pesan 1 sampai 1000 huruf.'; end if;

  select x.id into tgt from public.profiles x where x.username = public.norm_username(p_username);
  if tgt is null then raise exception 'Pengguna tidak ditemukan.'; end if;
  if tgt = me then raise exception 'Kamu tidak bisa mengirim pesan ke dirimu sendiri.'; end if;
  if exists (select 1 from public.blocked_users where user_id = tgt) then
    raise exception 'Pesan tidak bisa dikirim ke pengguna ini.';
  end if;
  if exists (select 1 from public.blocked_users where user_id = tgt) or not exists (
      select 1 from public.profiles where id = tgt and terima_pesan) then
    raise exception 'Pengguna ini belum menerima pesan.';
  end if;

  select count(*) into n from public.dm_messages where sender = me and created_at > now() - interval '10 minutes';
  if n >= 10 then raise exception 'Terlalu banyak pesan dalam 10 menit. Coba lagi sebentar lagi.'; end if;
  select count(*) into n from public.dm_messages where sender = me and created_at > now() - interval '24 hours';
  if n >= 100 then raise exception 'Batas 100 pesan per hari tercapai. Coba lagi besok.'; end if;

  insert into public.dm_threads (a, b) values (least(me, tgt), greatest(me, tgt))
  on conflict (a, b) do update set last_at = now()
  returning id into tid;
  insert into public.dm_messages (thread_id, sender, body) values (tid, me, txt);
  return tid;
end $$;

-- Daftar percakapan. Percakapan dengan pihak yang saling diblokir tidak ditampilkan.
create or replace function public.daftar_pesan()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.last_at desc), '[]'::jsonb) from (
    select t.id, t.last_at,
           lawan.username,
           (select m.body from public.dm_messages m
             where m.thread_id = t.id and m.status = 'open' order by m.created_at desc limit 1) as terakhir
      from public.dm_threads t
      join lateral (select case when t.a = auth.uid() then t.b else t.a end as id) o on true
      join public.profiles lawan on lawan.id = o.id
     where (t.a = auth.uid() or t.b = auth.uid())
       and not exists (select 1 from public.blocked_users b where b.user_id in (t.a, t.b))
  ) x;
$$;

-- Isi percakapan (hanya peserta). Pesan tersembunyi tidak ikut.
create or replace function public.baca_pesan(p_thread bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); t public.dm_threads; lawan_user text; hasil jsonb;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  select * into t from public.dm_threads where id = p_thread;
  if not found or me not in (t.a, t.b) then raise exception 'Percakapan tidak ditemukan.'; end if;
  if exists (select 1 from public.blocked_users where user_id in (t.a, t.b)) then
    raise exception 'Percakapan ini tidak tersedia.';
  end if;
  select username into lawan_user from public.profiles where id = case when t.a = me then t.b else t.a end;
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'mine', m.sender = me, 'body', m.body, 'at', m.created_at)
                            order by m.created_at), '[]'::jsonb)
    into hasil from public.dm_messages m where m.thread_id = p_thread and m.status = 'open';
  return jsonb_build_object('lawan', lawan_user, 'pesan', hasil);
end $$;

-- Laporkan satu pesan dari lawan bicara. 3 laporan dari 3 orang berbeda menyembunyikan pesan.
create or replace function public.lapor_pesan(p_message bigint, p_alasan text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t public.dm_threads; s uuid; n int;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  select th.* into t from public.dm_threads th join public.dm_messages m on m.thread_id = th.id where m.id = p_message;
  if not found or me not in (t.a, t.b) then raise exception 'Pesan tidak ditemukan.'; end if;
  select sender into s from public.dm_messages where id = p_message;
  if s = me then raise exception 'Kamu tidak bisa melaporkan pesanmu sendiri.'; end if;
  insert into public.dm_reports (message_id, reporter, alasan)
  values (p_message, me, left(coalesce(p_alasan, ''), 300))
  on conflict (message_id, reporter) do nothing;
  select count(*) into n from public.dm_reports where message_id = p_message;
  if n >= 3 then update public.dm_messages set status = 'hidden' where id = p_message; end if;
end $$;

-- ---------------------------------------------------------------------
-- Username ikut di komentar, profil, dan pemetaan penulis
-- ---------------------------------------------------------------------
drop function if exists public.list_comments(bigint);
create function public.list_comments(p_post bigint)
returns table (id bigint, author_name text, username text, bias text, body text, created_at timestamptz, mine boolean, reactions jsonb)
language sql stable security definer set search_path = public as $$
  select c.id, c.author_name, p.username, p.bias, c.body, c.created_at,
         (c.user_id = auth.uid()),
         public.reaction_summary('comment', c.id)
    from public.post_comments c
    left join public.profiles p on p.id = c.user_id
   where c.post_id = p_post and c.status = 'open'
   order by c.created_at asc
   limit 200;
$$;

create or replace function public.penulis_username(p_ids uuid[])
returns table (id uuid, username text)
language sql stable security definer set search_path = public as $$
  select x.id, x.username from public.profiles x
   where x.id = any(p_ids) and x.username is not null
     and not exists (select 1 from public.blocked_users b where b.user_id = x.id);
$$;

-- my_profile dan public_profile: definisi v47 + terima_pesan
create or replace function public.my_profile()
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.profiles;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  insert into public.profiles (id) values (me) on conflict (id) do nothing;
  select * into r from public.profiles where id = me;
  return jsonb_build_object(
    'username', r.username, 'handle', '@njz_' || r.username,
    'display_name', r.display_name, 'bias', r.bias, 'bio', r.bio,
    'bunnies_sejak', r.bunnies_sejak, 'lagu_favorit', r.lagu_favorit,
    'negara', r.negara, 'wilayah', r.wilayah, 'kota', r.kota, 'lokasi_tampil', r.lokasi_tampil,
    'profil_lengkap', r.profil_lengkap, 'bergabung', r.created_at,
    'socials', r.socials, 'terima_pesan', r.terima_pesan,
    'tulisan', (select count(*) from public.posts p where p.user_id = me and p.status = 'open'),
    'komentar', (select count(*) from public.post_comments c where c.user_id = me and c.status = 'open'),
    'usul_username', public.username_dari_email(auth.jwt() ->> 'email')
  );
end $$;

create or replace function public.public_profile(p text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', x.username, 'handle', '@njz_' || x.username,
    'display_name', case when lower(coalesce(x.display_name, '')) = lower(split_part(coalesce((select u.email from auth.users u where u.id = x.id), ''), '@', 1))
                         then null else x.display_name end,
    'bias', x.bias, 'bio', x.bio,
    'bunnies_sejak', x.bunnies_sejak, 'lagu_favorit', x.lagu_favorit, 'bergabung', x.created_at,
    'socials', x.socials, 'terima_pesan', x.terima_pesan,
    'tulisan', (select count(*) from public.posts q where q.user_id = x.id and q.status = 'open'),
    'komentar', (select count(*) from public.post_comments c where c.user_id = x.id and c.status = 'open'),
    'lokasi', case when x.lokasi_tampil = 'sembunyi' or x.negara is null then null else jsonb_build_object(
        'negara', x.negara,
        'wilayah', case when x.lokasi_tampil in ('wilayah','kota') then x.wilayah end,
        'kota',    case when x.lokasi_tampil = 'kota' then x.kota end) end
  )
  from public.profiles x
  where x.username = public.norm_username(p)
    and not exists (select 1 from public.blocked_users b where b.user_id = x.id);
$$;

-- ---------------------------------------------------------------------
-- Hak akses: hanya lewat fungsi
-- ---------------------------------------------------------------------
revoke all on function public.set_terima_pesan(boolean)  from public, anon;
revoke all on function public.kirim_pesan(text, text)    from public, anon;
revoke all on function public.daftar_pesan()             from public, anon;
revoke all on function public.baca_pesan(bigint)         from public, anon;
revoke all on function public.lapor_pesan(bigint, text)  from public, anon;
revoke all on function public.list_comments(bigint)      from public;
revoke all on function public.penulis_username(uuid[])   from public, anon, authenticated;
revoke all on function public.my_profile()               from public, anon;
revoke all on function public.public_profile(text)       from public;
grant execute on function public.set_terima_pesan(boolean) to authenticated;
grant execute on function public.kirim_pesan(text, text)   to authenticated;
grant execute on function public.daftar_pesan()            to authenticated;
grant execute on function public.baca_pesan(bigint)        to authenticated;
grant execute on function public.lapor_pesan(bigint, text) to authenticated;
grant execute on function public.list_comments(bigint)     to anon, authenticated;
grant execute on function public.penulis_username(uuid[])  to anon, authenticated;
grant execute on function public.my_profile()              to authenticated;
grant execute on function public.public_profile(text)      to anon, authenticated;

-- Cek (opsional): harus true
-- select to_regprocedure('public.kirim_pesan(text,text)') is not null and to_regprocedure('public.penulis_username(uuid[])') is not null;
