/* Tombol "Kirim pesan langsung" di profil publik (v49). Muncul hanya bila pemilik profil sudah
   mengaktifkan terima pesan. Ditempel di <main>, jadi tidak tertimpa render profil-publik.js. */
(async () => {
  const u = new URLSearchParams(location.search).get("u");
  const main = document.querySelector("main.swrap");
  if(!u || !main || typeof rpc !== "function") return;
  let p = null;
  try{ p = await rpc("public_profile", {p:u}); }catch(e){ return; }
  if(!p) return;
  let mine = null;
  if(session){ try{ mine = (await rpc("my_profile")).username; }catch(e){} }
  if(mine === p.username) return;
  const box = document.createElement("div");
  box.className = "box pp-dm";
  box.innerHTML = p.terima_pesan
    ? `<h2>${T("Pesan langsung")}</h2><p>${T("Pemilik profil ini menerima pesan langsung.")}</p><a class="btn green" href="pesan?ke=${encodeURIComponent(p.username)}">${T("Kirim pesan langsung")}</a>`
    : `<h2>${T("Pesan langsung")}</h2><p>${T("Belum menerima pesan")}</p>`;
  main.appendChild(box);
})();
