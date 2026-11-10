/* Pesan langsung (v49): kotak pesan, percakapan, kirim pesan, dan lapor pesan.
   Butuh sesi.js (session, rpc, gate, initSession), state.js (esc, $), i18n.js (T, applyI18n).
   Server: supabase/v49-pesan.sql. Pesan hanya bisa dikirim ke yang mengaktifkan terima pesan. */
const LOCALE_ID = () => ({en:"en-US", ko:"ko-KR"}[document.documentElement.lang] || "id-ID");
const fmt = d => new Date(d).toLocaleString(LOCALE_ID(), {day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"});
const say = (id, txt, err) => { const m = $(id); if(!m) return; m.className = "msg" + (err ? " err" : ""); m.textContent = T(txt); };
const view = html => { $("gateView").hidden = true; $("pesanView").hidden = false; $("pesanView").innerHTML = html; };
const gateTo = txt => { $("gateView").innerHTML = gate(T(txt)); };
function paintHead(){ $("hbar").innerHTML = session ? Masuk.chip(session) : `<button class="btn green" data-act="login" type="button">${T("Masuk")}</button>`; }

async function inbox(){
  view(`<div class="thead"><h1>${T("Pesan saya")}</h1></div><div id="inbox"><p class="sinfo">${T("Memuat…")}</p></div>`);
  try{
    const list = await rpc("daftar_pesan") || [];
    $("inbox").innerHTML = list.length
      ? `<ul class="pm-list">` + list.map(x => `<li><a class="pm-item" href="pesan?t=${+x.id}"><b>@njz_${esc(x.username)}</b><small>${esc(x.terakhir || "")}</small><span class="meta">${esc(fmt(x.last_at))}</span></a></li>`).join("") + `</ul>`
      : `<p class="sinfo">${T("Belum ada percakapan.")}</p><p class="sinfo">${T("Mulai dari profil seseorang yang sudah mengaktifkan terima pesan.")}</p>`;
  }catch(e){ $("inbox").innerHTML = `<p class="sinfo">${esc(T(e.message))}</p>`; }
}

function formKirim(){
  return `<form id="pvForm" class="pm-form" novalidate><textarea id="pvTxt" maxlength="1000" placeholder="${esc(T("Tulis pesan"))}" aria-label="${esc(T("Tulis pesan"))}" required></textarea>` +
    `<p class="msg" id="pvMsg" role="status"></p><div class="pf-act"><button class="btn green" type="submit">${T("Kirim")}</button></div></form>`;
}

async function thread(id){
  view(`<div class="thead"><a class="back" href="pesan">← ${T("Kotak pesan")}</a><h1 id="pvTitle"></h1></div><div id="pvBody"><p class="sinfo">${T("Memuat…")}</p></div>`);
  try{
    const r = await rpc("baca_pesan", {p_thread:id});
    $("pvTitle").textContent = T("Percakapan dengan") + " @njz_" + r.lawan;
    const isi = (r.pesan || []).map(m => `<div class="pm-b ${m.mine ? "me" : "them"}"><p>${esc(m.body)}</p><small>${esc(fmt(m.at))}${m.mine ? "" : ` · <button type="button" class="lk" data-rep="${+m.id}">${T("Laporkan")}</button>`}</small></div>`).join("");
    $("pvBody").innerHTML = `<div class="pm-chat">${isi || `<p class="sinfo">${T("Belum ada pesan.")}</p>`}</div>` + formKirim();
    $("pvForm").dataset.to = r.lawan; $("pvForm").dataset.thread = id;
  }catch(e){ $("pvBody").innerHTML = `<p class="sinfo">${esc(T(e.message))}</p>`; }
}

function compose(ke){
  view(`<div class="thead"><a class="back" href="profil?u=${encodeURIComponent(ke)}">← @njz_${esc(ke)}</a><h1>${T("Kirim pesan langsung")}</h1></div>` + formKirim());
  $("pvForm").dataset.to = ke; $("pvForm").dataset.thread = "";
}

document.addEventListener("click", async e => {
  const t = e.target.closest("[data-rep]"); if(t){
    if(!confirm(T("Laporkan pesan ini?"))) return;
    try{ await rpc("lapor_pesan", {p_message:+t.dataset.rep, p_alasan:"laporan"}); alert(T("Pesan dilaporkan. Terima kasih.")); }
    catch(err){ alert(T(err.message)); }
  }
});
document.addEventListener("submit", async e => {
  if(e.target.id !== "pvForm") return;
  e.preventDefault();
  const f = e.target, txt = $("pvTxt").value.trim(), btn = f.querySelector("button");
  if(!txt) return;
  btn.disabled = true; say("pvMsg", "Menyimpan…");
  try{
    const tid = await rpc("kirim_pesan", {p_username:f.dataset.to, p_body:txt});
    location.href = "pesan?t=" + encodeURIComponent(tid);
  }catch(err){ say("pvMsg", err.message, true); btn.disabled = false; }
});

(async function(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("gateView").innerHTML = `<p class="sinfo">${T("Supabase belum dikonfigurasi di js/config.js.")}</p>`; return; }
  await initSession(); paintHead();
  if(!session){ gateTo("Masuk dulu untuk membuka pesan."); return; }
  const q = new URLSearchParams(location.search);
  if(q.get("t")) return thread(+q.get("t"));
  if(q.get("ke")) return compose(q.get("ke"));
  return inbox();
})();
