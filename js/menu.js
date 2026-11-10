/* v16: panel menu hamburger (bisa digulir, daftar dari js/services.js) dan kotak cari ringkas di header saat halaman digulir.
   Bergantung pada: ic() dan esc() (ui.js/state.js), session/myName/openAuth/logout (auth.js), goTool (tools.js). Muat setelah tools.js. */
(() => {
  const drawer = $("drawer"), back = $("dwBack"), body = $("dwBody"), burger = document.querySelector(".top .burger");
  const flat = GROUPS.flatMap(g => g.items.map(i => ({c:g.c, id:i[0], name:i[1], href:i[2], st:i[3] || ""})));
  let last = null;

  function myPins(){                         // pintasan dari halaman Semua layanan (localStorage perangkat ini)
    try{ const p = JSON.parse(localStorage.getItem("bunnies.pins")); return Array.isArray(p) ? p.map(id => flat.find(s => s.id === id && s.href)).filter(Boolean).slice(0, 8) : []; }
    catch(e){ return []; }
  }
  const row = s => s.href
    ? `<a class="dw-i" href="${esc(s.href)}">${ic(s.id, s.c, "sm")}<span>${esc(s.name)}</span></a>`
    : `<div class="dw-i off">${ic(s.id, s.c, "sm")}<span>${esc(s.name)}<em>segera</em></span></div>`;

  function render(){
    const P = myPins();
    body.innerHTML =
      `<div class="dw-acct">${session ? `<b>Halo, ${myName()}</b><button type="button" class="btn" data-dw="logout">Keluar</button>` : `<b>Masuk ke Bunnies Indonesia</b><button type="button" class="btn green" data-dw="login">Masuk atau daftar</button>`}</div>` +
      (P.length ? `<section class="dw-s"><h3>Pintasanmu <b>${P.length}</b></h3><div class="dw-pins">${P.map(s => `<a href="${esc(s.href)}">${ic(s.id, s.c)}<span>${esc(s.name)}</span></a>`).join("")}</div></section>` : "") +
      GROUPS.map(g => `<section class="dw-s"><h3>${esc(g.name)} <b>${g.items.length}</b></h3><div class="dw-g">${g.items.map(i => row({c:g.c, id:i[0], name:i[1], href:i[2], st:i[3] || ""})).join("")}</div></section>`).join("") +
      `<p class="dw-f"><a href="tentang">Tentang</a> · <a href="tentang?b=kontak">Kontak</a> · <a href="privasi">Privasi</a> · <a href="syarat">Syarat</a></p>`;
    body.scrollTop = 0;
  }
  const isOpen = () => document.body.classList.contains("dw-open");
  function open(){
    last = document.activeElement; render(); drawer.hidden = back.hidden = false;
    requestAnimationFrame(() => document.body.classList.add("dw-open"));
    burger.setAttribute("aria-expanded", "true"); $("dwClose").focus();
  }
  function close(){
    document.body.classList.remove("dw-open"); burger.setAttribute("aria-expanded", "false");
    setTimeout(() => { if(!isOpen()) drawer.hidden = back.hidden = true; }, 220);
    if(last && last.focus) last.focus();
  }
  burger.setAttribute("aria-haspopup", "dialog"); burger.setAttribute("aria-expanded", "false");
  burger.addEventListener("click", e => { if(e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); isOpen() ? close() : open(); });   // tanpa JS tetap ke halaman Semua layanan
  back.addEventListener("click", close);
  $("dwClose").addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if(!isOpen()) return;
    if(e.key === "Escape"){ close(); return; }
    if(e.key !== "Tab") return;                                   // jaga fokus tetap di dalam panel
    const f = [...drawer.querySelectorAll("a[href],button")].filter(x => x.offsetParent !== null);
    if(!f.length) return;
    const first = f[0], end = f[f.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); end.focus(); }
    else if(!e.shiftKey && document.activeElement === end){ e.preventDefault(); first.focus(); }
  });
  drawer.addEventListener("click", e => {
    const b = e.target.closest("[data-dw]");
    if(b){ last = null; close(); (b.dataset.dw === "login" ? openAuth : logout)(); return; }
    const a = e.target.closest("a[href]"); if(!a) return;
    const h = a.getAttribute("href");
    if(h === "./#tool-sholat" || h === "./#tool-libur"){ e.preventDefault(); last = null; close(); setTimeout(() => goTool(h.endsWith("libur") ? "libur" : "sholat"), 240); return; }
    last = null; close();
  });

  /* Kotak cari ringkas: muncul di header saat kotak cari besar sudah tergulir keluar layar */
  const top = document.querySelector("header.top"), mainBox = document.querySelector(".hs .search"), hq = $("hq");
  if("IntersectionObserver" in window && mainBox){
    new IntersectionObserver(([en]) => {
      /* v54: "tergulir ke atas" = bagian BAWAH kotak sudah di atas garis batas (bukan top < 0): saat digulir pelan, top masih positif ketika kotak melewati garis, dan kotak cari ringkas tidak pernah muncul */
      const on = !en.isIntersecting && en.boundingClientRect.bottom <= (en.rootBounds ? en.rootBounds.top : 94) + 1;
      top.classList.toggle("compact", on);
      if(on && !hq.value) hq.value = $("q").value;
    }, {rootMargin:"-94px 0px 0px 0px", threshold:0}).observe(mainBox);
  }
  $("hSearch").addEventListener("submit", e => {
    e.preventDefault();
    const v = hq.value.trim(); if(!v) return;
    if(goTool(v)) return;
    window.bunGo ? bunGo("search?q=" + encodeURIComponent(v)) : (location.href = "search?q=" + encodeURIComponent(v));
  });
})();
