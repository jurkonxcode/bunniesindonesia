-- NIFLAX v28: wedge Indonesia - Asia Timur. Tambah 6 kategori + 24 pertanyaan awal (tanpa jawaban palsu).
-- Jalankan setelah v10, v19, v13. Ganti GANTI_DENGAN_EMAILMU. Aman dijalankan ulang.
do $$ declare r record; begin
  for r in select c.conrelid::regclass t, c.conname n from pg_constraint c
    where c.contype='c' and c.conrelid in ('public.questions'::regclass,'public.posts'::regclass) and pg_get_constraintdef(c.oid) ilike '%category%'
  loop execute format('alter table %s drop constraint %I', r.t, r.n); end loop;
end $$;
alter table public.questions add constraint questions_category_check check (category in ('Kuliah','Kerja','Visa','Bahasa','Budaya','Hidup di sana','Umum','Teknologi','Ekonomi','Kuliner','Otomotif','Olahraga'));
alter table public.posts add constraint posts_category_check check (category in ('Kuliah','Kerja','Visa','Bahasa','Budaya','Hidup di sana','Umum','Teknologi','Ekonomi','Kuliner','Otomotif','Olahraga','Hiburan','Catatan harian'));
begin;
alter table public.questions disable trigger questions_prepare;
insert into public.questions (user_id, author_name, title, body, category, created_at)
select u.id, 'Tim Niflax', q.title, q.body, q.category, now() - (q.n || ' seconds')::interval
from (select id from auth.users where lower(email) = lower('GANTI_DENGAN_EMAILMU') limit 1) u
cross join (values
 (1, 'Kuliah', 'Apa saja syarat dan tahapan beasiswa KGSP untuk S1 dan S2?', 'Dokumen, jadwal pendaftaran, dan tips lolos seleksi berkas.'),
 (2, 'Kuliah', 'Bagaimana memilih antara kuliah di Korea dan Jepang untuk jurusan teknik?', 'Dari biaya hidup, bahasa pengantar, dan peluang kerja setelah lulus.'),
 (3, 'Kuliah', 'Berapa skor TOPIK yang dibutuhkan untuk masuk universitas di Korea?', 'Perbedaan syarat kelas bahasa dan kelas jurusan.'),
 (4, 'Kuliah', 'Bagaimana cara mendapatkan beasiswa MEXT dari Indonesia?', 'Jalur kedutaan dan jalur universitas, serta persiapan ujiannya.'),
 (5, 'Kerja', 'Bagaimana alur seleksi EPS-TOPIK untuk bekerja di Korea?', 'Dari ujian bahasa, pendaftaran, sampai penempatan, dan lembaga resmi yang mengurusnya.'),
 (6, 'Kerja', 'Bagaimana membedakan lembaga penyalur tenaga kerja resmi dan calo?', 'Ciri-ciri yang perlu diwaspadai dan cara mengecek legalitasnya.'),
 (7, 'Kerja', 'Berapa kisaran gaji dan biaya hidup pekerja di Korea atau Jepang?', 'Gaji pokok, lembur, potongan, dan berapa yang realistis ditabung.'),
 (8, 'Kerja', 'Apa itu program Specified Skilled Worker di Jepang dan siapa yang bisa ikut?', 'Bidang pekerjaan, ujian keterampilan, dan syarat bahasa.'),
 (9, 'Visa', 'Dokumen apa saja untuk visa pelajar Jepang dari Indonesia?', 'Daftar berkas dan lama proses di kedutaan.'),
 (10, 'Visa', 'Bagaimana cara mengurus visa D-2 untuk kuliah di Korea?', 'Berkas, bukti keuangan, dan waktu pengurusan.'),
 (11, 'Visa', 'Apa perbedaan visa turis dan visa kerja untuk Asia Timur?', 'Kegiatan yang boleh dan tidak boleh dilakukan di masing-masing visa.'),
 (12, 'Visa', 'Bagaimana cara memperpanjang izin tinggal saat sudah di Korea atau Jepang?', 'Kapan mulai mengurus dan dokumen yang biasa diminta.'),
 (13, 'Bahasa', 'Bagaimana cara belajar Hangul dari nol dalam sebulan?', 'Urutan belajar huruf, bunyi, dan latihan harian yang realistis.'),
 (14, 'Bahasa', 'Apa perbedaan N5 sampai N1 pada JLPT dan mana yang cukup untuk kerja?', 'Gambaran kemampuan tiap level.'),
 (15, 'Bahasa', 'Aplikasi atau kursus apa yang efektif untuk belajar bahasa Korea secara mandiri?', 'Pengalaman memakai aplikasi gratis dan kursus daring.'),
 (16, 'Bahasa', 'Bagaimana cara belajar kanji supaya tidak mudah lupa?', 'Metode pengulangan dan cara menghafal pasangan bacaan.'),
 (17, 'Budaya', 'Apa saja etika sehari-hari di Korea yang sering membuat pendatang canggung?', 'Cara menyapa, makan bersama, dan hubungan dengan senior.'),
 (18, 'Budaya', 'Bagaimana menjalankan ibadah dan mencari makanan halal di Jepang?', 'Tempat ibadah, restoran, dan cara membaca label bahan.'),
 (19, 'Budaya', 'Apa beda budaya kerja di Korea, Jepang, dan Indonesia?', 'Jam kerja, rapat, dan hubungan dengan atasan.'),
 (20, 'Budaya', 'Bagaimana mengatasi culture shock di bulan pertama tinggal di luar negeri?', 'Pengalaman dan kebiasaan yang membantu.'),
 (21, 'Hidup di sana', 'Berapa biaya hidup bulanan mahasiswa di Seoul dibanding Tokyo?', 'Sewa, makan, transportasi, dan pengeluaran tak terduga.'),
 (22, 'Hidup di sana', 'Bagaimana cara membuka rekening bank dan mengurus kartu penduduk sebagai pendatang?', 'Dokumen dan urutan pengurusan setelah tiba.'),
 (23, 'Hidup di sana', 'Bagaimana cara mencari tempat tinggal murah di Korea atau Jepang?', 'Jenis hunian, uang jaminan, dan situs yang bisa dipercaya.'),
 (24, 'Hidup di sana', 'Bagaimana mengurus asuransi kesehatan sebagai mahasiswa atau pekerja asing?', 'Siapa yang wajib ikut dan cara memakainya.')
) as q(n, category, title, body)
where not exists (select 1 from public.questions x where x.title = q.title);
alter table public.questions enable trigger questions_prepare;
commit;
