async function sb(path){
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {headers:{apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY}});
  if(!r.ok) throw new Error(r.status);
  return r.json();
}
async function load(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ loadErr = true; return; }
  try{
    const [n,t] = await Promise.all([sb("news?select=*&order=published_at.desc&limit=150"), sb("trending?select=keyword&order=rank.asc&limit=10")]);
    news = n; trending = t.map(x => x.keyword); loadErr = false;
  }catch(e){ loadErr = true; }
}
async function loadQuestions(){            // pertanyaan terbaru untuk beranda; dilewati diam-diam bila v10-tanya-jawab.sql belum dijalankan
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try{ questions = await sb("questions?select=id,title,category,answer_count,best_answer_id,created_at&order=created_at.desc&limit=12"); }catch(e){ questions = []; }
}
