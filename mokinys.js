const $ = (id) => document.getElementById(id);

let mokinys = null;
let nr = 0;
let atsakymai = [];
let pasSkiem = null;   // pasirinktas skiemuo
let pasPrieg = null;   // pasirinkta priegaidė
let patikrinta = false;

if (DEMO) $('demo-zyme').hidden = false;

function rodyti(ekranas) {
  ['pradzia', 'uzduotis', 'rezultatas'].forEach((id) => ($(id).hidden = id !== ekranas));
  window.scrollTo(0, 0);
}

// ---------- Pradžia ----------

try {
  $('vardas').value = localStorage.getItem('kirc-vardas') || '';
  $('klase').value = localStorage.getItem('kirc-klase') || '';
} catch {}

$('pradzios-forma').addEventListener('submit', (e) => {
  e.preventDefault();
  mokinys = { vardas: $('vardas').value.trim(), klase: $('klase').value.trim().toUpperCase() };
  try {
    localStorage.setItem('kirc-vardas', mokinys.vardas);
    localStorage.setItem('kirc-klase', mokinys.klase);
  } catch {}
  nr = 0;
  atsakymai = [];
  rodyti('uzduotis');
  rodytiUzduoti();
});

// ---------- Užduotys ----------

// Kur dėti ženklą, jei mokinys pasirinko kitą skiemenį nei teisingas.
function vietaSkiemenyje(u, i) {
  return i === u.kirtis ? u.vieta : Math.min(2, u.skiemenys[i].length);
}

function rodytiUzduoti() {
  const u = UZDUOTYS[nr];
  pasSkiem = null; pasPrieg = null; patikrinta = false;

  $('eiga-uzpildas').style.width = (nr / UZDUOTYS.length) * 100 + '%';
  $('eiga-tekstas').textContent = `${nr + 1}/${UZDUOTYS.length}`;
  $('eiga-juosta').setAttribute('aria-valuemax', UZDUOTYS.length);
  $('eiga-juosta').setAttribute('aria-valuenow', nr);
  $('klausimo-antraste').textContent = 'Kur kirtis?';
  $('klausimo-pagalba').textContent = 'Paliesk kirčiuotą skiemenį, tada pasirink priegaidę';
  $('sakinys').textContent = '„' + u.sakinys + '“';
  $('atsiliepimas').textContent = '';
  $('atsiliepimas').className = 'atsiliepimas';
  $('toliau').textContent = 'Tikrinti';
  piesti();
}

function piesti() {
  const u = UZDUOTYS[nr];
  const skiemenys = $('skiemenys');
  const pasirinkimai = $('pasirinkimai');
  skiemenys.innerHTML = '';
  pasirinkimai.innerHTML = '';

  u.skiemenys.forEach((s, i) => {
    const b = document.createElement('button');
    let klase = 'plytele';
    if (!patikrinta && i === pasSkiem) klase += ' pasirinkta';
    if (patikrinta && i === u.kirtis) klase += ' teisingas';
    if (patikrinta && i === pasSkiem && i !== u.kirtis) klase += ' neteisingas';
    b.className = klase;
    b.textContent = s;
    b.disabled = patikrinta;
    b.setAttribute('aria-pressed', i === pasSkiem);
    b.addEventListener('click', () => { pasSkiem = i; pasPrieg = null; piesti(); });
    skiemenys.append(b);
  });

  PRIEGAIDES.forEach((g, i) => {
    const rodomas = patikrinta ? u.kirtis : pasSkiem;
    const s = rodomas === null ? 'a' : u.skiemenys[rodomas];
    const b = document.createElement('button');
    let klase = 'plytele';
    if (!patikrinta && i === pasPrieg) klase += ' pasirinkta';
    if (patikrinta && g.zenklas === u.zenklas) klase += ' teisingas';
    if (patikrinta && i === pasPrieg && g.zenklas !== u.zenklas) klase += ' neteisingas';
    b.className = klase;
    b.innerHTML = `<span class="forma">${sudeti(s, rodomas === null ? 1 : vietaSkiemenyje(u, rodomas), g.zenklas)}</span><small>${g.vardas}</small>`;
    b.disabled = pasSkiem === null || patikrinta;
    b.addEventListener('click', () => { pasPrieg = i; piesti(); });
    pasirinkimai.append(b);
  });

  $('toliau').disabled = !patikrinta && (pasSkiem === null || pasPrieg === null);
}

$('toliau').addEventListener('click', () => {
  const u = UZDUOTYS[nr];
  if (patikrinta) {
    nr++;
    if (nr < UZDUOTYS.length) rodytiUzduoti();
    else baigti();
    return;
  }
  patikrinta = true;
  const teisinga = teisingaForma(u);
  const zenklas = PRIEGAIDES[pasPrieg].zenklas;
  const atsakyta = u.skiemenys
    .map((s, i) => (i === pasSkiem ? sudeti(s, vietaSkiemenyje(u, i), zenklas) : s))
    .join('');
  const gerai = pasSkiem === u.kirtis && zenklas === u.zenklas;
  atsakymai.push({ zodis: teisinga, atsakyta, gerai, kodel: u.kodel });

  $('atsiliepimas').className = 'atsiliepimas ' + (gerai ? 'gerai' : 'klaida');
  $('atsiliepimas').innerHTML = gerai
    ? 'Teisingai! <span class="forma">' + apsaugoti(teisinga) + '</span>'
    : 'Ne visai. Teisingai: <span class="forma">' + apsaugoti(teisinga) + '</span>';
  $('toliau').textContent = nr + 1 < UZDUOTYS.length ? 'Toliau' : 'Baigti';
  piesti();
});

// ---------- Rezultatas ----------

async function baigti() {
  const teisingai = atsakymai.filter((a) => a.gerai).length;
  const isViso = atsakymai.length;
  $('taskai').innerHTML = `${teisingai}<small>/${isViso}</small>`;
  const dalis = teisingai / isViso;
  $('pagyrimas').textContent =
    dalis === 1 ? 'Tobula! Nė vienos klaidos.' :
    dalis >= 0.7 ? 'Labai gerai! Liko visai nedaug.' :
    dalis >= 0.4 ? 'Neblogai. Perskaityk paaiškinimus ir pabandyk dar kartą.' :
    'Pradžia sunki, bet su kiekvienu bandymu seksis geriau.';

  // Pirma klaidos, paskui teisingi atsakymai.
  const tvarka = [...atsakymai.filter((a) => !a.gerai), ...atsakymai.filter((a) => a.gerai)];
  $('paaiskinimai').innerHTML = tvarka.map((a) => `
    <li class="${a.gerai ? 'gerai' : 'klaida'}">
      <div class="zodzio-eilute">
        <b class="forma">${apsaugoti(a.zodis)}</b>
        ${a.gerai
          ? '<span class="zyma gerai">Teisingai</span>'
          : `<span class="zyma klaida">Tu: <s>${apsaugoti(a.atsakyta)}</s></span>`}
      </div>
      <p>${apsaugoti(a.kodel)}</p>
    </li>`).join('');
  rodyti('rezultatas');

  $('siuntimo-busena').textContent = 'Siunčiama mokytojui…';
  try {
    const ats = await siusti({
      veiksmas: 'irasyti', ...mokinys, teisingai, isViso,
      atsakymai: atsakymai.map(({ zodis, atsakyta, gerai }) => ({ zodis, atsakyta, gerai }))
    });
    $('siuntimo-busena').textContent = ats.ok
      ? (DEMO ? 'Išsaugota (demo režimas).' : 'Rezultatas išsiųstas mokytojui.')
      : 'Nepavyko išsiųsti: ' + (ats.klaida || 'nežinoma klaida');
  } catch {
    $('siuntimo-busena').textContent = 'Nepavyko išsiųsti. Patikrink interneto ryšį ir pabandyk dar kartą.';
  }
}

$('is-naujo').addEventListener('click', () => rodyti('pradzia'));
