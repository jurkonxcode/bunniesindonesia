/* v27: dropdown kotak cari di beranda (pola portal besar): saat kotak kosong tampil "Pencarian terakhir" (disimpan di perangkat ini)
   dan "Tren" (view trending, pencarian sungguhan); saat mengetik tampil saran dari suggest_keywords.
   Bergantung pada: $ dan esc (state.js), trending (api.js, dibaca saat dropdown dibuka), SUPABASE_URL/KEY (config.js). Muat setelah main.js. */
(() => {
  const KEY = "bunnies.recent";
  const get = () => { try{ const r = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(r) ? r.filter(x => typeof x === "string").slice(0, 8) : []; }catch(e){ return []; } };
  const put = a => { try{ a.length ? localStorage.setItem(KEY, JSON.stringify(a)) : localStorage.removeItem(KEY); }catch(e){} };

  function attach(form, input){
    if(!form || !input) return;
    const box = document.createElement("div");
    box.className = "sgbox"; box.hidden = true; box.id = "sg-" + input.id;
    box.setAttribute("role", "listbox"); box.setAttribute("aria-label", "Saran pencarian");
    form.appendChild(box);
    input.setAttribute("role", "combobox"); input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", box.id); input.setAttribute("aria-autocomplete", "list");
    let items = [], sel = -1, timer = 0, seq = 0;

    const hide = () => { box.hidden = true; sel = -1; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); };
    const mark = () => {
      [...box.querySelectorAll("[data-v]")].forEach((li, i) => li.setAttribute("aria-selected", i === sel));
      const li = box.querySelectorAll("[data-v]")[sel];
      li ? input.setAttribute("aria-activedescendant", li.id) : input.removeAttribute("aria-activedescendant");
    };
    function paint(html, list){
      items = list; sel = -1;
      box.innerHTML = html; box.hidden = !html;
      input.setAttribute("aria-expanded", String(!!html));
      box.querySelectorAll("[data-v]").forEach((li, i) => li.id = box.id + "-" + i);
    }
    function showIdle(){
      const rec = get(), tr = (typeof trending !== "undefined" && Array.isArray(trending)) ? trending.slice(0, 10) : [];
      if(!rec.length && !tr.length){ hide(); return; }
      const li = (v, extra, cls) => `<li role="option" class="${cls}" data-v="${esc(v)}">${extra}<span class="sg-t">${esc(v)}</span></li>`;
      paint(
        (rec.length ? `<div class="sg-h"><b>Pencarian terakhir</b><button type="button" data-clear>Hapus semua</button></div><ul>` +
          rec.map(v => `<li role="option" class="sg-r" data-v="${esc(v)}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><span class="sg-t">${esc(v)}</span><button type="button" class="sg-x" data-del="${esc(v)}" aria-label="Hapus ${esc(v)} dari riwayat">×</button></li>`).join("") + `</ul>` : "") +
        (tr.length ? `<div class="sg-h"><b>Tren</b></div><ul class="sg-tr">` + tr.map((v, i) => li(v, `<i class="sg-n${i < 3 ? " top" : ""}">${i + 1}</i>`, "sg-q")).join("") + `</ul>` : ""),
        [...rec, ...tr]
      );
    }
    async function showTyped(v){
      const my = ++seq;
      try{
        const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/suggest_keywords", {method:"POST", headers:{apikey:SUPABASE_ANON_KEY, Authorization:"Bearer " + SUPABASE_ANON_KEY, "Content-Type":"application/json"}, body:JSON.stringify({p_prefix:v, p_limit:6})});
        if(!r.ok) throw 0;
        const ks = (await r.json()).map(x => x.keyword).filter(Boolean);
        if(my !== seq || input.value.trim() !== v) return;
        if(!ks.length){ hide(); return; }
        paint(`<ul>` + ks.map(k => `<li role="option" class="sg-q" data-v="${esc(k)}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg><span class="sg-t">${esc(k)}</span></li>`).join("") + `</ul>`, ks);
      }catch(e){ if(my === seq) hide(); }
    }
    const refresh = () => {
      clearTimeout(timer); const v = input.value.trim();
      if(!v){ ++seq; showIdle(); return; }
      if(v.length < 2 || !SUPABASE_URL){ hide(); return; }
      timer = setTimeout(() => showTyped(v), 220);
    };
    const choose = v => { input.value = v; hide(); form.requestSubmit(); };

    input.addEventListener("focus", refresh);
    input.addEventListener("input", refresh);
    input.addEventListener("keydown", e => {
      if(box.hidden){ if(e.key === "ArrowDown" && !input.value.trim()) showIdle(); return; }
      const n = box.querySelectorAll("[data-v]").length;
      if(e.key === "ArrowDown" || e.key === "ArrowUp"){
        e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + n) % n; mark();
        box.querySelectorAll("[data-v]")[sel].scrollIntoView({block:"nearest"});
      }else if(e.key === "Enter" && sel >= 0){ e.preventDefault(); choose(items[sel]); }
      else if(e.key === "Escape"){ hide(); }
    });
    box.addEventListener("mousedown", e => e.preventDefault());                 // jaga fokus tetap di kotak cari
    box.addEventListener("click", e => {
      const d = e.target.closest("[data-del]");
      if(d){ put(get().filter(x => x !== d.dataset.del)); showIdle(); return; }
      if(e.target.closest("[data-clear]")){ put([]); showIdle(); return; }
      const li = e.target.closest("[data-v]"); if(li) choose(li.dataset.v);
    });
    document.addEventListener("click", e => { if(!form.contains(e.target)) hide(); });
    form.addEventListener("submit", hide);
    form.addEventListener("focusout", () => setTimeout(() => { if(!form.contains(document.activeElement)) hide(); }, 120));
  }
  attach($("searchForm"), $("q"));
  attach($("hSearch"), $("hq"));
})();
