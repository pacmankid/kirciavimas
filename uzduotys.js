// ============================================================
//  ATSARGINĖS UŽDUOTYS
//  Užduotys tvarkomos mokytojo puslapyje (skiltis „Užduotys“) ir
//  saugomos Google lentelėje. Šios naudojamos tik tada, kai lentelė
//  nepasiekiama arba puslapis veikia DEMO režimu.
//
//  zodis   – žodis su kirčio ženklu ir brūkšneliais tarp skiemenų
//            (à – trumpas kirtis, á – tvirtapradė, ã – tvirtagalė)
//  sakinys – sakinys su ___ vietoje žodžio
//  kodel   – paaiškinimas, rodomas pabaigoje
// ============================================================

const UZDUOTYS = [
  { zodis: 'vã-ka-ras', sakinys: 'Šiandien gražus ___.', kodel: 'Kirtis ant pirmo skiemens va-. Kirčiuotas a čia tariamas ilgai, stipresnė jo pabaiga, todėl priegaidė tvirtagalė (~). Daugiskaitoje kirtis pereina į galūnę: vakaraĩ.' },
  { zodis: 'kal-bà', sakinys: 'Lietuvių ___ graži.', kodel: '2 kirčiuotė: vardininke kirtis ant galūnės -a. Ji trumpa, todėl rašomas kairinis ženklas (`). Galininke kirtis grįžta į kamieną: kal̃bą.' },
  { zodis: 'vý-ras', sakinys: 'Tas ___ dirba mokykloje.', kodel: 'Kirtis ant pirmo skiemens. Ilgasis y tariamas su stipresne pradžia, todėl priegaidė tvirtapradė (´). 1 kirčiuotė: kirtis visada lieka kamiene.' },
  { zodis: 'žmo-gùs', sakinys: 'Geras ___ visada padeda.', kodel: 'Kirtis ant galūnės -us. Balsis u trumpas, todėl kairinis ženklas (`). 4 kirčiuotė: naudininke kirtis pereina į kamieną: žmõgui.' },
  { zodis: 'mer-gái-tė', sakinys: '___ skaito knygą.', kodel: 'Kirtis ant -gai-. Dvigarsio ai stipresnė pirmoji dalis (a), todėl priegaidė tvirtapradė ir ženklas dedamas ant a: mergáitė.' },
  { zodis: 'ran-kà', sakinys: 'Man skauda ___.', kodel: 'Kaip ir kalbà, tai 2 kirčiuotė: vardininke kirtis ant trumpos galūnės -a (`). Galininke kirtis kamiene: rañką.' },
  { zodis: 'miẽs-tas', sakinys: 'Vilnius yra didelis ___.', kodel: 'Dvigarsio ie stipresnė antroji dalis (e), todėl priegaidė tvirtagalė ir ženklas dedamas ant e: miẽstas.' },
  { zodis: 'mo-kyk-là', sakinys: 'Mūsų ___ nauja.', kodel: '2 kirčiuotė: vardininke kirtis ant trumpos galūnės -a (`). Galininke kirtis pereina į kamieną: mokỹklą.' },
  { zodis: 'vaĩ-kas', sakinys: '___ žaidžia kieme.', kodel: 'Dvigarsio ai stipresnė antroji dalis (i), todėl priegaidė tvirtagalė ir ženklas dedamas ant i: vaĩkas. Palygink su mergáitė, kur stipresnė pirmoji dalis.' },
  { zodis: 'šuõ', sakinys: 'Kieme loja ___.', kodel: 'Vienskiemenis žodis. Dvigarsio uo stipresnė antroji dalis (o), todėl priegaidė tvirtagalė ir ženklas dedamas ant o: šuõ.' }
].map((u) => ({ ...u, patvirtinta: true }));
