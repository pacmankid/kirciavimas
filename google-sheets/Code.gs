// ============================================================
//  Kirčiuoklis: Google Sheets „serveris“
//  Įklijuok šį kodą į Google Sheets → Extensions → Apps Script.
//  Instrukcijos: README.md
// ============================================================

// Pakeisk į savo PIN. Jį žinos tik mokytojas.
const MOKYTOJO_PIN = 'pakeisk-mane';

const LAPAS = 'Rezultatai';

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.veiksmas === 'irasyti') return irasyti(d);
    if (d.veiksmas === 'rezultatai') return rezultatai(d);
    if (d.veiksmas === 'valyti') return valyti(d);
    if (d.veiksmas === 'uzduotys') return atsakyti({ ok: true, uzduotys: skaitytiUzduotis().filter(function (u) { return u.patvirtinta; }) });
    if (d.veiksmas === 'visosUzduotys') return visosUzduotys(d);
    if (d.veiksmas === 'saugotiUzduotis') return saugotiUzduotis(d);
    return atsakyti({ ok: false, klaida: 'Nežinomas veiksmas' });
  } catch (klaida) {
    return atsakyti({ ok: false, klaida: String(klaida) });
  }
}

function irasyti(d) {
  const uzraktas = LockService.getScriptLock();
  uzraktas.waitLock(10000);
  try {
    return irasytiBeUzrakto(d);
  } finally {
    uzraktas.releaseLock();
  }
}

function irasytiBeUzrakto(d) {
  const lapas = gautiLapa();
  const atsakymai = Array.isArray(d.atsakymai) ? d.atsakymai.slice(0, 50) : [];
  lapas.appendRow([
    new Date(),
    tekstas(d.vardas, 40),
    tekstas(d.klase, 10).toUpperCase(),
    Number(d.teisingai) || 0,
    Number(d.isViso) || 0,
    atsakymai.filter(function (a) { return !a.gerai; }).map(function (a) { return tekstas(a.zodis, 30); }).join(', '),
    JSON.stringify(atsakymai).slice(0, 40000)
  ]);
  return atsakyti({ ok: true });
}

function rezultatai(d) {
  if (String(d.pin || '') !== MOKYTOJO_PIN) return atsakyti({ ok: false, klaida: 'Neteisingas PIN' });
  const eilutes = gautiLapa().getDataRange().getValues().slice(1);
  const rez = eilutes.map(function (r) {
    let ats = [];
    try { ats = JSON.parse(r[6] || '[]'); } catch (e) {}
    return {
      laikas: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      vardas: String(r[1]).replace(/^'/, ''),
      klase: String(r[2]).replace(/^'/, ''),
      teisingai: Number(r[3]),
      isViso: Number(r[4]),
      atsakymai: ats
    };
  });
  return atsakyti({ ok: true, rezultatai: rez });
}

// Ištrina rezultatus iš lapo „Rezultatai“. Jei nurodyta klasė, trinami tik jos rezultatai.
function valyti(d) {
  if (String(d.pin || '') !== MOKYTOJO_PIN) return atsakyti({ ok: false, klaida: 'Neteisingas PIN' });
  const uzraktas = LockService.getScriptLock();
  uzraktas.waitLock(10000);
  try {
    const lapas = gautiLapa();
    const klase = String(d.klase || '').toUpperCase();
    const visos = lapas.getDataRange().getValues();
    const stulpeliu = visos[0].length;
    const eilutes = visos.slice(1);
    const tinka = function (r) { return !klase || String(r[2]).replace(/^'/, '') === klase; };
    const trinti = eilutes.filter(tinka);
    const palikti = eilutes.filter(function (r) { return !tinka(r); });

    if (eilutes.length) lapas.getRange(2, 1, eilutes.length, stulpeliu).clearContent();
    if (palikti.length) lapas.getRange(2, 1, palikti.length, stulpeliu).setValues(palikti);
    return atsakyti({ ok: true, istrinta: trinti.length });
  } finally {
    uzraktas.releaseLock();
  }
}

// ---------- Užduotys ----------
// Lapas „Uzduotys“: Žodis (su kirčiu ir brūkšneliais tarp skiemenų, pvz. vã-ka-ras),
// Sakinys (su ___), Paaiškinimas, Patvirtinta (TAIP / NE).

const LAPAS_U = 'Uzduotys';

function gautiUzduociuLapa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let lapas = ss.getSheetByName(LAPAS_U);
  if (!lapas) {
    lapas = ss.insertSheet(LAPAS_U);
    lapas.appendRow(['Žodis (pvz. vã-ka-ras)', 'Sakinys (su ___)', 'Paaiškinimas', 'Patvirtinta (TAIP/NE)']);
    lapas.setFrozenRows(1);
  }
  return lapas;
}

function skaitytiUzduotis() {
  return gautiUzduociuLapa().getDataRange().getValues().slice(1)
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) {
      return {
        zodis: String(r[0]).trim(),
        sakinys: String(r[1]),
        kodel: String(r[2]),
        patvirtinta: r[3] === true || String(r[3]).trim().toUpperCase() === 'TAIP'
      };
    });
}

function visosUzduotys(d) {
  if (String(d.pin || '') !== MOKYTOJO_PIN) return atsakyti({ ok: false, klaida: 'Neteisingas PIN' });
  return atsakyti({ ok: true, uzduotys: skaitytiUzduotis() });
}

function saugotiUzduotis(d) {
  if (String(d.pin || '') !== MOKYTOJO_PIN) return atsakyti({ ok: false, klaida: 'Neteisingas PIN' });
  const sarasas = Array.isArray(d.uzduotys) ? d.uzduotys.slice(0, 500) : [];
  const uzraktas = LockService.getScriptLock();
  uzraktas.waitLock(10000);
  try {
    const lapas = gautiUzduociuLapa();
    const senu = lapas.getLastRow() - 1;
    if (senu > 0) lapas.getRange(2, 1, senu, 4).clearContent();
    const eilutes = sarasas.map(function (u) {
      return [tekstas(u.zodis, 60), tekstas(u.sakinys, 200), tekstas(u.kodel, 1000), u.patvirtinta ? 'TAIP' : 'NE'];
    });
    if (eilutes.length) lapas.getRange(2, 1, eilutes.length, 4).setValues(eilutes);
    return atsakyti({ ok: true, issaugota: eilutes.length });
  } finally {
    uzraktas.releaseLock();
  }
}

function gautiLapa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let lapas = ss.getSheetByName(LAPAS);
  if (!lapas) {
    lapas = ss.insertSheet(LAPAS);
    lapas.appendRow(['Laikas', 'Vardas', 'Klasė', 'Teisingai', 'Iš viso', 'Klaidos', 'Atsakymai (JSON)']);
    lapas.setFrozenRows(1);
  }
  return lapas;
}

// Apriboja ilgį ir neleidžia įrašyti formulių (pvz., „=...“).
function tekstas(v, ilgis) {
  let s = String(v == null ? '' : v).trim().slice(0, ilgis);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function atsakyti(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
