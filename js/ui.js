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

/* ---------- Kartu umpan ---------- */
const RATIO = ["a", "b", "c", "b"];
const saveBtn = n => session && n.id ? `<button class="save" data-save="${n.id}" aria-pressed="${saved.has(n.id)}">${saved.has(n.id) ? "Tersimpan" : "Simpan"}</button>` : "";
function cNews(n, i){
  const url = sUrl(n.url);
  const body = `<div class="fcv ${RATIO[i % 4]}">${cover(n, i)}</div><div class="fb"><span class="tag">${esc(n.category)}</span><span class="ext" title="Dikutip dari RSS ${esc(n.source || "media lain")}. Dibaca di dalam Niflax.">Sumber luar</span><h3>${esc(n.title)}</h3><span class="meta">${esc(n.source)} · ${esc(when(n))}</span></div>`;
  return `<article class="fc">${url ? `<a class="fl" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${body}</a>` : `<div class="fl">${body}</div>`}${saveBtn(n) ? `<div class="fa">${saveBtn(n)}</div>` : ""}</article>`;
}
const cQuestion = q => `<article class="fc"><a class="fl fcm" href="tanya?id=${+q.id}">${ic("tanya", "g4")}<div><span class="tag">Tanya Jawab · ${esc(q.category)}</span><span class="ext in" title="Ditulis oleh pengguna Niflax">Dari Niflax</span><h3>${esc(q.title)}</h3><span class="meta">${q.best_answer_id ? "Terjawab · " : ""}${+q.answer_count} jawaban · ${esc(ago(q.created_at))}</span></div></a></article>`;

const cPost = p => `<article class="fc"><a class="fl fcm" href="blog?id=${+p.id}">${ic("blog", "g1")}<div><span class="tag">Blog · ${esc(p.category)}</span><span class="ext in" title="Ditulis oleh pengguna Niflax">Dari Niflax</span><h3>${esc(p.title)}</h3><span class="meta">${esc(p.author_name || "Pengguna")} · ${esc(ago(p.created_at))}</span></div></a></article>`;
function feedItems(){
  const P = posts.map(p => ({h:() => cPost(p)})), Q = questions.map(q => ({h:() => cQuestion(q)}));
  if(tab === "Blog") return P;
  if(tab === "Tanya") return Q;
  const out = [], rest = Q.slice();                         // Semua: tulisan diselingi satu pertanyaan tiap dua tulisan
  P.forEach((x, i) => { out.push(x); if(i % 2 === 1 && rest.length) out.push(rest.shift()); });
  return out.concat(rest);
}
function tabList(){ return [["Semua","Semua"], ["Blog","Blog"], ["Tanya","Tanya Jawab"]]; }
/* v14: baris ikon layanan di bawah kotak cari (mengacu pola portal besar). [ikon, nama, tujuan, warna, tab]
   tujuan "#..." = gulir ke alat; tanpa tujuan tapi ada tab = membuka tab umpan bila kategorinya sudah ada isinya; selain itu "segera". */
const SVC = [["tanya","Tanya","tanya","g4"],["sholat","Sholat","#tool-sholat","g2"],["libur","Libur","#tool-libur","g1"],
  ["blog","Blog","blog","g1"],["bola","Bola","","g5","Bola"],["hiburan","Hiburan","","g4","Hiburan"],["kuliner","Kuliner","","g3","Kuliner"],
  ["belanja","Belanja","","g2"],["video","Video","","g3"],["menu","Semua","layanan","g6"]];
function renderSvr(){
  const have = new Set(tabList().map(t => t[0]));
  $("svr").innerHTML = SVC.map(([id, nm, to, c, t]) => {
    const body = `${ic(id, c)}<span class="nm">${esc(nm)}</span>`;
    if(to && to[0] === "#") return `<a class="ik" href="${to}" data-go="${to.slice(1)}">${body}</a>`;
    if(to) return `<a class="ik" href="${to}">${body}</a>`;
    if(t && have.has(t)) return `<button type="button" class="ik" data-t="${esc(t)}">${body}</button>`;
    return `<span class="ik off" aria-disabled="true">${body}<em>segera</em></span>`;
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
/* ---------- v21: modul ala portal (kotak berjudul + isi / kerangka kosong) ---------- */
const skel = n => Array.from({length:n}, () => `<div class="sk"><i></i><b></b><b></b></div>`).join("");
const mod = (t, more, body, cls = "") => `<section class="mod ${cls}"><div class="mh"><h2>${t}</h2>${more ? `<a href="${more[0]}">${more[1]} ›</a>` : ""}</div>${body}</section>`;
function renderModules(){
  const pc = posts.slice(0, 5).map(p => `<a class="pc" href="blog?id=${+p.id}"><div class="pt">${ic("blog", "g1")}</div><h3>${esc(p.title)}</h3><span class="meta">${esc(p.author_name || "Pengguna")} · ${esc(ago(p.created_at))}</span></a>`).join("");
  const qs = questions.slice(0, 5).map(q => `<li><a href="tanya?id=${+q.id}"><span class="tag">${esc(q.category)}</span>${esc(q.title)}<em>${+q.answer_count} jawaban</em></a></li>`).join("");
  $("modules").innerHTML =
    `<a class="promo" href="blog"><div><b>Ruang promo Niflax</b><span>Tempat banner dan pengumuman. Belum ada isi.</span></div><span class="btn green">Tulis di Blog</span></a>` +
    mod("Blog pilihan", ["blog", "Lihat semua"], pc ? `<div class="pgrid">${pc}</div>` : `<div class="pgrid">${skel(5)}</div><p class="mnote">Belum ada tulisan. <a href="blog">Tulis yang pertama</a>.</p>`) +
    mod("Tanya Jawab terbaru", ["tanya", "Lihat semua"], qs ? `<ul class="qlist">${qs}</ul>` : `<p class="mnote">Belum ada pertanyaan. <a href="tanya">Tanya sesuatu</a>.</p>`) +
    mod("Kategori pilihan", ["blog", "Jelajah"], `<div class="chipr">${["Teknologi","Ekonomi","Kuliner","Otomotif","Olahraga","Hiburan","Catatan harian"].map(c => `<a href="blog">${c}</a>`).join("")}</div>`) +
    `<div class="mh2"><h2>Jelajah</h2></div>`;
}
function renderCal(){
  const t = new Date(new Date().toLocaleString("en-US", {timeZone:TZ.WIB})), y = t.getFullYear(), m = t.getMonth(), d = t.getDate();
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({length:first}, () => "<i></i>").concat(Array.from({length:days}, (_, i) => `<span${i + 1 === d ? ' class="now"' : ""}>${i + 1}</span>`)).join("");
  $("cal").innerHTML = `<div class="sh"><h2>Kalender</h2><small>${t.toLocaleDateString("id-ID", {month:"long", year:"numeric"})}</small></div><div class="cal"><b>Min</b><b>Sen</b><b>Sel</b><b>Rab</b><b>Kam</b><b>Jum</b><b>Sab</b>${cells}</div>`;
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
