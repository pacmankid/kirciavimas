const $ = (id) => document.getElementById(id);

let kodas = null, uid = null, pamokosId = null, pamoka = null;
let skaidres = [];
let manoAts = {};           // { uzduotiesNr: { skiem, prieg, atsakyta, gerai } }
let dabartinisRaktas = null; // kas šiuo metu rodoma, kad be reikalo neperpieštume
let dabartineUzd = null;     // { nr, ctl }

if (Rysys.demo) $('demo-zyme').hidden = false;

// ---------- Prisijungimas ----------

KLASES.forEach((k) => $('klase').insertAdjacentHTML('beforeend', `<option>${apsaugoti(k)}</option>`));
try {
  $('vardas').value = localStorage.getItem('kirc-vardas') || '';
  const k = localStorage.getItem('kirc-klase');
  if (KLASES.includes(k)) $('klase').value = k;
} catch {}
const parametras = new URLSearchParams(location.search).get('kodas');
if (parametras) $('kodas').value = normalizuotiKoda(parametras);

$('prisijungimo-forma').addEventListener('submit', async (e) => {
  e.preventDefault();
  const klaida = (t) => ($('prisijungimo-klaida').textContent = t);
  klaida('');
  kodas = normalizuotiKoda($('kodas').value);
  const vardas = $('vardas').value.trim();
  const klase = $('klase').value;
  if (!kodas) return klaida('Įvesk pamokos kodą');
  try {
    localStorage.setItem('kirc-vardas', vardas);
    localStorage.setItem('kirc-klase', klase);
  } catch {}

  $('prisijungti').disabled = true;
  $('prisijungti').textContent = 'Jungiamasi…';
  try {
    uid = await Rysys.prisijungtiMokiniui();
    pamokosId = await Rysys.gauti(`kodai/${kodas}`);
    if (!pamokosId) throw new Error(`Pamokos su kodu #${kodas} nėra. Patikrink kodą.`);
    pamoka = await Rysys.gauti(`pamokos/${pamokosId}`);
    if (!pamoka) throw new Error('Pamoka nerasta. Paklausk mokytojo.');

    await Rysys.rasyti(`dalyviai/${kodas}/${uid}`, { vardas, klase, prisijunge: Date.now(), aktyvus: true });
    Rysys.pasalintiAtsijungus(`dalyviai/${kodas}/${uid}/aktyvus`);

    $('prisijungimas').hidden = true;
    $('pamoka').hidden = false;
    $('pamokos-pavadinimas').textContent = pamoka.pavadinimas || ('#' + kodas);
    $('mokinio-vardas').textContent = `${vardas} · ${klase}`;
    rodytiLaukima('Įkeliama pamoka…', 'Palauk kelias sekundes.');

    // Skaidres įkeliam iš anksto, kad keistųsi akimirksniu.
    skaidres = sarasas(await Rysys.gauti(`skaidres/${pamokosId}`));
    skaidres.forEach((src) => { const i = new Image(); i.src = src; });

    // Jei mokinys jungiasi iš naujo, atsistatome jo atsakymus.
    const mano = await Promise.all(sarasas(pamoka.uzduotys).map((_, nr) => Rysys.gauti(`atsakymai/${kodas}/${nr}/${uid}`).catch(() => null)));
    mano.forEach((a, nr) => { if (a) manoAts[nr] = a; });

    Rysys.klausyti(`gyvai/${kodas}`, rodyti);
  } catch (klaidaObj) {
    klaida(klaidaObj.message || String(klaidaObj));
    $('prisijungti').disabled = false;
    $('prisijungti').textContent = 'Prisijungti';
  }
});

// ---------- Rodymas ----------

function langas(kuris) {
  ['r-laukti', 'r-skaidre', 'r-uzduotis', 'r-suvestine'].forEach((id) => ($(id).hidden = id !== kuris));
}

function rodytiLaukima(antraste, tekstas) {
  langas('r-laukti');
  $('laukti-antraste').textContent = antraste;
  $('laukti-tekstas').textContent = tekstas;
}

const uzduotys = () => sarasas(pamoka && pamoka.uzduotys);

async function rodyti(gyvai) {
  if (!gyvai || !gyvai.busena) {
    dabartinisRaktas = null;
    return rodytiLaukima('Pamoka dar neprasidėjo', 'Kai mokytojas ją pradės, viskas atsiras čia.');
  }
  // Mokytojas galėjo pakeisti pamoką su tuo pačiu kodu
  if (gyvai.pamoka && gyvai.pamoka !== pamokosId) {
    pamokosId = gyvai.pamoka;
    pamoka = await Rysys.gauti(`pamokos/${pamokosId}`);
    skaidres = sarasas(await Rysys.gauti(`skaidres/${pamokosId}`));
    manoAts = {};
    $('pamokos-pavadinimas').textContent = pamoka.pavadinimas || ('#' + kodas);
  }
  const b = gyvai.busena;
  // Naujas paleidimas (mokytojas paleido pamoką iš naujo): seni atsakymai nebegalioja
  if (gyvai.pradeta && gyvai.pradeta !== rodyti.pradeta) {
    if (rodyti.pradeta) { manoAts = {}; dabartinisRaktas = null; }
    rodyti.pradeta = gyvai.pradeta;
  }

  switch (b.tipas) {
    case 'skaidre': {
      dabartinisRaktas = 's' + b.skaidre;
      langas('r-skaidre');
      $('skaidre').src = skaidres[b.skaidre] || '';
      $('skaidre').alt = `Skaidrė ${b.skaidre + 1}`;
      break;
    }
    case 'uzduotis': rodytiBendraUzduoti(b.uzduotis, !!b.atskleista); break;
    case 'savarankiskai': rodytiSavoTempu(b.pradeta); break;
    case 'pabaiga': {
      dabartinisRaktas = 'pabaiga';
      if (Object.keys(manoAts).length) rodytiSuvestine('Pamoka baigta. Ačiū!');
      else rodytiLaukima('Pamoka baigta', 'Ačiū, kad dalyvavai!');
      break;
    }
    default: {
      dabartinisRaktas = 'laukti';
      rodytiLaukima(b.antraste || 'Žiūrėk į mokytoją', b.tekstas || 'Netrukus čia kažkas atsiras.');
    }
  }
}

function issaugotiAtsakyma(nr, ats) {
  manoAts[nr] = ats;
  return Rysys.rasyti(`atsakymai/${kodas}/${nr}/${uid}`, { ...ats, laikas: Date.now() }).catch(() => {});
}

// Visi kartu: mokytojas paleidžia vieną užduotį, paskui parodo atsakymą
function rodytiBendraUzduoti(nr, atskleista) {
  const u = uzduotys()[nr];
  if (!u) return;
  const raktas = 'u' + nr;
  if (dabartinisRaktas !== raktas || !dabartineUzd) {
    dabartinisRaktas = raktas;
    langas('r-uzduotis');
    $('savo-tempu-eiga').hidden = true;
    const ctl = sukurtiUzduoti($('uzduoties-vieta'), u, {
      onPateikti: (ats) => {
        issaugotiAtsakyma(nr, ats);
        ctl.uzrakinti('Atsakymas pateiktas. Palauk mokytojo.');
      }
    });
    dabartineUzd = { nr, ctl, atskleista: false };
    if (manoAts[nr]) ctl.uzrakinti('Atsakymas pateiktas. Palauk mokytojo.');
  }
  if (atskleista && !dabartineUzd.atskleista) {
    dabartineUzd.atskleista = true;
    dabartineUzd.ctl.atskleisti(manoAts[nr]);
  }
}

// Savo tempu: kiekvienas sprendžia visas užduotis savo greičiu
function rodytiSavoTempu(pradeta) {
  const raktas = 'st' + (pradeta || '');
  if (dabartinisRaktas === raktas) return;
  dabartinisRaktas = raktas;
  dabartineUzd = null;
  langas('r-uzduotis');
  $('savo-tempu-eiga').hidden = false;
  const visos = uzduotys();

  const kita = () => {
    const nr = visos.findIndex((_, i) => !manoAts[i]);
    if (nr === -1) return rodytiSuvestine('Atlikai visas užduotis!');
    const atlikta = Object.keys(manoAts).length;
    $('st-uzpildas').style.width = (atlikta / visos.length) * 100 + '%';
    $('st-tekstas').textContent = `${atlikta + 1}/${visos.length}`;
    const paskutine = visos.every((_, i) => i === nr || manoAts[i]);
    const ctl = sukurtiUzduoti($('uzduoties-vieta'), visos[nr], {
      poAtskleidimo: paskutine ? 'Baigti' : 'Toliau',
      onPateikti: (ats) => {
        issaugotiAtsakyma(nr, ats);
        ctl.atskleisti(ats);
        ctl.pateiktiMygtukas.onclick = () => { if (dabartinisRaktas === raktas) kita(); };
      }
    });
    window.scrollTo(0, 0);
  };
  kita();
}

function rodytiSuvestine(tekstas) {
  langas('r-suvestine');
  const visos = uzduotys();
  const atsakytos = visos.map((u, i) => ({ u, a: manoAts[i] })).filter((x) => x.a);
  const teisingai = atsakytos.filter((x) => x.a.gerai).length;
  $('taskai').innerHTML = `${teisingai}<small>/${atsakytos.length}</small>`;
  $('suvestines-tekstas').textContent = tekstas;
  const tvarka = [...atsakytos.filter((x) => !x.a.gerai), ...atsakytos.filter((x) => x.a.gerai)];
  $('paaiskinimai').innerHTML = tvarka.map(({ u, a }) => {
    const forma = isskaidytiZodi(u.zodis).forma || u.zodis;
    return `<li class="${a.gerai ? 'gerai' : 'klaida'}">
      <div class="zodzio-eilute">
        <b class="forma">${apsaugoti(forma)}</b>
        ${a.gerai ? '<span class="zyma gerai">Teisingai</span>' : `<span class="zyma klaida">Tu: <s>${apsaugoti(a.atsakyta)}</s></span>`}
      </div>
      ${u.kodel ? `<p>${apsaugoti(u.kodel)}</p>` : ''}
    </li>`;
  }).join('');
}

// ---------- Visas ekranas ----------

$('pilnas-ekranas').addEventListener('click', () => {
  const el = $('r-skaidre');
  if (document.fullscreenElement) document.exitFullscreen();
  else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
});
