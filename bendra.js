// Bendros funkcijos mokinio ir mokytojo puslapiams.

const ZENKLAI = { '`': '̀', '´': '́', '~': '̃' };
const PRIEGAIDES = [
  { zenklas: '`', vardas: 'trumpas' },
  { zenklas: '´', vardas: 'tvirtapradė' },
  { zenklas: '~', vardas: 'tvirtagalė' }
];

const DEMO = !SKRIPTO_ADRESAS;
const DEMO_RAKTAS = 'kirciavimas-demo-rezultatai';

// Įterpia kirčio ženklą po nurodytos raidės.
function sudeti(skiemuo, vieta, zenklas) {
  return (skiemuo.slice(0, vieta) + ZENKLAI[zenklas] + skiemuo.slice(vieta)).normalize('NFC');
}

// Teisinga „kur“ užduoties forma.
function teisingaForma(u) {
  if (u.tipas === 'forma') return u.teisinga;
  return u.skiemenys.map((s, i) => (i === u.kirtis ? sudeti(s, u.vieta, u.zenklas) : s)).join('');
}

function maisyti(masyvas) {
  const a = [...masyvas];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function skaitytiDemo() {
  try { return JSON.parse(localStorage.getItem(DEMO_RAKTAS) || '[]'); } catch { return []; }
}

// Siuntimas į Google Apps Script. Content-Type text/plain, kad naršyklė nesiųstų CORS užklausos-patikrinimo.
async function siusti(duomenys) {
  if (DEMO) {
    const visi = skaitytiDemo();
    if (duomenys.veiksmas === 'irasyti') {
      visi.push({ ...duomenys, laikas: new Date().toISOString() });
      try { localStorage.setItem(DEMO_RAKTAS, JSON.stringify(visi)); } catch {}
      return { ok: true };
    }
    return { ok: true, rezultatai: visi };
  }
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
