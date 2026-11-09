/* Tampilan beranda gaya portal: umpan kartu bergambar + tab. Semua teks dari database lewat esc(). */
const ICONS = "assets/icons/niflax-icons.svg";
const ic = (id, c, cls) => `<span class="ic ${c || "g1"} ${cls || ""}"><svg aria-hidden="true"><use href="${ICONS}#n-${id}"/></svg></span>`;
const art = id => `<svg class="art" aria-hidden="true"><use href="${ICONS}#n-${id}"/></svg>`;
const sUrl = u => { try{ const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; }catch(e){ return ""; } };
const grad = i => `--a:${PAL[i % PAL.length][0]};--b:${PAL[i % PAL.length][1]}`;
function ago(d){
  const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000));
  return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : Math.round(m / 1440) + " hari lalu";
}
const when = n => n.time || ((n.published_at || n.created_at) ? ago(n.published_at || n.created_at) : "");

/* Sampul: ilustrasi ikon kategori; bila ada image_url (http/https), foto menutupinya dan hilang sendiri bila gagal dimuat. */
function cover(n, i){
  const [id, p] = CAT_ART[n.category] || ["berita", i || 0], img = sUrl(n.image_url);
  return `<div class="thumb" style="${grad(p)}">${art(id)}${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}</div>`;
}

/* ---------- v24: beranda ala portal besar: panel, baris ikon satu baris, kolom samping ---------- */
const BC = ["Umum","Teknologi","Ekonomi","Kuliner","Otomotif","Olahraga","Hiburan","Catatan harian"];     // kategori Blog (sama dengan blog.js)
const catArt = c => CAT_ART[c] || ["blog", 0];
const cPost = (p, i) => `<a class="fc" href="blog?id=${+p.id}"><div class="fcv">${cover(p, i)}<span class="fk">${esc(p.category)}</span></div><h3>${esc(p.title)}</h3><span class="au">${esc(p.author_name || "Pengguna")}</span><span class="meta">${esc(ago(p.created_at))}</span></a>`;
const cQuestion = q => `<a class="fc" href="tanya?id=${+q.id}"><div class="fcv"><div class="thumb" style="${grad(1)}">${art("tanya")}</div><span class="fk q">Tanya${q.best_answer_id ? " · Terjawab" : ""}</span></div><h3>${esc(q.title)}</h3><span class="au">${esc(q.category)}</span><span class="meta">${+q.answer_count} jawaban · ${esc(ago(q.created_at))}</span></a>`;
function feedItems(){
  const P = posts.map(p => ({h:i => cPost(p, i)})), Q = questions.map(q => ({h:() => cQuestion(q)}));
  if(tab === "Blog") return P;
  if(tab === "Tanya") return Q;
  const out = [], rest = Q.slice();                         // Semua: tulisan diselingi satu pertanyaan tiap dua tulisan
  P.forEach((x, i) => { out.push(x); if(i % 2 === 1 && rest.length) out.push(rest.shift()); });
  return out.concat(rest);
}
function tabList(){ return [["Semua","Semua"], ["Blog","Blog"], ["Tanya","Tanya Jawab"]]; }
/* Baris ikon layanan (satu baris, bisa digeser). [ikon, nama, tujuan, warna]. "#..." = gulir ke alat. Semua tujuan sudah nyata sejak v24. */
const SVC = [["tanya","Tanya","tanya","g4"],["blog","Blog","blog","g1"],["sholat","Sholat","#tool-sholat","g2"],["libur","Libur","#tool-libur","g3"],
  ["teknologi","Teknologi","blog?cat=Teknologi","g4"],["kurs","Ekonomi","blog?cat=Ekonomi","g2"],["kuliner","Kuliner","blog?cat=Kuliner","g3"],["otomotif","Otomotif","blog?cat=Otomotif","g5"],
  ["bola","Olahraga","blog?cat=Olahraga","g5"],["hiburan","Hiburan","blog?cat=Hiburan","g4"],["menu","Semua","layanan","g6"]];
function renderSvr(){
  $("svr").innerHTML = SVC.map(([id, nm, to, c]) => {
    const body = `${ic(id, c)}<span class="nm">${esc(nm)}</span>`;
    return to[0] === "#" ? `<a class="ik" href="${to}" data-go="${to.slice(1)}">${body}</a>` : `<a class="ik" href="${to}">${body}</a>`;
  }).join("");
}
function renderTabs(){
  const L = tabList(); if(!L.some(t => t[0] === tab)) tab = "Semua";
  $("ftabs").innerHTML =
    L.map(t => `<button type="button" data-t="${esc(t[0])}" aria-pressed="${t[0] === tab}">${esc(t[1])}</button>`).join("");
}
function renderFeed(){
  renderTabs(); renderSvr(); renderModules(); renderCal();
  const items = feedItems();
  $("status").textContent = loadErr ? "Gagal memuat data langsung. Periksa koneksi internetmu lalu muat ulang halaman." : "";
  $("feed").innerHTML = items.length ? items.map((x, i) => x.h(i)).join("") :
    `<p class="empty">Belum ada isi. Jadilah yang pertama menulis di <a href="blog">Blog</a> atau bertanya di <a href="tanya">Tanya Jawab</a>.</p>`;
}
/* ---------- Panel beranda ---------- */
const skel = n => Array.from({length:n}, () => `<div class="bc sk"><i></i><b></b><b></b></div>`).join("");
const mq = window.matchMedia("(min-width:700px)");
let bpCat = "Semua", bpPage = 0;
function renderModules(){
  const size = mq.matches ? 8 : 4;
  const first = posts[0] ? [`blog?id=${+posts[0].id}`, posts[0].title] : questions[0] ? [`tanya?id=${+questions[0].id}`, questions[0].title] : null;
  const tiles = [["blog","Semua tulisan","blog","g1"],["tanya","Tanya Jawab","tanya","g4"]]
    .concat(BC.map((c, i) => [catArt(c)[0], c, "blog?cat=" + encodeURIComponent(c), "g" + (1 + (i + 2) % 5)]))
    .concat([["sholat","Jadwal sholat","#tool-sholat","g2"],["libur","Libur nasional","#tool-libur","g3"]]);
  const list = bpCat === "Semua" ? posts : posts.filter(p => p.category === bpCat);
  const pages = Math.max(1, Math.ceil(list.length / size)); bpPage = Math.min(bpPage, pages - 1);
  const cards = list.slice(bpPage * size, bpPage * size + size).map((p, i) =>
    `<a class="bc" href="blog?id=${+p.id}"><div class="fcv">${cover(p, i)}</div><h3>${esc(p.title)}</h3><span class="meta">${esc(p.author_name || "Pengguna")} · ${esc(ago(p.created_at))}</span></a>`).join("");
  const qs = questions.slice(0, 6).map(q => `<li><a href="tanya?id=${+q.id}"><span class="tag">${esc(q.category)}</span><span class="qt">${esc(q.title)}</span><em>${+q.answer_count} jawaban</em></a></li>`).join("");
  $("modules").innerHTML =
    `<a class="promo" href="blog"><div><b>Tulis blog pertamamu di Niflax</b><span>Bagikan cerita, tips, atau pengalamanmu. Cukup masuk dengan Google atau kode email.</span></div><span class="pill">Mulai menulis ›</span></a>` +
    `<section class="pn stand"><div class="pn-tabs"><b>Jelajah</b><a href="blog">Blog</a><a href="tanya">Tanya Jawab</a><a href="layanan">Layanan</a></div>` +
      `<div class="hline"><b class="hk">Terbaru</b><span class="ht">${first ? `<a href="${first[0]}">${esc(first[1])}</a>` : `<span class="dim">Belum ada tulisan. Jadilah yang pertama.</span>`}</span><span class="hr"><a href="blog">Blog</a><a href="tanya">Tanya Jawab</a></span></div>` +
      `<div class="tiles">${tiles.map(([id, nm, to, c]) => `<a href="${to}"${to[0] === "#" ? ` data-go="${to.slice(1)}"` : ""}>${ic(id, c)}<span>${esc(nm)}</span></a>`).join("")}</div></section>` +
    `<section class="pn bp"><div class="pn-tabs"><b>Blog pilihan</b><a href="blog">Lihat semua</a><span class="pn-r">${bpPage + 1}/${pages}</span></div>` +
      `<div class="bp-body"><ul class="tags">${["Semua", ...BC].map(c => `<li><button type="button" data-bpc="${esc(c)}" aria-pressed="${c === bpCat}">#${esc(c)}</button></li>`).join("")}</ul>` +
      `<div class="bp-grid">${cards || skel(size)}</div></div>` +
      (cards ? "" : `<p class="mnote">${posts.length ? "Belum ada tulisan di kategori ini." : `Belum ada tulisan. <a href="blog">Tulis yang pertama</a>.`}</p>`) +
      `<div class="pager"><button type="button" data-bpp="-1" aria-label="Sebelumnya"${bpPage === 0 ? " disabled" : ""}>‹</button><span>Blog ${bpPage + 1}/${pages}</span><button type="button" data-bpp="1" aria-label="Berikutnya"${bpPage >= pages - 1 ? " disabled" : ""}>›</button></div></section>` +
    `<section class="pn"><div class="pn-h"><h2>Tanya Jawab terbaru</h2><a href="tanya">Lihat semua ›</a></div>${qs ? `<ul class="qlist">${qs}</ul>` : `<p class="mnote">Belum ada pertanyaan. <a href="tanya">Tanya sesuatu</a>.</p>`}</section>`;
}
mq.addEventListener && mq.addEventListener("change", () => renderModules());
function renderCal(){
  const t = new Date(new Date().toLocaleString("en-US", {timeZone:TZ.WIB})), y = t.getFullYear(), m = t.getMonth(), d = t.getDate();
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({length:first}, () => "<i></i>").concat(Array.from({length:days}, (_, i) => `<span${i + 1 === d ? ' class="now"' : ""}>${i + 1}</span>`)).join("");
  $("cal").innerHTML = `<div class="sh"><h2>Kalender</h2><small>${t.toLocaleDateString("id-ID", {month:"long", year:"numeric"})}</small></div><div class="calw"><div class="cbig"><b>${d}</b><span>${t.toLocaleDateString("id-ID", {weekday:"long"})}</span></div><div class="cal"><b>Min</b><b>Sen</b><b>Sel</b><b>Rab</b><b>Kam</b><b>Jum</b><b>Sab</b>${cells}</div></div>`;
}
const renderNews = renderFeed;      // auth.js memanggil nama lama ini

/* ---------- Bagian statis ---------- */
function renderStatic(){
  $("ticker").innerHTML = `<span class="date" id="clocks"></span>`;      // hanya jam WIB/WITA/WIT (dihitung di browser)
  $("chips").innerHTML = quick.map(c => `<button type="button">${esc(c)}</button>`).join("");
}
let ti = 0;
function rotate(){                       // kata kunci populer dari tabel searches; baris disembunyikan bila belum ada
  const row = $("trendRow"), el = $("trendText");
  if(!trending.length){ row.hidden = true; return; }
  row.hidden = false; el.style.opacity = 0;
  setTimeout(() => { el.textContent = (ti % trending.length + 1) + ". " + trending[ti % trending.length]; el.style.opacity = 1; ti++; }, 300);
}
