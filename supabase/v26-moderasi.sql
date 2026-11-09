-- =====================================================================
-- NIFLAX v26: admin, moderasi, blokir pengguna, hapus akun, ekspor data
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- Jalankan SETELAH v10-tanya-jawab.sql dan v19-blog.sql.
-- Langkah terakhir (bagian 9) menjadikan emailmu admin.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabel admin, blokir, dan catatan tindakan. RLS aktif TANPA policy:
--    tidak bisa dibaca/ditulis langsung dari browser, hanya lewat fungsi di bawah.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.blocked_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  reason     text,
  blocked_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.mod_log (
  id          bigint generated always as identity primary key,
  admin_id    uuid,
  action      text not null,
  target_type text,
  target_id   bigint,
  note        text,
  created_at  timestamptz not null default now()
);
alter table public.admins        enable row level security;
alter table public.blocked_users enable row level security;
alter table public.mod_log       enable row level security;

-- ---------------------------------------------------------------------
-- 2. Laporan: tambah jenis 'post' (tulisan blog), status, dan waktu ditangani
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
  check (target_type in ('question','answer','post'));
alter table public.reports add column if not exists status text not null default 'baru';
alter table public.reports add column if not exists handled_at timestamptz;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.reports'::regclass and conname = 'reports_status_check') then
    alter table public.reports add constraint reports_status_check check (status in ('baru','selesai'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Pengecekan admin
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Tidak punya akses.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. Penjaga sebelum simpan: akun terblokir tidak bisa menulis/melapor,
--    laporan dibatasi 30 per hari dan hanya untuk konten yang ada dan tampil.
--    Nama diawali "aa_" agar jalan SEBELUM trigger *_prepare yang lama.
-- ---------------------------------------------------------------------
create or replace function public.check_not_blocked()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.blocked_users where user_id = auth.uid()) then
    raise exception 'Akunmu sedang dibatasi. Hubungi kami lewat halaman Kontak.';
  end if;
  return new;
end $$;

drop trigger if exists aa_not_blocked on public.questions;
create trigger aa_not_blocked before insert on public.questions for each row execute function public.check_not_blocked();
drop trigger if exists aa_not_blocked on public.answers;
create trigger aa_not_blocked before insert on public.answers   for each row execute function public.check_not_blocked();
drop trigger if exists aa_not_blocked on public.posts;
create trigger aa_not_blocked before insert on public.posts     for each row execute function public.check_not_blocked();
drop trigger if exists aa_not_blocked on public.reports;
create trigger aa_not_blocked before insert on public.reports   for each row execute function public.check_not_blocked();

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
  else
    ok := exists (select 1 from public.posts where id = new.target_id and status = 'open');
  end if;
  if not ok then raise exception 'Konten tidak ditemukan.'; end if;
  return new;
end $$;

drop trigger if exists reports_check on public.reports;
create trigger reports_check before insert on public.reports for each row execute function public.check_report();

-- 3 laporan BARU dari 3 pengguna berbeda menyembunyikan konten (sekarang termasuk tulisan blog).
-- Laporan yang sudah ditangani admin (status 'selesai') tidak ikut dihitung lagi.
create or replace function public.apply_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.reports
   where target_type = new.target_type and target_id = new.target_id and status = 'baru';
  if n >= 3 then
    if new.target_type = 'question' then update public.questions set status = 'hidden' where id = new.target_id;
    elsif new.target_type = 'answer' then update public.answers   set status = 'hidden' where id = new.target_id;
    else update public.posts set status = 'hidden' where id = new.target_id; end if;
  end if;
  return null;
end $$;
drop trigger if exists reports_apply on public.reports;
create trigger reports_apply after insert on public.reports
  for each row execute function public.apply_report();

-- ---------------------------------------------------------------------
-- 5. Fungsi admin (semua memanggil require_admin)
-- ---------------------------------------------------------------------
-- Antrean konten. p_view: 'laporan' (ada laporan baru) | 'tersembunyi' | 'terbaru' (semua, terbaru dulu)
create or replace function public.admin_queue(p_view text default 'laporan', p_limit int default 30, p_offset int default 0)
returns table (ttype text, tid bigint, title text, body text, author_name text, user_id uuid,
               cstatus text, rcount int, reasons text, created_at timestamptz, qid bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.require_admin();
  return query
  with c as (
    select 'post'::text as ttype, p.id as tid, p.title as title, left(p.body, 400) as body, p.author_name as author_name,
           p.user_id as user_id, p.status as cstatus, p.created_at as created_at, null::bigint as qid
      from public.posts p
    union all
    select 'question', q.id, q.title, left(coalesce(q.body, ''), 400), q.author_name, q.user_id, q.status, q.created_at, null::bigint
      from public.questions q
    union all
    select 'answer', a.id, null::text, left(a.body, 400), a.author_name, a.user_id, a.status, a.created_at, a.question_id
      from public.answers a
  ), r as (
    select rp.target_type as tt, rp.target_id as ti, count(*)::int as n,
           string_agg(distinct rp.reason, ', ') as reasons, max(rp.created_at) as last_at
      from public.reports rp where rp.status = 'baru' group by rp.target_type, rp.target_id
  )
  select c.ttype, c.tid, c.title, c.body, c.author_name, c.user_id, c.cstatus,
         coalesce(r.n, 0), r.reasons, c.created_at, c.qid
    from c left join r on r.tt = c.ttype and r.ti = c.tid
   where case p_view
           when 'laporan'     then coalesce(r.n, 0) > 0
           when 'tersembunyi' then c.cstatus = 'hidden'
           else true end
   order by case p_view when 'laporan' then r.last_at else c.created_at end desc
   limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end $$;

-- Tindakan: sembunyikan | tampilkan | hapus | abaikan (tutup laporan) | blokir (penulisnya)
create or replace function public.admin_act(p_type text, p_id bigint, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid; st text;
begin
  perform public.require_admin();
  if p_type not in ('post','question','answer') then raise exception 'Jenis konten tidak dikenal.'; end if;
  if p_action not in ('sembunyikan','tampilkan','hapus','abaikan','blokir') then raise exception 'Aksi tidak dikenal.'; end if;

  if p_type = 'post' then select user_id into uid from public.posts where id = p_id;
  elsif p_type = 'question' then select user_id into uid from public.questions where id = p_id;
  else select user_id into uid from public.answers where id = p_id; end if;
  if uid is null then raise exception 'Konten tidak ditemukan.'; end if;

  if p_action in ('sembunyikan','tampilkan') then
    st := case when p_action = 'sembunyikan' then 'hidden' else 'open' end;
    if p_type = 'post' then update public.posts set status = st where id = p_id;
    elsif p_type = 'question' then update public.questions set status = st where id = p_id;
    else update public.answers set status = st where id = p_id; end if;
    update public.reports set status = 'selesai', handled_at = now()
     where target_type = p_type and target_id = p_id and status = 'baru';
  elsif p_action = 'abaikan' then
    update public.reports set status = 'selesai', handled_at = now()
     where target_type = p_type and target_id = p_id and status = 'baru';
  elsif p_action = 'hapus' then
    if p_type = 'question' then
      delete from public.reports where target_type = 'answer'
        and target_id in (select id from public.answers where question_id = p_id);
    end if;
    delete from public.reports where target_type = p_type and target_id = p_id;
    if p_type = 'post' then delete from public.posts where id = p_id;
    elsif p_type = 'question' then delete from public.questions where id = p_id;
    else delete from public.answers where id = p_id; end if;
  else  -- blokir
    if exists (select 1 from public.admins where user_id = uid) then raise exception 'Admin tidak bisa diblokir.'; end if;
    insert into public.blocked_users (user_id, reason, blocked_by) values (uid, left(p_note, 200), auth.uid())
    on conflict (user_id) do nothing;
  end if;

  insert into public.mod_log (admin_id, action, target_type, target_id, note)
  values (auth.uid(), p_action, p_type, p_id, left(p_note, 200));
end $$;

create or replace function public.admin_blocked()
returns table (user_id uuid, display_name text, reason text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.require_admin();
  return query
  select b.user_id, coalesce(p.display_name, '(tanpa nama)'), b.reason, b.created_at
    from public.blocked_users b left join public.profiles p on p.id = b.user_id
   order by b.created_at desc limit 100;
end $$;

create or replace function public.admin_unblock(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  delete from public.blocked_users where user_id = p_user;
  insert into public.mod_log (admin_id, action, note) values (auth.uid(), 'buka_blokir', p_user::text);
end $$;

create or replace function public.admin_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  return jsonb_build_object(
    'laporan',     (select count(*) from (select 1 from public.reports where status = 'baru' group by target_type, target_id) x),
    'tersembunyi', (select count(*) from public.posts where status = 'hidden')
                 + (select count(*) from public.questions where status = 'hidden')
                 + (select count(*) from public.answers where status = 'hidden'),
    'tulisan',     (select count(*) from public.posts),
    'pertanyaan',  (select count(*) from public.questions),
    'jawaban',     (select count(*) from public.answers),
    'pengguna',    (select count(*) from public.profiles),
    'diblokir',    (select count(*) from public.blocked_users)
  );
end $$;

-- ---------------------------------------------------------------------
-- 6. Fungsi pengguna: ubah nama tampil, unduh data, hapus akun
-- ---------------------------------------------------------------------
create or replace function public.set_display_name(p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n text;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  n := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', '', 'g'));
  if char_length(n) < 2 or char_length(n) > 40 then raise exception 'Nama tampil 2 sampai 40 huruf.'; end if;
  if lower(n) in ('admin','administrator','moderator','bunnies','tim bunnies','bunnies indonesia') and not public.is_admin() then
    raise exception 'Nama itu dicadangkan. Pilih nama lain.';
  end if;
  insert into public.profiles (id, display_name) values (me, n)
  on conflict (id) do update set display_name = excluded.display_name;
end $$;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  return jsonb_build_object(
    'diekspor_pada', now(),
    'akun',        jsonb_build_object('id', me, 'email', auth.jwt() ->> 'email'),
    'profil',      (select to_jsonb(p) from public.profiles p where p.id = me),
    'tulisan',     coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.posts x where x.user_id = me), '[]'::jsonb),
    'pertanyaan',  coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.questions x where x.user_id = me), '[]'::jsonb),
    'jawaban',     coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.answers x where x.user_id = me), '[]'::jsonb),
    'laporan_dikirim', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.reports x where x.user_id = me), '[]'::jsonb)
  );
end $$;

-- Hapus akun: menghapus baris di auth.users; semua tulisan, pertanyaan, jawaban, laporan,
-- dan profil milik pengguna ikut terhapus lewat "on delete cascade".
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if exists (select 1 from public.admins where user_id = me) and (select count(*) from public.admins) = 1 then
    raise exception 'Kamu satu-satunya admin. Tambahkan admin lain dulu sebelum menghapus akun.';
  end if;
  delete from auth.users where id = me;
end $$;

-- ---------------------------------------------------------------------
-- 7. Izin eksekusi: hanya pengguna yang sudah masuk (bukan anon)
-- ---------------------------------------------------------------------
revoke all on function public.require_admin()                         from public, anon, authenticated;
revoke all on function public.is_admin()                              from public, anon;
revoke all on function public.admin_queue(text, int, int)             from public, anon;
revoke all on function public.admin_act(text, bigint, text, text)     from public, anon;
revoke all on function public.admin_blocked()                         from public, anon;
revoke all on function public.admin_unblock(uuid)                     from public, anon;
revoke all on function public.admin_stats()                           from public, anon;
revoke all on function public.set_display_name(text)                  from public, anon;
revoke all on function public.export_my_data()                        from public, anon;
revoke all on function public.delete_my_account()                     from public, anon;
grant execute on function public.is_admin()                           to authenticated;
grant execute on function public.admin_queue(text, int, int)          to authenticated;
grant execute on function public.admin_act(text, bigint, text, text)  to authenticated;
grant execute on function public.admin_blocked()                      to authenticated;
grant execute on function public.admin_unblock(uuid)                  to authenticated;
grant execute on function public.admin_stats()                        to authenticated;
grant execute on function public.set_display_name(text)               to authenticated;
grant execute on function public.export_my_data()                     to authenticated;
grant execute on function public.delete_my_account()                  to authenticated;

-- ---------------------------------------------------------------------
-- 8. Cek hasil (opsional): semua baris harus true
-- ---------------------------------------------------------------------
-- select to_regclass('public.admins') is not null as admins_ada,
--        to_regprocedure('public.admin_act(text,bigint,text,text)') is not null as admin_act_ada;

-- ---------------------------------------------------------------------
-- 9. JADIKAN DIRIMU ADMIN (wajib, sekali). Masuk ke situs dulu agar akunmu ada.
--    Ganti emailnya, hapus tanda "--" di depan, lalu jalankan baris ini saja.
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id) select id from auth.users where email = 'GANTI_DENGAN_EMAILMU' on conflict do nothing;
