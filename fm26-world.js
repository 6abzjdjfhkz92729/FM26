/* FM26 — World expansion: original women's player-name pools for the playable women's leagues. */
(()=> {
  'use strict';
  const WOMEN_FIRST = [
    "Ava","Mia","Ella","Lena","Nora","Leah","Sofia","Inès","Camille","Jade","Alice","Clara",
    "Zoe","Chloé","Lola","Eva","Maya","Anna","Julia","Lina","Sarah","Emma","Lucia","Alba",
    "Paula","Irene","Marina","Nerea","Aitana","Laia","Elena","Carla","Noa","Vera","Olivia","Freya",
    "Grace","Ruby","Poppy","Millie","Hannah","Amelia","Lucy","Katie","Megan","Georgia","Erin","Tilly"
  ];
  const WOMEN_LAST = [
    "Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau",
    "Laurent","Simon","Michel","Lefebvre","Garcia","Martínez","López","Sánchez","Pérez","Gómez",
    "Ruiz","Fernández","Díaz","Torres","Navarro","Romero","Gil","Molina","Ortega","Castro",
    "Wilson","Taylor","Davies","Evans","Roberts","Johnson","Walker","Wright","Thompson","White",
    "Green","Hall","Wood","Clarke","Lewis","Baker","Young","King"
  ];
  const womenLeague = league => /women|liga f/i.test(String(league||""));
  const leagueNow = () => (typeof S!=="undefined" && S && S.lg) || (typeof sel!=="undefined" && sel && sel.lg) || "";
  const originalMkP = mkP;
  mkP = function(pos, level, id) {
    const player = originalMkP(pos, level, id);
    const league = leagueNow();
    if (womenLeague(league)) {
      const n = Math.abs(Number(id)||0);
      player.name = WOMEN_FIRST[n % WOMEN_FIRST.length] + " " + WOMEN_LAST[Math.floor(n / WOMEN_FIRST.length) % WOMEN_LAST.length];
      player.gender = "F";
      player.nat = /liga f/i.test(league) ? "ESP" : "ENG";
    }
    return player;
  };
  const originalStart = startCareer;
  startCareer = function() {
    originalStart();
    if (!S || !womenLeague(S.lg)) return;
    const used = new Set();
    S.sq.forEach((p,i) => {
      let name = p.name;
      let attempt = 0;
      while (used.has(name) && attempt < WOMEN_FIRST.length) {
        name = WOMEN_FIRST[(i+attempt+1)%WOMEN_FIRST.length] + " " + WOMEN_LAST[(Math.floor(i/3)+attempt)%WOMEN_LAST.length];
        attempt++;
      }
      used.add(name);
      p.name = name;
      p.gender = "F";
      p.nat = /liga f/i.test(S.lg) ? "ESP" : "ENG";
    });
    S.ib = Array.isArray(S.ib) ? S.ib : [];
    mail("Direction sportive","Bienvenue dans le football féminin","Ton effectif féminin est initialisé. Les joueuses, l'entraînement, les tactiques, les compétitions et la carrière utilisent les systèmes communs du jeu.");
    sv();
    render();
  };
  if (typeof S !== "undefined" && S && womenLeague(S.lg)) {
    S.sq.forEach(p => { p.gender = "F"; });
  }
})();
