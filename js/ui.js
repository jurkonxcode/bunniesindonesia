function render(){
  const cats = ["Semua", ...new Set(news.map(n => n.category).filter(Boolean))];
  $("cats").innerHTML = cats.map(c => `<button aria-pressed="${c===cat}" data-c="${c}">${c}</button>`).join("");
  const items = cat==="Semua" ? news : news.filter(n => n.category===cat);
  const [first, ...rest] = items;
  if(first){
    $("leadTitle").textContent = first.title;
    $("leadText").textContent = first.summary || "";
    $("leadMeta").textContent = [first.source, first.category].filter(Boolean).join(" · ");
  }
  $("newsList").innerHTML = rest.map(n => `<li><a href="#"><span class="tag">${n.category||""}</span>${n.title}</a><span class="meta">${n.source||""}</span></li>`).join("");
  $("rank").innerHTML = trending.slice(0,8).map((k,i) => `<li><a href="#">${k}</a><em>${i<3?"naik":"–"}</em></li>`).join("");
  $("stamp").textContent = new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"});
}

let ti = 0;
function rotate(){
  const el = $("trendText"); el.style.opacity = 0;
  setTimeout(() => { el.textContent = (ti+1) + ". " + trending[ti % trending.length]; el.style.opacity = 1; ti++; }, 300);
}
