/* Tanya Jawab (v10). Mandiri: tidak memakai auth.js (yang terikat ke beranda).
   Sesi dibaca dari localStorage "bunnies.session", sama dengan beranda.
   Semua teks dari database lewat esc(). Butuh supabase/v10-tanya-jawab.sql. */
const AUTH_KEY = "bunnies.session", PAGE = 20;
let session = null, offset = 0, shown = 0, qs = "", repTarget = null;

const hdr = t => ({"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + (t || SUPABASE_ANON_KEY)});
const keep = s => { session = s; try{ s ? localStorage.setItem(AUTH_KEY, JSON.stringify(s)) : localStorage.removeItem(AUTH_KEY); }catch(e){} };
const pack = d => d && d.access_token ? {access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at || Math.floor(Date.now()/1000) + (d.expires_in || 3600), user:d.user} : null;
const myName = () => esc((session.user.user_metadata && (session.user.user_metadata.name || session.user.user_metadata.full_name)) || (session.user.email || "").split("@")[0]);
function ago(d){
  const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000));
  return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : Math.round(m / 1440) + " hari lalu";
}

async function token(){
  if(!session) return null;
  if(session.expires_at - 60 > Date.now()/1000) return session.access_token;
  try{
    const r = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {method:"POST", headers:hdr(), body:JSON.stringify({refresh_token:session.refresh_token})});
    const s = pack(await r.json()); if(!r.ok || !s) throw 0;
    keep({...s, user:s.user || session.user}); return s.access_token;
  }catch(e){ keep(null); paintHead(); return null; }
}
async function rest(path, opts = {}){
  const t = await token();
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {...opts, headers:{...hdr(t), ...(opts.headers || {})}});
  if(!r.ok){ let m = ""; try{ m = (await r.json()).message || ""; }catch(e){} throw new Error(m || "Gagal (" + r.status + ")"); }
  return r.status === 204 ? null : r.json().catch(() => null);
}
const googleLogin = () => { location.href = SUPABASE_URL + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(location.origin + location.pathname); };

async function initSession(){
  if(location.hash.includes("access_token=")){                 // kembali dari Google
    const p = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, "", location.pathname + location.search);
    try{
      const u = await (await fetch(SUPABASE_URL + "/auth/v1/user", {headers:hdr(p.get("access_token"))})).json();
      keep(pack({access_token:p.get("access_token"), refresh_token:p.get("refresh_token"), expires_in:+p.get("expires_in"), user:u}));
    }catch(e){}
  }else{
    try{ session = JSON.parse(localStorage.getItem(AUTH_KEY)); }catch(e){ session = null; }
  }
}
function paintHead(){
  $("hbar").innerHTML = session ? Masuk.chip(session) : `<button class="btn green" id="loginBtn" type="button">Masuk</button>`;
}
const gate = txt => `<div class="gate"><p>${txt}</p><button class="btn green" data-act="login" type="button">Masuk atau daftar</button></div>`;

/* ---------- Daftar ---------- */
const card = q => `<a class="r" href="tanya?id=${+q.id}"><div class="tx"><span class="kind">${esc(catLabel(q.category))}</span>${q.best_answer_id ? `<span class="ok">Terjawab</span>` : ""}<h3>${esc(q.title)}</h3>${q.body ? `<p>${esc(q.body)}</p>` : ""}<span class="meta">${esc(q.author_name || "Pengguna")} · ${esc(ago(q.created_at))} · ${+q.answer_count} jawaban</span></div></a>`;

async function loadList(reset){
  if(reset){ offset = 0; shown = 0; $("qlist").innerHTML = ""; }
  $("qinfo").textContent = "Memuat…"; $("more").hidden = true;
  const f = ["select=id,title,body,category,author_name,answer_count,best_answer_id,created_at", "order=created_at.desc", "limit=" + PAGE, "offset=" + offset];
  if(cat !== "Semua") f.push("category=eq." + encodeURIComponent(cat));
  const s = qs.replace(/[*,()%"\\]/g, " ").trim();
  if(s.length >= 2) f.push("or=" + encodeURIComponent(`(title.ilike.*${s}*,body.ilike.*${s}*)`));
  try{
    const rows = await rest("questions?" + f.join("&"));
    $("qlist").insertAdjacentHTML("beforeend", rows.map(card).join(""));
    shown += rows.length; offset += rows.length;
    $("qinfo").textContent = shown ? "" : (qs || cat !== "Semua" ? "Tidak ada pertanyaan yang cocok." : "Belum ada pertanyaan. Jadilah yang pertama bertanya.");
    $("more").hidden = rows.length < PAGE;
  }catch(e){
    $("qinfo").innerHTML = `Gagal memuat (${esc(e.message)}). Pastikan <b>v10-tanya-jawab.sql</b> sudah dijalankan di Supabase.`;
  }
}
function paintCats(){
  $("catTabs").innerHTML = ["Semua", ...CATS].map(c => `<button type="button" aria-pressed="${c === cat}" data-c="${c}">${esc(c === "Semua" ? c : catLabel(c))}</button>`).join("");
}

/* ---------- Detail ---------- */
async function showDetail(id){
  $("detailView").hidden = false;
  $("detailView").innerHTML = `<p class="sinfo">Memuat…</p>`;
  try{
    const [qq, aa] = await Promise.all([
      rest("questions?id=eq." + id + "&select=*"),
      rest("answers?question_id=eq." + id + "&select=id,body,author_name,user_id,created_at&order=created_at.asc")]);
    const q = qq && qq[0];
    if(!q){ $("detailView").innerHTML = `<a class="back" href="tanya">← Semua pertanyaan</a><p class="sempty">Pertanyaan tidak ditemukan atau sudah dihapus.</p>`; return; }
    document.title = q.title.slice(0, 60) + " – Bunnies Indonesia";
    const me = session && session.user.id, own = q.user_id === me;
    aa.sort((x, y) => (y.id === q.best_answer_id) - (x.id === q.best_answer_id));
    const act = (t, i, mine) => !session ? "" : mine ? `<button class="lk" data-del="${t}:${i}" type="button">Hapus</button>` : `<button class="lk" data-rep="${t}:${i}" type="button">Laporkan</button>`;
    $("detailView").innerHTML =
      `<a class="back" href="tanya">← Semua pertanyaan</a>` +
      `<article class="qd"><span class="kind">${esc(catLabel(q.category))}</span>${q.best_answer_id ? ` <span class="ok">Terjawab</span>` : ""}<h1>${esc(q.title)}</h1>${q.body ? `<div class="pre">${esc(q.body)}</div>` : ""}<span class="meta">${esc(q.author_name || "Pengguna")} · ${esc(ago(q.created_at))}</span><div class="acts">${act("q", q.id, own)}</div></article>${shareBar(q.title)}` +
      `<h2 class="ah">${aa.length} jawaban</h2>` +
      (aa.map(a => `<div class="an${a.id === q.best_answer_id ? " best" : ""}">${a.id === q.best_answer_id ? `<span class="ok">Jawaban terbaik</span>` : ""}<div class="pre">${esc(a.body)}</div><span class="meta">${esc(a.author_name || "Pengguna")} · ${esc(ago(a.created_at))}</span><div class="acts">${own && a.id !== q.best_answer_id ? `<button class="lk good" data-best="${q.id}:${a.id}" type="button">Pilih terbaik</button>` : ""}${act("a", a.id, a.user_id === me)}</div></div>`).join("") || `<p class="meta" style="padding:14px 0">Belum ada jawaban.</p>`) +
      (session ? `<form class="form" id="ansForm"><textarea id="ansBody" placeholder="Tulis jawabanmu" minlength="2" maxlength="3000" required></textarea><p class="msg" id="ansMsg" role="status"></p><button class="btn green">Kirim jawaban</button></form>` : gate("Masuk untuk menjawab."));
    $("ansForm") && $("ansForm").addEventListener("submit", e => { e.preventDefault(); sendAnswer(q.id); });
  }catch(e){ $("detailView").innerHTML = `<a class="back" href="tanya">← Semua pertanyaan</a><p class="sempty">Gagal memuat: ${esc(e.message)}</p>`; }
}

/* ---------- Aksi ---------- */
async function sendAnswer(qid){
  const btn = $("ansForm").querySelector("button"), msg = $("ansMsg");
  btn.disabled = true; msg.className = "msg"; msg.textContent = "Mengirim…";
  try{
    await rest("answers", {method:"POST", headers:{Prefer:"return=minimal"}, body:JSON.stringify({question_id:qid, body:$("ansBody").value.trim()})});
    location.reload();
  }catch(e){ msg.className = "msg err"; msg.textContent = e.message; btn.disabled = false; }
}
async function sendQuestion(){
  const msg = $("askMsg"), btn = $("askForm").querySelector(".green");
  btn.disabled = true; msg.className = "msg"; msg.textContent = "Mengirim…";
  try{
    const r = await rest("questions", {method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify({title:$("aTitle").value.trim(), body:$("aBody").value.trim() || null, category:$("aCat").value})});
    window.bunGo ? bunGo("tanya?id=" + r[0].id) : (location.href = "tanya?id=" + r[0].id);
  }catch(e){ msg.className = "msg err"; msg.textContent = e.message; btn.disabled = false; }
}
async function sendReport(){
  const [type, id] = repTarget, msg = $("repMsg");
  msg.className = "msg"; msg.textContent = "Mengirim…";
  try{
    await rest("reports", {method:"POST", headers:{Prefer:"return=minimal"}, body:JSON.stringify({target_type:type === "q" ? "question" : "answer", target_id:+id, reason:$("repReason").value})});
    msg.textContent = "Terima kasih, laporan diterima."; setTimeout(() => $("repDlg").close(), 900);
  }catch(e){ msg.className = "msg err"; msg.textContent = /duplicate|unique/i.test(e.message) ? "Kamu sudah melaporkan ini." : e.message; }
}
async function del(type, id){
  if(!confirm("Hapus permanen? Ini tidak bisa dibatalkan.")) return;
  try{
    await rest((type === "q" ? "questions" : "answers") + "?id=eq." + (+id), {method:"DELETE"});
    type === "q" ? (window.bunGo ? bunGo("tanya") : (location.href = "tanya")) : location.reload();
  }catch(e){ alert("Gagal menghapus: " + e.message); }
}

/* ---------- Event ---------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-act],[data-del],[data-rep],[data-best],[data-c],#loginBtn,#askBtn,#askCancel,#repCancel,#more");
  if(!t) return;
  if(t.dataset.act === "login" || t.id === "loginBtn") return Masuk.open();
  if(t.id === "askBtn"){
    if(!session) return Masuk.open("Masuk untuk mengajukan pertanyaan.");
    $("askMsg").textContent = ""; $("askForm").querySelector(".green").disabled = false; return $("askDlg").showModal();
  }
  if(t.id === "askCancel") return $("askDlg").close();
  if(t.id === "repCancel") return $("repDlg").close();
  if(t.id === "more") return loadList(false);
  if(t.dataset.c){ cat = t.dataset.c; paintCats(); return loadList(true); }
  if(t.dataset.del) return del(...t.dataset.del.split(":"));
  if(t.dataset.rep){ repTarget = t.dataset.rep.split(":"); $("repMsg").textContent = ""; return $("repDlg").showModal(); }
  if(t.dataset.best){
    const [q, a] = t.dataset.best.split(":");
    try{ await rest("rpc/pick_best_answer", {method:"POST", body:JSON.stringify({p_question:+q, p_answer:+a})}); location.reload(); }
    catch(err){ alert(err.message); }
  }
});
$("askForm").addEventListener("submit", e => { e.preventDefault(); sendQuestion(); });
$("repForm").addEventListener("submit", e => { e.preventDefault(); sendReport(); });
$("qform").addEventListener("submit", e => { e.preventDefault(); qs = $("qin").value.trim(); loadList(true); });

/* ---------- Mulai ---------- */
(async function(){
  $("aCat").innerHTML = catOptions(); $("aCat").required = true;     // v33: 7 kategori fanpage
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("listView").hidden = false; $("qinfo").textContent = "Supabase belum dikonfigurasi di js/config.js."; return; }
  await initSession(); paintHead();
  const id = +new URLSearchParams(location.search).get("id");
  if(Number.isInteger(id) && id > 0) return showDetail(id);
  { const c0 = new URLSearchParams(location.search).get("cat"); if(CATS.includes(c0)) cat = c0; }       // ?cat=musik (slug v33)
  $("listView").hidden = false; paintCats(); loadList(true);
  if(new URLSearchParams(location.search).has("tanya")) $("askBtn").click();      // dari tombol "Tanya sesuatu" di beranda (v42)
})();
