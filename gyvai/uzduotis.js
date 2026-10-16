// ============================================================
//  Kirčiavimo užduoties valdiklis: mokinys paliečia kirčiuotą
//  skiemenį ir pasirenka priegaidę. Naudojamas mokinio ekrane.
// ============================================================

function vietaSkiemenyje(r, i) {
  return i === r.kirtis ? r.vieta : Math.min(2, r.skiemenys[i].length);
}

function atsakymoForma(r, skiem, prieg) {
  if (skiem == null || prieg == null) return '';
  return r.skiemenys.map((s, i) => (i === skiem ? sudeti(s, vietaSkiemenyje(r, i), PRIEGAIDES[prieg].zenklas) : s)).join('');
}

// u = { zodis: 'vã-ka-ras', sakinys, kodel }
// nustatymai: { onPateikti(atsakymas), mygtukas: 'Pateikti' }
function sukurtiUzduoti(konteineris, u, nustatymai = {}) {
  const r = isskaidytiZodi(u.zodis);
  let pasSkiem = null, pasPrieg = null, uzrakinta = false, rodomas = null;

  konteineris.innerHTML = `
    <div class="klausimas">
      <p class="antraste">Kur kirtis?</p>
      <p class="pagalba centre">Paliesk kirčiuotą skiemenį, tada pasirink priegaidę</p>
    </div>
    <p class="sakinys"></p>
    <div class="skiemenys" role="group" aria-label="Skiemenys"></div>
    <div class="pasirinkimai" role="group" aria-label="Priegaidė"></div>
    <div class="uzd-pranesimas" aria-live="polite"></div>
    <button class="mygtukas uzd-pateikti" disabled>${nustatymai.mygtukas || 'Pateikti'}</button>`;

  konteineris.querySelector('.sakinys').textContent = '„' + (u.sakinys || '') + '“';
  const pateikti = konteineris.querySelector('.uzd-pateikti');

  function piesti() {
    const sk = konteineris.querySelector('.skiemenys');
    const pr = konteineris.querySelector('.pasirinkimai');
    sk.innerHTML = '';
    pr.innerHTML = '';
    r.skiemenys.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'plytele';
      if (!rodomas && i === pasSkiem) b.classList.add('pasirinkta');
      if (rodomas && i === r.kirtis) b.classList.add('teisingas');
      if (rodomas && i === pasSkiem && i !== r.kirtis) b.classList.add('neteisingas');
      b.textContent = s;
      b.disabled = uzrakinta;
      b.setAttribute('aria-pressed', i === pasSkiem);
      b.addEventListener('click', () => { pasSkiem = i; pasPrieg = null; piesti(); });
      sk.append(b);
    });
    PRIEGAIDES.forEach((g, i) => {
      const rodSkiem = rodomas ? r.kirtis : pasSkiem;
      const s = rodSkiem == null ? 'a' : r.skiemenys[rodSkiem];
      const b = document.createElement('button');
      b.className = 'plytele';
      if (!rodomas && i === pasPrieg) b.classList.add('pasirinkta');
      if (rodomas && g.zenklas === r.zenklas) b.classList.add('teisingas');
      if (rodomas && i === pasPrieg && g.zenklas !== r.zenklas) b.classList.add('neteisingas');
      b.innerHTML = `<span class="forma">${apsaugoti(sudeti(s, rodSkiem == null ? 1 : vietaSkiemenyje(r, rodSkiem), g.zenklas))}</span><small>${g.vardas}</small>`;
      b.disabled = uzrakinta || pasSkiem == null;
      b.addEventListener('click', () => { pasPrieg = i; piesti(); });
      pr.append(b);
    });
    pateikti.disabled = rodomas && nustatymai.poAtskleidimo
      ? false
      : uzrakinta || pasSkiem == null || pasPrieg == null;
  }

  pateikti.addEventListener('click', () => {
    if (uzrakinta) return;
    uzrakinta = true;
    const ats = {
      skiem: pasSkiem,
      prieg: pasPrieg,
      atsakyta: atsakymoForma(r, pasSkiem, pasPrieg),
      gerai: pasSkiem === r.kirtis && PRIEGAIDES[pasPrieg].zenklas === r.zenklas
    };
    piesti();
    if (nustatymai.onPateikti) nustatymai.onPateikti(ats);
  });

  piesti();

  return {
    forma: r.forma,
    // Užrakina ir parodo „Atsakymas pateiktas, laukiam“
    uzrakinti(tekstas) {
      uzrakinta = true;
      pateikti.hidden = true;
      konteineris.querySelector('.uzd-pranesimas').innerHTML = `<p class="laukiam">${apsaugoti(tekstas)}</p>`;
      piesti();
    },
    // Parodo teisingą atsakymą ir paaiškinimą
    atskleisti(mano) {
      uzrakinta = true;
      rodomas = true;
      if (mano) { pasSkiem = mano.skiem; pasPrieg = mano.prieg; }
      pateikti.hidden = !nustatymai.poAtskleidimo;
      if (nustatymai.poAtskleidimo) { pateikti.disabled = false; pateikti.textContent = nustatymai.poAtskleidimo; }
      const busena = !mano ? 'nera' : mano.gerai ? 'gerai' : 'klaida';
      const antraste = { gerai: 'Teisingai!', klaida: 'Ne visai.', nera: 'Neatsakei.' }[busena];
      konteineris.querySelector('.uzd-pranesimas').innerHTML = `
        <div class="atskleidimas ${busena}">
          <p class="atsk-antraste">${antraste} <span class="forma">${apsaugoti(r.forma)}</span></p>
          ${u.kodel ? `<p class="atsk-kodel">${apsaugoti(u.kodel)}</p>` : ''}
        </div>`;
      piesti();
    },
    pateiktiMygtukas: pateikti
  };
}
