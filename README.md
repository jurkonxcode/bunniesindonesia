# Bunnies Indonesia

Fanpage NewJeans tidak resmi untuk penggemar Indonesia. Tidak berafiliasi dengan ADOR atau NewJeans.

HTML, CSS, dan JavaScript murni di GitHub Pages, dengan Supabase untuk database, login, dan penyimpanan.

```
index.html, blog.html, tanya.html, akun.html, admin.html   halaman utama
css/    tokens (warna), base, identity, komentar, ...
js/    config (kunci Supabase), state, api, blog, tanya, akun, admin, bias, ...
supabase/   file SQL (jalankan urut sesuai HANDOFF.md bagian 4)
tools/  build-static.mjs (halaman statis untuk SEO)
```

- Dokumen lengkap, termasuk urutan SQL, aturan keamanan, dan rencana: baca **HANDOFF.md**.
- Ubah warna di `css/tokens.css`. Isi kunci Supabase di `js/config.js`.
- Urutan tag `<script>` harus dipertahankan. Naikkan `?v=NN` di semua HTML tiap rilis.
- Semua path relatif, jadi situs jalan di `username.github.io/bunniesindonesia`.

## Bahasa

Situs punya dua bahasa: Indonesia (halaman di root) dan Korea (`ko/`). Tombol di baris atas berpindah di antara keduanya.
Data kabar Korea ada di `data/kabar.ko.json` (selalu diperbarui bersama `data/kabar.json`).

## Menjalankan lokal / GitHub Codespaces

```bash
node tools/dev-server.mjs 8000      # lalu buka http://localhost:8000 (Codespaces: tab Ports, port 8000)
```

Memakai server ini, bukan `python -m http.server`, karena tautan tanpa `.html` (mis. `/galeri`) harus dikenali seperti di GitHub Pages.
Di Codespaces, server sudah berjalan otomatis lewat `.devcontainer/devcontainer.json`.
