// ============================================================
//  Ryšys realiu laiku tarp mokytojo pulto ir mokinių ekranų.
//  Su FIREBASE_CONFIG naudojama Firebase Realtime Database.
//  Be jo veikia DEMO režimas: duomenys laikomi naršyklėje ir
//  sinchronizuojami tarp to paties kompiuterio langų.
// ============================================================

const GYVAI_DEMO = !(typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.databaseURL);

// Firebase sąrašus gali grąžinti kaip objektą {0:…,1:…}, todėl visada verčiam į masyvą.
function sarasas(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj.filter((x) => x != null);
  return Object.keys(obj).sort((a, b) => Number(a) - Number(b)).map((k) => obj[k]);
}

// Pamokos kodas: mažosios raidės be diakritikų, skaičiai ir brūkšneliai („#Ąžuolas 2“ → „azuolas-2“).
function normalizuotiKoda(kodas) {
  return String(kodas || '')
    .trim().toLowerCase().replace(/^#+/, '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 30);
}

const Rysys = GYVAI_DEMO ? demoRysys() : firebaseRysys();

function firebaseRysys() {
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.database();
  const auth = firebase.auth();
  const ref = (p) => db.ref(p);
  return {
    demo: false,
    stebetiVartotoja: (cb) => auth.onAuthStateChanged(cb),
    async prisijungtiMokytojui() {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      return auth.currentUser;
    },
    async prisijungtiMokiniui() {
      if (!auth.currentUser) await auth.signInAnonymously();
      return auth.currentUser.uid;
    },
    atsijungti: () => auth.signOut(),
    gauti: async (p) => (await ref(p).get()).val(),
    rasyti: (p, v) => ref(p).set(v),
    atnaujinti: (p, o) => ref(p).update(o),
    istrinti: (p) => ref(p).remove(),
    klausyti(p, cb) {
      const h = (s) => cb(s.val());
      ref(p).on('value', h);
      return () => ref(p).off('value', h);
    },
    naujasId: () => ref('pamokos').push().key,
    // Kai mokinys uždaro langą ar dingsta internetas, įrašas pašalinamas automatiškai.
    pasalintiAtsijungus: (p) => ref(p).onDisconnect().remove()
  };
}

function demoRysys() {
  const PR = 'gyvai-demo:';
  const klausytojai = new Set();
  const norm = (p) => String(p).replace(/^\/+|\/+$/g, '');
  const raktai = () => Object.keys(localStorage).filter((k) => k.startsWith(PR)).map((k) => k.slice(PR.length));

  let uid = sessionStorage.getItem('gyvai-demo-uid');
  if (!uid) {
    uid = 'demo-' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('gyvai-demo-uid', uid);
  }

  function gauti(p) {
    p = norm(p);
    const tiesiog = localStorage.getItem(PR + p);
    if (tiesiog !== null) return JSON.parse(tiesiog);
    const pref = p ? p + '/' : '';
    let rez = null;
    for (const k of raktai()) {
      if (!k.startsWith(pref)) continue;
      const dalys = k.slice(pref.length).split('/');
      rez = rez || {};
      let o = rez;
      dalys.slice(0, -1).forEach((d) => (o = o[d] = o[d] || {}));
      o[dalys[dalys.length - 1]] = JSON.parse(localStorage.getItem(PR + k));
    }
    return rez;
  }

  function trinti(p) {
    p = norm(p);
    localStorage.removeItem(PR + p);
    raktai().filter((k) => k.startsWith(p + '/')).forEach((k) => localStorage.removeItem(PR + k));
    // Jei kuris nors protėvis buvo „lapas“, jis irgi pašalinamas.
    const dalys = p.split('/');
    for (let i = 1; i < dalys.length; i++) localStorage.removeItem(PR + dalys.slice(0, i).join('/'));
  }

  function lapai(p, v, out) {
    if (v !== null && typeof v === 'object') Object.entries(v).forEach(([k, x]) => lapai(p + '/' + k, x, out));
    else if (v !== undefined && v !== null) out.push([p, v]);
  }

  function rasyti(p, v) {
    trinti(p);
    const out = [];
    lapai(norm(p), v, out);
    out.forEach(([k, x]) => localStorage.setItem(PR + k, JSON.stringify(x)));
  }

  const susije = (a, b) => a === b || !a || !b || a.startsWith(b + '/') || b.startsWith(a + '/');
  function pranesti(p) {
    klausytojai.forEach((l) => { if (susije(l.p, p)) l.cb(gauti(l.p)); });
  }
  // Kitų langų pakeitimai
  let laukia = new Set(), laikmatis = null;
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(PR)) return;
    laukia.add(e.key.slice(PR.length));
    clearTimeout(laikmatis);
    laikmatis = setTimeout(() => { const v = laukia; laukia = new Set(); v.forEach(pranesti); }, 30);
  });
  const veliau = (p) => setTimeout(() => pranesti(norm(p)), 0);

  return {
    demo: true,
    stebetiVartotoja: (cb) => { setTimeout(() => cb({ email: 'demo', isAnonymous: false }), 0); return () => {}; },
    prisijungtiMokytojui: async () => ({ email: 'demo' }),
    prisijungtiMokiniui: async () => uid,
    atsijungti: async () => {},
    gauti: async (p) => gauti(p),
    rasyti: async (p, v) => { rasyti(p, v); veliau(p); },
    atnaujinti: async (p, o) => { Object.entries(o).forEach(([k, v]) => rasyti(norm(p) + '/' + k, v)); veliau(p); },
    istrinti: async (p) => { trinti(p); veliau(p); },
    klausyti(p, cb) {
      const l = { p: norm(p), cb };
      klausytojai.add(l);
      setTimeout(() => cb(gauti(l.p)), 0);
      return () => klausytojai.delete(l);
    },
    naujasId: () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    pasalintiAtsijungus: (p) => window.addEventListener('pagehide', () => trinti(p))
  };
}
