/* v27 (dirombak v54): sistem navigasi bersama. Baris atas (logo + kotak cari + bahasa + akun) selalu menempel; baris tab di HP
   menyelinap ke balik baris atas saat menggulir ke bawah dan turun lagi saat menggulir ke atas (kelas hide2); tombol TOP di beranda.
   Gaya ada di css/navbar.css. Halaman dalam (header.sbar) otomatis mendapat kotak cari di baris atas (kecuali search.html).
   Berdiri sendiri: tidak butuh variabel global file lain. Dipasang SINKRON di dalam <header> (script terakhir di dalam header),
   jadi bilah tab sudah ada sebelum halaman digambar (tanpa lompatan tata letak). Dipakai index.html, blog, tanya, search, akun. */
(() => {
  const host = document.currentScript && document.currentScript.parentElement;
  if(!host || host.querySelector(".snav")) return;
  const isTop = host.classList.contains("top");                       // beranda memakai header.top, halaman dalam memakai header.sbar

  /* [nama, tujuan, kunci aktif]. Kunci: "home" | nama halaman | "cat:Nama". */
  const TABS = [
    ["Beranda", "./", "home"], ["Member", "member", "member"], ["Info", "info", "info"], ["Tanya Jawab", "tanya", "tanya"], ["Blog", "blog", "blog"], ["Chart", "chart", "chart"]
  ];
  const page = (location.pathname.split("/").pop() || "").replace(/\.html$/, "") || "home";
  const key0 = page === "index" ? "home" : page;
  const cat = new URLSearchParams(location.search).get("cat");
  const activeKey = (key0 === "blog" && cat && TABS.some(t => t[2] === "cat:" + cat)) ? "cat:" + cat : key0;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const nav = document.createElement("nav");
  nav.className = "snav"; nav.id = "snav"; nav.setAttribute("aria-label", "Navigasi utama");
  nav.innerHTML =
    `<div class="snw"><div class="snl">` +
    TABS.map(t => `<a href="${t[1]}"${t[2] === activeKey ? ' aria-current="page"' : ""}>${esc(t[0])}</a>`).join("") +
    `</div><a class="sall" href="layanan" aria-label="Semua layanan"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg><span>Semua layanan</span></a></div>`;
  host.appendChild(nav);
  /* v52: tombol bahasa kini dipasang oleh js/lang.js (pilihan Indonesia / English / 한국어), dimuat tepat sesudah nav.js. */


  /* v54: teks logo dibungkus <span> supaya bisa menyusut halus (beranda menulisnya sebagai teks polos) */
  const logo = host.querySelector(".logo");
  if(logo && !logo.querySelector("span")){
    [...logo.childNodes].forEach(n => {
      if(n.nodeType === 3 && n.textContent.trim()){ const sp = document.createElement("span"); sp.textContent = n.textContent.trim(); n.replaceWith(sp); }
    });
  }

  /* v54: halaman dalam mendapat kotak cari di baris atas (GET ke halaman cari). Di HP tampil sebagai tombol ikon. */
  if(!isTop && host.classList.contains("sbar") && page !== "search" && logo && !host.querySelector(".hsearch, #sform")){
    const mark = logo.querySelector("img"), f = document.createElement("form");
    f.className = "hsearch hs-inner"; f.setAttribute("role", "search"); f.action = "search"; f.method = "get";
    f.innerHTML = (mark ? `<img src="${esc(mark.getAttribute("src"))}" alt="" width="22" height="22">` : "") +
      `<input name="q" type="search" placeholder="Cari di Bunnies…" autocomplete="off" maxlength="100" aria-label="Cari">` +
      `<button type="submit" aria-label="Cari"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg></button>`;
    f.addEventListener("submit", e => { if(!f.q.value.trim()){ e.preventDefault(); location.href = "search"; } });
    logo.after(f);
    host.classList.add("compact");
  }

  /* v54: placeholder kotak cari ringkas dipendekkan di layar sempit */
  const hq = host.querySelector(".hsearch input");
  if(hq){
    const long = hq.getAttribute("placeholder") || "", narrow = matchMedia("(max-width:520px)");
    const fit = () => { hq.setAttribute("placeholder", narrow.matches ? "Cari…" : long); };
    fit(); narrow.addEventListener ? narrow.addEventListener("change", fit) : narrow.addListener(fit);
  }

  const list = nav.querySelector(".snl"), cur = list.querySelector("[aria-current]");
  /* bayangan tepi: tampil hanya bila masih ada tab yang tersembunyi di sisi itu */
  const edges = () => {
    nav.classList.toggle("fl", list.scrollLeft > 4);
    nav.classList.toggle("fr", list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
  };
  list.addEventListener("scroll", edges, {passive:true});
  addEventListener("resize", edges);
  if(cur) list.scrollLeft = Math.max(0, cur.offsetLeft - (list.clientWidth - cur.offsetWidth) / 2);   // tab aktif di tengah, tanpa menggulir halaman
  edges(); requestAnimationFrame(edges);

  /* "Semua layanan": di beranda membuka panel menu yang sudah ada; di halaman lain ke halaman Semua layanan */
  nav.querySelector(".sall").addEventListener("click", e => {
    const b = document.querySelector(".top .burger");
    if(!b || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); b.click();
  });

  /* Catat kata kunci terakhir (dipakai dropdown cari di beranda): hanya dari halaman hasil pencarian */
  if(page === "search"){
    const q = (new URLSearchParams(location.search).get("q") || "").trim().slice(0, 100);
    if(q){
      try{
        const r = JSON.parse(localStorage.getItem("bunnies.recent")); const a = Array.isArray(r) ? r : [];
        localStorage.setItem("bunnies.recent", JSON.stringify([q, ...a.filter(x => x !== q)].slice(0, 8)));
      }catch(e){}
    }
  }

  /* v54: perilaku gulir. stuck = bayangan tipis saat halaman sudah bergeser; hide2 = baris tab menyelinap (hanya HP/tablet).
     Baris atas TIDAK ikut bersembunyi, jadi kotak cari dan logo tetap di atas. Tinggi header tidak berubah, jadi tidak ada lompatan. */
  const desk = matchMedia("(min-width:1000px)");
  let lastY = scrollY, tick = false, totop = null;
  const typing = () => host.contains(document.activeElement) && document.activeElement.matches("input");
  const onScroll = () => {
    tick = false;
    const y = Math.max(0, scrollY), d = y - lastY;
    host.classList.toggle("stuck", y > 4);
    if(desk.matches || y < 80 || typing()) host.classList.remove("hide2");
    else if(d > 8) host.classList.add("hide2");
    else if(d < -8) host.classList.remove("hide2");
    if(Math.abs(d) > 8 || y < 80) lastY = y;
    if(totop) totop.classList.toggle("on", y > 520);
  };
  addEventListener("scroll", () => { if(!tick){ tick = true; requestAnimationFrame(onScroll); } }, {passive:true});
  host.addEventListener("focusin", e => { if(e.target.matches("input")) host.classList.remove("hide2"); });
  desk.addEventListener ? desk.addEventListener("change", onScroll) : desk.addListener(onScroll);
  onScroll();

  if(!isTop) return;

  /* Tombol TOP (beranda) */
  totop = document.createElement("button");
  totop.type = "button"; totop.className = "totop"; totop.setAttribute("aria-label", "Ke atas");
  totop.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg><span>TOP</span>`;
  totop.addEventListener("click", () => scrollTo({top:0, behavior:matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth"}));
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(totop));
  if(document.readyState !== "loading") document.body.appendChild(totop);
  onScroll();
})();
