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
    return atsakyti({ ok: false, klaida: 'Nežinomas veiksmas' });
  } catch (klaida) {
    return atsakyti({ ok: false, klaida: String(klaida) });
  }
}

function irasyti(d) {
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
