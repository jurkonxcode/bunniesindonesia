-- =====================================================================
-- NIFLAX v10: Tanya Jawab (pertanyaan, jawaban, laporan)
-- Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
-- Aman dijalankan ulang. Jalankan SETELAH supabase-schema.sql.
-- =====================================================================

create table if not exists public.questions (
  id             bigint generated always as identity primary key,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name    text,
  title          text not null check (char_length(title) between 10 and 200),
  body           text check (body is null or char_length(body) <= 3000),
  category       text not null default 'Umum'
                 check (category in ('Umum','Teknologi','Ekonomi','Kuliner','Otomotif','Olahraga')),
  status         text not null default 'open' check (status in ('open','hidden')),
  answer_count   int  not null default 0,
  best_answer_id bigint,
  created_at     timestamptz not null default now()
);
create index if not exists questions_list_idx on public.questions (status, created_at desc);
create index if not exists questions_cat_idx  on public.questions (category, created_at desc);

create table if not exists public.answers (
  id          bigint generated always as identity primary key,
  question_id bigint not null references public.questions (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text,
  body        text not null check (char_length(body) between 2 and 3000),
  status      text not null default 'open' check (status in ('open','hidden')),
  created_at  timestamptz not null default now()
);
create index if not exists answers_q_idx on public.answers (question_id, created_at);

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('question','answer')),
  target_id   bigint not null,
  reason      text not null check (reason in ('spam','sara','porno','pribadi','lainnya')),
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

-- ---------------------------------------------------------------------
-- Sebelum simpan: paksa user_id, isi nama penulis, batasi per hari
-- ---------------------------------------------------------------------
create or replace function public.prepare_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; nm text; em text;
begin
  new.user_id := auth.uid();
  if new.user_id is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;

  select display_name into nm from profiles where id = new.user_id;
  em := split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1);
  -- jangan tampilkan bagian depan email ke publik
  if nm is null or nm = '' or lower(nm) = lower(em) then nm := 'Pengguna'; end if;
  new.author_name := left(nm, 40);
  new.status := 'open';

  if tg_table_name = 'questions' then
    select count(*) into n from questions where user_id = new.user_id and created_at > now() - interval '24 hours';
    if n >= 10 then raise exception 'Batas 10 pertanyaan per hari tercapai. Coba lagi besok.'; end if;
    new.answer_count := 0;
    new.best_answer_id := null;
  else
    select count(*) into n from answers where user_id = new.user_id and created_at > now() - interval '24 hours';
    if n >= 50 then raise exception 'Batas 50 jawaban per hari tercapai. Coba lagi besok.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists questions_prepare on public.questions;
create trigger questions_prepare before insert on public.questions
  for each row execute function public.prepare_post();
drop trigger if exists answers_prepare on public.answers;
create trigger answers_prepare before insert on public.answers
  for each row execute function public.prepare_post();

-- ---------------------------------------------------------------------
-- Jaga answer_count dan best_answer_id tetap benar
-- ---------------------------------------------------------------------
create or replace function public.refresh_answer_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare qid bigint := coalesce(new.question_id, old.question_id);
begin
  update questions
     set answer_count = (select count(*) from answers where question_id = qid and status = 'open')
   where id = qid;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.status = 'hidden') then
    update questions set best_answer_id = null where id = qid and best_answer_id = coalesce(old.id, new.id);
  end if;
  return null;
end $$;

drop trigger if exists answers_count on public.answers;
create trigger answers_count after insert or delete or update of status on public.answers
  for each row execute function public.refresh_answer_count();

-- Hanya penanya yang boleh memilih jawaban terbaik
create or replace function public.pick_best_answer(p_question bigint, p_answer bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  if not exists (select 1 from questions where id = p_question and user_id = auth.uid()) then
    raise exception 'Hanya penanya yang bisa memilih jawaban terbaik.';
  end if;
  if not exists (select 1 from answers where id = p_answer and question_id = p_question and status = 'open') then
    raise exception 'Jawaban tidak ditemukan.';
  end if;
  update questions set best_answer_id = p_answer where id = p_question;
end $$;
revoke all on function public.pick_best_answer(bigint, bigint) from public;
grant execute on function public.pick_best_answer(bigint, bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Moderasi: 3 laporan dari 3 pengguna berbeda menyembunyikan konten.
-- Admin meninjau di Table Editor (ubah status kembali ke 'open' bila keliru).
-- ---------------------------------------------------------------------
create or replace function public.apply_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from reports where target_type = new.target_type and target_id = new.target_id;
  if n >= 3 then
    if new.target_type = 'question' then update questions set status = 'hidden' where id = new.target_id;
    else update answers set status = 'hidden' where id = new.target_id; end if;
  end if;
  return null;
end $$;

drop trigger if exists reports_apply on public.reports;
create trigger reports_apply after insert on public.reports
  for each row execute function public.apply_report();

-- ---------------------------------------------------------------------
-- Keamanan (RLS). Tidak ada policy UPDATE: konten tidak bisa diedit diam-diam.
-- ---------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.answers   enable row level security;
alter table public.reports   enable row level security;   -- tanpa policy SELECT: laporan tidak terbaca dari browser

drop policy if exists "questions read"   on public.questions;
drop policy if exists "questions insert" on public.questions;
drop policy if exists "questions delete" on public.questions;
create policy "questions read"   on public.questions for select to anon, authenticated using (status = 'open');
create policy "questions insert" on public.questions for insert to authenticated with check (user_id = auth.uid());
create policy "questions delete" on public.questions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "answers read"   on public.answers;
drop policy if exists "answers insert" on public.answers;
drop policy if exists "answers delete" on public.answers;
create policy "answers read"   on public.answers for select to anon, authenticated using (status = 'open');
create policy "answers insert" on public.answers for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.questions q where q.id = question_id and q.status = 'open'));
create policy "answers delete" on public.answers for delete to authenticated using (user_id = auth.uid());

drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert to authenticated with check (user_id = auth.uid());
