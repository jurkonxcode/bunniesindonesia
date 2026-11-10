# Bunnies Indonesia: Dokumen Handoff

Terakhir diperbarui: 10 November 2026, rilis v54 (lihat bagian 5i di bawah).
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

## 5c. Kit sosmed (v36)
- `css/kit.css`, `assets/brand/banner.svg`, `badge-avatar.svg`, `og-image.svg/.png` (dibuat ulang), `templates/tpl-*.svg` (Streaming Guide, Happy Birthday, Comeback).
- Semua orisinal: **tanpa foto member** dan tanpa logo/tulisan bergaya NewJeans. Jangan menambah foto member (lihat bagian 2).
- Font Sora tidak termuat di dalam SVG yang dipakai lewat `<img>`; yang tampil adalah font cadangan. Untuk hasil persis, ekspor ke PNG dari browser.
- Banner tampil di beranda (`.hbanner`) dan di `brand.html`.

## 5d. Halaman Member (v37)
- `member.html` + `css/member.css`: biografi lima member NewJeans (profil, latar belakang, kabar terbaru per 9 Nov 2026, garis waktu singkat sengketa ADOR). Tab "Member" ditambahkan di `js/nav.js` dan menu `index.html`.
- Data ada di HTML (tidak ada JS tambahan). Warna aksen tiap member sama dengan `js/bias.js`.
- **Foto:** sengaja tidak disertakan (lihat bagian 2). Kartu memuat `assets/member/<id>.jpg` kalau ada; bila tidak, tampil ilustrasi Bunbun dengan inisial. Isi foto hanya jika sudah berizin.
- Tinggi badan, MBTI, golongan darah sengaja tidak dicantumkan karena sumber publik saling bertentangan.

## 5e. Rapikan UI (v38)
- `css/modern.css` (dimuat setelah `brand-skin.css`, sebelum `fokus.css`): fokus keyboard yang jelas, daftar Blog/Tanya Jawab/Pencarian jadi kartu, chip kategori membungkus di desktop dan bisa digeser di HP, ubin kategori 2 baris x 4, empty state bermaskot. Hapus baris `<link>` itu untuk kembali ke v37.
- **Beranda dipangkas:** banner (`.hbanner`) dihapus dari `index.html` karena mengulang hero (file `assets/brand/banner.svg` dan `css/kit.css` tetap dipakai `brand.html`). Umpan "Semua" di bawah disembunyikan lewat CSS (`#ftabs`, `.feedwrap`) karena mengulang Blog pilihan dan Tanya Jawab terbaru; pesan galat `#status` tetap tampil. Lebar hero dan pemutar kini sama dengan kolom konten.
- **Pemutar Spotify:** `js/musik.js` memuat iframe hanya saat tombol "Putar playlist" ditekan. Ganti playlist di atribut `data-src` pada `.musik-p` (hanya host `open.spotify.com` yang diterima). Teks di `privasi.html` disesuaikan.
- **Palet sampul kartu:** `PAL` di `js/data.js` diganti ke biru langit dan merah muda brand (sebelumnya ungu, oranye, hijau).
- Tinggi beranda di HP turun dari ~3470px ke ~2500px. Tidak ada perubahan database, login, atau fungsi komentar.

## 5f. Padat dan tanpa blok kosong (v39)
- `css/padat.css` (sebelum `fokus.css`): jarak beranda dirapatkan, tagar Blog pilihan satu baris dengan kartu 4 kolom, footer seragam di semua halaman. Hapus baris `<link>` itu untuk kembali ke v38.
- `js/ui.js` `renderModules()`: baris "Terbaru", panel Blog pilihan, dan panel Tanya Jawab terbaru **tidak dirender bila datanya kosong** (sebelumnya menampilkan "Belum ada ..."). Panel muncul sendiri begitu ada tulisan atau pertanyaan.
- `index.html`: kartu "Kenalan member" (tautan ke `member#id` dan Galeri) di kolom samping.
- `galeri.html`: keterangan "Kredit: belum diisi" dihapus; keterangan hanya tampil bila kredit atau sumber terisi.
- **Perlu keputusan pemilik:** 6 foto di `data/galeri.json` semuanya `izin: "belum"` dan 4 tanpa kredit. Sesuai bagian 2, jangan dipublikasikan sebelum izin dan kredit jelas.
- **v44, Galeri:** `data/galeri.json` punya field `jenis`, `lisensi`, `tahun` (nilai yang diizinkan ada di `_petunjuk`). `galeri.html` hanya menampilkan foto dengan `izin: "ada"` (konstanta `TAMPIL_BELUM` di skrip) dan menyediakan filter member, jenis, lisensi, tahun. Menambah foto: taruh berkas di `assets/galeri/`, tambah entri, isi kredit, sumber, dan ubah `izin` ke `"ada"` setelah izinnya jelas.

## 5g. Pemadatan menyeluruh (v40)
- `css/padat.css` bagian "v40": hero, pemutar lagu, ajakan menulis, ubin Jelajah (8 ubin satu baris di desktop), daftar Blog/Tanya Jawab, kolom samping, dan footer dirapatkan. Di desktop, kartu Member jadi foto di kiri dan isi di kanan. Tinggi beranda di HP turun ke ~1830px. Hapus bagian itu untuk kembali ke v39. Cache `?v=40`.

## 5h. Info & Link Resmi (v41)
- `info.html` + `css/info.css`: ringkasan fakta, link resmi (YouTube/Instagram/X/TikTok/Weverse @ADOR, Spotify, Apple Music, ADOR di X), diskografi (MV diambil dari `data/youtube.json`), linimasa bersumber, dan cara mendukung. Tiap bagian punya tautan sumber; label "Resmi" vs "Media" membedakan fakta resmi dan laporan media.
- Titik masuk: tab **Info** di `js/nav.js`, kartu "Link resmi" di sidebar beranda, footer semua halaman, dan menu layanan (`js/services.js`).
- Akun "NJZ" sengaja tidak ditautkan (disengketakan ADOR, sebagian besar privat sejak Des 2025). Daftar link perlu diuji klik tiap beberapa bulan; handle dikumpulkan dari pemberitaan, bukan dibuka langsung.
- Data tanggal rilis dari Wikipedia/Qobuz/Apple Music. Perbarui bagian "Status terkini" dan linimasa tiap ada pengumuman ADOR. Cache `?v=41`.

## 5i. Login modern dan aksi fan (v42)
- `js/masuk.js` + `css/masuk.css`: dialog masuk bersama (Google + kode email) untuk **beranda, blog, tanya, akun, dan admin**. Dimuat tepat setelah `config.js`. Mandiri, hanya butuh `SUPABASE_URL` dan `SUPABASE_ANON_KEY`. Dialog dibuat lewat JS saat pertama dibuka. Di HP tampil sebagai lembar dari bawah. API: `Masuk.open("alasan")`, `Masuk.chip(sesi)`, `Masuk.onDone`.
- Sebelumnya halaman blog, tanya, akun, dan admin hanya bisa masuk lewat Google dan memakai `alert()`. Sekarang semuanya membuka dialog yang sama (kode email juga tersedia). Dialog lama (`#authDlg`) dan fungsi `sendCode`/`verifyCode` di `auth.js` dihapus.
- Kolom kode: 6 angka atau lebih (maks 10), sengaja tidak auto-kirim supaya tetap cocok jika panjang kode di Supabase diubah.
- Setelah masuk: chip akun (avatar inisial + nama) di header semua halaman, sapaan "Selamat datang" sekali, kartu akun di beranda berisi **Tulis blog** (`blog?tulis=1`), **Tanya sesuatu** (`tanya?tanya=1`), dan pilihan **bias** satu ketukan (memanggil `set_bias`). Parameter `?tulis=1` dan `?tanya=1` otomatis membuka form (atau dialog masuk bila belum login).
- Untuk membatalkan: kembalikan `index.html`, `blog.js`, `tanya.js`, `akun.js`, `admin.js`, `sesi.js`, `auth.js`, `main.js` dari versi v41.
- **Hati-hati nama kelas:** `.mk` sudah dipakai ikon Bunbun di kotak pencarian (`home.css`), jadi dialog memakai `.mkdlg`. Cek `grep` dulu sebelum memakai nama kelas pendek.
- Google login tetap kembali ke alamat halaman tanpa query (misalnya `blog`, bukan `blog?id=3`), sama seperti sebelumnya.

## 5j. Ikon platform dan pemutar artis (v43)
- `assets/icons/platform.svg`: sprite ikon YouTube, Instagram, X, TikTok, Spotify, Apple Music dari **Simple Icons (CC0)**. Weverse digambar sendiri (huruf W) karena tidak ada di set. Dipakai di `info.html` lewat `<use href="assets/icons/platform.svg#p-...">`. Untuk hasil persis resmi, ganti path di sprite dengan berkas dari halaman brand masing-masing platform.
- Ikon hanya untuk menautkan ke akun resmi. Logo adalah merek pemiliknya. Jangan dipakai seolah situs ini berafiliasi.
- Info: blok `.musik-p.sp` memuat embed artis Spotify NewJeans saat tombol ditekan. Foto artis **ditampilkan oleh Spotify sendiri** lewat embed, tidak disimpan di repo (hak cipta foto tetap milik pemiliknya).
- `js/musik.js` kini berlaku untuk semua `.musik-p` (judul dari `data-title`, tinggi dari `data-h`). `privasi.html` disesuaikan.
- **YouTube (v45):** blok pertama di `#musik` beranda memutar playlist YouTube "NewJeans - All Songs" (ID `PLiyHrD1Lz34yEHaZgEunA7OESzvxjG7NP`, disusun pengguna "Luvirene", bukan kanal resmi). Lagu penuh tanpa login, loop, host `youtube-nocookie.com`. Ganti playlist di atribut `data-src` blok `.musik-p.yt` di `index.html` (hanya parameter `list` yang dipakai). Judul lagu terbaca otomatis untuk riwayat.
- Risiko YouTube: pemilik playlist bisa mengubah/menghapus/memprivatkan playlist; video yang embed-nya dimatikan dilewati; iklan diatur YouTube. Bila ingin sumber yang stabil, buat playlist sendiri dari kanal resmi lalu ganti ID. Tombol "kecilkan" menyembunyikan video YouTube (suara tetap jalan); kebijakan YouTube meminta pemutar tetap terlihat, jadi jangan dijadikan pemutar latar tersembunyi permanen.

## 5k. Profil Bunnies, username @njz_, tab Masuk/Daftar (v46)
- **SQL baru: `supabase/v46-profil-username.sql`** (jalankan setelah v31; aman diulang). Menambah kolom `profiles`: `username`, `bio`, `bunnies_sejak`, `lagu_favorit`, `negara`, `wilayah`, `kota`, `lokasi_tampil`, `profil_lengkap`, `updated_at`. Semua akun lama otomatis diberi username (backfill).
- **Username otomatis:** trigger `profiles_penjaga` mengisi `username` dari email saat profil dibuat (bagian sebelum `@`, tanpa `+tag`, selain a-z 0-9 jadi `_`, maks 20; bila sudah dipakai atau dicadangkan ditambah 4 angka). Handle publik = `@njz_` + username; awalan **tidak disimpan**, ditambah saat tampil. Mengetik `@njz_` sendiri otomatis dibuang. Nama dicadangkan: admin, ador, hybe, newjeans, nama member, dll. (fungsi `username_dicadangkan`).
- **Fungsi:** `my_profile()`, `save_profile(p jsonb)` (hanya kunci yang dikirim yang diubah, jadi kolom bisa diperbarui satu per satu), `cek_username(p)`, `public_profile(p)` (anon boleh; email tidak ikut; lokasi mengikuti `lokasi_tampil`; nama tampil yang sama dengan nama email disembunyikan).
- **Tulis langsung ke tabel `profiles` dicabut** (`revoke insert, update, delete` dari anon/authenticated). Semua tulis lewat fungsi. Bila ada kode baru yang menulis `profiles` lewat REST, ia akan gagal: pakai fungsi atau `save_profile`.
- **Privasi:** lokasi bawaan `sembunyi`; pilihan `negara`/`wilayah`/`kota`. Kota tidak pernah tampil kecuali dipilih pemilik. `privasi.html` sudah diperbarui. Username awal dari nama email bisa membuka nama asli pemilik; kotak Profil dan banner onboarding memberi tahu dan mengajak mengganti.
- **UI:** `akun.html` (kotak "Profil Bunnies" + banner onboarding, `js/profil.js`), `profil.html` + `js/profil-publik.js` (`profil?u=<username>`, tanpa `?u=` membuka profil sendiri), `js/lokasi.js` + `data/lokasi.json`, `css/profil.css`.
- **Lokasi:** `data/lokasi.json` dibuat oleh skrip pembangun (daftar di file): 17 negara/opsi, 38 provinsi Indonesia, 17 wilayah tingkat satu Korea Selatan dengan 229 kota/distrik (nama Latin + Hangul). Kunci wilayah (`id-...`, `kr-...`) dan kota Korea (nama Latin) disimpan di database, jadi label bahasa Korea nanti cukup mengganti tampilan, bukan data. Hangul provinsi Indonesia adalah transliterasi dan **perlu ditinjau penutur Korea**. Kota luar Indonesia/Korea ditulis bebas.
- **Masuk vs Daftar** (`js/masuk.js`, `css/masuk.css`): dua tab. **Masuk** memakai `create_user:false` (email belum terdaftar ditolak: "Pilih tab Daftar dulu"). **Daftar** memakai `create_user:true`, menampilkan usulan `@njz_...`, dan wajib centang Syarat/Privasi. Tombol Google di kedua tab membuat akun bila belum ada (tidak bisa dibedakan). Tetap tanpa kata sandi. Tombol "Daftar" di header beranda membuka tab Daftar (`Masuk.open(undefined,"daftar")`).
- **Onboarding:** sesudah masuk, `check()` memanggil `my_profile`. Bila `profil_lengkap` false: akun baru (<15 menit) diarahkan ke `akun?baru=1`; akun lama diberi toast. `profil_lengkap` menjadi true saat profil pertama disimpan.
- **Belum dikerjakan:** bahasa Korea (ditunda atas permintaan pemilik; `bahasa` belum ada di database), username belum tampil di komentar/tulisan (komentar masih memakai nama tampil), batas frekuensi ganti username, foto profil. Cache `?v=46`.


## 5e. Slideshow hero dan status member (v47)
- `js/hero-slide.js` + gaya di akhir `css/modern.css`: slideshow otomatis di belakang judul beranda. Sumbernya `data/galeri.json`; hanya foto dengan `izin: "ada"` dan `kredit` + `sumber` terisi yang masuk (aturan yang sama dengan Galeri). Tanpa foto berizin, slideshow tidak muncul dan tampilan lama tetap. Kredit foto tampil kecil di pojok hero.
- **Sumber foto:** newjeans.kr tertulis "© 2026 ADOR. All Rights Reserved", jadi **bukan** rilis bebas pakai. Jangan memasang foto dari sana tanpa izin tertulis (`izin-agensi`). Foto yang aman: lisensi terbuka (mis. CC BY-SA dari Wikimedia Commons, wajib kredit dan tautan lisensi), atau foto berizin dari kreator.
- Cara menambah foto ke slideshow dan Galeri: taruh berkas di `assets/galeri/`, tambahkan entri di `data/galeri.json` dengan `izin: "ada"`, `kredit`, `sumber`, `lisensi`.
- Status member: Danielle ditandai "Tidak lagi di grup · sejak 29 Des 2025" (kartu abu-abu, panel status, garis waktu, tautan sumber) dan tag "mantan" di chip Member, daftar beranda, serta filter Galeri. Perbarui bila status berubah.


## 5f. Bahasa Korea dan Hangul (v48)
- **Halaman Korea sendiri:** `ko/index.html`, `ko/member.html`, `ko/tentang.html` (+ `css/ko.css`). Isinya ditulis khusus untuk pembaca Korea (panduan komunitas, kosakata Indonesia, profil member, status Danielle dengan garis waktu dan sumber), **bukan terjemahan mesin** dari halaman Indonesia. Ini sengaja: Google menilai halaman terjemahan tipis lebih rendah. Tetap minta penutur asli Korea mengoreksi teksnya sebelum dipromosikan.
- **SEO bahasa:** tiap halaman Korea punya `canonical`, `hreflang` `ko`/`id`/`x-default`; `index.html`, `member.html`, `tentang.html` punya `hreflang` balasan. Halaman Korea masuk sitemap (`tools/build-static.mjs`). Daftarkan sitemap di Google Search Console.
- **Tombol bahasa:** `js/nav.js` menambahkan tombol "한국어" di baris atas semua halaman Indonesia; halaman Korea punya tombol "Indonesia".
- **Hangul di seluruh situs:** font Noto Sans KR dimuat (semua HTML) dan masuk daftar font di `css/modern.css`; `js/hangul.js` memberi `lang="ko"` otomatis pada teks berisi Hangul (termasuk tulisan, komentar, dan pencarian pengguna) sehingga glyph dan pemenggalan baris benar (`:lang(ko){word-break:keep-all}`). Pencarian Hangul berjalan (database memakai UTF-8) dan suku kata tunggal tetap disorot.
- **Batas panjang di database:** judul Tanya Jawab minimal 10 karakter, judul blog minimal 5 karakter. Teks Korea lebih padat, jadi judul pendek bisa ditolak; longgarkan lewat SQL bila perlu.
- **Belum ada:** antarmuka dinamis (blog, tanya, akun) masih berbahasa Indonesia; halaman Korea menautkan ke sana dan memberi catatan.

## 5e. Tautan bersih tanpa # (v49)
- Tidak ada lagi alamat berakhiran `#...` di tautan situs. Filter dan lompatan bagian memakai query: `galeri?m=minji`, `kabar?m=hanni`, `chart?s=spotify` / `chart?m=video`, `member?m=haerin`, `info?b=resmi`, `tentang?b=kontak`. Tautan lama berbentuk `#nama` masih terbaca lalu dibersihkan.
- Klik chip filter dan chip lompat tidak menulis `#` ke bilah alamat (galeri, kabar, member, info memakai `history.replaceState` atau `scrollIntoView`).
- Tautan mati `#alat` dihapus dari footer dan menu. Item layanan lama (sholat, libur, kurs, cuaca, tersimpan) ditandai "segera" di `js/services.js`.
- Sisa `#` yang sengaja dibiarkan: `assets/icons/*.svg#id` (sprite ikon, bukan alamat halaman), `#access_token` dari login Google (dikembalikan Supabase lalu langsung dibersihkan oleh `history.replaceState`), dan `#j<id>` di data terstruktur SEO pada `tools/build-static.mjs`.

## 5f. Login di halaman Korea (v50)
- Penyebab login tidak jalan di `ko/`: halaman Korea statis dan tidak memuat `config.js`, `masuk.js`, `masuk.css`, serta tidak punya tombol Masuk. Sekarang ketiganya ada, plus tombol "로그인" di header (berubah jadi chip akun bila sudah masuk).
- `js/masuk.js` dua bahasa: membaca `<html lang>`. Bila `ko`: teks Korea (kamus `KO` di atas file) dan aset/tautan memakai awalan `../`. Untuk menambah teks baru, tambahkan pasangan Indonesia→Korea di `KO`.
- Masuk lewat kode email: tetap di halaman Korea. Masuk lewat Google: kembali ke `akun` (halaman Indonesia, karena token Google dibaca di sana). Halaman Akun, blog, dan tanya masih berbahasa Indonesia.
- Perlu di Supabase: Redirect URLs sudah memakai `.../**`, jadi tidak ada yang diubah.

## 5g. Korea lengkap dan tombol bahasa (v51)
- **Tujuh halaman Korea baru** di `ko/`: `galeri`, `kabar`, `chart`, `info`, `privasi`, `syarat`, `hak-cipta`. Isinya ditulis ulang dalam bahasa Korea (bukan terjemahan mesin per kalimat), mengikuti struktur halaman Indonesia. Halaman dinamis (galeri, kabar, chart, info) memakai JavaScript yang sama dengan versi Indonesia, tetapi label, tanggal (`ko-KR`), dan angka (만/억) diganti. Tetap minta penutur asli Korea mengoreksi teks sebelum dipromosikan.
- **Data Korea:** `data/kabar.ko.json` adalah versi Korea dari `data/kabar.json`. **Tiap kali menambah kabar di `kabar.json` (lewat Issue atau manual), tambahkan juga entri yang sama di `kabar.ko.json`**, dengan `tanggal`, `member`, `sumber_nama`, dan `sumber_url` yang sama. Galeri dan chart memakai data Indonesia yang sama (`galeri.json`, `youtube.json`, `spotify.json`, `apple.json`); keterangan sumber chart ditulis langsung di `ko/chart.html`.
- **Halaman kebijakan Korea** (`privasi`, `syarat`, `hak-cipta`) punya catatan bahwa teks Indonesia yang berlaku bila ada perbedaan. Ubah kedua versi bersamaan tiap kebijakan berubah.
- **Menu Korea:** 홈, 멤버, 정보, 갤러리, 소식, 차트, 사이트 소개 (semua `ko/*.html`, termasuk footer). Di HP menu bisa digeser ke samping dan tab aktif otomatis di tengah. Footer kini menautkan kebijakan versi Korea.
- **Tombol bahasa sederhana:** satu tombol bergambar globe di baris atas. Halaman Indonesia menampilkan "한국어", halaman Korea menampilkan "Indonesia", dan keduanya membawa query/hash (mis. `?m=hanni`) ke padanannya. `js/nav.js` membuat tombol di halaman Indonesia (peta `KO` berisi semua halaman); `privasi.html` dan `syarat.html` punya tombol statis; halaman Korea memakai tautan statis. Gaya tombol: `.slang` di akhir `css/modern.css`.
- **SEO:** 7 halaman Indonesia tadi ditambah `hreflang` `id`/`ko`/`x-default`; semua halaman Korea baru punya `canonical` dan `hreflang` balasan; sitemap (`tools/build-static.mjs`) memuat semuanya.
- **Server lokal:** `tools/dev-server.mjs` (tanpa dependensi) meniru GitHub Pages: `/galeri` dibuka sebagai `galeri.html`, `/ko/` sebagai `ko/index.html`. **Jangan pakai `python -m http.server`**: tautan tanpa `.html` akan 404. Jalankan `node tools/dev-server.mjs 8000`.
- **Codespaces:** `.devcontainer/devcontainer.json` (Node 20) menjalankan server lokal otomatis di port 8000 dan membuka pratinjau.
- Cache naik ke `?v=51`.

## 5h. Bahasa Inggris dan pemilih bahasa (v52)
- **Sepuluh halaman Inggris** di `en/`: `index`, `member`, `info`, `galeri`, `kabar`, `chart`, `tentang`, `privasi`, `syarat`, `hak-cipta` (+ `css/en.css`, memakai kerangka `ko.css`). Padanan 1:1 dengan `ko/`. Teks ditulis untuk pembaca Inggris, bukan terjemahan mesin per kalimat; tetap minta penutur asli meninjau sebelum dipromosikan. Halaman kebijakan menyebut teks Indonesia yang berlaku bila ada perbedaan.
- **Pemilih bahasa baru: `js/lang.js`.** Satu tombol globe (ID / EN / KO) membuka menu tiga bahasa. Dipasang sinkron sebagai script terakhir di dalam `<header>` (atau `.pg-top`) di semua halaman Indonesia, Korea, dan Inggris kecuali `admin.html`. Bahasa saat ini dibaca dari `<html lang>`. Halaman yang punya padanan di tiga bahasa (daftar `PAGES` di file itu) berpindah ke halaman yang sama dengan query dan hash; halaman lain (blog, tanya, akun, profil, search, layanan, brand) hanya ada dalam bahasa Indonesia, jadi bahasa lain menuju beranda. Tombol statis `.slang` di HTML tetap ada sebagai cadangan bila JavaScript mati. Gaya: akhir `css/modern.css` (`.lsw`, `.lmenu`). Blok tombol Korea lama di `js/nav.js` dihapus.
- **Halaman dinamis tetap Indonesia.** Blog, Tanya Jawab, Akun, Profil, dan Cari diisi dari database dan antarmukanya masih Indonesia. Halaman Inggris menautkan ke sana dan memberi catatan, sama seperti halaman Korea. Menerjemahkannya butuh kamus string di tiap JS dan kolom bahasa di database; belum dikerjakan.
- **Dialog masuk tiga bahasa:** `js/masuk.js` membaca `<html lang>` = `id` / `ko` / `en`. Teks baru: tambahkan pasangan Indonesia→Inggris di kamus `EN` (dan Korea di `KO`).
- **Data:** `data/kabar.en.json` adalah versi Inggris dari `data/kabar.json`. **Tiap menambah kabar, tambahkan juga entri yang sama di `kabar.ko.json` dan `kabar.en.json`** (`tanggal`, `member`, `sumber_nama`, `sumber_url` sama). Workflow `kabar.yml` hanya menulis ke `kabar.json`.
- **SEO:** semua halaman Inggris punya `canonical` dan `hreflang` `en`/`id`/`ko`/`x-default`; halaman Indonesia dan Korea yang punya padanan ditambah `hreflang="en"` (termasuk `privasi` dan `syarat` Indonesia). Halaman Inggris masuk sitemap (`tools/build-static.mjs`).
- **Menambah halaman baru:** buat berkas di `en/` dan `ko/`, tambahkan namanya ke `PAGES` di `js/lang.js`, ke sitemap, dan beri `hreflang` di ketiga versi.
- Cache naik ke `?v=52`.

## 5i. Navigasi baru: baris atas menempel, logo menyesuaikan (v54)
- **File:** `css/navbar.css` (baru, dimuat PALING AKHIR di semua halaman yang memakai `js/nav.js`), `js/nav.js` (bagian gulir ditulis ulang), `js/menu.js` (satu perbaikan), `css/portal.css` dan `css/nav.css` (aturan header lama yang bentrok dihapus). Cache naik ke `?v=54`.
- **Baris atas selalu menempel** di HP dan desktop (logo, kotak cari, bahasa, akun). Dulu di HP baris atas ikut hilang saat menggulir ke bawah (`hide1`), jadi kotak cari ringkas ikut lenyap. `hide1` dihapus.
- **Baris tab** (Beranda, Member, ...): di HP/tablet (<1000px) menyelinap ke balik baris atas saat menggulir ke bawah (kelas `hide2`) dan turun lagi saat menggulir ke atas. Di desktop selalu tampil. Tinggi header tidak berubah (hanya `transform`), jadi halaman tidak melompat. Header sendiri transparan; latar baris atas digambar oleh `header::before` setinggi `--h1` (56px), baris tab `--h2` (42px).
- **Kotak cari ringkas** (`.hsearch`) kini SELALU ada di DOM dan di-fade (opacity/transform), bukan `display:none`. Tempatnya sudah tersedia di baris atas, jadi tidak ada elemen yang saling dorong atau tumpang tindih. Muncul saat kotak cari besar di beranda tergulir keluar (kelas `compact`).
- **Bug lama yang diperbaiki di `js/menu.js`:** kondisi `compact` memakai `boundingClientRect.top < 0`, padahal saat digulir pelan kotak melewati garis dengan `top` masih positif, sehingga kotak cari ringkas tidak pernah muncul. Sekarang memakai `bottom <= rootBounds.top`.
- **Logo tidak pernah hilang:** teks "bunnies" dibungkus `<span>` (nav.js membungkusnya otomatis bila perlu) dan menyusut halus (`max-width` + opacity) jadi ikon saja di HP (<700px) saat kotak cari tampil. Di desktop teks tetap.
- **Beranda HP, saat tergulir:** tombol bahasa mengecil ke nol supaya kotak cari lega; kembali saat di atas. Placeholder kotak cari jadi "Cari…" di layar <=520px.
- **Halaman dalam** (`header.sbar`: Blog, Tanya, Member, Info, Galeri, Chart, Kabar, Akun, Profil) otomatis mendapat kotak cari di baris atas (nav.js, GET ke `search`). Di HP tampil sebagai tombol ikon bulat; di layar >=700px sebagai kotak penuh. `search.html` memakai kotaknya sendiri (`#sform`) dan tidak disentuh.
- **Tidak diubah:** `en/`, `ko/` (header `.kbar`), `layanan.html`, `admin.html`. Header mereka masih lama.
- **Diuji** (Chromium, 320/390/768/1024/1280px, 13 halaman): tanpa elemen tumpang tindih, tanpa overflow horizontal, tanpa error JS, header menempel, kotak cari ringkas tampil saat gulir pelan dan gulir loncat, baris tab menyelinap dan kembali (HP) / tetap (desktop), transisi bertahap (fade ~250ms, logo menyusut ~300ms), `prefers-reduced-motion` dihormati.


## 5j. Perbaikan tombol bahasa, pemutar tanpa putus, dan CSS bergaya iCloud (v55)

**Bug tombol bahasa (akar masalah).** `js/lang.js` membaca bahasa dari `<html lang>`, tetapi navigasi halus di `js/player.js` tidak memperbarui atribut itu. Akibatnya, sesudah berpindah ke English tanpa muat ulang, tombol masih berlabel "ID" dan tautannya jadi `/en/ko/` (404). Perbaikan:
- `lang.js`: bahasa dan alamat dihitung dari URL (`/en/`, `/ko/`), tautan memakai alamat mutlak, dan dihitung ulang tiap menu dibuka (hash/query terbaru ikut).
- `player.js`: `go()` kini menyamakan `<html lang>`, `canonical`, dan `hreflang` dengan halaman baru.

**Lagu tidak boleh mati saat pindah halaman.**
- `en/*.html` dan `ko/*.html` sebelumnya TIDAK memuat `player.js`, jadi lagu mati di sana. Sudah ditambahkan.
- Pindah halaman keras yang tersisa diganti `bunGo(url)`: kotak cari ringkas di header (`nav.js`), form di halaman Cari (`search.js`), cari profil dan redirect profil (`profil-publik.js`), pendaftaran selesai (`masuk.js`). `location.reload()` di `masuk.js` dan `tanya.js` kini `bunGo(location.href, false)` (muat ulang halus tanpa riwayat baru).
- `bunGo(url, false)` = ganti halaman tanpa menambah riwayat.
- Observer halaman (IntersectionObserver/MutationObserver/ResizeObserver) kini dilepas saat pindah halaman. Dulu `menu.js` melempar error setelah pindah dari beranda.
- Yang tetap memutus lagu: login Google (keluar dari situs), halaman `admin*`, dan membuka via `file://`.

**CSS bergaya iCloud: `css/icloud.css`** (dimuat paling akhir; hapus `<link>` untuk kembali ke v54).
- Huruf: tumpukan font sistem Apple (SF Pro), cadangan Instrument Sans; antialias, kerning, pelacakan rapat, tanpa bayangan teks.
- Skala huruf `--t-xs..--t-2xl` dan skala jarak `--s1..--s6` (kelipatan 4/8), dipakai untuk padding tombol (em), kartu, bagian, dan daftar.
- Header kaca buram; garis rambut 0,5 px di layar retina; permukaan datar; kotak cari dengan cincin fokus.
- Blok HAIRLINE di dasar file dihasilkan oleh `python3 tools/gen-hairline.py`. Jalankan ulang bila aturan border di CSS lain berubah.
- Versi cache dinaikkan ke `?v=55`. `go()` menyisipkan stylesheet baru SEBELUM `icloud.css` supaya tetap menjadi yang terakhir.

## v47: profil sebagai hub (tahap 1)

- Halaman Akun (`akun.html`, `en/akun.html`, `ko/akun.html`) punya kartu profil (avatar, nama, handle, bias, bio, statistik tulisan dan komentar, sosial media) dan dua tab: Profil dan Pengaturan.
- Sosial media disimpan lewat `save_socials` (supabase/v47-profil-hub.sql). Hanya domain resmi yang diizinkan: Instagram, X, TikTok, YouTube, Weverse, Spotify.
- **Terjemahan:** teks Indonesia di halaman dan pesan JavaScript diterjemahkan lewat `js/i18n.js` (fungsi `T()` dan `applyI18n()`). Bahasa dibaca dari `<html lang>`. Untuk menambah teks baru, tambahkan pasangan Indonesia, en, ko di kamus `I18N`. Jangan menerjemahkan langsung di HTML.
- Salinan `en/akun.html` dan `ko/akun.html` dibuat dari `akun.html` dengan jalur relatif yang diganti (`../`). Setiap perubahan struktur di `akun.html` perlu disalin ulang ke kedua file itu.
- `lokasi.js` menghitung alamat data dari lokasi skripnya sendiri, sehingga bekerja dari `en/` dan `ko/`.
- Terjemahan Korea belum ditinjau penutur asli.

## v48: pilih lagu di beranda

- Blok "Putar lagu" (beranda `index.html` dan `en/index.html`) punya daftar lagu dari `data/youtube.json`, diurutkan dari tayangan terbanyak. Tampil 12 dulu, lalu "Tampilkan semua".
- Klik Putar memanggil `BunPlayer.playVideo(id, judul)` di `js/player.js`, yaitu memutar satu video YouTube. Riwayat dengar tetap dicatat per lagu.
- Logika daftar ada di `js/pilih-lagu.js`, gayanya di `css/pilih-lagu.css`.
- **Belum ada:** pilihan lagu Spotify. `data/spotify.json` belum punya ID track, jadi perlu ditambahkan dulu. Halaman ko belum punya blok ini.
