-- =====================================================================
-- NIFLAX v17: pembersihan berita lama (jaga ukuran database gratis)
-- Jalankan di Supabase > SQL Editor. Aman diulang.
-- Berita yang sedang disimpan pengguna (saved_news) TIDAK pernah dihapus.
-- =====================================================================
create or replace function public.bersihkan_berita(p_hari int default 30)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.news nw
  where nw.published_at < now() - make_interval(days => greatest(p_hari, 7))
    and not exists (select 1 from public.saved_news s where s.news_id = nw.id);
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.bersihkan_berita(int) from public, anon, authenticated;

-- Jadwal harian (pukul 03:00 WIB = 20:00 UTC). Aktifkan dulu di Dashboard > Database > Extensions > pg_cron.
-- Hapus tanda komentar dua baris di bawah setelah pg_cron aktif:
-- select cron.unschedule('bersihkan-berita') where exists (select 1 from cron.job where jobname = 'bersihkan-berita');
-- select cron.schedule('bersihkan-berita', '0 20 * * *', $$select public.bersihkan_berita(30)$$);

-- Cek jumlah berita per kategori (untuk melihat klasifikasi berjalan baik):
-- select category, count(*) from public.news group by 1 order by 2 desc;
