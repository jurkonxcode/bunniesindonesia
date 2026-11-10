/* v38: pemutar Spotify baru dimuat saat tombol ditekan (hemat data, tidak ada cookie pihak ketiga sebelum itu).
   v43: berlaku untuk semua blok .musik-p (beranda: playlist, Info: artis NewJeans). Judul dari data-title, tinggi dari data-h (bawaan 352). */
(() => {
  document.querySelectorAll(".musik-p").forEach(box => {
    const btn = box.querySelector(".musik-go");
    if(!btn) return;
    btn.addEventListener("click", () => {
      let u; try{ u = new URL(box.dataset.src); }catch(e){ return; }
      if(u.hostname !== "open.spotify.com") return;
      const h = +box.dataset.h || 352;
      const f = document.createElement("iframe");
      f.title = box.dataset.title || "Pemutar Spotify"; f.src = u.href; f.width = "100%"; f.height = String(h); f.loading = "lazy";
      f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      f.style.cssText = "display:block;width:100%;height:" + h + "px;border:0";
      box.classList.add("on"); box.replaceChildren(f);
    });
  });
})();
