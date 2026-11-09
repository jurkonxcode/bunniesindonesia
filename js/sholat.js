/* Jadwal sholat dihitung di perangkat (tanpa server, tanpa API). Metode Kemenag RI:
   Subuh 20°, Isya 18°, Asar bayangan 1x, ihtiyat +2 menit (Terbit -2 menit), dibulatkan ke menit.
   Rumus posisi matahari: Meeus, "Astronomical Algorithms". Hasil bisa berbeda 1-2 menit dari jadwal resmi daerah. */
const RAD = Math.PI / 180;
function julian(y, m, d){
  if(m <= 2){ y--; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunAt(J){
  const T = (J - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * RAD);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * RAD);
  const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD)) / RAD;
  const y = Math.tan(eps * RAD / 2) ** 2;
  const eot = 4 / RAD * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
  return {dec, eot};
}
/* menit antara tengah hari dan saat matahari mencapai ketinggian alt (derajat); NaN bila tidak terjadi */
function ang(alt, lat, dec){
  const c = (Math.sin(alt * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  return c < -1 || c > 1 ? NaN : Math.acos(c) / RAD * 4;
}
/* Mengembalikan menit sejak 00:00 waktu setempat: {subuh, terbit, zuhur, asar, magrib, isya} */
function prayerTimes(y, m, d, lat, lon, off){
  const s = sunAt(julian(y, m, d) + 0.5 - lon / 360);
  const noon = 720 - 4 * lon - s.eot + off * 60;
  const asrAlt = Math.atan(1 / (1 + Math.tan(Math.abs(lat - s.dec) * RAD))) / RAD;
  const up = n => Math.ceil(n + 2 - 1e-9);
  return {
    subuh: up(noon - ang(-20, lat, s.dec)),
    terbit: Math.floor(noon - ang(-0.833, lat, s.dec) - 2),
    zuhur: up(noon),
    asar: up(noon + ang(asrAlt, lat, s.dec)),
    magrib: up(noon + ang(-0.833, lat, s.dec)),
    isya: up(noon + ang(-18, lat, s.dec))
  };
}
const hm = n => { n = ((n % 1440) + 1440) % 1440; return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); };
/* waktu setempat (menurut selisih jam kota, bukan zona perangkat) */
function localNow(off, t){
  const x = new Date((t || Date.now()) + off * 3600e3);
  return {y:x.getUTCFullYear(), m:x.getUTCMonth() + 1, d:x.getUTCDate(), min:x.getUTCHours() * 60 + x.getUTCMinutes() + x.getUTCSeconds() / 60};
}
/* Jadwal berikutnya: daftar [nama, menit] untuk hari ini, plus indeks yang berikutnya (bisa jatuh ke Subuh besok) */
const PNAMES = [["subuh","Subuh"],["terbit","Terbit"],["zuhur","Zuhur"],["asar","Asar"],["magrib","Magrib"],["isya","Isya"]];
function schedule(lat, lon, off, t){
  const n = localNow(off, t), p = prayerTimes(n.y, n.m, n.d, lat, lon, off);
  const rows = PNAMES.map(k => [k[1], p[k[0]]]);
  const wajib = [0, 2, 3, 4, 5];                       // Terbit bukan waktu sholat wajib, tidak ikut jadi "berikutnya"
  let next = wajib.find(i => rows[i][1] > n.min), tomorrow = false, delta;
  if(next === undefined){
    const tm = localNow(off, (t || Date.now()) + 864e5), q = prayerTimes(tm.y, tm.m, tm.d, lat, lon, off);
    next = 0; tomorrow = true; delta = 1440 - n.min + q.subuh; rows[0] = [rows[0][0], q.subuh];
  }else delta = rows[next][1] - n.min;
  return {rows, next, tomorrow, delta:Math.ceil(delta)};
}
