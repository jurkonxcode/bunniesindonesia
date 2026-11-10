#!/usr/bin/env python3
"""Hasilkan blok HAIRLINE di akhir css/icloud.css.
Dari semua aturan level atas di css/*.css (kecuali icloud.css) yang punya border 1px solid, buat aturan retina
(.5px) khusus sisi yang memang 1px; border 1.5px diubah jadi 1px. Jalankan ulang bila CSS lain berubah:
    python3 tools/gen-hairline.py"""
import re, glob, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
def strip_comments(s): return re.sub(r"/\*.*?\*/", "", s, flags=re.S)
def top_rules(css):
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find("{", i)
        if j < 0: break
        sel = css[i:j].strip(); depth, k = 1, j + 1
        while k < n and depth:
            depth += (css[k] == "{") - (css[k] == "}"); k += 1
        body = css[j + 1:k - 1]
        if not sel.startswith("@"): out.append((sel, body))   # @media/@keyframes dilewati
        i = k
    return out
SIDES = ["top", "right", "bottom", "left"]
def sides(body):
    w = {s: None for s in SIDES}
    for prop, val in re.findall(r"(?:^|;)\s*(border(?:-top|-right|-bottom|-left)?)\s*:\s*([^;}]+)", body):
        m = re.match(r"\s*([\d.]+)px\s+solid\b", val)
        width = m.group(1) if m else ("0" if re.match(r"\s*(0|none)\b", val) else "x")
        for s in (SIDES if prop == "border" else [prop.split("-")[1]]): w[s] = width
    return w
retina, thin, seen = {}, {}, set()
for f in sorted(glob.glob(os.path.join(root, "css", "*.css"))):
    if f.endswith("icloud.css"): continue
    for sel, body in top_rules(strip_comments(open(f, encoding="utf-8").read())):
        if re.search(r":root|^\*|@", sel): continue
        w = sides(body)
        for s in SIDES:
            if w[s] == "1": retina.setdefault(s, []).append(sel)
            if w[s] == "1.5": thin.setdefault(s, []).append(sel)
def block(d, width):
    r = []
    for s in SIDES:
        sels = sorted(set(x for sel in d.get(s, []) for x in [t.strip() for t in sel.split(",")] if x))
        if sels: r.append(",".join(sels) + "{border-%s-width:%s}" % (s, width))
    return "\n".join(r)
out = "/* ===== HAIRLINE (dihasilkan otomatis oleh tools/gen-hairline.py, jangan diedit tangan) ===== */\n"
out += block(thin, "1px") + "\n@media(-webkit-min-device-pixel-ratio:2),(min-resolution:192dpi){\n" + block(retina, ".5px") + "\n}\n"
p = os.path.join(root, "css", "icloud.css"); s = open(p, encoding="utf-8").read()
s = s.split("/* ===== HAIRLINE")[0].rstrip() + "\n\n" + out
open(p, "w", encoding="utf-8").write(s)
print("ok:", sum(len(v) for v in retina.values()), "sisi 1px,", sum(len(v) for v in thin.values()), "sisi 1.5px")
