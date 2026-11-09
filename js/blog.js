/* Blog pengguna (v19, komentar+reaksi+bias v31). Mandiri, sesi dari localStorage "bunnies.session".
   Butuh supabase/v19-blog.sql dan supabase/v31-komentar-reaksi-bias.sql.
   Semua teks dari database lewat esc(). Bias dan chip dari js/bias.js (dimuat sebelum file ini). */
const AUTH_KEY = "bunnies.session", PAGE = 15, CATS = ["Kuliah","Kerja","Visa","Bahasa","Budaya","Hidup di sana","Umum","Teknologi","Ekonomi","Kuliner","Otomotif","Olahraga","Hiburan","Catatan harian"];
const RX = [["suka","Suka"],["keren","Keren"],["lucu","Lucu"],["haru","Haru"]];
let session = null, offset = 0, shown = 0;          // `cat` dipakai bersama dari state.js (deklarasi ganda di sini membuat blog.js gagal jalan)
let currentPost = 0, repType = "post", repId = 0;
const hdr = t => ({"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + (t || SUPABASE_ANON_KEY)});
const keep = s => { session = s; try{ s ? localStorage.setItem(AUTH_KEY, JSON.stringify(s)) : localStorage.removeItem(AUTH_KEY); }catch(e){} };
const pack = d => d && d.access_token ? {access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at || Math.floor(Date.now()/1000) + (d.expires_in || 3600), user:d.user} : null;
const myName = () => esc((session.user.user_metadata && (session.user.user_metadata.name || session.user.user_metadata.full_name)) || (session.user.email || "").split("@")[0]);
const ago = d => { const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000)); return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : Math.round(m / 1440) + " hari lalu"; };
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
const rpc = (name, args) => rest("rpc/" + name, {method:"POST", body:JSON.stringify(args || {})});
const googleLogin = () => { location.href = SUPABASE_URL + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(location.origin + location.pathname); };
async function initSession(){
  if(location.hash.includes("access_token=")){
    const p = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, "", location.pathname + location.search);
    try{
      const u = await (await fetch(SUPABASE_URL + "/auth/v1/user", {headers:hdr(p.get("access_token"))})).json();
      keep(pack({access_token:p.get("access_token"), refresh_token:p.get("refresh_token"), expires_in:+p.get("expires_in"), user:u}));
    }catch(e){}
  }else{ try{ session = JSON.parse(localStorage.getItem(AUTH_KEY)); }catch(e){ session = null; } }
}
const paintHead = () => { $("hbar").innerHTML = session ? `<span class="who">${myName()}</span>` : `<button class="btn green" id="loginBtn" type="button">Masuk</button>`; };

const card = p => `<a class="r" href="blog?id=${+p.id}"><div class="tx"><span class="kind">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc((p.body || "").slice(0, 160))}</p><span class="meta">${esc(p.author_name || "Pengguna")} · ${esc(ago(p.created_at))}</span></div></a>`;
async function loadList(reset){
  if(reset){ offset = 0; shown = 0; $("plist").innerHTML = ""; }
  $("pinfo").textContent = "Memuat…"; $("more").hidden = true;
  const f = ["select=id,title,body,category,author_name,created_at", "order=created_at.desc", "limit=" + PAGE, "offset=" + offset];
  if(cat !== "Semua") f.push("category=eq." + encodeURIComponent(cat));
  try{
    const rows = await rest("posts?" + f.join("&"));
    $("plist").insertAdjacentHTML("beforeend", rows.map(card).join(""));
    shown += rows.length; offset += rows.length;
    $("pinfo").textContent = shown ? "" : "Belum ada tulisan. Jadilah yang pertama menulis.";
    $("more").hidden = rows.length < PAGE;
  }catch(e){ $("pinfo").innerHTML = `Gagal memuat (${esc(e.message)}). Pastikan <b>v19-blog.sql</b> sudah dijalankan di Supabase.`; }
}
const paintCats = () => { $("catTabs").innerHTML = ["Semua", ...CATS].map(c => `<button type="button" aria-pressed="${c === cat}" data-c="${c}">${c}</button>`).join(""); };

/* ---------- Reaksi ---------- */
const rxBar = (type, id, s) => {
  s = s || {}; const mine = s.mine || [];
  return `<div class="rx-bar" data-rx="${type}:${+id}">${RX.map(([k,l]) => `<button type="button" class="rx-b" data-react="${type}" data-id="${+id}" data-kind="${k}" aria-pressed="${mine.includes(k)}">${l} <b>${+s[k] || 0}</b></button>`).join("")}</div>`;
};
async function react(btn){
  if(!session){ alert("Masuk dulu untuk bereaksi."); return googleLogin(); }
  const type = btn.dataset.react, id = +btn.dataset.id;
  btn.disabled = true;
  try{
    const s = await rpc("toggle_reaction", {p_type:type, p_id:id, p_kind:btn.dataset.kind});
    const bar = document.querySelector(`[data-rx="${type}:${id}"]`);
    if(bar) bar.outerHTML = rxBar(type, id, s);
  }catch(e){ alert(e.message); btn.disabled = false; }
}

/* ---------- Komentar ---------- */
const cmForm = () => `<form class="cm-form" id="cForm"><textarea id="cBody" maxlength="1000" placeholder="Tulis komentar (maks. 1000 huruf)" aria-label="Komentar" required></textarea><div class="row"><span class="meta" id="cMsg" role="status"></span><button class="btn green" type="submit">Kirim</button></div></form>`;
const cmItem = c => `<li class="cm-i" data-cid="${+c.id}"><div class="cm-h"><b>${esc(c.author_name || "Pengguna")}</b>${biasChip(c.bias)}<span class="meta">${esc(ago(c.created_at))}</span></div><p class="pre">${esc(c.body)}</p>${rxBar("comment", c.id, c.reactions)}<div class="acts">${c.mine ? `<button class="lk" data-delc="${+c.id}" type="button">Hapus</button>` : session ? `<button class="lk" data-repc="${+c.id}" type="button">Laporkan</button>` : ""}</div></li>`;
async function loadThread(postId){
  const box = $("thread");
  try{
    const rows = await rpc("list_comments", {p_post: postId}) || [];
    box.innerHTML = `<h2>Komentar (${rows.length})</h2>` +
      (session ? cmForm() : `<p class="gate-inline"><a href="#" data-act="login">Masuk</a> untuk ikut berkomentar.</p>`) +
      (rows.length ? `<ul class="cm-list">${rows.map(cmItem).join("")}</ul>` : `<p class="cm-empty">Belum ada komentar. Jadilah yang pertama.</p>`);
  }catch(e){ box.innerHTML = `<p class="sinfo">Komentar gagal dimuat: ${esc(e.message)}</p>`; }
}

async function showDetail(id){
  currentPost = id;
  $("detailView").hidden = false; $("detailView").innerHTML = `<p class="sinfo">Memuat…</p>`;
  try{
    const p = (await rest("posts?id=eq." + id + "&select=*"))[0];
    if(!p){ $("detailView").innerHTML = `<a class="back" href="blog">← Semua tulisan</a><p class="sempty">Tulisan tidak ditemukan atau sudah dihapus.</p>`; return; }
    document.title = p.title.slice(0, 60) + " – Bunnies Indonesia";
    const own = session && session.user.id === p.user_id;
    const sum = await rpc("reaction_summary", {p_type:"post", p_id:+p.id}).catch(() => null);
    $("detailView").innerHTML = `<a class="back" href="blog">← Semua tulisan</a><article class="qd"><span class="kind">${esc(p.category)}</span><h1>${esc(p.title)}</h1><div class="pre">${esc(p.body)}</div><span class="meta">${esc(p.author_name || "Pengguna")} · ${esc(ago(p.created_at))}</span>${own ? `<div class="acts"><button class="lk" data-del="${p.id}" type="button">Hapus</button></div>` : session ? `<div class="acts"><button class="lk" data-rep="${p.id}" type="button">Laporkan</button></div>` : ""}</article>${rxBar("post", p.id, sum)}${shareBar(p.title)}<section class="cm" id="thread"><p class="sinfo">Memuat komentar…</p></section>`;
    loadThread(+p.id);
  }catch(e){ $("detailView").innerHTML = `<a class="back" href="blog">← Semua tulisan</a><p class="sempty">Gagal memuat: ${esc(e.message)}</p>`; }
}
async function publish(){
  const msg = $("writeMsg"), btn = $("writeForm").querySelector(".green");
  btn.disabled = true; msg.className = "msg"; msg.textContent = "Menerbitkan…";
  try{
    const r = await rest("posts", {method:"POST", headers:{Prefer:"return=representation"}, body:JSON.stringify({title:$("wTitle").value.trim(), body:$("wBody").value.trim(), category:$("wCat").value})});
    location.href = "blog?id=" + r[0].id;
  }catch(e){ msg.className = "msg err"; msg.textContent = e.message; btn.disabled = false; }
}
async function sendReport(){
  const msg = $("repMsg"); msg.className = "msg"; msg.textContent = "Mengirim…";
  try{
    await rest("reports", {method:"POST", headers:{Prefer:"return=minimal"}, body:JSON.stringify({target_type:repType, target_id:repId, reason:$("repReason").value})});
    msg.textContent = "Terima kasih, laporan diterima."; setTimeout(() => $("repDlg").close(), 900);
  }catch(e){ msg.className = "msg err"; msg.textContent = /duplicate|unique/i.test(e.message) ? "Kamu sudah melaporkan ini." : e.message; }
}
const openReport = (type, id) => { repType = type; repId = id; $("repMsg").textContent = ""; $("repDlg").showModal(); };

document.addEventListener("click", async e => {
  const t = e.target.closest("[data-del],[data-rep],[data-repc],[data-delc],[data-react],[data-c],[data-act],#loginBtn,#writeBtn,#writeCancel,#repCancel,#more"); if(!t) return;
  if(t.id === "loginBtn" || t.dataset.act === "login"){ e.preventDefault(); return googleLogin(); }
  if(t.id === "writeBtn"){ if(!session){ alert("Masuk dulu untuk menulis."); return googleLogin(); } $("writeMsg").textContent = ""; $("writeForm").querySelector(".green").disabled = false; return $("writeDlg").showModal(); }
  if(t.id === "writeCancel") return $("writeDlg").close();
  if(t.id === "repCancel") return $("repDlg").close();
  if(t.dataset.react) return react(t);
  if(t.dataset.rep) return openReport("post", +t.dataset.rep);
  if(t.dataset.repc) return openReport("comment", +t.dataset.repc);
  if(t.dataset.delc){
    if(!confirm("Hapus komentar ini?")) return;
    try{ await rpc("delete_comment", {p_id:+t.dataset.delc}); loadThread(currentPost); }catch(err){ alert("Gagal menghapus: " + err.message); }
    return;
  }
  if(t.id === "more") return loadList(false);
  if(t.dataset.c){ cat = t.dataset.c; paintCats(); return loadList(true); }
  if(t.dataset.del){
    if(!confirm("Hapus permanen? Ini tidak bisa dibatalkan.")) return;
    try{ await rest("posts?id=eq." + (+t.dataset.del), {method:"DELETE"}); location.href = "blog"; }catch(err){ alert("Gagal menghapus: " + err.message); }
  }
});
document.addEventListener("submit", async e => {
  if(e.target.id !== "cForm") return;
  e.preventDefault();
  const ta = $("cBody"), msg = $("cMsg"), btn = e.target.querySelector("button"), text = ta.value.trim();
  if(!text) return;
  btn.disabled = true; msg.textContent = "Mengirim…";
  try{ await rpc("add_comment", {p_post: currentPost, p_body: text}); await loadThread(currentPost); }
  catch(err){ msg.textContent = err.message; btn.disabled = false; }
});
$("writeForm").addEventListener("submit", e => { e.preventDefault(); publish(); });
$("repForm").addEventListener("submit", e => { e.preventDefault(); sendReport(); });
(async function(){
  $("wCat").innerHTML = CATS.map(c => `<option>${c}</option>`).join("");
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("listView").hidden = false; $("pinfo").textContent = "Supabase belum dikonfigurasi di js/config.js."; return; }
  await initSession(); paintHead();
  const id = +new URLSearchParams(location.search).get("id");
  if(Number.isInteger(id) && id > 0) return showDetail(id);
  { const c0 = new URLSearchParams(location.search).get("cat"); if(CATS.includes(c0)) cat = c0; }       // v24: ?cat=Kuliner dari baris ikon beranda
  $("listView").hidden = false; paintCats(); loadList(true);
})();
