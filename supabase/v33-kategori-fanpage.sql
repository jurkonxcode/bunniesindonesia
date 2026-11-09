-- v33: kategori fanpage (keputusan pemilik): info, diskusi, fanart, musik, video, event, umum.
-- Berlaku untuk tabel posts (Blog) dan questions (Tanya Jawab).
-- Aman dijalankan ulang. Semua baris lama (Kuliah, Kerja, Teknologi, dst.) dipindah ke 'umum'.
-- Jalankan di Supabase: SQL Editor > New query > tempel seluruh isi file ini > Run.

begin;

-- 1. Hapus constraint kategori lama (nama dicari dari pg_constraint, jadi tidak perlu ditebak).
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as t, c.conname as n
    from pg_constraint c
    where c.contype = 'c'
      and c.conrelid in ('public.posts'::regclass, 'public.questions'::regclass)
      and pg_get_constraintdef(c.oid) ilike '%category%'
  loop
    execute format('alter table %s drop constraint %I', r.t, r.n);
  end loop;
end $$;

-- 2. Pindahkan data lama ke 'umum' (yang sudah memakai slug baru tidak disentuh).
update public.posts     set category = 'umum'
  where category not in ('info','diskusi','fanart','musik','video','event','umum');
update public.questions set category = 'umum'
  where category not in ('info','diskusi','fanart','musik','video','event','umum');

-- 3. Default baru dan constraint baru.
alter table public.posts     alter column category set default 'umum';
alter table public.questions alter column category set default 'umum';

alter table public.posts     add constraint posts_category_check
  check (category in ('info','diskusi','fanart','musik','video','event','umum'));
alter table public.questions add constraint questions_category_check
  check (category in ('info','diskusi','fanart','musik','video','event','umum'));

commit;

-- Cek hasil (opsional):
-- select category, count(*) from public.posts group by 1 order by 2 desc;
-- select category, count(*) from public.questions group by 1 order by 2 desc;
-- select conrelid::regclass, conname, pg_get_constraintdef(oid) from pg_constraint
--   where conname in ('posts_category_check','questions_category_check');
