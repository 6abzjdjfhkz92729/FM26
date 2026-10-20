/* FM26 — Données de ligues européennes supplémentaires.
   Listes de clubs 2026 (Suède/Norvège) et 2026/27 (Pologne), issues des fédérations/ligues.
   Les effectifs et attributs restent simulés si aucun effectif dédié n'est renseigné. */
const FM26_EUROPE_EXTRA_DATA = {
  "Ekstraklasa": [
    "Górnik Zabrze","Lech Poznań","Legia Warszawa","Pogoń Szczecin","GKS Katowice","Wisła Kraków",
    "Zagłębie Lubin","Piast Gliwice","Korona Kielce","Wisła Płock","Cracovia","Motor Lublin",
    "Jagiellonia Białystok","Widzew Łódź","Wieczysta Kraków","Radomiak Radom","Śląsk Wrocław","Raków Częstochowa"
  ],
  "Eliteserien": [
    "Bodø/Glimt","Viking","Molde","Tromsø","Rosenborg","Lillestrøm","Brann","Fredrikstad",
    "KFUM Oslo","Sarpsborg 08","Vålerenga","HamKam","Sandefjord","Aalesund","Kristiansund","Start"
  ],
  "Allsvenskan": [
    "Mjällby AIF","BK Häcken","GAIS","IFK Göteborg","Örgryte IS","Halmstads BK","Malmö FF","Kalmar FF",
    "AIK","Djurgården","Hammarby","IF Brommapojkarna","IK Sirius FK","IF Elfsborg","Västerås SK FK","Degerfors IF"
  ]
};
Object.entries(FM26_EUROPE_EXTRA_DATA).forEach(([league, clubs]) => {
  if (!LG[league]) LG[league] = clubs.slice();
});
window.FM26Europe = {
  leagues: Object.keys(FM26_EUROPE_EXTRA_DATA),
  clubEntries: Object.values(FM26_EUROPE_EXTRA_DATA).reduce((n, clubs) => n + clubs.length, 0)
};
if (typeof setup === "function") setup();
