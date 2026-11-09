/* v13: tidak ada lagi data contoh. Isi file ini hanya konfigurasi tampilan dan data resmi.
   Berita, pertanyaan, dan kata kunci populer datang dari Supabase. */
const PAL = [["#2f6fe4","#0b8f7a"],["#5b4bdb","#9b6cf0"],["#f59e0b","#ef5a6f"],["#0ea5e9","#5b4bdb"],["#10b981","#84cc16"],["#ef5a6f","#8b5cf6"]];

/* Ikon dan warna sampul per kategori berita: [id ikon di assets/icons/bunnies-icons.svg, indeks PAL] */
/* v17: urutan kunci di sini = urutan tab kategori di beranda. Kategori baru wajib ditambah di sini DAN di tools/klasifikasi.mjs. */
const CAT_ART = {Kuliah:["blog",1],Kerja:["kurs",0],Visa:["syarat",3],Bahasa:["tanya",2],Budaya:["hiburan",1],"Hidup di sana":["peta",3],Nasional:["nasional",0],Politik:["nasional",1],Hukum:["syarat",3],Internasional:["peta",3],Ekonomi:["kurs",0],Teknologi:["teknologi",3],Bola:["bola",4],Olahraga:["bola",4],Hiburan:["hiburan",1],Kuliner:["kuliner",5],Otomotif:["otomotif",3],Religi:["religi",4],Kesehatan:["berita",4],Pendidikan:["blog",1],Umum:["berita",0],"Catatan harian":["blog",2]};

/* Chip pencarian cepat: hanya yang punya alat nyata */
const quick = ["Minji","Hanni","Danielle","Haerin","Hyein"];
const toolRoutes = [[/sholat|salat|shalat|adzan|azan|subuh|magrib|maghrib/i,"tool-sholat"],[/libur|cuti|tanggal merah/i,"tool-libur"]];

/* Kota untuk jadwal sholat: [nama, lintang, bujur, selisih jam dari UTC]. WIB = 7, WITA = 8, WIT = 9. */
const CITIES = [
  ["Banda Aceh",5.5483,95.3238,7],["Medan",3.5952,98.6722,7],["Padang",-0.9471,100.4172,7],["Pekanbaru",0.5071,101.4478,7],
  ["Batam",1.0456,104.0305,7],["Palembang",-2.9761,104.7754,7],["Bandar Lampung",-5.45,105.2667,7],["Jakarta",-6.2088,106.8456,7],
  ["Bandung",-6.9175,107.6191,7],["Semarang",-6.9667,110.4167,7],["Yogyakarta",-7.7956,110.3695,7],["Surabaya",-7.2575,112.7521,7],
  ["Malang",-7.9839,112.6214,7],["Pontianak",-0.0263,109.3425,7],["Palangkaraya",-2.2161,113.9135,7],
  ["Banjarmasin",-3.3194,114.5908,8],["Balikpapan",-1.2379,116.8529,8],["Samarinda",-0.5022,117.1536,8],["Denpasar",-8.6705,115.2126,8],
  ["Mataram",-8.5833,116.1167,8],["Kupang",-10.1772,123.607,8],["Makassar",-5.1477,119.4327,8],["Palu",-0.8917,119.8707,8],
  ["Kendari",-3.9985,122.5129,8],["Manado",1.4748,124.8421,8],["Ambon",-3.6954,128.1814,9],["Ternate",0.7833,127.3667,9],
  ["Sorong",-0.8762,131.2558,9],["Jayapura",-2.5337,140.7181,9]
];

/* Libur nasional dan cuti bersama. Sumber: SKB 3 Menteri (Agama, Ketenagakerjaan, PANRB).
   2026: SKB 2025 (hanya sisa tahun ini). 2027: SKB 15 September 2026, https://www.setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2027
   t: "libur" = libur nasional, "cuti" = cuti bersama. Idulfitri dan Iduladha ditetapkan Menteri Agama dan bisa bergeser.
   Perbarui file ini tiap September, saat SKB tahun berikutnya terbit. Tanggal yang lewat boleh dihapus. */
const holidays = [
  ["2026-12-24","Cuti bersama Natal","cuti"],["2026-12-25","Hari Raya Natal","libur"],
  ["2027-01-01","Tahun Baru 2027 Masehi","libur"],["2027-01-05","Isra Mikraj Nabi Muhammad SAW","libur"],
  ["2027-02-05","Cuti bersama Tahun Baru Imlek","cuti"],["2027-02-06","Tahun Baru Imlek 2578","libur"],
  ["2027-03-08","Hari Suci Nyepi (Tahun Baru Saka 1949)","libur"],["2027-03-09","Cuti bersama Idulfitri","cuti"],
  ["2027-03-10","Idulfitri 1448 H","libur"],["2027-03-11","Idulfitri 1448 H","libur"],
  ["2027-03-12","Cuti bersama Idulfitri","cuti"],["2027-03-15","Cuti bersama Idulfitri","cuti"],
  ["2027-03-25","Cuti bersama Wafat Yesus Kristus","cuti"],["2027-03-26","Wafat Yesus Kristus","libur"],
  ["2027-03-28","Kebangkitan Yesus Kristus (Paskah)","libur"],["2027-05-01","Hari Buruh Internasional","libur"],
  ["2027-05-06","Kenaikan Yesus Kristus","libur"],["2027-05-17","Iduladha 1448 H","libur"],
  ["2027-05-18","Cuti bersama Iduladha","cuti"],["2027-05-19","Cuti bersama Waisak","cuti"],
  ["2027-05-20","Hari Raya Waisak 2571 BE","libur"],["2027-06-01","Hari Lahir Pancasila","libur"],
  ["2027-06-06","1 Muharam, Tahun Baru Islam 1449 H","libur"],["2027-08-15","Maulid Nabi Muhammad SAW","libur"],
  ["2027-08-17","Proklamasi Kemerdekaan RI","libur"],["2027-12-24","Cuti bersama Natal","cuti"],
  ["2027-12-25","Hari Raya Natal","libur"],["2027-12-26","Isra Mikraj Nabi Muhammad SAW","libur"]
];
const HOLIDAY_SRC = "https://www.setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2027";

/* Pintasan: [nama, ikon, tujuan, kategori berita, kelompok warna] */
const shortcuts = [];
