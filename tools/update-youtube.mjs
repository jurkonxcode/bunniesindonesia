// Perbarui data/youtube.json dari YouTube Data API v3 (butuh env YOUTUBE_API_KEY).
import fs from "node:fs";
const KEY = process.env.YOUTUBE_API_KEY;
if (!KEY) { console.log("YOUTUBE_API_KEY tidak ada, dilewati."); process.exit(0); }
const f = "data/youtube.json", j = JSON.parse(fs.readFileSync(f, "utf8"));
const ids = j.video.map(v => v.id);
const got = {};
for (let i = 0; i < ids.length; i += 50) {
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.slice(i, i + 50).join(",")}&key=${KEY}`);
  if (!r.ok) { console.error("YouTube API gagal:", r.status); process.exit(1); }
  for (const it of (await r.json()).items || []) got[it.id] = +it.statistics.viewCount;
}
let n = 0;
for (const v of j.video) if (got[v.id]) { v.views = got[v.id]; n++; }
j.video.sort((a, b) => b.views - a.views);
j.diperbarui = new Date().toISOString().slice(0, 10);
j.sumber = "YouTube Data API (resmi)";
fs.writeFileSync(f, JSON.stringify(j, null, 1));
console.log(`Diperbarui ${n}/${ids.length} video.`);
