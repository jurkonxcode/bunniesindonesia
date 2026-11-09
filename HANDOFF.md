# Niflax: Dokumen Handoff

Terakhir diperbarui: 9 November 2026 (v14).
Tujuan dokumen: agar siapa pun (pemilik, developer lain, atau sesi Claude baru) bisa melanjutkan proyek tanpa bertanya ulang. Letakkan file ini di root repo sebagai `HANDOFF.md`.

---

## 1. Ringkasan proyek

**Niflax** adalah portal pencarian dan konten untuk pengguna Indonesia, terinspirasi Naver (Korea) tetapi dengan identitas visual dan fitur sendiri yang disesuaikan kebiasaan orang Indonesia.

- **Pemilik:** akun GitHub `jurkonxcode`, repo `niflax`.
- **Alamat sekarang:** `https://jurkonxcode.github.io/niflax/` (GitHub Pages). Domain `niflax.com` **belum dibeli**.
- **Stack:** HTML, CSS, dan JavaScript murni (tanpa framework, tanpa build step) di GitHub Pages, ditambah Supabase untuk database, login, dan penyimpanan.
- **Lingkungan kerja pemilik:** GitHub Codespaces, sering membuka dari HP. Semua tampilan harus nyaman di layar HP dulu.
- **Bahasa antarmuka:** Indonesia. Nada: santai tapi jelas, kalimat aktif, huruf kecil kecuali awal kalimat.

## 2. Keputusan desain yang sudah diambil

| Hal | Keputusan | Alasan |
|---|---|---|
| Warna utama | Hijau (`--brand`), mirip Naver tapi dipakai terutama di kotak pencarian | Hijau akrab di Indonesia. Risiko: mirip brand lain, jadi identitas dibangun lewat elemen lain |
| Identitas | **Motif kawung** (batik) sebagai pola latar hero dan overlay semua gambar kartu | Pembeda dari Naver, murah dibuat (SVG data URI) |
| Warna pendamping | Kunyit hangat `--warm: #f5a524` untuk penanda "berikutnya" dan banner promo | Kontras hangat dengan hijau |
| Font | Sora (judul, angka) dan Instrument Sans (isi), dari Google Fonts | Terbaca baik, tidak generik |
| Mode gelap | Otomatis mengikuti sistem (`prefers-color-scheme`) | Semua warna lewat token di `css/tokens.css` |
| Fitur khas Indonesia | Alat harian (sholat, kurs/emas, cek resi, libur nasional), jam WIB/WITA/WIT, banner Harbolnas 11.11, kategori Bola/Kuliner/Religi/Otomotif | Sesuai apa yang sering dicari orang Indonesia |
| Domain | Tidak memakai `CNAME` dulu | Domain belum dibeli. Semua path relatif |

## 3. Struktur repo

```
index.html              kerangka halaman (tanpa style/script inline)
css/
  tokens.css            warna, bayangan, mode gelap (ubah warna di sini)
  base.css              reset, tipografi, .card, .sh, .btn, .thumb
  header.css            bar ticker + header menempel
  hero.css, shortcuts.css   LAMA, tidak dimuat lagi sejak v12 (aman dihapus)
  portal.css            (v14) susunan dua kolom + baris ikon layanan (dimuat setelah home.css)
  home.css              beranda v12: cari, tab sticky, umpan kartu (dimuat terakhir)
  content.css           berita, panel samping, video, belanja, komunitas, komik, footer
  auth.css              dialog masuk, tombol Simpan, label .demo
  page.css              gaya halaman hukum
  identity.css          kawung, chip, alat harian, promo
  responsive.css        breakpoint 1000px dan 640px
js/
  config.js             SUPABASE_URL dan SUPABASE_ANON_KEY (diisi pemilik)
  data.js               (v13) daftar kota, libur nasional 2026-2027, rute alat. TIDAK ada data contoh lagi
  state.js              state global + helper $ dan esc()
  api.js                sb() dan load() untuk membaca Supabase
  auth.js               login (Google + kode email), sesi, Simpan berita
  ui.js                 fungsi render (berita, ticker, video, produk, dst.)
  sholat.js             (v13) hitung jadwal sholat di browser, metode Kemenag
  tools.js              alat harian (sholat, libur), jam, sapaan, goTool()
  main.js               event listener dan inisialisasi
assets/                 gambar, ikon, font lokal (masih kosong)
supabase/
  supabase-schema.sql   skema database lengkap
  v10-tanya-jawab.sql   tabel questions, answers, reports (jalankan setelah schema utama)
privasi.html, syarat.html, tentang.html   halaman hukum + kontak
brand.html              panduan merek
search.html             halaman hasil pencarian (css/search.css, js/search.js)
tanya.html              Tanya Jawab (css/tanya.css, js/tanya.js), v10
layanan.html            Semua layanan + pintasan (css/layanan.css, js/layanan.js), v11
assets/icons/niflax-icons.svg   35 ikon Niflax (sprite, id n-<nama>), v11
README.md
HANDOFF.md              dokumen ini
```

**Aturan penting:**
1. Urutan tag `<script>` di `index.html` **harus dipertahankan**: config, data, state, api, auth, ui, sholat, tools, main (sholat ditambah di v13). Semua file berbagi variabel global (bukan ES module).
2. Urutan `<link>` CSS juga penting: `identity.css` dimuat sebelum `responsive.css` dan setelah `content.css` karena menimpa `.thumb::before`.
3. Teks dari database **wajib** lewat `esc()` sebelum masuk `innerHTML` (anti-XSS).
4. Jangan pernah menaruh `service_role` key di repo atau frontend.

## 4. Supabase

### 4.1 Koneksi
Frontend memanggil REST API Supabase memakai `fetch` langsung (tanpa library), lewat fungsi `sb(path)` di `js/api.js`. Kunci yang dipakai di frontend adalah **publishable/anon key**, aman dipublikasikan **selama RLS aktif**.

### 4.2 Skema (`supabase/supabase-schema.sql`)
File aman dijalankan ulang. **Status: belum terkonfirmasi sudah dijalankan.** Cek dulu di Supabase: Table Editor harus berisi tabel di bawah ini. Jika kosong, jalankan file itu di SQL Editor.

| Tabel | Isi | Akses |
|---|---|---|
| `news` | berita: title, summary, url (unik), image_url, category, source, published_at, `fts` (pencarian teks) | baca publik, tulis hanya service_role |
| `videos` | title, youtube_id (unik), channel, duration_seconds | sama |
| `products` | name, price (Rupiah, integer), old_price, url (afiliasi), store, active | sama |
| `comics` | title, genre, cover_url, weekly_rank | sama |
| `communities` | name, slug, description, member_count | baca publik |
| `community_members` | keanggotaan (komposit) | hanya diri sendiri |
| `profiles` | dibuat otomatis lewat trigger saat daftar | hanya pemilik |
| `saved_news` | berita tersimpan | hanya pemilik |
| `searches` | riwayat pencarian | **tanpa policy**: tidak bisa dibaca langsung dari browser |

**Fungsi dan view:**
- `log_search(p_query, p_scope)`: mencatat pencarian (input dibersihkan di server).
- `trending` (view): 10 kata kunci terbanyak 7 hari terakhir. Kolom `keyword`, `rank`, dibaca `js/api.js`.
- `suggest_keywords(p_prefix)`: saran autocomplete.
- `search_news(p_query, p_category, p_limit, p_offset)`: pencarian berita.
- `search_all(p_query, p_limit)`: pencarian gabungan berita, video, produk, komunitas.

Pencarian teks memakai konfigurasi `simple` plus `ILIKE` dan trigram. Belum ada stemmer bahasa Indonesia ("membaca" tidak otomatis cocok dengan "baca").

### 4.3 Yang sudah terhubung ke frontend
- `news` dan `trending`: dibaca saat halaman dibuka (`load()` di `api.js`). Jika gagal, tampil data contoh dan pesan status "Gagal memuat data langsung".
- v8: `log_search`, `search_all`, `search_news`, `suggest_keywords` dipakai oleh `search.html`. Login dan Simpan terhubung sejak v4. Komunitas belum.

## 5. Apa yang nyata (status v13)

Prinsip v13: **tidak ada data palsu**. Bagian yang belum punya sumber nyata disembunyikan, bukan diberi label "contoh".

| Bagian | Status |
|---|---|
| Jam WIB/WITA/WIT, sapaan, tanggal | Nyata (dihitung di browser) |
| Jadwal sholat | Nyata. Dihitung di perangkat (`js/sholat.js`), metode Kemenag, 29 kota + "Lokasiku". Diuji silang dengan rumus independen (selisih maks 1 menit). Bisa beda 1-2 menit dari jadwal resmi daerah (sudah dicantumkan di kartu) |
| Libur nasional | Nyata, dari SKB 3 Menteri. `data.js` berisi sisa 2026 dan seluruh 2027. **Perbarui tiap September** saat SKB tahun berikutnya terbit |
| Tanya Jawab | Nyata (Supabase). 20 pertanyaan awal atas nama "Tim Niflax" lewat `supabase/v13-bersih-dan-seed.sql` |
| Berita | Dari tabel `news` di Supabase. **Masih kosong sampai impor berizin dibuat.** Beranda menampilkan catatan jujur dan menyembunyikan tab Berita |
| Kata kunci populer | Dari view `trending` (pencarian sungguhan). Baris disembunyikan bila kosong |
| Pencarian | `search.html` mencari berita dan Tanya Jawab. Tanpa data cadangan palsu: bila gagal, tampil pesan error |
| Dihapus dari tampilan di v13 | ticker pasar (IHSG, kurs, BTC), cuaca, skor, kurs dan emas, cek resi, video, belanja, komunitas, komik, banner 11.11. Kode yang tersisa di CSS aman dihapus |

## 6. Cara deploy dan bekerja

**Pasang pembaruan dari zip di Codespaces:**
```bash
unzip -o <nama>.zip
cp -r <folder>/. .
rm -rf <folder> <nama>.zip
git add -A && git commit -m "pesan" && git pull --rebase && git push
```
Jika `git push` ditolak ("fetch first"), jalankan `git pull --rebase` dulu. **Jangan** pakai `--force`.

**GitHub Pages:** Settings, Pages, Deploy from a branch, branch `main`, folder `/ (root)`. Kosongkan kolom Custom domain sampai domain dibeli.

**Mencoba lokal:** `python3 -m http.server 8000` di root repo, atau ekstensi Live Server.

**Saat domain sudah dibeli:** tambah file `CNAME` berisi nama domain, atur DNS (CNAME ke `jurkonxcode.github.io`), lalu aktifkan Enforce HTTPS.

## 7. Masalah yang pernah terjadi

- **Tampilan berantakan setelah update:** penyebabnya cache browser/GitHub Pages yang menyajikan CSS lama. Solusi: refresh keras atau buka di tab penyamaran. Jika sering terjadi, pertimbangkan menambah versi di URL file (misalnya `style.css?v=3`).
- **`git push` ditolak:** repo di GitHub punya commit yang belum ada di Codespace. Solusi: `git pull --rebase`.
- **Pesan "Gagal memuat data langsung":** kemungkinan besar SQL belum dijalankan, atau URL/key di `config.js` salah. Buka DevTools, tab Network, lihat respons ke `/rest/v1/news`.

## 8. Rencana berikutnya (urut prioritas)

**Tahap A: inti pencarian dan data nyata**
1. Pastikan SQL sudah dijalankan dan `news` terbaca.
2. Halaman `search.html`: panggil `log_search`, tampilkan `search_all` dengan tab Semua/Berita/Video/Komunitas, autocomplete dari `suggest_keywords`.
3. Impor berita otomatis dari RSS media Indonesia lewat Supabase Edge Function terjadwal (pakai `service_role` di sisi server, simpan hanya judul, cuplikan, dan tautan sumber).
4. Sambungkan data nyata alat harian: jadwal sholat (API publik), kurs dan emas, cek resi (API agregator kurir lewat Edge Function).

**Tahap B: akun dan konten buatan pengguna**
5. Halaman Daftar dan Masuk memakai Supabase Auth (email OTP dan login Google). Layanan email bawaan Supabase terbatas jumlah kirimnya, jadi siapkan Google login atau SMTP sendiri.
6. **Tanya Jawab:** SELESAI di v10 (tanpa `votes`, lihat bagian 17).
7. **Komunitas:** tambah `community_posts`, `comments`, dan fitur gabung/keluar yang sudah punya dasar di skema.
8. Moderasi: tabel `reports`, peran admin, tombol Laporkan, dan batas jumlah posting per hari.
9. Berikutnya: Ulasan, Tulisan (blog) dengan gambar di Supabase Storage, dan Komik Kreator.

**Tahap C: kualitas**
10. SEO: GitHub Pages dirender di browser sehingga sulit diindeks Google. Pertimbangkan halaman statis per artikel atau pindah ke hosting dengan render server.
11. Aksesibilitas dan performa: uji di HP kelas menengah, kecilkan gambar sebelum unggah (penyimpanan gratis Supabase terbatas sekitar 1 GB).
12. Halaman hukum: Kebijakan Privasi dan Syarat Layanan wajib ada sebelum menerima pendaftaran pengguna.

## 9. Risiko dan hal yang perlu diingat

- **Hak cipta:** jangan menyalin artikel penuh. Tampilkan judul, cuplikan singkat, dan tautan ke sumber. Jangan memakai logo, nama, atau desain persis Naver.
- **Keamanan:** semua tabel memakai RLS. Setiap tabel baru **wajib** `enable row level security` dan policy eksplisit. Tabel `searches` sengaja tanpa policy.
- **Sumber berita:** syarat penggunaan konten tiap media harus dicek sebelum impor otomatis. Tempo, misalnya, menyatakan penggunaan konten oleh teknologi otomatis/crawler memerlukan izin tertulis dan menyediakan jalur lisensi resmi. Jangan impor media mana pun tanpa izin yang jelas.
- **Konten pengguna:** perlu moderasi sejak hari pertama. Tanpa itu, spam dan konten melanggar akan cepat muncul.
- **Data pribadi:** begitu ada pendaftaran, berlaku kewajiban perlindungan data pribadi di Indonesia (UU PDP). Cantumkan kebijakan privasi dan sediakan cara menghapus akun.
- **Kunci rahasia:** `service_role` hanya untuk Edge Function dan tidak boleh masuk repo.

## 10. Prompt awal untuk melanjutkan bersama Claude

Salin ini ke sesi baru, lalu lampirkan zip repo terbaru:

> Aku melanjutkan proyek Niflax (portal bergaya Naver untuk Indonesia, HTML/CSS/JS murni di GitHub Pages dengan backend Supabase). Baca `HANDOFF.md` di zip yang kulampirkan, lalu kerjakan tahap berikutnya: [tulis tugas, misalnya "buat search.html yang memakai search_all"]. Pertahankan struktur folder, urutan script, dan gaya visual (hijau, kawung, kunyit). Jangan ubah `config.js`.


## 11. v4: login dan Simpan

Pengaturan wajib di dashboard Supabase:
1. Authentication, URL Configuration: Site URL dan Redirect URLs = `https://jurkonxcode.github.io/niflax/`.
2. Authentication, Providers, Google: aktifkan dan isi Client ID/Secret dari Google Cloud Console.
3. Authentication, Email Templates, Magic Link: sertakan `{{ .Token }}` agar email memuat kode 6 digit.

Catatan: email bawaan Supabase terbatas jumlah kirimnya. Untuk umum, pasang SMTP sendiri.

## 12. v5: pembersihan

- Dibuat `privasi.html`, `syarat.html`, `tentang.html` (kontak sementara lewat GitHub Issues). **Sebelum publik: ganti dengan email kontak sungguhan dan buat fitur hapus akun.** Teks hukum adalah draf, belum ditinjau ahli hukum.
- Bagian data contoh diberi label `contoh` (kelas `.demo`). Hapus label saat data nyata terpasang.
- Tab pencarian Gambar/Video/Komunitas disembunyikan sampai `search.html` jadi. Footer dibersihkan dari link tanpa tujuan.

## 13. v6: identitas merek

- Aset di `assets/brand/`: `logo-mark.svg` (juga favicon), `logo-wordmark(-dark).svg`, `logo-horizontal(-dark).svg`, `icons.svg` (sprite 8 ikon), `og-image.svg/.png`, `icon-192/512.png`. Panduan visual: `brand.html`.
- Palet baru: Hijau Daun `#17A862`, Kunyit `#F5A524`, Hutan `#0F2A1E`, Krem `#FFF8EC`. `--brand` di `css/tokens.css` digeser dari `#03c75a` karena identik dengan hijau Naver.
- Gambar OG memakai URL github.io. Ganti ke domain asli setelah dibeli.
- Daftarkan merek ke DJKI setelah cek ketersediaan nama.

## 14. v7: perbaikan layout mobile

- Di layar <=1000px kolom `.grid` memakai `1fr` yang membuat halaman bisa digeser ke samping (overflow ~380px) karena deretan kategori tidak bisa menyusut. Diganti `minmax(0,1fr)` + `min-width:0` di `responsive.css`. Uji ulang dengan Chromium: overflow mobile 0, desktop 0.
- Waktu pada daftar berita tidak lagi terpotong ke dua baris.

## 15. v8: search.html

- Alamat: `search?q=kata&t=berita|video|belanja|komunitas`. Form di beranda dan tautan kata kunci populer mengarah ke sini.
- Tab Semua memakai `search_all` (maks 50 hasil, tab lain menyaring di browser). Tab Berita memakai `search_news` dengan tombol Muat lagi (20 per halaman).
- Autocomplete dari `suggest_keywords` (tertunda 250 ms), pencarian dicatat lewat `log_search`.
- Keamanan: semua teks lewat `esc()`, URL dan gambar hanya http/https (`safeUrl`), tautan keluar memakai `rel="noopener noreferrer nofollow"`.
- Bila Supabase belum dikonfigurasi, halaman memakai data contoh. Bila sudah dikonfigurasi tapi gagal, tampil pesan error dengan tombol Coba lagi.
- Hasil komunitas belum punya halaman tujuan (url null), jadi tampil tanpa tautan sampai halaman komunitas dibuat.
- Pencarian memakai konfigurasi `simple` (tanpa stemmer), jadi "membaca" tidak otomatis cocok dengan "baca".
- `search.html` memakai `noindex` agar halaman hasil tidak diindeks Google.

## 16. v9: alamat bersih

- Semua tautan internal tanpa `.html`: `/search`, `/privasi`, `/syarat`, `/tentang`, `/brand` (GitHub Pages menyajikan `nama.html` untuk alamat `/nama`). Nama file tetap `.html`.
- Server lokal sederhana (`python3 -m http.server`) tidak mengerti ini dan memberi 404. Pakai `npx serve` atau uji di situs yang tayang.
- Selalu tulis tautan tanpa garis miring di akhir (`/search`, bukan `/search/`): jalur relatif `css/` dan `js/` bergantung pada itu.
- Jika bermasalah, kembalikan tautan ke `nama.html` lewat satu commit.

## 17. v10: Tanya Jawab

**Wajib sebelum dipakai:**
1. Supabase, SQL Editor: jalankan `supabase/v10-tanya-jawab.sql` (aman diulang). Tanpa ini halaman menampilkan pesan gagal memuat.
2. Authentication, URL Configuration, Redirect URLs: tambahkan `https://jurkonxcode.github.io/niflax/**` agar login Google dari `/tanya` kembali ke halaman itu. Tanpa ini, Supabase mengembalikan pengguna ke beranda (sesi tetap tersimpan, tinggal buka lagi `/tanya`).

**Fitur:** daftar pertanyaan (kategori, pencarian judul/isi, Muat lagi), detail + jawaban, tanya, jawab, penanya memilih jawaban terbaik, hapus milik sendiri, laporkan.

**Keamanan dan moderasi (di database, bukan di frontend):**
- RLS aktif. Tidak ada policy UPDATE, jadi isi tidak bisa diedit diam-diam. Hanya baca publik, tambah dan hapus milik sendiri.
- Trigger `prepare_post`: memaksa `user_id` dari sesi, mengisi `author_name`, batas 10 pertanyaan dan 50 jawaban per 24 jam. Bagian depan email tidak pernah ditampilkan publik (diganti "Pengguna").
- `pick_best_answer()`: hanya penanya yang bisa.
- `reports`: tidak bisa dibaca dari browser. 3 laporan dari 3 pengguna berbeda otomatis menyembunyikan konten (`status = 'hidden'`). Admin meninjau di Table Editor dan bisa mengembalikan ke `open`.

**Catatan:** `js/tanya.js` mandiri (tidak memuat `auth.js`, yang terikat ke beranda), membaca sesi dari `localStorage` kunci `niflax.session`. Login kode email hanya di beranda. Belum ada: votes, edit, notifikasi jawaban baru, panel admin, hapus akun.

## 18. v11: ikon dan sampul bermerek Niflax, halaman Semua layanan

**Tujuan:** tampilan terasa terisi seperti portal besar, tanpa memakai ikon atau desain Naver. Semua ikon digambar sendiri.

- **Sprite ikon** `assets/icons/niflax-icons.svg`: 35 ikon grid 24, garis bulat 1.8, **satu aksen Kunyit** `#F5A524` per ikon (itu tanda pengenal gayanya). Dipakai lewat `<svg><use href="assets/icons/niflax-icons.svg#n-berita"/></svg>`. Warna garis utama mengikuti `color` elemen, jadi ikon bisa diwarnai CSS. Ikon baru: tambah `<symbol id="n-nama">` di file itu dengan gaya yang sama.
- **Petak ikon** `.ic` + warna kelompok `.g1` sampai `.g6` (di `css/identity.css`). Sepuluh pintasan di beranda kini memakai ini (`shortcuts` di `data.js` berisi id ikon dan kelas kelompok).
- **Sampul berita** (`cover()` di `js/ui.js`): selalu ada ilustrasi ikon kategori di atas gradien kawung (peta kategori ke ikon dan warna ada di `CAT_ART`, `data.js`). Bila `news.image_url` terisi (http/https saja), foto menutupinya. Bila foto gagal dimuat, foto dilepas dan ilustrasi muncul lagi. Produk, komik, dan hasil pencarian juga memakai ilustrasi.
- **`/layanan`** (`layanan.html`): semua layanan per kelompok, kotak cari layanan, dan **Pintasan saya** (maks 8, disimpan di `localStorage` kunci `niflax.pins`, per perangkat). Daftar layanan ada di array `GROUPS` di `js/layanan.js`. Item tanpa tujuan tampil redup dengan label `segera`; item berdata palsu berlabel `contoh`. Saat layanan baru jadi, isi tujuannya dan hapus labelnya.
- Tombol menu (tiga garis) di header beranda mengarah ke `/layanan`, terlihat juga di HP (menu teks disembunyikan di bawah 1000px).

**Belum ada:** foto asli. Itu baru muncul setelah impor RSS (Tahap A no. 3) mengisi `image_url`. Simpan hanya tautan gambar sumber, jangan salin ke penyimpanan sendiri tanpa izin. Pintasan belum ikut akun (belum sinkron antar perangkat).

## 19. v12: beranda gaya portal (umpan kartu)

**Susunan beranda** (mengacu pola portal besar, identitas tetap Niflax): header (menu, logo, Masuk) → kotak cari besar berlogo `n` + chip + tren → **tab menempel** (Tanya, Resi, Layanan | Semua, Berita, Bola, Hiburan, Video, Belanja, Kuliner, Religi, Otomotif, Tanya Jawab) → strip mini (cuaca, IHSG) → **umpan kartu 2 kolom di HP** (3 di tablet, 4 di desktop) → Alat harian.

- Umpan = berita diselingi pertanyaan Tanya Jawab (nyata), video, produk, dan komunitas (contoh, berlabel). Logikanya di `feedItems()` dalam `js/ui.js`. Tab Bola/Hiburan/Kuliner/Religi/Otomotif menyaring berita menurut kategori.
- Kartu berita kini **tertaut ke sumber asli** (`news.url`, hanya http/https, `rel="noopener noreferrer nofollow"`), sebelumnya `#`.
- `renderNews` adalah alias `renderFeed` (dipanggil `auth.js`). Kartu akun `#acct` hanya tampil saat sudah masuk.
- `loadQuestions()` (`api.js`) memuat 8 pertanyaan terbaru; bila `v10-tanya-jawab.sql` belum dijalankan, dilewati diam-diam.
- Daftar peringkat kata kunci (`#rank`), kolom samping, dan skor dihapus dari beranda. Tren tetap berputar di bawah kotak cari.
- **Cache:** semua tag CSS/JS di halaman HTML kini memakai `?v=12`. **Naikkan angkanya di semua file HTML tiap rilis** supaya HP tidak menyajikan CSS/JS lama (penyebab tampilan setengah baru setengah lama di v11). Perintah: `sed -i 's/?v=12/?v=13/g' *.html`.
- Urutan `<script>` tidak berubah. `css/home.css` harus tetap setelah `responsive.css`.


## 20. v13: data nyata, tanpa data contoh

**Dilakukan:**
- `data.js`, `state.js`, `api.js`, `ui.js`, `main.js`, `tools.js` ditulis ulang tanpa data contoh. File baru `js/sholat.js`.
- **Jadwal sholat** dihitung lokal (rumus Meeus). Kota dan pilihan "Lokasiku" disimpan di `localStorage` kunci `niflax.kota`, tidak dikirim ke server. Zona waktu memakai selisih jam kota, bukan zona perangkat.
- **Libur nasional** dari SKB 3 Menteri (sumber: setneg.go.id). Tanggal Idulfitri/Iduladha ditetapkan Menteri Agama dan bisa bergeser; kartu mencantumkan itu.
- **Beranda:** strip mini (sholat berikutnya + libur berikutnya, keduanya nyata), tab dinamis (Berita dan kategori baru muncul bila ada berita), baris tren tersembunyi bila kosong, bar atas hanya berisi jam.
- `layanan.js`: semua layanan tanpa fitur nyata diberi label `segera`, tanpa tautan.
- `search.js`: tab Video/Belanja/Komunitas dihapus, ditambah tab Tanya Jawab (REST ilike pada `questions`), data cadangan palsu dihapus.
- `tentang.html` dan `syarat.html` diperbarui agar jujur soal apa yang sudah ada.
- `supabase-schema.sql`: bagian "DATA AWAL" (berita, komunitas, komik palsu) dihapus.

**Wajib dilakukan pemilik (sekali):**
1. Masuk ke situs dengan emailmu sekali (agar akun ada di `auth.users`).
2. Buka `supabase/v13-bersih-dan-seed.sql`, ganti `GANTI_DENGAN_EMAILMU` dengan emailmu, jalankan di SQL Editor. Ini menghapus berita/komunitas/komik palsu dari database lama dan mengisi 20 pertanyaan awal.
3. Naikkan cache: sudah `?v=13` di semua HTML.

**Berikutnya:** (a) berita berizin: tulis ke media pilihan untuk kemitraan, lalu baru Edge Function impor; (b) kurs resmi (Bank Indonesia), cuaca (BMKG), setelah dicek syarat pemakaiannya; (c) kirim email kontak asli dan fitur hapus akun sebelum pendaftaran dibuka umum.

## 21. v14: dua kolom dan baris ikon layanan

Tujuan: struktur beranda lebih dekat ke portal besar (kolom utama + kolom samping, baris ikon layanan), identitas tetap Niflax.

- **Baris ikon layanan** (`#svr`, di bawah kotak cari): 10 ikon, 5x2 di HP dan 1 baris di layar >=700px. Daftar ada di `SVC` dalam `js/ui.js`. Tujuan `#...` menggulir ke alat; ikon dengan tab (Berita, Bola, Hiburan, Kuliner) membuka tab umpan **hanya bila kategori itu sudah ada isinya**; selain itu tampil redup berlabel "segera". Ubah daftar di `SVC` saat layanan baru jadi.
- **Dua kolom** (>=1000px): `.mainc` (tab + umpan, 2 kolom masonry, 3 di >=1240px) dan `.side` 340px (kartu akun, Alat harian). Di bawah 1000px kedua pembungkus memakai `display:contents` dan urutan dijaga lewat `order` di `css/portal.css`: tab, strip mini, akun, status, umpan, alat harian (sama seperti v13).
- Kartu akun kini selalu ada di DOM (`js/auth.js`): tampil di kolom samping desktop meski belum masuk; di HP disembunyikan lewat kelas `.out` sampai masuk.
- Tab pintas "Tanya / Sholat / Layanan" di `.ftabs` dihapus (digantikan baris ikon).
- Strip mini (`.mini`) disembunyikan di desktop karena kartu sholat/libur sudah terlihat di kolom samping.
- Berkas berubah: `index.html`, `css/portal.css` (baru), `js/ui.js`, `js/main.js`, `js/auth.js`. Parameter cache naik ke `?v=14` di `index.html`.
- Belum dikerjakan (urut prioritas): Kios Berita, panel hamburger, blok Belanja, widget cuaca/kurs/kalender.
