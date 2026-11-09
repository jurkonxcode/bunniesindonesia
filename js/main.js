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
["loginBtn","loginTop","signup"].forEach(id => $(id).addEventListener("click", e => { e.preventDefault(); alert("Sambungkan ke Supabase Auth (signInWithOtp / signInWithPassword)."); }));

$("chips").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ $("q").value = b.textContent; $("searchForm").requestSubmit(); } });
$("short").addEventListener("click", e => { const a = e.target.closest("a[data-cat]"); if(a){ cat = a.dataset.cat; query = ""; renderNews(); } });

renderStatic(); renderTools(); renderPromo(); greeting(); tickClocks(); setInterval(tickClocks, 20000); renderTrend(); renderNews(); rotate();
setInterval(rotate, 3000);
load().then(() => { renderTrend(); renderNews(); });
