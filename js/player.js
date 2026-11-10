/* v44: pemutar lagu yang TIDAK berhenti saat pindah halaman + riwayat dengar per akun.
   Dimuat di <head> SEBELUM script halaman (harus lebih dulu agar listener halaman bisa dibersihkan).
   1) Navigasi lembut: klik tautan internal -> ambil halaman, ganti isi <body>, jalankan script halamannya. Pemutar (#bunPlayer) tidak ikut diganti.
      Gagal di langkah mana pun -> pindah halaman biasa (lagu berhenti, situs tetap jalan).
   2) Pemutar: Spotify iFrame API di dok kiri bawah. Satu lagu dihitung setelah didengar >= 30 detik (atau hampir habis).
   3) Akun yang masuk: hitungan dikirim ke rpc catat_dengar (supabase/v45-riwayat-lagu.sql). Tamu: hanya hitungan sesi ini. */
(() => {
  if(window.BunPlayer) return;
  const SELF = document.currentScript && document.currentScript.src;
  const BASE = SELF ? new URL("./", SELF).href : location.href;
  const add0 = EventTarget.prototype.addEventListener, rem0 = EventTarget.prototype.removeEventListener;
  const setI0 = window.setInterval, clrI0 = window.clearInterval;
  const csDesc = Object.getOwnPropertyDescriptor(Document.prototype, "currentScript");
  const ACC = new URL("../akun", BASE).href;
  const tracked = [], timers = [];
  let curScript = null;

  /* ---- catat listener dokumen/window dan interval milik halaman, supaya bisa dibuang saat pindah ---- */
  EventTarget.prototype.addEventListener = function(t, f, o){
    if((this === document || this === window) && !(this === window && t === "message")) tracked.push([this, t, f, o]);
    return add0.call(this, t, f, o);
  };
  window.setInterval = function(...a){ const id = setI0.apply(window, a); timers.push(id); return id; };
  /* v55: observer milik halaman (IntersectionObserver dll.) juga dicatat dan dilepas saat pindah halaman; dulu tetap hidup dan memicu error */
  const obs = [];
  ["IntersectionObserver", "MutationObserver", "ResizeObserver"].forEach(N => {
    const O = window[N]; if(!O) return;
    const W = function(...a){ const o = new O(...a); obs.push(o); return o; }; W.prototype = O.prototype; window[N] = W;
  });
  const cleanPage = () => { obs.splice(0).forEach(o => { try{ o.disconnect(); }catch(e){} }); tracked.splice(0).forEach(([x, t, f, o]) => rem0.call(x, t, f, o)); timers.splice(0).forEach(id => clrI0.call(window, id)); };
  try{ Object.defineProperty(document, "currentScript", {configurable:true, get(){ return curScript || (csDesc && csDesc.get.call(document)); }}); }catch(e){}

  /* ---- navigasi lembut ---- */
  const txtCache = new Map();
  const getTxt = u => { if(!txtCache.has(u)) txtCache.set(u, fetch(u).then(r => { if(!r.ok) throw 0; return r.text(); })); return txtCache.get(u); };
  const key = () => location.pathname + location.search;
  let cur = key(), busy = false, queued = null;
  const hard = u => { location.href = u; };
  const soft = a => {
    if(location.protocol === "file:" || a.origin !== location.origin || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-hard") || a.hasAttribute("data-act")) return false;
    const last = a.pathname.split("/").pop();
    if(/\.[a-z0-9]+$/i.test(last) && !/\.html?$/i.test(last)) return false;
    if(/(^|\/)admin/i.test(last)) return false;
    if(a.pathname + a.search === cur && a.hash) return false;
    return true;
  };
  async function go(href, push = true){
    const u = new URL(href, location.href);
    if(location.protocol === "file:" || u.origin !== location.origin) return hard(u.href);
    if(busy){ queued = [href, push]; return; }
    busy = true;
    try{
      const res = await fetch(u.href); if(!res.ok) throw 0;
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const bodyScripts = [...doc.body.querySelectorAll("script")].filter(s => !/json/i.test(s.type));
      if(bodyScripts.some(s => /module/i.test(s.type))) throw 0;
      const codes = await Promise.all(bodyScripts.map(s => s.getAttribute("src") ? getTxt(new URL(s.getAttribute("src"), u).href) : s.textContent));
      /* stylesheet: tambahkan yang belum ada dan tunggu selesai, supaya halaman baru tidak berkedip tanpa gaya */
      const want = [...doc.head.querySelectorAll('link[rel="stylesheet"]')].map(l => new URL(l.getAttribute("href"), u).href);
      const have = new Map([...document.head.querySelectorAll('link[rel="stylesheet"]')].map(l => [l.href, l]));
      await Promise.all(want.filter(h => !have.has(h)).map(h => new Promise(ok => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = h; l.onload = l.onerror = ok; const z = document.head.querySelector('link[href*="icloud.css"]'); z ? document.head.insertBefore(l, z) : document.head.appendChild(l); })));
      cleanPage();
      if(push) history.pushState({bun:1}, "", u.href);
      cur = key();
      have.forEach((l, h) => { if(!want.includes(h)) l.remove(); });
      document.head.querySelectorAll("style:not([data-keep])").forEach(s => s.remove());
      doc.head.querySelectorAll("style").forEach(s => document.head.appendChild(document.importNode(s, true)));
      document.title = doc.title;
      document.documentElement.lang = doc.documentElement.lang || document.documentElement.lang;   /* v55: bahasa halaman ikut berganti (tombol bahasa membacanya) */
      const SEO = 'link[rel="canonical"],link[rel="alternate"][hreflang]';
      document.head.querySelectorAll(SEO).forEach(n => n.remove()); doc.head.querySelectorAll(SEO).forEach(n => document.head.appendChild(document.importNode(n, true)));
      const d0 = document.head.querySelector('meta[name="description"]'), d1 = doc.head.querySelector('meta[name="description"]');
      if(d0 && d1) d0.content = d1.content;
      document.body.className = doc.body.className;
      const dock = document.getElementById("bunPlayer");
      [...document.body.childNodes].forEach(n => { if(n !== dock) n.remove(); });
      [...doc.body.childNodes].forEach(n => document.body.insertBefore(document.importNode(n, true), dock));
      const live = [...document.body.querySelectorAll("script")].filter(s => !/json/i.test(s.type));
      window.scrollTo(0, 0);
      /* semua script halaman dijalankan dalam SATU fungsi baru: nama const/let tidak bentrok dengan halaman sebelumnya */
      new Function("__cs", codes.map((c, i) => "__cs(" + i + ");\n" + c).join("\n;\n"))(i => { curScript = live[i] || null; });
      curScript = null;
      document.dispatchEvent(new Event("DOMContentLoaded", {bubbles:true}));
      if(u.hash){ const el = document.getElementById(decodeURIComponent(u.hash.slice(1))); if(el) el.scrollIntoView(); }
      window.dispatchEvent(new CustomEvent("bun:nav"));
      foot();
    }catch(e){ curScript = null; busy = false; return hard(u.href); }
    busy = false;
    if(queued){ const q = queued; queued = null; go(q[0], q[1]); }
  }
  window.bunGo = (u, push) => go(u, push !== false);   /* v55: bunGo(url, false) = muat ulang halaman ini tanpa menambah riwayat */
  add0.call(document, "click", e => {
    if(e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if(!a || a.getAttribute("href").startsWith("#") || !soft(a)) return;
    e.preventDefault(); go(a.href);
  });
  add0.call(window, "popstate", () => { if(key() !== cur) go(location.href, false); });

  /* ---- dok pemutar ---- */
  const CSS = `#bunPlayer{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:70;width:min(400px,calc(100vw - 24px));border-radius:20px;background:#fff;border:1.5px solid #d6e5ff;box-shadow:0 14px 34px -14px rgba(47,111,228,.55);overflow:hidden;font:13px/1.4 'Instrument Sans',system-ui,sans-serif;color:#1f3b73}
#bunPlayer[hidden]{display:none}.bp-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(135deg,#eaf2ff,#cfe0ff)}
.bp-ic{color:#2f6fe4;font-size:16px}.bp-t{flex:1;font:800 13px Sora,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bp-bar button{width:30px;height:30px;border-radius:50%;border:0;background:#fff;color:#2f6fe4;font:800 16px/1 system-ui;cursor:pointer}
.bp-b{height:352px;overflow:hidden;transition:height .2s}#bunPlayer.yt .bp-b{height:auto;aspect-ratio:16/9}#bunPlayer.min .bp-b{height:0!important;aspect-ratio:auto!important}.bp-b iframe{display:block;width:100%;height:100%;border:0}
.bp-f{margin:0;padding:6px 12px 8px;font-size:12px;color:#5b6b8c}.bp-f a{color:#1f56c2;text-decoration:underline}.musik-on{margin:0;padding:16px;font-size:13px;color:#1f56c2;text-align:center}`;
  let dock = null, ctrl = null, ytp = null, poll = null, eng = null, api = null, loading = false, pending = null, count = 0, now = null, lastPos = 0;
  const mount = () => {
    if(dock) return;
    const st = document.createElement("style"); st.dataset.keep = "1"; st.textContent = CSS; document.head.appendChild(st);
    dock = document.createElement("div"); dock.id = "bunPlayer"; dock.hidden = true;
    dock.innerHTML = '<div class="bp-bar"><span class="bp-ic" aria-hidden="true">♫</span><b class="bp-t" id="bpT">Pemutar Bunnies</b><button type="button" data-bp="min" aria-label="Kecilkan pemutar">–</button><button type="button" data-bp="close" aria-label="Tutup dan hentikan lagu">×</button></div><div class="bp-b"><div id="bpHost"></div></div><p class="bp-f" id="bpF"></p>';
    document.body.appendChild(dock);
    add0.call(dock, "click", e => {
      const b = e.target.closest("[data-bp]"); if(!b) return;
      if(b.dataset.bp === "min"){ dock.classList.toggle("min"); b.textContent = dock.classList.contains("min") ? "+" : "–"; }
      if(b.dataset.bp === "close") closeP();
    });
  };
  const sess = () => { try{ return JSON.parse(localStorage.getItem("bunnies.session")); }catch(e){ return null; } };
  function foot(){
    const f = document.getElementById("bpF"); if(!f || !dock) return;
    f.innerHTML = "Sesi ini: " + count + " lagu · " + (sess() ? "tercatat di riwayat akunmu (menu Akun)." : '<a href="' + ACC + '">Masuk</a> agar riwayat tersimpan.');
  }
  const uriFrom = src => { try{ const u = new URL(src); if(u.hostname !== "open.spotify.com") return null; const m = u.pathname.match(/^\/(?:embed\/)?(playlist|album|artist|track|show|episode)\/([A-Za-z0-9]+)/); return m ? "spotify:" + m[1] + ":" + m[2] : null; }catch(e){ return null; } };
  const ytList = src => { try{ const u = new URL(src); return /(^|\.)youtube\.com$/.test(u.hostname) ? (u.searchParams.get("list") || null) : null; }catch(e){ return null; } };
  function make(){
    api.createController(document.getElementById("bpHost"), {uri:pending, width:"100%", height:352}, c => {
      ctrl = c; loading = false;
      c.addListener("playback_update", onUpd);
      c.addListener("ready", () => { try{ c.play(); }catch(e){} });
    });
  }
  function open(src, title){
    const yl = ytList(src), uri = yl ? null : uriFrom(src); if(!yl && !uri) return false;
    mount(); const kind = yl ? "yt" : "sp";
    if(eng && eng !== kind) closeP(true);
    eng = kind; dock.hidden = false; dock.classList.remove("min"); dock.classList.toggle("yt", kind === "yt");
    document.getElementById("bpT").textContent = title || "Pemutar Bunnies"; foot();
    now = null; if(yl) return openYT(yl); pending = uri;
    if(ctrl){ ctrl.loadUri(uri); try{ ctrl.play(); }catch(e){} return true; }
    if(loading) return true;
    loading = true;
    if(api){ make(); return true; }
    window.onSpotifyIframeApiReady = a => { api = a; make(); };
    const s = document.createElement("script"); s.src = "https://open.spotify.com/embed/iframe-api/v1"; s.async = true;
    s.onerror = () => { loading = false; const f = document.createElement("iframe"); f.src = "https://open.spotify.com/embed/" + uri.split(":").slice(1).join("/"); f.title = "Pemutar Spotify"; f.allow = "autoplay; encrypted-media"; document.getElementById("bpHost").replaceWith(f); document.getElementById("bpF").textContent = "Riwayat tidak tercatat (pemutar cadangan)."; };
    document.head.appendChild(s);
    return true;
  }
  function closeP(sw){
    try{ ctrl && ctrl.destroy(); }catch(e){}
    try{ ytp && ytp.destroy(); }catch(e){}
    if(poll){ clrI0.call(window, poll); poll = null; }
    ctrl = null; ytp = null; loading = false; now = null; eng = null;
    dock.querySelector(".bp-b").innerHTML = '<div id="bpHost"></div>'; if(sw !== true) dock.hidden = true;
  }
  /* ---- YouTube (lagu penuh tanpa login). Host nocookie; skrip API baru dimuat saat tombol ditekan ---- */
  function openYT(list){
    pending = list;
    if(ytp){ try{ ytp.loadPlaylist({list, listType:"playlist"}); }catch(e){} return true; }
    if(loading) return true;
    loading = true;
    if(window.YT && YT.Player){ makeYT(); return true; }
    window.onYouTubeIframeAPIReady = makeYT;
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true;
    s.onerror = () => { loading = false; const f = document.createElement("iframe"); f.src = "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(list); f.title = "Pemutar YouTube"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; document.getElementById("bpHost").replaceWith(f); document.getElementById("bpF").textContent = "Riwayat tidak tercatat (pemutar cadangan)."; };
    document.head.appendChild(s);
    return true;
  }
  function makeYT(){
    ytp = new YT.Player("bpHost", {width:"100%", height:"100%", host:"https://www.youtube-nocookie.com",
      playerVars:{listType:"playlist", list:pending, loop:1, playsinline:1, rel:0},
      events:{onReady:e => { loading = false; try{ e.target.setLoop(true); e.target.playVideo(); }catch(x){} }, onStateChange:tickYT}});
    poll = setI0.call(window, tickYT, 1000);
  }
  function tickYT(){
    const p = ytp; if(!p || !p.getPlayerState) return;
    let st, v = {}; try{ st = p.getPlayerState(); v = p.getVideoData() || {}; }catch(e){ return; }
    if(v.title){ const t = document.getElementById("bpT"); if(t) t.textContent = v.title; }
    onUpd({data:{isPaused:st !== 1, isBuffering:st === 3, duration:(p.getDuration() || 0) * 1000, position:(p.getCurrentTime() || 0) * 1000, playingURI:v.video_id ? "youtube:" + v.video_id : null, title:v.title || null}});
  }

  /* ---- hitung lagu yang benar-benar didengar ---- */
  function onUpd(e){
    const d = e && e.data || {}; if(!d.duration) return;
    const k = (d.playingURI || "") + "|" + d.duration;
    if(!now || now.k !== k || d.position + 3000 < lastPos){ now = {k, uri:d.playingURI || null, title:d.title || null, ms:0, done:false}; lastPos = d.position; }
    if(!d.isPaused && !d.isBuffering){ const dt = d.position - lastPos; if(dt > 0 && dt < 4000) now.ms += dt; }
    lastPos = d.position;
    if(!now.done && now.ms >= Math.min(30000, d.duration - 1000)){ now.done = true; count++; foot(); save(now); }
  }
  let C = null;
  const cfg = () => C || (C = fetch(BASE + "config.js").then(r => r.text()).then(t => ({u:(t.match(/SUPABASE_URL\s*=\s*"([^"]+)"/) || [])[1], k:(t.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/) || [])[1]})));
  async function tok(){
    const s = sess(); if(!s || !s.access_token) return null;
    if(s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try{
      const c = await cfg();
      const r = await fetch(c.u + "/auth/v1/token?grant_type=refresh_token", {method:"POST", headers:{"Content-Type":"application/json", apikey:c.k}, body:JSON.stringify({refresh_token:s.refresh_token})});
      const d = await r.json(); if(!r.ok || !d.access_token) return null;
      localStorage.setItem("bunnies.session", JSON.stringify({access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user:d.user || s.user}));
      return d.access_token;
    }catch(e){ return null; }
  }
  async function save(t){
    if(!sess()) return;
    let judul = t.title || null;
    if(!judul && /^spotify:track:/.test(t.uri || "")){
      try{ const ac = new AbortController(); setTimeout(() => ac.abort(), 4000);
        const r = await fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent("https://open.spotify.com/track/" + t.uri.split(":")[2]), {signal:ac.signal});
        if(r.ok) judul = (await r.json()).title || null; }catch(e){}
    }
    try{
      const [c, tk] = [await cfg(), await tok()]; if(!tk) return;
      const r = await fetch(c.u + "/rest/v1/rpc/catat_dengar", {method:"POST", headers:{"Content-Type":"application/json", apikey:c.k, Authorization:"Bearer " + tk}, body:JSON.stringify({p_uri:t.uri, p_judul:judul, p_ms:Math.round(t.ms)})});
      if(r.ok) window.dispatchEvent(new CustomEvent("bun:dengar"));
    }catch(e){}
  }

  window.BunPlayer = {open, go, __feed:onUpd};
  const boot = () => mount();
  document.readyState === "loading" ? add0.call(document, "DOMContentLoaded", boot) : boot();
})();
