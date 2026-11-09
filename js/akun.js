/* Akun saya (v26): ubah nama tampil, unduh data, keluar, hapus akun. Butuh supabase/v26-moderasi.sql. */
function paintHead(){ $("hbar").innerHTML = session ? `<span class="who">${myName()}</span>` : `<button class="btn green" data-act="login" type="button">Masuk</button>`; }
const say = (id, txt, err) => { const m = $(id); m.className = "msg" + (err ? " err" : ""); m.textContent = txt; };

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
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:"application/json"}));
    const a = document.createElement("a"); a.href = url; a.download = "niflax-data-saya.json";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("dlMsg", "Selesai. Berkas diunduh.");
  }catch(e){ say("dlMsg", e.message, true); }
  btn.disabled = false;
}
async function removeAccount(){
  if($("delIn").value.trim() !== "HAPUS") return;
  if(!confirm("Hapus akun dan semua kontenmu secara permanen?")) return;
  const btn = $("delBtn"); btn.disabled = true; say("delMsg", "Menghapus…");
  try{
    await rpc("delete_my_account");
    keep(null);
    $("akunView").hidden = true; paintHead();
    $("gateView").hidden = false;
    $("gateView").innerHTML = `<div class="gate"><p><b>Akunmu sudah dihapus.</b> Terima kasih sudah mencoba Niflax.</p><a class="btn green" href="./">Ke beranda</a></div>`;
  }catch(e){ say("delMsg", e.message, true); btn.disabled = $("delIn").value.trim() !== "HAPUS"; }
}
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-act],#dlBtn,#outBtn,#delBtn"); if(!t) return;
  if(t.dataset.act === "login") return googleLogin();
  if(t.id === "dlBtn") return download();
  if(t.id === "outBtn"){ await signOut(); location.href = "./"; return; }
  if(t.id === "delBtn") return removeAccount();
});
$("nameForm").addEventListener("submit", e => { e.preventDefault(); saveName(); });
$("delIn").addEventListener("input", () => { $("delBtn").disabled = $("delIn").value.trim() !== "HAPUS"; });
(async function(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("gateView").innerHTML = `<p class="sinfo">Supabase belum dikonfigurasi di js/config.js.</p>`; return; }
  await initSession(); paintHead();
  if(!session){ $("gateView").innerHTML = gate("Masuk dulu untuk mengelola akunmu."); return; }
  $("gateView").hidden = true; $("akunView").hidden = false;
  $("who").textContent = session.user.email || "";
  loadName();
  rpc("is_admin").then(v => { $("adminBox").hidden = v !== true; }).catch(() => {});
})();
