/* Data contoh. Berita dan kata kunci populer diambil dari Supabase jika config.js terisi. */
const PAL = [["#17a862","#0b8f7a"],["#5b4bdb","#9b6cf0"],["#f59e0b","#ef5a6f"],["#0ea5e9","#5b4bdb"],["#10b981","#84cc16"],["#ef5a6f","#8b5cf6"]];

const demoNews = [
  {title:"Pusat data hijau pertama di Asia Tenggara mulai beroperasi",summary:"Fasilitas baru memakai energi surya dan pendinginan air laut untuk menekan emisi karbon.",category:"Teknologi",source:"Niflax Tekno",time:"12 menit lalu"},
  {title:"Timnas U-23 umumkan skuad untuk laga persahabatan",summary:"Pelatih memanggil 26 pemain, termasuk tiga debutan dari kompetisi Liga 1.",category:"Bola",source:"Niflax Bola",time:"25 menit lalu"},
  {title:"Kereta cepat tambah rute akhir pekan ke tiga kota",category:"Nasional",source:"Niflax News",time:"35 menit lalu"},
  {title:"Harga emas Antam bergerak naik, pembeli ritel ramai",category:"Ekonomi",source:"Niflax Bisnis",time:"1 jam lalu"},
  {title:"Drama Korea terbaru puncaki daftar tontonan pekan ini",category:"Hiburan",source:"Niflax Hiburan",time:"1 jam lalu"},
  {title:"Resep soto ayam kuning, kuah bening dan bumbu meresap",category:"Kuliner",source:"Niflax Kuliner",time:"2 jam lalu"},
  {title:"Motor listrik baru dibanderol di bawah Rp20 juta",category:"Otomotif",source:"Niflax Otomotif",time:"2 jam lalu"},
  {title:"Jadwal kajian dan program Maulid di berbagai kota",category:"Religi",source:"Niflax Religi",time:"3 jam lalu"},
  {title:"Persija dan Persib bersiap hadapi laga klasik akhir pekan",category:"Bola",source:"Niflax Bola",time:"3 jam lalu"},
  {title:"Startup lokal luncurkan asisten AI berbahasa daerah",category:"Teknologi",source:"Niflax Tekno",time:"4 jam lalu"},
  {title:"Pemerintah perluas internet desa ke 2.000 titik baru",category:"Nasional",source:"Niflax News",time:"5 jam lalu"},
  {title:"UMKM kuliner naik kelas lewat ekspor makanan beku",category:"Ekonomi",source:"Niflax Bisnis",time:"6 jam lalu"}
];
const demoTrend = ["Jadwal Liga 1","Harga emas hari ini","Cek resi","Promo 11.11","Cuaca besok","Jadwal sholat","Drama Korea terbaru","Pajak kendaraan"];
const ticker = [["IHSG","7.412,5","+0,42%",1],["USD/IDR","15.980","-0,18%",0],["Emas/gr","1.385.000","+0,30%",1],["BTC","$68.240","+1,10%",1],["Minyak","$81,2","-0,65%",0]];
const videos = [
  {title:"Keliling Nusantara: 7 pantai tersembunyi di timur Indonesia",dur:"12:40"},
  {title:"Resep nasi goreng kampung ala warung 24 jam",dur:"08:15"},
  {title:"Review ponsel terbaru di bawah Rp3 juta",dur:"15:02"},
  {title:"Cuplikan gol terbaik pekan ini",dur:"05:48"}
];
const products = [
  {name:"Earbuds nirkabel bass kuat, baterai 30 jam",price:149000,old:229000,off:35},
  {name:"Kemeja linen pria lengan panjang",price:119000,old:159000,off:25},
  {name:"Botol minum stainless 750 ml",price:79000,old:99000,off:20},
  {name:"Tas ransel laptop anti air 15 inci",price:189000,old:289000,off:34}
];
const communities = [
  {name:"Pecinta Kopi Nusantara",members:"128 rb"},
  {name:"Komunitas Programmer ID",members:"96 rb"},
  {name:"Traveler Indonesia",members:"214 rb"},
  {name:"Investor Pemula",members:"87 rb"},
  {name:"Otomotif Klasik",members:"52 rb"}
];
const comics = [{title:"Langit Sembilan",genre:"Fantasi"},{title:"Kota Tanpa Malam",genre:"Fiksi ilmiah"},{title:"Dapur Mak Ijah",genre:"Komedi"},{title:"Pendekar Senja",genre:"Aksi"},{title:"Surat untuk Rani",genre:"Romansa"},{title:"Rumah di Ujung Gang",genre:"Misteri"}];
const scores = [["Persib","2 – 1","Persija"],["Bali United","0 – 0","Arema"],["PSM","3 – 2","Persebaya"]];
const shortcuts = [
  ["Berita","berita","#berita","","g1"],
  ["Bola","bola","#berita","Bola","g1"],
  ["Hiburan","hiburan","#berita","Hiburan","g1"],
  ["Video","video","#video","","g3"],
  ["Belanja","belanja","#belanja","","g3"],
  ["Kuliner","kuliner","#berita","Kuliner","g5"],
  ["Religi","religi","#berita","Religi","g5"],
  ["Otomotif","otomotif","#berita","Otomotif","g5"],
  ["Cek resi","resi","#tool-resi","","g2"],
  ["Kurs & emas","kurs","#tool-kurs","","g2"]
];
/* Ikon dan warna gambar sampul per kategori berita: [id ikon di assets/icons/niflax-icons.svg, indeks PAL] */
const CAT_ART = {Nasional:["nasional",0],Teknologi:["teknologi",3],Bola:["bola",4],Olahraga:["bola",4],Ekonomi:["kurs",0],Hiburan:["hiburan",1],Kuliner:["kuliner",5],Otomotif:["otomotif",3],Religi:["religi",4]};
const quick = ["Cek resi","Jadwal sholat","Kurs dolar","Harga emas","Libur nasional"];
const prayer = [["Subuh","04:05"],["Zuhur","11:51"],["Asar","15:12"],["Magrib","17:55"],["Isya","19:05"]];
const rates = [["USD","15.980","-0,18%",0],["SGD","11.850","+0,10%",1],["EUR","17.420","+0,22%",1],["Emas Antam/gr","1.385.000","+0,30%",1]];
const couriers = ["JNE","J&T","SiCepat","AnterAja","Pos Indonesia","Shopee Express"];
const holidays = [["Hari Raya Natal","2026-12-25"],["Tahun Baru Masehi","2027-01-01"]];
const toolRoutes = [[/resi|paket|kurir/i,"tool-resi"],[/sholat|salat|shalat|adzan|azan/i,"tool-sholat"],[/kurs|dolar|dollar|emas|antam/i,"tool-kurs"],[/libur|cuti/i,"tool-libur"]];

/* Tab beranda: [kunci, label]. Bola/Hiburan/Kuliner/Religi/Otomotif menyaring berita menurut kategori. */
const TABS = [["Semua","Semua"],["Berita","Berita"],["Bola","Bola"],["Hiburan","Hiburan"],["Video","Video"],["Belanja","Belanja"],["Kuliner","Kuliner"],["Religi","Religi"],["Otomotif","Otomotif"],["Tanya","Tanya Jawab"]];
