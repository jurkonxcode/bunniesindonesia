// Server lokal tanpa dependensi, meniru GitHub Pages: /galeri -> galeri.html, /ko/ -> ko/index.html.
// Pakai: node tools/dev-server.mjs [port]   (bawaan 8000)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = +process.argv[2] || +process.env.PORT || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".md": "text/plain; charset=utf-8",
};
const isFile = p => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = p => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function resolve(urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, ""); } catch { return null; }
  const abs = path.resolve(ROOT, rel);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null;      // cegah ../ keluar folder proyek
  if (isDir(abs)) return isFile(path.join(abs, "index.html")) ? path.join(abs, "index.html") : null;
  if (isFile(abs)) return abs;
  if (isFile(abs + ".html")) return abs + ".html";
  return null;
}

http.createServer((req, res) => {
  const file = resolve(req.url || "/");
  if (!file) {
    const nf = path.join(ROOT, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(isFile(nf) ? fs.readFileSync(nf) : "404 tidak ditemukan");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Bunnies Indonesia: http://localhost:${PORT}  (Ctrl+C untuk berhenti)`));
