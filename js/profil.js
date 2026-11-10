/* Profil Bunnies (v46): formulir di halaman Akun. Butuh sesi.js (session, rpc), state.js ($, esc), lokasi.js.
   Server: supabase/v46-profil-username.sql (my_profile, save_profile, cek_username).
   Username tampil publik sebagai @njz_<username>; awalan tidak disimpan. Semua kolom bisa diperbarui kapan saja. */
const Profil = (() => {
  let me = null, cekT = 0, cekN = 0;
  const g = id => document.getElementById(id);
  const say = (t, err) => { const m = g("pfMsg"); m.className = "msg" + (err ? " err" : ""); m.textContent = T(t); };
  const clean = v => String(v || "").toLowerCase().replace(/^@/, "").replace(/^njz_/, "").replace(/[^a-z0-9_]/g, "").slice(0, 20);
  const OKFMT = /^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/;

  /* ---------- username ---------- */
  function stat(t, kind){ const m = g("pfUserMsg"); m.textContent = T(t); m.className = "pf-st" + (kind ? " " + kind : ""); }
  async function cek(){
    const v = clean(g("pfUser").value), n = ++cekN;
    if(!v){ stat("Isi username.", "err"); return; }
    if(me && v === me.username){ stat("Ini username-mu sekarang.", "ok"); return; }
    if(!OKFMT.test(v)){ stat("Belum sesuai: 3 sampai 20 karakter, huruf kecil, angka, atau _.", "err"); return; }
    stat("Memeriksa…");
    try{
      const r = await rpc("cek_username", {p:v}); if(n !== cekN) return;
      stat(r.ok ? "Tersedia." : r.alasan === "dipakai" ? "Sudah dipakai orang lain." : r.alasan === "dicadangkan" ? "Username itu dicadangkan." : "Format belum sesuai.", r.ok ? "ok" : "err");
    }catch(e){ if(n === cekN) stat("", ""); }
  }
  function onUser(){
    const el = g("pfUser"), c = clean(el.value); if(el.value !== c) el.value = c;
    clearTimeout(cekT); cekT = setTimeout(cek, 350);
  }

  /* ---------- lokasi ---------- */
  const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(T(t))}</option>`;
  function paintNegara(sel){
    g("pfNeg").innerHTML = opt("", "— pilih —", !sel) + Lokasi.data.negara.map(n => opt(n.k, Lokasi.lab(n, n.k === "KR"), n.k === sel)).join("");
  }
  function paintWilayah(neg, sel){
    const list = Lokasi.data.wilayah[neg], box = g("pfWilWrap");
    box.hidden = !list;
    if(!list) { g("pfWil").innerHTML = ""; return; }
    g("pfWilL").textContent = neg === "KR" ? T("Provinsi / kota besar (시·도)") : T("Provinsi");
    g("pfWil").innerHTML = opt("", "— pilih —", !sel) + list.map(w => opt(w.k, Lokasi.lab(w, neg === "KR"), w.k === sel)).join("");
  }
  function paintKota(neg, wil, sel){
    const kr = neg === "KR", s = g("pfKotaSel"), t = g("pfKotaIn");
    g("pfKotaWrap").hidden = !neg;
    g("pfKotaL").textContent = kr ? T("Kota / distrik (시·군·구)") : T("Kota / kabupaten");
    s.hidden = !kr; t.hidden = kr;
    if(kr){
      const w = Lokasi.wilayah("KR", wil), list = w ? w.kota : [];
      let h = opt("", wil ? "— pilih —" : "Pilih provinsi dulu", !sel);
      h += list.map(c => opt(c[0], c[0] + " (" + c[1] + ")", c[0] === sel)).join("");
      if(sel && !list.some(c => c[0] === sel)) h += opt(sel, sel, true);
      s.innerHTML = h; s.disabled = !wil;
    }else t.value = sel || "";
  }
  function paintTampil(){
    const ada = !!g("pfNeg").value; g("pfTampil").disabled = !ada;
    if(!ada) g("pfTampil").value = "sembunyi";
  }
  const kotaVal = () => g("pfNeg").value === "KR" ? g("pfKotaSel").value : g("pfKotaIn").value;

  /* ---------- kartu profil di atas (v47) ---------- */
  const SOSIAL = [["instagram","Instagram"],["x","X"],["tiktok","TikTok"],["youtube","YouTube"],["weverse","Weverse"],["spotify","Spotify"]];
  const SOC_IN = {instagram:"sIg", x:"sX", tiktok:"sTt", youtube:"sYt", weverse:"sWv", spotify:"sSp"};
  const LOCALE = () => ({en:"en-US", ko:"ko-KR"}[document.documentElement.lang] || "id-ID");
  function paintHero(p){
    const nama = p.display_name || p.username || "";
    g("heroName").textContent = nama || T("Akun saya");
    g("heroAv").textContent = (nama || "B").trim().charAt(0).toUpperCase();
    g("heroBio").textContent = p.bio || "";
    g("heroBias").innerHTML = biasChip(p.bias);
    g("heroJoin").textContent = p.bergabung ? T("Bergabung") + " " + new Date(p.bergabung).toLocaleDateString(LOCALE(), {day:"numeric", month:"long", year:"numeric"}) : "";
    g("statPosts").textContent = p.tulisan || 0;
    g("statComments").textContent = p.komentar || 0;
    const s = p.socials || {};
    const links = SOSIAL.filter(([k]) => s[k]).map(([k, l]) => `<a href="${esc(s[k])}" target="_blank" rel="noopener nofollow">${esc(l)}</a>`);
    g("heroSocial").innerHTML = links.length ? links.join("") : `<span class="none">${esc(T("Belum ada sosial media."))}</span>`;
  }
  function setSoc(s){ SOSIAL.forEach(([k]) => { g(SOC_IN[k]).value = (s && s[k]) || ""; }); }

  /* ---------- isi dan simpan ---------- */
  function fill(p){
    me = p;
    g("pfHandle").textContent = p.handle;
    paintHero(p); setSoc(p.socials);
    g("pfUser").value = p.username; stat("Ini username-mu sekarang.", "ok");
    g("pfBio").value = p.bio || ""; cnt();
    g("pfSejak").value = p.bunnies_sejak || ""; g("pfLagu").value = p.lagu_favorit || "";
    paintNegara(p.negara || ""); paintWilayah(p.negara || "", p.wilayah || ""); paintKota(p.negara || "", p.wilayah || "", p.kota || "");
    g("pfTampil").value = p.lokasi_tampil || "sembunyi"; paintTampil();
    g("pfLink").href = "profil?u=" + encodeURIComponent(p.username);
    g("onbBox").hidden = !!p.profil_lengkap;
    g("onbHandle").textContent = p.handle;
  }
  function cnt(){ g("pfCnt").textContent = g("pfBio").value.length + "/160"; }
  async function save(e){
    e.preventDefault();
    const btn = g("pfForm").querySelector("button.green"); btn.disabled = true; say("Menyimpan…");
    const neg = g("pfNeg").value;
    try{
      const p = await rpc("save_profile", {p:{
        username: clean(g("pfUser").value), bio: g("pfBio").value, bunnies_sejak: g("pfSejak").value.trim(),
        lagu_favorit: g("pfLagu").value, negara: neg, wilayah: g("pfWilWrap").hidden ? "" : g("pfWil").value,
        kota: neg ? kotaVal() : "", lokasi_tampil: g("pfTampil").value
      }});
      fill(p); say("Profil tersimpan.");
    }catch(err){ say(err.message, true); }
    btn.disabled = false;
  }

  async function init(){
    const box = g("pfBox"); if(!box) return;
    try{
      const [, p] = await Promise.all([Lokasi.load(), rpc("my_profile")]);
      fill(p);
      if(new URLSearchParams(location.search).get("baru") === "1"){ g("onbBox").scrollIntoView({block:"start"}); g("pfUser").focus({preventScroll:true}); }
    }catch(e){
      g("pfForm").hidden = true; g("onbBox").hidden = true;
      g("pfOff").hidden = false;
      return;
    }
    g("pfUser").addEventListener("input", onUser);
    g("pfBio").addEventListener("input", cnt);
    g("pfNeg").addEventListener("change", () => { paintWilayah(g("pfNeg").value, ""); paintKota(g("pfNeg").value, "", ""); paintTampil(); });
    g("pfWil").addEventListener("change", () => paintKota(g("pfNeg").value, g("pfWil").value, ""));
    g("pfForm").addEventListener("submit", save);
  }
  return {init, fill, setSoc};
})();
