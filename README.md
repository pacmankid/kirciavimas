# Kirčiuoklis

Mokiniai sprendžia kirčiavimo užduotis, o mokytojas mato kiekvieno rezultatus.

- **Mokinio puslapis:** `index.html`. Mokinys įveda vardą ir klasę, atlieka 10 užduočių (paliečia kirčiuotą skiemenį ir pasirenka priegaidę), o pabaigoje mato, kodėl kiekvienas žodis taip kirčiuojamas.
- **Mokytojo puslapis:** `mokytojas.html`. Įvedus PIN rodomi visi rezultatai, filtras pagal klasę ir sunkiausi žodžiai.
- **Rezultatai** saugomi Google Sheets lentelėje.

Kol `nustatymai.js` faile adresas tuščias, puslapis veikia **demo režimu**: rezultatai išsaugomi tik toje naršyklėje.

## Kaip prijungti Google Sheets (vieną kartą, ~5 min.)

1. Sukurk naują Google Sheets lentelę, pvz., „Kirčiavimo rezultatai“.
2. Meniu **Extensions → Apps Script**.
3. Ištrink ten esantį kodą ir įklijuok failo `google-sheets/Code.gs` turinį.
4. Eilutėje `const MOKYTOJO_PIN = 'pakeisk-mane';` įrašyk savo PIN.
5. Spausk **Deploy → New deployment**, pasirink tipą **Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
6. Spausk **Deploy** ir leisk prieigą prie lentelės (Google paprašys patvirtinti).
7. Nukopijuok gautą **Web app URL** (baigiasi `/exec`).
8. Faile `nustatymai.js` įklijuok jį tarp kabučių:
   ```js
   const SKRIPTO_ADRESAS = 'https://script.google.com/macros/s/.../exec';
   ```

Jei vėliau pakeisi `Code.gs`, darydamas **Deploy → Manage deployments → Edit → New version** išsaugosi tą patį adresą.

## Kaip pridėti užduočių

Atidaryk `uzduotys.js`, nukopijuok vieną užduotį ir pakeisk žodį, skiemenis, kirtį ir paaiškinimą. Instrukcija yra failo viršuje.

## Saugumas ir privatumas

- PIN apsaugo nuo atsitiktinio rezultatų peržiūrėjimo, bet tai nėra stipri apsauga. Nesaugok jautrių duomenų.
- Mokiniai įveda tik vardą ir pavardės raidę. Pilnų vardų ir pavardžių geriau neprašyti.
- Visi duomenys yra tavo Google lentelėje, ir juos ten gali bet kada ištrinti.
