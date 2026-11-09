/* Klasifikasi berita otomatis berdasarkan kata kunci (Niflax v17).
   Tanpa AI, tanpa biaya, tanpa dependensi. Dipakai oleh tools/impor-berita.mjs.

   Cara kerja:
   - Judul dihitung bobot 2, deskripsi feed bobot 1 (deskripsi hanya dipakai untuk menghitung skor, TIDAK disimpan).
   - Kategori dengan skor tertinggi menang. Skor minimal 2 (artinya minimal satu kata kunci di judul).
   - Bila seri, kategori yang lebih awal di ATURAN menang. Bila tidak ada yang cukup, dipakai kategori bawaan feed.
   - Kata kunci diakhiri "*" berarti awalan kata (mis. "ekonom*" cocok dengan ekonomi, ekonomis, ekonomi-nya).
   - Kata kunci tanpa "*" harus cocok satu kata utuh, jadi "gol" tidak cocok dengan "Golkar".

   Tambah kata kunci atau kategori baru: ubah ATURAN di bawah. Kategori baru juga perlu ditambah ke CAT_ART di js/data.js. */

export const ATURAN = {
  Bola: ["sepak bola", "sepakbola", "liga 1", "liga 2", "liga indonesia", "timnas*", "piala dunia", "liga champions", "liga inggris", "liga italia", "liga spanyol", "liga jerman",
    "premier league", "la liga", "serie a", "bundesliga", "gol", "striker", "kiper", "pssi", "fifa", "afc", "persib", "persija", "persebaya", "arema", "psm makassar", "bali united",
    "barcelona", "real madrid", "manchester united", "manchester city", "liverpool", "chelsea", "arsenal", "bayern", "juventus", "inter milan", "ac milan", "psg", "garuda muda", "shin tae-yong", "patrick kluivert"],
  Olahraga: ["olahraga", "bulu tangkis", "badminton", "pbsi", "motogp", "formula 1", "f1", "tenis", "basket", "nba", "bola voli", "voli", "olimpiade", "sea games", "asian games", "atlet*", "medali",
    "maraton", "renang", "tinju", "ufc", "mma", "angkat besi", "pencak silat", "panahan", "e-sports", "esports", "ppon", "kejuaraan"],
  Ekonomi: ["ekonom*", "rupiah", "ihsg", "saham", "bursa", "inflasi", "bi rate", "suku bunga", "apbn", "apbd", "investasi", "investor", "ekspor", "impor", "harga emas", "emas", "bbm", "pajak", "bank*", "ojk",
    "bumn", "umkm", "kredit", "obligasi", "laba", "pasar modal", "kurs", "utang", "defisit", "subsidi", "harga pangan", "harga beras", "beras", "perdagangan", "industri", "pengangguran", "lapangan kerja", "danantara"],
  Teknologi: ["teknologi", "kecerdasan buatan", "ai", "artificial intelligence", "chatgpt", "openai", "smartphone", "ponsel", "aplikasi", "startup", "internet", "siber", "peretas*", "hacker", "kebocoran data",
    "data pribadi", "iphone", "android", "samsung", "google", "gadget", "laptop", "5g", "satelit", "robot", "chip", "semikonduktor", "media sosial", "tiktok", "whatsapp", "digital", "komdigi", "game", "gim"],
  Hiburan: ["film", "bioskop", "artis", "selebritas", "selebriti", "penyanyi", "konser", "musik", "drama korea", "drakor", "k-pop", "kpop", "sinetron", "aktor", "aktris", "album", "lagu", "festival film",
    "netflix", "youtuber", "selebgram", "pelawak", "komedian", "serial", "trailer", "penghargaan musik"],
  Kuliner: ["kuliner", "resep", "makanan", "masakan", "restoran", "kafe", "kopi", "jajanan", "bakso", "nasi", "sate", "rendang", "minuman", "chef", "oleh-oleh", "street food", "warung", "mie", "martabak"],
  Otomotif: ["otomotif", "mobil", "motor", "sepeda motor", "suv", "mpv", "mobil listrik", "motor listrik", "toyota", "honda", "yamaha", "suzuki", "daihatsu", "hyundai", "byd", "wuling", "mitsubishi", "gaikindo", "aisi", "giias", "iims"],
  Religi: ["ramadan", "ramadhan", "puasa", "sholat", "salat", "shalat", "haji", "umrah", "masjid", "ulama", "khotbah", "zakat", "natal", "paskah", "waisak", "nyepi", "gereja", "kemenag", "mui", "doa", "ceramah",
    "maulid", "isra mikraj", "iduladha", "idulfitri", "islam", "kristen", "katolik", "hindu", "buddha", "pesantren", "ustaz", "ustadz", "pendeta"],
  Kesehatan: ["kesehatan", "rumah sakit", "rsud", "dokter", "obat", "penyakit", "vaksin*", "kemenkes", "bpjs kesehatan", "gizi", "stunting", "diabetes", "kanker", "virus", "demam berdarah", "dbd", "wabah", "kesehatan mental",
    "operasi", "pasien", "puskesmas", "makan bergizi", "mbg", "keracunan", "hipertensi", "jantung", "obesitas", "tbc"],
  Pendidikan: ["pendidikan", "sekolah", "siswa", "murid", "mahasiswa", "kampus", "universitas", "guru", "dosen", "kurikulum", "beasiswa", "snbp", "snbt", "utbk", "kemendikdasmen", "kemendiktisaintek", "ujian", "ppdb", "spmb",
    "wisuda", "pkl", "tka", "madrasah"],
  Hukum: ["kpk", "korupsi", "polisi", "polri", "polda", "polres", "kejaksaan", "kejagung", "kejari", "tersangka", "terdakwa", "pengadilan", "vonis", "sidang", "narkoba", "pembunuhan", "hukum", "hakim", "jaksa", "mahkamah",
    "tipikor", "penipuan", "pencurian", "begal", "ditangkap", "penangkapan", "hukuman"],
  Internasional: ["amerika serikat", "as", "tiongkok", "china", "rusia", "ukraina", "gaza", "israel", "palestina", "iran", "korea utara", "korea selatan", "jepang", "uni eropa", "pbb", "nato", "gedung putih", "trump",
    "myanmar", "thailand", "malaysia", "singapura", "australia", "india", "pakistan", "suriah", "lebanon", "taiwan", "filipina", "vietnam", "timor leste", "timur tengah", "dunia", "internasional", "asean", "inggris", "prancis", "jerman"],
  Politik: ["presiden", "prabowo", "gibran", "wakil presiden", "dpr", "dprd", "dpd", "mpr", "pilkada", "pemilu", "partai", "menteri", "kabinet", "golkar", "pdip", "gerindra", "nasdem", "pkb", "pks", "pan", "demokrat",
    "kpu", "bawaslu", "politik", "politikus", "koalisi", "parlemen", "gubernur", "bupati", "wali kota", "istana", "reshuffle", "ruu"]
};
// Catatan: "as" (Amerika Serikat) hanya dihitung bila huruf besar semua di judul asli, lihat khususHuruf di bawah.

export const KATEGORI = ["Nasional", ...Object.keys(ATURAN)];
const PRIORITAS = Object.keys(ATURAN);

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const POLA = Object.fromEntries(Object.entries(ATURAN).map(([kat, kata]) => {
  const bagian = kata.filter(k => k !== "as").map(k => {
    const awalan = k.endsWith("*"), dasar = esc(awalan ? k.slice(0, -1) : k).replace(/\s+/g, "\\s+");
    return awalan ? `${dasar}[\\p{L}\\p{N}]*` : dasar;
  });
  return [kat, new RegExp(`(?<![\\p{L}\\p{N}])(?:${bagian.join("|")})(?![\\p{L}\\p{N}])`, "giu")];
}));
const AS_RE = /(?<![\p{L}\p{N}])AS(?![\p{L}\p{N}])/gu;      // "AS" harus huruf besar semua (hindari kata "as" biasa)

const hitung = (re, teks) => (teks ? (teks.match(re) || []).length : 0);

/* Kembalikan {kategori, skor} untuk satu berita. bawaan = kategori cadangan bila tidak ada yang cukup kuat. */
export function klasifikasi(judul, deskripsi = "", bawaan = "Nasional") {
  let terbaik = null, skorTerbaik = 0;
  const rinci = {};
  for (const kat of PRIORITAS) {
    let skor = hitung(POLA[kat], judul) * 2 + Math.min(hitung(POLA[kat], deskripsi), 3);
    if (kat === "Internasional") skor += hitung(AS_RE, judul) * 2;
    rinci[kat] = skor;
    if (skor > skorTerbaik) { skorTerbaik = skor; terbaik = kat; }
  }
  if (!terbaik || skorTerbaik < 2) return { kategori: bawaan, skor: skorTerbaik, rinci };
  return { kategori: terbaik, skor: skorTerbaik, rinci };
}
