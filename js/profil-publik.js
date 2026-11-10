/* Profil publik (v46): profil?u=<username>. Memakai rpc public_profile (boleh tanpa login). Butuh sesi.js, state.js, bias.js, lokasi.js.
   Tanpa ?u= : bila sudah masuk, dialihkan ke profilmu sendiri. Semua teks pengguna lewat esc(). */
function paintHead(){ $("hbar").innerHTML = session ? Masuk.chip(session) : `<button class="btn green" data-act="login" type="button">Masuk</button>`; }
const bulanTahun = d => new Date(d).toLocaleDateString("id-ID", {month:"long", year:"numeric"});

function render(p, mine){
  const b = biasOf(p.bias), nm = p.display_name || p.username, ini = ([...nm][0] || "B").toUpperCase();
  const lok = Lokasi.teks(p.lokasi);
  const fakta = [
    p.bunnies_sejak ? ["Bunnies sejak", String(p.bunnies_sejak)] : null,
    p.lagu_favorit ? ["Lagu favorit", p.lagu_favorit] : null,
    lok ? ["Asal", lok, 1] : null,
    ["Bergabung", bulanTahun(p.bergabung)]
  ].filter(Boolean);
  document.title = p.handle + " – Bunnies Indonesia";
  $("view").innerHTML = `<article class="pp"${b ? ` style="--bc:${b.warna}"` : ""}>
    <div class="pp-top"><span class="pp-av" aria-hidden="true">${esc(ini)}</span><div><h1>${esc(p.handle)}</h1>${p.display_name ? `<p class="pp-name">${esc(p.display_name)}</p>` : ""}${b ? biasChip(p.bias) : ""}</div></div>
    <p class="pp-bio${p.bio ? "" : " kosong"}">${p.bio ? esc(p.bio) : "Belum ada bio."}</p>
    <dl class="pp-facts">${fakta.map(f => `<div${f[2] ? ' class="w"' : ""}><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}</dl>
    <div class="pp-act">${mine ? `<a class="btn green" href="akun">Ubah profil</a>` : ""}</div>
  </article>`;
}
const notFound = () => { $("view").innerHTML = `<div class="gate"><p><b>Profil tidak ditemukan.</b> Username itu belum ada atau profilnya tidak tersedia.</p></div>`; };

document.addEventListener("click", e => { if(e.target.closest("[data-act=login]")) Masuk.open(); });
$("findForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = $("findIn").value.toLowerCase().replace(/^@/, "").replace(/^njz_/, "").replace(/[^a-z0-9_]/g, "");
  if(v){ const u = "profil?u=" + encodeURIComponent(v); window.bunGo ? bunGo(u) : (location.href = u); }
});
$("findIn").addEventListener("input", e => { e.target.value = e.target.value.toLowerCase().replace(/^@/, "").replace(/^njz_/, "").replace(/[^a-z0-9_]/g, ""); });

(async function(){
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ $("view").innerHTML = `<p class="sinfo">Supabase belum dikonfigurasi di js/config.js.</p>`; return; }
  await initSession(); paintHead();
  const u = (new URLSearchParams(location.search).get("u") || "").trim();
  let own = null;
  if(session){ try{ own = (await rpc("my_profile")).username; }catch(e){} }
  if(!u){
    if(own){ { const u = "profil?u=" + encodeURIComponent(own); window.bunGo ? bunGo(u, false) : location.replace(u); } return; }
    $("view").innerHTML = session ? "" : gate("Masuk untuk melihat profilmu, atau cari username di atas.");
    return;
  }
  try{
    await Lokasi.load();
    const p = await rpc("public_profile", {p:u});
    p ? render(p, own === p.username) : notFound();
  }catch(e){ $("view").innerHTML = `<p class="sinfo">Profil belum bisa dimuat. Pastikan supabase/v46-profil-username.sql sudah dijalankan.</p>`; }
})();
