/* v19: baca berita di dalam Niflax (dialog layar penuh berisi iframe), tanpa pindah tab.
   Catatan: sebagian situs berita melarang ditampilkan di dalam situs lain (X-Frame-Options / CSP).
   Browser tidak memberi tahu soal ini, jadi bilah atas selalu menyediakan tombol "Buka di tab baru". */
(() => {
  const d = document.createElement("dialog"); d.id = "reader"; d.setAttribute("aria-label", "Baca berita");
  d.innerHTML = `<div class="rd-bar"><button class="btn alt" id="rdClose" type="button">← Kembali</button><div class="rd-t"><b id="rdTitle"></b><span id="rdSrc"></span></div><a class="btn alt" id="rdOpen" target="_blank" rel="noopener noreferrer nofollow">Buka di tab baru ↗</a></div><div class="rd-note">Halaman kosong? Situs sumber melarang tampil di dalam Niflax. Ketuk "Buka di tab baru".</div><iframe id="rdFrame" title="Isi berita" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" loading="lazy"></iframe>`;
  document.body.appendChild(d);
  const f = d.querySelector("#rdFrame"), close = () => { d.close(); f.src = "about:blank"; };
  d.querySelector("#rdClose").addEventListener("click", close);
  d.addEventListener("close", () => { f.src = "about:blank"; });
  document.addEventListener("click", e => {
    const a = e.target.closest("#feed a.fl[href^='http']"); if(!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const card = a.closest("article"), h = card && card.querySelector("h3"), m = card && card.querySelector(".meta");
    d.querySelector("#rdTitle").textContent = h ? h.textContent : "";
    d.querySelector("#rdSrc").textContent = m ? m.textContent : "";
    d.querySelector("#rdOpen").href = a.href;
    f.src = a.href; d.showModal();
  });
})();
