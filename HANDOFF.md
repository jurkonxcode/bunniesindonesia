# Bunnies Indonesia: Dokumen Handoff

Terakhir diperbarui: 9 November 2026, rilis v35.
Tujuan dokumen: siapa pun (pemilik, developer lain, atau sesi Claude baru) bisa melanjutkan fanpage ini tanpa bertanya ulang. Tempel dokumen ini di awal sesi baru bersama zip repo terbaru.

---

## 1. Ringkasan

**Bunnies Indonesia** adalah fanpage NewJeans tidak resmi untuk penggemar Indonesia (Bunnies). Isinya: blog penggemar, Tanya Jawab, dan (mulai v31) komentar, reaksi, serta bias profil.

- **Bukan afiliasi resmi.** Tidak berafiliasi dengan ADOR, NewJeans, atau label mana pun. Teks tentang ini ada di beranda, Tentang, dan footer. Jangan mengubah kesan ini.
- **Pemilik:** akun GitHub `jurkonxcode`. Repo bernama `bunniesindonesia`. Alamat: `https://jurkonxcode.github.io/bunniesindonesia/`. Domain belum dibeli.
- **Stack:** HTML, CSS, dan JavaScript murni (tanpa framework, tanpa build step) di GitHub Pages. Backend Supabase untuk database, login, dan penyimpanan. Frontend memanggil REST dan RPC Supabase lewat `fetch` langsung, tanpa library.
- **Lingkungan kerja pemilik:** GitHub Codespaces, sering dibuka dari HP. Tampilan harus nyaman di layar HP dulu (uji di 390px).
- **Bahasa antarmuka:** Indonesia, santai tapi jelas. Kalimat aktif. Huruf kecil kecuali awal kalimat.
- **Maskot dan identitas:** Bunbun (kelinci putih bertelinga merah muda di kotak biru denim), dibuat sendiri dan sengaja berbeda dari maskot resmi. Warna biru `#2f6fe4` dan merah muda `#e0488a`.

## 2. Aturan konten dan hukum (baca dulu)

- **Jangan memakai** foto, logo, lirik, atau materi resmi NewJeans/ADOR tanpa izin tertulis. Jika ingin, cari izin atau gunakan tautan ke sumber resmi saja.
- **Foto member** (jika suatu saat dipakai) adalah hak publisitas dan hak cipta pihak lain. Anggap tidak boleh dipakai sampai ada izin.
- **Isi pengguna:** tulisan, komentar, dan jawaban adalah konten pengguna. Moderasi sudah ada (lihat bagian 6). Jangan menerbitkan kutipan lirik panjang dari pihak mana pun.
- **Teks hukum** (Privasi, Syarat) sudah diganti nama, tetapi **isinya masih draf dan belum ditinjau ahli hukum**. Wajib ditinjau sebelum pendaftaran dibuka umum.
- **Data pribadi:** sesuai UU PDP. Sudah ada unduh data dan hapus akun di halaman Akun saya.
- **Kontak:** masih lewat GitHub Issues (`tentang.html`, `privasi.html`). Ganti dengan email kontak sungguhan sebelum publik.
- **Kunci rahasia:** `service_role` tidak boleh masuk repo atau frontend. Kunci di `js/config.js` adalah publishable/anon key. Aman dipublikasikan **selama RLS aktif**.

## 3. Struktur repo

```
index.html              beranda (kerangka tanpa style/script inline)
blog.html               blog: daftar, detail, komentar, reaksi (v19, v31)
tanya.html              Tanya Jawab (v10)
akun.html               Akun saya: nama, bias, unduh data, keluar, hapus akun (v26, v31)
admin.html              panel admin, moderasi laporan (v26)
search.html             hasil pencarian (v8)
layanan.html            semua layanan + pintasan (v11)
tentang.html, privasi.html, syarat.html, brand.html   halaman statis
css/
  tokens.css            warna dan variabel (ubah warna di sini)
  base.css, identity.css, nav.css, naver.css, home.css, portal.css, asia.css ...
  komentar.css          komentar, reaksi, chip bias (v31)
  admin.css, auth.css, tanya.css, search.css, static.css ...
js/
  config.js             SUPABASE_URL dan SUPABASE_ANON_KEY
  data.js, services.js  data statis (kota, libur, daftar layanan)
  state.js              state global + $ dan esc()
  api.js, auth.js, ui.js, main.js, menu.js, nav.js, suggest.js, sholat.js, tools.js ...  beranda
  blog.js               halaman blog (mandiri)
  tanya.js              halaman Tanya Jawab (mandiri)
  sesi.js               sesi + rest() + rpc() bersama, untuk akun dan admin
  akun.js, admin.js     halaman akun dan admin
  bias.js               daftar member untuk bias (v31)
  share.js              tombol bagikan
supabase/               file SQL, lihat bagian 4
tools/build-static.mjs  membuat halaman statis untuk SEO (lihat bagian 7)
.github/workflows/pages.yml   terbitkan halaman statis lewat Actions
assets/brand/, assets/icons/  logo, maskot, ikon
HANDOFF.md, README.md
```

**Aturan urutan (penting):**
1. Urutan `<script>` di setiap HTML harus dipertahankan. `config.js` dulu, `state.js` sesudahnya. `bias.js` setelah `state.js` (memakai `esc()`). Di `index.html`, `auth.js` dimuat sebelum `ui.js`.
2. Halaman mandiri (`blog`, `tanya`, `akun`, `admin`) tidak memuat `auth.js` (yang terikat ke beranda). Mereka membaca sesi dari localStorage `bunnies.session`.
3. Jangan memuat `sesi.js` bersama `tanya.js` atau `blog.js` di halaman yang sama (nama variabel bentrok).
4. Urutan `<link>` CSS juga penting. `komentar.css` dimuat setelah `share.css`.
5. Teks dari database **wajib** lewat `esc()` sebelum masuk `innerHTML`.
6. Alamat tanpa `.html` (`/blog`, `/akun`) berfungsi di GitHub Pages. Tulis tautan tanpa garis miring di akhir.

**Cache:** semua tag `<link>` dan `<script>` di HTML memakai `?v=NN`. **Naikkan NN di semua HTML tiap rilis**, supaya HP tidak menyajikan file lama:
untuk rilis berikutnya (ganti angkanya): `sed -i 's/?v=[0-9][0-9]*/?v=33/g' *.html`

## 4. Supabase

### 4.1 Urutan file SQL

Jalankan di Supabase, SQL Editor, satu per satu. Semua aman diulang.

1. `supabase/supabase-schema.sql`: skema utama (profiles, saved_news, dan tabel lama).
2. `supabase/v10-tanya-jawab.sql`: questions, answers, reports.
3. `supabase/v19-blog.sql`: posts.
4. `supabase/v26-moderasi.sql`: admin, blokir, laporan blog, akun saya. Di bagian 9 ada baris untuk menjadikanmu admin (ganti email, hapus `--`).
5. `supabase/v28-asia-timur.sql`: kategori Asia Timur. **Catatan:** kategori ini berasal dari arah lama (portal Asia Timur) dan belum sesuai fanpage. Lihat bagian 10.
6. `supabase/v31-komentar-reaksi-bias.sql`: bias, komentar, reaksi, laporan komentar.

File lama yang tidak lagi dipakai: `v13-bersih-dan-seed.sql`, `v17-bersihkan-berita.sql`, dan kolom/tabel `news`, `saved_news`, `search_all`, `search_news`. Boleh dibiarkan.

### 4.2 Pengaturan Auth (sekali)
- URL Configuration: Site URL dan Redirect URLs = `https://jurkonxcode.github.io/bunniesindonesia/` dan `.../**`.
- Google provider: aktifkan dan isi Client ID dan Secret dari Google Cloud Console.
- Email template Magic Link memuat `{{ .Token }}` agar email berisi kode 6 digit.
- Email bawaan Supabase punya batas kirim. Untuk umum, pasang SMTP sendiri.

### 4.3 Prinsip keamanan database
- **Setiap tabel baru wajib** `enable row level security`.
- Tabel yang dibaca lewat fungsi saja (tanpa policy SELECT): `post_comments`, `reactions`, `reports`, `searches`, `admins`, `blocked_users`, `mod_log`.
- Tulis lewat fungsi `security definer` yang memaksa `user_id` dari `auth.uid()`. Jangan pernah mempercayai `user_id` dari browser.
- Fungsi `security definer` dicabut dari `anon` dan `public`, lalu diberi `grant` yang eksplisit.

## 5. Status fitur

| Bagian | Status |
|---|---|
| Beranda (umpan kartu, bilah tab, baris layanan, kolom samping) | Berfungsi. Isinya sebagian besar berasal dari sisa portal lama dan perlu disesuaikan ke fanpage (lihat bagian 10) |
| Blog: daftar, detail, tulis, hapus milik sendiri, laporkan | Berfungsi |
| **Komentar** di tulisan blog (v31) | Berfungsi, diuji dengan data tiruan |
| **Reaksi** (Suka, Keren, Lucu, Haru) pada tulisan dan komentar (v31) | Berfungsi, diuji dengan data tiruan |
| **Bias profil** (v31): pilih member di Akun saya, tampil sebagai chip di komentar | Berfungsi, diuji dengan data tiruan |
| Tanya Jawab (tanya, jawab, pilih jawaban terbaik, laporkan) | Berfungsi |
| Pencarian (`search.html`) | Mencari Blog dan Tanya Jawab |
| Login Google dan kode email | Berfungsi |
| Akun saya: nama, bias, unduh data, keluar, hapus akun | Berfungsi |
| Panel admin: antrean laporan tulisan, pertanyaan, jawaban; blokir; buka blokir | Berfungsi. **Belum menampilkan komentar** (lihat bagian 10) |
| Halaman statis untuk SEO (`dist/`, sitemap) | Berfungsi. Komentar dan reaksi tidak ikut ke halaman statis |
| Berita, kurs, cuaca, sholat, libur, layanan | Sisa dari portal lama. Tidak relevan untuk fanpage. Sebaiknya dipangkas (lihat bagian 10) |

## 5a. Fokus fanpage (v32): fitur portal lama disembunyikan

Yang tampil sekarang hanya Beranda, Tanya Jawab, Blog, komentar, reaksi, bias, dan Akun saya. Yang lain **disembunyikan, tidak dihapus**, supaya bisa dikembalikan.

- **Disembunyikan lewat `css/fokus.css`** (dimuat paling akhir di semua HTML): ticker, layanan (`#svr`), cuaca, kalender, gempa, ujian bahasa, kurs, alat harian (`#alat`), mini strip, tren, tab kategori, dropdown kategori tulis, tombol menu layanan (burger), footer "Layanan".
- **Diubah di JavaScript:** `BC` di `js/ui.js` dikosongkan (tile dan tag kategori beranda hilang). Menu atas di `js/nav.js` hanya tiga tab. Pilihan kategori di form tulis (`blog.js`, `tanya.js`) hanya "Umum".
- **Masih ada tapi tidak terlihat:** halaman `layanan.html`, `tentang`, dan alat harian. Bisa dibuka lewat alamat langsung. Skrip cuaca, kurs, dan gempa masih berjalan di latar belakang dan memanggil API luar.
- **Cara menampilkan lagi:** hapus baris `<link ... css/fokus.css ...>` dari HTML yang diinginkan. Untuk kategori dan tab menu, kembalikan perubahan di `BC`, `nav.js`, dan `blog.js`/`tanya.js` (lihat catatan v32 di kodenya).
- **Kategori fanpage belum ditentukan.** Setelah itu ditetapkan, isi `BC` dan daftar kategori di `blog.js` dan `tanya.js`, lalu ubah constraint kategori di database (lihat bagian 10 nomor 1).

## 5b. Brand skin (v34)

- `css/brand-skin.css` (dimuat sebelum `fokus.css`): lapisan visual "soft blue" dari BunniesID_BrandKit. Hero bergradasi langit, stiker melayang, kartu dan tombol lebih lembut, footer bermaskot garis, empty state bermaskot.
- Dekorasi orisinal di `assets/brand/decor/` (hati, kilau, bintang, planet, awan, kelinci garis). **Logo dan favicon tidak diubah.**
- `visual-direction.png` hanya referensi mood. Foto member di dalamnya **tidak** dipakai di situs (hak cipta). Pasang foto hanya jika ada izin tertulis.
- Mengembalikan tampilan lama: hapus baris `<link ... css/brand-skin.css ...>` dari HTML.
- **v35, Putar lagu:** bagian `#musik` di `index.html` memuat embed Spotify (playlist `37i9dQZF1DWVGwK1DVdGDJ`). Ganti ID di atribut `src` iframe dan tautan "Buka di Spotify" untuk mengganti playlist. Playlist harus publik. Catatan cookie Spotify sudah ditambahkan di `privasi.html`.

## 6. Komentar, reaksi, dan bias (v31)

### 6.1 Ringkasan
- **Komentar** hanya ada di tulisan blog (`posts`). Tidak ada komentar di pertanyaan atau jawaban.
- **Reaksi:** empat jenis, `suka`, `keren`, `lucu`, `haru`. Satu pengguna boleh menyalakan beberapa jenis pada satu target, tetapi tiap jenis hanya sekali. Klik lagi untuk mematikan.
- **Bias:** pilihan member per akun (`minji`, `hanni`, `danielle`, `haerin`, `hyein`, `all`), atau kosong ("Belum pilih"). Disimpan di `profiles.bias`. Tampil sebagai chip di samping nama penulis komentar.

### 6.2 Fungsi database (semua di `v31-komentar-reaksi-bias.sql`)

| Fungsi | Siapa | Kegunaan |
|---|---|---|
| `add_comment(p_post, p_body)` | masuk | Menambah komentar. Nama tampil dari profil, batas 60 per 24 jam, 1 sampai 1000 huruf, cek tulisan terbuka dan akun tidak diblokir |
| `delete_comment(p_id)` | masuk | Hapus milik sendiri, atau admin |
| `list_comments(p_post)` | publik | Daftar komentar terbuka dengan nama, bias, isi, jumlah reaksi, dan `mine`. **Tidak** membuka `user_id` |
| `reaction_summary(p_type, p_id)` | publik | Jumlah per jenis dan `mine` (reaksi milik pengguna yang sedang masuk) |
| `toggle_reaction(p_type, p_id, p_kind)` | masuk | Nyalakan atau matikan satu reaksi, mengembalikan ringkasan terbaru |
| `set_bias(p_bias)` | masuk | Simpan bias. Nilai harus salah satu dari daftar member atau `null` |

Trigger `cleanup_post` dan `cleanup_comment` menghapus reaksi dan laporan yatim saat konten dihapus. Penghapusan tulisan juga menghapus komentarnya lewat `on delete cascade`.

### 6.3 Moderasi
- **Laporan komentar:** tombol Laporkan di setiap komentar milik orang lain. Dicatat di `reports` dengan `target_type = 'comment'`.
- **Auto-sembunyi:** 3 laporan `baru` dari 3 pengguna berbeda menyembunyikan komentar (`status = 'hidden'`). Sama seperti tulisan dan jawaban.
- **Admin:** panel `/admin` **belum** menampilkan komentar. Untuk sementara, admin bisa melihat komentar dan laporannya lewat Table Editor: tabel `post_comments` (kolom `status`) dan `reports` (`target_type = 'comment'`, `status = 'baru'`). Untuk mengembalikan, ubah `status` ke `open`. Untuk menghapus, hapus barisnya.
- **Blokir:** akun yang diblokir tidak bisa berkomentar dan bereaksi (dicek di fungsi).

### 6.4 Yang tidak dilakukan (sengaja)
- Tidak ada komentar bertingkat (balasan di dalam balasan). Hanya urutan waktu.
- Tidak ada edit komentar. Pengguna hapus dan tulis ulang.
- Tidak ada notifikasi ke penulis tulisan atau komentar.
- Bias **tidak** tampil di tulisan blog, hanya di komentar. Tidak ada halaman profil publik.

## 7. Deploy dan kerja harian

**Pasang pembaruan dari zip di Codespaces:**
```bash
unzip -o <nama>.zip
cp -r <folder>/. .
rm -rf <folder> <nama>.zip
git add -A && git commit -m "pesan" && git pull --rebase && git push
```
Jika `git push` ditolak ("fetch first"), jalankan `git pull --rebase` dulu. **Jangan** pakai `--force`.

**GitHub Pages:** Settings, Pages, Source = **GitHub Actions** (workflow `pages.yml` menerbitkan halaman statis dari `dist/`). Kosongkan Custom domain sampai domain dibeli.

**Halaman statis (SEO):** `tools/build-static.mjs` membaca `posts`, `questions`, `answers` dari Supabase (lewat kunci publik, RLS menyaring konten `hidden`) lalu menulis `dist/`: `/tulisan/<id>`, `/pertanyaan/<id>`, `/arsip`, `sitemap.xml`, `robots.txt`. Konten baru punya halaman statis paling lambat ~30 menit. Uji lokal tanpa internet: `node tools/build-static.mjs --fixture contoh.json`.

**Mencoba lokal:** `python3 -m http.server 8000` di root repo. Server ini tidak mengerti alamat tanpa `.html`, jadi uji halaman dengan `/blog.html?id=1`, atau pakai `npx serve`.

**Pengecekan cepat sebelum rilis:**
- `node --check js/*.js` (sintaks)
- Uji di Chromium 390px dengan Playwright. Cek tidak ada overflow horizontal dan tidak ada error JavaScript.
- Jika ada perubahan SQL, jalankan di Supabase lalu uji alurnya sekali dengan dua akun (laporkan satu komentar dari akun kedua).

## 8. Masalah yang pernah terjadi

- **Tampilan setengah baru setengah lama:** cache browser atau GitHub Pages. Solusi: naikkan `?v=NN` di semua HTML, lalu refresh keras.
- **`git push` ditolak:** repo di GitHub punya commit yang belum ada di Codespace. Solusi: `git pull --rebase`.
- **"Gagal memuat" di blog:** SQL belum dijalankan (`v19-blog.sql`), atau URL dan key di `config.js` salah. Buka DevTools, tab Network, lihat respons ke `/rest/v1/posts`.
- **"Komentar gagal dimuat":** `v31-komentar-reaksi-bias.sql` belum dijalankan, atau fungsi `list_comments` belum ada. Cek dengan query di bagian 9.
- **Bias tidak tersimpan:** kolom `profiles.bias` belum ada, atau CHECK constraint `profiles_bias_check` menolak nilai. Pastikan daftar nilai di `bias.js` sama dengan CHECK di SQL.

## 9. Pengecekan SQL (opsional)

```sql
select to_regclass('public.post_comments') is not null as komentar_ada,
       to_regclass('public.reactions') is not null as reaksi_ada,
       to_regprocedure('public.toggle_reaction(text,bigint,text)') is not null as toggle_ada,
       to_regprocedure('public.list_comments(bigint)') is not null as list_ada,
       exists (select 1 from information_schema.columns
                where table_name = 'profiles' and column_name = 'bias') as bias_ada;
```
Semua harus `true`.

## 10. Rencana berikutnya (urut prioritas)

**Tahap A: fanpage yang fokus NewJeans**
1. **Ganti kategori.** Kategori blog dan Tanya Jawab saat ini berasal dari arah Asia Timur umum (Kuliah, Kerja, Visa, Bahasa, Budaya, Hidup di sana, dan seterusnya). Ganti ke kategori fanpage, misalnya Lagu, Album, Konser, MV, Fanart, Fanfic, Diskusi, Info, Umum. Ubah di `CATS` (`blog.js`), kategori di `tanya.js`, CHECK constraint kategori di tabel `posts` dan `questions` (cek nama constraint-nya di Table Editor atau lewat `pg_constraint` dulu, lalu buat SQL baru), dan `CAT_ART` di `js/data.js` untuk beranda.
2. **Pangkas sisa portal lama dari beranda.** Hapus cuaca, kurs, IHSG, sholat, libur, kalender, gempa, Teknologi, Ekonomi, Otomotif, Olahraga, dan layanan yang tidak relevan dari `SVC` (`ui.js`), `services.js`, dan kolom samping. Beranda sebaiknya langsung menampilkan tulisan, pertanyaan, dan kategori fanpage.
3. **Label menu:** "Tanya Jawab" dan "Alat" masih dipakai di beberapa tempat. Ganti sesuai fanpage.
4. **Komentar di panel admin.** Tambahkan `comment` ke `admin_queue`, `admin_act`, dan `admin_stats` di SQL, lalu tampilkan di `admin.js`. Kode admin sekarang hanya mengenal `post`, `question`, dan `answer`.
5. **Ulas dan tinjau Privasi dan Syarat** oleh ahli hukum. Ganti kontak dengan email sungguhan.

**Tahap B: fitur Tahap 2 yang tersisa**
6. **Profil bias publik:** halaman `/profil?u=...` yang menampilkan bias dan tulisan penggemar. Perlu fungsi `public_profile(p_user)` yang tidak membuka email.
7. **Bias di tulisan:** tampilkan chip bias penulis di kartu dan detail tulisan. Perlu fungsi yang mengembalikan bias penulis bersama daftar tulisan.
8. **Obrolan realtime:** ruang obrolan per member atau per topik. Supabase Realtime dimungkinkan, tetapi perlu batas kecepatan dan moderasi lebih ketat.
9. **Notifikasi** saat ada balasan atau reaksi pada tulisan sendiri (opsional).

**Tahap C: kualitas**
10. **Pembersihan data lama:** jalankan SQL untuk menghapus tabel dan fungsi yang tidak dipakai (`news`, `saved_news`, `search_all`, `search_news`, `trending`, `communities`, `videos`, `products`, `comics`). Pastikan dulu tidak ada kode yang memakainya.
11. **SEO:** tambahkan canonical dari halaman dinamis ke halaman statis, gambar OG per tulisan, dan halaman statis untuk komentar bila perlu.
12. **Performa dan aksesibilitas:** uji di HP kelas menengah. Kecilkan gambar sebelum unggah. Penyimpanan gratis Supabase terbatas (~1 GB).

## 11. Risiko yang perlu diingat

- **Hak cipta dan publisitas:** tanpa izin, jangan memakai materi resmi NewJeans atau ADOR (bagian 2).
- **Moderasi:** konten pengguna tanpa moderasi cepat memburuk. Pantau `reports` dan `post_comments` secara rutin, terutama setelah fanpage dibagikan ke media sosial.
- **Batas laporan otomatis:** 3 laporan bisa dipakai untuk menyembunyikan konten yang tidak melanggar. Admin perlu bisa membalikkan keputusan (sudah bisa lewat Table Editor, sampai panel admin mendukung komentar).
- **Penghindaran blokir:** pengguna yang diblokir bisa menghapus akun dan mendaftar lagi. Penangkal ringan saja.
- **Data pribadi:** setiap perubahan yang menyimpan data baru harus dicatat di privasi.html dan diuji fitur unduh dan hapus.

## 12. Prompt untuk melanjutkan bersama Claude

Salin ke sesi baru, lalu lampirkan zip repo terbaru:

> Aku melanjutkan Bunnies Indonesia, fanpage NewJeans tidak resmi untuk penggemar Indonesia (HTML/CSS/JS murni di GitHub Pages dengan backend Supabase). Baca `HANDOFF.md` di zip yang kulampirkan, lalu kerjakan: [tulis tugas, misalnya "ganti kategori ke fanpage NewJeans di bagian 10 nomor 1"]. Pertahankan struktur folder, urutan script, dan gaya visual (biru, merah muda, Bunbun). Jangan ubah `config.js`. Naikkan `?v=` di semua HTML bila ada perubahan frontend.
