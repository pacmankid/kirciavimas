# Gyvos pamokos

Mokytojas valdo pamoką, o mokinių ekranai keičiasi realiu laiku (panašiai kaip Kahoot ar Slido).

- **Mokytojo pultas:** `gyvai/mokytojas.html`. Čia kuriamos pamokos (PDF skaidrės ir užduotys su prisijungimo kodu) ir valdoma gyva pamoka: skaidrės, laukimo langas, užduotys, atsakymų rodymas.
- **Mokiniams:** `gyvai/`. Mokinys įveda kodą (pvz. `#lietuva`), vardą ir klasę, o jo ekranas rodo tai, ką paleidžia mokytojas.

Kol `nustatymai.js` faile `FIREBASE_CONFIG = null`, puslapiai veikia **demo režimu**: mokytojo ir mokinių langai sinchronizuojasi tik tame pačiame kompiuteryje (patogu išbandyti).

## Firebase prijungimas (vieną kartą, ~10 min.)

1. Atidaryk https://console.firebase.google.com ir sukurk projektą (pvz. `kirciavimas`). Google Analytics nereikia.
2. **Build → Realtime Database → Create database**. Vieta: `europe-west1`, režimas: *locked mode*.
3. Skiltyje **Rules** įklijuok `gyvai/firebase-taisykles.json` turinį ir visur vietoj `MOKYTOJO@EL.PASTAS` įrašyk mokytojo Google el. paštą. Spausk **Publish**.
4. **Build → Authentication → Get started**. Įjunk **Google** ir **Anonymous** prisijungimo būdus.
5. **Authentication → Settings → Authorized domains**: pridėk `pacmankid.github.io` (ir savo domeną, jei naudoji).
6. **Project settings → General → Your apps → Web (</>)**: užregistruok programėlę ir nukopijuok `firebaseConfig`.
7. Faile `nustatymai.js` įrašyk:
   ```js
   const FIREBASE_CONFIG = {
     apiKey: '…',
     authDomain: '….firebaseapp.com',
     databaseURL: 'https://…europe-west1.firebasedatabase.app',
     projectId: '…',
     appId: '…'
   };
   ```

Firebase `apiKey` nėra slaptas: jis matomas kiekvienam svetainės lankytojui. Duomenis saugo taisyklės iš 3 žingsnio.

## Kaip vyksta pamoka

1. Pulte spausk **„+ Sukurti pamoką“**, įkelk PDF (PowerPoint/Keynote → Export to PDF), pasirink užduotis ir kodą.
2. Pamokos metu spausk **„Pradėti gyvai“** ir padiktuok kodą.
3. Valdymas: → / PageDown – kita skaidrė, ← / PageUp – ankstesnė, **B** – laukimo langas. Veikia ir skaidrių pultelis.
4. Užduotį paleidi mygtuku **„Paleisti“**. Kai visi atsako, spausk **„Rodyti atsakymą“**: mokiniai pamato teisingą atsakymą ir paaiškinimą.
5. **„Visos užduotys – savo tempu“**: kiekvienas sprendžia savo greičiu.
6. **„Baigti pamoką“**: mokiniai mato savo rezultatus, o jie išsaugomi Google lentelėje.

Nemokamas Firebase planas leidžia iki 100 vienu metu prisijungusių įrenginių.
