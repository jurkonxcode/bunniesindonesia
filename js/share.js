/* v30: tombol Bagikan (WhatsApp, Salin tautan, menu bagikan bawaan HP). Dimuat setelah state.js (butuh esc). */
function shareBar(title){
  const url = location.href.split("#")[0], t = String(title || "Niflax").slice(0, 120);
  const wa = "https://wa.me/?text=" + encodeURIComponent(t + "\n" + url);
  return `<div class="share" data-t="${esc(t)}" data-u="${esc(url)}"><span>Bagikan</span><a class="sb wa" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><button class="sb" type="button" data-copy>Salin tautan</button>${navigator.share ? `<button class="sb" type="button" data-native>Lainnya</button>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest(".share [data-copy], .share [data-native]"); if(!b) return;
  const box = b.closest(".share"), url = box.dataset.u, title = box.dataset.t;
  if(b.hasAttribute("data-native")){ try{ await navigator.share({title, url}); }catch(err){} return; }
  let ok = false;
  try{ await navigator.clipboard.writeText(url); ok = true; }catch(err){
    const ta = document.createElement("textarea"); ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    try{ ok = document.execCommand("copy"); }catch(e2){} ta.remove();
  }
  const old = b.textContent; b.textContent = ok ? "Tersalin" : "Gagal menyalin"; setTimeout(() => { b.textContent = old; }, 1800);
});
