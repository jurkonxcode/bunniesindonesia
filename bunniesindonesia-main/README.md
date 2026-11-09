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
