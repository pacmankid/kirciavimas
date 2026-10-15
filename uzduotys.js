// ============================================================
//  UŽDUOTYS
//  Mokinys paliečia kirčiuotą skiemenį ir pasirenka priegaidę.
//  Norėdamas pridėti užduotį, nukopijuok eilutę ir pakeisk reikšmes.
//
//    skiemenys – žodis, suskirstytas skiemenimis
//    kirtis    – kirčiuoto skiemens numeris (skaičiuojama nuo 0)
//    vieta     – po kelintos to skiemens raidės dedamas ženklas
//    zenklas   – '`' kairinis (trumpas kirtis),
//                '´' dešininis (tvirtapradė),
//                '~' riestinis (tvirtagalė)
//    sakinys   – sakinys su ___ vietoje žodžio
//    kodel     – paaiškinimas, rodomas pabaigoje
// ============================================================

const UZDUOTYS = [
  {
    skiemenys: ['va', 'ka', 'ras'], kirtis: 0, vieta: 2, zenklas: '~',
    sakinys: 'Šiandien gražus ___.',
    kodel: 'Kirtis ant pirmo skiemens va-. Kirčiuotas a čia tariamas ilgai, stipresnė jo pabaiga, todėl priegaidė tvirtagalė (~). Daugiskaitoje kirtis pereina į galūnę: vakaraĩ.'
  },
  {
    skiemenys: ['kal', 'ba'], kirtis: 1, vieta: 2, zenklas: '`',
    sakinys: 'Lietuvių ___ graži.',
    kodel: '2 kirčiuotė: vardininke kirtis ant galūnės -a. Ji trumpa, todėl rašomas kairinis ženklas (`). Galininke kirtis grįžta į kamieną: kal̃bą.'
  },
  {
    skiemenys: ['vy', 'ras'], kirtis: 0, vieta: 2, zenklas: '´',
    sakinys: 'Tas ___ dirba mokykloje.',
    kodel: 'Kirtis ant pirmo skiemens. Ilgasis y tariamas su stipresne pradžia, todėl priegaidė tvirtapradė (´). 1 kirčiuotė: kirtis visada lieka kamiene.'
  },
  {
    skiemenys: ['žmo', 'gus'], kirtis: 1, vieta: 2, zenklas: '`',
    sakinys: 'Geras ___ visada padeda.',
    kodel: 'Kirtis ant galūnės -us. Balsis u trumpas, todėl kairinis ženklas (`). 4 kirčiuotė: naudininke kirtis pereina į kamieną: žmõgui.'
  },
  {
    skiemenys: ['mer', 'gai', 'tė'], kirtis: 1, vieta: 2, zenklas: '´',
    sakinys: '___ skaito knygą.',
    kodel: 'Kirtis ant -gai-. Dvigarsio ai stipresnė pirmoji dalis (a), todėl priegaidė tvirtapradė ir ženklas dedamas ant a: mergáitė.'
  },
  {
    skiemenys: ['ran', 'ka'], kirtis: 1, vieta: 2, zenklas: '`',
    sakinys: 'Man skauda ___.',
    kodel: 'Kaip ir kalbà, tai 2 kirčiuotė: vardininke kirtis ant trumpos galūnės -a (`). Galininke kirtis kamiene: rañką.'
  },
  {
    skiemenys: ['mies', 'tas'], kirtis: 0, vieta: 3, zenklas: '~',
    sakinys: 'Vilnius yra didelis ___.',
    kodel: 'Dvigarsio ie stipresnė antroji dalis (e), todėl priegaidė tvirtagalė ir ženklas dedamas ant e: miẽstas.'
  },
  {
    skiemenys: ['mo', 'kyk', 'la'], kirtis: 2, vieta: 2, zenklas: '`',
    sakinys: 'Mūsų ___ nauja.',
    kodel: '2 kirčiuotė: vardininke kirtis ant trumpos galūnės -a (`). Galininke kirtis pereina į kamieną: mokỹklą.'
  },
  {
    skiemenys: ['vai', 'kas'], kirtis: 0, vieta: 3, zenklas: '~',
    sakinys: '___ žaidžia kieme.',
    kodel: 'Dvigarsio ai stipresnė antroji dalis (i), todėl priegaidė tvirtagalė ir ženklas dedamas ant i: vaĩkas. Palygink su mergáitė, kur stipresnė pirmoji dalis.'
  },
  {
    skiemenys: ['šuo'], kirtis: 0, vieta: 3, zenklas: '~',
    sakinys: 'Kieme loja ___.',
    kodel: 'Vienskiemenis žodis. Dvigarsio uo stipresnė antroji dalis (o), todėl priegaidė tvirtagalė ir ženklas dedamas ant o: šuõ.'
  }
];
