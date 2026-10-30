/* FM26 — correctif cœur compatible avec les modules existants.
   Emplois : vue dédiée + actions accepter/refuser.
   La composition d'origine de fm26-experience.js est conservée :
   elle possède déjà ses formations, sélecteurs, échanges et glisser-déposer. */
(function () {
  'use strict';
  if (window.FM26Core) return;
  if (typeof S === 'undefined' || typeof V === 'undefined') return;

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function jobsView() {
    const offers = Array.isArray(S.jobOffers) ? S.jobOffers : [];
    if (!offers.length) {
      return '<div class="pn"><h3>Emplois</h3><p class="mu">Aucune proposition pour le moment. Les clubs peuvent te contacter en fonction de tes résultats et de ta réputation.</p></div>';
    }
    return '<div class="pn"><h3>Propositions d’emploi · ' + offers.length + '</h3>' +
      offers.map((o, i) =>
        '<div class="ar fm26-core-job" style="padding:12px">' +
          '<span><b>' + esc(o.club || 'Club') + '</b><br><small class="mu">' +
          esc(o.league || 'Championnat non précisé') + ' · ambition ' + esc(o.ambition || '—') +
          '</small></span><span class="wr">' +
          '<button class="chip" type="button" data-fm26-job-accept="' + i + '">Accepter</button>' +
          '<button class="chip" type="button" data-fm26-job-refuse="' + i + '">Refuser</button>' +
        '</span></div>'
      ).join('') + '</div>';
  }

  V.jobs = jobsView;

  function persist() {
    try { if (typeof sv === 'function') sv(); } catch (e) {}
  }

  function wireJobs() {
    const vw = document.getElementById('vw');
    if (!vw) return;

    vw.querySelectorAll('[data-fm26-job-accept]').forEach(button => {
      if (button.dataset.fm26Wired) return;
      button.dataset.fm26Wired = '1';
      button.addEventListener('click', () => {
        const index = Number(button.dataset.fm26JobAccept);
        if (window.FM26A && typeof window.FM26A.job === 'function') {
          window.FM26A.job(index);
        }
      });
    });

    vw.querySelectorAll('[data-fm26-job-refuse]').forEach(button => {
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

  function routeJobsMenu() {
    const menu = document.getElementById('fm26-ref-menu');
    if (!menu) return;
    menu.querySelectorAll('[data-label="Emplois"]').forEach(button => {
      button.dataset.view = 'jobs';
    });
  }

  // Le menu de référence lit data-view au clic : cette redirection ouvre la vue dédiée.
  const menu = document.getElementById('fm26-ref-menu');
  if (menu) routeJobsMenu();

  // Ne remplace surtout pas V.lineup : fm26-experience.js fournit déjà
  // une composition plus complète, avec formations et glisser-déposer.
  if (typeof render === 'function') {
    const previousRender = render;
    render = function () {
      const result = previousRender.apply(this, arguments);
      if (typeof S !== 'undefined' && S) {
        if (S.view === 'jobs') {
          const title = document.querySelector('#hd h2');
          if (title) title.textContent = 'Emplois';
        }
        routeJobsMenu();
        wireJobs();
      }
      return result;
    };
  }

  const style = document.createElement('style');
  style.id = 'fm26-core-fix-style';
  style.textContent = '.fm26-core-job{gap:12px;align-items:center;flex-wrap:wrap}.fm26-core-job .wr{display:flex;gap:8px;flex-wrap:wrap}';
  document.head.appendChild(style);

  window.FM26Core = { jobsView: jobsView };
})();