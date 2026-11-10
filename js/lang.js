/* v52: pemilih bahasa (Indonesia / English / 한국어) di baris atas semua halaman.
   Dipasang SINKRON sebagai script terakhir di dalam <header> (atau .pg-top), sesudah nav.js, supaya tidak ada lompatan tata letak.
   Bahasa saat ini dibaca dari <html lang>. Halaman yang punya padanan di tiga bahasa (PAGES) berpindah ke halaman yang sama
   (query dan hash ikut dibawa); halaman lain (blog, tanya, akun, ...) hanya ada dalam bahasa Indonesia, jadi bahasa lain menuju beranda.
   Tanpa JavaScript, tautan .slang statis di HTML tetap bekerja. */
(() => {
  const host = document.currentScript && document.currentScript.parentElement;
  if(!host || host.querySelector(".lsw")) return;
  const LANGS = [["id", "Indonesia", "ID"], ["en", "English", "EN"], ["ko", "한국어", "KO"]];
  const PAGES = ["member", "tentang", "info", "galeri", "kabar", "chart", "privasi", "syarat", "hak-cipta"];
  /* v55: bahasa dan alamat dihitung dari URL (bukan dari <html lang>), dan tautan memakai alamat mutlak.
     Dulu, sesudah berpindah halus (tanpa muat ulang) <html lang> masih bahasa lama, sehingga tombol salah label
     dan tautannya menjadi /en/ko/ (404). */
  const parts = location.pathname.split("/"), last = parts[parts.length - 1], seg = parts[parts.length - 2];
  const lang = (seg === "en" || seg === "ko") ? seg : "id";
  const base = parts.slice(0, lang === "id" ? -1 : -2).join("/") + "/";
  const page = last.replace(/\.html$/, "") || "home";
  const name = page === "index" ? "home" : page;
  const known = PAGES.indexOf(name) >= 0;
  const url = code => base + (code === "id" ? "" : code + "/") + (known ? name : "") + location.search + location.hash;
  const LABEL = {id: "Pilih bahasa", en: "Choose language", ko: "언어 선택"}[lang];
  const row = host.querySelector(".kw, .swrap, .wrap");
  if(!row) return;

  const box = document.createElement("div");
  box.className = "lsw";
  const now = LANGS.find(l => l[0] === lang);
  box.innerHTML =
    `<button class="slang" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${LABEL}" title="${LABEL}">${now[2]}</button>` +
    `<ul class="lmenu" role="menu" hidden>` +
    LANGS.map(l => `<li role="none"><a role="menuitem" href="${url(l[0])}" lang="${l[0]}" hreflang="${l[0]}"${l[0] === lang ? ' aria-current="true"' : ""}>${l[1]}</a></li>`).join("") +
    `</ul>`;

  /* ganti tombol statis lama (.slang) bila ada; kalau tidak, taruh sebelum area aksi/pencarian atau tautan kembali */
  const old = row.querySelector(".slang");
  if(old) old.replaceWith(box);
  else {
    const before = row.querySelector(".actions, .hsrch, .hbar") || (host.classList.contains("pg-top") ? row.querySelector(".logo + a") : null);
    row.insertBefore(box, before);
  }

  const btn = box.querySelector("button"), menu = box.querySelector(".lmenu");
  const set = on => { menu.hidden = !on; btn.setAttribute("aria-expanded", String(on)); };
  btn.addEventListener("click", e => { e.stopPropagation(); if(menu.hidden) menu.querySelectorAll("a").forEach(a => a.setAttribute("href", url(a.hreflang))); set(menu.hidden); });
  document.addEventListener("click", e => { if(!box.contains(e.target)) set(false); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !menu.hidden){ set(false); btn.focus(); } });
  menu.addEventListener("click", e => {
    const a = e.target.closest("a");
    if(a) try{ localStorage.setItem("bunnies.lang", a.hreflang); }catch(err){}
  });
})();
