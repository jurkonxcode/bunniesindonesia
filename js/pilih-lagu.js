/* Pilih lagu (v48): daftar video NewJeans dari data/youtube.json di blok "Putar lagu".
   Klik Putar -> BunPlayer.playVideo(id, judul) (js/player.js). Bahasa dari <html lang> (id | en | ko). */
(() => {
  const LANG = (document.documentElement.lang || "id").slice(0, 2);
  const L = {
    id: {judul:"Pilih lagu", sub:"Pilih satu lagu, lalu dengarkan di pemutar.", putar:"Putar", cari:"Cari lagu…", versi:"versi", tidak:"Lagu tidak ditemukan.", semua:"Tampilkan semua", kurang:"Tampilkan lebih sedikit", kosong:"Daftar lagu belum tersedia.", jenis:{mv:"MV", perf:"Performance", dance:"Dance practice"}},
    en: {judul:"Pick a song", sub:"Choose one song and listen in the player.", putar:"Play", cari:"Search songs…", versi:"versions", tidak:"No songs found.", semua:"Show all", kurang:"Show fewer", kosong:"Song list is not available yet.", jenis:{mv:"MV", perf:"Performance", dance:"Dance practice"}},
    ko: {judul:"곡 고르기", sub:"곡 하나를 골라 플레이어에서 들어 보세요.", putar:"재생", cari:"곡 검색…", versi:"버전", tidak:"곡을 찾을 수 없어요.", semua:"모두 보기", kurang:"적게 보기", kosong:"곡 목록이 아직 없어요.", jenis:{mv:"MV", perf:"퍼포먼스", dance:"댄스 연습"}}
  }[LANG] || null;
  const host = document.getElementById("pick");
  if(!host || !L) return;
  const sc = [...document.scripts].find(x => /js\/pilih-lagu\.js/.test(x.src));
  const url = sc ? sc.src.replace(/js\/pilih-lagu\.js.*$/, "data/youtube.json") : "data/youtube.json";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const BATAS = 8;
  let semua = false, kata = "", grup = [];

  const norm = t => String(t).toLowerCase().replace(/\s+/g, " ").trim();
  const nama = (v, i, arr) => {
    const jenis = L.jenis[v.jenis] || v.jenis;
    const sama = arr.filter(x => x.jenis === v.jenis);
    return sama.length > 1 ? jenis + " " + (sama.indexOf(v) + 1) : jenis;
  };

  /* satu baris per lagu: versi terpopuler diputar lewat tombol utama, versi lain lewat chip */
  function baris(g){
    const top = g.v[0];
    const chip = g.v.length > 1
      ? `<div class="pick-v" role="group" aria-label="${esc(g.lagu)}">` + g.v.map((v, i, a) =>
          `<button type="button" class="pick-c" data-vid="${esc(v.id)}" data-judul="${esc(g.lagu + " · " + (v.label || ""))}">${esc(nama(v, i, a))}</button>`).join("") + `</div>`
      : "";
    return `<li class="pick-i"><div class="pick-r"><span class="pick-t"><b>${esc(g.lagu)}</b><small>${esc(top.label || "")}${g.v.length > 1 ? " · " + g.v.length + " " + esc(L.versi) : ""}</small></span>` +
      `<button type="button" class="pick-b" data-vid="${esc(top.id)}" data-judul="${esc(g.lagu + " · " + (top.label || ""))}" aria-label="${esc(L.putar + " " + g.lagu)}">${esc(L.putar)}</button></div>${chip}</li>`;
  }

  function paint(){
    const cocok = kata ? grup.filter(g => norm(g.lagu).includes(kata)) : grup;
    const lihat = (semua || kata) ? cocok : cocok.slice(0, BATAS);
    const q = host.querySelector(".pick-q");
    const fokus = q && document.activeElement === q;
    host.innerHTML = `<div class="pick-h"><b>${esc(L.judul)}</b><small>${esc(L.sub)}</small></div>` +
      `<input class="pick-q" type="search" placeholder="${esc(L.cari)}" aria-label="${esc(L.cari)}" value="${esc(kata)}" autocomplete="off">` +
      (lihat.length ? `<ul class="pick-l">` + lihat.map(baris).join("") + `</ul>` : `<p class="pick-kosong">${esc(L.tidak)}</p>`) +
      (!kata && cocok.length > BATAS ? `<button type="button" class="pick-more" id="pickMore">${esc(semua ? L.kurang : L.semua + " (" + cocok.length + ")")}</button>` : "");
    if(fokus){ const n = host.querySelector(".pick-q"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
  }

  host.addEventListener("input", e => {
    if(!e.target.classList.contains("pick-q")) return;
    kata = norm(e.target.value); paint();
  });

  host.addEventListener("click", e => {
    const more = e.target.closest("#pickMore");
    if(more){ semua = !semua; paint(); return; }
    const b = e.target.closest(".pick-b, .pick-c"); if(!b) return;
    if(window.BunPlayer && BunPlayer.playVideo) BunPlayer.playVideo(b.dataset.vid, b.dataset.judul);
    host.querySelectorAll(".on").forEach(x => x.classList.remove("on"));
    b.classList.add("on"); b.closest(".pick-i").classList.add("on");
  });

  fetch(url).then(r => r.json()).then(j => {
    const peta = new Map();
    (j.video || []).forEach(v => {
      const k = norm(v.lagu);
      if(!peta.has(k)) peta.set(k, {lagu: v.lagu, total: 0, v: []});
      const g = peta.get(k); g.total += v.views || 0; g.v.push(v);
    });
    peta.forEach(g => g.v.sort((a, b) => (b.views || 0) - (a.views || 0)));
    grup = [...peta.values()].sort((a, b) => b.total - a.total);
    if(!grup.length){ host.innerHTML = `<p class="pick-kosong">${esc(L.kosong)}</p>`; return; }
    paint();
  }).catch(() => { host.innerHTML = `<p class="pick-kosong">${esc(L.kosong)}</p>`; });
})();
