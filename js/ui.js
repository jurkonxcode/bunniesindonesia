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

function feedItems(){
  const nw = news.filter(n => !onlySaved || saved.has(n.id));
  const N = nw.map(n => ({h:i => cNews(n, i)}));
  const Q = questions.map(q => ({h:() => cQuestion(q)}));
  if(tab === "Berita") return N;
  if(tab === "Tanya") return Q;
  if(tab !== "Semua") return nw.filter(n => n.category === tab).map(n => ({h:i => cNews(n, i)}));
  if(onlySaved) return N;
  // Semua: berita diselingi satu pertanyaan tiap dua berita; sisa pertanyaan di akhir
  const out = [], rest = Q.slice();
  N.forEach((x, i) => { out.push(x); if(i % 2 === 1 && rest.length) out.push(rest.shift()); });
  return out.concat(rest);
}
/* Tab hanya tampil bila ada isinya: Berita dan kategori muncul setelah berita nyata masuk. */
function tabList(){
  const urut = Object.keys(CAT_ART), pos = c => urut.indexOf(c) < 0 ? 99 : urut.indexOf(c);
  const cats = [...new Set(news.map(n => n.category).filter(Boolean))].sort((a, b) => pos(a) - pos(b));
  return [["Semua","Semua"], ...(news.length ? [["Berita","Berita"], ...cats.map(c => [c, c])] : []), ["Tanya","Tanya Jawab"]];
}
/* v14: baris ikon layanan di bawah kotak cari (mengacu pola portal besar). [ikon, nama, tujuan, warna, tab]
   tujuan "#..." = gulir ke alat; tanpa tujuan tapi ada tab = membuka tab umpan bila kategorinya sudah ada isinya; selain itu "segera". */
const SVC = [["tanya","Tanya","tanya","g4"],["sholat","Sholat","#tool-sholat","g2"],["libur","Libur","#tool-libur","g1"],
  ["berita","Berita","","g1","Berita"],["bola","Bola","","g5","Bola"],["hiburan","Hiburan","","g4","Hiburan"],["kuliner","Kuliner","","g3","Kuliner"],
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
const EXTNOTE = "Kartu bertanda \"Sumber luar\" adalah judul berita yang dikutip lewat RSS dari media lain, bukan tulisan Niflax. Ketuk untuk membacanya langsung di Niflax.";
const NOTE = "Berita belum tersedia. Kami sedang menyiapkan sumber berita yang berizin. Sementara itu, jelajahi Tanya Jawab dan alat harian di bawah.";
function renderFeed(){
  renderTabs(); renderSvr();
  const items = feedItems();
  $("status").textContent = loadErr ? "Gagal memuat data langsung. Periksa koneksi internetmu lalu muat ulang halaman." : (!news.length && tab !== "Tanya" && !onlySaved ? NOTE : (news.length && tab !== "Tanya" ? EXTNOTE : ""));
  $("feed").innerHTML = items.length ? items.map((x, i) => x.h(i)).join("") :
    `<p class="empty">${onlySaved ? "Belum ada berita tersimpan." : tab === "Tanya" ? "Belum ada pertanyaan. Jadilah yang pertama di <a href=\"tanya\">Tanya Jawab</a>." : "Belum ada isi untuk tab ini."}</p>`;
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
