// Bendros funkcijos mokinio ir mokytojo puslapiams.

const ZENKLAI = { '`': '̀', '´': '́', '~': '̃' };
const ZENKLAS_IS_KODO = { '̀': '`', '́': '´', '̃': '~' };
const PRIEGAIDES = [
  { zenklas: '`', vardas: 'trumpas' },
  { zenklas: '´', vardas: 'tvirtapradė' },
  { zenklas: '~', vardas: 'tvirtagalė' }
];
const PRIEGAIDES_VARDAS = { '`': 'trumpas kirtis', '´': 'tvirtapradė', '~': 'tvirtagalė' };

const DEMO = !SKRIPTO_ADRESAS;
const DEMO_RAKTAS = 'kirciavimas-demo-rezultatai';
const DEMO_UZD_RAKTAS = 'kirciavimas-demo-uzduotys';

// Įterpia kirčio ženklą po nurodytos raidės.
function sudeti(skiemuo, vieta, zenklas) {
  return (skiemuo.slice(0, vieta) + ZENKLAI[zenklas] + skiemuo.slice(vieta)).normalize('NFC');
}

// Išskaido įrašą „vã-ka-ras“: skiemenys, kuris kirčiuotas, po kurios raidės ženklas, koks ženklas.
function isskaidytiZodi(irasas) {
  const tekstas = String(irasas || '').trim().normalize('NFD');
  if (!tekstas) return { ok: false, klaida: 'Įrašyk žodį' };
  if (/\s/.test(tekstas)) return { ok: false, klaida: 'Vienas žodis, be tarpų' };
  const dalys = tekstas.split('-');
  if (dalys.some((d) => !d)) return { ok: false, klaida: 'Tarp brūkšnelių turi būti raidžių' };

  const skiemenys = [];
  let kirtis = null, vieta = null, zenklas = null, zenkluSk = 0;
  dalys.forEach((dalis, i) => {
    let raidziu = 0;
    for (const ch of dalis) {
      if (ZENKLAS_IS_KODO[ch]) {
        zenkluSk++;
        kirtis = i; vieta = raidziu; zenklas = ZENKLAS_IS_KODO[ch];
      } else if (!/\p{M}/u.test(ch)) {
        raidziu++;
      }
    }
    skiemenys.push(dalis.replace(/[̀́̃]/g, '').normalize('NFC'));
  });

  if (zenkluSk === 0) return { ok: false, klaida: 'Trūksta kirčio ženklo (à, á arba ã)' };
  if (zenkluSk > 1) return { ok: false, klaida: 'Turi būti tik vienas kirčio ženklas' };
  if (vieta === 0) return { ok: false, klaida: 'Kirčio ženklas turi būti po raidės' };
  if (skiemenys.some((s) => !/^\p{L}+$/u.test(s))) return { ok: false, klaida: 'Naudok tik raides, kirčio ženklą ir brūkšnelius' };

  const forma = skiemenys.map((s, i) => (i === kirtis ? sudeti(s, vieta, zenklas) : s)).join('');
  return { ok: true, skiemenys, kirtis, vieta, zenklas, forma };
}

function maisyti(masyvas) {
  const a = [...masyvas];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function skaitytiDemo(raktas, numatyta) {
  try { return JSON.parse(localStorage.getItem(raktas) || 'null') ?? numatyta; } catch { return numatyta; }
}
function rasytiDemo(raktas, reiksme) {
  try { localStorage.setItem(raktas, JSON.stringify(reiksme)); } catch {}
}

// DEMO režimas: viskas saugoma šioje naršyklėje.
function demoAtsakymas(d) {
  const rez = skaitytiDemo(DEMO_RAKTAS, []);
  const uzd = skaitytiDemo(DEMO_UZD_RAKTAS, UZDUOTYS);
  switch (d.veiksmas) {
    case 'irasyti':
      rez.push({ ...d, laikas: new Date().toISOString() });
      rasytiDemo(DEMO_RAKTAS, rez);
      return { ok: true };
    case 'valyti': {
      const palikti = d.klase ? rez.filter((r) => String(r.klase).toUpperCase() !== d.klase) : [];
      rasytiDemo(DEMO_RAKTAS, palikti);
      return { ok: true, istrinta: rez.length - palikti.length };
    }
    case 'uzduotys': return { ok: true, uzduotys: uzd.filter((u) => u.patvirtinta) };
    case 'visosUzduotys': return { ok: true, uzduotys: uzd };
    case 'saugotiUzduotis':
      rasytiDemo(DEMO_UZD_RAKTAS, d.uzduotys);
      return { ok: true, issaugota: d.uzduotys.length };
    default: return { ok: true, rezultatai: rez };
  }
}

// Siuntimas į Google Apps Script. Content-Type text/plain, kad naršyklė nesiųstų CORS užklausos-patikrinimo.
async function siusti(duomenys) {
  if (DEMO) return demoAtsakymas(duomenys);
  const atsakas = await fetch(SKRIPTO_ADRESAS, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(duomenys)
  });
  return atsakas.json();
}

function apsaugoti(tekstas) {
  return String(tekstas ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
