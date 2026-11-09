/* Alat harian (v13): jadwal sholat dihitung di perangkat (js/sholat.js), libur nasional dari SKB 3 Menteri (js/data.js). */
const TZ = {WIB:"Asia/Jakarta", WITA:"Asia/Makassar", WIT:"Asia/Jayapura"};
const clock = z => new Date().toLocaleTimeString("id-ID",{timeZone:TZ[z],hour:"2-digit",minute:"2-digit",hour12:false}).replace(".",":");
function tickClocks(){ const el = $("clocks"); if(el) el.textContent = Object.keys(TZ).map(z => z + " " + clock(z)).join(" · "); }
function greeting(){
  const h = +clock("WIB").slice(0,2);
  const s = h < 4 ? "malam" : h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam";
  $("greet").textContent = "Selamat " + s + ". " + new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:TZ.WIB}) + ".";
}

/* ---------- Lokasi (disimpan di perangkat ini saja, tidak dikirim ke server) ---------- */
const LOC_KEY = "niflax.kota";
const cityObj = i => ({name:CITIES[i][0], lat:CITIES[i][1], lon:CITIES[i][2], off:CITIES[i][3]});
let loc = cityObj(CITIES.findIndex(c => c[0] === "Jakarta"));
try{
  const v = JSON.parse(localStorage.getItem(LOC_KEY));
  if(v && typeof v.name === "string" && isFinite(v.lat) && isFinite(v.lon) && [7,8,9].includes(v.off)) loc = {name:v.name.slice(0,40), lat:+v.lat, lon:+v.lon, off:+v.off};
}catch(e){}
const saveLoc = () => { try{ localStorage.setItem(LOC_KEY, JSON.stringify(loc)); }catch(e){} };
const zoneName = off => off === 7 ? "WIB" : off === 8 ? "WITA" : "WIT";
function dist(a, b, c, d){                      // jarak kasar (km), cukup untuk memilih kota terdekat
  const r = x => x * Math.PI / 180, dl = r(d - b), p = Math.cos(r((a + c) / 2));
  return 6371 * Math.hypot(r(c - a), dl * p);
}
function useMyLocation(){
  const msg = $("kotaMsg");
  if(!navigator.geolocation){ msg.textContent = "Browser ini tidak mendukung lokasi."; return; }
  msg.textContent = "Mencari lokasi…";
  navigator.geolocation.getCurrentPosition(p => {
    const la = p.coords.latitude, lo = p.coords.longitude;
    let best = 0; CITIES.forEach((c, i) => { if(dist(la, lo, c[1], c[2]) < dist(la, lo, CITIES[best][1], CITIES[best][2])) best = i; });
    if(dist(la, lo, CITIES[best][1], CITIES[best][2]) > 900){ msg.textContent = "Lokasimu di luar Indonesia. Pilih kota dari daftar."; return; }
    loc = {name:"Lokasi saya", lat:la, lon:lo, off:CITIES[best][3]};     // zona waktu ikut kota terdekat
    saveLoc(); msg.textContent = "Memakai lokasimu (zona " + zoneName(loc.off) + ")."; renderKota(); paintSholat();
  }, () => { msg.textContent = "Izin lokasi ditolak. Pilih kota dari daftar."; }, {timeout:10000, maximumAge:600000});
}
function renderKota(){
  const sel = $("kota"); if(!sel) return;
  sel.innerHTML = (loc.name === "Lokasi saya" ? `<option value="-1" selected>Lokasi saya</option>` : "") +
    CITIES.map((c, i) => `<option value="${i}"${c[0] === loc.name ? " selected" : ""}>${esc(c[0])}</option>`).join("");
}

/* ---------- Jadwal sholat ---------- */
function paintSholat(){
  const ul = $("prayerList"); if(!ul) return;
  const s = schedule(loc.lat, loc.lon, loc.off), z = zoneName(loc.off);
  ul.innerHTML = s.rows.map((r, i) => `<li class="${i === s.next ? "now" : ""}"><span>${r[0]}${i === s.next ? " <em>berikutnya</em>" : ""}</span><b>${hm(r[1])}</b></li>`).join("");
  const h = Math.floor(s.delta / 60), m = s.delta % 60;
  const cd = (h ? h + " jam " : "") + m + " menit lagi";
  $("prayerCd").textContent = s.rows[s.next][0] + (s.tomorrow ? " besok" : "") + " " + hm(s.rows[s.next][1]) + " " + z + ", " + cd;
  $("prayerZone").textContent = loc.name + " · " + z;
  const mc = $("miniSholat"); if(mc) mc.innerHTML = `${ic("sholat", "g2", "sm")}<span class="lb">${esc(s.rows[s.next][0])}${s.tomorrow ? " besok" : ""}</span><b>${hm(s.rows[s.next][1])}</b><span class="mt">${cd}</span>`;
}

/* ---------- Libur nasional ---------- */
function wibToday(){ const n = localNow(7); return Date.UTC(n.y, n.m - 1, n.d); }
const dayDiff = iso => { const [y, m, d] = iso.split("-").map(Number); return Math.round((Date.UTC(y, m - 1, d) - wibToday()) / 864e5); };
const fmtD = iso => new Date(iso + "T12:00:00+07:00").toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:TZ.WIB});
const fmtS = iso => new Date(iso + "T12:00:00+07:00").toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short",timeZone:TZ.WIB});
function upcoming(){ return holidays.map(h => ({d:h[0], n:h[1], t:h[2], k:dayDiff(h[0])})).filter(h => h.k >= 0); }
function paintLibur(){
  const el = $("liburBody"); if(!el) return;
  const up = upcoming(), nat = up.find(h => h.t === "libur");
  if(!nat){ el.innerHTML = `<p class="meta">Data libur berikutnya belum tersedia. Menunggu SKB 3 Menteri tahun depan.</p>`; paintMini(); return; }
  const big = nat.k === 0 ? `<div class="big">Hari ini<span> libur</span></div>` : `<div class="big">${nat.k}<span> hari lagi</span></div>`;
  el.innerHTML = big + `<p>${esc(nat.n)} · ${fmtD(nat.d)}</p><ul class="hl">${up.filter(h => h !== nat).slice(0, 4).map(h => `<li><span>${esc(h.n)}</span><b>${fmtS(h.d)}</b>${h.t === "cuti" ? `<em class="tg">cuti bersama</em>` : ""}</li>`).join("")}</ul>`;
  paintMini();
}
function paintMini(){
  const m = $("miniLibur"); if(!m) return;
  const nat = upcoming().find(h => h.t === "libur");
  const short = nat ? nat.n.replace(/^Hari Raya /, "").replace(/ \(.*\)/, "") : "";
  m.innerHTML = nat ? `${ic("libur", "g1", "sm")}<span class="lb">${esc(short)}</span><b>${nat.k === 0 ? "hari ini" : nat.k + " hari"}</b>` : `${ic("libur", "g1", "sm")}<span>Libur nasional</span>`;
}

function renderTools(){
  $("mini").innerHTML = `<a class="mc" id="miniSholat" href="#tool-sholat" data-go="tool-sholat"></a><a class="mc" id="miniLibur" href="#tool-libur" data-go="tool-libur"></a>`;
  $("tools").innerHTML =
   `<article class="card tool" id="tool-sholat"><div class="sh"><h3>Jadwal sholat</h3><small id="prayerZone"></small></div>` +
   `<div class="kota"><select id="kota" aria-label="Kota"></select><button class="btn" id="kotaGps" type="button">Lokasiku</button></div>` +
   `<p class="cd" id="prayerCd" role="status"></p><ul class="prayer" id="prayerList"></ul><p class="meta" id="kotaMsg"></p>` +
   `<p class="fn">Dihitung di perangkatmu dengan metode Kemenag RI (Subuh 20°, Isya 18°, ihtiyat 2 menit). Bisa berbeda 1–2 menit dari jadwal resmi daerahmu. Lokasi tidak dikirim ke server.</p></article>` +
   `<article class="card tool" id="tool-libur"><div class="sh"><h3>Libur nasional</h3><small>2026–2027</small></div><div id="liburBody"></div>` +
   `<p class="fn">Sumber: <a href="${HOLIDAY_SRC}" target="_blank" rel="noopener noreferrer">SKB 3 Menteri</a> (Agama, Ketenagakerjaan, PANRB). Tanggal Idulfitri dan Iduladha ditetapkan Menteri Agama dan bisa bergeser.</p></article>`;
  renderKota(); paintSholat(); paintLibur();
}
function goTool(q){
  const hit = toolRoutes.find(r => r[0].test(q));
  if(!hit) return false;
  const el = $(hit[1]); el.scrollIntoView({behavior:"smooth", block:"center"});
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  return true;
}
