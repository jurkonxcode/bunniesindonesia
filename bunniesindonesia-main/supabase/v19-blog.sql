-- =====================================================================
-- NIFLAX v19: Blog (tulisan pengguna, mirip Blog Naver)
-- Supabase Dashboard > SQL Editor > New query > tempel > Run. Aman dijalankan ulang.
-- =====================================================================
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text,
  title       text not null check (char_length(title) between 5 and 150),
  body        text not null check (char_length(body) between 20 and 20000),
  category    text not null default 'Umum'
              check (category in ('Umum','Teknologi','Ekonomi','Kuliner','Otomotif','Olahraga','Hiburan','Catatan harian')),
  status      text not null default 'open' check (status in ('open','hidden')),
  created_at  timestamptz not null default now()
);
create index if not exists posts_list_idx on public.posts (status, created_at desc);
create index if not exists posts_user_idx on public.posts (user_id, created_at desc);

create or replace function public.prepare_blog_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; nm text; em text;
begin
  new.user_id := auth.uid();
  if new.user_id is null then raise exception 'Masuk dulu untuk melanjutkan.'; end if;
  select display_name into nm from profiles where id = new.user_id;
  em := split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1);
  if nm is null or nm = '' or lower(nm) = lower(em) then nm := 'Pengguna'; end if;
  new.author_name := left(nm, 40);
  new.status := 'open';
  select count(*) into n from posts where user_id = new.user_id and created_at > now() - interval '24 hours';
  if n >= 10 then raise exception 'Batas 10 tulisan per hari tercapai. Coba lagi besok.'; end if;
  return new;
end $$;
drop trigger if exists posts_prepare on public.posts;
create trigger posts_prepare before insert on public.posts for each row execute function public.prepare_blog_post();

alter table public.posts enable row level security;
drop policy if exists "posts read"   on public.posts;
drop policy if exists "posts insert" on public.posts;
drop policy if exists "posts delete" on public.posts;
create policy "posts read"   on public.posts for select to anon, authenticated using (status = 'open');
create policy "posts insert" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "posts delete" on public.posts for delete to authenticated using (user_id = auth.uid());
