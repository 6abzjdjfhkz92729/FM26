/* FM26 — correctifs cœur compatibles avec les modules existants.
   Emplois : vue dédiée et actions accepter/refuser.
   Composition : garde la vue complète de fm26-experience.js et ajoute
   glisser-déposer des remplaçants + interaction tactile par sélection. */
(function () {
  'use strict';
  if (window.FM26Core) return;
  if (typeof S === 'undefined' || typeof V === 'undefined') return;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));

  function jobsView() {
    const offers = Array.isArray(S.jobOffers) ? S.jobOffers : [];
    if (!offers.length) {
      return '<div class="pn"><h3>Emplois</h3><p class="mu">Aucune proposition pour le moment. Les clubs peuvent te contacter en fonction de tes résultats et de ta réputation.</p></div>';
    }
    return '<div class="pn"><h3>Propositions d’emploi · ' + offers.length + '</h3>' +
      offers.map((offer, index) =>
        '<div class="ar fm26-core-job" style="padding:12px">' +
          '<span><b>' + esc(offer.club || 'Club') + '</b><br><small class="mu">' +
          esc(offer.league || 'Championnat non précisé') + ' · ambition ' + esc(offer.ambition || '—') +
          '</small></span><span class="wr">' +
          '<button class="chip" type="button" data-fm26-job-accept="' + index + '">Accepter</button>' +
          '<button class="chip" type="button" data-fm26-job-refuse="' + index + '">Refuser</button>' +
        '</span></div>'
      ).join('') + '</div>';
  }
  V.jobs = jobsView;

  function persist() {
    try { if (typeof sv === 'function') sv(); } catch (error) {}
  }

  function wireJobs() {
    const view = document.getElementById('vw');
    if (!view) return;

    view.querySelectorAll('[data-fm26-job-accept]').forEach(button => {
      if (button.dataset.fm26Wired) return;
      button.dataset.fm26Wired = '1';
      button.addEventListener('click', () => {
        const index = Number(button.dataset.fm26JobAccept);
        if (window.FM26A && typeof window.FM26A.job === 'function') {
          window.FM26A.job(index);
        }
      });
    });

    view.querySelectorAll('[data-fm26-job-refuse]').forEach(button => {
      if (button.dataset.fm26Wired) return;
      button.dataset.fm26Wired = '1';
      button.addEventListener('click', () => {
        const index = Number(button.dataset.fm26JobRefuse);
        if (!Array.isArray(S.jobOffers) || !S.jobOffers[index]) return;
        S.jobOffers.splice(index, 1);
        persist();
        render();
      });
    });
  }

  function extractBenchId(row) {
    const button = row.querySelector('button[onclick*="FM26UX.addToLineup"]');
    const onclick = button ? button.getAttribute('onclick') || '' : '';
    const match = onclick.match(/addToLineup\(\s*(-?\d+)\s*\)/);
    return match ? Number(match[1]) : null;
  }

  // Le module expérience expose déjà assign() et swap(). On les réutilise
  // au lieu de remplacer sa composition (formations, fiches et sélecteurs).
  function wireLineupTouchAndBenchDrag() {
    const view = document.getElementById('vw');
    if (!view || !S || S.view !== 'lineup' || !window.FM26UX) return;

    const slots = Array.from(view.querySelectorAll('.fm26-slot'));
    const benchRows = Array.from(view.querySelectorAll('.fm26-player-row'));
    if (!slots.length) return;

    let selected = null;
    const clearSelection = () => {
      view.querySelectorAll('.fm26-touch-selected').forEach(element =>
        element.classList.remove('fm26-touch-selected')
      );
      selected = null;
    };

    slots.forEach((slot, index) => {
      slot.dataset.fm26CoreSlot = String(index);
      if (slot.dataset.fm26CoreWired) return;
      slot.dataset.fm26CoreWired = '1';

      slot.addEventListener('dragover', event => event.preventDefault());
      slot.addEventListener('drop', event => {
        const raw = event.dataTransfer && event.dataTransfer.getData('text/plain') || '';
        const match = raw.match(/^bench:(-?\d+)$/);
        if (!match) return; // Les échanges titulaire-titulaire restent gérés par FM26UX.dropSlot().
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof window.FM26UX.assign === 'function') {
          window.FM26UX.assign(index, Number(match[1]));
        }
      }, true);

      // Sur écran tactile, un premier toucher sélectionne, le second déplace/échange.
      slot.addEventListener('click', event => {
        if (event.target.closest('button,select,a,input')) return;
        if (selected && selected.type === 'bench') {
          const playerId = selected.id;
          clearSelection();
          if (typeof window.FM26UX.assign === 'function') window.FM26UX.assign(index, playerId);
          return;
        }
        if (selected && selected.type === 'slot') {
          const from = selected.index;
          clearSelection();
          if (from !== index && typeof window.FM26UX.swap === 'function') {
            window.FM26UX.swap(from, index);
          }
          return;
        }
        clearSelection();
        selected = { type:'slot', index };
        slot.classList.add('fm26-touch-selected');
      });
    });

    benchRows.forEach(row => {
      const playerId = extractBenchId(row);
      if (playerId == null || row.dataset.fm26CoreWired) return;
      row.dataset.fm26CoreWired = '1';
      row.dataset.fm26BenchId = String(playerId);
      row.draggable = true;

      row.addEventListener('dragstart', event => {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData('text/plain', 'bench:' + playerId);
        event.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('click', event => {
        if (event.target.closest('button,a,input,select')) return;
        clearSelection();
        selected = { type:'bench', id:playerId };
        row.classList.add('fm26-touch-selected');
      });
    });
  }

  function routeJobsMenu() {
    // Le routage effectif du menu de référence est également sécurisé
    // en phase capture par fm26-nav-fix.js, car ce menu se crée à la demande.
    const menu = document.getElementById('fm26-ref-menu');
    if (menu) {
      menu.querySelectorAll('[data-label="Emplois"]').forEach(button => {
        button.dataset.view = 'jobs';
      });
    }
  }

  // Important : ne pas remplacer V.lineup. fm26-experience.js fournit déjà
  // une composition plus riche (choix de formation, sélecteurs, fiches).
  if (typeof render === 'function') {
    const previousRender = render;
    render = function () {
      const result = previousRender.apply(this, arguments);
      if (typeof S !== 'undefined' && S) {
        if (S.view === 'jobs') {
          const heading = document.querySelector('#hd h2');
          if (heading) heading.textContent = 'Emplois';
        }
        routeJobsMenu();
        wireJobs();
        wireLineupTouchAndBenchDrag();
      }
      return result;
    };
  }

  const style = document.createElement('style');
  style.id = 'fm26-core-fix-style';
  style.textContent = [
    '.fm26-core-job{gap:12px;align-items:center;flex-wrap:wrap}',
    '.fm26-core-job .wr{display:flex;gap:8px;flex-wrap:wrap}',
    '.fm26-player-row[draggable="true"]{cursor:grab}',
    '.fm26-player-row[draggable="true"]:active,.fm26-slot:active{cursor:grabbing}',
    '.fm26-touch-selected{outline:2px solid #a77cf5!important;outline-offset:2px;border-radius:7px}'
  ].join('');
  document.head.appendChild(style);

  window.FM26Core = { jobsView, wireLineupTouchAndBenchDrag };
})();