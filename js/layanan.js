/* Semua layanan (v11). Mandiri: tidak butuh Supabase. Pintasan disimpan di localStorage perangkat ini.
   Tiap item: [id ikon, nama, tujuan, status]. Tanpa tujuan = belum tersedia (ditandai "segera"). */
const ICONS = "assets/icons/niflax-icons.svg", PIN_KEY = "niflax.pins", MAX = 8;
/* GROUPS dipindah ke js/services.js (v16) */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ALL = GROUPS.flatMap(g => g.items.map(i => ({c:g.c, id:i[0], name:i[1], href:i[2], st:i[3] || ""})));
const icon = (id, c) => `<span class="ic ${c}"><svg aria-hidden="true"><use href="${ICONS}#n-${id}"/></svg></span>`;
let pins = [], term = "";
try{ pins = JSON.parse(localStorage.getItem(PIN_KEY)) || []; }catch(e){}
pins = (Array.isArray(pins) ? pins : []).filter(id => ALL.some(s => s.id === id && s.href)).slice(0, MAX);
const save = () => { try{ localStorage.setItem(PIN_KEY, JSON.stringify(pins)); }catch(e){ $("lmsg").textContent = "Pintasan tidak bisa disimpan di browser ini."; } };

function paintPins(){
  $("pinCount").textContent = pins.length + "/" + MAX;
  $("pins").innerHTML = Array.from({length:MAX}, (_, i) => {
    const s = ALL.find(x => x.id === pins[i]);
    return s ? `<a href="${esc(s.href)}">${icon(s.id, s.c)}<span class="nm">${esc(s.name)}</span></a>`
             : `<span class="slot"><span class="ic"><svg aria-hidden="true"><use href="${ICONS}#n-pin"/></svg></span><span class="nm">&nbsp;</span></span>`;
  }).join("");
}
function paintGroups(){
  const q = term.toLowerCase();
  const html = GROUPS.map(g => {
    const items = g.items.map(i => ({c:g.c, id:i[0], name:i[1], href:i[2], st:i[3] || ""})).filter(s => !q || s.name.toLowerCase().includes(q));
    if(!items.length) return "";
    return `<section class="box"><h2>${esc(g.name)} <b>${items.length}</b></h2><ul class="sg">${items.map(s => {
      const tag = s.st ? `<em class="tg">${esc(s.st)}</em>` : "";
      const body = s.href ? `<a class="sv" href="${esc(s.href)}">${icon(s.id, s.c)}<span class="nm">${esc(s.name)}</span>${tag}</a>`
                          : `<div class="sv off">${icon(s.id, s.c)}<span class="nm">${esc(s.name)}</span>${tag}</div>`;
      const on = pins.includes(s.id);
      const pin = s.href ? `<button class="pin" type="button" data-pin="${s.id}" aria-pressed="${on}" aria-label="${on ? "Lepas pintasan " : "Pasang pintasan "}${esc(s.name)}"><svg aria-hidden="true"><use href="${ICONS}#n-pin"/></svg></button>` : "";
      return `<li class="svc">${body}${pin}</li>`;
    }).join("")}</ul></section>`;
  }).join("");
  $("groups").innerHTML = html || `<p class="lempty">Layanan “${esc(term)}” tidak ditemukan.</p>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-pin]"); if(!b) return;
  const id = b.dataset.pin, i = pins.indexOf(id);
  if(i >= 0){ pins.splice(i, 1); $("lmsg").textContent = ""; }
  else if(pins.length >= MAX){ $("lmsg").textContent = "Pintasan penuh (maksimal " + MAX + "). Lepas salah satu dulu."; return; }
  else{ pins.push(id); $("lmsg").textContent = ""; }
  save(); paintPins(); paintGroups();
});
$("lq").addEventListener("input", e => { term = e.target.value.trim(); paintGroups(); });
paintPins(); paintGroups();
