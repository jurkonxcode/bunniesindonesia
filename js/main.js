$("ftabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-t]"); if(b){ tab = b.dataset.t; renderTabs(); renderFeed(); return; }
  if(e.target.closest("#qkResi")){ e.preventDefault(); goTool("resi"); }
});
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
    authClose:() => $("authDlg").close(), showSaved:() => { onlySaved = !onlySaved; tab = "Semua"; renderTabs(); renderAuth(); renderFeed(); }})[t.id]();
});
$("emailForm").addEventListener("submit", e => { e.preventDefault(); sendCode($("emailIn").value.trim()); });
$("codeForm").addEventListener("submit", e => { e.preventDefault(); verifyCode($("codeIn").value.trim()); });
$("chips").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ $("q").value = b.textContent; $("searchForm").requestSubmit(); } });

renderStatic(); renderTools(); renderPromo(); greeting(); tickClocks(); setInterval(tickClocks, 20000); renderTabs(); renderFeed(); rotate();
setInterval(rotate, 3000);
initAuth();
load().then(() => { renderFeed(); });
loadQuestions().then(() => renderFeed());
