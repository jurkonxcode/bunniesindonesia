# Niflax

Portal bergaya Naver, HTML/CSS/JS murni dengan backend Supabase.

```
index.html
css/      tokens (warna), base, header, hero, shortcuts, content, responsive
js/       config (kunci Supabase), data (kota + libur nasional), state, api, ui, sholat, tools, main
assets/   gambar, ikon, font lokal
```

- Ubah warna di `css/tokens.css`. Isi kunci Supabase di `js/config.js`.
- Urutan tag `<script>` di `index.html` harus dipertahankan.
- Semua path relatif, jadi situs jalan di `username.github.io/niflax` tanpa domain khusus.
- Saat domain sudah dibeli, tambahkan file `CNAME` berisi nama domain.
- Tidak ada data contoh sejak v13. Tabel Supabase yang dibaca: `news`, `trending`, `questions`. Baca `HANDOFF.md` bagian 20.

- Impor berita RSS: `tools/` + `.github/workflows/impor-berita.yml`. Baca `HANDOFF.md` bagian 22.
