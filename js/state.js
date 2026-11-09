let news = demoNews, trending = demoTrend, cat = "Semua", query = "", tab = "Semua", questions = [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
