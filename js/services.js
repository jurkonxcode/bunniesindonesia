/* Daftar layanan Bunnies Indonesia (v16): dipakai halaman Semua layanan (js/layanan.js) dan panel menu hamburger (js/menu.js).
   Tiap item: [id ikon, nama, tujuan, status]. Tanpa tujuan = belum tersedia (ditandai "segera"). Muat file ini SEBELUM layanan.js / menu.js. */
const GROUPS = [
  {c:"g2", name:"Alat harian", items:[["sholat","Jadwal sholat","","segera"],["libur","Libur nasional","","segera"],["kurs","Kurs rupiah","","segera"],["resi","Cek resi","","segera"]]},
  {c:"g4", name:"Komunitas dan konten", items:[["tentang","Info &amp; link resmi","info"],["tanya","Tanya Jawab","tanya"],["komunitas","Komunitas","","segera"],["blog","Blog","blog"],["kreator","Pusat kreator","","segera"]]},
  {c:"g1", name:"Berita dan info", items:[["berita","Berita","","segera"],["bola","Olahraga","blog?cat=Olahraga"],["hiburan","Hiburan","blog?cat=Hiburan"],["cuaca","Cuaca","","segera"]]},
  {c:"g3", name:"Video dan belanja", items:[["video","Video","","segera"],["belanja","Belanja","","segera"],["komik","Komik","","segera"]]},
  {c:"g5", name:"Gaya hidup dan perjalanan", items:[["kuliner","Kuliner","blog?cat=Kuliner"],["otomotif","Otomotif","blog?cat=Otomotif"],["religi","Religi","","segera"],["peta","Peta","","segera"],["tiket","Tiket","","segera"]]},
  {c:"g6", name:"Akun dan Bunnies Indonesia", items:[["akun","Akun saya","akun"],["tersimpan","Berita tersimpan","","segera"],["tentang","Tentang","tentang"],["kontak","Kontak","tentang?b=kontak"],["privasi","Kebijakan privasi","privasi"],["syarat","Syarat layanan","syarat"],["brand","Panduan merek","brand"]]}
];
