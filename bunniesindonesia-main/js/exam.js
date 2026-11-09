/* v29: panel Ujian bahasa (TOPIK, JLPT). Hanya tanggal yang punya sumber resmi yang boleh masuk EXAMS.
   Tambah baris: {n:"nama", d:"YYYY-MM-DD", note:"catatan", url:"halaman resmi", cek:"tanggal dicek"}. Urut menaik tidak wajib.
   Tanggal lewat otomatis disembunyikan. Jangan isi dari blog pihak ketiga: cek topik.go.kr, jlpt.jp, hrdkorea.or.kr. */
(() => {
  const EXAMS = [
    {n:"TOPIK ke-110", d:"2027-01-10", note:"Di Korea saja. Cek tanggal pendaftaran di situs resmi.", url:"https://www.topik.go.kr", cek:"9 Nov 2026"}
  ];
  const LINKS = [["TOPIK (bahasa Korea)","https://www.topik.go.kr"],["JLPT (bahasa Jepang)","https://www.jlpt.jp"],["EPS Korea (HRD Korea)","https://www.hrdkorea.or.kr"]];
  const el = document.getElementById("ex"); if(!el) return;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const safe = u => /^https:\/\//.test(u) ? u : "#";
  const now = new Date(); now.setHours(0,0,0,0);
  const rows = EXAMS.map(e => ({...e, t:new Date(e.d + "T00:00:00")})).filter(e => e.t >= now).sort((a,b) => a.t - b.t).map(e => {
    const days = Math.round((e.t - now) / 864e5);
    return `<div class="exr"><b>${esc(e.n)}</b><span>${e.t.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})} · <em>${days === 0 ? "hari ini" : days + " hari lagi"}</em></span><small>${esc(e.note || "")} Dicek ${esc(e.cek || "-")}. <a href="${safe(e.url)}" target="_blank" rel="noopener">Sumber resmi</a></small></div>`;
  }).join("");
  el.innerHTML = `<div class="sh"><h2>Ujian bahasa</h2><small>TOPIK dan JLPT</small></div>${rows || '<p class="mnote">Belum ada jadwal yang terverifikasi. Cek situs resmi di bawah.</p>'}<div class="exl">${LINKS.map(([n,u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)} ›</a>`).join("")}</div><p class="src">Jadwal dan biaya bisa berubah. Selalu cek situs resmi sebelum mendaftar.</p>`;
})();
