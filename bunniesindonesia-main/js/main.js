$("ftabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-t]"); if(b){ tab = b.dataset.t; renderFeed(); return; }
  const g = e.target.closest("[data-go]"); if(g){ e.preventDefault(); goTool(g.dataset.go === "tool-libur" ? "libur" : "sholat"); }
});
$("svr").addEventListener("click", e => {
  const b = e.target.closest("button[data-t]"); if(b){ tab = b.dataset.t; renderFeed(); $("feed").scrollIntoView({behavior:"smooth", block:"start"}); return; }
  const g = e.target.closest("[data-go]"); if(g){ e.preventDefault(); goTool(g.dataset.go === "tool-libur" ? "libur" : "sholat"); }
});
$("modules").addEventListener("click", e => {
  const c = e.target.closest("button[data-bpc]"); if(c){ bpCat = c.dataset.bpc; bpPage = 0; renderModules(); return; }
  const p = e.target.closest("button[data-bpp]"); if(p){ bpPage = Math.max(0, bpPage + +p.dataset.bpp); renderModules(); return; }
  const g = e.target.closest("[data-go]"); if(g){ e.preventDefault(); goTool(g.dataset.go === "tool-libur" ? "libur" : "sholat"); }
});
$("mini").addEventListener("click", e => { const g = e.target.closest("[data-go]"); if(g){ e.preventDefault(); goTool(g.dataset.go === "tool-libur" ? "libur" : "sholat"); } });
$("tools").addEventListener("change", e => {
  if(e.target.id !== "kota") return;
  const i = +e.target.value; if(!(i >= 0 && i < CITIES.length)) return;
  loc = cityObj(i); saveLoc(); $("kotaMsg").textContent = ""; renderKota(); paintSholat();
});
$("tools").addEventListener("click", e => { if(e.target.closest("#kotaGps")) useMyLocation(); });
$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = $("q").value.trim(); if(!v) return;
  if(goTool(v)) return;
  location.href = "search?q=" + encodeURIComponent(v);
});
document.addEventListener("click", e => {
  const t = e.target.closest("#loginBtn,#loginTop,#signup,#logoutTop,#logoutBtn,#showSaved,#googleBtn,#authClose,[data-save]");
  if(!t) return;
  e.preventDefault();
  if(t.dataset.save) return toggleSave(+t.dataset.save);
  ({loginBtn:openAuth, loginTop:openAuth, signup:openAuth, logoutTop:logout, logoutBtn:logout, googleBtn:googleLogin,
    authClose:() => $("authDlg").close(), showSaved:() => { onlySaved = !onlySaved; tab = "Semua"; renderAuth(); renderFeed(); }})[t.id]();
});
$("emailForm").addEventListener("submit", e => { e.preventDefault(); sendCode($("emailIn").value.trim()); });
$("codeForm").addEventListener("submit", e => { e.preventDefault(); verifyCode($("codeIn").value.trim()); });
$("chips").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ $("q").value = b.textContent; $("searchForm").requestSubmit(); } });

renderStatic(); renderTools(); greeting(); tickClocks(); renderFeed();
setInterval(() => { tickClocks(); paintSholat(); paintLibur(); }, 20000);      // jam, hitung mundur sholat, dan tanggal libur tetap segar
setInterval(rotate, 3000);
initAuth();
load().then(() => { renderFeed(); rotate(); });
loadQuestions().then(() => renderFeed());
loadPosts().then(() => renderFeed());
