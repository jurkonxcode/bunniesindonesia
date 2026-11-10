/* Masuk (v42, tab Masuk/Daftar v46): dialog masuk bersama untuk beranda, blog, tanya, akun, dan admin (Google + kode email).
   v46: dua tab. Masuk = hanya akun yang sudah ada (create_user:false). Daftar = membuat akun baru, wajib setuju syarat, menampilkan
   usulan username @njz_<nama email>. Akun baru diarahkan ke akun?baru=1 untuk melengkapi profil (lihat check()).
   Mandiri: hanya butuh SUPABASE_URL dan SUPABASE_ANON_KEY dari config.js, jadi aman dimuat tepat sesudahnya.
   Sesi disimpan ke localStorage "bunnies.session" dengan format yang sama seperti auth.js dan sesi.js.
   Sesudah berhasil: memanggil Masuk.onDone(sesi) bila diisi (beranda), kalau tidak halaman dimuat ulang. */
(() => {
  const KEY = "bunnies.session", HI = "bunnies.hi";
  const g = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const hdr = () => ({"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY});
  const WHY = {masuk:"Masuk dengan akun yang sudah ada. Tanpa kata sandi.", daftar:"Gratis dan tanpa kata sandi. Username @njz_ dibuat otomatis dan bisa kamu ganti."};
  /* v50/v52: dialog tiga bahasa. Halaman Korea (ko/) dan Inggris (en/) memakai teks dari kamus KO / EN dan awalan "../" untuk aset dan tautan. */
  const LANG = ["ko", "en"].includes((document.documentElement.lang || "id").slice(0, 2)) ? document.documentElement.lang.slice(0, 2) : "id", BASE = LANG === "id" ? "" : "../";
  const KO = {
    "Masuk":"로그인", "Daftar":"가입", "Masuk atau daftar":"로그인 또는 가입", "Masuk dengan Google":"Google로 로그인", "Daftar dengan Google":"Google로 가입",
    "atau pakai email":"또는 이메일로", "Email":"이메일", "Kirim kode ke email":"이메일로 코드 받기", "Kode dari email":"이메일로 받은 코드",
    "Ganti email":"이메일 변경", "Kirim ulang kode":"코드 재전송", "Tutup":"닫기", "Masuk ke Bunnies Indonesia":"버니즈 인도네시아에 로그인", "Daftar jadi Bunnies":"버니즈로 가입하기",
    "Dengan akun, kamu bisa menulis blog, bertanya, berkomentar, dan memilih bias.":"계정이 있으면 블로그 글쓰기, 질문, 댓글, 최애 멤버 선택을 할 수 있어요.",
    "Masuk dengan akun yang sudah ada. Tanpa kata sandi.":"기존 계정으로 로그인해요. 비밀번호는 필요 없어요.",
    "Gratis dan tanpa kata sandi. Username @njz_ dibuat otomatis dan bisa kamu ganti.":"무료이고 비밀번호도 필요 없어요. @njz_ 사용자 이름이 자동으로 만들어지며 나중에 바꿀 수 있어요.",
    "Mengirim kode…":"코드를 보내는 중…", "Kode baru sudah dikirim.":"새 코드를 보냈어요.", "Memeriksa kode…":"코드를 확인하는 중…",
    "Centang persetujuan dulu untuk mendaftar.":"가입하려면 먼저 동의에 체크해 주세요.",
    "Format email belum benar. Contoh: nama@email.com":"이메일 형식이 올바르지 않아요. 예: nama@email.com",
    "Masukkan kode dari email (6 angka atau lebih).":"이메일로 받은 코드(숫자 6자리 이상)를 입력해 주세요.",
    "Terlalu sering meminta kode. Tunggu sekitar satu menit, lalu coba lagi.":"코드를 너무 자주 요청했어요. 1분쯤 기다렸다가 다시 시도해 주세요.",
    "Email ini belum terdaftar. Pilih tab Daftar dulu.":"아직 가입되지 않은 이메일이에요. 먼저 '가입' 탭을 선택해 주세요.",
    "Kode belum bisa dikirim. Coba lagi sebentar lagi.":"코드를 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
    "Kode salah atau sudah kedaluwarsa. Periksa lagi, atau minta kode baru.":"코드가 틀렸거나 만료됐어요. 다시 확인하거나 새 코드를 요청해 주세요.",
    "Tidak bisa terhubung. Cek koneksi internetmu, lalu coba lagi.":"연결할 수 없어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
    "Profil Bunnies-mu belum lengkap. Ketuk untuk melengkapinya.":"프로필이 아직 완성되지 않았어요. 눌러서 완성해 주세요."
  };
  const EN = {
    "Masuk":"Log in", "Daftar":"Sign up", "Masuk atau daftar":"Log in or sign up", "Masuk dengan Google":"Log in with Google", "Daftar dengan Google":"Sign up with Google",
    "atau pakai email":"or use email", "Email":"Email", "Kirim kode ke email":"Send code to email", "Kode dari email":"Code from your email",
    "Ganti email":"Change email", "Kirim ulang kode":"Resend code", "Tutup":"Close", "Masuk ke Bunnies Indonesia":"Log in to Bunnies Indonesia", "Daftar jadi Bunnies":"Join as a Bunny",
    "Dengan akun, kamu bisa menulis blog, bertanya, berkomentar, dan memilih bias.":"With an account you can write blog posts, ask questions, comment, and pick your bias.",
    "Masuk dengan akun yang sudah ada. Tanpa kata sandi.":"Log in with your existing account. No password needed.",
    "Gratis dan tanpa kata sandi. Username @njz_ dibuat otomatis dan bisa kamu ganti.":"Free, and no password needed. Your @njz_ username is created automatically and you can change it later.",
    "Mengirim kode…":"Sending code…", "Kode baru sudah dikirim.":"A new code has been sent.", "Memeriksa kode…":"Checking code…",
    "Centang persetujuan dulu untuk mendaftar.":"Please tick the agreement box first to sign up.",
    "Format email belum benar. Contoh: nama@email.com":"That email format isn't right. Example: name@email.com",
    "Masukkan kode dari email (6 angka atau lebih).":"Enter the code from your email (6 digits or more).",
    "Terlalu sering meminta kode. Tunggu sekitar satu menit, lalu coba lagi.":"Too many code requests. Wait about a minute, then try again.",
    "Email ini belum terdaftar. Pilih tab Daftar dulu.":"This email isn't registered yet. Choose the Sign up tab first.",
    "Kode belum bisa dikirim. Coba lagi sebentar lagi.":"We couldn't send the code. Please try again in a moment.",
    "Kode salah atau sudah kedaluwarsa. Periksa lagi, atau minta kode baru.":"The code is wrong or has expired. Check it again, or request a new one.",
    "Tidak bisa terhubung. Cek koneksi internetmu, lalu coba lagi.":"Can't connect. Check your internet connection and try again.",
    "Profil Bunnies-mu belum lengkap. Ketuk untuk melengkapinya.":"Your Bunnies profile isn't complete yet. Tap to finish it."
  };
  const DICT = {ko:KO, en:EN};
  const t = x => (DICT[LANG] && DICT[LANG][x]) || x;
  let dlg = null, email = "", busy = false, tick = null, left = 0, mode = "masuk", why0 = "";

  const name = s => { const m = (s && s.user && s.user.user_metadata) || {}; return m.name || m.full_name || ((s && s.user && s.user.email) || "").split("@")[0] || "Bunnies"; };
  const pack = d => d && d.access_token ? {access_token:d.access_token, refresh_token:d.refresh_token, expires_at:d.expires_at || Math.floor(Date.now()/1000) + (d.expires_in || 3600), user:d.user} : null;
  /* Cermin public.username_dari_email() di supabase/v46: bagian sebelum @, tanpa +tag, selain a-z 0-9 jadi _, maks 20. */
  const usul = em => {
    let b = String(em || "").split("@")[0].toLowerCase().split("+")[0].replace(/[^a-z0-9_]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    if(b.length < 3) b = (b + "_bunnie").replace(/^_+|_+$/g, "");
    return b.slice(0, 20).replace(/^_+|_+$/g, "");
  };
  const readSession = () => { try{ return JSON.parse(localStorage.getItem(KEY)); }catch(e){ return null; } };

  const friendly = (status, d, fallback) => {
    const t = (((d && (d.error_code || d.code)) || "") + " " + ((d && (d.msg || d.message || d.error_description)) || "")).toLowerCase();
    if(status === 429 || t.includes("rate limit") || t.includes("over_email")) return "Terlalu sering meminta kode. Tunggu sekitar satu menit, lalu coba lagi.";
    if(t.includes("signups not allowed") || t.includes("otp_disabled") || t.includes("user not found")) return "Email ini belum terdaftar. Pilih tab Daftar dulu.";
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

  const msg = (x, kind) => { const m = g("mkMsg"); m.textContent = t(x || ""); m.className = "mk-msg" + (kind ? " " + kind : ""); };
  const lock = (id, on) => { const b = g(id); b.disabled = on; b.setAttribute("aria-busy", on ? "true" : "false"); };
  const show = n => { g("mkS1").hidden = n !== 1; g("mkS2").hidden = n !== 2; };
  const paintLeft = () => { const b = g("mkResend"); b.disabled = left > 0; b.textContent = left > 0 ? (LANG === "ko" ? "재전송 (" + left + "초)" : LANG === "en" ? "Resend (" + left + "s)" : "Kirim ulang (" + left + " dtk)") : t("Kirim ulang kode"); };
  function countdown(){ clearInterval(tick); left = 30; paintLeft(); tick = setInterval(() => { left--; paintLeft(); if(left <= 0) clearInterval(tick); }, 1000); }

  const needTerms = () => {
    if(mode === "daftar" && !g("mkTerms").checked){ msg("Centang persetujuan dulu untuk mendaftar.", "err"); return true; }
    return false;
  };
  async function send(addr, again){
    if(busy) return; busy = true; lock("mkSend", true); lock("mkResend", true); msg("Mengirim kode…");
    try{
      await call("otp", {email:addr, create_user:mode === "daftar"}, "Kode belum bisa dikirim. Coba lagi sebentar lagi.");
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
    if(dlg && dlg.open && needTerms()) return;
    try{ sessionStorage.setItem(HI, "1"); }catch(e){}
    location.href = SUPABASE_URL + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(LANG !== "id" ? new URL("../akun", location.href).href : location.origin + location.pathname);
  }

  function build(){
    if(dlg) return;
    dlg = document.createElement("dialog"); dlg.id = "masukDlg"; dlg.className = "mkdlg"; dlg.setAttribute("aria-labelledby", "mkTitle");
    dlg.innerHTML = `<div class="mk-in">
  <div class="mk-hero"><img class="logo" src="${BASE}assets/brand/logo-mark.svg" alt="" width="54" height="54"><div><h2 id="mkTitle">Masuk ke Bunnies Indonesia</h2><p id="mkWhy"></p></div></div>
  <div class="mk-body">
    <div class="mk-tabs" role="tablist" aria-label="Masuk atau daftar"><button type="button" role="tab" id="mkTabIn" data-mk="tab-masuk" aria-selected="true">Masuk</button><button type="button" role="tab" id="mkTabUp" data-mk="tab-daftar" aria-selected="false">Daftar</button></div>
    <div id="mkS1">
      <button class="mk-g" type="button" data-mk="google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span id="mkGL">Masuk dengan Google</span></button>
      <div class="mk-or"><span>atau pakai email</span></div>
      <form id="mkEmailF" novalidate><label for="mkEmail">Email</label><input id="mkEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="nama@email.com"><div class="mk-up" id="mkUp" hidden><p class="mk-prev" id="mkPrev" aria-live="polite"></p><label class="mk-chk"><input type="checkbox" id="mkTerms"><span>Saya setuju dengan <a href="${BASE}syarat">Syarat Layanan</a> dan <a href="${BASE}privasi">Kebijakan Privasi</a>.</span></label></div><button class="mk-go" id="mkSend">Kirim kode ke email</button></form>
      <p class="mk-perks">Dengan akun, kamu bisa menulis blog, bertanya, berkomentar, dan memilih bias.</p>
    </div>
    <div id="mkS2" hidden>
      <p class="mk-sent">Kode sudah dikirim ke <b id="mkTo"></b>. Kalau belum ada, cek folder spam.</p>
      <form id="mkCodeF" novalidate><label for="mkCode">Kode dari email</label><input id="mkCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="••••••" aria-describedby="mkMsg"><button class="mk-go" id="mkVerify">Masuk</button></form>
      <div class="mk-row"><button type="button" class="mk-link" data-mk="back">Ganti email</button><button type="button" class="mk-link" id="mkResend" data-mk="resend" disabled>Kirim ulang kode</button></div>
    </div>
    <p class="mk-msg" id="mkMsg" role="status" aria-live="polite"></p>
    <p class="mk-legal" id="mkLegal">Dengan masuk, kamu setuju dengan <a href="${BASE}syarat">Syarat Layanan</a> dan <a href="${BASE}privasi">Kebijakan Privasi</a>.</p>
  </div>
  <button class="mk-x" type="button" data-mk="close" aria-label="Tutup"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
</div>`;
    if(LANG !== "id"){
      const D = DICT[LANG];
      const w = document.createTreeWalker(dlg, NodeFilter.SHOW_TEXT);
      for(let n; (n = w.nextNode());){ const k = n.nodeValue.trim(); if(D[k]) n.nodeValue = n.nodeValue.replace(k, D[k]); }
      dlg.querySelectorAll("[aria-label]").forEach(e => { const k = e.getAttribute("aria-label"); if(D[k]) e.setAttribute("aria-label", D[k]); });
      if(LANG === "ko"){
        const A = `<a href="${BASE}syarat">이용약관</a>`, B = `<a href="${BASE}privasi">개인정보처리방침</a>`;
        dlg.querySelector(".mk-chk span").innerHTML = `${A} 및 ${B}에 동의해요.`;
        dlg.querySelector("#mkLegal").innerHTML = `로그인하면 ${A} 및 ${B}에 동의하는 것으로 봐요.`;
        dlg.querySelector(".mk-sent").innerHTML = `<b id="mkTo"></b>(으)로 코드를 보냈어요. 오지 않았다면 스팸함을 확인해 주세요.`;
      } else {
        const A = `<a href="${BASE}syarat">Terms of Service</a>`, B = `<a href="${BASE}privasi">Privacy Policy</a>`;
        dlg.querySelector(".mk-chk span").innerHTML = `I agree to the ${A} and ${B}.`;
        dlg.querySelector("#mkLegal").innerHTML = `By logging in, you agree to the ${A} and ${B}.`;
        dlg.querySelector(".mk-sent").innerHTML = `We sent a code to <b id="mkTo"></b>. If it doesn't arrive, check your spam folder.`;
      }
    }
    document.body.appendChild(dlg);
    dlg.addEventListener("click", e => {
      if(e.target === dlg) return dlg.close();                                  // klik di luar kartu
      const a = e.target.closest("[data-mk]"); if(!a) return;
      ({"tab-masuk":() => setMode("masuk"), "tab-daftar":() => setMode("daftar"), close:() => dlg.close(), google, back:() => { clearInterval(tick); show(1); msg(""); g("mkEmail").focus(); }, resend:() => send(email, true)})[a.dataset.mk]();
    });
    dlg.addEventListener("close", () => clearInterval(tick));
    g("mkEmailF").addEventListener("submit", e => {
      e.preventDefault(); const v = g("mkEmail").value.trim();
      if(!/^\S+@\S+\.\S+$/.test(v)){ msg("Format email belum benar. Contoh: nama@email.com", "err"); g("mkEmail").focus(); return; }
      if(needTerms()) return;
      send(v);
    });
    g("mkCodeF").addEventListener("submit", e => {
      e.preventDefault(); const v = g("mkCode").value.replace(/\D/g, "");
      if(v.length < 6){ msg("Masukkan kode dari email (6 angka atau lebih).", "err"); g("mkCode").focus(); return; }
      verify(v);
    });
    g("mkEmail").addEventListener("input", paintPrev);
    g("mkCode").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); });
  }

  function paintPrev(){
    const v = g("mkEmail").value.trim(), u = /^\S+@\S+/.test(v) ? usul(v) : "";
    if(LANG === "ko"){ g("mkPrev").textContent = u ? "처음 사용자 이름: @njz_" + u + ". 이메일 이름에서 가져오며 가입 후 바꿀 수 있어요. 이미 사용 중이면 숫자가 붙어요." : "처음 사용자 이름은 @njz_ + 이메일 이름(@ 앞부분)이에요. 가입 후 바꿀 수 있어요."; return; }
    if(LANG === "en"){ g("mkPrev").textContent = u ? "Your starting username: @njz_" + u + ". It comes from your email name and you can change it after signing up. If it's taken, we add a number." : "Your starting username will be @njz_ + your email name (the part before the @). You can change it after signing up."; return; }
    g("mkPrev").textContent = u ? "Username awalmu: @njz_" + u + ". Diambil dari nama emailmu, bisa kamu ganti setelah daftar. Kalau sudah dipakai, kami tambahkan angka." : "Username awalmu akan berupa @njz_ + nama emailmu (bagian sebelum @). Bisa kamu ganti setelah daftar.";
  }
  function setMode(m){
    mode = m; const up = m === "daftar";
    g("mkTabIn").setAttribute("aria-selected", String(!up)); g("mkTabUp").setAttribute("aria-selected", String(up));
    g("mkTitle").textContent = t(up ? "Daftar jadi Bunnies" : "Masuk ke Bunnies Indonesia");
    g("mkWhy").textContent = t(up ? WHY.daftar : (why0 || WHY.masuk));
    g("mkGL").textContent = t(up ? "Daftar dengan Google" : "Masuk dengan Google");
    g("mkVerify").textContent = t(up ? "Daftar" : "Masuk");
    g("mkUp").hidden = !up; g("mkLegal").hidden = up;
    clearInterval(tick); show(1); msg(""); paintPrev();
  }
  function open(why, m){
    if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ alert("Login belum dikonfigurasi (js/config.js)."); return; }
    build(); why0 = why || ""; setMode(m === "daftar" ? "daftar" : "masuk"); show(1); msg("");
    if(!dlg.open) dlg.showModal();
    if(window.matchMedia && matchMedia("(pointer:fine)").matches) g("mkEmail").focus();   // di HP jangan langsung memunculkan keyboard
  }

  function toast(x, href){
    const el = document.createElement(href ? "a" : "div"); el.className = "mk-toast"; el.setAttribute("role", "status"); el.textContent = t(x);
    if(href) el.href = href;
    document.body.appendChild(el); setTimeout(() => el.classList.add("out"), 3200); setTimeout(() => el.remove(), 3700);
  }
  /* Sesudah masuk: profil belum lengkap? Akun baru (<15 menit) langsung diarahkan ke akun?baru=1; akun lama diberi toast.
     Diam saja bila v46 belum dijalankan di Supabase (fungsi my_profile belum ada). */
  async function check(s){
    if(/(^|\/)akun(\.html)?$/.test(location.pathname)) return;           // halaman Akun mengurus ini sendiri
    try{
      const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/my_profile", {method:"POST", headers:{"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + s.access_token}, body:"{}"});
      if(!r.ok) return;
      const p = await r.json(); if(!p || p.profil_lengkap) return;
      if(Date.now() - new Date(p.bergabung) < 15 * 60 * 1000) location.href = BASE + "akun?baru=1";
      else setTimeout(() => toast("Profil Bunnies-mu belum lengkap. Ketuk untuk melengkapinya.", BASE + "akun"), 3900);
    }catch(e){}
  }
  function hello(){                                                              // sapaan sekali sesudah masuk (juga sesudah kembali dari Google)
    let on = false; try{ on = sessionStorage.getItem(HI) === "1"; }catch(e){}
    if(!on) return;
    let n = 0;
    const t = setInterval(() => {
      const s = readSession(), stop = () => { clearInterval(t); try{ sessionStorage.removeItem(HI); }catch(e){} };
      if(s && s.user){ stop(); toast(LANG === "ko" ? "환영해요, " + name(s) + "님!" : LANG === "en" ? "Welcome, " + name(s) + "!" : "Selamat datang, " + name(s) + "!"); check(s); } else if(++n > 10) stop();
    }, 300);
  }
  const chip = s => {
    const n = name(s), i = ([...n.trim()][0] || "B").toUpperCase();
    return `<a class="uchip" href="${BASE}akun" aria-label="${LANG === "ko" ? "내 계정" : LANG === "en" ? "My account" : "Akun saya"}: ${esc(n)}"><span class="av" aria-hidden="true">${esc(i)}</span><span class="un">${esc(n)}</span></a>`;
  };

  const api = window.Masuk = {open, daftar:why => open(why, "daftar"), google, chip, name, toast, hello, onDone:null};
  hello();
})();
