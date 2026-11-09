$("cats").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ cat = b.dataset.c; renderNews(); } });
$("newsBody").addEventListener("click", e => { if(e.target.id === "clearQ"){ query = ""; $("q").value = ""; renderNews(); } });
$("scope").addEventListener("click", e => { const b = e.target.closest("button"); if(!b) return; [...$("scope").children].forEach(x => x.setAttribute("aria-pressed", x === b)); });
$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = $("q").value.trim();
  if(goTool(v)) return;
  query = v; cat = "Semua"; renderNews();
  $("berita").scrollIntoView({behavior:"smooth"});
});
document.addEventListener("click", e => {
  const t = e.target.closest("#loginBtn,#loginTop,#signup,#logoutTop,#logoutBtn,#showSaved,#googleBtn,#authClose,[data-save]");
  if(!t) return;
  e.preventDefault();
  if(t.dataset.save) return toggleSave(+t.dataset.save);
  ({loginBtn:openAuth, loginTop:openAuth, signup:openAuth, logoutTop:logout, logoutBtn:logout, googleBtn:googleLogin,
    authClose:() => $("authDlg").close(), showSaved:() => { onlySaved = !onlySaved; renderAuth(); renderNews(); }})[t.id]();
});
$("emailForm").addEventListener("submit", e => { e.preventDefault(); sendCode($("emailIn").value.trim()); });
$("codeForm").addEventListener("submit", e => { e.preventDefault(); verifyCode($("codeIn").value.trim()); });

$("chips").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ $("q").value = b.textContent; $("searchForm").requestSubmit(); } });
$("short").addEventListener("click", e => { const a = e.target.closest("a[data-cat]"); if(a){ cat = a.dataset.cat; query = ""; renderNews(); } });

renderStatic(); renderTools(); renderPromo(); greeting(); tickClocks(); setInterval(tickClocks, 20000); renderTrend(); renderNews(); rotate();
setInterval(rotate, 3000);
initAuth();
load().then(() => { renderTrend(); renderNews(); });
