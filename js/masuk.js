/* Masuk (v42): dialog masuk bersama untuk beranda, blog, tanya, akun, dan admin (Google + kode email).
   Mandiri: hanya butuh SUPABASE_URL dan SUPABASE_ANON_KEY dari config.js, jadi aman dimuat tepat sesudahnya.
   Sesi disimpan ke localStorage "bunnies.session" dengan format yang sama seperti auth.js dan sesi.js.
   Sesudah berhasil: memanggil Masuk.onDone(sesi) bila diisi (beranda), kalau tidak halaman dimuat ulang. */
(() => {
  const KEY = "bunnies.session", HI = "bunnies.hi";
  const g = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const hdr = () => ({"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY});
  const WHY = "Akun dibuat otomatis saat pertama kali masuk. Tanpa kata sandi.";
  let dlg = null, email = "", busy = false, tick = null, left = 0;

  const name = s => { const m = (s && s.user && s.user.user_metadata) || {}; return m.name || m.full_name || ((s && s.user && s.user.email) || "").split("@")[0] || "Bunnies"; };
  const pack = d => d && d.access_token ? {access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at || Math.floor(Date.now()/1000) + (d.expires_in || 3600), user:d.user} : null;
  const readSession = () => { try{ return JSON.parse(localStorage.getItem(KEY)); }catch(e){ return null; } };

  const friendly = (status, d, fallback) => {
    const t = (((d && (d.error_code || d.code)) || "") + " " + ((d && (d.msg || d.message || d.error_description)) || "")).toLowerCase();
    if(status === 429 || t.includes("rate limit") || t.includes("over_email")) return "Terlalu sering meminta kode. Tunggu sekitar satu menit, lalu coba lagi.";
    if(t.includes("email") && (t.includes("invalid") || t.includes("valid"))) return "Format email belum benar. Contoh: nama@email.com";
    return fallback;
  };
  async function call(path, body, fallback){
    let r, d = {};
    try{ r = await fetch(SUPABASE_URL + "/auth/v1/" + path, {method:"POST", headers:hdr(), body:JSON.stringify(body)}); d = await r.json().catch(() => ({})); }
    catch(e){ throw new Error("Tidak bisa terhubung. Cek koneksi internetmu, lalu coba lagi."); }
    if(!r.ok) throw new Error(friendly(r.status, d, fallback));
    return d;
  }

  const msg = (t, kind) => { const m = g("mkMsg"); m.textContent = t || ""; m.className = "mk-msg" + (kind ? " " + kind : ""); };
  const lock = (id, on) => { const b = g(id); b.disabled = on; b.setAttribute("aria-busy", on ? "true" : "false"); };
  const show = n => { g("mkS1").hidden = n !== 1; g("mkS2").hidden = n !== 2; };
  const paintLeft = () => { const b = g("mkResend"); b.disabled = left > 0; b.textContent = left > 0 ? "Kirim ulang (" + left + " dtk)" : "Kirim ulang kode"; };
  function countdown(){ clearInterval(tick); left = 30; paintLeft(); tick = setInterval(() => { left--; paintLeft(); if(left <= 0) clearInterval(tick); }, 1000); }

  async function send(addr, again){
    if(busy) return; busy = true; lock("mkSend", true); lock("mkResend", true); msg("Mengirim kode…");
    try{
      await call("otp", {email:addr, create_user:true}, "Kode belum bisa dikirim. Coba lagi sebentar lagi.");
      email = addr; g("mkTo").textContent = addr; g("mkCode").value = ""; show(2); countdown();
      msg(again ? "Kode baru sudah dikirim." : "", "ok"); g("mkCode").focus();
    }catch(e){ msg(e.message, "err"); }
    busy = false; lock("mkSend", false); paintLeft();
  }
  async function verify(code){
    if(busy) return; busy = true; lock("mkVerify", true); msg("Memeriksa kode…");
    const bad = "Kode salah atau sudah kedaluwarsa. Periksa lagi, atau minta kode baru.";
    try{
      const s = pack(await call("verify", {type:"email", email, token:code}, bad));
      if(!s) throw new Error(bad);
      finish(s);
    }catch(e){ msg(e.message, "err"); g("mkCode").select(); }
    busy = false; lock("mkVerify", false);
  }
  function finish(s){
    try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){}
    try{ sessionStorage.setItem(HI, "1"); }catch(e){}
    clearInterval(tick); dlg.close();
    if(typeof api.onDone === "function"){ api.onDone(s); hello(); } else location.reload();
  }
  function google(){
    try{ sessionStorage.setItem(HI, "1"); }catch(e){}
    location.href = SUPABASE_URL + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(location.origin + location.pathname);
  }

  function build(){
    if(dlg) return;
    dlg = document.createElement("dialog"); dlg.id = "masukDlg"; dlg.className = "mkdlg"; dlg.setAttribute("aria-labelledby", "mkTitle");
    dlg.innerHTML = `<div class="mk-in">
  <div class="mk-hero"><img class="logo" src="assets/brand/logo-mark.svg" alt="" width="54" height="54"><div><h2 id="mkTitle">Masuk ke Bunnies Indonesia</h2><p id="mkWhy"></p></div></div>
  <div class="mk-body">
    <div id="mkS1">
      <button class="mk-g" type="button" data-mk="google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Lanjut dengan Google</button>
      <div class="mk-or"><span>atau pakai email</span></div>
      <form id="mkEmailF" novalidate><label for="mkEmail">Email</label><input id="mkEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="nama@email.com"><button class="mk-go" id="mkSend">Kirim kode ke email</button></form>
      <p class="mk-perks">Dengan akun, kamu bisa menulis blog, bertanya, berkomentar, dan memilih bias.</p>
    </div>
    <div id="mkS2" hidden>
      <p class="mk-sent">Kode sudah dikirim ke <b id="mkTo"></b>. Kalau belum ada, cek folder spam.</p>
      <form id="mkCodeF" novalidate><label for="mkCode">Kode dari email</label><input id="mkCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="••••••" aria-describedby="mkMsg"><button class="mk-go" id="mkVerify">Masuk</button></form>
      <div class="mk-row"><button type="button" class="mk-link" data-mk="back">Ganti email</button><button type="button" class="mk-link" id="mkResend" data-mk="resend" disabled>Kirim ulang kode</button></div>
    </div>
    <p class="mk-msg" id="mkMsg" role="status" aria-live="polite"></p>
    <p class="mk-legal">Dengan masuk, kamu setuju dengan <a href="syarat">Syarat Layanan</a> dan <a href="privasi">Kebijakan Privasi</a>.</p>
  </div>
  <button class="mk-x" type="button" data-mk="close" aria-label="Tutup"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
</div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("click", e => {
      if(e.target === dlg) return dlg.close();                                  // klik di luar kartu
      const a = e.target.closest("[data-mk]"); if(!a) return;
      ({close:() => dlg.close(), google, back:() => { clearInterval(tick); show(1); msg(""); g("mkEmail").focus(); }, resend:() => send(email, true)})[a.dataset.mk]();
    });
    dlg.addEventListener("close", () => clearInterval(tick));
    g("mkEmailF").addEventListener("submit", e => {
      e.preventDefault(); const v = g("mkEmail").value.trim();
      if(!/^\S+@\S+\.\S+$/.test(v)){ msg("Format email belum benar. Contoh: nama@email.com", "err"); g("mkEmail").focus(); return; }
      send(v);
    });
    g("mkCodeF").addEventListener("submit", e => {
      e.preventDefault(); const v = g("mkCode").value.replace(/\D/g, "");
      if(v.length < 6){ msg("Masukkan kode dari email (6 angka atau lebih).", "err"); g("mkCode").focus(); return; }
      verify(v);
    });
    g("mkCode").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); });
  }

  function open(why){
    if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ alert("Login belum dikonfigurasi (js/config.js)."); return; }
    build(); g("mkWhy").textContent = why || WHY; show(1); msg("");
    if(!dlg.open) dlg.showModal();
    if(window.matchMedia && matchMedia("(pointer:fine)").matches) g("mkEmail").focus();   // di HP jangan langsung memunculkan keyboard
  }

  function toast(t){
    const el = document.createElement("div"); el.className = "mk-toast"; el.setAttribute("role", "status"); el.textContent = t;
    document.body.appendChild(el); setTimeout(() => el.classList.add("out"), 3200); setTimeout(() => el.remove(), 3700);
  }
  function hello(){                                                              // sapaan sekali sesudah masuk (juga sesudah kembali dari Google)
    let on = false; try{ on = sessionStorage.getItem(HI) === "1"; }catch(e){}
    if(!on) return;
    let n = 0;
    const t = setInterval(() => {
      const s = readSession(), stop = () => { clearInterval(t); try{ sessionStorage.removeItem(HI); }catch(e){} };
      if(s && s.user){ stop(); toast("Selamat datang, " + name(s) + "!"); } else if(++n > 10) stop();
    }, 300);
  }
  const chip = s => {
    const n = name(s), i = ([...n.trim()][0] || "B").toUpperCase();
    return `<a class="uchip" href="akun" aria-label="Akun saya: ${esc(n)}"><span class="av" aria-hidden="true">${esc(i)}</span><span class="un">${esc(n)}</span></a>`;
  };

  const api = window.Masuk = {open, google, chip, name, toast, hello, onDone:null};
  hello();
})();
