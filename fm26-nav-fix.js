/* FM26 — navigation cohérente, titres et accès Emplois.
   Préserve la barre latérale graphique de fm26-reference-ui.js. */
(function () {
  'use strict';
  if (window.FM26Nav) return;

  const TITLES = {
    home:'Accueil', inbox:'Messagerie', squad:'Effectif', player:'Fiche joueur',
    tactics:'Tactiques', lineup:'Composition', sched:'Calendrier', comp:'Compétitions',
    fin:'Finances', mgr:'Manager', jobs:'Emplois', pre:'Avant-match', post:'Bilan du match',
    news:'Flash info', match:'Match', halftime:'Mi-temps', training:'Entraînement',
    staff:'Staff', academy:'Centre de formation', data:'Centre de données',
    contracts:'Contrats', scouting:'Recrutement', club:'Club & installations',
    press:'Conférence de presse', history:'Historique', settings:'Options & diagnostic',
    talk:'Discussions', profile:'Profil manager', offers:'Offres reçues', vest:'Vestiaire'
  };
  const MAIN = ['home','inbox','squad','tactics','lineup','sched','comp','fin','mgr','jobs'];

  function dedupeNav() {
    if (typeof NAV === 'undefined' || !Array.isArray(NAV)) return [];
    const first = new Map();
    NAV.forEach(entry => {
      if (Array.isArray(entry) && entry.length && !first.has(entry[0])) first.set(entry[0], entry);
    });
    if (!first.has('jobs')) first.set('jobs', ['jobs','Emplois','doc']);
    const ordered = MAIN.filter(key => first.has(key)).map(key => first.get(key));
    const rest = Array.from(first.values()).filter(entry => !MAIN.includes(entry[0]));
    NAV.splice(0, NAV.length, ...ordered, ...rest);
    return NAV;
  }

  function sideEntries() {
    const entries = typeof NAV !== 'undefined' && Array.isArray(NAV) ? NAV : [];
    const byKey = new Map(entries.map(entry => [entry[0], entry]));
    return MAIN.filter(key => byKey.has(key)).map(key => byKey.get(key))
      .concat(entries.filter(entry => !MAIN.includes(entry[0])));
  }

  function fixTitle() {
    const heading = document.querySelector('#hd h2');
    if (heading && typeof S !== 'undefined' && S && TITLES[S.view]) {
      heading.textContent = TITLES[S.view];
    }
  }

  // Le menu de référence est construit à la demande. On intercepte son clic
  // en phase capture pour ouvrir V.jobs plutôt que la page Manager.
  function routeJobsClick(event) {
    const target = event.target;
    const button = target && typeof target.closest === 'function'
      ? target.closest('#fm26-ref-menu [data-label="Emplois"]')
      : null;
    if (!button || typeof S === 'undefined' || !S) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.dataset.view = 'jobs';
    S.view = 'jobs';
    if (typeof render === 'function') render();
  }

  dedupeNav();
  document.addEventListener('click', routeJobsClick, true);

  if (typeof render === 'function') {
    const previousRender = render;
    render = function () {
      dedupeNav();
      const result = previousRender.apply(this, arguments);
      fixTitle();
      return result;
    };
  }

  window.FM26Nav = { dedupeNav, sideEntries, fixTitle, TITLES };
})();