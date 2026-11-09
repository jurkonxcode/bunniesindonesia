/* Daftar layanan Niflax (v16): dipakai halaman Semua layanan (js/layanan.js) dan panel menu hamburger (js/menu.js).
   Tiap item: [id ikon, nama, tujuan, status]. Tanpa tujuan = belum tersedia (ditandai "segera"). Muat file ini SEBELUM layanan.js / menu.js. */
const GROUPS = [
  {c:"g2", name:"Alat harian", items:[["sholat","Jadwal sholat","./#tool-sholat"],["libur","Libur nasional","./#tool-libur"],["kurs","Kurs dan emas","","segera"],["resi","Cek resi","","segera"]]},
  {c:"g4", name:"Komunitas dan konten", items:[["tanya","Tanya Jawab","tanya"],["komunitas","Komunitas","","segera"],["blog","Blog","blog"],["kreator","Pusat kreator","","segera"]]},
  {c:"g1", name:"Berita dan info", items:[["berita","Berita","","segera"],["bola","Bola","","segera"],["hiburan","Hiburan","","segera"],["cuaca","Cuaca","","segera"]]},
  {c:"g3", name:"Video dan belanja", items:[["video","Video","","segera"],["belanja","Belanja","","segera"],["komik","Komik","","segera"]]},
  {c:"g5", name:"Gaya hidup dan perjalanan", items:[["kuliner","Kuliner","","segera"],["otomotif","Otomotif","","segera"],["religi","Religi","","segera"],["peta","Peta","","segera"],["tiket","Tiket","","segera"]]},
  {c:"g6", name:"Akun dan Niflax", items:[["tersimpan","Berita tersimpan","./#acct"],["tentang","Tentang","tentang"],["kontak","Kontak","tentang#kontak"],["privasi","Kebijakan privasi","privasi"],["syarat","Syarat layanan","syarat"],["brand","Panduan merek","brand"]]}
];
