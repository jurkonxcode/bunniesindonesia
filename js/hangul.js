/* v48: teks berisi Hangul otomatis diberi lang="ko" (berlaku juga untuk tulisan, komentar, dan pencarian pengguna).
   Efeknya: mesin render memilih glyph Korea yang tepat dan baris dipenggal per kata (lihat :lang(ko) di css/modern.css). */
(() => {
  const H = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
  const SEL = "p,h1,h2,h3,h4,li,a,span,small,b,strong,em,dd,dt,button,td,th,figcaption,label,summary";
  const tag = root => {
    if(!root || !root.querySelectorAll) return;
    const list = root.matches && root.matches(SEL) ? [root, ...root.querySelectorAll(SEL)] : root.querySelectorAll(SEL);
    list.forEach(el => { if(!el.hasAttribute("lang") && el.children.length === 0 && H.test(el.textContent)) el.setAttribute("lang", "ko"); });
  };
  let pend = false;
  const run = () => { pend = false; tag(document.body); };
  new MutationObserver(() => { if(!pend){ pend = true; requestAnimationFrame(run); } }).observe(document.documentElement, {childList:true, subtree:true});
  addEventListener("DOMContentLoaded", run); if(document.readyState !== "loading") run();
})();
