-- =====================================================================
-- BUNNIES INDONESIA v46: profil Bunnies lengkap, username @njz_, lokasi
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- Jalankan SETELAH v31-komentar-reaksi-bias.sql (butuh tabel profiles, blocked_users, set_bias).
--
-- Isi:
--   1. Kolom baru di profiles (username, bio, bunnies_sejak, lagu_favorit, lokasi, dll.)
--   2. Username otomatis dari nama email (bagian sebelum @), tampil sebagai @njz_<username>
--   3. Fungsi: my_profile, save_profile, cek_username, public_profile
--   4. Semua pengguna lama diberi username otomatis (backfill)
-- Prinsip yang sama dengan v31: tulis lewat fungsi security definer, user_id selalu dari auth.uid().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. KOLOM BARU
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists username        text,
  add column if not exists bio             text,
  add column if not exists bunnies_sejak   smallint,
  add column if not exists lagu_favorit    text,
  add column if not exists negara          text,
  add column if not exists wilayah         text,
  add column if not exists kota            text,
  add column if not exists lokasi_tampil   text    not null default 'sembunyi',
  add column if not exists profil_lengkap  boolean not null default false,
  add column if not exists updated_at      timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_username_fmt') then
    alter table public.profiles add constraint profiles_username_fmt
      check (username is null or username ~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_lokasi_tampil_check') then
    alter table public.profiles add constraint profiles_lokasi_tampil_check
      check (lokasi_tampil in ('sembunyi','negara','wilayah','kota'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_negara_check') then
    alter table public.profiles add constraint profiles_negara_check
      check (negara is null or negara in ('ID','KR','MY','SG','JP','AU','US','SA','TW','HK','VN','PH','TH','GB','DE','NL','XX'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_wilayah_fmt') then
    alter table public.profiles add constraint profiles_wilayah_fmt
      check (wilayah is null or wilayah ~ '^(id|kr)-[a-z]{2,12}$');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_teks_len') then
    alter table public.profiles add constraint profiles_teks_len
      check (char_length(coalesce(bio,'')) <= 160 and char_length(coalesce(lagu_favorit,'')) <= 60 and char_length(coalesce(kota,'')) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_sejak_check') then
    alter table public.profiles add constraint profiles_sejak_check
      check (bunnies_sejak is null or bunnies_sejak between 2022 and 2100);
  end if;
end $$;

-- Username unik (sudah selalu huruf kecil lewat constraint di atas)
create unique index if not exists profiles_username_uq on public.profiles (username);

-- ---------------------------------------------------------------------
-- 2. FUNGSI BANTU USERNAME
--    Handle publik = '@njz_' + username. Awalan '@njz_' tidak disimpan di database.
-- ---------------------------------------------------------------------
-- Bersihkan masukan: huruf kecil, buang '@' di depan dan awalan 'njz_' kalau pengguna mengetiknya sendiri.
create or replace function public.norm_username(p text)
returns text language sql immutable as $$
  select regexp_replace(regexp_replace(lower(btrim(coalesce(p, ''))), '^@', ''), '^njz_', '');
$$;

-- Nama yang dicadangkan (menyerupai tim, label, atau member).
create or replace function public.username_dicadangkan(p text)
returns boolean language sql immutable as $$
  select p in ('admin','administrator','moderator','mod','staff','support','system','official','resmi',
               'bunnies','bunnie','bunnies_id','bunniesindonesia','tim','tim_bunnies',
               'ador','hybe','newjeans','njz','minji','hanni','danielle','haerin','hyein');
$$;

-- Usulan username dari email: bagian sebelum '@', tanpa '+tag', karakter selain a-z 0-9 jadi '_', maks 20.
create or replace function public.username_dari_email(p_email text)
returns text language plpgsql immutable as $$
declare b text;
begin
  b := lower(split_part(coalesce(p_email, ''), '@', 1));
  b := split_part(b, '+', 1);
  b := regexp_replace(b, '[^a-z0-9_]+', '_', 'g');
  b := regexp_replace(b, '_+', '_', 'g');
  b := btrim(b, '_');
  if char_length(b) < 3 then b := btrim(b || '_bunnie', '_'); end if;
  b := btrim(left(b, 20), '_');
  return b;
end $$;

-- Jadikan unik: bila sudah dipakai atau dicadangkan, tambahkan 4 angka acak.
create or replace function public.username_unik(p_base text, p_me uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c text := p_base; i int := 0;
begin
  while public.username_dicadangkan(c)
        or exists (select 1 from public.profiles where username = c and id is distinct from p_me) loop
    i := i + 1;
    if i <= 40 then
      c := left(p_base, 16) || (floor(random() * 9000) + 1000)::int::text;
    else
      c := left(p_base, 10) || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    end if;
    exit when i > 80;
  end loop;
  return c;
end $$;

-- Penjaga di tabel: berlaku juga untuk tulis langsung lewat REST.
--  - INSERT tanpa username: dibuat otomatis dari email akun (ini yang membuat username otomatis saat daftar)
--  - UPDATE: username tidak boleh dikosongkan; bila diganti harus valid dan tidak dicadangkan
create or replace function public.profiles_penjaga()
returns trigger language plpgsql security definer set search_path = public as $$
declare em text;
begin
  if tg_op = 'INSERT' then
    if new.username is null then
      select email into em from auth.users where id = new.id;
      new.username := public.username_unik(public.username_dari_email(em), new.id);
    end if;
  elsif new.username is null then
    new.username := old.username;
  end if;

  if tg_op = 'INSERT' or new.username is distinct from old.username then
    new.username := public.norm_username(new.username);
    if new.username !~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$' then
      raise exception 'Username 3 sampai 20 karakter: huruf kecil, angka, dan garis bawah (_).';
    end if;
    if public.username_dicadangkan(new.username) then
      raise exception 'Username itu dicadangkan. Pilih yang lain.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_penjaga on public.profiles;
create trigger profiles_penjaga
  before insert or update on public.profiles
  for each row execute function public.profiles_penjaga();

-- ---------------------------------------------------------------------
-- 3. BACKFILL: semua akun lama dapat profil dan username
-- ---------------------------------------------------------------------
insert into public.profiles (id)
select u.id from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

do $$
declare r record;
begin
  for r in select p.id, u.email from public.profiles p left join auth.users u on u.id = p.id where p.username is null loop
    update public.profiles set username = public.username_unik(public.username_dari_email(r.email), r.id) where id = r.id;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. FUNGSI UNTUK BROWSER
-- ---------------------------------------------------------------------
-- Profil milik sendiri (semua kolom + usulan username dari email).
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
    'usul_username', public.username_dari_email(auth.jwt() ->> 'email')
  );
end $$;

-- Simpan profil. Hanya kunci yang dikirim yang diubah, jadi kolom bisa diperbarui satu per satu.
-- Kunci: username, bio, bunnies_sejak, lagu_favorit, negara, wilayah, kota, lokasi_tampil.
-- Teks kosong menghapus nilai. Mengembalikan profil terbaru.
create or replace function public.save_profile(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.profiles; t text;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if exists (select 1 from public.blocked_users where user_id = me) then
    raise exception 'Akunmu sedang dibatasi. Hubungi kami lewat halaman Kontak.';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'Data profil tidak valid.'; end if;

  insert into public.profiles (id) values (me) on conflict (id) do nothing;
  select * into r from public.profiles where id = me for update;

  if p ? 'username' then
    t := public.norm_username(p ->> 'username');
    if t is distinct from r.username then
      if t !~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$' then
        raise exception 'Username 3 sampai 20 karakter: huruf kecil, angka, dan garis bawah (_).';
      end if;
      if public.username_dicadangkan(t) then raise exception 'Username itu dicadangkan. Pilih yang lain.'; end if;
      if exists (select 1 from public.profiles where username = t and id <> me) then
        raise exception 'Username sudah dipakai. Coba yang lain.';
      end if;
      r.username := t;
    end if;
  end if;

  if p ? 'bio' then
    t := btrim(regexp_replace(coalesce(p ->> 'bio', ''), '[[:cntrl:]]', ' ', 'g'));
    if char_length(t) > 160 then raise exception 'Bio maksimal 160 huruf.'; end if;
    r.bio := nullif(t, '');
  end if;

  if p ? 'bunnies_sejak' then
    t := btrim(coalesce(p ->> 'bunnies_sejak', ''));
    if t = '' then r.bunnies_sejak := null;
    else
      if t !~ '^[0-9]{4}$' or t::int < 2022 or t::int > extract(year from now())::int then
        raise exception 'Tahun Bunnies sejak harus antara 2022 dan tahun ini.';
      end if;
      r.bunnies_sejak := t::int;
    end if;
  end if;

  if p ? 'lagu_favorit' then
    t := btrim(regexp_replace(coalesce(p ->> 'lagu_favorit', ''), '[[:cntrl:]]', ' ', 'g'));
    if char_length(t) > 60 then raise exception 'Lagu favorit maksimal 60 huruf.'; end if;
    r.lagu_favorit := nullif(t, '');
  end if;

  if p ? 'negara' then
    t := nullif(upper(btrim(coalesce(p ->> 'negara', ''))), '');
    if t is not null and t not in ('ID','KR','MY','SG','JP','AU','US','SA','TW','HK','VN','PH','TH','GB','DE','NL','XX') then
      raise exception 'Negara tidak dikenal.';
    end if;
    r.negara := t;
  end if;

  if p ? 'wilayah' then
    t := nullif(lower(btrim(coalesce(p ->> 'wilayah', ''))), '');
    if t is not null and t !~ '^(id|kr)-[a-z]{2,12}$' then raise exception 'Wilayah tidak dikenal.'; end if;
    r.wilayah := t;
  end if;
  -- wilayah hanya berlaku untuk Indonesia (id-) dan Korea Selatan (kr-) dan harus cocok dengan negaranya
  if r.wilayah is not null and (r.negara is null or r.negara not in ('ID','KR') or r.wilayah not like lower(r.negara) || '-%') then
    r.wilayah := null;
  end if;

  if p ? 'kota' then
    t := btrim(regexp_replace(coalesce(p ->> 'kota', ''), '[[:cntrl:]]', ' ', 'g'));
    if char_length(t) > 60 then raise exception 'Nama kota maksimal 60 huruf.'; end if;
    r.kota := nullif(t, '');
  end if;
  if r.negara is null then r.wilayah := null; r.kota := null; end if;

  if p ? 'lokasi_tampil' then
    t := coalesce(p ->> 'lokasi_tampil', 'sembunyi');
    if t not in ('sembunyi','negara','wilayah','kota') then raise exception 'Pilihan tampil lokasi tidak dikenal.'; end if;
    r.lokasi_tampil := t;
  end if;

  begin
    update public.profiles set
      username = r.username, bio = r.bio, bunnies_sejak = r.bunnies_sejak, lagu_favorit = r.lagu_favorit,
      negara = r.negara, wilayah = r.wilayah, kota = r.kota,
      lokasi_tampil = r.lokasi_tampil, profil_lengkap = true
    where id = me;
  exception when unique_violation then
    raise exception 'Username sudah dipakai. Coba yang lain.';
  end;
  return public.my_profile();
end $$;

-- Cek username saat mengetik: {ok, alasan, handle}.
create or replace function public.cek_username(p text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t text := public.norm_username(p);
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if t !~ '^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$' then
    return jsonb_build_object('ok', false, 'alasan', 'format', 'handle', '@njz_' || t);
  end if;
  if public.username_dicadangkan(t) then
    return jsonb_build_object('ok', false, 'alasan', 'dicadangkan', 'handle', '@njz_' || t);
  end if;
  if exists (select 1 from public.profiles where username = t and id <> me) then
    return jsonb_build_object('ok', false, 'alasan', 'dipakai', 'handle', '@njz_' || t);
  end if;
  return jsonb_build_object('ok', true, 'alasan', null, 'handle', '@njz_' || t);
end $$;

-- Profil publik: hanya kolom yang aman. Lokasi mengikuti pilihan lokasi_tampil pemilik
-- (sembunyi / negara / wilayah / kota). Email tidak pernah ikut.
create or replace function public.public_profile(p text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', x.username, 'handle', '@njz_' || x.username,
    -- nama tampil bawaan = bagian depan email, jadi disembunyikan (sama seperti aturan komentar di v31)
    'display_name', case when lower(coalesce(x.display_name, '')) = lower(split_part(coalesce((select u.email from auth.users u where u.id = x.id), ''), '@', 1))
                         then null else x.display_name end,
    'bias', x.bias, 'bio', x.bio,
    'bunnies_sejak', x.bunnies_sejak, 'lagu_favorit', x.lagu_favorit, 'bergabung', x.created_at,
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
-- 5. HAK AKSES
--    Semua tulis profil kini lewat fungsi. Tulis langsung dari browser dicabut supaya
--    aturan username dan lokasi tidak bisa dilewati. (Membaca profil sendiri tetap lewat RLS.)
-- ---------------------------------------------------------------------
revoke insert, update, delete on public.profiles from anon, authenticated;

revoke all on function public.norm_username(text)               from public, anon, authenticated;
revoke all on function public.username_dicadangkan(text)        from public, anon, authenticated;
revoke all on function public.username_dari_email(text)         from public, anon, authenticated;
revoke all on function public.username_unik(text, uuid)         from public, anon, authenticated;
revoke all on function public.profiles_penjaga()                from public, anon, authenticated;
revoke all on function public.my_profile()                      from public, anon;
revoke all on function public.save_profile(jsonb)               from public, anon;
revoke all on function public.cek_username(text)                from public, anon;
revoke all on function public.public_profile(text)              from public;
grant execute on function public.my_profile()                   to authenticated;
grant execute on function public.save_profile(jsonb)            to authenticated;
grant execute on function public.cek_username(text)             to authenticated;
grant execute on function public.public_profile(text)           to anon, authenticated;

-- Untuk membatalkan pencabutan tulis langsung (tidak disarankan):
--   grant insert, update, delete on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 6. PENGECEKAN CEPAT (jalankan manual setelah ini)
-- ---------------------------------------------------------------------
-- select count(*) filter (where username is null) as tanpa_username, count(*) as total from public.profiles;   -- tanpa_username harus 0
-- select username, '@njz_' || username as handle from public.profiles limit 10;
