/* Lokasi (v46): memuat data/lokasi.json (negara, provinsi Indonesia, wilayah dan kota Korea Selatan) dan memberi label.
   Dipakai halaman Akun (formulir profil) dan Profil publik. Mandiri. Hangul (ko) disimpan di data untuk versi bahasa Korea nanti;
   label sekarang memakai nama Indonesia dan, untuk Korea Selatan, Hangul di dalam kurung. */
const Lokasi = (() => {
  let data = null;
  /* v47: alamat data dihitung dari lokasi skrip ini, supaya tetap benar dari en/ dan ko/ */
  const dataUrl = () => { const sc = [...document.scripts].find(x => /js\/lokasi\.js/.test(x.src)); return sc ? sc.src.replace(/js\/lokasi\.js.*$/, "data/lokasi.json") : "data/lokasi.json"; };
  const load = async () => data || (data = await (await fetch(dataUrl())).json());
  const lab = (o, ko) => !o ? "" : (ko && o.ko && o.ko !== o.id ? o.id + " (" + o.ko + ")" : o.id);
  const negara = k => data && data.negara.find(n => n.k === k) || null;
  const wilayah = (n, k) => data && (data.wilayah[n] || []).find(w => w.k === k) || null;
  /* kota Korea disimpan sebagai nama Latin ("Chuncheon"); label menambah Hangul */
  const kotaKr = (w, la) => { const x = w && w.kota.find(c => c[0] === la); return x ? {id:x[0], ko:x[1]} : null; };
  /* Teks lokasi untuk profil publik. l = {negara, wilayah, kota} (sesuai pilihan tampil pemilik). */
  function teks(l){
    if(!l || !l.negara || !data) return "";
    const n = negara(l.negara), w = l.wilayah ? wilayah(l.negara, l.wilayah) : null;
    const kt = l.kota ? (l.negara === "KR" ? lab(kotaKr(w, l.kota) || {id:l.kota}, true) : l.kota) : "";
    return [kt, w ? lab(w, l.negara === "KR") : "", n ? lab(n, l.negara === "KR") : l.negara].filter(Boolean).join(", ");
  }
  return {load, lab, negara, wilayah, kotaKr, teks, get data(){ return data; }};
})();
