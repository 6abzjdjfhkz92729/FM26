/* FM26 Career Actions — match launch recovery, holidays, jobs and retirement. */
(function () {
  'use strict';
  if (window.FM26CareerActions) return;

  let activeTool = '';
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const notify = message => {
    if (typeof toast === 'function') toast(message);
    else window.alert(message);
  };
  const save = () => { try { if (typeof sv === 'function') sv(); } catch (_) {} };

  const style = document.createElement('style');
  style.id = 'fm26-career-actions-style';
  style.textContent = [
    '.fm26-career-shortcut-title{padding:14px 12px 7px;color:#b9a4ef;font-size:11px;font-weight:900;letter-spacing:.13em;border-top:1px solid #414451;margin-top:8px}',
    '.fm26-career-shortcut{width:100%;min-height:45px;display:flex;align-items:center;gap:11px;padding:7px 12px;background:transparent;border:0;border-top:1px solid #ffffff12;color:#f4f4f6;text-align:left;font-size:14px;font-weight:750;cursor:pointer}',
    '.fm26-career-shortcut:hover,.fm26-career-shortcut:focus-visible{background:#ffffff12;outline:2px solid #b995ff;outline-offset:-2px}',
    '.fm26-career-shortcut .mi{width:24px;flex:0 0 24px;text-align:center;font-size:18px}',
    '.fm26-career-page{width:100%;min-height:100%;box-sizing:border-box;padding:clamp(16px,2vw,30px);color:#f4f4f6;background:radial-gradient(ellipse at 35% 30%,#343438 0%,#19191c 58%,#101014 100%);font-family:Arial,sans-serif;overflow:auto}',
    '.fm26-career-page h1{font-size:clamp(24px,2.1vw,36px);margin:0 0 8px;font-weight:900}',
    '.fm26-career-page .lead{color:#bfc2ce;line-height:1.55;margin:0 0 22px;max-width:850px}',
    '.fm26-career-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(230px,.7fr);gap:14px;align-items:start}',
    '.fm26-career-card{min-width:0;padding:clamp(14px,1.5vw,22px);background:linear-gradient(135deg,#292a38,#20212d);border:1px solid #454657;box-shadow:0 10px 26px #0002}',
    '.fm26-career-card h2{font-size:16px;margin:0 0 13px;color:#c7a5ff}',
    '.fm26-career-card p{color:#c2c4cf;line-height:1.55}',
    '.fm26-career-row{display:flex;justify-content:space-between;gap:15px;padding:10px 0;border-bottom:1px solid #ffffff12}',
    '.fm26-career-row span{color:#c3c5cf}.fm26-career-row b{text-align:right}',
    '.fm26-career-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}',
    '.fm26-career-actions button{min-height:45px;padding:9px 15px;background:#514b65;border:1px solid #777087;color:#fff;font-weight:800;cursor:pointer}',
    '.fm26-career-actions button.primary{background:#710bd7;border-color:#8c43e0}',
    '.fm26-career-actions button.danger{background:#702b42;border-color:#a94b68}',
    '.fm26-career-actions button:hover{filter:brightness(1.15)}',
    '.fm26-career-select{display:block;width:100%;max-width:260px;margin:12px 0;padding:11px;background:#171923;border:1px solid #65657a;color:#fff}',
    '.fm26-career-kpi{font-size:28px;font-weight:900;margin:4px 0 10px}',
    '.fm26-career-note{font-size:12px;color:#9fa4b4;margin-top:13px;line-height:1.5}',
    '@media(max-width:760px){.fm26-career-grid{grid-template-columns:1fr}.fm26-career-actions button{flex:1 1 100%}}'
  ].join('\n');
  document.head.appendChild(style);

  function normalizeMatchOptions() {
    if (!S) return false;
    S.tc = S.tc && typeof S.tc === 'object' ? S.tc : {};
    if (typeof FM === 'object' && FM && !FM[S.tc.f]) S.tc.f = FM['4-3-3'] ? '4-3-3' : Object.keys(FM)[0];
    if (typeof MEN === 'object' && MEN && !MEN[S.tc.m]) S.tc.m = MEN.Balanced ? 'Balanced' : Object.keys(MEN)[0];
    if (typeof STY === 'object' && STY && !STY[S.tc.s]) S.tc.s = STY['Control Possession'] ? 'Control Possession' : Object.keys(STY)[0];
    return !!(typeof MEN === 'object' && MEN && MEN[S.tc.m] && typeof STY === 'object' && STY && STY[S.tc.s]);
  }

  function currentFixture() {
    if (typeof nxt === 'function') return nxt();
    return Array.isArray(S && S.fx) ? S.fx.find(f => !f.played && (f.home === S.club || f.away === S.club)) : null;
  }

  function launchMatch() {
    if (!S) return;
    const fixture = currentFixture();
    if (!fixture) {
      notify('Aucun match à lancer dans le calendrier. Vérifie le calendrier ou passe à la saison suivante.');
      return;
    }
    if (!normalizeMatchOptions()) {
      notify('La tactique de match est incomplète. Ouvre Tactiques, choisis une mentalité et réessaie.');
      return;
    }
    try {
      if (typeof xi === 'function') {
        const selected = xi().slice(0, 11);
        if (selected.length !== 11) {
          notify('Il faut 11 joueurs disponibles pour lancer le match.');
          return;
        }
        S.lineup = selected.map(player => player.id);
      }
      save();
      if (typeof startMatch !== 'function') throw new Error('Moteur de match indisponible');
      startMatch();
      if (S.view !== 'match' || !M || !M.f) throw new Error('Le moteur n’a pas ouvert le match');
      if (typeof draw === 'function') draw();
    } catch (error) {
      try { if (typeof T !== 'undefined') clearInterval(T); } catch (_) {}
      if (M && !M.done) M = null;
      S.view = 'pre';
      console.error('[FM26] Échec du lancement du match :', error);
      try { render(); } catch (_) {}
      notify('Le match n’a pas pu démarrer. La composition a été conservée ; vérifie les joueurs disponibles et la tactique.');
    }
  }

  function ensureShortcuts() {
    const pane = $('fm26-manager-sidebar');
    const links = pane && pane.querySelector('.fm26-manager-links');
    if (!links || links.querySelector('.fm26-career-shortcuts')) return;
    const block = document.createElement('div');
    block.className = 'fm26-career-shortcuts';
    block.innerHTML =
      '<div class="fm26-career-shortcut-title">GESTION DE CARRIÈRE</div>' +
      '<button type="button" class="fm26-career-shortcut" data-career-action="jobs"><span class="mi">▤</span><span>Emplois et offres reçues</span></button>' +
      '<button type="button" class="fm26-career-shortcut" data-career-action="scouting"><span class="mi">⌕</span><span>Centre de recrutement</span></button>' +
      '<button type="button" class="fm26-career-shortcut" data-career-action="recommendation"><span class="mi">★</span><span>Joueur recommandé</span></button>' +
      '<button type="button" class="fm26-career-shortcut" data-career-action="contracts"><span class="mi">▣</span><span>Contrats des joueurs</span></button>' +
      '<button type="button" class="fm26-career-shortcut" data-career-action="vacation"><span class="mi">◷</span><span>Partir en vacances</span></button>' +
      '<button type="button" class="fm26-career-shortcut" data-career-action="retire"><span class="mi">⚑</span><span>Prendre sa retraite</span></button>';
    links.appendChild(block);
  }

  function careerSummary() {
    const table = typeof tbl === 'function' ? tbl() : [];
    const row = Array.isArray(table) ? table.find(item => item.c === S.club || item.club === S.club) : null;
    const rank = Array.isArray(table) ? table.findIndex(item => item.c === S.club || item.club === S.club) + 1 : 0;
    const played = (S.fx || []).filter(f => f.played && (f.home === S.club || f.away === S.club));
    const wins = played.filter(f => {
      const score = String(f.score || '0-0').split('-').map(Number);
      return f.home === S.club ? score[0] > score[1] : score[1] > score[0];
    }).length;
    const goals = (S.sq || []).reduce((total, player) => total + (Number(player.g) || 0), 0);
    return {
      manager: S.mg || 'Manager',
      club: S.club || 'Club',
      league: S.lg || '—',
      season: Number(S.season) || 1,
      date: S.date || '—',
      rank: rank || '—',
      points: row ? (row.pts == null ? '—' : row.pts) : '—',
      games: played.length,
      wins,
      goals,
      seasonsManaged: (S.history || []).length + 1
    };
  }

  function renderTool() {
    const summary = careerSummary();
    if (activeTool === 'vacation') {
      return '<main class="fm26-career-page"><h1>Vacances du manager</h1>' +
        '<p class="lead">Confie temporairement l’équipe à ton staff. Les matchs de ton club pendant cette période seront simulés, les résultats seront ajoutés à ta carrière et tu retrouveras ensuite ta boîte de réception.</p>' +
        '<div class="fm26-career-grid"><section class="fm26-career-card"><h2>DURÉE DES VACANCES</h2>' +
        '<p>Choisis la durée de ton absence. Le jeu simulera les rencontres programmées de ton club pendant cette période.</p>' +
        '<select class="fm26-career-select" id="fm26-vacation-weeks"><option value="1">1 semaine</option><option value="2" selected>2 semaines</option><option value="3">3 semaines</option><option value="4">4 semaines</option><option value="6">6 semaines</option><option value="8">8 semaines</option></select>' +
        '<div class="fm26-career-actions"><button type="button" class="primary" data-career-action="take-vacation">PARTIR EN VACANCES</button><button type="button" data-career-action="close-tool">Retour au club</button></div>' +
        '<p class="fm26-career-note">Les matchs joués pendant ton absence ne pourront pas être rejoués. Les rencontres et leur classement seront enregistrés dans la sauvegarde.</p></section>' +
        '<aside class="fm26-career-card"><h2>SITUATION ACTUELLE</h2>' +
        '<div class="fm26-career-row"><span>Club</span><b>' + esc(summary.club) + '</b></div>' +
        '<div class="fm26-career-row"><span>Championnat</span><b>' + esc(summary.league) + '</b></div>' +
        '<div class="fm26-career-row"><span>Saison</span><b>' + esc(summary.season) + '</b></div>' +
        '<div class="fm26-career-row"><span>Date de la partie</span><b>' + esc(summary.date) + '</b></div></aside></div></main>';
    }
    if (activeTool === 'recommendation') {
      const target = (Array.isArray(S.shortlist) ? S.shortlist : []).slice().sort((a,b) => (Number(b.ovr)||0) - (Number(a.ovr)||0))[0] || null;
      const scout = (Array.isArray(S.staff) ? S.staff : []).find(member => /recruteur/i.test(String(member.role || member.speciality || '')));
      if (!target) {
        return '<main class="fm26-career-page"><h1>Joueur recommandé</h1><p class="lead">Aucun rapport de recrutement n’est encore disponible. Lance une mission depuis le Centre de recrutement ; les joueurs observés apparaîtront ici une fois la mission terminée.</p><section class="fm26-career-card" style="max-width:760px"><h2>RAPPORT DE RECRUTEMENT</h2><p>La liste est vide pour le moment. Aucune statistique de joueur n’est inventée.</p><div class="fm26-career-actions"><button class="primary" type="button" data-career-action="scouting">OUVRIR LE CENTRE DE RECRUTEMENT</button><button type="button" data-career-action="close-tool">Retour au club</button></div></section></main>';
      }
      const portrait = target.photoUrl || (window.FM26UX && typeof window.FM26UX.portraitSvg === 'function' ? window.FM26UX.portraitSvg(Number(target.id)||0) : '');
      const stars = value => { const count = Math.max(0,Math.min(5,Math.round((Number(value)||0)/20))); return '★'.repeat(count) + '<span style="color:#858594">' + '★'.repeat(5-count) + '</span>'; };
      const valueLabel = target.val == null ? 'Non renseignée' : '€' + esc(target.val) + ' M';
      const wageLabel = target.sal == null ? 'Non renseigné' : '€' + esc(Number(target.sal).toLocaleString('fr-FR')) + ' / semaine';
      const confidence = target.reportConfidence == null ? 'En cours d’évaluation' : esc(target.reportConfidence) + ' %';
      return '<main class="fm26-career-page"><h1>Infos · Joueur recommandé</h1><p class="lead">Rapport établi par ' + esc(scout ? scout.name : 'le Centre de recrutement') + ' à partir des observations enregistrées dans ta carrière.</p>' +
        '<div class="fm26-career-grid"><section class="fm26-career-card"><h2>RECOMMANDATION DU RECRUTEUR</h2><div style="display:grid;grid-template-columns:130px minmax(0,1fr);gap:18px;align-items:center">' +
        '<div style="border:2px solid #7e10e7;background:#11121d;text-align:center;padding:8px">' + (portrait ? '<img src="' + esc(portrait) + '" alt="" style="width:100%;height:140px;object-fit:cover">' : '<div style="height:140px;display:grid;place-items:center;font-size:34px">⚽</div>') + '<b style="display:block;background:#7605d7;padding:7px 3px">' + esc(target.name) + '</b><small>' + esc(target.pos || 'Poste non précisé') + '</small></div>' +
        '<div><h2 style="font-size:22px;color:#fff;margin-bottom:8px">' + esc(target.name) + '</h2><p>' + esc(target.club || 'Club inconnu') + ' · ' + esc(target.age == null ? 'Âge inconnu' : target.age + ' ans') + '</p><div class="fm26-career-row"><span>Capacité actuelle</span><b>' + esc(target.ovr == null ? '—' : target.ovr + '/100') + '</b></div><div class="fm26-career-row"><span>Potentiel estimé</span><b>' + esc(target.pot == null ? '—' : target.pot + '/100') + '</b></div><div class="fm26-career-row"><span>Valeur estimée</span><b>' + valueLabel + '</b></div><div class="fm26-career-row"><span>Salaire actuel estimé</span><b>' + wageLabel + '</b></div><div class="fm26-career-row"><span>Fiabilité du rapport</span><b>' + confidence + '</b></div></div></div>' +
        '<p class="fm26-career-note">Les notes et estimations proviennent de la cible enregistrée dans ta sauvegarde. Le prix final et l’intérêt du joueur restent à négocier.</p></section>' +
        '<aside class="fm26-career-card"><h2>AFFECTATION DU RECRUTEUR</h2><div class="fm26-career-kpi">' + esc(scout ? scout.name : 'Équipe recrutement') + '</div><div class="fm26-career-row"><span>Rapports enregistrés</span><b>' + esc((S.shortlist || []).length) + '</b></div><div class="fm26-career-row"><span>Missions en cours</span><b>' + esc((S.scoutMissions || []).filter(m => !m.done).length) + '</b></div><div class="fm26-career-row"><span>Progression du rapport</span><b>' + confidence + '</b></div>' +
        '<div class="fm26-career-actions"><button class="primary" type="button" data-career-action="scouting">GÉRER LE RECRUTEMENT</button><button type="button" data-career-action="jobs">CONSULTER LES EMPLOIS</button><button type="button" data-career-action="close-tool">Retour au club</button></div></aside></div></main>';
    }
    if (activeTool === 'retirement-confirm') {
      return '<main class="fm26-career-page"><h1>Prendre sa retraite</h1>' +
        '<p class="lead">Cette décision mettra fin à ta carrière de manager actuelle. Un bilan sera conservé dans tes archives locales avant de revenir à l’écran de création de carrière.</p>' +
        '<div class="fm26-career-grid"><section class="fm26-career-card"><h2>TON BILAN AVANT DE PARTIR</h2>' +
        '<div class="fm26-career-kpi">' + esc(summary.seasonsManaged) + ' saison(s)</div>' +
        '<div class="fm26-career-row"><span>Manager</span><b>' + esc(summary.manager) + '</b></div>' +
        '<div class="fm26-career-row"><span>Club actuel</span><b>' + esc(summary.club) + '</b></div>' +
        '<div class="fm26-career-row"><span>Classement actuel</span><b>' + esc(summary.rank) + '</b></div>' +
        '<div class="fm26-career-row"><span>Points</span><b>' + esc(summary.points) + '</b></div>' +
        '<div class="fm26-career-row"><span>Matchs joués</span><b>' + esc(summary.games) + '</b></div>' +
        '<div class="fm26-career-row"><span>Victoires</span><b>' + esc(summary.wins) + '</b></div>' +
        '<div class="fm26-career-row"><span>Buts inscrits par l’effectif</span><b>' + esc(summary.goals) + '</b></div>' +
        '<div class="fm26-career-actions"><button class="danger" type="button" data-career-action="confirm-retirement">CONFIRMER MA RETRAITE</button><button type="button" data-career-action="close-tool">Annuler</button></div></section>' +
        '<aside class="fm26-career-card"><h2>À SAVOIR</h2><p>La retraite clôt cette sauvegarde de carrière. Le bilan sera ajouté aux archives FM26 de ce navigateur.</p><p class="fm26-career-note">La sauvegarde ne sera pas effacée avant que tu choisisses de quitter cet écran.</p></aside></div></main>';
    }
    if (activeTool === 'retired') {
      const record = S.retirementRecord || summary;
      return '<main class="fm26-career-page"><h1>Carrière terminée</h1>' +
        '<p class="lead">Tu as quitté ton poste de manager. Le bilan de cette carrière a été conservé dans les archives de ce navigateur.</p>' +
        '<section class="fm26-career-card" style="max-width:800px"><h2>ARCHIVES DE CARRIÈRE</h2>' +
        '<div class="fm26-career-kpi">' + esc(record.seasonsManaged) + ' saison(s) dirigée(s)</div>' +
        '<div class="fm26-career-row"><span>Manager</span><b>' + esc(record.manager) + '</b></div>' +
        '<div class="fm26-career-row"><span>Dernier club</span><b>' + esc(record.club) + '</b></div>' +
        '<div class="fm26-career-row"><span>Championnat</span><b>' + esc(record.league) + '</b></div>' +
        '<div class="fm26-career-row"><span>Victoires</span><b>' + esc(record.wins) + '</b></div>' +
        '<div class="fm26-career-row"><span>Buts de l’effectif</span><b>' + esc(record.goals) + '</b></div>' +
        '<div class="fm26-career-actions"><button class="primary" type="button" data-career-action="finish-retirement">TERMINER ET REVENIR À L’ACCUEIL</button></div></section></main>';
    }
    return '';
  }

  function openJobs() { activeTool = ''; S.view = 'jobs'; render(); }
  function openTool(tool) {
    if (!S) return;
    activeTool = tool;
    S.view = 'mgr';
    render();
  }

  function dateISO(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function simulateMatchForVacation() {
    const fixture = currentFixture();
    if (!fixture || typeof startMatch !== 'function' || typeof endMatch !== 'function') return false;
    normalizeMatchOptions();
    startMatch();
    if (!M || !M.f) return false;
    const result = typeof simLeagueScore === 'function'
      ? simLeagueScore(M.f.home, M.f.away)
      : [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)];
    const home = Math.max(0, Math.min(9, Math.round(Number(result && result[0]) || 0)));
    const away = Math.max(0, Math.min(9, Math.round(Number(result && result[1]) || 0)));
    M.h = home;
    M.a = away;
    M.min = 90;
    M.p = 0;
    M.done = false;
    M.sh = [Math.max(1, home + away), Math.max(1, home + away)];
    M.ps = 50;
    M.cm = 'Résultat simulé pendant les vacances.';
    M.ev = [{m:90,k:'FT',t:'Rencontre simulée pendant les vacances.'}];
    try { if (typeof T !== 'undefined') clearInterval(T); } catch (_) {}
    endMatch();
    try { if (typeof T !== 'undefined') clearInterval(T); } catch (_) {}
    return true;
  }

  function takeVacation() {
    if (!S) return;
    const weeks = Math.max(1, Math.min(8, Number($('fm26-vacation-weeks')?.value) || 2));
    const start = new Date(String(S.date || '2026-08-01').slice(0, 10) + 'T12:00:00');
    const target = new Date(start.getTime());
    target.setDate(target.getDate() + weeks * 7);
    let simulated = 0;
    let guard = 18;
    while (guard-- > 0) {
      const next = currentFixture();
      if (!next) break;
      const matchDate = new Date(String(next.date || S.date).slice(0, 10) + 'T12:00:00');
      if (Number.isNaN(matchDate.getTime()) || matchDate > target) break;
      try {
        if (!simulateMatchForVacation()) break;
        simulated++;
        S.view = 'mgr';
      } catch (error) {
        console.error('[FM26] Simulation de vacances interrompue :', error);
        break;
      }
    }
    (S.sq || []).forEach(player => {
      player.cond = Math.min(100, (Number(player.cond) || 70) + weeks * 7);
      if (player.morale != null) player.morale = Math.max(0, Math.min(100, Number(player.morale) || 70));
    });
    S.date = dateISO(target);
    if (typeof mail === 'function') {
      mail('Vacances du manager', 'Retour de vacances', weeks + ' semaine(s) d’absence. ' + simulated + ' rencontre(s) de ton club ont été simulées. Les résultats sont enregistrés dans le calendrier et le classement.');
    } else {
      S.ib = Array.isArray(S.ib) ? S.ib : [];
      S.ib.unshift({s:'Direction sportive',t:'Retour de vacances',b:weeks + ' semaine(s) d’absence. ' + simulated + ' rencontre(s) ont été simulées.',d:S.date,r:false});
    }
    save();
    activeTool = 'vacation';
    S.view = 'mgr';
    render();
    notify('Vacances terminées : ' + simulated + ' match(s) simulé(s).');
  }

  function confirmRetirement() {
    const record = careerSummary();
    record.retiredOn = S.date || '—';
    S.retirementRecord = record;
    S.retired = true;
    try {
      const key = 'fm26_retired_careers';
      const archive = JSON.parse(localStorage.getItem(key) || '[]');
      archive.push(record);
      localStorage.setItem(key, JSON.stringify(archive.slice(-20)));
    } catch (error) {
      console.warn('[FM26] Archivage de carrière indisponible :', error);
    }
    if (typeof mail === 'function') mail('Fin de carrière', 'Retraite de ' + record.manager, record.manager + ' quitte son poste à ' + record.club + '. Le bilan de carrière a été archivé.');
    save();
    activeTool = 'retired';
    S.view = 'mgr';
    render();
  }

  function finishRetirement() {
    try { localStorage.removeItem('fm26_v2'); } catch (_) {}
    try { if (typeof T !== 'undefined') clearInterval(T); } catch (_) {}
    S = null;
    activeTool = '';
    document.body.classList.remove('fm26-screenpack-active','fm26-inbox-active','fm26-lineup-active','fm26-matchday-active','fm26-ref-active');
    $('app')?.classList.add('hid');
    $('setup')?.classList.remove('hid');
  }

  function routeMenuItem(button) {
    const label = String(button.dataset.packLabel || button.dataset.label || '').toLowerCase();
    if (label.includes('vacance')) { openTool('vacation'); return true; }
    if (label.includes('retraite')) { openTool('retirement-confirm'); return true; }
    if (label.includes('emploi')) { openJobs(); return true; }
    if (label.includes('résultats recrut') || label.includes('joueur recommandé')) { openTool('recommendation'); return true; }
    if (label.includes('histor') || label.includes('trophée') || label.includes('panthéon')) { activeTool = ''; S.view = 'history'; render(); return true; }
    if (label.includes('recrut') || label.includes('observation') || label.includes('obs.') || label.includes('sélection')) { activeTool = ''; S.view = 'scouting'; render(); return true; }
    if (label.includes('recherche de staff')) { activeTool = ''; S.view = 'staff'; render(); return true; }
    if (label.includes('paramètre')) { activeTool = ''; S.view = 'settings'; render(); return true; }
    return false;
  }

  document.addEventListener('click', function (event) {
    const actionButton = event.target && event.target.closest
      ? event.target.closest('[data-career-action]')
      : null;
    if (actionButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = actionButton.dataset.careerAction;
      if (action === 'jobs') openJobs();
      else if (action === 'scouting') { activeTool = ''; S.view = 'scouting'; render(); }
      else if (action === 'recommendation') openTool('recommendation');
      else if (action === 'contracts') { activeTool = ''; S.view = 'contracts'; render(); }
      else if (action === 'vacation') openTool('vacation');
      else if (action === 'take-vacation') takeVacation();
      else if (action === 'retire') openTool('retirement-confirm');
      else if (action === 'confirm-retirement') confirmRetirement();
      else if (action === 'finish-retirement') finishRetirement();
      else if (action === 'close-tool') { activeTool = ''; S.view = 'home'; render(); }
      return;
    }

    const packButton = event.target && event.target.closest
      ? event.target.closest('#fm26-manager-sidebar [data-pack-view]')
      : null;
    if (packButton && S && routeMenuItem(packButton)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    const launchButton = event.target && event.target.closest
      ? event.target.closest('#go, [data-pack-lineup="start"], [data-md-action="pre-start"]')
      : null;
    if (launchButton && S && S.view === 'pre') {
      event.preventDefault();
      event.stopImmediatePropagation();
      launchMatch();
    }
  }, true);

  const previousRender = typeof render === 'function' ? render : null;
  if (previousRender) {
    render = function () {
      const result = previousRender.apply(this, arguments);
      try {
        ensureShortcuts();
        if (S && S.view === 'mgr' && activeTool) {
          const view = $('vw');
          if (view) view.innerHTML = renderTool();
          const heading = document.querySelector('#hd h2');
          if (heading) heading.textContent = activeTool === 'vacation' ? 'Vacances' : activeTool === 'retirement-confirm' ? 'Prendre sa retraite' : activeTool === 'recommendation' ? 'Joueur recommandé' : 'Fin de carrière';
          const go = $('go');
          if (go) {
            go.textContent = activeTool === 'retired' ? 'RETRAITE' : 'RETOUR AU CLUB';
            go.onclick = function () {
              if (activeTool === 'retired') finishRetirement();
              else { activeTool = ''; S.view = 'home'; render(); }
            };
          }
        } else if (!S || S.view !== 'mgr') {
          if (activeTool === 'retired') activeTool = '';
          else if (S && S.view !== 'mgr') activeTool = '';
        }
      } catch (error) {
        console.error('[FM26] Career actions render:', error);
      }
      return result;
    };
  }

  window.FM26CareerActions = {
    launchMatch,
    takeVacation,
    openJobs,
    retire: () => openTool('retirement-confirm')
  };

  if (typeof S !== 'undefined' && S && $('app') && !$('app').classList.contains('hid') && typeof render === 'function') {
    try { render(); } catch (error) { console.warn('[FM26] Career actions init:', error); }
  }
})();
