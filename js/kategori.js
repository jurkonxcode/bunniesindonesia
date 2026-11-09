/* v33: kategori fanpage (keputusan pemilik). Database menyimpan slug, layar menampilkan nama.
   Urutan di sini = urutan di beranda dan form tulis. Slug harus sama dengan constraint di supabase/v33-kategori-fanpage.sql.
   Dimuat setelah config.js dan sebelum file lain yang memakai CATS atau catLabel. */
const KATEGORI = [["info","Info & Update"],["diskusi","Diskusi"],["fanart","Fanart & Kreatif"],["musik","Musik"],["video","Video & MV"],["event","Event"],["umum","Umum"]];
const CATS = KATEGORI.map(k => k[0]);
const catLabel = s => { const k = KATEGORI.find(x => x[0] === s); return k ? k[1] : "Umum"; };
/* Isi <select> form tulis. Pilihan awal kosong dan wajib diisi, supaya tulisan tidak diam-diam jadi "Info & Update". */
const catOptions = () => `<option value="" disabled selected>Pilih kategori…</option>` + KATEGORI.map(([s, l]) => `<option value="${s}">${l.replace(/&/g, "&amp;")}</option>`).join("");
