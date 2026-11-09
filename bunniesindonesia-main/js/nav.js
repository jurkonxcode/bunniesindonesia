/* v27: sistem navigasi bersama (pola Naver: bilah tab menempel, bilah atas yang ikut muncul/hilang saat digulir, tombol TOP).
   Berdiri sendiri: tidak butuh variabel global file lain. Dipasang SINKRON di dalam <header> (script terakhir di dalam header),
   jadi bilah tab sudah ada sebelum halaman digambar (tanpa lompatan tata letak). Dipakai index.html, blog, tanya, search, akun. */
(() => {
  const host = document.currentScript && document.currentScript.parentElement;
  if(!host || host.querySelector(".snav")) return;
  const isTop = host.classList.contains("top");                       // beranda memakai header.top, halaman dalam memakai header.sbar

  /* [nama, tujuan, kunci aktif]. Kunci: "home" | nama halaman | "cat:Nama". */
  const TABS = [
    ["Beranda", "./", "home"], ["Member", "member", "member"], ["Tanya Jawab", "tanya", "tanya"], ["Blog", "blog", "blog"]
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

  if(!isTop) return;

  /* Bilah atas hilang saat menggulir ke bawah dan muncul lagi saat menggulir ke atas (HP/tablet). Bilah tab tetap menempel. */
  const mobile = matchMedia("(max-width:999px)");
  let lastY = scrollY, tick = false;
  const onScroll = () => {
    tick = false;
    const y = scrollY, d = y - lastY;
    if(!mobile.matches || y < 80 || host.contains(document.activeElement) && document.activeElement.matches("input")) host.classList.remove("hide1");
    else if(d > 6) host.classList.add("hide1");
    else if(d < -6) host.classList.remove("hide1");
    if(Math.abs(d) > 6 || y < 80) lastY = y;
    totop.classList.toggle("on", y > 520);
  };

  /* Tombol TOP */
  const totop = document.createElement("button");
  totop.type = "button"; totop.className = "totop"; totop.setAttribute("aria-label", "Ke atas");
  totop.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg><span>TOP</span>`;
  totop.addEventListener("click", () => scrollTo({top:0, behavior:matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth"}));
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(totop));
  if(document.readyState !== "loading") document.body.appendChild(totop);
  addEventListener("scroll", () => { if(!tick){ tick = true; requestAnimationFrame(onScroll); } }, {passive:true});
  host.addEventListener("focusin", e => { if(e.target.matches("input")) host.classList.remove("hide1"); });
})();
