/* v38: pemutar Spotify baru dimuat saat tombol ditekan (hemat data, tidak ada cookie pihak ketiga sebelum itu). */
(() => {
  const box = document.querySelector(".musik-p");
  const btn = box && box.querySelector(".musik-go");
  if(!btn) return;
  btn.addEventListener("click", () => {
    let u; try{ u = new URL(box.dataset.src); }catch(e){ return; }
    if(u.hostname !== "open.spotify.com") return;
    const f = document.createElement("iframe");
    f.title = "Playlist Spotify"; f.src = u.href; f.width = "100%"; f.height = "352"; f.loading = "lazy";
    f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    f.style.cssText = "display:block;width:100%;height:352px;border:0";
    box.classList.add("on"); box.replaceChildren(f);
  });
})();
