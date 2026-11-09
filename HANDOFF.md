# Niflax: Dokumen Handoff

Terakhir diperbarui: 9 November 2026.
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
  hero.css              kotak pencarian, tab, tren
  shortcuts.css         10 shortcut layanan
  content.css           berita, panel samping, video, belanja, komunitas, komik, footer
  auth.css              dialog masuk, tombol Simpan, label .demo
  page.css              gaya halaman hukum
  identity.css          kawung, chip, alat harian, promo
  responsive.css        breakpoint 1000px dan 640px
js/
  config.js             SUPABASE_URL dan SUPABASE_ANON_KEY (diisi pemilik)
  data.js               data contoh + daftar shortcut + rute alat
  state.js              state global + helper $ dan esc()
  api.js                sb() dan load() untuk membaca Supabase
  auth.js               login (Google + kode email), sesi, Simpan berita
  ui.js                 fungsi render (berita, ticker, video, produk, dst.)
  tools.js              alat harian, jam, sapaan, promo 11.11, goTool()
  main.js               event listener dan inisialisasi
assets/                 gambar, ikon, font lokal (masih kosong)
supabase/
  supabase-schema.sql   skema database lengkap
privasi.html, syarat.html, tentang.html   halaman hukum + kontak
README.md
HANDOFF.md              dokumen ini
```

**Aturan penting:**
1. Urutan tag `<script>` di `index.html` **harus dipertahankan**: config, data, state, api, auth, ui, tools, main. Semua file berbagi variabel global (bukan ES module).
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
- Semuanya **belum**: `log_search`, `search_all`, `suggest_keywords`, login, komunitas, simpan berita.

## 5. Apa yang nyata dan apa yang masih contoh

| Bagian | Status |
|---|---|
| Jam WIB/WITA/WIT, sapaan, tanggal | Nyata (dihitung di browser) |
| Hitung mundur libur nasional | Nyata, tapi daftar libur di `data.js` baru 2 entri (Natal 2026, Tahun Baru 2027). Perlu dilengkapi dan diperbarui tiap tahun |
| Hitung mundur 11.11 | Nyata (otomatis tampil 30 hari sebelumnya) |
| Berita dan kata kunci populer | Dari Supabase jika terhubung, selain itu data contoh |
| Jadwal sholat, kurs, harga emas | **Data contoh** (diberi label) |
| Cek resi | Formulir ada, pelacakan **belum aktif** (butuh API kurir) |
| Video, produk, komunitas, komik, skor, ticker pasar, cuaca | **Data contoh** |
| Masuk/Daftar (v4) | Google + kode email, sesi di localStorage. **Butuh pengaturan di dashboard Supabase (lihat v4 di bawah)** |
| Simpan berita (v4) | Tombol Simpan di kartu berita yang punya `id`, tersimpan di `saved_news` |
| Kotak pencarian | Menyaring berita yang sudah dimuat di halaman. Kata alat harian (resi, sholat, kurs, emas, libur) diarahkan ke kartu alatnya |

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
6. **Tanya Jawab:** tabel `questions`, `answers`, `votes`, pilih jawaban terbaik.
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
