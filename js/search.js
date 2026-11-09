/* Halaman hasil pencarian: search_all / search_news + autocomplete + log_search. */
const TABS = [["", "Semua", "all"], ["berita", "Berita", "news"], ["video", "Video", "video"], ["belanja", "Belanja", "all"], ["komunitas", "Komunitas", "community"]];
const KIND = {news:"Berita", video:"Video", product:"Belanja", community:"Komunitas"};
const KMAP = {"":null, berita:"news", video:"video", belanja:"product", komunitas:"community"};
const params = new URLSearchParams(location.search);
let Q = (params.get("q") || "").trim().slice(0, 100);
let T = TABS.some(t => t[0] === params.get("t")) ? params.get("t") : "";
let ALL = [], offset = 0, demo = false;
const PAGE = 20;

const safeUrl = u => { try{ const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; }catch(e){ return ""; } };
const host = u => { try{ return new URL(u).hostname.replace(/^www\./, ""); }catch(e){ return ""; } };
const grad = i => `--a:${PAL[i % PAL.length][0]};--b:${PAL[i % PAL.length][1]}`;
function ago(d){
  const m = Math.max(1, Math.round((Date.now() - new Date(d)) / 60000));
  return m < 60 ? m + " menit lalu" : m < 1440 ? Math.round(m / 60) + " jam lalu" : m < 43200 ? Math.round(m / 1440) + " hari lalu" : new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"short", year:"numeric"});
}
function mark(text){                                  // sorot kata kunci, aman dari XSS
  const terms = Q.split(/\s+/).filter(w => w.length >= 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if(!terms.length) return esc(text);
  return String(text ?? "").split(new RegExp("(" + terms.join("|") + ")", "i")).map((p, i) => i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)).join("");
}
async function rpc(fn, body){
  const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, {method:"POST", headers:{"Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY}, body:JSON.stringify(body)});
  if(!r.ok) throw new Error(r.status);
  return r.json();
}
function demoSearch(){                                // cadangan bila Supabase tidak terjangkau
  const q = Q.toLowerCase(), has = s => String(s || "").toLowerCase().includes(q);
  return [
    ...demoNews.filter(n => has(n.title) || has(n.summary)).map(n => ({kind:"news", title:n.title, snippet:n.summary, url:"", image_url:"", source:n.source, when:n.time})),
    ...videos.filter(v => has(v.title)).map(v => ({kind:"video", title:v.title, snippet:v.dur, url:"", image_url:""})),
    ...products.filter(p => has(p.name)).map(p => ({kind:"product", title:p.name, snippet:rp(p.price), url:"", image_url:""}))
  ];
}
const rp = n => "Rp" + Number(n).toLocaleString("id-ID");

function item(r, i){
  const url = safeUrl(r.url), img = safeUrl(r.image_url);
  const bg = img ? `background-image:url('${esc(img)}'),linear-gradient(135deg,var(--a),var(--b));${grad(i)}` : grad(i);
  const meta = [r.source || host(url), r.published_at ? ago(r.published_at) : r.when].filter(Boolean).map(esc).join(" · ");
  const body = `<div class="thumb" style="${bg}"></div><div class="tx"><span class="kind">${esc(KIND[r.kind] || "")}</span><h3>${mark(r.title)}</h3>${r.snippet ? `<p>${mark(r.snippet)}</p>` : ""}<span class="meta">${meta}</span></div>`;
  return url ? `<a class="r" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${body}</a>` : `<div class="r">${body}</div>`;
}
function empty(title, text, retry){
  return `<div class="sempty"><svg viewBox="0 0 120 120" fill="none" stroke="#F5A524" stroke-width="3"><ellipse cx="60" cy="32" rx="14" ry="26"/><ellipse cx="60" cy="88" rx="14" ry="26"/><ellipse cx="32" cy="60" rx="26" ry="14"/><ellipse cx="88" cy="60" rx="26" ry="14"/><circle cx="60" cy="60" r="6" fill="#17A862" stroke="none"/></svg><h2>${esc(title)}</h2><p>${esc(text)}</p>${retry ? `<button class="btn green" id="retry">Coba lagi</button>` : ""}</div>`;
}
function view(){
  const k = KMAP[T], list = k ? ALL.filter(r => r.kind === k) : ALL;
  $("stabs").innerHTML = TABS.map(t => {
    const n = KMAP[t[0]] ? ALL.filter(r => r.kind === KMAP[t[0]]).length : ALL.length;
    return `<button data-t="${t[0]}" aria-pressed="${t[0] === T}">${t[1]}${ALL.length ? " " + n : ""}</button>`;
  }).join("");
  $("sinfo").textContent = (demo ? "Data contoh (server tidak terjangkau). " : "") + (list.length ? `${list.length} hasil untuk “${Q}”` : "");
  $("sres").innerHTML = list.length ? list.map(item).join("") : empty("Belum ada yang cocok", "Coba kata kunci lain, lebih singkat, atau periksa ejaannya.");
  $("more").hidden = !(T === "berita" && list.length && list.length % PAGE === 0 && !demo);
}
async function run(){
  if(Q.length < 2){ $("sres").innerHTML = empty("Mau cari apa?", "Ketik minimal 2 huruf di kotak pencarian."); $("stabs").innerHTML = ""; return; }
  document.title = Q + " – Niflax";
  $("sres").innerHTML = `<p class="sinfo">Mencari…</p>`; offset = 0; demo = false;
  try{
    if(!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("no config");
    ALL = T === "berita" ? (await rpc("search_news", {p_query:Q, p_limit:PAGE, p_offset:0})).map(r => ({...r, kind:"news"})) : await rpc("search_all", {p_query:Q, p_limit:50});
    if(T === "berita") offset = ALL.length;
    rpc("log_search", {p_query:Q, p_scope:(TABS.find(t => t[0] === T) || TABS[0])[2]}).catch(() => {});
  }catch(e){
    if(SUPABASE_URL && SUPABASE_ANON_KEY){ $("stabs").innerHTML = ""; $("sinfo").textContent = ""; $("sres").innerHTML = empty("Gagal memuat hasil", "Periksa koneksi internetmu lalu coba lagi.", true); return; }
    ALL = demoSearch(); demo = true;
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
$("more").addEventListener("click", async () => {
  try{
    const more = (await rpc("search_news", {p_query:Q, p_limit:PAGE, p_offset:offset})).map(r => ({...r, kind:"news"}));
    ALL = ALL.concat(more); offset += more.length; view(); if(more.length < PAGE) $("more").hidden = true;
  }catch(e){ $("sinfo").textContent = "Gagal memuat lagi. Coba sebentar lagi."; }
});

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
