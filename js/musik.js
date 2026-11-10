/* v44: bila js/player.js ada, tombol membuka dok pemutar yang tidak berhenti saat pindah halaman; bila tidak, iframe lama dipakai.
   v38: pemutar Spotify baru dimuat saat tombol ditekan (hemat data, tidak ada cookie pihak ketiga sebelum itu).
   v43: berlaku untuk semua blok .musik-p (beranda: playlist, Info: artis NewJeans). Judul dari data-title, tinggi dari data-h (bawaan 352). */
(() => {
  document.querySelectorAll(".musik-p").forEach(box => {
    const btn = box.querySelector(".musik-go");
    if(!btn) return;
    btn.addEventListener("click", () => {
      let u; try{ u = new URL(box.dataset.src); }catch(e){ return; }
      const yt = /(^|\.)youtube\.com$/.test(u.hostname);
      if(u.hostname !== "open.spotify.com" && !yt) return;
      if(window.BunPlayer && BunPlayer.open(u.href, box.dataset.title)){                // v44: pemutar dok, tidak berhenti saat pindah halaman
        box.classList.add("on"); box.innerHTML = '<p class="musik-on">Sedang diputar di pemutar kiri bawah. Lagu tetap jalan saat kamu pindah halaman.</p>'; return;
      }
      const h = +box.dataset.h || 352;
      const f = document.createElement("iframe");
      f.title = box.dataset.title || "Pemutar"; f.src = yt ? "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(u.searchParams.get("list") || "") : u.href; f.width = "100%"; f.height = String(h); f.loading = "lazy";
      f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      f.style.cssText = "display:block;width:100%;height:" + h + "px;border:0";
      box.classList.add("on"); box.replaceChildren(f);
    });
  });
})();
