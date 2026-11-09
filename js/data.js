/* Data contoh. Berita dan kata kunci populer diambil dari Supabase jika config.js terisi. */
const PAL = [["#03c75a","#0b8f7a"],["#5b4bdb","#9b6cf0"],["#f59e0b","#ef5a6f"],["#0ea5e9","#5b4bdb"],["#10b981","#84cc16"],["#ef5a6f","#8b5cf6"]];

const demoNews = [
  {title:"Pusat data hijau pertama di Asia Tenggara mulai beroperasi",summary:"Fasilitas baru memakai energi surya dan pendinginan air laut untuk menekan emisi karbon.",category:"Teknologi",source:"Niflax Tekno",time:"12 menit lalu"},
  {title:"Kereta cepat tambah rute akhir pekan ke tiga kota",category:"Nasional",source:"Niflax News",time:"35 menit lalu"},
  {title:"Startup lokal luncurkan asisten AI berbahasa daerah",category:"Teknologi",source:"Niflax Tekno",time:"1 jam lalu"},
  {title:"Rupiah menguat tipis, investor menanti data inflasi",category:"Ekonomi",source:"Niflax Bisnis",time:"1 jam lalu"},
  {title:"Harga tiket konser turun, penonton muda melonjak",category:"Hiburan",source:"Niflax Hiburan",time:"2 jam lalu"},
  {title:"Timnas U-23 umumkan skuad untuk laga persahabatan",category:"Olahraga",source:"Niflax Sport",time:"2 jam lalu"},
  {title:"Peneliti temukan cara baru mendaur ulang baterai kendaraan listrik",category:"Sains",source:"Niflax Sains",time:"3 jam lalu"},
  {title:"Festival film Asia pilih Jakarta sebagai tuan rumah berikutnya",category:"Hiburan",source:"Niflax Hiburan",time:"4 jam lalu"},
  {title:"Pemerintah perluas internet desa ke 2.000 titik baru",category:"Nasional",source:"Niflax News",time:"5 jam lalu"},
  {title:"UMKM kuliner naik kelas lewat ekspor makanan beku",category:"Ekonomi",source:"Niflax Bisnis",time:"6 jam lalu"}
];
const demoTrend = ["AI berbahasa daerah","Kereta cepat","Jadwal konser","Daur ulang baterai","Cuaca Jakarta","Timnas U-23","Film Asia","Harga emas"];
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
  ["Berita","M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-3 2M8 9h5M8 13h5","#berita"],
  ["Blog","M4 20l1-5L16 4l4 4L9 19zM14 6l4 4","#"],
  ["Komunitas","M4 5h16v11H9l-5 4zM8 9h8M8 12h5","#komunitas"],
  ["Video","M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z","#video"],
  ["Belanja","M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0","#belanja"],
  ["Peta","M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5","#"],
  ["Terjemah","M4 6h9M8.5 4v2M6 6c1 4 3 6 6 7M12 6c-1 4-3 6-6 7M13 20l4-9 4 9M14.5 17h5","#"],
  ["Komik","M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9h16M4 15h16M12 3v18","#komik"],
  ["Olahraga","M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18","#"],
  ["Finansial","M5 20V10M12 20V4M19 20v-8","#"]
];
