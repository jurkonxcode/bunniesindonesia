/* i18n (v47): terjemahan teks halaman Akun dan Profil untuk en dan ko.
   Teks Indonesia adalah sumber. Bahasa dibaca dari <html lang> (id | en | ko).
   Kunci = teks Indonesia persis (setelah di-trim). Tambahkan pasangan baru di sini, jangan di HTML.
   Pola angka (mis. "5 menit lalu") ditangani PAT. Teks yang tidak ada di kamus tampil apa adanya. */
const I18N = {
  "Akun saya": ["My account", "내 계정"],
  "Akun saya – Bunnies Indonesia": ["My account – Bunnies Indonesia", "내 계정 – 버니즈 인도네시아"],
  "Profil": ["Profile", "프로필"],
  "Pengaturan": ["Settings", "설정"],
  "Tulisan": ["Posts", "글"],
  "Komentar": ["Comments", "댓글"],
  "Bergabung": ["Joined", "가입일"],
  "Lihat profil publikku": ["View my public profile", "공개 프로필 보기"],
  "Selamat datang, Bunnies!": ["Welcome, Bunnies!", "환영해요, 버니즈!"],
  "Akunmu sudah jadi. Username awalmu": ["Your account is ready. Your starting username", "계정이 준비됐어요. 시작 사용자 이름"],
  "diambil dari nama emailmu. Cek dulu, ganti kalau perlu, lalu simpan profilmu di bawah.": ["was taken from your email name. Check it, change it if needed, then save your profile below.", "은 이메일 이름에서 가져왔어요. 확인하고 필요하면 바꾼 뒤 아래에서 프로필을 저장하세요."],
  "Profil Bunnies": ["Bunnies profile", "버니즈 프로필"],
  "Inilah yang dilihat sesama Bunnies di profil publikmu. Semua kolom bisa diubah kapan saja.": ["This is what other Bunnies see on your public profile. You can change any field anytime.", "다른 버니즈가 공개 프로필에서 보는 정보예요. 모든 항목은 언제든지 바꿀 수 있어요."],
  "Profil lengkap belum aktif. Jalankan supabase/v46-profil-username.sql di Supabase.": ["Full profile is not active yet. Run the v46 SQL file in Supabase.", "전체 프로필이 아직 활성화되지 않았어요. Supabase에서 v46 SQL 파일을 실행하세요."],
  "Username": ["Username", "사용자 이름"],
  "3 sampai 20 karakter: huruf kecil, angka, dan garis bawah (_). Awalan @njz_ otomatis. Username awal diambil dari nama emailmu; ganti kalau kamu tidak ingin nama emailmu terlihat orang lain.": ["3 to 20 characters: lowercase letters, numbers, and underscore (_). The @njz_ prefix is added automatically. Your starting username comes from your email name; change it if you don't want it visible to others.", "3~20자: 소문자, 숫자, 밑줄(_). @njz_ 접두사는 자동으로 붙어요. 처음 사용자 이름은 이메일 이름에서 가져왔어요. 이메일 이름이 다른 사람에게 보이길 원치 않으면 바꿔주세요."],
  "Bio": ["Bio", "자기소개"],
  "Ceritakan singkat tentang dirimu sebagai Bunnies": ["Tell a little about yourself as a Bunny", "버니즈로서 자신을 간단히 소개해 주세요"],
  "Bunnies sejak (tahun)": ["Bunny since (year)", "버니즈 시작 연도"],
  "mis. 2022": ["e.g. 2022", "예: 2022"],
  "Lagu favorit": ["Favorite song", "좋아하는 노래"],
  "mis. Ditto": ["e.g. Ditto", "예: Ditto"],
  "Asal / lokasi": ["Location", "지역"],
  "Negara": ["Country", "국가"],
  "Negara lain": ["Other country", "기타 국가"],
  "Provinsi": ["Province", "도"],
  "Kota / kabupaten": ["City / regency", "시 / 군"],
  "Tulis nama kota": ["Type the city name", "도시 이름 입력"],
  "Yang tampil di profil publik": ["Shown on public profile", "공개 프로필에 표시"],
  "Sembunyikan lokasi": ["Hide location", "지역 숨기기"],
  "Negara saja": ["Country only", "국가만"],
  "Sampai provinsi": ["Up to province", "도까지"],
  "Sampai kota": ["Up to city", "시까지"],
  "Lokasi hanya tampil sesuai pilihanmu. Secara bawaan disembunyikan.": ["Location is shown only as you choose. Hidden by default.", "지역은 선택한 대로만 표시돼요. 기본값은 숨김이에요."],
  "Simpan profil": ["Save profile", "프로필 저장"],
  "— pilih —": ["— select —", "— 선택 —"],
  "Pilih provinsi dulu": ["Choose a province first", "먼저 도를 선택하세요"],
  "Provinsi / kota besar (시·도)": ["Province / major city (시·도)", "도 / 광역시 (시·도)"],
  "Kota / distrik (시·군·구)": ["City / district (시·군·구)", "시 / 군 / 구 (시·군·구)"],
  "Sosial media": ["Social media", "소셜 미디어"],
  "Tautan harus diawali https:// dan dari situs resmi platform. Kosongkan untuk menghapus.": ["Links must start with https:// and come from the platform's official site. Leave empty to remove.", "링크는 https://로 시작하고 해당 플랫폼의 공식 주소여야 해요. 비우면 삭제돼요."],
  "Simpan sosial media": ["Save social media", "소셜 미디어 저장"],
  "Sosial media tersimpan.": ["Social media saved.", "소셜 미디어가 저장됐어요."],
  "Belum ada sosial media.": ["No social media yet.", "아직 소셜 미디어가 없어요."],
  "Menyimpan…": ["Saving…", "저장 중…"],
  "Profil tersimpan.": ["Profile saved.", "프로필이 저장됐어요."],
  "Tersimpan.": ["Saved.", "저장됐어요."],
  "Memeriksa…": ["Checking…", "확인 중…"],
  "Isi username.": ["Enter a username.", "사용자 이름을 입력하세요."],
  "Ini username-mu sekarang.": ["This is your current username.", "지금 사용 중인 사용자 이름이에요."],
  "Belum sesuai: 3 sampai 20 karakter, huruf kecil, angka, atau _.": ["Not valid yet: 3 to 20 characters, lowercase letters, numbers, or _.", "아직 맞지 않아요: 3~20자, 소문자, 숫자, 또는 _."],
  "Tersedia.": ["Available.", "사용 가능해요."],
  "Sudah dipakai orang lain.": ["Already taken by someone else.", "다른 사람이 이미 사용 중이에요."],
  "Username itu dicadangkan.": ["That username is reserved.", "예약된 사용자 이름이에요."],
  "Format belum sesuai.": ["Format not valid.", "형식이 맞지 않아요."],
  "Nama tampil": ["Display name", "표시 이름"],
  "Nama ini muncul di tulisan, pertanyaan, dan jawabanmu berikutnya. Tulisan lama tidak berubah. Jangan pakai bagian depan emailmu.": ["This name appears on your next posts, questions, and answers. Old posts don't change. Don't use the front part of your email.", "이 이름은 다음 글, 질문, 답변에 표시돼요. 이전 글은 바뀌지 않아요. 이메일 앞부분은 쓰지 마세요."],
  "Simpan nama": ["Save name", "이름 저장"],
  "Bias": ["Bias", "최애"],
  "Pilih member favoritmu. Bias tampil sebagai label di samping komentarmu. Pilihan ini bisa diubah kapan saja.": ["Choose your favorite member. Your bias appears as a label next to your comments. You can change it anytime.", "좋아하는 멤버를 골라 주세요. 최애는 댓글 옆에 표시돼요. 언제든지 바꿀 수 있어요."],
  "All member": ["All members", "전체 멤버"],
  "Belum pilih": ["Not chosen", "선택 안 함"],
  "Riwayat dengar lagu": ["Listening history", "재생 기록"],
  "Lagu yang kamu putar di pemutar Bunnies dihitung setelah didengar sekitar 30 detik. Hanya kamu yang bisa melihatnya.": ["Songs you play in the Bunnies player count after about 30 seconds of listening. Only you can see them.", "버니즈 플레이어에서 약 30초 이상 들은 노래가 기록돼요. 나만 볼 수 있어요."],
  "Memuat…": ["Loading…", "불러오는 중…"],
  "Hapus riwayat dengar": ["Clear listening history", "재생 기록 지우기"],
  "Hapus semua riwayat dengar lagumu?": ["Clear all your listening history?", "재생 기록을 모두 지울까요?"],
  "Menghapus…": ["Deleting…", "삭제 중…"],
  "Riwayat dihapus.": ["History cleared.", "기록을 지웠어요."],
  "lagu": ["songs", "곡"],
  "hari ini": ["today", "오늘"],
  "Lagu": ["Song", "곡"],
  "Belum ada. Tekan \"Putar lagu\" di beranda, lalu dengarkan sampai habis atau sekitar 30 detik.": ["Nothing yet. Press \"Play music\" on the home page, then listen for about 30 seconds.", "아직 없어요. 홈에서 \"음악 재생\"을 누르고 약 30초 이상 들어 보세요."],
  "Riwayat belum aktif. Jalankan supabase/v45-riwayat-lagu.sql di Supabase.": ["History is not active yet. Run the v45 SQL file in Supabase.", "재생 기록이 아직 활성화되지 않았어요. Supabase에서 v45 SQL 파일을 실행하세요."],
  "Unduh data saya": ["Download my data", "내 데이터 내려받기"],
  "Berkas JSON berisi profil (termasuk bias), riwayat dengar lagu, tulisan, pertanyaan, jawaban, dan laporan yang pernah kamu kirim.": ["A JSON file with your profile (including bias), listening history, posts, questions, answers, and reports you've sent.", "프로필(최애 포함), 재생 기록, 글, 질문, 답변, 보낸 신고가 담긴 JSON 파일이에요."],
  "Unduh data": ["Download data", "데이터 받기"],
  "Menyiapkan…": ["Preparing…", "준비 중…"],
  "Selesai. Berkas diunduh.": ["Done. File downloaded.", "완료. 파일을 내려받았어요."],
  "Admin": ["Admin", "관리자"],
  "Kamu terdaftar sebagai admin.": ["You are registered as an admin.", "관리자로 등록되어 있어요."],
  "Buka panel admin": ["Open admin panel", "관리자 패널 열기"],
  "Keluar": ["Log out", "로그아웃"],
  "Keluar dari akun": ["Log out of account", "계정에서 로그아웃"],
  "Hapus akun": ["Delete account", "계정 삭제"],
  "Akun, profil (termasuk bias), semua tulisan, komentar, reaksi, pertanyaan, dan jawabanmu dihapus permanen dan tidak bisa dipulihkan. Jawaban di pertanyaan orang lain juga ikut hilang. Berkas lama di halaman statis (SEO) hilang paling lambat sekitar 30 menit.": ["Your account, profile (including bias), all posts, comments, reactions, questions, and answers are permanently deleted and cannot be recovered. Answers under other people's questions are removed too. Old files on static (SEO) pages disappear within about 30 minutes.", "계정, 프로필(최애 포함), 모든 글, 댓글, 반응, 질문, 답변이 영구적으로 삭제되며 복구할 수 없어요. 다른 사람의 질문에 단 답변도 함께 사라져요. 정적(SEO) 페이지의 이전 파일은 최대 약 30분 안에 사라져요."],
  "Ketik HAPUS untuk melanjutkan": ["Type DELETE to continue", "계속하려면 삭제를 입력하세요"],
  "HAPUS": ["DELETE", "삭제"],
  "Hapus akun saya": ["Delete my account", "내 계정 삭제"],
  "Hapus akun dan semua kontenmu secara permanen?": ["Delete your account and all your content permanently?", "계정과 모든 콘텐츠를 영구적으로 삭제할까요?"],
  "Menghapus akun…": ["Deleting account…", "계정 삭제 중…"],
  "Akunmu sudah dihapus.": ["Your account has been deleted.", "계정이 삭제됐어요."],
  "Terima kasih sudah mencoba Bunnies Indonesia.": ["Thanks for trying Bunnies Indonesia.", "버니즈 인도네시아를 이용해 주셔서 고마워요."],
  "Ke beranda": ["Go to home", "홈으로"],
  "Masuk dulu untuk mengelola akunmu.": ["Log in first to manage your account.", "계정을 관리하려면 먼저 로그인하세요."],
  "Masuk dulu untuk melanjutkan.": ["Log in first to continue.", "계속하려면 먼저 로그인하세요."],
  "Akunmu sedang dibatasi. Hubungi kami lewat halaman Kontak.": ["Your account is restricted. Contact us through the Contact page.", "계정이 제한되어 있어요. 문의 페이지로 연락해 주세요."],
  "Supabase belum dikonfigurasi di js/config.js.": ["Supabase is not configured in js/config.js.", "js/config.js에서 Supabase가 아직 설정되지 않았어요."],
  "Masuk": ["Log in", "로그인"],
  "Daftar": ["Sign up", "가입"],
  "Beranda": ["Home", "홈"],
  "Member": ["Members", "멤버"],
  "Info": ["Info", "정보"],
  "Tanya Jawab": ["Q&A", "질문과 답변"],
  "Blog": ["Blog", "블로그"],
  "Chart": ["Chart", "차트"],
  "Memuat": ["Loading", "불러오는 중"]
};

const LANG = (document.documentElement.lang || "id").slice(0, 2);
/* pola angka: "5 menit lalu", "2 jam 10 menit", dst. Hasil dibuat dari potongan angka */
const PAT = [
  [/^baru saja$/, () => ({en: "just now", ko: "방금 전"})],
  [/^(\d+) menit lalu$/, m => ({en: m[1] + " min ago", ko: m[1] + "분 전"})],
  [/^(\d+) jam lalu$/, m => ({en: m[1] + " h ago", ko: m[1] + "시간 전"})],
  [/^(\d+) hari lalu$/, m => ({en: m[1] + " days ago", ko: m[1] + "일 전"})],
  [/^(\d+) jam (\d+) menit$/, m => ({en: m[1] + " h " + m[2] + " min", ko: m[1] + "시간 " + m[2] + "분"})],
  [/^(\d+) menit$/, m => ({en: m[1] + " min", ko: m[1] + "분"})]
];

/* Terjemahkan satu teks. Bahasa Indonesia dikembalikan apa adanya. */
function T(s){
  if(LANG === "id" || s == null) return s;
  const key = String(s).trim();
  if(!key) return s;
  const e = I18N[key];
  if(e){ const v = LANG === "en" ? e[0] : e[1]; if(v) return v; }
  for(const [re, f] of PAT){
    const m = key.match(re);
    if(m){ const o = f(m); return o[LANG] || key; }
  }
  return s;
}

/* Terjemahkan seluruh teks dan atribut statis di halaman (dipanggil sekali setelah HTML dimuat). */
function applyI18n(){
  if(LANG === "id") return;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName)
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = []; while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => {
    const t = n.nodeValue.trim(); if(!t) return;
    const r = T(t); if(r !== t) n.nodeValue = n.nodeValue.replace(t, r);
  });
  document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el => {
    ["placeholder", "aria-label", "title"].forEach(a => {
      const v = el.getAttribute(a); if(v){ const r = T(v); if(r !== v) el.setAttribute(a, r); }
    });
  });
  document.title = T(document.title);
}
