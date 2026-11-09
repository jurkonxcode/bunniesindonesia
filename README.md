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


- v17: klasifikasi berita otomatis (`tools/klasifikasi.mjs`), 14 kategori, `--cek-url`, pembersihan berita lama. Baca `HANDOFF.md` bagian 24.
- v24: beranda ala portal besar (panel, baris ikon satu baris, kolom samping). Baca `HANDOFF.md` bagian 26.
- v25: halaman statis SEO + sitemap lewat GitHub Actions (`tools/build-static.mjs`). Baca `HANDOFF.md` bagian 27.
- v26: panel admin (`/admin`), moderasi laporan termasuk tulisan blog, blokir pengguna, halaman Akun saya (ubah nama, unduh data, hapus akun). Jalankan `supabase/v26-moderasi.sql`. Baca `HANDOFF.md` bagian 28.
