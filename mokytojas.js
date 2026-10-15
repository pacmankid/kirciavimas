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
    $('rezultatai').hidden = false;
    pildytiKlases();
    piesti();
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
$('filtras-klase').addEventListener('change', piesti);
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
