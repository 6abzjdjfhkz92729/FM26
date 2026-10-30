/* FM26 — page Emplois : situation du club et offres reçues.
   Les risques sont calculés uniquement à partir du classement disponible
   dans la carrière active ; aucune donnée d'autres ligues n'est inventée. */
(function () {
  'use strict';
  if (window.FM26Jobs) return;
  if (typeof V === 'undefined') return;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));

  const LEAGUE_TIER = {
    'Premier League':1,'La Liga':1,'Serie A':1,'Bundesliga':1,'Ligue 1':1,
    'Eredivisie':1,'Primeira Liga':1,'Süper Lig':1,
    'Championship':2,'Serie B':2,'2. Bundesliga':2,'Segunda División':2,
    'Ligue 2':2,'Eerste Divisie':2,'Liga Portugal 2':2,
    'League One':3,'Ligue 3':3,'3. Liga':3,
    'Serie C – Girone A':3,'Serie C – Girone B':3,'Serie C – Girone C':3,
    'Primera Federación – Groupe 1':3,'Primera Federación – Groupe 2':3
  };

  function clubsOf(league) {
    return typeof LG === 'object' && LG && Array.isArray(LG[league]) ? LG[league] : [];
  }

  function currentTable() {
    if (typeof S === 'undefined' || !S || !S.tb) return [];
    return Object.entries(S.tb).map(([club, values]) => ({
      club,
      pts: Number(values.pts) || 0,
      gd: (Number(values.gf) || 0) - (Number(values.ga) || 0),
      gf: Number(values.gf) || 0
    })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  function riskFor(club, league) {
    if (typeof S === 'undefined' || !S || league !== S.lg) return 'Données indisponibles';
    const table = currentTable();
    const position = table.findIndex(row => row.club === club) + 1;
    const total = table.length || clubsOf(league).length || 20;
    if (!position) return 'Inconnu';
    if (position > total - 3) return 'Menacé';
    if (position > total - 6) return 'Sous pression';
    return 'Stable';
  }

  function financeLabel(club) {
    if (typeof S !== 'undefined' && S && S.club === club) {
      const budget = Number(S.bud);
      if (!Number.isFinite(budget)) return 'Non renseignées';
      if (budget > 80) return 'Solides';
      if (budget > 25) return 'Correctes';
      return 'Tendues';
    }
    return 'Non renseignées';
  }

  function tierLabel(league) {
    const tier = LEAGUE_TIER[league];
    return tier ? 'Niveau ' + tier : 'Niveau non classé';
  }

  function openJobs() {
    const hasCareer = typeof S !== 'undefined' && S;
    if (!hasCareer) {
      return '<div class="fm26-jobs-page"><div class="fm26-jobs-empty">Lance une carrière pour consulter les postes et les propositions.</div></div>';
    }

    const offers = Array.isArray(S.jobOffers) ? S.jobOffers : [];
    const risk = riskFor(S.club, S.lg);
    const threatened = risk === 'Menacé' || risk === 'Sous pression';

    const threatRows = threatened
      ? '<tr><td><b>' + esc(S.club) + '</b><small class="mu">Ton club actuel</small></td>' +
        '<td>' + esc(S.lg) + '<small class="mu">' + esc(tierLabel(S.lg)) + '</small></td>' +
        '<td><span class="fm26-job-risk ' + (risk === 'Menacé' ? 'danger' : 'warning') + '">' + esc(risk) + '</span></td>' +
        '<td>' + esc(financeLabel(S.club)) + '</td></tr>'
      : '<tr><td colspan="4" class="mu">' +
        (risk === 'Stable'
          ? 'Ton poste est actuellement stable selon le classement disponible.'
          : 'La situation de ton poste ne peut pas être évaluée avec les données actuelles.') +
        '</td></tr>';

    const offerRows = offers.length
      ? offers.map((offer, index) =>
          '<tr><td><b>' + esc(offer.club || 'Club') + '</b></td>' +
          '<td>' + esc(offer.league || '—') + '<small class="mu">' + esc(tierLabel(offer.league)) + '</small></td>' +
          '<td>' + esc(offer.ambition || 'Non précisée') + '</td>' +
          '<td>' + esc(financeLabel(offer.club)) + '</td>' +
          '<td class="fm26-job-actions">' +
            '<button class="chip" type="button" data-job-accept="' + index + '">Accepter</button>' +
            '<button class="chip" type="button" data-job-refuse="' + index + '">Refuser</button>' +
          '</td></tr>'
        ).join('')
      : '<tr><td colspan="5" class="mu">Aucun poste ne t’a encore été proposé. Les offres peuvent arriver après une saison réussie.</td></tr>';

    return '<div class="fm26-jobs-page">' +
      '<div class="fm26-jobs-intro"><div><p class="fm26-jobs-kicker">CARRIÈRE · MARCHÉ DES ENTRAÎNEURS</p>' +
      '<h1>Emplois</h1><p>Consulte la situation de ton poste et les propositions reçues.</p></div>' +
      '<div class="fm26-jobs-current"><small>CLUB ACTUEL</small><b>' + esc(S.club) + '</b><span>' + esc(S.lg) + '</span></div></div>' +
      '<div class="fm26-jobs-grid">' +
        '<section class="pn"><div class="fm26-jobs-section-head"><h3>Situation de ton poste</h3><span>' + esc(risk) + '</span></div>' +
          '<div class="fm26-jobs-table-wrap"><table><thead><tr><th>Club</th><th>Ligue</th><th>Risque</th><th>Finances</th></tr></thead><tbody>' + threatRows + '</tbody></table></div>' +
          '<p class="fm26-jobs-note">Le risque est calculé à partir du classement de ton championnat actuel. Les autres championnats ne sont pas encore simulés individuellement.</p>' +
        '</section>' +
        '<section class="pn"><div class="fm26-jobs-section-head"><h3>Postes proposés</h3><span>' + offers.length + ' offre(s)</span></div>' +
          '<div class="fm26-jobs-table-wrap"><table><thead><tr><th>Club</th><th>Ligue</th><th>Ambition</th><th>Finances</th><th>Décision</th></tr></thead><tbody>' + offerRows + '</tbody></table></div>' +
        '</section>' +
      '</div>' +
    '</div>';
  }

  function wire() {
    const view = document.getElementById('vw');
    if (!view || typeof S === 'undefined' || !S || S.view !== 'jobs') return;

    view.querySelectorAll('[data-job-accept]').forEach(button => {
      if (button.dataset.fm26JobsWired) return;
      button.dataset.fm26JobsWired = '1';
      button.addEventListener('click', () => {
        const index = Number(button.dataset.jobAccept);
        if (window.FM26A && typeof window.FM26A.job === 'function') {
          window.FM26A.job(index);
        }
      });
    });

    view.querySelectorAll('[data-job-refuse]').forEach(button => {
      if (button.dataset.fm26JobsWired) return;
      button.dataset.fm26JobsWired = '1';
      button.addEventListener('click', () => {
        const index = Number(button.dataset.jobRefuse);
        if (!Array.isArray(S.jobOffers) || !S.jobOffers[index]) return;
        S.jobOffers.splice(index, 1);
        try { if (typeof sv === 'function') sv(); } catch (error) {}
        render();
      });
    });
  }

  V.jobs = openJobs;

  if (typeof render === 'function') {
    const previousRender = render;
    render = function () {
      const result = previousRender.apply(this, arguments);
      if (typeof S !== 'undefined' && S && S.view === 'jobs') {
        const heading = document.querySelector('#hd h2');
        if (heading) heading.textContent = 'Emplois';
        const view = document.getElementById('vw');
        if (view) view.innerHTML = openJobs();
        wire();
      }
      return result;
    };
  }

  const style = document.createElement('style');
  style.id = 'fm26-jobs-style';
  style.textContent = [
    '.fm26-jobs-page{height:100%;min-height:0;overflow:auto;box-sizing:border-box;padding:24px 28px 30px;color:#f3f4f8}',
    '.fm26-jobs-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:22px}',
    '.fm26-jobs-kicker{margin:0 0 6px;color:#b59cff;font-size:11px;font-weight:850;letter-spacing:.16em}',
    '.fm26-jobs-intro h1{margin:0;font-size:30px;letter-spacing:-.04em}',
    '.fm26-jobs-intro p:not(.fm26-jobs-kicker){margin:6px 0 0;color:#aeb5c5;font-size:14px}',
    '.fm26-jobs-current{display:grid;gap:4px;min-width:220px;padding:12px 16px;background:#242a38;border:1px solid #394255;border-radius:9px}',
    '.fm26-jobs-current small{color:#9ca8bd;font-size:10px;letter-spacing:.12em}',
    '.fm26-jobs-current b{font-size:16px}.fm26-jobs-current span{color:#b5a4ee;font-size:12px}',
    '.fm26-jobs-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:14px;align-items:start}',
    '.fm26-jobs-grid>.pn{min-width:0;padding:16px}',
    '.fm26-jobs-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}',
    '.fm26-jobs-section-head h3{margin:0}.fm26-jobs-section-head>span{color:#c5b5ff;font-size:12px;font-weight:700}',
    '.fm26-job-risk{display:inline-block;padding:4px 8px;border-radius:5px;font-size:11px;font-weight:800}',
    '.fm26-job-risk.warning{background:#5b481c;color:#f7d98a}.fm26-job-risk.danger{background:#642d3a;color:#ffc4cf}',
    '.fm26-jobs-table-wrap{width:100%;overflow-x:auto}',
    '.fm26-jobs-table-wrap table{min-width:520px;font-size:12px}',
    '.fm26-jobs-table-wrap th{white-space:nowrap}.fm26-jobs-table-wrap td{vertical-align:middle}',
    '.fm26-jobs-table-wrap td small{display:block;margin-top:3px}',
    '.fm26-job-actions{white-space:nowrap}.fm26-job-actions .chip{display:inline-flex;margin:2px;padding:6px 9px}',
    '.fm26-jobs-note{margin:12px 0 0;color:#8e99ad;font-size:11px;line-height:1.5}',
    '.fm26-jobs-empty{padding:32px;background:#1b2230;border:1px solid #343b4c;border-radius:10px;color:#aeb5c5}',
    '@media(max-width:1050px){.fm26-jobs-grid{grid-template-columns:1fr}.fm26-jobs-intro{align-items:flex-start;flex-direction:column}.fm26-jobs-current{width:100%;box-sizing:border-box}}',
    '@media(max-width:620px){.fm26-jobs-page{padding:14px}.fm26-jobs-intro h1{font-size:24px}.fm26-jobs-grid>.pn{padding:12px}}'
  ].join('');
  document.head.appendChild(style);

  window.FM26Jobs = { openJobs, riskFor, financeLabel, tierLabel };
})();