/* v22: data langsung di sidebar: cuaca (Open-Meteo), gempa terkini (BMKG), kurs (open.er-api.com).
   Dipanggil dari browser pengunjung, tanpa kunci API. Kota mengikuti `loc` dari tools.js (pilihan pengguna atau lokasi perangkat).
   Hasil disimpan di sessionStorage 10 menit supaya hemat panggilan. Gagal = kotak menampilkan pesan, bukan angka palsu. */
(() => {
  const WX = c => c === 0 ? ["Cerah", "☀️"] : c <= 2 ? ["Cerah berawan", "⛅"] : c === 3 ? ["Berawan", "☁️"] : c <= 48 ? ["Berkabut", "🌫️"] : c <= 57 ? ["Gerimis", "🌦️"] : c <= 67 ? ["Hujan", "🌧️"] : c <= 77 ? ["Salju", "❄️"] : c <= 82 ? ["Hujan lebat", "🌧️"] : c <= 86 ? ["Salju", "❄️"] : ["Badai petir", "⛈️"];
  const TTL = 600000;
  async function cached(key, url){
    try{ const c = JSON.parse(sessionStorage.getItem(key)); if(c && Date.now() - c.t < TTL) return c.d; }catch(e){}
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 10000);
    try{
      const r = await fetch(url, {signal:ctl.signal}); if(!r.ok) throw new Error(r.status);
      const d = await r.json(); try{ sessionStorage.setItem(key, JSON.stringify({t:Date.now(), d})); }catch(e){}
      return d;
    }finally{ clearTimeout(to); }
  }
  const box = (id, title, sub) => { const s = $(id); if(!s) return null; s.innerHTML = `<div class="sh"><h2>${title}</h2><small>${sub || ""}</small></div><div class="lv" id="${id}B"><p class="mnote">Memuat…</p></div>`; return $(id + "B"); };
  const fail = el => { el.innerHTML = `<p class="mnote">Data belum bisa dimuat. Coba muat ulang halaman nanti.</p>`; };

  async function cuaca(){
    const el = box("wx", "Cuaca", esc(loc.name)); if(!el) return;
    try{
      const la = (+loc.lat).toFixed(2), lo = (+loc.lon).toFixed(2);
      const d = await cached("bunnies.wx." + la + "," + lo, `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`);
      const [t, ic] = WX(d.current.weather_code);
      const days = d.daily.time.map((x, i) => `<div><span>${new Date(x + "T12:00:00").toLocaleDateString("id-ID", {weekday:"short"})}</span><i>${WX(d.daily.weather_code[i])[1]}</i><b>${Math.round(d.daily.temperature_2m_max[i])}°</b><em>${Math.round(d.daily.temperature_2m_min[i])}°</em></div>`).join("");
      el.innerHTML = `<div class="wnow"><span class="big">${ic}</span><b>${Math.round(d.current.temperature_2m)}°C</b><span>${t}</span></div><div class="wdays">${days}</div><button type="button" class="lk" id="wxLoc">Pakai lokasiku</button><p class="src">Sumber: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>`;
    }catch(e){ fail(el); }
  }
  async function gempa(){
    const el = box("eq", "Gempa terkini", "BMKG"); if(!el) return;
    try{
      const g = (await cached("bunnies.eq", "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json")).Infogempa.gempa;
      el.innerHTML = `<p class="eqm"><b>M ${esc(g.Magnitude)}</b> · ${esc(g.Wilayah)}</p><p class="mnote">${esc(g.Tanggal)} ${esc(g.Jam)} · kedalaman ${esc(g.Kedalaman)}<br>${esc(g.Potensi || "")}</p><p class="src">Sumber: <a href="https://www.bmkg.go.id/" target="_blank" rel="noopener">BMKG</a></p>`;
    }catch(e){ fail(el); }
  }
  async function kurs(){
    const el = box("fx", "Kurs rupiah", "per hari"); if(!el) return;
    try{
      const d = await cached("bunnies.fx", "https://open.er-api.com/v6/latest/USD"), idr = d.rates.IDR;
      const row = (n, c, k = 1) => d.rates[c] ? `<div><span>${n}</span><b>Rp ${Math.round(idr / d.rates[c] * k).toLocaleString("id-ID")}</b></div>` : "";
      el.innerHTML = `<div class="fxl">${row("100 KRW (won)", "KRW", 100)}${row("100 JPY (yen)", "JPY", 100)}${row("1 USD", "USD")}${row("1 SGD", "SGD")}${row("1 SAR", "SAR")}</div><p class="src">Sumber: <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a>. Kurs tengah, bukan kurs jual-beli bank.</p>`;
    }catch(e){ fail(el); }
  }
  window.liveRefresh = cuaca;                     // dipanggil tools.js saat kota berganti
  document.addEventListener("click", e => { if(e.target.id === "wxLoc") useMyLocation(); });
  cuaca(); gempa(); kurs();
  // Ikuti lokasi perangkat otomatis hanya bila izin SUDAH pernah diberikan dan belum ada kota pilihan sendiri
  try{
    if(!localStorage.getItem(LOC_KEY) && navigator.permissions) navigator.permissions.query({name:"geolocation"}).then(p => { if(p.state === "granted") useMyLocation(); });
  }catch(e){}
})();
