$("cats").addEventListener("click", e => { const b = e.target.closest("button"); if(b){ cat = b.dataset.c; render(); } });
$("scope").addEventListener("click", e => { const b = e.target.closest("button"); if(!b) return; [...$("scope").children].forEach(x => x.setAttribute("aria-pressed", x===b)); });
$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const q = $("q").value.trim();
  if(q) alert("Hubungkan ke halaman hasil pencarian. Kata kunci: " + q);
});
["loginBtn","loginTop"].forEach(id => $(id).addEventListener("click", () => alert("Hubungkan ke Supabase Auth (signInWithOtp / signInWithPassword).")));

load().then(() => { render(); rotate(); setInterval(rotate, 3000); });
render(); rotate();
