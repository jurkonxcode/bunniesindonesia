let news = [], trending = [], cat = "Semua", query = "", tab = "Semua", questions = [], posts = [], loadErr = false;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
