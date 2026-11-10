/* Akun saya (v26): ubah nama tampil, unduh data, keluar, hapus akun. v31: pilih bias. v46: Profil.init() (js/profil.js). Butuh supabase/v26-moderasi.sql dan v31-komentar-reaksi-bias.sql. */
function paintHead(){ $("hbar").innerHTML = session ? Masuk.chip(session) : `<button class="btn green" data-act="login" type="button">Masuk</button>`; }
const say = (id, txt, err) => { const m = $(id); m.className = "msg" + (err ? " err" : ""); m.textContent = T(txt); };

async function loadName(){
  const meta = (session.user.user_metadata && (session.user.user_metadata.name || session.user.user_metadata.full_name)) || (session.user.email || "").split("@")[0];
  let nm = meta;
  try{ const p = await rest("profiles?id=eq." + encodeURIComponent(session.user.id) + "&select=display_name"); if(p && p[0] && p[0].display_name) nm = p[0].display_name; }catch(e){}
  $("nameIn").value = nm;
}
async function saveName(){
  const btn = $("nameForm").querySelector("button"); btn.disabled = true; say("nameMsg", "Menyimpan…");
  try{ await rpc("set_display_name", {p_name:$("nameIn").value}); say("nameMsg", "Tersimpan."); }
  catch(e){ say("nameMsg", e.message, true); }
  btn.disabled = false;
}
async function download(){
  const btn = $("dlBtn"); btn.disabled = true; say("dlMsg", "Menyiapkan…");
  try{
    const data = await rpc("export_my_data");
    try{ data.riwayat_lagu = await rpc("riwayat_dengar", {p_limit:1000}); }catch(e){}
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:"application/json"}));
    const a = document.createElement("a"); a.href = url; a.download = "bunnies-data-saya.json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("dlMsg", "Selesai. Berkas diunduh.");
  }catch(e){ say("dlMsg", e.message, true); }
  btn.disabled = false;
}
async function removeAccount(){
  if($("delIn").value.trim() !== T("HAPUS")) return;
  if(!confirm(T("Hapus akun dan semua kontenmu secara permanen?"))) return;
  const btn = $("delBtn"); btn.disabled = true; say("delMsg", "Menghapus…");
  try{
    await rpc("delete_my_account");
    keep(null);
    $("akunView").hidden = true; paintHead();
    $("gateView").hidden = false;
    $("gateView").innerHTML = `<div class="gate"><p><b>${T("Akunmu sudah dihapus.")}</b> ${T("Terima kasih sudah mencoba Bunnies Indonesia.")}</p><a class="btn green" href="./">${T("Ke beranda")}</a></div>`;
  }catch(e){ say("delMsg", e.message, true); btn.disabled = $("delIn").value.trim() !== "HAPUS"; }
}

/* ---------- Bias (v31) ---------- */
let myBias = null;
function paintBias(){
  $("biasPick").innerHTML = [...BIAS.map(b => ({id:b.id, nama:b.nama, warna:b.warna})), {id:"none", nama:"Belum pilih", warna:"#5f6f8c"}]
    .map(b => `<button type="button" data-bias="${b.id}" style="--bc:${b.warna}" aria-pressed="${(myBias || "none") === b.id}">${esc(T(b.nama))}</button>`).join("");
}
async function loadBias(){
  try{
    const p = await rest("profiles?id=eq." + encodeURIComponent(session.user.id) + "&select=bias");
    myBias = p && p[0] && p[0].bias || null;
  }catch(e){ myBias = null; }
  paintBias();
}
async function saveBias(id){
  const val = id === "none" ? null : id;
  const btns = $("biasPick").querySelectorAll("button"); btns.forEach(b => b.disabled = true);
  say("biasMsg", "Menyimpan…");
  try{
    await rpc("set_bias", {p_bias:val}); myBias = val; paintBias(); say("biasMsg", "Tersimpan. Bias tampil di komentarmu berikutnya.");
  }catch(e){ say("biasMsg", e.message, true); }
  $("biasPick").querySelectorAll("button").forEach(b => b.disabled = false);
}

/* ---------- Riwayat dengar (v44) ---------- */
const durasi = s => s >= 3600 ? Math.floor(s / 3600) + " jam " + Math.round(s % 3600 / 60) + " menit" : Math.max(s ? 1 : 0, Math.round(s / 60)) + " menit";
async function loadHist(){
  const box = $("histBody"); if(!box) return;
  try{
    const h = await rpc("riwayat_dengar", {p_limit:10});
    box.innerHTML = `<p><b>${h.total}</b> ${T('lagu')} · ${T(durasi(h.detik))} · ${h.hari_ini} ${T('hari ini')}</p>` +
      (h.terakhir.length ? `<ol>${h.terakhir.map(x => `<li>${esc(x.judul || T("Lagu"))} <span class="meta">· ${T(ago(x.at))}</span></li>`).join("")}</ol>` : `<p>${T('Belum ada. Tekan "Putar lagu" di beranda, lalu dengarkan sampai habis atau sekitar 30 detik.')}</p>`);
  }catch(e){ box.textContent = T("Riwayat belum aktif. Jalankan supabase/v45-riwayat-lagu.sql di Supabase."); }
}
async function clearHist(){
  if(!confirm(T("Hapus semua riwayat dengar lagumu?"))) return;
  say("histMsg", "Menghapus…");
  try{ await rpc("hapus_riwayat_dengar"); say("histMsg", "Riwayat dihapus."); loadHist(); }catch(e){ say("histMsg", e.message, true); }
}
window.addEventListener("bun:dengar", loadHist);

document.addEventListener("click", async e => {
  const t = e.target.closest("[data-act],[data-bias],#dlBtn,#outBtn,#delBtn,#histClr"); if(!t) return;
  if(t.dataset.bias) return saveBias(t.dataset.bias);
  if(t.dataset.act === "login") return Masuk.open();
  if(t.id === "dlBtn") return download();
  if(t.id === "histClr") return clearHist();
  if(t.id === "outBtn"){ await signOut(); window.bunGo ? bunGo("./") : (location.href = "./"); return; }
  if(t.id === "delBtn") return removeAccount();
});
$("nameForm").addEventListener("submit", e => { e.preventDefault(); saveName(); });
$("delIn").addEventListener("input", () => { $("delBtn").disabled = $("delIn").value.trim() !== "HAPUS"; });
/* ---------- Tab (v47) ---------- */
function showTab(id){
  document.querySelectorAll(".ptabs [data-tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
  $("tab-profil").hidden = id !== "profil"; $("tab-atur").hidden = id !== "atur";
}
document.querySelectorAll(".ptabs [data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));

/* ---------- Sosial media (v47): hanya domain resmi, lewat fungsi save_socials ---------- */
const SOC_IN = {instagram:"sIg", x:"sX", tiktok:"sTt", youtube:"sYt", weverse:"sWv", spotify:"sSp"};
async function saveSocials(e){
  e.preventDefault();
  const btn = $("socForm").querySelector("button"); btn.disabled = true; say("socMsg", "Menyimpan…");
  const obj = {}; Object.keys(SOC_IN).forEach(k => { obj[k] = $(SOC_IN[k]).value.trim(); });
  try{ const p = await rpc("save_socials", {p:obj}); Profil.fill(p); say("socMsg", "Sosial media tersimpan."); }
  catch(err){ say("socMsg", err.message, true); }
  btn.disabled = false;
}
$("socForm").addEventListener("submit", saveSocials);

(async function(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("gateView").innerHTML = `<p class="sinfo">${T("Supabase belum dikonfigurasi di js/config.js.")}</p>`; return; }
  await initSession(); paintHead();
  if(!session){ $("gateView").innerHTML = gate(T("Masuk dulu untuk mengelola akunmu.")); return; }
  $("gateView").hidden = true; $("akunView").hidden = false;
  $("who").textContent = session.user.email || "";
  loadName(); loadBias(); loadHist(); Profil.init();
  rpc("is_admin").then(v => { $("adminBox").hidden = v !== true; }).catch(() => {});
})();
