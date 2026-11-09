const grad = i => `--a:${PAL[i % PAL.length][0]};--b:${PAL[i % PAL.length][1]}`;
const rp = n => "Rp" + n.toLocaleString("id-ID");
function ago(d){
  const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000));
  return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : Math.round(m / 1440) + " hari lalu";
}
const when = n => n.time || (n.created_at ? ago(n.created_at) : "");

function renderNews(){
  const cats = ["Semua", ...new Set(news.map(n => n.category).filter(Boolean))];
  $("cats").innerHTML = cats.map(c => `<button aria-pressed="${c === cat}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  const q = query.toLowerCase();
  const items = news.filter(n => (cat === "Semua" || n.category === cat) && (!q || (n.title + " " + (n.summary || "")).toLowerCase().includes(q)));
  const found = q ? `<div class="found"><span>${items.length} hasil untuk “${esc(query)}”</span><button id="clearQ">Hapus</button></div>` : "";
  if(!items.length){ $("newsBody").innerHTML = found + `<p class="empty">Tidak ada berita yang cocok. Coba kata kunci atau kategori lain.</p>`; return; }
  const [a, ...rest] = items;
  const card = (n, i) => `<a class="nc" href="#"><div class="thumb" style="${grad(i + 1)}"></div><div><span class="tag">${esc(n.category)}</span><h4>${esc(n.title)}</h4><span class="meta">${esc(n.source)} · ${esc(when(n))}</span></div></a>`;
  $("newsBody").innerHTML = found +
    `<article class="lead"><div class="thumb" style="${grad(0)}"></div><div><span class="tag">${esc(a.category)}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><span class="meta">${esc(a.source)} · ${esc(when(a))}</span></div></article>` +
    (rest.length ? `<div class="nc4">${rest.slice(0, 4).map(card).join("")}</div>` : "") +
    (rest.length > 4 ? `<ul class="rows">${rest.slice(4, 10).map(n => `<li><a href="#"><span class="tag">${esc(n.category)}</span>${esc(n.title)}</a><span class="meta">${esc(when(n))}</span></li>`).join("")}</ul>` : "");
}

function renderStatic(){
  $("ticker").innerHTML = ticker.map(t => `<span><b>${t[0]}</b>${t[1]} <span class="${t[3] ? "up" : "down"}">${t[2]}</span></span>`).join("") +
    `<span class="date">${new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>`;
  $("short").innerHTML = shortcuts.map(s => `<a href="${s[2]}"><span><svg viewBox="0 0 24 24"><path d="${s[1]}"/></svg></span>${s[0]}</a>`).join("");
  $("stamp").textContent = new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"});
  $("videos").innerHTML = videos.map((v, i) => `<a class="vc" href="#"><div class="thumb" style="${grad(i + 2)}"><span class="dur">${v.dur}</span></div><h4>${esc(v.title)}</h4></a>`).join("");
  $("products").innerHTML = products.map((p, i) => `<a class="pc" href="#"><div class="thumb" style="${grad(i + 4)}"><span class="off">-${p.off}%</span></div><h4>${esc(p.name)}</h4><b><s>${rp(p.old)}</s>${rp(p.price)}</b></a>`).join("");
  $("communities").innerHTML = communities.map((c, i) => `<li><span class="av" style="${grad(i)}">${esc(c.name[0])}</span><div>${esc(c.name)}<span class="meta">${c.members} anggota</span></div><button>Gabung</button></li>`).join("");
  $("comics").innerHTML = comics.map((c, i) => `<a class="cm" href="#"><div class="thumb" style="${grad(i + 1)}"><span>${esc(c.title)}</span></div><h4>${esc(c.title)}</h4><span class="meta">${esc(c.genre)}</span></a>`).join("");
  $("score").innerHTML = scores.map(s => `<li><span>${s[0]}</span><b>${s[1]}</b><span>${s[2]}</span></li>`).join("");
}

function renderTrend(){
  const mv = ["u","n","d","u","n","u","d","n"], lb = {u:"naik",d:"turun",n:"–"};
  $("rank").innerHTML = trending.slice(0, 8).map((k, i) => `<li><i>${i + 1}</i><a href="#">${esc(k)}</a><em class="${mv[i]}">${lb[mv[i]]}</em></li>`).join("");
}

let ti = 0;
function rotate(){
  const el = $("trendText"); el.style.opacity = 0;
  setTimeout(() => { el.textContent = (ti % trending.length + 1) + ". " + trending[ti % trending.length]; el.style.opacity = 1; ti++; }, 300);
}
