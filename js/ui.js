/* Tampilan beranda gaya portal: umpan kartu bergambar + tab. Semua teks dari database lewat esc(). */
const ICONS = "assets/icons/niflax-icons.svg";
const ic = (id, c, cls) => `<span class="ic ${c || "g1"} ${cls || ""}"><svg aria-hidden="true"><use href="${ICONS}#n-${id}"/></svg></span>`;
const art = id => `<svg class="art" aria-hidden="true"><use href="${ICONS}#n-${id}"/></svg>`;
const sUrl = u => { try{ const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; }catch(e){ return ""; } };
const grad = i => `--a:${PAL[i % PAL.length][0]};--b:${PAL[i % PAL.length][1]}`;
const rp = n => "Rp" + n.toLocaleString("id-ID");
function ago(d){
  const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000));
  return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : Math.round(m / 1440) + " hari lalu";
}
const when = n => n.time || (n.created_at ? ago(n.created_at) : "");

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
  const body = `<div class="fcv ${RATIO[i % 4]}">${cover(n, i)}</div><div class="fb"><span class="tag">${esc(n.category)}</span><h3>${esc(n.title)}</h3><span class="meta">${esc(n.source)} · ${esc(when(n))}</span></div>`;
  return `<article class="fc">${url ? `<a class="fl" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${body}</a>` : `<div class="fl">${body}</div>`}${saveBtn(n) ? `<div class="fa">${saveBtn(n)}</div>` : ""}</article>`;
}
const cVideo = (v, i) => `<article class="fc"><div class="fl"><div class="fcv b play"><div class="thumb" style="${grad(i + 3)}"><span class="dur">${esc(v.dur)}</span></div></div><div class="fb"><span class="tag">Video <em class="demo">contoh</em></span><h3>${esc(v.title)}</h3></div></div></article>`;
const cProduct = (p, i) => `<article class="fc"><div class="fl"><div class="fcv b"><div class="thumb" style="${grad(i + 4)}">${art("belanja")}<span class="off">-${p.off}%</span></div></div><div class="fb"><span class="tag">Belanja <em class="demo">contoh</em></span><h3>${esc(p.name)}</h3><b class="pr"><s>${rp(p.old)}</s>${rp(p.price)}</b></div></div></article>`;
const cCommunity = (c, i) => `<article class="fc"><div class="fl fcm"><span class="av" style="${grad(i)}">${esc(c.name[0])}</span><div><span class="tag">Komunitas <em class="demo">contoh</em></span><h3>${esc(c.name)}</h3><span class="meta">${esc(c.members)} anggota</span></div></div></article>`;
const cQuestion = q => `<article class="fc"><a class="fl fcm" href="tanya?id=${+q.id}">${ic("tanya", "g4")}<div><span class="tag">Tanya Jawab · ${esc(q.category)}</span><h3>${esc(q.title)}</h3><span class="meta">${q.best_answer_id ? "Terjawab · " : ""}${+q.answer_count} jawaban · ${esc(ago(q.created_at))}</span></div></a></article>`;

function feedItems(){
  const nw = news.filter(n => !onlySaved || saved.has(n.id));
  const N = nw.map(n => ({h:i => cNews(n, i)}));
  const V = videos.map((v, k) => ({h:() => cVideo(v, k)}));
  const P = products.map((p, k) => ({h:() => cProduct(p, k)}));
  const Q = questions.map(q => ({h:() => cQuestion(q)}));
  const C = communities.map((c, k) => ({h:() => cCommunity(c, k)}));
  if(tab === "Berita") return N;
  if(tab === "Video") return V;
  if(tab === "Belanja") return P;
  if(tab === "Tanya") return Q;
  if(tab !== "Semua") return nw.filter(n => n.category === tab).map(n => ({h:i => cNews(n, i)}));
  // Semua: berita diselingi pertanyaan, video, produk, komunitas
  const mix = [Q, V, P, C].map(a => a.slice()), out = [];
  N.forEach((x, i) => { out.push(x); if(i % 2 === 1){ const q = mix[(i >> 1) % 4]; if(q.length) out.push(q.shift()); } });
  mix.forEach(a => out.push(...a));
  return out;
}
function renderTabs(){
  $("ftabs").innerHTML =
    `<a class="qk" href="tanya">${ic("tanya", "g4", "sm")}Tanya</a><a class="qk" href="#tool-resi" id="qkResi">${ic("resi", "g2", "sm")}Resi</a><a class="qk" href="layanan">${ic("menu", "g1", "sm")}Layanan</a><i class="sep"></i>` +
    TABS.map(t => `<button type="button" data-t="${t[0]}" aria-pressed="${t[0] === tab}">${esc(t[1])}</button>`).join("");
}
function renderFeed(){
  const items = feedItems();
  $("feed").innerHTML = items.length ? items.map((x, i) => x.h(i)).join("") :
    `<p class="empty">${onlySaved ? "Belum ada berita tersimpan." : tab === "Tanya" ? "Belum ada pertanyaan. Jadilah yang pertama di <a href=\"tanya\">Tanya Jawab</a>." : "Belum ada isi untuk tab ini."}</p>`;
}
const renderNews = renderFeed;      // auth.js memanggil nama lama ini

/* ---------- Bagian statis ---------- */
function renderStatic(){
  $("ticker").innerHTML = `<span><em class="demo">contoh</em></span>` + ticker.map(t => `<span><b>${t[0]}</b>${t[1]} <span class="${t[3] ? "up" : "down"}">${t[2]}</span></span>`).join("") +
    `<span class="date" id="clocks"></span>`;
  $("chips").innerHTML = quick.map(c => `<button type="button">${esc(c)}</button>`).join("");
  $("mini").innerHTML =
    `<div class="mc">${ic("cuaca", "g2", "sm")}<b>31°</b><span class="lb">Jakarta · cerah berawan</span><em class="demo">contoh</em></div>` +
    `<div class="mc">${ic("kurs", "g1", "sm")}<span>IHSG</span><b>${ticker[0][1]}</b><span class="up">${ticker[0][2]}</span><em class="demo">contoh</em></div>`;
}
function renderTrend(){}            // daftar peringkat dihapus di v12; teks tren berputar lewat rotate()
let ti = 0;
function rotate(){
  const el = $("trendText"); el.style.opacity = 0;
  setTimeout(() => { el.textContent = (ti % trending.length + 1) + ". " + trending[ti % trending.length]; el.style.opacity = 1; ti++; }, 300);
}
