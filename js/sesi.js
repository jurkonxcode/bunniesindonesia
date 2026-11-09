/* Sesi + REST bersama untuk halaman admin dan akun (v26). Mandiri seperti tanya.js: sesi dibaca dari localStorage "niflax.session".
   Muat setelah config.js dan state.js. Tidak dimuat bersama tanya.js/blog.js (nama variabelnya sama). */
const AUTH_KEY = "niflax.session";
let session = null;
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
  }catch(e){ keep(null); return null; }
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
async function signOut(){
  const t = session && session.access_token;
  keep(null);
  if(t) await fetch(SUPABASE_URL + "/auth/v1/logout", {method:"POST", headers:hdr(t)}).catch(() => {});
}
const gate = txt => `<div class="gate"><p>${txt}</p><button class="btn green" data-act="login" type="button">Masuk dengan Google</button><p class="meta" style="margin-top:8px">Ingin pakai kode email? Masuk dulu lewat <a href="./">beranda</a>, lalu kembali ke sini.</p></div>`;
