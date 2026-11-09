$("cats").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ cat = b.dataset.c; renderNews(); } });
$("newsBody").addEventListener("click", e => { if(e.target.id === "clearQ"){ query = ""; $("q").value = ""; renderNews(); } });
$("scope").addEventListener("click", e => { const b = e.target.closest("button"); if(!b) return; [...$("scope").children].forEach(x => x.setAttribute("aria-pressed", x === b)); });
$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  query = $("q").value.trim(); cat = "Semua"; renderNews();
  $("berita").scrollIntoView({behavior:"smooth"});
});
["loginBtn","loginTop","signup"].forEach(id => $(id).addEventListener("click", e => { e.preventDefault(); alert("Sambungkan ke Supabase Auth (signInWithOtp / signInWithPassword)."); }));

renderStatic(); renderTrend(); renderNews(); rotate();
setInterval(rotate, 3000);
load().then(() => { renderTrend(); renderNews(); });
