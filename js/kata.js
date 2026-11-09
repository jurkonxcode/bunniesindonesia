/* v30: pemahaman kata kunci pencarian untuk bahasa Indonesia sehari-hari.
   normalizeQuery("kuliah di korsel") -> {groups:[["kuliah"],["korsel","korea selatan","korea"]], flat:[...]}
   Tiap grup = satu kata + padanannya (singkatan, gaul, ejaan lain, kata dasar). Dimuat SEBELUM search.js.
   Tambah singkatan/padanan baru di SLANG saja. */
const STOP = new Set("di ke dari yang dan atau untuk dengan pada ini itu apa bagaimana gimana cara bisa apakah adalah akan sudah udah ada saya aku gue gw kak mau ingin tolong dong sih deh ya kah nih tuh dgn yg utk".split(" "));
const SLANG = {
  bgt:["banget"], tdk:["tidak"], krn:["karena"], jg:["juga"], blm:["belum"], hrs:["harus"], bljr:["belajar"], bsw:["beasiswa"],
  univ:["universitas"], unv:["universitas"], kuliahan:["kuliah"], kul:["kuliah"],
  korsel:["korea selatan","korea"], korut:["korea utara"], kr:["korea"], jp:["jepang"], jepun:["jepang"],
  hangeul:["hangul"], hangul:["hangeul"], gks:["kgsp"], kgsp:["gks"],
  tki:["pekerja migran","pmi"], pmi:["pekerja migran","tki"], kbri:["kedutaan"], kjri:["konsulat"],
  sholat:["salat","shalat"], salat:["sholat","shalat"], shalat:["sholat","salat"], magrib:["maghrib"], maghrib:["magrib"],
  jkt:["jakarta"], bdg:["bandung"], sby:["surabaya"], yk:["yogyakarta","jogja"], jogja:["yogyakarta"],
  hape:["hp","ponsel"], hp:["ponsel","handphone"], duit:["uang"], gaji:["upah"], kerjaan:["kerja","pekerjaan"]
};
const PREF = [["meng",["","k"]],["meny",["s"]],["mem",["","p"]],["men",["","t"]],["me",[""]],["peng",["","k"]],["peny",["s"]],["pem",["","p"]],["pen",["","t"]],["pe",[""]],["ber",[""]],["ter",[""]],["di",[""]],["se",[""]],["ke",[""]]];
const SUFF = ["kan","nya","lah","kah","an"];
function stems(w){                       // kata dasar kasar; hanya dipakai untuk mencocokkan sebagai potongan kata
  const out = new Set();
  if(w.length < 6) return [];
  let base = w;
  for(const s of SUFF){ if(base.endsWith(s) && base.length - s.length >= 4){ base = base.slice(0, -s.length); out.add(base); break; } }
  for(const [p, adds] of PREF){
    if(base.startsWith(p) && base.length - p.length >= 4){
      const rest = base.slice(p.length);
      adds.forEach(a => { if(a && !"aiueo".includes(rest[0])) return; const c = a + rest; if(c.length >= 4) out.add(c); });   // huruf peluluh (k/p/s/t) hanya bila kata dasar berawal vokal
      break;
    }
  }
  out.delete(w);
  return [...out];
}
function normalizeQuery(q){
  const words = String(q || "").toLowerCase().replace(/[,()*\\%_"'’]/g, " ").split(/\s+/).filter(Boolean);
  let use = words.filter(w => !STOP.has(w) && w.length >= 2);
  if(!use.length) use = words.filter(w => w.length >= 3);          // semua kata umum: pakai apa adanya (minimal 3 huruf)
  const groups = [], seen = new Set();
  for(const w of use.slice(0, 5)){
    if(seen.has(w)) continue; seen.add(w);
    const g = [w];
    (SLANG[w] || []).forEach(v => g.push(v));
    stems(w).forEach(v => g.push(v));
    groups.push([...new Set(g)].slice(0, 5));
  }
  return {groups, flat:[...new Set(groups.flat())]};
}
