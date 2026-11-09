/* Login Supabase Auth lewat fetch (tanpa library): Google + kode email, plus Simpan berita. */
const AUTH_KEY = "niflax.session";
let session = null, saved = new Set(), onlySaved = false, pendingEmail = "", isAdmin = false;
const hdr = t => ({"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + (t || SUPABASE_ANON_KEY)});
const keep = s => { session = s; try{ s ? localStorage.setItem(AUTH_KEY, JSON.stringify(s)) : localStorage.removeItem(AUTH_KEY); }catch(e){} };
const pack = d => d && d.access_token ? {access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at || Math.floor(Date.now()/1000) + (d.expires_in || 3600), user:d.user} : null;
const myName = () => esc((session.user.user_metadata && (session.user.user_metadata.name || session.user.user_metadata.full_name)) || (session.user.email || "").split("@")[0]);

async function authCall(path, body){
  const r = await fetch(SUPABASE_URL + "/auth/v1/" + path, {method:"POST", headers:hdr(), body:JSON.stringify(body)});
  const d = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error(d.msg || d.error_description || d.message || "Gagal (" + r.status + ")");
  return d;
}
async function token(){
  if(!session) return null;
  if(session.expires_at - 60 > Date.now()/1000) return session.access_token;
  try{ const s = pack(await authCall("token?grant_type=refresh_token", {refresh_token:session.refresh_token})); keep(s); return s && s.access_token; }
  catch(e){ keep(null); renderAuth(); return null; }
}
async function authSb(path, opts = {}){
  const t = await token(); if(!t) throw new Error("belum masuk");
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {...opts, headers:{...hdr(t), ...(opts.headers || {})}});
  if(!r.ok) throw new Error(r.status);
  return r.status === 204 || opts.method === "POST" || opts.method === "DELETE" ? null : r.json();
}

async function initAuth(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ renderAuth(); return; }
  if(location.hash.includes("access_token=")){            // kembali dari Google
    const p = new URLSearchParams(location.hash.slice(1));
    history.replaceState(null, "", location.pathname + location.search);
    try{
      const u = await (await fetch(SUPABASE_URL + "/auth/v1/user", {headers:hdr(p.get("access_token"))})).json();
      keep(pack({access_token:p.get("access_token"), refresh_token:p.get("refresh_token"), expires_in:+p.get("expires_in"), user:u}));
    }catch(e){}
  }else{
    try{ session = JSON.parse(localStorage.getItem(AUTH_KEY)); }catch(e){ session = null; }
  }
  renderAuth();
  if(session){ loadSaved(); checkAdmin(); }
}
async function checkAdmin(){                 // v26: tampilkan tautan Panel admin hanya untuk admin (keamanan sebenarnya di SQL)
  try{
    const t = await token(); if(!t) return;
    const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/is_admin", {method:"POST", headers:hdr(t), body:"{}"});
    isAdmin = r.ok && (await r.json()) === true;
  }catch(e){ isAdmin = false; }
  renderAuth();
}
async function loadSaved(){
  try{ saved = new Set((await authSb("saved_news?select=news_id")).map(x => x.news_id)); }catch(e){}
  renderAuth(); renderNews();
}
async function toggleSave(id){
  if(!session){ openAuth(); return; }
  try{
    if(saved.has(id)){ await authSb("saved_news?news_id=eq." + id, {method:"DELETE"}); saved.delete(id); }
    else{ await authSb("saved_news", {method:"POST", headers:{Prefer:"return=minimal"}, body:JSON.stringify({user_id:session.user.id, news_id:id})}); saved.add(id); }
  }catch(e){ $("status").textContent = "Gagal menyimpan. Coba lagi."; }
  renderAuth(); renderNews();
}

function openAuth(){ $("authStep1").hidden = false; $("authStep2").hidden = true; $("authMsg").textContent = ""; $("authDlg").showModal(); }
async function sendCode(email){
  $("authMsg").textContent = "Mengirim kode…";
  try{
    await authCall("otp", {email, create_user:true});
    pendingEmail = email; $("authStep1").hidden = true; $("authStep2").hidden = false;
    $("authMsg").textContent = "Kode dikirim ke " + email + ".";
  }catch(e){ $("authMsg").textContent = e.message; }
}
async function verifyCode(code){
  $("authMsg").textContent = "Memeriksa…";
  try{
    keep(pack(await authCall("verify", {type:"email", email:pendingEmail, token:code})));
    $("authDlg").close(); renderAuth(); loadSaved(); checkAdmin();
  }catch(e){ $("authMsg").textContent = "Kode salah atau kedaluwarsa."; }
}
function googleLogin(){
  location.href = SUPABASE_URL + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(location.origin + location.pathname);
}
async function logout(){
  const t = session && session.access_token;
  keep(null); saved = new Set(); onlySaved = false; isAdmin = false;
  if(t) fetch(SUPABASE_URL + "/auth/v1/logout", {method:"POST", headers:hdr(t)}).catch(() => {});
  renderAuth(); renderNews();
}

const loggedOutCard = `<div class="sh"><h2>Akun Niflax</h2></div><p>Masuk untuk menulis blog, bertanya, dan menjawab.</p><button class="btn green" id="loginBtn">Masuk atau daftar</button><div class="links"><span>Tanpa kata sandi: cukup kode lewat email atau Google.</span></div>`;
function renderAuth(){
  const a = document.querySelector(".top .actions");
  if(session){
    a.innerHTML = `<span class="who">${myName()}</span><button class="btn" id="logoutTop">Keluar</button>`;
    $("acct").innerHTML = `<div class="sh"><h2>Halo, ${myName()}</h2></div><p>${saved.size} berita tersimpan.</p><button class="btn green" id="showSaved">${onlySaved ? "Tampilkan semua berita" : "Lihat tersimpan"}</button><div class="links"><a href="akun">Akun saya</a>${isAdmin ? ` · <a href="admin">Panel admin</a>` : ""} · <a href="#" id="logoutBtn">Keluar</a></div>`;
  }else{
    a.innerHTML = `<a class="ghost" href="#" id="signup">Daftar</a><button class="btn green" id="loginTop">Masuk</button>`;
    $("acct").innerHTML = loggedOutCard;
  }
  $("acct").hidden = false; $("acct").classList.toggle("out", !session);     // v14: kartu masuk tampil di kolom samping (desktop); di HP disembunyikan lewat CSS bila belum masuk
}
