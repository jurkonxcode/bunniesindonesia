-- =====================================================================
-- NIFLAX v13: bersihkan data contoh + isi awal Tanya Jawab
-- Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run
-- Aman dijalankan ulang. Jalankan SETELAH supabase-schema.sql dan v10-tanya-jawab.sql.
--
-- SEBELUM RUN:
--   1. Masuk sekali ke situs Niflax dengan emailmu (supaya akunmu ada di database).
--   2. Ganti 'GANTI_DENGAN_EMAILMU' di BAGIAN B dengan emailmu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- BAGIAN A: hapus data contoh bawaan skema lama (berita, komunitas, komik palsu)
-- ---------------------------------------------------------------------
delete from public.news
 where url is null
   and source in ('Niflax Tekno', 'Niflax News', 'Niflax Bisnis', 'Niflax Sport', 'Niflax Bola');

delete from public.communities where slug in ('pecinta-kopi', 'programmer-id', 'traveler-id');
delete from public.comics where title in ('Langit Sembilan', 'Kota Tanpa Malam', 'Dapur Mak Ijah');

-- ---------------------------------------------------------------------
-- BAGIAN B: pertanyaan awal Tanya Jawab, ditulis atas nama "Tim Niflax"
-- Hanya pertanyaan, tanpa jawaban palsu dan tanpa akun palsu. Jawabannya dari pengguna sungguhan.
-- Trigger pembatas harian dimatikan sebentar (hanya di dalam transaksi ini), lalu dinyalakan lagi.
-- ---------------------------------------------------------------------
begin;
alter table public.questions disable trigger questions_prepare;

insert into public.questions (user_id, author_name, title, body, category, created_at)
select u.id, 'Tim Niflax', q.title, q.body, q.category, now() - (q.n || ' seconds')::interval
from (select id from auth.users where lower(email) = lower('GANTI_DENGAN_EMAILMU') limit 1) u
cross join (values
 (1,  'Umum',      'Bagaimana cara mengecek pajak kendaraan bermotor secara online?', 'Aku ingin tahu situs atau aplikasi resmi yang aman untuk cek tagihan pajak, dan data apa saja yang diperlukan.'),
 (2,  'Umum',      'Apa bedanya libur nasional dan cuti bersama?', 'Apakah perusahaan swasta wajib mengikuti cuti bersama, dan bagaimana hitungannya terhadap jatah cuti tahunan?'),
 (3,  'Umum',      'Bagaimana cara melaporkan SPT Tahunan lewat internet untuk karyawan?', 'Langkah-langkah dari awal sampai bukti lapor, dan dokumen apa yang perlu disiapkan dari kantor.'),
 (4,  'Umum',      'Apa yang harus dilakukan kalau KTP hilang?', 'Urutan pengurusannya, apakah perlu surat kehilangan dari kepolisian, dan berapa lama prosesnya.'),
 (5,  'Teknologi', 'Bagaimana cara mengamankan akun WhatsApp dari pembajakan?', 'Pengaturan apa saja yang sebaiknya diaktifkan, dan apa yang dilakukan kalau kode verifikasi terlanjur diberikan ke orang lain.'),
 (6,  'Teknologi', 'Bagaimana mengenali pesan penipuan yang mengatasnamakan bank atau kurir?', 'Ciri-ciri yang gampang dikenali, dan ke mana melapor kalau sudah terlanjur klik tautannya.'),
 (7,  'Teknologi', 'HP sering panas saat dipakai main game, penyebabnya apa dan bagaimana mengatasinya?', 'Apakah wajar, kapan perlu khawatir, dan kebiasaan apa yang membuat baterai lebih awet.'),
 (8,  'Teknologi', 'Apa bedanya RAM dan penyimpanan internal di ponsel?', 'Mana yang lebih berpengaruh ke kecepatan, dan bagaimana memilih kombinasi yang pas untuk pemakaian harian.'),
 (9,  'Ekonomi',   'Bagaimana cara memulai investasi reksa dana untuk pemula?', 'Jenis reksa dana apa yang cocok untuk modal kecil, dan bagaimana memilih aplikasi yang terdaftar resmi di OJK.'),
 (10, 'Ekonomi',   'Berapa besar dana darurat yang ideal untuk pekerja lajang?', 'Dihitung dari apa, disimpan di mana, dan kapan dana itu boleh dipakai.'),
 (11, 'Ekonomi',   'Bagaimana menyusun anggaran bulanan dengan gaji sekitar UMR?', 'Pembagian kebutuhan, tabungan, dan cicilan yang realistis untuk yang tinggal sendiri di kota besar.'),
 (12, 'Ekonomi',   'Apa bedanya tabungan emas dan membeli emas batangan?', 'Dari sisi biaya, keamanan, dan kemudahan dijual kembali.'),
 (13, 'Kuliner',   'Bagaimana agar nasi goreng tidak lembek dan wangi seperti buatan warung?', 'Jenis nasi, api, dan urutan memasukkan bumbu yang paling berpengaruh.'),
 (14, 'Kuliner',   'Bagaimana cara menyimpan cabai segar supaya tahan lama?', 'Perbandingan disimpan di kulkas, dibekukan, atau diolah jadi sambal dasar.'),
 (15, 'Kuliner',   'Apa beda soto Lamongan, soto Betawi, dan soto Kudus?', 'Dari kuah, isian, dan pelengkapnya.'),
 (16, 'Otomotif',  'Berapa interval ganti oli yang tepat untuk motor matic?', 'Apakah cukup mengikuti kilometer di buku servis atau tergantung pemakaian harian dan jenis oli.'),
 (17, 'Otomotif',  'Apa saja yang perlu dicek sebelum membeli motor bekas?', 'Dokumen, kondisi mesin, dan tanda-tanda bekas kecelakaan yang sering terlewat.'),
 (18, 'Otomotif',  'Aki mobil sering tekor, penyebabnya apa saja?', 'Kebiasaan pemakaian dan komponen yang perlu diperiksa sebelum memutuskan ganti aki.'),
 (19, 'Olahraga',  'Bagaimana cara memulai lari untuk pemula supaya tidak cedera?', 'Takaran awal, pemilihan sepatu, dan tanda-tanda tubuh perlu istirahat.'),
 (20, 'Olahraga',  'Bagaimana sistem promosi dan degradasi di liga sepak bola Indonesia?', 'Berapa tim yang naik dan turun tiap musim, dan bagaimana aturan kalau poin sama.')
) as q(n, category, title, body)
where not exists (select 1 from public.questions x where x.title = q.title);

alter table public.questions enable trigger questions_prepare;

-- Berhenti dan batalkan semuanya bila akunmu tidak ditemukan
do $$
begin
  if not exists (select 1 from public.questions where author_name = 'Tim Niflax') then
    raise exception 'Email tidak ditemukan di auth.users. Masuk dulu ke situs dengan email itu, lalu ulangi.';
  end if;
end $$;
commit;

-- Untuk menghapus pertanyaan awal ini kelak:
--   delete from public.questions where author_name = 'Tim Niflax';
