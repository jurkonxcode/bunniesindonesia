# Niflax

Portal bergaya Naver, HTML/CSS/JS murni dengan backend Supabase.

```
index.html
css/      tokens (warna), base, header, hero, shortcuts, content, responsive
js/       config (kunci Supabase), data (data contoh), state, api, ui, main
assets/   gambar, ikon, font lokal
```

- Ubah warna di `css/tokens.css`. Isi kunci Supabase di `js/config.js`.
- Urutan tag `<script>` di `index.html` harus dipertahankan.
- Semua path relatif, jadi situs jalan di `username.github.io/niflax` tanpa domain khusus.
- Saat domain sudah dibeli, tambahkan file `CNAME` berisi nama domain.
- Tabel Supabase yang dibaca: `news` (title, summary, category, source, created_at) dan `trending` (keyword, rank).
