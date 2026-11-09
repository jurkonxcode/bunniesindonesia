-- =====================================================================
-- BUNNIES INDONESIA v31: bias profil, komentar, dan reaksi (blog)
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- Jalankan SETELAH v19-blog.sql dan v26-moderasi.sql.
-- Semua tulis lewat fungsi (security definer). Tabel tidak bisa dibaca langsung dari browser.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BIAS: member favorit, disimpan di profil sendiri
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists bias text;
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.profiles'::regclass and conname = 'profiles_bias_check') then
    alter table public.profiles add constraint profiles_bias_check
      check (bias is null or bias in ('minji','hanni','danielle','haerin','hyein','all'));
  end if;
end $$;

create or replace function public.set_bias(p_bias text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if p_bias is not null and p_bias not in ('minji','hanni','danielle','haerin','hyein','all') then
    raise exception 'Pilihan bias tidak dikenal.';
  end if;
  insert into public.profiles (id, bias) values (me, p_bias)
  on conflict (id) do update set bias = excluded.bias;
end $$;

-- ---------------------------------------------------------------------
-- 2. KOMENTAR di tulisan blog
-- ---------------------------------------------------------------------
create table if not exists public.post_comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text,
  body        text not null check (char_length(body) between 1 and 1000),
  status      text not null default 'open' check (status in ('open','hidden')),
  created_at  timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
create index if not exists post_comments_user_idx on public.post_comments (user_id, created_at desc);
alter table public.post_comments enable row level security;   -- tanpa policy: hanya lewat fungsi

-- Tambah komentar. Nama tampil diambil dari profil (sama seperti tulisan).
create or replace function public.add_comment(p_post bigint, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nm text; em text; n int; b text; newid bigint;
begin
  if me is null then raise exception 'Masuk dulu untuk berkomentar.'; end if;
  if exists (select 1 from public.blocked_users where user_id = me) then
    raise exception 'Akunmu sedang dibatasi. Hubungi kami lewat halaman Kontak.';
  end if;
  b := btrim(regexp_replace(coalesce(p_body, ''), '[\x01-\x08\x0B\x0C\x0E-\x1F]', '', 'g'));
  if char_length(b) < 1 or char_length(b) > 1000 then
    raise exception 'Komentar 1 sampai 1000 huruf.';
  end if;
  if not exists (select 1 from public.posts where id = p_post and status = 'open') then
    raise exception 'Tulisan tidak ditemukan.';
  end if;
  select count(*) into n from public.post_comments
   where user_id = me and created_at > now() - interval '24 hours';
  if n >= 60 then raise exception 'Batas 60 komentar per hari tercapai. Coba lagi besok.'; end if;

  select display_name into nm from public.profiles where id = me;
  em := split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1);
  if nm is null or nm = '' or lower(nm) = lower(em) then nm := 'Pengguna'; end if;

  insert into public.post_comments (post_id, user_id, author_name, body)
  values (p_post, me, left(nm, 40), b)
  returning id into newid;
  return newid;
end $$;

-- Hapus komentar sendiri (atau admin).
create or replace function public.delete_comment(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  delete from public.post_comments
   where id = p_id and (user_id = me or exists (select 1 from public.admins where user_id = me));
  if not found then raise exception 'Komentar tidak ditemukan atau bukan milikmu.'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. REAKSI: suka / keren / lucu / haru, pada tulisan dan komentar
-- ---------------------------------------------------------------------
create table if not exists public.reactions (
  target_type text not null check (target_type in ('post','comment')),
  target_id   bigint not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('suka','keren','lucu','haru')),
  created_at  timestamptz not null default now(),
  primary key (target_type, target_id, user_id, kind)
);
alter table public.reactions enable row level security;   -- tanpa policy: hanya lewat fungsi

-- Ringkasan: jumlah per jenis + reaksi milik pengguna yang sedang masuk.
create or replace function public.reaction_summary(p_type text, p_id bigint)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'suka',  count(*) filter (where kind = 'suka'),
    'keren', count(*) filter (where kind = 'keren'),
    'lucu',  count(*) filter (where kind = 'lucu'),
    'haru',  count(*) filter (where kind = 'haru'),
    'mine',  coalesce((select jsonb_agg(r.kind)
                         from public.reactions r
                        where r.target_type = p_type and r.target_id = p_id
                          and r.user_id = auth.uid()), '[]'::jsonb)
  )
  from public.reactions
  where target_type = p_type and target_id = p_id;
$$;

-- Daftar komentar yang tampil. Tidak membuka user_id; hanya penanda "mine" untuk pemilik.
create or replace function public.list_comments(p_post bigint)
returns table (id bigint, author_name text, bias text, body text, created_at timestamptz, mine boolean, reactions jsonb)
language sql stable security definer set search_path = public as $$
  select c.id, c.author_name, p.bias, c.body, c.created_at,
         (c.user_id = auth.uid()),
         public.reaction_summary('comment', c.id)
    from public.post_comments c
    left join public.profiles p on p.id = c.user_id
   where c.post_id = p_post and c.status = 'open'
   order by c.created_at asc
   limit 200;
$$;

-- Nyalakan/matikan satu reaksi. Mengembalikan ringkasan terbaru.
create or replace function public.toggle_reaction(p_type text, p_id bigint, p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); ok boolean;
begin
  if me is null then raise exception 'Masuk dulu untuk bereaksi.'; end if;
  if exists (select 1 from public.blocked_users where user_id = me) then
    raise exception 'Akunmu sedang dibatasi.';
  end if;
  if p_kind not in ('suka','keren','lucu','haru') then raise exception 'Reaksi tidak dikenal.'; end if;
  if p_type = 'post' then
    ok := exists (select 1 from public.posts where id = p_id and status = 'open');
  elsif p_type = 'comment' then
    ok := exists (select 1 from public.post_comments where id = p_id and status = 'open');
  else
    raise exception 'Jenis tidak dikenal.';
  end if;
  if not ok then raise exception 'Konten tidak ditemukan.'; end if;

  if exists (select 1 from public.reactions
              where target_type = p_type and target_id = p_id and user_id = me and kind = p_kind) then
    delete from public.reactions
     where target_type = p_type and target_id = p_id and user_id = me and kind = p_kind;
  else
    insert into public.reactions (target_type, target_id, user_id, kind)
    values (p_type, p_id, me, p_kind);
  end if;
  return public.reaction_summary(p_type, p_id);
end $$;

-- Bersihkan reaksi dan laporan yatim saat konten dihapus.
create or replace function public.cleanup_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.reactions where target_type = 'post' and target_id = old.id;
  delete from public.reports   where target_type = 'post' and target_id = old.id;
  return old;
end $$;
drop trigger if exists posts_cleanup on public.posts;
create trigger posts_cleanup after delete on public.posts
  for each row execute function public.cleanup_post();

create or replace function public.cleanup_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.reactions where target_type = 'comment' and target_id = old.id;
  delete from public.reports   where target_type = 'comment' and target_id = old.id;
  return old;
end $$;
drop trigger if exists comments_cleanup on public.post_comments;
create trigger comments_cleanup after delete on public.post_comments
  for each row execute function public.cleanup_comment();

-- ---------------------------------------------------------------------
-- 4. LAPORAN untuk komentar (menambah jenis 'comment' ke aturan v26)
-- ---------------------------------------------------------------------
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.reports'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%target_type%'
  loop
    execute format('alter table public.reports drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('question','answer','post','comment'));

create or replace function public.check_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; ok boolean;
begin
  if auth.uid() is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  new.user_id := auth.uid();
  new.status := 'baru';
  new.handled_at := null;
  select count(*) into n from public.reports where user_id = new.user_id and created_at > now() - interval '24 hours';
  if n >= 30 then raise exception 'Batas laporan harian tercapai. Coba lagi besok.'; end if;
  if new.target_type = 'question' then
    ok := exists (select 1 from public.questions where id = new.target_id and status = 'open');
  elsif new.target_type = 'answer' then
    ok := exists (select 1 from public.answers where id = new.target_id and status = 'open');
  elsif new.target_type = 'comment' then
    ok := exists (select 1 from public.post_comments where id = new.target_id and status = 'open');
  else
    ok := exists (select 1 from public.posts where id = new.target_id and status = 'open');
  end if;
  if not ok then raise exception 'Konten tidak ditemukan.'; end if;
  return new;
end $$;

-- 3 laporan BARU dari 3 pengguna berbeda menyembunyikan konten (termasuk komentar).
create or replace function public.apply_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.reports
   where target_type = new.target_type and target_id = new.target_id and status = 'baru';
  if n >= 3 then
    if new.target_type = 'question' then update public.questions set status = 'hidden' where id = new.target_id;
    elsif new.target_type = 'answer' then update public.answers   set status = 'hidden' where id = new.target_id;
    elsif new.target_type = 'comment' then update public.post_comments set status = 'hidden' where id = new.target_id;
    else update public.posts set status = 'hidden' where id = new.target_id; end if;
  end if;
  return null;
end $$;

-- ---------------------------------------------------------------------
-- 5. Izin: hanya lewat fungsi yang didaftarkan di sini
-- ---------------------------------------------------------------------
revoke all on function public.set_bias(text)                         from public, anon;
revoke all on function public.add_comment(bigint, text)              from public, anon;
revoke all on function public.delete_comment(bigint)                 from public, anon;
revoke all on function public.toggle_reaction(text, bigint, text)    from public, anon;
revoke all on function public.list_comments(bigint)                  from public;
revoke all on function public.reaction_summary(text, bigint)         from public;
grant execute on function public.set_bias(text)                      to authenticated;
grant execute on function public.add_comment(bigint, text)           to authenticated;
grant execute on function public.delete_comment(bigint)              to authenticated;
grant execute on function public.toggle_reaction(text, bigint, text) to authenticated;
grant execute on function public.list_comments(bigint)               to anon, authenticated;
grant execute on function public.reaction_summary(text, bigint)      to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Cek hasil (opsional): semua baris harus true
-- ---------------------------------------------------------------------
-- select to_regclass('public.post_comments') is not null as komentar_ada,
--        to_regclass('public.reactions') is not null as reaksi_ada,
--        to_regprocedure('public.toggle_reaction(text,bigint,text)') is not null as toggle_ada;
