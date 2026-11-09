#!/usr/bin/env node
/* Impor berita lewat RSS/Atom ke tabel `news` di Supabase (Niflax v15).
   Tanpa dependensi (Node 18+). Dijalankan GitHub Actions (lihat .github/workflows/impor-berita.yml).

   Prinsip (lihat HANDOFF.md bagian 22):
   - Hanya feed dengan "izin": true di tools/feeds.json yang diambil. Bawaan: semua mati.
   - Yang disimpan: judul, nama sumber, waktu terbit, tautan ke artikel asli. Ringkasan hanya bila feed diberi "ringkasan": true,
     dipotong pendek. Foto TIDAK PERNAH diambil (image_url selalu kosong). Isi artikel penuh tidak disimpan.
   - Hanya berita baru: umur maksimal "maks_umur_jam" (bawaan 72 jam, mengacu pada batas "berita aktual" 3x24 jam).
   - Berita internasional tidak diterjemahkan otomatis; sumbernya diberi label bahasa, misalnya "BBC News (EN)".

   Pemakaian:
     node tools/impor-berita.mjs --dry          # hanya cetak hasil, tidak menulis ke database, tanpa kunci
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/impor-berita.mjs
*/
import { readFile } from "node:fs/promises";

const DRY = process.argv.includes("--dry");
const FEEDS_FILE = new URL("./feeds.json", import.meta.url);
const UA = "NiflaxBot/1.0 (+https://niflax.com; pembaca RSS, hanya judul dan tautan)";
const KATEGORI = ["Nasional", "Teknologi", "Bola", "Olahraga", "Ekonomi", "Hiburan", "Kuliner", "Otomotif", "Religi"];

/* ---------- parser RSS 2.0 / Atom sederhana ---------- */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch { return ""; } }
  return ENT[e.toLowerCase()] ?? m;
});
const unCdata = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
const stripTags = s => s.replace(/<[^>]*>/g, " ");
const clean = s => decode(stripTags(unCdata(s ?? ""))).replace(/\s+/g, " ").trim();
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}
function parseFeed(xml) {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map(m => m[2]);
  return blocks.map(b => {
    let link = clean(tag(b, "link"));
    if (!link) {                                                   // Atom: <link href="..." rel="alternate"/>
      const links = [...b.matchAll(/<link\b([^>]*)>/gi)].map(m => m[1]);
      const alt = links.find(a => !/rel=["'](?!alternate)/i.test(a)) || links[0] || "";
      link = decode((alt.match(/href=["']([^"']+)["']/i) || [])[1] || "");
    }
    return {
      title: clean(tag(b, "title")),
      link,
      date: clean(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date")),
      desc: clean(tag(b, "description") || tag(b, "summary") || tag(b, "content"))
    };
  });
}

/* ---------- pembersihan ---------- */
function cleanUrl(u) {
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol)) return "";
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$)/i.test(k)) x.searchParams.delete(k);
    x.hash = "";
    return x.href;
  } catch { return ""; }
}
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

/* ---------- jalankan ---------- */
const cfg = JSON.parse(await readFile(FEEDS_FILE, "utf8"));
const now = Date.now();
const rows = [];
let enabled = 0, failed = 0;

for (const f of cfg.feeds) {
  const label = f.id || f.nama;
  if (f.izin !== true) { console.log(`- lewati ${label}: izin belum diberikan`); continue; }
  if (!f.url || /GANTI/.test(f.url)) { console.log(`- lewati ${label}: url belum diisi`); continue; }
  if (!KATEGORI.includes(f.kategori)) { console.log(`- lewati ${label}: kategori harus salah satu dari ${KATEGORI.join(", ")}`); continue; }
  enabled++;
  try {
    const r = await fetch(f.url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const items = parseFeed(await r.text());
    const maxAge = (f.maks_umur_jam ?? 72) * 3600e3, maxItem = f.maks_item ?? 15;
    const sumber = f.bahasa && f.bahasa !== "id" ? `${f.nama} (${f.bahasa.toUpperCase()})` : f.nama;
    let n = 0;
    for (const it of items) {
      if (n >= maxItem) break;
      const url = cleanUrl(it.link);
      const title = cut(it.title, 300);
      if (!url || title.length < 5) continue;
      let t = Date.parse(it.date); if (!isFinite(t)) t = now; if (t > now + 36e5) t = now;
      if (now - t > maxAge) continue;
      rows.push({
        title, url, category: f.kategori, source: sumber,
        summary: f.ringkasan === true && it.desc ? cut(it.desc, 200) : null,
        image_url: null,                                           // sengaja kosong: foto punya hak cipta sendiri
        published_at: new Date(t).toISOString()
      });
      n++;
    }
    console.log(`+ ${label}: ${n} berita baru (dari ${items.length} butir feed)`);
  } catch (e) { failed++; console.warn(`! ${label}: gagal (${e.message})`); }
}

const seen = new Set(), uniq = rows.filter(r => !seen.has(r.url) && seen.add(r.url));
console.log(`Total ${uniq.length} berita siap dimasukkan (${enabled} feed aktif, ${failed} gagal).`);

if (DRY) { for (const r of uniq.slice(0, 20)) console.log(`  [${r.category}] ${r.title}  — ${r.source}  ${r.url}`); process.exit(enabled && failed === enabled ? 1 : 0); }
if (!uniq.length) process.exit(enabled && failed === enabled ? 1 : 0);

const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) { console.error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi (atau pakai --dry)."); process.exit(1); }
const headers = { apikey: key, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" };
if (!key.startsWith("sb_")) headers.Authorization = "Bearer " + key;      // kunci JWT lama butuh header ini; kunci sb_secret_ hanya apikey

for (let i = 0; i < uniq.length; i += 50) {
  const r = await fetch(base.replace(/\/$/, "") + "/rest/v1/news?on_conflict=url", { method: "POST", headers, body: JSON.stringify(uniq.slice(i, i + 50)) });
  if (!r.ok) { console.error("Supabase menolak:", r.status, (await r.text()).slice(0, 300)); process.exit(1); }
}
console.log("Selesai: berita baru dimasukkan, duplikat dilewati.");
process.exit(enabled && failed === enabled ? 1 : 0);
