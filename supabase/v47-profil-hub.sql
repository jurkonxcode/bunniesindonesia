-- =====================================================================
-- BUNNIES INDONESIA v47: profil sebagai hub (tahap 1)
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- Jalankan SETELAH v46-profil-username.sql.
--   1. Kolom socials (tautan sosial media, hanya domain resmi yang diizinkan)
--   2. Fungsi save_socials
--   3. my_profile dan public_profile ikut mengembalikan socials dan statistik (tulisan, komentar)
-- =====================================================================

alter table public.profiles add column if not exists socials jsonb not null default '{}'::jsonb;

-- Hanya platform dan domain ini yang boleh disimpan. Subdomain (mis. m.youtube.com) juga diterima.
create or replace function public.socials_izin()
returns jsonb language sql immutable as $$
  select '{"instagram":["instagram.com"],"x":["x.com","twitter.com"],"tiktok":["tiktok.com"],
           "youtube":["youtube.com","youtu.be"],"weverse":["weverse.io"],"spotify":["open.spotify.com"]}'::jsonb
$$;

create or replace function public.save_socials(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); k text; v text; host text; cocok boolean; out jsonb := '{}'::jsonb;
begin
  if me is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if exists (select 1 from public.blocked_users where user_id = me) then
    raise exception 'Akunmu sedang dibatasi. Hubungi kami lewat halaman Kontak.';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'Data sosial media tidak valid.'; end if;

  for k in select jsonb_object_keys(p) loop
    if not (public.socials_izin() ? k) then raise exception 'Platform tidak dikenal.'; end if;
    v := btrim(coalesce(p ->> k, ''));
    if v = '' then continue; end if;
    if char_length(v) > 200 or v !~* '^https://' then
      raise exception 'Tautan harus diawali https:// dan dari situs resmi platform.';
    end if;
    host := regexp_replace(lower(substring(v from '^https://([^/?#]+)')), '^www\.', '');
    select exists (select 1 from jsonb_array_elements_text(public.socials_izin() -> k) d
                    where host = d or host like '%.' || d)
      into cocok;
    if not cocok then raise exception 'Tautan harus diawali https:// dan dari situs resmi platform.'; end if;
    out := out || jsonb_build_object(k, v);
  end loop;

  insert into public.profiles (id) values (me) on conflict (id) do nothing;
  update public.profiles set socials = out, updated_at = now() where id = me;
  return public.my_profile();
end $$;

-- ---------------------------------------------------------------------
-- my_profile dan public_profile: definisi v46 + socials + statistik
-- ---------------------------------------------------------------------
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
    'socials', r.socials,
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
    'socials', x.socials,
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
-- Hak akses
-- ---------------------------------------------------------------------
revoke all on function public.socials_izin()        from public, anon;
revoke all on function public.save_socials(jsonb)   from public, anon;
grant execute on function public.socials_izin()     to anon, authenticated;
grant execute on function public.save_socials(jsonb) to authenticated;
grant execute on function public.my_profile()        to authenticated;
grant execute on function public.public_profile(text) to anon, authenticated;

-- Cek (opsional): harus true
-- select to_regprocedure('public.save_socials(jsonb)') is not null;
