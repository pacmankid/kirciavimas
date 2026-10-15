const $ = (id) => document.getElementById(id);

let pin = '';
let visi = [];

if (DEMO) $('demo-zyme').hidden = false;

async function gauti() {
  const ats = await siusti({ veiksmas: 'rezultatai', pin });
  if (!ats.ok) throw new Error(ats.klaida || 'Nepavyko gauti rezultatų');
  return ats.rezultatai || [];
}

$('pin-forma').addEventListener('submit', async (e) => {
  e.preventDefault();
  pin = $('pin').value;
  $('pin-klaida').textContent = '';
  $('pin-mygtukas').disabled = true;
  try {
    visi = await gauti();
    $('prisijungimas').hidden = true;
    $('skirtukai').hidden = false;
    rodytiSkilti('rezultatai');
    pildytiKlases();
    piesti();
    ikeltiUzduotis();
  } catch (klaida) {
    $('pin-klaida').textContent = klaida.message;
  } finally {
    $('pin-mygtukas').disabled = false;
  }
});

$('atnaujinti').addEventListener('click', async () => {
  try { visi = await gauti(); pildytiKlases(); piesti(); }
  catch (klaida) { alert(klaida.message); }
});
$('filtras-klase').addEventListener('change', () => { $('patvirtinimas').hidden = true; piesti(); });

// ---------- Valymas ----------

$('valyti').addEventListener('click', () => {
  const klase = $('filtras-klase').value;
  const kiek = visi.filter((r) => !klase || r.klase === klase).length;
  if (!kiek) {
    $('patv-tekstas').textContent = 'Nėra ką ištrinti.';
    $('patv-taip').hidden = true;
  } else {
    $('patv-tekstas').textContent = klase
      ? `Ištrinti ${kiek} ${klase} klasės rezultatus?`
      : `Ištrinti VISUS rezultatus (${kiek})?`;
    $('patv-taip').hidden = false;
  }
  $('patvirtinimas').hidden = false;
});

$('patv-ne').addEventListener('click', () => ($('patvirtinimas').hidden = true));

$('patv-taip').addEventListener('click', async () => {
  const mygtukas = $('patv-taip');
  mygtukas.disabled = true;
  mygtukas.textContent = 'Trinama…';
  try {
    const ats = await siusti({ veiksmas: 'valyti', pin, klase: $('filtras-klase').value });
    if (!ats.ok) throw new Error(ats.klaida || 'Nepavyko ištrinti');
    visi = await gauti();
    $('patvirtinimas').hidden = true;
    pildytiKlases();
    piesti();
  } catch (klaida) {
    $('patv-tekstas').textContent = klaida.message;
  } finally {
    mygtukas.disabled = false;
    mygtukas.textContent = 'Taip, ištrinti';
  }
});
$('filtras-vardas').addEventListener('input', piesti);

function pildytiKlases() {
  const dabartine = $('filtras-klase').value;
  const klases = [...new Set(visi.map((r) => r.klase))].sort();
  $('filtras-klase').innerHTML = '<option value="">Visos</option>' +
    klases.map((k) => `<option value="${apsaugoti(k)}">${apsaugoti(k)}</option>`).join('');
  $('filtras-klase').value = klases.includes(dabartine) ? dabartine : '';
}

function data(laikas) {
  const d = new Date(laikas);
  return isNaN(d) ? '' : d.toLocaleString('lt-LT', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function piesti() {
  const klase = $('filtras-klase').value;
  const paieska = $('filtras-vardas').value.trim().toLowerCase();
  const rodomi = visi
    .filter((r) => (!klase || r.klase === klase) && (!paieska || String(r.vardas).toLowerCase().includes(paieska)))
    .sort((a, b) => new Date(b.laikas) - new Date(a.laikas));

  // Santrauka
  $('sk-bandymu').textContent = rodomi.length;
  $('sk-mokiniu').textContent = new Set(rodomi.map((r) => r.vardas + '|' + r.klase)).size;
  const vid = rodomi.length
    ? Math.round((rodomi.reduce((s, r) => s + r.teisingai / r.isViso, 0) / rodomi.length) * 100)
    : null;
  $('vidurkis').textContent = vid === null ? '–' : vid + '%';

  // Sunkiausi žodžiai
  const klaidos = {};
  rodomi.forEach((r) => (r.atsakymai || []).forEach((a) => { if (!a.gerai) klaidos[a.zodis] = (klaidos[a.zodis] || 0) + 1; }));
  const sunkiausi = Object.entries(klaidos).sort((a, b) => b[1] - a[1]).slice(0, 6);
  $('sunkiausi').innerHTML = sunkiausi.length
    ? sunkiausi.map(([z, n]) => `<li><b>${apsaugoti(z)}</b> · suklysta ${n} k.</li>`).join('')
    : '<li style="background:var(--gerai-fonas)">Klaidų kol kas nėra</li>';

  // Lentelė
  $('eilutes').innerHTML = rodomi.length
    ? rodomi.map((r) => {
        const proc = Math.round((r.teisingai / r.isViso) * 100);
        const klaidos = (r.atsakymai || []).filter((a) => !a.gerai).map((a) => apsaugoti(a.zodis)).join(', ');
        return `<tr>
          <td><b>${apsaugoti(r.vardas)}</b></td>
          <td>${apsaugoti(r.klase)}</td>
          <td style="white-space:nowrap">${data(r.laikas)}</td>
          <td><div class="juostele"><div class="eiga-juosta"><div class="eiga-uzpildas" style="width:${proc}%"></div></div><span>${r.teisingai}/${r.isViso}</span></div></td>
          <td class="klaidos-zodziai">${klaidos || '<span style="color:var(--gerai); font-family:var(--sans); font-size:14px">be klaidų</span>'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" class="tuscia">Rezultatų dar nėra. Kai mokiniai atliks užduotis, jie atsiras čia.</td></tr>';
}

// ============================================================
//  Skirtukai
// ============================================================

function rodytiSkilti(skiltis) {
  ['rezultatai', 'uzduotys'].forEach((id) => ($(id).hidden = id !== skiltis));
  document.querySelectorAll('.skirtukas').forEach((b) => {
    const aktyvus = b.dataset.skiltis === skiltis;
    b.classList.toggle('aktyvus', aktyvus);
    if (aktyvus) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}
document.querySelectorAll('.skirtukas').forEach((b) => b.addEventListener('click', () => rodytiSkilti(b.dataset.skiltis)));

// ============================================================
//  Užduočių redaktorius
// ============================================================

let uzduotys = [];        // [{ id, zodis, sakinys, kodel, patvirtinta }]
let pakeista = false;
let paskutinisLaukas = null;
let kitasId = 1;

async function ikeltiUzduotis() {
  try {
    const ats = await siusti({ veiksmas: 'visosUzduotys', pin });
    if (!ats.ok) throw new Error(ats.klaida);
    // Jei lentelėje dar nieko nėra, pradedam nuo atsarginių užduočių.
    const sarasas = ats.uzduotys.length ? ats.uzduotys : UZDUOTYS;
    uzduotys = sarasas.map((u) => ({ ...u, id: kitasId++ }));
    zymetiPakeista(!ats.uzduotys.length);
    if (!ats.uzduotys.length) $('saugojimo-busena').textContent = 'Lentelė tuščia: įkeltos pradinės užduotys. Išsaugok, kad jos atsirastų lentelėje.';
  } catch (klaida) {
    $('saugojimo-busena').textContent = 'Nepavyko įkelti užduočių: ' + (klaida.message || klaida);
  }
  piestiUzduotis();
}

function zymetiPakeista(taip) {
  pakeista = taip;
  $('saugojimo-juosta').classList.toggle('pakeista', taip);
  $('uzd-saugoti').disabled = !taip;
  if (taip) $('saugojimo-busena').textContent = 'Yra neišsaugotų pakeitimų';
}

window.addEventListener('beforeunload', (e) => { if (pakeista) { e.preventDefault(); e.returnValue = ''; } });

function atnaujintiLaukiaZyme() {
  const laukia = uzduotys.filter((u) => !u.patvirtinta).length;
  $('laukia-zyme').hidden = !laukia;
  $('laukia-zyme').textContent = laukia;
}

function piestiUzduotis() {
  const filtras = $('uzd-filtras').value;
  const rodomos = uzduotys.filter((u) =>
    filtras === 'visos' || (filtras === 'laukia' ? !u.patvirtinta : u.patvirtinta));
  const sarasas = $('uzd-sarasas');
  sarasas.innerHTML = '';
  if (!rodomos.length) {
    sarasas.innerHTML = `<div class="kortele tuscia">${filtras === 'laukia' ? 'Visos užduotys patikrintos.' : 'Užduočių nėra.'}</div>`;
  }
  rodomos.forEach((u) => sarasas.append(sukurtiKortele(u)));
  atnaujintiLaukiaZyme();
}

function sukurtiKortele(u) {
  const k = document.createElement('article');
  k.className = 'uzd-kortele';
  k.innerHTML = `
    <div class="uzd-perziura">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
        <span class="perziuros-forma"></span>
        <span class="busenos-zyme"></span>
      </div>
      <div class="perziuros-skiemenys" aria-label="Skiemenys"></div>
      <p class="pagalba perziuros-priegaide"></p>
      <p class="perziuros-klaida"></p>
    </div>
    <div style="display:flex; flex-direction:column; gap:12px">
      <div class="laukas">
        <label for="z-${u.id}">Žodis su kirčiu ir skiemenimis</label>
        <input id="z-${u.id}" class="zodzio-laukas" autocomplete="off" spellcheck="false" placeholder="pvz. vã-ka-ras">
      </div>
      <div class="laukas">
        <label for="s-${u.id}">Sakinys (žodžio vietoje ___)</label>
        <input id="s-${u.id}" autocomplete="off" placeholder="pvz. Šiandien gražus ___.">
      </div>
      <div class="laukas">
        <label for="k-${u.id}">Kodėl taip kirčiuojama</label>
        <textarea id="k-${u.id}" placeholder="Trumpas paaiškinimas mokiniui"></textarea>
      </div>
    </div>
    <div class="uzd-veiksmai">
      <label class="jungiklis"><input type="checkbox"> Patvirtinta: rodyti mokiniams</label>
      <button type="button" class="tekstinis-mygtukas">Pašalinti užduotį</button>
    </div>`;

  const [zodis, sakinys, kodel] = k.querySelectorAll('input:not([type=checkbox]), textarea');
  const patvirtinta = k.querySelector('input[type=checkbox]');
  zodis.value = u.zodis || '';
  sakinys.value = u.sakinys || '';
  kodel.value = u.kodel || '';
  patvirtinta.checked = !!u.patvirtinta;

  [zodis, sakinys, kodel].forEach((laukas) => {
    laukas.addEventListener('focus', () => (paskutinisLaukas = laukas));
    laukas.addEventListener('input', () => {
      u.zodis = zodis.value; u.sakinys = sakinys.value; u.kodel = kodel.value;
      zymetiPakeista(true);
      atnaujintiPerziura(k, u);
    });
  });
  patvirtinta.addEventListener('change', () => {
    u.patvirtinta = patvirtinta.checked;
    zymetiPakeista(true);
    atnaujintiPerziura(k, u);
    atnaujintiLaukiaZyme();
  });
  k.querySelector('.tekstinis-mygtukas').addEventListener('click', () => {
    uzduotys = uzduotys.filter((x) => x !== u);
    zymetiPakeista(true);
    piestiUzduotis();
  });

  atnaujintiPerziura(k, u);
  return k;
}

function patikrinti(u) {
  const r = isskaidytiZodi(u.zodis);
  if (!r.ok) return r;
  if (!String(u.sakinys).includes('___')) return { ...r, ok: false, klaida: 'Sakinyje trūksta ___ (vietos žodžiui)' };
  return r;
}

function atnaujintiPerziura(k, u) {
  const r = isskaidytiZodi(u.zodis);
  const tikrinimas = patikrinti(u);
  k.querySelector('.perziuros-forma').textContent = r.ok ? r.forma : (u.zodis || 'Naujas žodis');
  k.querySelector('.perziuros-skiemenys').innerHTML = r.ok
    ? r.skiemenys.map((s, i) => `<span class="${i === r.kirtis ? 'kirc' : ''}">${apsaugoti(i === r.kirtis ? sudeti(s, r.vieta, r.zenklas) : s)}</span>`).join('')
    : '';
  k.querySelector('.perziuros-priegaide').textContent = r.ok
    ? `Kirčiuotas ${r.kirtis + 1}-asis skiemuo · ${PRIEGAIDES_VARDAS[r.zenklas]}`
    : '';
  k.querySelector('.perziuros-klaida').textContent = tikrinimas.ok ? '' : tikrinimas.klaida;
  const zyme = k.querySelector('.busenos-zyme');
  zyme.textContent = u.patvirtinta ? 'Patvirtinta' : 'Laukia patikrinimo';
  zyme.className = 'busenos-zyme ' + (u.patvirtinta ? 'patvirtinta' : 'laukia');
  k.classList.toggle('laukia', !u.patvirtinta);
  k.classList.toggle('klaidinga', u.patvirtinta && !tikrinimas.ok);
}

// Kirčio ženklų ir brūkšnelio mygtukai
document.querySelectorAll('[data-iterpti]').forEach((b) => {
  b.addEventListener('mousedown', (e) => e.preventDefault());
  b.addEventListener('click', () => {
    const l = paskutinisLaukas;
    if (!l || !document.body.contains(l)) return;
    const vieta = l.selectionStart ?? l.value.length;
    l.value = l.value.slice(0, vieta) + b.dataset.iterpti + l.value.slice(l.selectionEnd ?? vieta);
    l.focus();
    l.setSelectionRange(vieta + 1, vieta + 1);
    l.dispatchEvent(new Event('input'));
  });
});

$('uzd-filtras').addEventListener('change', piestiUzduotis);

$('uzd-nauja').addEventListener('click', () => {
  const u = { id: kitasId++, zodis: '', sakinys: '', kodel: '', patvirtinta: false };
  uzduotys.unshift(u);
  $('uzd-filtras').value = 'visos';
  zymetiPakeista(true);
  piestiUzduotis();
  $('z-' + u.id).focus();
});

$('uzd-saugoti').addEventListener('click', async () => {
  const blogos = uzduotys.filter((u) => u.patvirtinta && !patikrinti(u).ok);
  if (blogos.length) {
    $('saugojimo-busena').textContent = `Patvirtintose užduotyse yra klaidų (${blogos.length}). Pataisyk jas arba nuimk varnelę „Patvirtinta“.`;
    $('uzd-filtras').value = 'patvirtintos';
    piestiUzduotis();
    return;
  }
  const mygtukas = $('uzd-saugoti');
  mygtukas.disabled = true;
  $('saugojimo-busena').textContent = 'Saugoma…';
  try {
    const ats = await siusti({
      veiksmas: 'saugotiUzduotis', pin,
      uzduotys: uzduotys
        .filter((u) => String(u.zodis).trim())
        .map(({ zodis, sakinys, kodel, patvirtinta }) => ({ zodis: String(zodis).trim().normalize('NFC'), sakinys, kodel, patvirtinta }))
    });
    if (!ats.ok) throw new Error(ats.klaida || 'Nepavyko išsaugoti');
    zymetiPakeista(false);
    const patv = uzduotys.filter((u) => u.patvirtinta).length;
    $('saugojimo-busena').textContent = `Išsaugota. Mokiniams rodoma ${patv} užduočių.`;
  } catch (klaida) {
    mygtukas.disabled = false;
    $('saugojimo-busena').textContent = klaida.message;
  }
});
