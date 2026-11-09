/* Bias profil (v31): member favorit yang dipilih pengguna. Muat setelah state.js (memakai esc()).
   Daftar ini harus sama dengan CHECK constraint di supabase/v31-komentar-reaksi-bias.sql.
   Warna chip adalah warna Bunnies Indonesia sendiri, bukan warna resmi member. */
const BIAS = [
  {id:"minji",    nama:"Minji",    warna:"#e0488a"},
  {id:"hanni",    nama:"Hanni",    warna:"#f0873a"},
  {id:"danielle", nama:"Danielle", warna:"#2f9ed8"},
  {id:"haerin",   nama:"Haerin",   warna:"#2aa87a"},
  {id:"hyein",    nama:"Hyein",    warna:"#8c6fd8"},
  {id:"all",      nama:"All member", warna:"#2f6fe4"}
];
const biasOf = id => BIAS.find(b => b.id === id) || null;
const biasChip = id => { const b = biasOf(id); return b ? `<span class="bchip" style="--bc:${b.warna}">${esc(b.nama)}</span>` : ""; };
