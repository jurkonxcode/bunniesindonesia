# Niflax: Dokumen Handoff

Terakhir diperbarui: 9 November 2026 (v27, lihat bagian 29).
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
1. Urutan tag `<script>` di `index.html` **harus dipertahankan**: config, data, services, state, api, auth, ui, sholat, tools, menu, main (sholat ditambah di v13; services dan menu di v16). Semua file berbagi variabel global (bukan ES module).
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

## 22. v15: impor berita lewat RSS (berizin saja)

Berkas baru: `tools/impor-berita.mjs`, `tools/feeds.json`, `.github/workflows/impor-berita.yml`. Tidak ada perubahan pada situs (HTML/CSS/JS) sama sekali.

**Cara kerja:** GitHub Actions menjalankan skrip tiap 30 menit (dan bisa manual lewat tab Actions, tombol Run workflow). Skrip membaca feed di `tools/feeds.json`, lalu memasukkan berita baru ke tabel `news` lewat REST Supabase (`on_conflict=url`, duplikat dilewati). Situs membaca tabel itu seperti biasa; tab Berita dan kategori muncul sendiri begitu ada isi.

**Aturan yang dikunci di skrip:**
- Feed dengan `"izin": true` saja yang diambil. Semua feed bawaan mati. Isi kolom `catatan` dengan asal izinnya (tanggal/kontak/tautan lisensi).
- Yang disimpan: judul, nama sumber, waktu terbit, tautan asli. Ringkasan hanya bila `"ringkasan": true` (maks 200 huruf). `image_url` selalu kosong (foto punya hak cipta sendiri). Isi artikel penuh tidak disimpan.
- Berita lebih tua dari `maks_umur_jam` (bawaan 72 jam) dilewati.
- Berita non-Indonesia diberi label bahasa pada nama sumber, mis. "Nama Media (EN)". **Tidak ada terjemahan otomatis** (terjemahan adalah karya turunan dan butuh izin/lisensi).
- Kategori harus salah satu: Nasional, Teknologi, Bola, Olahraga, Ekonomi, Hiburan, Kuliner, Otomotif, Religi (sesuai `CAT_ART` di `js/data.js`).

**Pengaturan sekali (wajib):**
1. GitHub repo, Settings, Secrets and variables, Actions, New repository secret:
   - `SUPABASE_URL` = alamat proyek Supabase (sama dengan `SUPABASE_URL` di `js/config.js`).
   - `SUPABASE_SERVICE_ROLE_KEY` = kunci rahasia (service_role atau secret) dari Supabase, Project Settings, API. **Jangan** ditaruh di repo atau di `js/config.js`.
2. Pastikan `supabase/supabase-schema.sql` sudah dijalankan (tabel `news` dengan kolom `url` unik).
3. Isi feed di `tools/feeds.json`, ubah `izin` menjadi `true`, commit.
4. Uji tanpa menulis ke database: `node tools/impor-berita.mjs --dry` (tidak butuh kunci). Lalu di tab Actions, jalankan "Impor berita (RSS)" sekali secara manual dan cek lognya.

**Catatan:**
- Workflow terjadwal di repo publik dimatikan GitHub bila repo tidak ada aktivitas 60 hari; nyalakan lagi dari tab Actions.
- Tabel `news` bertambah terus. Pembersihan otomatis belum ada (hati-hati: `saved_news` terhubung dengan `on delete cascade`, jadi jangan hapus berita yang sedang disimpan pengguna).
- UU Hak Cipta Pasal 43 huruf c (berita aktual, sumber disebut lengkap) sedang diusulkan dihapus oleh Dewan Pers; pantau revisinya. Kebijakan Niflax tetap: minta izin tertulis.
- Kunci rahasia di `js/config.js` adalah kesalahan fatal: kunci di frontend itu publik.

## 23. v16: panel menu hamburger dan kotak cari ringkas

- **Panel menu** (`#drawer`, `js/menu.js`): tombol hamburger di header membuka panel dari kiri yang bisa digulir sendiri (isi: kartu akun, "Pintasanmu" dari localStorage `niflax.pins`, semua kelompok layanan lengkap dengan jumlahnya, tautan Tentang/Kontak/Privasi/Syarat). Tutup lewat tombol X, klik latar gelap, atau tombol Esc. Fokus dijaga di dalam panel, gulir halaman dikunci saat panel terbuka. Tanpa JavaScript, tombol tetap membuka halaman `layanan`.
- **Daftar layanan dipusatkan** di `js/services.js` (`GROUPS`). Dipakai oleh `layanan.js` dan `menu.js`. Tambah/ubah layanan di SATU tempat itu saja. `layanan.html` kini memuat `services.js` sebelum `layanan.js`.
- **Kotak cari ringkas** (`#hSearch` di header): muncul saat kotak cari besar tergulir keluar layar (IntersectionObserver), lalu menu teks dan logo disembunyikan. Pencarian di sini memakai aturan yang sama (alat harian dulu lewat `goTool`, selain itu ke `search`).
- Urutan `<script>` di `index.html` sekarang: config, data, services, state, api, auth, ui, sholat, tools, menu, main.
- Berkas berubah: `index.html`, `layanan.html`, `js/services.js` (baru), `js/menu.js` (baru), `js/layanan.js`, `css/portal.css`. Cache `?v=16` di `index.html` dan `layanan.html`.


## 24. v17: klasifikasi berita otomatis, kategori baru, pembersihan

**Berkas baru/berubah:** `tools/klasifikasi.mjs` (baru), `tools/impor-berita.mjs`, `tools/feeds.json`, `supabase/v17-bersihkan-berita.sql` (baru), `js/data.js` (CAT_ART), `js/api.js` (limit 150), `js/ui.js` (urutan tab). Cache `?v=17`.

- **Klasifikasi:** feed dengan `"kategori": "Auto"` diklasifikasi per berita dari kata kunci pada judul (deskripsi feed ikut menghitung skor tetapi tidak disimpan). Aturan ada di `ATURAN` dalam `tools/klasifikasi.mjs`; tambah kata kunci di sana. Tanpa AI dan tanpa biaya. Akurasi bergantung kata kunci: periksa `select category, count(*) from news group by 1` dan perbaiki aturan bila ada yang salah masuk. Feed `Olahraga` otomatis dipecah ke `Bola` bila judul soal sepak bola. Bila tak ada yang cocok, dipakai `kategori_bawaan` (bawaan Nasional).
- **Kategori sekarang 14:** Nasional, Politik, Hukum, Internasional, Ekonomi, Teknologi, Bola, Olahraga, Hiburan, Kuliner, Otomotif, Religi, Kesehatan, Pendidikan. Tab hanya muncul bila kategorinya ada isinya, urutannya mengikuti urutan kunci `CAT_ART`. Kategori baru harus ditambah di `CAT_ART` (`js/data.js`) dan `ATURAN` (`tools/klasifikasi.mjs`).
- **Beranda memuat 150 berita terbaru** (dulu 30), supaya tab kategori tidak kosong saat satu kategori sedang sepi. Bila nanti kategori tertentu tetap sepi, ganti dengan satu permintaan per tab.
- **`--cek-url`:** `node tools/impor-berita.mjs --cek-url` mengecek apakah alamat feed menjawab dan terbaca (status dan jumlah butir saja, tanpa menampilkan atau menyimpan isi), meski `izin` masih false. Pakai ini untuk memastikan alamat RSS benar sebelum minta izin.
- **Pembersihan:** jalankan `supabase/v17-bersihkan-berita.sql`. Fungsi `bersihkan_berita(30)` menghapus berita lebih tua dari 30 hari yang tidak sedang disimpan siapa pun. Jadwal harian lewat pg_cron (baris dikomentari di berkas itu).
- **Status sumber (dicek 9 Nov 2026):** ANTARA: ketentuan penggunaan Pasal 3 melarang reproduksi/distribusi tanpa persetujuan tertulis dan tidak menyebut RSS, jadi minta izin dulu. VOA: teks buatan VOA sendiri domain publik dengan kredit, materi AFP/AP/Reuters tidak. BBC: syarat RSS belum bisa dibaca langsung dari sini, cek sendiri. Semua `izin` tetap false sampai pemilik memutuskan.
- **Belum ada:** deduplikasi berita yang sama dari media berbeda, kategori daerah/provinsi, halaman khusus per kategori (saat ini tab di beranda).


## 25. v18: penanda asal konten

- Kartu berita di beranda kini berlabel **"Sumber luar ↗"** (kelas `.ext`), kartu Tanya Jawab berlabel **"Dari Niflax"** (`.ext.in`). Di atas umpan muncul catatan (`EXTNOTE` di `js/ui.js`) bahwa kartu bertanda Sumber luar dikutip lewat RSS dari media lain dan membuka situs sumber. Di `search.html`, jenis hasil berita tertulis "Berita · sumber luar".
- Tujuan: pembaca tahu berita bukan tulisan Niflax, dan pengutipan terlihat jelas (sejalan dengan kebijakan hak cipta di bagian 9). Gaya ada di akhir `css/home.css`. Cache `?v=18`.

## 23. v20: RSS dihapus, Niflax jadi konten orisinil
- Dihapus: `tools/`, workflow `impor-berita.yml`, pembaca iframe. Bagian 22 dan catatan RSS di atas sudah tidak berlaku.
- Beranda kini berisi tulisan Blog dan Tanya Jawab (`loadPosts` di `js/api.js`, `cPost` di `js/ui.js`). Tab: Semua, Blog, Tanya Jawab.
- Pencarian (`js/search.js`) mencari di Blog dan Tanya Jawab, hasil `Semua` dikelompokkan per bagian seperti Naver. Butuh `supabase/v10-tanya-jawab.sql` dan `supabase/v19-blog.sql`.
- Tabel `news`, `saved_news`, RPC `search_all`/`search_news` tidak dipakai lagi (boleh dibiarkan; bersihkan lewat SQL bila mau).

## 26. v24: beranda ala portal besar (pola susunan Naver, identitas Niflax)
Acuan: screenshot naver.com (mode desktop di HP) dibandingkan dengan beranda Niflax. Yang ditiru hanya **pola susunan**: bilah atas tipis, kotak cari pil, baris ikon layanan satu baris, panel putih berbingkai tipis, kolom utama + kolom samping. Tidak ada logo, ikon, warna, atau teks Naver.

**Berkas:** `css/naver.css` (baru, dimuat PALING AKHIR, `?v=24`), `index.html`, `js/ui.js`, `js/main.js`, `js/services.js`, `js/data.js`, `js/blog.js`, `js/tanya.js`. Cache naik ke `?v=24` di semua HTML.

- **Baris ikon** (`SVC` di `ui.js`): satu baris, bisa digeser di HP. Semua tujuan nyata (tanpa label "segera"): Tanya, Blog, Sholat, Libur, Teknologi, Ekonomi, Kuliner, Otomotif, Olahraga, Hiburan, Semua.
- **Panel kolom utama** (`renderModules`): banner ajakan menulis; **Jelajah** (tab, baris judul terbaru, kisi petak 4 kolom HP / 6 desktop); **Blog pilihan** (tagar kategori di kiri, kartu 2 kolom HP / 4 desktop, pager); **Tanya Jawab terbaru**; lalu panel umpan bertab (Semua, Blog, Tanya Jawab) berupa kisi kartu 3 / 4 / 5 kolom. Kartu memakai sampul ikon kategori (`CAT_ART`, ditambah `Umum` dan `Catatan harian`).
- **Kolom samping** (desktop 320px, di HP mengalir di bawah umpan): akun, cuaca (angka besar + 5 hari), kurs, kalender (angka tanggal besar + kisi), gempa, alat harian. Urutan diatur lewat `order` di `naver.css`.
- **`?cat=`**: `blog?cat=Kuliner` dan `tanya?cat=Ekonomi` membuka daftar yang sudah tersaring. Dipakai baris ikon dan petak.
- **Menu hamburger** (`services.js`): Kurs rupiah, Cuaca, Olahraga, Hiburan, Kuliner, Otomotif kini tertaut. Yang masih "segera": Cek resi, Komunitas, Pusat kreator, Berita, Video, Belanja, Komik, Religi, Peta, Tiket.
- **Perbaikan bug lama:** `blog.js` mendeklarasikan `let cat` padahal `state.js` sudah memilikinya, sehingga `blog.js` gagal jalan (SyntaxError). Kini memakai `cat` dari `state.js`.
- **Bar jam** WIB/WITA/WIT kini bar tipis terang di atas header (bukan bar gelap).
- Diuji dengan Chromium (Playwright) di 390px dan 1280px: tanpa overflow horizontal, tanpa error JS di 8 halaman. Diuji dengan data tiruan HANYA di mesin uji; repo tidak berisi data contoh.
- **Belum ada (sengaja, karena tidak ada sumber data nyata):** kios berita/penerbit, widget saham/musik, kotak iklan, tombol AI di kotak cari.

## 27. v25: halaman statis untuk SEO + terbit lewat GitHub Actions
**Masalah:** Pages menyajikan HTML kosong yang diisi JavaScript, sehingga Google sulit mengindeks tulisan dan pertanyaan. **Solusi tanpa pindah hosting:** skrip membuat halaman HTML berisi teks lengkap, lalu Actions menerbitkannya.

**Berkas baru:** `tools/build-static.mjs`, `.github/workflows/pages.yml`, `css/static.css`, `.gitignore`.
- Skrip membaca `posts`, `questions`, `answers` (kunci publik dari `js/config.js`, hanya baca; RLS sudah menyembunyikan konten `hidden`), lalu menulis ke `dist/` (tidak masuk repo): salinan situs, `/tulisan/<id>`, `/pertanyaan/<id>`, `/arsip`, `sitemap.xml`, `robots.txt`.
- Tiap halaman: `<title>`, deskripsi, canonical, Open Graph, JSON-LD (`BlogPosting` untuk tulisan, `QAPage` untuk pertanyaan, plus `BreadcrumbList`), tautan ke tulisan/pertanyaan lain sekategori, dan tombol ke halaman interaktif (`/blog`, `/tanya?id=`).
- **Kebijakan konten tipis:** tulisan di bawah 120 huruf dan pertanyaan tanpa jawaban diberi `noindex,follow` dan tidak masuk sitemap. Ubah `MIN_POST` di skrip bila perlu.
- Sitemap otomatis dipecah (indeks sitemap) bila lebih dari 45.000 URL.
- Semua teks pengguna lewat `esc()`; JSON-LD memakai escape `<`. Diuji dengan judul berisi `<script>`: tampil sebagai teks.
- Uji lokal tanpa internet: `node tools/build-static.mjs --fixture contoh.json` (`{"posts":[],"questions":[],"answers":[]}`), lalu layani folder `dist/`.

**Pengaturan sekali (wajib):**
1. GitHub repo, Settings, Pages, Build and deployment, **Source = "GitHub Actions"** (bukan "Deploy from a branch").
2. Push repo. Workflow "Terbitkan situs" jalan tiap push, tiap 30 menit, dan bisa manual (tab Actions, Run workflow).
3. Setelah domain aktif: tambah file `CNAME` berisi `niflax.com`, set variabel repo `SITE_URL` = `https://niflax.com` (Settings, Secrets and variables, Actions, Variables), lalu daftarkan situs di Google Search Console dan kirim `https://niflax.com/sitemap.xml`.

**Catatan penting:**
- `robots.txt` baru dihormati crawler bila ada di akar domain. Di `github.io/niflax` ia berada di subfolder, jadi baru efektif setelah memakai `niflax.com`.
- Alamat tanpa `.html` (`/tulisan/12`) berfungsi di GitHub Pages; server Python sederhana tidak mengerti ini (lihat bagian 16).
- Konten baru punya halaman statis paling lambat ~30 menit setelah dibuat. Tautan di beranda sengaja masih mengarah ke halaman dinamis (`blog?id=`, `tanya?id=`) agar tidak 404 pada jeda itu.
- Belum dikerjakan: canonical dari halaman dinamis ke halaman statis, gambar OG per halaman, sitemap berita (tidak relevan), build bertahap bila konten sudah puluhan ribu.

## 28. v26: admin, moderasi, blokir, hapus akun, unduh data
**Tujuan:** siap menerima pengguna umum (UU PDP: akses dan penghapusan data) dan punya alat menjaga konten. Domain dan Search Console sengaja belum dikerjakan.

**Berkas baru:** `supabase/v26-moderasi.sql`, `admin.html`, `akun.html`, `js/sesi.js`, `js/admin.js`, `js/akun.js`, `css/admin.css`. **Berubah:** `blog.html` + `js/blog.js` (tombol Laporkan untuk tulisan), `js/auth.js` (tautan Akun saya dan Panel admin di kartu akun), `js/services.js` (item Akun saya), `privasi.html`, `syarat.html`. Cache `?v=26` di semua HTML.

**Wajib dilakukan pemilik (sekali):**
1. Supabase, SQL Editor: jalankan `supabase/v26-moderasi.sql`. Aman diulang. Syarat: `v10-tanya-jawab.sql` dan `v19-blog.sql` sudah dijalankan.
2. Masuk ke situs dengan emailmu, lalu jalankan baris terakhir berkas itu (bagian 9) setelah mengganti `GANTI_DENGAN_EMAILMU` dan menghapus tanda `--`. Itu menjadikanmu admin.
3. Buka `/admin`. Bila muncul "Gagal memeriksa akses", SQL belum jalan.

**Cara kerja:**
- **Keamanan ada di SQL, bukan di halaman.** Semua fungsi admin (`admin_queue`, `admin_act`, `admin_blocked`, `admin_unblock`, `admin_stats`) memanggil `require_admin()`. Tabel `admins`, `blocked_users`, `mod_log` memakai RLS tanpa policy (tidak terbaca dari browser). Fungsi dicabut dari `anon`, hanya `authenticated`.
- **Antrean admin (`admin`):** tab Laporan (konten dengan laporan baru), Tersembunyi, Terbaru (semua konten, untuk tinjau proaktif), Diblokir. Tindakan: Sembunyikan, Tampilkan, Abaikan laporan, Hapus, Blokir penulis. Tiap tindakan dicatat di `mod_log`. Admin tidak bisa memblokir admin.
- **Laporan:** kini mencakup tulisan blog (`target_type = 'post'`). Kolom baru `reports.status` (`baru`/`selesai`) dan `handled_at`. 3 laporan BARU dari 3 pengguna berbeda menyembunyikan konten otomatis; laporan yang sudah ditangani tidak dihitung lagi. Satu pengguna maksimal 30 laporan per hari, dan hanya untuk konten yang ada dan tampil.
- **Blokir:** trigger `aa_not_blocked` (jalan sebelum `*_prepare`) menolak pertanyaan, jawaban, tulisan, dan laporan dari akun terblokir. Ini penangkal ringan: pengguna terblokir masih bisa menghapus akunnya lalu mendaftar lagi dengan email lain.
- **Akun saya (`akun`):** ubah nama tampil (`set_display_name`, nama dicadangkan seperti "Admin"/"Niflax" ditolak untuk non-admin; berlaku untuk konten berikutnya, konten lama tidak diubah), unduh data JSON (`export_my_data`, termasuk konten yang sedang disembunyikan), keluar, dan hapus akun (`delete_my_account`, harus mengetik HAPUS). Hapus akun menghapus baris `auth.users`; tulisan, pertanyaan, jawaban, laporan, dan profil ikut terhapus lewat `on delete cascade`. Admin terakhir tidak bisa menghapus akunnya.
- `admin.html` dan `akun.html` bermeta `noindex` dan tidak masuk sitemap (diuji dengan `build-static.mjs --fixture`).
- `js/sesi.js` berisi sesi + `rest()` + `rpc()` bersama untuk dua halaman baru. Jangan dimuat bersama `tanya.js`/`blog.js` (nama variabel sama).

**Diuji:** sintaks JS, dan Chromium (Playwright) di 390px dengan Supabase tiruan: gerbang masuk, non-admin, panel admin (daftar, XSS di judul tampil sebagai teks, semua tindakan mengirim payload benar, buka blokir), akun (isi nama, simpan, unduh, hapus hanya aktif setelah mengetik HAPUS, sesi terhapus), Laporkan di blog, tautan di beranda dan Semua layanan. Tanpa error JS dan tanpa overflow horizontal. **SQL belum diuji pada Postgres sungguhan** (tidak tersedia di mesin uji); jalankan lalu uji alurnya sekali: laporkan satu tulisan dari akun kedua, tangani di `/admin`.

**Catatan dan belum dikerjakan:**
- Konten yang disembunyikan/dihapus hilang dari halaman statis (SEO) pada terbit berikutnya, paling lambat ~30 menit.
- Kontak masih lewat GitHub Issues (bagian 12). Ganti dengan email sungguhan sebelum pendaftaran dibuka umum.
- Belum ada: banding atas blokir, notifikasi ke penulis saat kontennya disembunyikan, ekspor `mod_log` ke panel (lihat di Table Editor), laporan untuk komentar (komentar belum ada).
- Berikutnya (v27): Religi (Al-Qur'an), Peta, direktori wilayah dari data terbuka.


## 29. v27: navigasi ala portal besar + perapian tata letak
Acuan: pola navigasi naver.com (bilah tab menempel, bilah atas yang ikut muncul/hilang saat digulir, tombol TOP, dropdown cari). naver.com tidak bisa dibuka dari mesin kerja (diblokir), jadi pola diambil dari pengetahuan umum, bukan dari salinan halaman. Tidak ada logo, ikon, warna, atau teks Naver. **Isi, data, dan logika Supabase tidak diubah.**

**Berkas baru:** `css/nav.css`, `js/nav.js`, `js/suggest.js`. **Berubah:** `index.html`, `blog.html`, `tanya.html`, `search.html`, `akun.html` (pasang nav), `js/menu.js` (satu angka: `rootMargin` -64px jadi -94px karena header kini dua baris). Cache `?v=27` di semua HTML.

- **Bilah tab (`js/nav.js`)**: dibuat sinkron di dalam `<header>` (tag script terakhir di dalam header, jadi tanpa lompatan tata letak). Tab: Beranda, Tanya Jawab, Blog, enam kategori, Alat harian, ditambah tombol "Semua layanan" di kanan (di beranda membuka panel menu hamburger yang sudah ada). Tab aktif ditebalkan + garis hijau, otomatis diposisikan ke tengah, bayangan tepi muncul hanya bila ada tab tersembunyi. Daftar tab ada di satu tempat: konstanta `TABS` di `nav.js`.
- **Bilah atas hilang saat gulir ke bawah, muncul saat gulir ke atas** (hanya di bawah 1000px, hanya beranda). Bilah tab tetap menempel. Fokus ke kotak cari memunculkannya lagi. Tinggi diatur variabel `--h1` (52px) dan `--h2` (42px) di `nav.css`; jangan menulis tinggi header manual di CSS lain, pakai `--hh`.
- **Tombol TOP** muncul setelah gulir 520px.
- **Dropdown cari (`js/suggest.js`, hanya beranda)**: kotak kosong menampilkan "Pencarian terakhir" (localStorage `niflax.recent`, maks 8, bisa dihapus satu-satu atau semua) dan "Tren" (view `trending`); mengetik 2+ huruf memanggil `suggest_keywords`. Navigasi keyboard + ARIA combobox. Riwayat dicatat saat `search.html?q=` dibuka (di `nav.js`). Halaman `search.html` tetap memakai dropdown-nya sendiri.
- **Tata letak:** jarak antar kartu di HP seragam 12px (sebelumnya kartu Cuaca/Kurs/Kalender menempel dan panel berjarak ganda), padding sisi HP 12px, kolom samping desktop tidak lagi `sticky` (kolom yang lebih tinggi dari layar tidak bisa terbaca bawahnya), `scroll-margin-top` agar anchor tidak tertutup header.
- **Detail kecil:** cincin fokus hijau di kotak cari, tombol hapus (x) khusus di input search, `tabular-nums` untuk angka, efek tekan di ikon/panel, tanpa sorotan ketuk, hormati `prefers-reduced-motion`, `text-wrap:balance` di judul.
- **Diuji** (Chromium, 390px dan 1280px, data tiruan hanya di mesin uji): tanpa overflow horizontal dan tanpa error JS di beranda, blog, tanya, search, akun, layanan, tentang, admin; headroom, TOP, dropdown (isi, saran, hapus), drawer dari "Semua layanan", tab aktif `blog?cat=Kuliner`.
- **Belum:** `layanan.html`, halaman hukum, dan `admin.html` belum memakai bilah tab (sengaja, bentuknya berbeda). Ikon di dalam tab dan bilah bawah ala aplikasi tidak dibuat.

## 30. v28: wedge Indonesia ↔ Asia Timur + tampilan baru
- Fokus produk: panduan dan tanya jawab kuliah, kerja, visa, bahasa, budaya, hidup di Korea/Jepang/Asia Timur, ditulis orang Indonesia. Alasan: isi buatan pengguna adalah daya tarik utama Naver, bukan tata letaknya.
- Kategori baru (Tanya + Blog): Kuliah, Kerja, Visa, Bahasa, Budaya, Hidup di sana. Jalankan `supabase/v28-asia-timur.sql` (ganti email; ubah constraint kategori + 24 pertanyaan awal, tanpa jawaban palsu).
- Beranda: blok hero wedge, chip cari (KGSP, EPS, visa Jepang, Hangul), baris ikon baru. Gaya baru di `css/asia.css` (dimuat terakhir, `?v=28`).
- Belum: `tools/build-static.mjs` belum dicek untuk kategori baru; pastikan halaman statis ikut. Isi 200 jawaban nyata sebelum menambah fitur.
