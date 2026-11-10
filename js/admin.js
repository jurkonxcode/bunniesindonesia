/* Panel admin (v26). Keamanan sebenarnya ada di fungsi SQL (require_admin); halaman ini hanya antarmuka.
   Butuh supabase/v26-moderasi.sql dan baris admin untuk akunmu. Semua teks dari database lewat esc(). */
const PAGE = 30, KIND = {post:"Tulisan", question:"Pertanyaan", answer:"Jawaban"};
const REASON = {spam:"spam", sara:"SARA", porno:"dewasa", pribadi:"data pribadi", lainnya:"lainnya"};
const TABS = [["laporan","Laporan"], ["tersembunyi","Tersembunyi"], ["terbaru","Terbaru"], ["diblokir","Diblokir"]];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let view = "laporan", offset = 0, stats = {};

function paintHead(){ $("hbar").innerHTML = session ? Masuk.chip(session) : `<button class="btn green" data-act="login" type="button">Masuk</button>`; }
function paintStats(){
  const s = stats, n = k => +s[k] || 0;
  $("stats").innerHTML = [["laporan","Laporan baru",1], ["tersembunyi","Tersembunyi",0], ["diblokir","Diblokir",0], ["tulisan","Tulisan",0], ["pertanyaan","Pertanyaan",0], ["jawaban","Jawaban",0], ["pengguna","Pengguna",0]]
    .map(([k, l, hot]) => `<div${hot && n(k) ? ` class="hot"` : ""}><b>${n(k)}</b><span>${l}</span></div>`).join("");
  const badge = {laporan:n("laporan"), tersembunyi:n("tersembunyi"), diblokir:n("diblokir")};
  $("tabs").innerHTML = TABS.map(([v, l]) => `<button type="button" aria-pressed="${v === view}" data-v="${v}">${l}${badge[v] ? `<small>${badge[v]}</small>` : ""}</button>`).join("");
}
async function loadStats(){ try{ stats = (await rpc("admin_stats")) || {}; }catch(e){ stats = {}; } paintStats(); }

const href = r => r.ttype === "post" ? "blog?id=" + (+r.tid) : "tanya?id=" + (+(r.ttype === "answer" ? r.qid : r.tid));
function row(r){
  const hidden = r.cstatus === "hidden", why = String(r.reasons || "").split(", ").filter(Boolean).map(x => REASON[x] || x).join(", ");
  const a = (act, txt, cls) => `<button class="lk${cls ? " " + cls : ""}" data-a="${act}" type="button">${txt}</button>`;
  return `<article class="mr" data-t="${esc(r.ttype)}" data-i="${+r.tid}">` +
    `<div class="mh"><span class="kind">${esc(KIND[r.ttype] || r.ttype)}</span>${hidden ? `<span class="chip off">Disembunyikan</span>` : `<span class="chip on">Tampil</span>`}${+r.rcount ? `<span class="chip rep">${+r.rcount} laporan: ${esc(why)}</span>` : ""}</div>` +
    (r.title ? `<h3>${esc(r.title)}</h3>` : "") + `<p class="pv">${esc(r.body || "")}</p>` +
    `<span class="meta">${esc(r.author_name || "Pengguna")} · ${esc(ago(r.created_at))}</span>` +
    `<div class="acts">${hidden ? "" : `<a class="lk" href="${href(r)}" target="_blank" rel="noopener">Lihat</a>`}${hidden ? a("tampilkan", "Tampilkan") : a("sembunyikan", "Sembunyikan")}${+r.rcount ? a("abaikan", "Abaikan laporan") : ""}${a("hapus", "Hapus", "bad")}${a("blokir", "Blokir penulis", "bad")}</div></article>`;
}
const blockedRow = b => `<article class="mr" data-u="${esc(b.user_id)}"><div class="mh"><span class="kind">Diblokir</span></div><h3>${esc(b.display_name)}</h3>${b.reason ? `<p class="pv">${esc(b.reason)}</p>` : ""}<span class="meta">${esc(ago(b.created_at))}</span><div class="acts"><button class="lk" data-a="buka" type="button">Buka blokir</button></div></article>`;

async function loadList(reset){
  if(reset){ offset = 0; $("list").innerHTML = ""; }
  $("info").textContent = "Memuat…"; $("more").hidden = true;
  try{
    if(view === "diblokir"){
      const rows = (await rpc("admin_blocked")) || [];
      $("list").innerHTML = rows.map(blockedRow).join("");
      $("info").textContent = rows.length ? "" : "Tidak ada akun yang diblokir."; return;
    }
    const rows = (await rpc("admin_queue", {p_view:view, p_limit:PAGE, p_offset:offset})) || [];
    $("list").insertAdjacentHTML("beforeend", rows.map(row).join(""));
    offset += rows.length;
    $("info").textContent = offset ? "" : ({laporan:"Tidak ada laporan baru. Bagus.", tersembunyi:"Tidak ada konten tersembunyi.", terbaru:"Belum ada konten."})[view];
    $("more").hidden = rows.length < PAGE;
  }catch(e){ $("info").textContent = "Gagal memuat: " + e.message; }
}
async function act(el, action){
  const card = el.closest(".mr"); if(!card) return;
  if(action === "buka"){
    const u = card.dataset.u; if(!UUID.test(u || "")) return;
    try{ await rpc("admin_unblock", {p_user:u}); }catch(e){ return alert("Gagal: " + e.message); }
  }else{
    const t = card.dataset.t, i = +card.dataset.i; let note = null;
    if(action === "hapus" && !confirm("Hapus permanen konten ini? Tidak bisa dibatalkan.")) return;
    if(action === "blokir"){
      note = prompt("Blokir penulis konten ini. Alasan (opsional, hanya terlihat admin):");
      if(note === null) return;
    }
    try{ await rpc("admin_act", {p_type:t, p_id:i, p_action:action, p_note:note || null}); }catch(e){ return alert("Gagal: " + e.message); }
  }
  await loadStats(); loadList(true);
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act],[data-v],[data-a],#more"); if(!t) return;
  if(t.dataset.act === "login") return Masuk.open();
  if(t.id === "more") return loadList(false);
  if(t.dataset.v){ view = t.dataset.v; paintStats(); return loadList(true); }
  if(t.dataset.a) return act(t, t.dataset.a);
});
(async function(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("gateView").innerHTML = `<p class="sinfo">Supabase belum dikonfigurasi di js/config.js.</p>`; return; }
  await initSession(); paintHead();
  if(!session){ $("gateView").innerHTML = gate("Masuk dulu untuk membuka panel admin."); return; }
  let ok = false;
  try{ ok = (await rpc("is_admin")) === true; }
  catch(e){ $("gateView").innerHTML = `<p class="sinfo">Gagal memeriksa akses (${esc(e.message)}). Pastikan <b>v26-moderasi.sql</b> sudah dijalankan di Supabase.</p>`; return; }
  if(!ok){ $("gateView").innerHTML = `<p class="sempty">Halaman ini khusus admin.</p>`; return; }
  $("gateView").hidden = true; $("adminView").hidden = false;
  await loadStats(); loadList(true);
})();
