/* v47: slideshow otomatis di belakang judul beranda.
   Sumber: data/galeri.json, hanya foto dengan izin "ada" + kredit + sumber terisi (aturan yang sama dengan Galeri).
   Tidak ada foto berizin = tidak ada slideshow (tampilan lama tetap). Tidak memakai foto dari situs resmi mana pun tanpa izin tertulis. */
(() => {
  const w = document.querySelector(".wedge");
  if(!w) return;
  fetch("data/galeri.json", {cache:"no-cache"}).then(r => r.ok ? r.json() : Promise.reject()).then(j => {
    const L = (j.foto || []).filter(x => x && x.izin === "ada" && x.file && x.kredit && x.sumber).slice(0, 8);
    if(!L.length) return;
    const box = document.createElement("div"); box.className = "hslide"; box.setAttribute("aria-hidden", "true");
    L.forEach((x, i) => {
      const im = new Image(); im.alt = ""; im.decoding = "async"; if(i) im.loading = "lazy";
      im.src = "assets/galeri/" + x.file; if(!i) im.className = "on"; box.appendChild(im);
    });
    const cr = document.createElement("a"); cr.className = "hcredit"; cr.href = "galeri";
    const nama = i => "Foto: " + L[i].kredit + (L[i].lisensi ? " · " + L[i].lisensi.toUpperCase().replace(/-/g, " ") : "");
    cr.textContent = nama(0);
    w.insertBefore(box, w.firstChild); w.appendChild(cr); w.classList.add("has-slide");
    if(L.length < 2 || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const imgs = box.children; let i = 0;
    setInterval(() => {
      if(document.hidden) return;
      imgs[i].classList.remove("on"); i = (i + 1) % L.length; imgs[i].classList.add("on"); cr.textContent = nama(i);
    }, 5500);
  }).catch(() => {});
})();
