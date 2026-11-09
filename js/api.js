async function sb(path){
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {headers:{apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY}});
  if(!r.ok) throw new Error(r.status);
  return r.json();
}
async function load(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("status").textContent = "Mode demo: memakai data contoh."; return; }
  try{
    const [n,t] = await Promise.all([sb("news?select=*&order=created_at.desc&limit=30"), sb("trending?select=keyword&order=rank.asc&limit=10")]);
    if(n.length) news = n;
    if(t.length) trending = t.map(x => x.keyword);
    $("status").textContent = "";
  }catch(e){ $("status").textContent = "Gagal memuat data langsung. Menampilkan data contoh."; }
}
async function loadQuestions(){            // v12: pertanyaan terbaru untuk beranda; diam-diam dilewati bila v10-tanya-jawab.sql belum dijalankan
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try{ questions = await sb("questions?select=id,title,category,answer_count,best_answer_id,created_at&order=created_at.desc&limit=8"); }catch(e){ questions = []; }
}
