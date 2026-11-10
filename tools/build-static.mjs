#!/usr/bin/env node
/* Bunnies Indonesia v25: pembuat halaman statis untuk SEO (tanpa dependensi, Node 18+).
   Membaca tabel posts, questions, answers dari Supabase (kunci PUBLIK, hanya baca; RLS sudah menyembunyikan konten status 'hidden'),
   lalu menulis ke dist/: salinan situs + /tulisan/<id>.html + /pertanyaan/<id>.html + arsip.html + sitemap.xml + robots.txt.
   Pemakaian:  node tools/build-static.mjs            (butuh internet; kunci dibaca dari js/config.js atau env)
               node tools/build-static.mjs --fixture contoh.json   (uji tanpa internet: {"posts":[],"questions":[],"answers":[]})
   Env:  SITE_URL (bawaan https://jurkonxcode.github.io/bunniesindonesia; isi https://bunniesindonesia.com setelah domain aktif)
         SUPABASE_URL, SUPABASE_ANON_KEY (bawaan: dibaca dari js/config.js)
   Teks pengguna SELALU lewat esc(). Tidak ada HTML dari pengguna yang dirender. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");
const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const SITE = (process.env.SITE_URL || "https://jurkonxcode.github.io/bunniesindonesia").replace(/\/+$/, "");
const BASE = new URL(SITE).pathname.replace(/\/+$/, "");          // "" bila di domain sendiri, "/bunnies" bila di github.io/bunnies
const MIN_POST = 120;          // tulisan lebih pendek dari ini (huruf) diberi noindex dan tidak masuk sitemap (konten tipis)
const MAX_URLS = 45000;        // batas aman per berkas sitemap (batas Google 50.000)
const ARSIP_MAX = 3000;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const flat = s => String(s ?? "").replace(/\s+/g, " ").trim();
const cut = (s, n) => { s = flat(s); if (s.length <= n) return s; const t = s.slice(0, n - 1); return t.slice(0, Math.max(t.lastIndexOf(" "), n * 0.6)).replace(/[,;:.\-–\s]+$/, "") + "…"; };
const jld = o => JSON.stringify(o).replace(/</g, "\\u003c");
const day = d => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const paras = t => String(t ?? "").trim().split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("\n");
const abs = p => SITE + p, rel = p => BASE + p;

/* ---------- data ---------- */
function creds(){
  let url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    const c = fs.readFileSync(path.join(ROOT, "js/config.js"), "utf8");
    url = url || (c.match(/SUPABASE_URL\s*=\s*"([^"]+)"/) || [])[1];
    key = key || (c.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/) || [])[1];
  }
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY belum terisi");
  return { url: url.replace(/\/+$/, ""), key };
}
async function all(table, select, order){
  const { url, key } = creds(), rows = [], step = 1000;
  for (let off = 0; ; off += step) {
    const r = await fetch(`${url}/rest/v1/${table}?select=${select}&order=${order}&limit=${step}&offset=${off}`, { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
    const part = await r.json(); rows.push(...part);
    if (part.length < step) return rows;
  }
}
async function load(){
  const fx = arg("--fixture");
  if (fx) { const j = JSON.parse(fs.readFileSync(fx, "utf8")); return { posts: j.posts || [], questions: j.questions || [], answers: j.answers || [] }; }
  const [posts, questions, answers] = await Promise.all([
    all("posts", "id,title,body,category,author_name,created_at", "id.asc").catch(e => { console.warn("posts dilewati:", e.message); return []; }),
    all("questions", "id,title,body,category,author_name,answer_count,best_answer_id,created_at", "id.asc").catch(e => { console.warn("questions dilewati:", e.message); return []; }),
    all("answers", "id,question_id,body,author_name,created_at", "created_at.asc").catch(e => { console.warn("answers dilewati:", e.message); return []; })
  ]);
  return { posts, questions, answers };
}

/* ---------- kerangka halaman ---------- */
function shell({ title, desc, path: p, robots, body, ld = [], type = "article" }){
  const t = esc(title.length > 60 ? cut(title, 58) : title) + " – Bunnies Indonesia";
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${esc(cut(desc, 158))}">
<link rel="canonical" href="${esc(abs(p))}">
<meta name="robots" content="${robots}">
<link rel="icon" href="${rel("/assets/brand/favicon.svg")}" type="image/svg+xml">
<meta name="theme-color" content="#2f6fe4">
<meta property="og:site_name" content="Bunnies Indonesia"><meta property="og:locale" content="id_ID"><meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(cut(desc, 200))}"><meta property="og:url" content="${esc(abs(p))}">
<meta property="og:image" content="${esc(abs("/assets/brand/og-image.png"))}"><meta name="twitter:card" content="summary_large_image">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel("/css/tokens.css")}"><link rel="stylesheet" href="${rel("/css/base.css")}"><link rel="stylesheet" href="${rel("/css/page.css")}"><link rel="stylesheet" href="${rel("/css/static.css")}">
${ld.map(o => `<script type="application/ld+json">${jld(o)}</script>`).join("\n")}
</head><body class="page st">
<header class="st-top"><div class="wrap">
  <a class="logo" href="${rel("/")}"><img src="${rel("/assets/brand/logo-mark.svg")}" alt="" width="28" height="28">bunnies</a>
  <form class="st-search" action="${rel("/search")}" role="search"><input type="search" name="q" placeholder="Cari tulisan atau pertanyaan" aria-label="Cari"><button aria-label="Cari">Cari</button></form>
  <nav aria-label="Menu"><a href="${rel("/tanya")}">Tanya Jawab</a><a href="${rel("/blog")}">Blog</a></nav>
</div></header>
<main class="wrap st-main">
${body}
</main>
<footer class="st-foot"><div class="wrap"><a href="${rel("/")}">Beranda</a> · <a href="${rel("/arsip")}">Arsip</a> · <a href="${rel("/tentang")}">Tentang</a> · <a href="${rel("/privasi")}">Privasi</a> · <a href="${rel("/syarat")}">Syarat</a><p>© ${new Date().getFullYear()} Bunnies Indonesia. Tulisan dan pertanyaan dibuat oleh pengguna.</p></div></footer>
</body></html>`;
}
const crumbs = items => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: abs(p) })) });
const crumbHtml = items => `<nav class="crumb" aria-label="Jejak halaman">${items.map(([n, p], i) => i < items.length - 1 ? `<a href="${rel(p)}">${esc(n)}</a>` : `<span>${esc(n)}</span>`).join(" › ")}</nav>`;
const person = n => ({ "@type": "Person", name: n || "Pengguna" });
const ORG = { "@type": "Organization", name: "Bunnies Indonesia", url: abs("/"), logo: { "@type": "ImageObject", url: abs("/assets/brand/icon-512.png") } };

/* ---------- halaman ---------- */
function pagePost(p, byCat){
  const url = `/tulisan/${p.id}`, thin = flat(p.body).length < MIN_POST;
  const more = (byCat.get(p.category) || []).filter(x => x.id !== p.id).slice(-6).reverse();
  const bc = [["Beranda", "/"], ["Blog", "/blog"], [p.category, `/blog?cat=${encodeURIComponent(p.category)}`], [p.title, url]];
  return shell({
    title: p.title, desc: p.body, path: url, robots: thin ? "noindex,follow" : "index,follow,max-snippet:-1,max-image-preview:large",
    ld: thin ? [] : [{ "@context": "https://schema.org", "@type": "BlogPosting", headline: cut(p.title, 110), description: cut(p.body, 200), articleSection: p.category, inLanguage: "id",
      datePublished: new Date(p.created_at).toISOString(), dateModified: new Date(p.created_at).toISOString(), author: person(p.author_name), publisher: ORG, mainEntityOfPage: abs(url) }, crumbs(bc)],
    body: `${crumbHtml(bc)}
<article class="st-art"><span class="kind">${esc(p.category)}</span><h1>${esc(p.title)}</h1>
<p class="by">${esc(p.author_name || "Pengguna")} · <time datetime="${new Date(p.created_at).toISOString()}">${day(p.created_at)}</time></p>
<div class="txt">${paras(p.body)}</div></article>
<div class="st-cta"><b>Punya cerita sendiri?</b><span>Tulis di Blog Bunnies Indonesia, gratis.</span><a class="btn green" href="${rel("/blog")}">Mulai menulis</a></div>
${more.length ? `<section class="st-more"><h2>Tulisan lain di ${esc(p.category)}</h2><ul>${more.map(x => `<li><a href="${rel(`/tulisan/${x.id}`)}">${esc(x.title)}</a><span>${esc(x.author_name || "Pengguna")} · ${day(x.created_at)}</span></li>`).join("")}</ul></section>` : ""}`
  });
}
function pageQuestion(q, ans, byCat){
  const url = `/pertanyaan/${q.id}`, has = ans.length > 0;
  const best = ans.find(a => a.id === q.best_answer_id), rest = ans.filter(a => a !== best), ordered = best ? [best, ...rest] : ans;
  const more = (byCat.get(q.category) || []).filter(x => x.id !== q.id).slice(-6).reverse();
  const bc = [["Beranda", "/"], ["Tanya Jawab", "/tanya"], [q.category, `/tanya?cat=${encodeURIComponent(q.category)}`], [q.title, url]];
  const A = a => ({ "@type": "Answer", text: cut(a.body, 3000), datePublished: new Date(a.created_at).toISOString(), author: person(a.author_name), url: abs(url) + "#j" + a.id, upvoteCount: 0 });
  const qa = { "@context": "https://schema.org", "@type": "QAPage", mainEntity: { "@type": "Question", name: q.title, text: q.body || q.title, answerCount: ans.length, upvoteCount: 0,
    datePublished: new Date(q.created_at).toISOString(), author: person(q.author_name), ...(best ? { acceptedAnswer: A(best) } : {}), ...(rest.length ? { suggestedAnswer: rest.map(A) } : {}) } };
  return shell({
    title: q.title, desc: has ? ordered[0].body : (q.body || q.title), path: url, robots: has ? "index,follow,max-snippet:-1" : "noindex,follow",
    ld: has ? [qa, crumbs(bc)] : [],
    body: `${crumbHtml(bc)}
<article class="st-art"><span class="kind">Tanya Jawab · ${esc(q.category)}</span>${best ? `<span class="ok">Terjawab</span>` : ""}<h1>${esc(q.title)}</h1>
<p class="by">${esc(q.author_name || "Pengguna")} · <time datetime="${new Date(q.created_at).toISOString()}">${day(q.created_at)}</time></p>
${q.body ? `<div class="txt">${paras(q.body)}</div>` : ""}</article>
<section class="st-ans"><h2>${ans.length} jawaban</h2>
${has ? ordered.map(a => `<div class="ans${a === best ? " best" : ""}" id="j${+a.id}">${a === best ? `<span class="ok">Jawaban terbaik</span>` : ""}<div class="txt">${paras(a.body)}</div><p class="by">${esc(a.author_name || "Pengguna")} · ${day(a.created_at)}</p></div>`).join("\n") : `<p class="empty">Belum ada jawaban.</p>`}
</section>
<div class="st-cta"><b>${has ? "Punya jawaban lain?" : "Kamu bisa jawab ini?"}</b><span>Masuk lalu jawab langsung di Bunnies Indonesia.</span><a class="btn green" href="${rel(`/tanya?id=${+q.id}`)}">${has ? "Tambah jawaban" : "Jawab sekarang"}</a></div>
${more.length ? `<section class="st-more"><h2>Pertanyaan lain di ${esc(q.category)}</h2><ul>${more.map(x => `<li><a href="${rel(`/pertanyaan/${x.id}`)}">${esc(x.title)}</a><span>${+x.answer_count || 0} jawaban · ${day(x.created_at)}</span></li>`).join("")}</ul></section>` : ""}`
  });
}
function pageArsip(posts, questions){
  const li = (u, t, m) => `<li><a href="${rel(u)}">${esc(t)}</a><span>${m}</span></li>`;
  return shell({
    title: "Arsip tulisan dan pertanyaan", desc: "Daftar semua tulisan Blog dan pertanyaan Tanya Jawab di Bunnies Indonesia.", path: "/arsip", robots: "index,follow",
    body: `<h1>Arsip</h1><p class="by">Semua tulisan dan pertanyaan yang bisa dibaca tanpa masuk.</p>
<section class="st-more"><h2>Tulisan Blog</h2>${posts.length ? `<ul>${posts.slice(-ARSIP_MAX).reverse().map(p => li(`/tulisan/${p.id}`, p.title, `${esc(p.category)} · ${day(p.created_at)}`)).join("")}</ul>` : `<p class="empty">Belum ada tulisan.</p>`}</section>
<section class="st-more"><h2>Tanya Jawab</h2>${questions.length ? `<ul>${questions.slice(-ARSIP_MAX).reverse().map(q => li(`/pertanyaan/${q.id}`, q.title, `${esc(q.category)} · ${+q.answer_count || 0} jawaban`)).join("")}</ul>` : `<p class="empty">Belum ada pertanyaan.</p>`}</section>`
  });
}

/* ---------- salin situs + tulis ---------- */
const SKIP = new Set(["tools", "supabase", ".github", ".git", "node_modules", "dist", "HANDOFF.md", "README.md"]);
function copySite(){
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  for (const n of fs.readdirSync(ROOT)) {
    if (SKIP.has(n) || n.endsWith(".zip") || n.startsWith(".") && n !== ".nojekyll") continue;
    fs.cpSync(path.join(ROOT, n), path.join(OUT, n), { recursive: true });
  }
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
}
function write(p, s){ const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); }
const xml = u => `<url><loc>${esc(abs(u[0]))}</loc>${u[1] ? `<lastmod>${new Date(u[1]).toISOString().slice(0, 10)}</lastmod>` : ""}</url>`;
function sitemaps(urls){
  const head = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  if (urls.length <= MAX_URLS) { write("sitemap.xml", head + urls.map(xml).join("\n") + "\n</urlset>\n"); return; }
  const n = Math.ceil(urls.length / MAX_URLS), idx = [];
  for (let i = 0; i < n; i++) { write(`sitemap-${i + 1}.xml`, head + urls.slice(i * MAX_URLS, (i + 1) * MAX_URLS).map(xml).join("\n") + "\n</urlset>\n"); idx.push(`<sitemap><loc>${esc(abs(`/sitemap-${i + 1}.xml`))}</loc></sitemap>`); }
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${idx.join("\n")}\n</sitemapindex>\n`);
}

const { posts, questions, answers } = await load();
copySite();
const byQ = new Map(); for (const a of answers) (byQ.get(+a.question_id) || byQ.set(+a.question_id, []).get(+a.question_id)).push(a);
const grp = list => { const m = new Map(); for (const x of list) (m.get(x.category) || m.set(x.category, []).get(x.category)).push(x); return m; };
const pCat = grp(posts), qCat = grp(questions);
const urls = [["/"], ["/tanya"], ["/blog"], ["/layanan"], ["/tentang"], ["/ko/"], ["/ko/member"], ["/ko/tentang"], ["/privasi"], ["/syarat"], ["/arsip"]], seen = new Set();
let np = 0, nq = 0;
for (const p of posts) {
  if (!p.id || seen.has("p" + p.id)) continue; seen.add("p" + p.id);
  write(`tulisan/${+p.id}.html`, pagePost(p, pCat)); np++;
  if (flat(p.body).length >= MIN_POST) urls.push([`/tulisan/${+p.id}`, p.created_at]);
}
for (const q of questions) {
  if (!q.id || seen.has("q" + q.id)) continue; seen.add("q" + q.id);
  const ans = byQ.get(+q.id) || [];
  write(`pertanyaan/${+q.id}.html`, pageQuestion(q, ans, qCat)); nq++;
  if (ans.length) urls.push([`/pertanyaan/${+q.id}`, ans[ans.length - 1].created_at]);
}
write("arsip.html", pageArsip(posts, questions));
sitemaps(urls);
write("robots.txt", `User-agent: *\nAllow: /\nDisallow: ${BASE}/search\n\nSitemap: ${abs("/sitemap.xml")}\n`);
console.log(`OK: ${np} tulisan, ${nq} pertanyaan, ${urls.length} URL di sitemap. SITE_URL=${SITE}`);
