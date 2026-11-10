/* Pilih lagu (v48): daftar video NewJeans dari data/youtube.json di blok "Putar lagu".
   Klik Putar -> BunPlayer.playVideo(id, judul) (js/player.js). Bahasa dari <html lang> (id | en | ko). */
(() => {
  const LANG = (document.documentElement.lang || "id").slice(0, 2);
  const L = {
    id: {judul:"Pilih lagu", sub:"Pilih satu lagu, lalu dengarkan di pemutar.", putar:"Putar", semua:"Tampilkan semua", kurang:"Tampilkan lebih sedikit", kosong:"Daftar lagu belum tersedia.", jenis:{mv:"MV", perf:"Performance", dance:"Dance practice"}},
    en: {judul:"Pick a song", sub:"Choose one song and listen in the player.", putar:"Play", semua:"Show all", kurang:"Show fewer", kosong:"Song list is not available yet.", jenis:{mv:"MV", perf:"Performance", dance:"Dance practice"}},
    ko: {judul:"곡 고르기", sub:"곡 하나를 골라 플레이어에서 들어 보세요.", putar:"재생", semua:"모두 보기", kurang:"적게 보기", kosong:"곡 목록이 아직 없어요.", jenis:{mv:"MV", perf:"퍼포먼스", dance:"댄스 연습"}}
  }[LANG] || null;
  const host = document.getElementById("pick");
  if(!host || !L) return;
  const sc = [...document.scripts].find(x => /js\/pilih-lagu\.js/.test(x.src));
  const url = sc ? sc.src.replace(/js\/pilih-lagu\.js.*$/, "data/youtube.json") : "data/youtube.json";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const BATAS = 12;
  let semua = false, daftar = [];

  function paint(){
    const lihat = semua ? daftar : daftar.slice(0, BATAS);
    host.innerHTML = `<div class="pick-h"><b>${esc(L.judul)}</b><small>${esc(L.sub)}</small></div>` +
      `<ul class="pick-l">` + lihat.map(v => `<li class="pick-i"><span class="pick-t"><b>${esc(v.lagu)}</b><small>${esc(v.label)} · ${esc(L.jenis[v.jenis] || v.jenis)}</small></span>` +
        `<button type="button" class="pick-b" data-vid="${esc(v.id)}" data-judul="${esc(v.lagu + " · " + v.label)}">${esc(L.putar)}</button></li>`).join("") +
      `</ul>` + (daftar.length > BATAS ? `<button type="button" class="pick-more" id="pickMore">${esc(semua ? L.kurang : L.semua)}</button>` : "");
  }

  host.addEventListener("click", e => {
    const more = e.target.closest("#pickMore");
    if(more){ semua = !semua; paint(); return; }
    const b = e.target.closest(".pick-b"); if(!b) return;
    if(window.BunPlayer && BunPlayer.playVideo) BunPlayer.playVideo(b.dataset.vid, b.dataset.judul);
  });

  fetch(url).then(r => r.json()).then(j => {
    daftar = (j.video || []).slice().sort((a, b) => (b.views || 0) - (a.views || 0));
    if(!daftar.length){ host.innerHTML = `<p class="pick-kosong">${esc(L.kosong)}</p>`; return; }
    paint();
  }).catch(() => { host.innerHTML = `<p class="pick-kosong">${esc(L.kosong)}</p>`; });
})();
