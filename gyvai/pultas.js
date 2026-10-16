const $ = (id) => document.getElementById(id);

const SKILTYS = ['m-prisijungimas', 'm-pamokos', 'm-redaktorius', 'm-gyvai', 'm-pabaiga'];
function rodytiSkilti(id) {
  SKILTYS.forEach((s) => ($(s).hidden = s !== id));
  window.scrollTo(0, 0);
}

if (Rysys.demo) $('demo-zyme').hidden = false;

// ============================================================
//  Prisijungimas
// ============================================================

let pamokos = {};

Rysys.stebetiVartotoja(async (vartotojas) => {
  if (!vartotojas || vartotojas.isAnonymous) {
    $('mokytojo-pastas').textContent = '';
    return rodytiSkilti('m-prisijungimas');
  }
  $('mokytojo-pastas').textContent = Rysys.demo ? '' : vartotojas.email;
  try {
    await ikeltiPamokas();
    rodytiSkilti('m-pamokos');
  } catch (e) {
    $('prisijungimo-klaida').textContent = 'Ši Google paskyra neturi mokytojo teisių. Prisijunk kita paskyra.';
    rodytiSkilti('m-prisijungimas');
    Rysys.atsijungti();
  }
});

$('prisijungti-google').addEventListener('click', async () => {
  $('prisijungimo-klaida').textContent = '';
  try { await Rysys.prisijungtiMokytojui(); }
  catch (e) { $('prisijungimo-klaida').textContent = 'Nepavyko prisijungti: ' + (e.message || e); }
});

// ============================================================
//  Pamokų sąrašas
// ============================================================

async function ikeltiPamokas() {
  pamokos = (await Rysys.gauti('pamokos')) || {};
  piestiPamokas();
}

function piestiPamokas() {
  const sarasasEl = $('pamoku-sarasas');
  const ids = Object.keys(pamokos).sort((a, b) => (pamokos[b].atnaujinta || 0) - (pamokos[a].atnaujinta || 0));
  if (!ids.length) {
    sarasasEl.innerHTML = '<div class="kortele tuscia">Pamokų dar nėra. Spausk „+ Sukurti pamoką“.</div>';
    return;
  }
  sarasasEl.innerHTML = '';
  ids.forEach((id) => {
    const p = pamokos[id];
    const k = document.createElement('article');
    k.className = 'kortele pamokos-kortele';
    k.innerHTML = `
      <h3></h3>
      <span class="didelis-kodas" style="font-size:20px; align-self:flex-start; padding:4px 12px">#${apsaugoti(p.kodas)}</span>
      <p class="info">${p.skaidriuSk || 0} skaidr. · ${sarasas(p.uzduotys).length} užd.</p>
      <div class="veiksmai">
        <button class="mygtukas mazas" data-v="pradeti">Pradėti gyvai</button>
        <button class="mygtukas antrinis mazas" data-v="redaguoti">Redaguoti</button>
        <button class="tekstinis-mygtukas" data-v="trinti">Ištrinti</button>
      </div>
      <div class="patvirtinimas kortele" hidden style="padding:12px">
        <p style="margin:0 0 10px; font-weight:500">Ištrinti pamoką visam laikui?</p>
        <div style="display:flex; gap:8px"><button class="mygtukas pavojingas mazas" data-v="trinti-taip">Ištrinti</button><button class="mygtukas antrinis mazas" data-v="trinti-ne">Atšaukti</button></div>
      </div>`;
    k.querySelector('h3').textContent = p.pavadinimas || 'Be pavadinimo';
    const patv = k.querySelector('.patvirtinimas');
    k.querySelector('[data-v=pradeti]').addEventListener('click', () => pradetiGyvai(id));
    k.querySelector('[data-v=redaguoti]').addEventListener('click', () => atidarytiRedaktoriu(id));
    k.querySelector('[data-v=trinti]').addEventListener('click', () => (patv.hidden = false));
    k.querySelector('[data-v=trinti-ne]').addEventListener('click', () => (patv.hidden = true));
    k.querySelector('[data-v=trinti-taip]').addEventListener('click', async () => {
      await Promise.all([
        Rysys.istrinti(`pamokos/${id}`),
        Rysys.istrinti(`skaidres/${id}`),
        Rysys.gauti(`kodai/${p.kodas}`).then((x) => x === id && Rysys.istrinti(`kodai/${p.kodas}`)),
        Rysys.istrinti(`gyvai/${p.kodas}`)
      ]);
      delete pamokos[id];
      piestiPamokas();
    });
    sarasasEl.append(k);
  });
}

$('nauja-pamoka').addEventListener('click', () => atidarytiRedaktoriu(null));

// ============================================================
//  Pamokos redaktorius
// ============================================================

let red = null; // { id, senasKodas, skaidres: [dataURL], skaidresPakeistos, uzduotys: [] }
let bankas = null;

const ZODZIAI = ['lietuva', 'gintaras', 'nemunas', 'gandras', 'ruta', 'saule', 'azuolas', 'kregzde', 'bitute', 'vilnius', 'dainava', 'zemaitija', 'aukstaitija', 'baltija', 'medis', 'upe'];

async function siulytiKoda() {
  for (let i = 0; i < 20; i++) {
    const zodis = ZODZIAI[Math.floor(Math.random() * ZODZIAI.length)] + (i > 4 ? Math.floor(Math.random() * 90 + 10) : '');
    const uzimtas = await Rysys.gauti(`kodai/${zodis}`);
    if (!uzimtas || (red && uzimtas === red.id)) return zodis;
  }
  return 'pamoka' + Math.floor(Math.random() * 9000 + 1000);
}

async function atidarytiRedaktoriu(id) {
  const p = id ? pamokos[id] : null;
  red = {
    id: id || Rysys.naujasId(),
    naujas: !id,
    senasKodas: p ? p.kodas : null,
    skaidres: [],
    skaidresPakeistos: false,
    uzduotys: p ? sarasas(p.uzduotys) : []
  };
  $('redaktoriaus-antraste').textContent = id ? 'Redaguoti pamoką' : 'Nauja pamoka';
  $('r-pavadinimas').value = p ? p.pavadinimas || '' : '';
  $('r-kodas').value = p ? p.kodas : await siulytiKoda();
  $('r-busena').textContent = '';
  $('r-n-klaida').textContent = '';
  rodytiSkilti('m-redaktorius');
  piestiRedUzduotis();
  if (id) {
    $('r-skaidriu-busena').textContent = 'Įkeliamos skaidrės…';
    red.skaidres = sarasas(await Rysys.gauti(`skaidres/${id}`));
  }
  piestiRedSkaidres();
  ikeltiBanka();
}

$('atsaukti-redagavima').addEventListener('click', () => { red = null; rodytiSkilti('m-pamokos'); });
$('r-generuoti').addEventListener('click', async () => ($('r-kodas').value = await siulytiKoda()));
$('r-kodas').addEventListener('blur', () => ($('r-kodas').value = normalizuotiKoda($('r-kodas').value)));

function piestiRedSkaidres() {
  $('r-skaidres').innerHTML = red.skaidres.map((s, i) => `<figure><img src="${s}" alt="Skaidrė ${i + 1}"><figcaption>${i + 1}</figcaption></figure>`).join('');
  $('r-skaidriu-busena').textContent = red.skaidres.length
    ? `${red.skaidres.length} skaidr. Įkėlus naują failą, skaidrės bus pakeistos.`
    : 'PowerPoint ar Keynote skaidres išsaugok kaip PDF.';
  $('r-isvalyti-skaidres').hidden = !red.skaidres.length;
}

$('r-isvalyti-skaidres').addEventListener('click', () => {
  red.skaidres = [];
  red.skaidresPakeistos = true;
  piestiRedSkaidres();
});

// --- Skaidrių paruošimas: PDF puslapiai ir paveikslėliai paverčiami JPEG ---

const SKAIDRES_PLOTIS = Rysys.demo ? 960 : 1600;
const SKAIDRES_KOKYBE = Rysys.demo ? 0.6 : 0.82;

function ikeltiScenariju(src) {
  return new Promise((ok, klaida) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => klaida(new Error('Nepavyko įkelti PDF skaitytuvo. Patikrink interneto ryšį.'));
    document.head.append(s);
  });
}

async function pdfSkaitytuvas() {
  if (!window.pdfjsLib) {
    await ikeltiScenariju('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return pdfjsLib;
}

function drobeIJpeg(saltinis, plotis, aukstis) {
  const mastelis = Math.min(1, SKAIDRES_PLOTIS / plotis);
  const c = document.createElement('canvas');
  c.width = Math.round(plotis * mastelis);
  c.height = Math.round(aukstis * mastelis);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(saltinis, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', SKAIDRES_KOKYBE);
}

async function pdfISkaidres(failas, pranesti) {
  const lib = await pdfSkaitytuvas();
  const doc = await lib.getDocument({ data: await failas.arrayBuffer() }).promise;
  const rez = [];
  for (let i = 1; i <= doc.numPages; i++) {
    pranesti(`Ruošiama ${i}/${doc.numPages} skaidrė…`);
    const puslapis = await doc.getPage(i);
    const v1 = puslapis.getViewport({ scale: 1 });
    const v = puslapis.getViewport({ scale: Math.min(3, SKAIDRES_PLOTIS / v1.width) });
    const c = document.createElement('canvas');
    c.width = Math.round(v.width);
    c.height = Math.round(v.height);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    await puslapis.render({ canvasContext: ctx, viewport: v }).promise;
    rez.push(c.toDataURL('image/jpeg', SKAIDRES_KOKYBE));
  }
  return rez;
}

async function paveikslelisISkaidre(failas) {
  const url = URL.createObjectURL(failas);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return drobeIJpeg(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

$('r-failai').addEventListener('change', async (e) => {
  const failai = [...e.target.files].sort((a, b) => a.name.localeCompare(b.name, 'lt', { numeric: true }));
  e.target.value = '';
  if (!failai.length) return;
  const pranesti = (t) => ($('r-skaidriu-busena').textContent = t);
  try {
    const naujos = [];
    for (const f of failai) {
      if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) naujos.push(...(await pdfISkaidres(f, pranesti)));
      else if (f.type.startsWith('image/')) { pranesti(`Ruošiama ${f.name}…`); naujos.push(await paveikslelisISkaidre(f)); }
    }
    if (!naujos.length) return pranesti('Tinka tik PDF arba paveikslėliai.');
    red.skaidres = naujos;
    red.skaidresPakeistos = true;
    piestiRedSkaidres();
  } catch (klaida) {
    pranesti(klaida.message || 'Nepavyko paruošti skaidrių.');
  }
});

// --- Užduotys ---

function piestiRedUzduotis() {
  $('r-uzd-sk').textContent = red.uzduotys.length;
  const el = $('r-uzduotys');
  if (!red.uzduotys.length) {
    el.innerHTML = '<p class="pagalba" style="padding:12px 14px; margin:0">Užduočių dar nėra. Pridėk iš banko arba sukurk naują.</p>';
  } else {
    el.innerHTML = '';
    red.uzduotys.forEach((u, i) => {
      const eil = document.createElement('div');
      eil.className = 'uzd-eilute';
      eil.style.padding = '10px 14px';
      eil.innerHTML = `<div><span class="forma"></span><small></small></div>
        <div style="display:flex; gap:4px">
          <button class="tekstinis-mygtukas" style="color:var(--pilka)" data-v="aukstyn" aria-label="Perkelti aukštyn" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="tekstinis-mygtukas" data-v="salinti">Pašalinti</button>
        </div>`;
      eil.querySelector('.forma').textContent = isskaidytiZodi(u.zodis).forma || u.zodis;
      eil.querySelector('small').textContent = u.sakinys;
      eil.querySelector('[data-v=salinti]').addEventListener('click', () => { red.uzduotys.splice(i, 1); piestiRedUzduotis(); piestiBanka(); });
      eil.querySelector('[data-v=aukstyn]').addEventListener('click', () => {
        [red.uzduotys[i - 1], red.uzduotys[i]] = [red.uzduotys[i], red.uzduotys[i - 1]];
        piestiRedUzduotis();
      });
      el.append(eil);
    });
  }
}

async function ikeltiBanka() {
  if (!bankas) {
    try {
      const ats = await siusti({ veiksmas: 'uzduotys' });
      bankas = ats.ok && ats.uzduotys.length ? ats.uzduotys : UZDUOTYS;
    } catch {
      bankas = UZDUOTYS;
    }
    bankas = bankas.filter((u) => isskaidytiZodi(u.zodis).ok);
  }
  piestiBanka();
}

function piestiBanka() {
  if (!bankas || !red) return;
  $('r-banko-busena').textContent = `Patvirtintos užduotys iš banko (${bankas.length}). Pažymėk, kurias įtraukti.`;
  const el = $('r-bankas');
  el.innerHTML = '';
  bankas.forEach((u) => {
    const l = document.createElement('label');
    const yra = red.uzduotys.some((x) => x.zodis === u.zodis && x.sakinys === u.sakinys);
    l.innerHTML = `<input type="checkbox" ${yra ? 'checked' : ''}><span class="forma"></span><small></small>`;
    l.querySelector('.forma').textContent = isskaidytiZodi(u.zodis).forma;
    l.querySelector('small').textContent = u.sakinys;
    l.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) red.uzduotys.push({ zodis: u.zodis, sakinys: u.sakinys, kodel: u.kodel || '' });
      else red.uzduotys = red.uzduotys.filter((x) => !(x.zodis === u.zodis && x.sakinys === u.sakinys));
      piestiRedUzduotis();
    });
    el.append(l);
  });
}

let paskutinisLaukas = null;
['r-n-zodis', 'r-n-sakinys', 'r-n-kodel'].forEach((id) => $(id).addEventListener('focus', () => (paskutinisLaukas = $(id))));
document.querySelectorAll('[data-iterpti]').forEach((b) => {
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', () => {
    const l = paskutinisLaukas || $('r-n-zodis');
    const v = l.selectionStart ?? l.value.length;
    l.value = l.value.slice(0, v) + b.dataset.iterpti + l.value.slice(l.selectionEnd ?? v);
    l.focus();
    l.setSelectionRange(v + 1, v + 1);
  });
});

$('r-n-prideti').addEventListener('click', () => {
  const u = { zodis: $('r-n-zodis').value.trim().normalize('NFC'), sakinys: $('r-n-sakinys').value.trim(), kodel: $('r-n-kodel').value.trim() };
  const r = isskaidytiZodi(u.zodis);
  if (!r.ok) return ($('r-n-klaida').textContent = r.klaida);
  if (!u.sakinys.includes('___')) return ($('r-n-klaida').textContent = 'Sakinyje trūksta ___ (vietos žodžiui)');
  $('r-n-klaida').textContent = '';
  red.uzduotys.push(u);
  ['r-n-zodis', 'r-n-sakinys', 'r-n-kodel'].forEach((id) => ($(id).value = ''));
  piestiRedUzduotis();
});

$('r-saugoti').addEventListener('click', async () => {
  const busena = (t) => ($('r-busena').textContent = t);
  const kodas = normalizuotiKoda($('r-kodas').value);
  $('r-kodas').value = kodas;
  const pavadinimas = $('r-pavadinimas').value.trim();
  if (!pavadinimas) return busena('Įrašyk pamokos pavadinimą.');
  if (!kodas) return busena('Įrašyk prisijungimo kodą.');
  if (!red.skaidres.length && !red.uzduotys.length) return busena('Pridėk skaidrių arba užduočių.');

  const mygtukas = $('r-saugoti');
  mygtukas.disabled = true;
  try {
    const kitas = await Rysys.gauti(`kodai/${kodas}`);
    if (kitas && kitas !== red.id) throw new Error(`Kodas #${kodas} jau naudojamas kitoje pamokoje. Pasirink kitą.`);

    if (red.skaidresPakeistos) {
      await Rysys.istrinti(`skaidres/${red.id}`);
      for (let i = 0; i < red.skaidres.length; i++) {
        busena(`Saugomos skaidrės ${i + 1}/${red.skaidres.length}…`);
        await Rysys.rasyti(`skaidres/${red.id}/${i}`, red.skaidres[i]);
      }
    }
    busena('Saugoma…');
    const pamoka = {
      pavadinimas,
      kodas,
      skaidriuSk: red.skaidres.length,
      uzduotys: red.uzduotys,
      atnaujinta: Date.now()
    };
    await Rysys.rasyti(`pamokos/${red.id}`, pamoka);
    await Rysys.rasyti(`kodai/${kodas}`, red.id);
    if (red.senasKodas && red.senasKodas !== kodas) {
      const senas = await Rysys.gauti(`kodai/${red.senasKodas}`);
      if (senas === red.id) await Rysys.istrinti(`kodai/${red.senasKodas}`);
    }
    pamokos[red.id] = pamoka;
    red = null;
    piestiPamokas();
    rodytiSkilti('m-pamokos');
  } catch (klaida) {
    busena(klaida.message || 'Nepavyko išsaugoti.');
  } finally {
    mygtukas.disabled = false;
  }
});

// ============================================================
//  Gyva pamoka
// ============================================================

let g = null; // { id, kodas, pamoka, skaidres, uzduotys, busena, paskSkaidre, dalyviai, atsakymai, atjungti: [] }

async function pradetiGyvai(id) {
  const pamoka = pamokos[id];
  const kodas = pamoka.kodas;
  const skaidres = sarasas(await Rysys.gauti(`skaidres/${id}`));
  g = {
    id, kodas, pamoka, skaidres,
    uzduotys: sarasas(pamoka.uzduotys),
    busena: { tipas: 'laukti' },
    paskSkaidre: 0,
    dalyviai: {},
    atsakymai: {},
    atjungti: []
  };

  // Seni atsakymai išvalomi, atsijungę dalyviai pašalinami (prisijungę iš anksto lieka)
  await Rysys.istrinti(`atsakymai/${kodas}`);
  const seni = (await Rysys.gauti(`dalyviai/${kodas}`)) || {};
  await Promise.all(Object.entries(seni).filter(([, d]) => !d.aktyvus).map(([u]) => Rysys.istrinti(`dalyviai/${kodas}/${u}`)));
  await Rysys.rasyti(`kodai/${kodas}`, id);
  await Rysys.rasyti(`gyvai/${kodas}`, { pamoka: id, pavadinimas: pamoka.pavadinimas, pradeta: Date.now(), busena: g.busena });

  const adresas = new URL('./', location.href);
  $('g-adresas').textContent = adresas.host + adresas.pathname.replace(/\/$/, '');
  $('g-pavadinimas').textContent = pamoka.pavadinimas;
  $('g-kodas').textContent = '#' + kodas;
  $('g-baigti-patv').hidden = true;
  $('g-siusti-eilute').hidden = !SKRIPTO_ADRESAS;

  $('g-miniaturos').innerHTML = '';
  g.skaidres.forEach((s, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<img src="${s}" alt=""><span>${i + 1}</span>`;
    b.setAttribute('aria-label', `Rodyti ${i + 1} skaidrę`);
    b.addEventListener('click', () => rodytiSkaidre(i));
    $('g-miniaturos').append(b);
  });

  g.atjungti.push(Rysys.klausyti(`dalyviai/${kodas}`, (d) => { if (g) { g.dalyviai = d || {}; piestiStatistika(); } }));
  g.atjungti.push(Rysys.klausyti(`atsakymai/${kodas}`, (a) => { if (g) { g.atsakymai = a || {}; piestiStatistika(); } }));

  rodytiSkilti('m-gyvai');
  piestiPulta();
}

function nustatyti(busena) {
  g.busena = busena;
  if (busena.tipas === 'skaidre') g.paskSkaidre = busena.skaidre;
  Rysys.rasyti(`gyvai/${g.kodas}/busena`, busena);
  piestiPulta();
}

function rodytiSkaidre(nr) {
  if (!g.skaidres.length) return;
  nustatyti({ tipas: 'skaidre', skaidre: Math.max(0, Math.min(g.skaidres.length - 1, nr)) });
}

function kitaSkaidre(kryptis) {
  if (!g || !g.skaidres.length) return;
  if (g.busena.tipas !== 'skaidre') return rodytiSkaidre(g.paskSkaidre);
  rodytiSkaidre(g.busena.skaidre + kryptis);
}

function lauktiArbaGrizti() {
  if (g.busena.tipas === 'laukti') rodytiSkaidre(g.paskSkaidre);
  else nustatyti({ tipas: 'laukti' });
}

$('g-pirmyn').addEventListener('click', () => kitaSkaidre(1));
$('g-atgal').addEventListener('click', () => kitaSkaidre(-1));
$('g-laukti').addEventListener('click', lauktiArbaGrizti);
$('g-savo-tempu').addEventListener('click', () => nustatyti({ tipas: 'savarankiskai', pradeta: Date.now() }));

// Klaviatūra ir skaidrių pultelis
document.addEventListener('keydown', (e) => {
  if (!g || $('m-gyvai').hidden) return;
  if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (['ArrowRight', 'PageDown', 'ArrowDown'].includes(e.key)) { e.preventDefault(); kitaSkaidre(1); }
  else if (['ArrowLeft', 'PageUp', 'ArrowUp'].includes(e.key)) { e.preventDefault(); kitaSkaidre(-1); }
  else if (['b', 'B', '.', 'w', 'W'].includes(e.key)) { e.preventDefault(); lauktiArbaGrizti(); }
});

function piestiPulta() {
  const b = g.busena;
  const p = $('g-perziura');
  const zyme = '<span class="perziuros-zyme">Mokiniai mato</span>';
  if (b.tipas === 'skaidre') {
    p.innerHTML = `${zyme}<img src="${g.skaidres[b.skaidre]}" alt="Skaidrė ${b.skaidre + 1}">`;
  } else if (b.tipas === 'uzduotis') {
    const u = g.uzduotys[b.uzduotis];
    p.innerHTML = `${zyme}<div class="perz-tekstas"><b>${apsaugoti(isskaidytiZodi(u.zodis).forma)}</b>„${apsaugoti(u.sakinys)}“<br><span class="pagalba" style="color:#BDBAB2">${b.atskleista ? 'Atsakymas parodytas mokiniams' : 'Mokiniai atsakinėja, atsakymas paslėptas'}</span></div>`;
  } else if (b.tipas === 'savarankiskai') {
    p.innerHTML = `${zyme}<div class="perz-tekstas"><b>Savo tempu</b>Mokiniai sprendžia visas ${g.uzduotys.length} užduotis</div>`;
  } else {
    p.innerHTML = `${zyme}<div class="perz-tekstas"><b>Žiūrėk į mokytoją</b>Laukimo langas</div>`;
  }

  const skNr = b.tipas === 'skaidre' ? b.skaidre : g.paskSkaidre;
  $('g-skaidres-nr').textContent = g.skaidres.length ? `${skNr + 1} / ${g.skaidres.length}` : 'Skaidrių nėra';
  $('g-atgal').disabled = !g.skaidres.length || (b.tipas === 'skaidre' && b.skaidre === 0);
  $('g-pirmyn').disabled = !g.skaidres.length || (b.tipas === 'skaidre' && b.skaidre === g.skaidres.length - 1);
  $('g-pirmyn').textContent = b.tipas === 'skaidre' ? 'Kita skaidrė ▶' : 'Rodyti skaidrę ▶';
  $('g-laukti').classList.toggle('aktyvus-rezimas', b.tipas === 'laukti');
  $('g-laukti').textContent = b.tipas === 'laukti' ? 'Grįžti į skaidrę' : 'Laukimo langas';
  $('g-savo-tempu').classList.toggle('aktyvus-rezimas', b.tipas === 'savarankiskai');
  $('g-savo-tempu').hidden = !g.uzduotys.length;
  [...$('g-miniaturos').children].forEach((m, i) => m.classList.toggle('dabar', b.tipas === 'skaidre' && b.skaidre === i));
  const dabartine = [...$('g-miniaturos').children][skNr];
  if (dabartine) dabartine.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  piestiStatistika();
}

const aktyvus = () => Object.values(g.dalyviai).filter((d) => d && d.aktyvus).length;
const atsakymaiUzd = (nr) => Object.values((g.atsakymai && g.atsakymai[nr]) || {});

function piestiStatistika() {
  if (!g) return;
  const b = g.busena;
  $('g-prisijunge').innerHTML = `${aktyvus()}<small> ${Rysys.demo ? '(demo)' : ''}</small>`;

  // Užduočių sąrašas
  const el = $('g-uzduotys');
  if (!g.uzduotys.length) el.innerHTML = '<p class="pagalba">Šioje pamokoje užduočių nėra.</p>';
  else {
    el.innerHTML = '';
    g.uzduotys.forEach((u, i) => {
      const dabar = b.tipas === 'uzduotis' && b.uzduotis === i;
      const ats = atsakymaiUzd(i);
      const gerai = ats.filter((a) => a.gerai).length;
      const eil = document.createElement('div');
      eil.className = 'uzd-eilute' + (dabar ? ' dabar' : '');
      eil.innerHTML = `<div><span class="forma"></span><small>${ats.length ? `Atsakė ${ats.length} · teisingai ${gerai}` : 'Dar nepaleista'}</small></div><div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end"></div>`;
      eil.querySelector('.forma').textContent = isskaidytiZodi(u.zodis).forma;
      const veiksmai = eil.lastElementChild;
      if (!dabar) {
        const pal = document.createElement('button');
        pal.className = 'mygtukas mazas';
        pal.textContent = ats.length ? 'Kartoti' : 'Paleisti';
        pal.addEventListener('click', () => nustatyti({ tipas: 'uzduotis', uzduotis: i, atskleista: false }));
        veiksmai.append(pal);
      } else if (!b.atskleista) {
        const atsk = document.createElement('button');
        atsk.className = 'mygtukas mazas';
        atsk.style.background = 'var(--gerai)';
        atsk.textContent = 'Rodyti atsakymą';
        atsk.addEventListener('click', () => nustatyti({ ...b, atskleista: true }));
        veiksmai.append(atsk);
      } else {
        veiksmai.innerHTML = '<span class="ats-zyme gerai">Atsakymas parodytas</span>';
      }
      el.append(eil);
    });
  }

  // Dalyviai
  const dalyviai = Object.entries(g.dalyviai).filter(([, d]) => d && d.vardas)
    .sort((a, b) => String(a[1].vardas).localeCompare(String(b[1].vardas), 'lt'));
  $('g-dalyviai').innerHTML = dalyviai.length
    ? dalyviai.map(([uid, d]) => {
        let busena = '';
        if (b.tipas === 'uzduotis') {
          const a = g.atsakymai[b.uzduotis] && g.atsakymai[b.uzduotis][uid];
          busena = !a ? '<span class="ats-zyme">–</span>'
            : !b.atskleista ? '<span class="ats-zyme">atsakė</span>'
            : a.gerai ? '<span class="ats-zyme gerai">✓ teisingai</span>' : '<span class="ats-zyme klaida">✗ klaida</span>';
        } else {
          const visi = Object.values(g.atsakymai).map((x) => x && x[uid]).filter(Boolean);
          busena = visi.length ? `<span class="ats-zyme">${visi.filter((a) => a.gerai).length}/${visi.length}</span>` : '';
        }
        return `<li class="${d.aktyvus ? '' : 'atsijunges'}"><span>${apsaugoti(d.vardas)} <small class="pagalba">${apsaugoti(d.klase || '')}${d.aktyvus ? '' : ' · atsijungė'}</small></span>${busena}</li>`;
      }).join('')
    : `<li class="pagalba" style="border:none">Laukiama mokinių. Kodas: <b>#${apsaugoti(g.kodas)}</b></li>`;
}

// --- Pabaiga ---

$('g-baigti').addEventListener('click', () => ($('g-baigti-patv').hidden = false));
$('g-baigti-ne').addEventListener('click', () => ($('g-baigti-patv').hidden = true));

$('g-baigti-taip').addEventListener('click', async () => {
  const siustiILentele = !!SKRIPTO_ADRESAS && $('g-siusti').checked;
  nustatyti({ tipas: 'pabaiga' });
  g.atjungti.forEach((f) => f());
  const baigta = g;
  g = null;

  // Rezultatai pagal mokinį
  const eilutes = Object.entries(baigta.dalyviai).filter(([, d]) => d && d.vardas).map(([uid, d]) => {
    const atsakymai = baigta.uzduotys.map((u, i) => {
      const a = baigta.atsakymai[i] && baigta.atsakymai[i][uid];
      return a ? { zodis: isskaidytiZodi(u.zodis).forma, atsakyta: a.atsakyta, gerai: !!a.gerai } : null;
    }).filter(Boolean);
    return { vardas: d.vardas, klase: d.klase || '', atsakymai, teisingai: atsakymai.filter((a) => a.gerai).length };
  }).sort((a, b) => a.vardas.localeCompare(b.vardas, 'lt'));

  $('p-eilutes').innerHTML = eilutes.length ? eilutes.map((r) => `<tr>
      <td><b>${apsaugoti(r.vardas)}</b></td><td>${apsaugoti(r.klase)}</td>
      <td>${r.teisingai}/${r.atsakymai.length}</td>
      <td class="klaidos-zodziai">${r.atsakymai.filter((a) => !a.gerai).map((a) => apsaugoti(a.zodis)).join(', ') || '<span style="color:var(--gerai); font-family:var(--sans); font-size:14px">be klaidų</span>'}</td>
    </tr>`).join('') : '<tr><td colspan="4" class="tuscia">Mokinių nebuvo.</td></tr>';
  rodytiSkilti('m-pabaiga');

  const suAtsakymais = eilutes.filter((r) => r.atsakymai.length);
  if (!siustiILentele || !suAtsakymais.length) {
    $('p-busena').textContent = 'Pamoka baigta.';
    return;
  }
  $('p-busena').textContent = 'Rezultatai saugomi Google lentelėje…';
  let pavyko = 0;
  for (const r of suAtsakymais) {
    try {
      const ats = await siusti({ veiksmas: 'irasyti', vardas: r.vardas, klase: r.klase, teisingai: r.teisingai, isViso: r.atsakymai.length, atsakymai: r.atsakymai });
      if (ats.ok) pavyko++;
    } catch {}
  }
  $('p-busena').textContent = pavyko === suAtsakymais.length
    ? `Pamoka baigta. ${pavyko} mokinių rezultatai išsaugoti Google lentelėje ir matomi skiltyje „Rezultatai“.`
    : `Pamoka baigta. Išsaugota ${pavyko} iš ${suAtsakymais.length} rezultatų.`;
});

$('p-grizti').addEventListener('click', () => rodytiSkilti('m-pamokos'));
