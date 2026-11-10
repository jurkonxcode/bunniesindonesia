/* Halaman hasil pencarian: search_all / search_news + autocomplete + log_search. */
const TABS = [["", "Semua", "all"], ["kabar", "Kabar", "all"], ["member", "Member", "all"], ["blog", "Blog", "blog"], ["tanya", "Tanya Jawab", "question"]];
const KIND = {kabar:"Kabar", member:"Member", post:"Blog", question:"Tanya Jawab"};
const KMAP = {"":null, kabar:"kabar", member:"member", blog:"post", tanya:"question"};
const params = new URLSearchParams(location.search);
let Q = (params.get("q") || "").trim().slice(0, 100);
let T = TABS.some(t => t[0] === params.get("t")) ? params.get("t") : "";
let ALL = [], offset = 0;
const PAGE = 20;

const safeUrl = u => { try{ const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; }catch(e){ return ""; } };
const host = u => { try{ return new URL(u).hostname.replace(/^www\./, ""); }catch(e){ return ""; } };
const grad = i => `--a:${PAL[i % PAL.length][0]};--b:${PAL[i % PAL.length][1]}`;
function ago(d){
  const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000));
  return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : m < 43200 ? Math.round(m / 1440) + " hari lalu" : new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"short", year:"numeric"});
}
function mark(text){                                  // sorot kata kunci, aman dari XSS
  const terms = normalizeQuery(Q).flat.filter(w => w.length >= 2 || /[\u3131-\uD79D]/.test(w)).sort((a, b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if(!terms.length) return esc(text);
  return String(text ?? "").split(new RegExp("(" + terms.join("|") + ")", "i")).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join("");
}
async function rpc(fn, body){
  const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, {method:"POST", headers:{"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY}, body:JSON.stringify(body)});
  if(!r.ok) throw new Error(r.status);
  return r.json();
}
/* Cari di konten asli Bunnies Indonesia (Blog + Tanya Jawab). Gagal diam-diam bila tabelnya belum ada. */
/* v30: kata dipecah, singkatan/gaul/kata dasar ikut dicari (js/kata.js), hasil diurutkan menurut jumlah kata yang cocok. */
const low = s => String(s || "").toLowerCase();
function score(x, nq, phrase){
  const t = low(x.title), b = low(x.body); let sc = 0;
  nq.groups.forEach(g => { if(g.some(v => t.includes(v))) sc += 3; else if(g.some(v => b.includes(v))) sc += 1; });
  if(phrase && t.includes(phrase)) sc += 4;
  return sc;
}
async function searchTable(table, kind, q){
  try{
    const nq = normalizeQuery(q), vs = nq.flat.filter(v => v.length >= 2).slice(0, 16);
    if(!vs.length) return [];
    const phrase = low(q).replace(/[,()*\\%_"]/g, " ").replace(/\s+/g, " ").trim(), orp = vs.flatMap(v => { const e = encodeURIComponent(v); return ["title.ilike.*" + e + "*", "body.ilike.*" + e + "*"]; }).join(",");
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=id,title,body,category,created_at&or=(" + orp + ")&order=created_at.desc&limit=60", {headers:{apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY}});
    if(!r.ok) return [];
    const page = kind === "post" ? "blog" : "tanya";
    return (await r.json()).map((x, i) => ({x, i, sc:score(x, nq, phrase.includes(" ") ? phrase : "")})).sort((a, b) => b.sc - a.sc || a.i - b.i).slice(0, 30)
      .map(({x}) => ({kind, title:x.title, snippet:(x.body || "").slice(0, 200), href:page + "?id=" + (+x.id), source:catLabel(x.category), published_at:x.created_at}));
  }catch(e){ return []; }
}
const searchQuestions = q => searchTable("questions", "question", q), searchPosts = q => searchTable("posts", "post", q);

/* v44: Kabar (data/kabar.json) dan Member (member.html) ikut dicari. Berkasnya statis, jadi dicari di browser tanpa Supabase. */
const MEMBER_NAMA = {grup:"NewJeans grup", minji:"Minji", hanni:"Hanni", danielle:"Danielle", haerin:"Haerin", hyein:"Hyein"};
function rank(list, q){
  const nq = normalizeQuery(q); if(!nq.flat.some(v => v.length >= 2)) return [];
  const phrase = low(q).replace(/\s+/g, " ").trim();
  return list.map((x, i) => ({x, i, sc:score(x, nq, phrase.includes(" ") ? phrase : "")})).filter(o => o.sc > 0)
    .sort((a, b) => b.sc - a.sc || a.i - b.i).slice(0, 30).map(o => o.x);
}
async function searchKabar(q){
  try{
    const r = await fetch("data/kabar.json"); if(!r.ok) return [];
    const j = await r.json();
    const rows = (j.kabar || []).slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map(k => ({
      title:k.judul, body:k.ringkasan + " " + (MEMBER_NAMA[k.member] || "") + " " + (k.sumber_nama || ""),
      r:{kind:"kabar", title:k.judul, snippet:k.ringkasan, url:k.sumber_url, source:(MEMBER_NAMA[k.member] || "Grup") + " · " + (k.sumber_nama || ""), published_at:k.tanggal + "T00:00:00"}
    }));
    return rank(rows, q).map(o => o.r);
  }catch(e){ return []; }
}
async function searchMember(q){
  try{
    const r = await fetch("member.html"); if(!r.ok) return [];
    const doc = new DOMParser().parseFromString(await r.text(), "text/html");
    const rows = [...doc.querySelectorAll("article.mc")].map(a => {
      const h = a.querySelector("h2"), nm = h ? (h.childNodes[0] ? h.childNodes[0].textContent.trim() : "") : a.id;
      const tag = (a.querySelector(".mc-tag") || {}).textContent || "", bio = (a.querySelector(".mc-bio p") || {}).textContent || "";
      return {title:nm, body:a.textContent.replace(/\s+/g, " "), r:{kind:"member", title:nm, snippet:(tag + ". " + bio).slice(0, 200), href:"member#" + a.id, source:"Profil member"}};
    });
    return rank(rows, q).map(o => o.r);
  }catch(e){ return []; }
}

const ART = {kabar:"berita", member:"komunitas", post:"blog", question:"tanya"};
function item(r, i){
  const url = safeUrl(r.url), img = safeUrl(r.image_url);
  const bg = img ? `background-image:url('${esc(img)}'),linear-gradient(135deg,var(--a),var(--b));${grad(i)}` : grad(i);
  const meta = [r.source || host(url), r.published_at ? ago(r.published_at) : r.when].filter(Boolean).map(esc).join(" · ");
  const body = `<div class="thumb" style="${bg}">${img ? "" : `<svg class="art" aria-hidden="true"><use href="assets/icons/bunnies-icons.svg#n-${ART[r.kind] || "berita"}"/></svg>`}</div><div class="tx"><span class="kind">${esc(KIND[r.kind] || "")}</span><h3>${mark(r.title)}</h3>${r.snippet ? `<p>${mark(r.snippet)}</p>` : ""}<span class="meta">${meta}</span></div>`;
  if(r.href) return `<a class="r" href="${esc(r.href)}">${body}</a>`;          // tautan internal (Tanya Jawab)
  return url ? `<a class="r" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${body}</a>` : `<div class="r">${body}</div>`;
}
function empty(title, text, retry){
  return `<div class="sempty"><svg viewBox="0 0 120 120" fill="none" stroke="#ff7fb0" stroke-width="3"><ellipse cx="60" cy="32" rx="14" ry="26"/><ellipse cx="60" cy="88" rx="14" ry="26"/><ellipse cx="32" cy="60" rx="26" ry="14"/><ellipse cx="88" cy="60" rx="26" ry="14"/><circle cx="60" cy="60" r="6" fill="#2f6fe4" stroke="none"/></svg><h2>${esc(title)}</h2><p>${esc(text)}</p>${retry ? `<button class="btn green" id="retry">Coba lagi</button>` : ""}</div>`;
}
function view(){
  const k = KMAP[T], list = k ? ALL.filter(r => r.kind === k) : ALL;
  $("stabs").innerHTML = TABS.map(t => {
    const n = KMAP[t[0]] ? ALL.filter(r => r.kind === KMAP[t[0]]).length : ALL.length;
    return `<button data-t="${t[0]}" aria-pressed="${t[0] === T}">${t[1]}${ALL.length ? " " + n : ""}</button>`;
  }).join("");
  $("sinfo").textContent = (list.length ? `${list.length} hasil untuk “${Q}”` : "");
  const sec = (title, arr) => arr.length ? `<h2 class="sgh">${title} <small>${arr.length}</small></h2>` + arr.map(item).join("") : "";
  $("sres").innerHTML = !list.length ? empty("Belum ada yang cocok", "Coba kata kunci lain, lebih singkat, atau coba juga cari nama member, atau jadilah yang pertama menulis di Blog atau Tanya Jawab.") :
    k ? list.map(item).join("") : sec("Kabar", list.filter(r => r.kind === "kabar")) + sec("Member", list.filter(r => r.kind === "member")) + sec("Blog", list.filter(r => r.kind === "post")) + sec("Tanya Jawab", list.filter(r => r.kind === "question"));
  $("more").hidden = true;
}
async function run(){
  if(Q.length < 2){ $("sres").innerHTML = empty("Mau cari apa?", "Ketik minimal 2 huruf di kotak pencarian."); $("stabs").innerHTML = ""; return; }
  document.title = Q + " – Bunnies Indonesia";
  $("sres").innerHTML = `<p class="sinfo">Mencari…</p>`; offset = 0;
  try{
    if(!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("no config");
    if(T === "blog") ALL = await searchPosts(Q);
    else if(T === "tanya") ALL = await searchQuestions(Q);
    else if(T === "kabar") ALL = await searchKabar(Q);
    else if(T === "member") ALL = await searchMember(Q);
    else{ const [k, m, a, q] = await Promise.all([searchKabar(Q), searchMember(Q), searchPosts(Q), searchQuestions(Q)]); ALL = k.concat(m, a, q); }
    rpc("log_search", {p_query:Q, p_scope:(TABS.find(t => t[0] === T) || TABS[0])[2]}).catch(() => {});
  }catch(e){
    $("stabs").innerHTML = ""; $("sinfo").textContent = ""; $("sres").innerHTML = empty("Gagal memuat hasil", "Periksa koneksi internetmu lalu coba lagi.", true); return;
  }
  view();
}
$("stabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b) return;
  T = b.dataset.t; $("st").value = T;
  const u = new URL(location.href); T ? u.searchParams.set("t", T) : u.searchParams.delete("t"); history.replaceState(null, "", u);
  run();
});
$("sres").addEventListener("click", e => { if(e.target.id === "retry") run(); });
/* Autocomplete */
let st, sel = -1, sugs = [];
const sug = $("sug");
function hide(){ sug.hidden = true; sel = -1; }
$("sq").addEventListener("input", () => {
  clearTimeout(st); const v = $("sq").value.trim();
  if(v.length < 2 || !SUPABASE_URL){ hide(); return; }
  st = setTimeout(async () => {
    try{
      sugs = (await rpc("suggest_keywords", {p_prefix:v, p_limit:6})).map(x => x.keyword);
      if($("sq").value.trim() !== v) return;
      sug.innerHTML = sugs.map((k, i) => `<li role="option" data-i="${i}">${esc(k)}</li>`).join(""); sug.hidden = !sugs.length; sel = -1;
    }catch(e){ hide(); }
  }, 250);
});
$("sq").addEventListener("keydown", e => {
  if(sug.hidden) return;
  if(e.key === "ArrowDown" || e.key === "ArrowUp"){
    e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + sugs.length) % sugs.length;
    [...sug.children].forEach((li, i) => li.setAttribute("aria-selected", i === sel));
    $("sq").value = sugs[sel];
  }else if(e.key === "Escape") hide();
});
sug.addEventListener("mousedown", e => { const li = e.target.closest("li"); if(li){ e.preventDefault(); $("sq").value = sugs[+li.dataset.i]; $("sform").requestSubmit(); } });
document.addEventListener("click", e => { if(!e.target.closest("#sform")) hide(); });

$("sq").value = Q; $("st").value = T;
run();
