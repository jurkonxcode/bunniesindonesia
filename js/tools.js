const TZ = {WIB:"Asia/Jakarta", WITA:"Asia/Makassar", WIT:"Asia/Jayapura"};
const clock = z => new Date().toLocaleTimeString("id-ID",{timeZone:TZ[z],hour:"2-digit",minute:"2-digit",hour12:false}).replace(".",":");
function tickClocks(){ const el = $("clocks"); if(el) el.textContent = Object.keys(TZ).map(z => z + " " + clock(z)).join(" · "); }
function greeting(){
  const h = +clock("WIB").slice(0,2);
  const s = h < 4 ? "malam" : h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam";
  $("greet").textContent = "Selamat " + s + ". " + new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:TZ.WIB}) + ".";
}
function daysTo(iso){ const t = new Date(iso + "T00:00:00+07:00"); return Math.ceil((t - Date.now()) / 864e5); }

function renderTools(){
  const [hh, mm] = clock("WIB").split(":").map(Number), now = hh * 60 + mm;
  let next = prayer.findIndex(p => { const [a, b] = p[1].split(":").map(Number); return a * 60 + b > now; });
  if(next < 0) next = 0;
  const hol = holidays.map(h => [h[0], h[1], daysTo(h[1])]).filter(h => h[2] >= 0);
  const fmt = iso => new Date(iso + "T00:00:00+07:00").toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:TZ.WIB});
  $("tools").innerHTML =
   `<article class="card tool" id="tool-sholat"><div class="sh"><h3>Jadwal sholat</h3><small>Jakarta · contoh</small></div><ul class="prayer">${
      prayer.map((p, i) => `<li class="${i === next ? "now" : ""}"><span>${p[0]}${i === next ? " <em>berikutnya</em>" : ""}</span><b>${p[1]}</b></li>`).join("")}</ul></article>` +
   `<article class="card tool" id="tool-kurs"><div class="sh"><h3>Kurs dan emas</h3><small>contoh</small></div><ul class="prayer">${
      rates.map(r => `<li><span>${r[0]}</span><b>${r[1]} <i class="${r[3] ? "u" : "d"}">${r[2]}</i></b></li>`).join("")}</ul></article>` +
   `<article class="card tool" id="tool-resi"><div class="sh"><h3>Cek resi</h3></div><form id="resiForm" class="resi"><select aria-label="Kurir">${couriers.map(c => `<option>${esc(c)}</option>`).join("")}</select><input id="resiNo" placeholder="Nomor resi" autocomplete="off" aria-label="Nomor resi"><button class="btn green" type="submit">Lacak</button></form><p class="meta" id="resiMsg">Masukkan nomor resi dari toko online atau kurir.</p></article>` +
   `<article class="card tool" id="tool-libur"><div class="sh"><h3>Libur nasional</h3></div>${
      hol.length ? `<div class="big">${hol[0][2]}<span> hari lagi</span></div><p>${esc(hol[0][0])} · ${fmt(hol[0][1])}</p>` + (hol[1] ? `<p class="meta">Berikutnya: ${esc(hol[1][0])}, ${fmt(hol[1][1])}</p>` : "") : `<p class="meta">Belum ada data libur berikutnya.</p>`}</article>`;
  $("resiForm").addEventListener("submit", e => {
    e.preventDefault();
    $("resiMsg").textContent = $("resiNo").value.trim().length < 6 ? "Nomor resi terlalu pendek. Periksa lagi nomornya." : "Pelacakan belum aktif. Fitur ini menunggu sambungan ke API kurir lewat Edge Function.";
  });
}
function renderPromo(){
  const d = Math.ceil((new Date(new Date().getFullYear(), 10, 11) - new Date()) / 864e5);
  const el = $("promo");
  if(d < 0 || d > 30){ el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<b>Harbolnas 11.11</b><span>${d === 0 ? "dimulai hari ini" : d + " hari lagi"}</span>`;
}
function goTool(q){
  const hit = toolRoutes.find(r => r[0].test(q));
  if(!hit) return false;
  const el = $(hit[1]); el.scrollIntoView({behavior:"smooth", block:"center"});
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  return true;
}
