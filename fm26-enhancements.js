/* FM26 Enhancements — messagerie, navigation extensible, recherche mondiale et conférences de presse. */
(function () {
  'use strict';
  if (window.FM26Enhancements) return;
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const clamp = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));
  const save = () => { try { if (typeof sv === 'function') sv(); } catch (_) {} };
  const notify = m => typeof toast === 'function' ? toast(m) : alert(m);
  let searchTimer = 0;
  let searchAbort = null;

  function ensureState() {
    if (!S) return;
    S.fm26SearchMode = !!S.fm26SearchMode;
    S.fm26SearchQuery = S.fm26SearchQuery || '';
    S.fm26RemotePlayerResults = Array.isArray(S.fm26RemotePlayerResults) ? S.fm26RemotePlayerResults : [];
    S.playerSearchSelection = Array.isArray(S.playerSearchSelection) ? S.playerSearchSelection : [];
    S.managerHistory = Array.isArray(S.managerHistory) ? S.managerHistory : [];
    S.trophies = Array.isArray(S.trophies) ? S.trophies : [];
    S.fm26PressLastCount = Number(S.fm26PressLastCount) || 0;
    S.fm26PressStep = Number(S.fm26PressStep) || 0;
    S.fm26PressAnswers = Array.isArray(S.fm26PressAnswers) ? S.fm26PressAnswers : [];
    S.fm26Panel = S.fm26Panel || 'confidence';
  }

  function toggleRails(force) {
    const collapsed = typeof force === 'boolean' ? force : !document.body.classList.contains('fm26-rails-collapsed');
    document.body.classList.toggle('fm26-rails-collapsed', collapsed);
    const button = $('fm26-rails-reopen');
    if (button) button.setAttribute('aria-expanded', String(!collapsed));
    return collapsed;
  }

  function ensureReopenButton() {
    const app = $('app');
    if (!app) return;
    let button = $('fm26-rails-reopen');
    if (!button) {
      button = document.createElement('button');
      button.id = 'fm26-rails-reopen';
      button.type = 'button';
      button.title = 'Réafficher les deux panneaux';
      button.setAttribute('aria-label','Réafficher les deux panneaux');
      button.setAttribute('aria-expanded','false');
      button.textContent = '☰';
      app.appendChild(button);
      button.addEventListener('click', () => toggleRails(false));
    }
  }

  function ratingFor(club) {
    let value = 65;
    try { if (typeof pw === 'function') value = Number(pw(club)) || value; } catch (_) {}
    return Math.round(clamp(value / 20,0,5) * 2) / 2;
  }

  function paintStars() {
    if (!S || S.view !== 'home') return;
    const fixture = typeof nxt === 'function' ? nxt() : (S.fx || []).find(f => !f.played && (f.home === S.club || f.away === S.club));
    const opponent = fixture ? (fixture.home === S.club ? fixture.away : fixture.home) : S.club;
    const rating = ratingFor(opponent);
    const fill = rating * 20;
    document.querySelectorAll('.fm26-pack-stars').forEach(el => {
      el.style.backgroundImage = 'linear-gradient(90deg,#ffd45c 0%,#f6bc42 '+fill+'%,#69778f '+fill+'%,#69778f 100%)';
      el.style.backgroundClip = 'text';
      el.style.webkitBackgroundClip = 'text';
      el.style.color = 'transparent';
      el.style.webkitTextFillColor = 'transparent';
      el.title = 'Niveau estimé du club : ' + rating.toFixed(1).replace('.',',') + ' / 5';
      el.setAttribute('aria-label',el.title);
    });
  }

  function playerCatalogue() {
    const list = [];
    const seen = new Set();
    const add = p => {
      if (!p || !p.name) return;
      const key = norm(p.name);
      if (!key || seen.has(key)) return;
      seen.add(key);
      list.push({
        name:String(p.name), club:String(p.club || p.team || 'Club non renseigné'),
        pos:String(p.pos || p.position || '—'), age:p.age == null ? '—' : p.age,
        level:p.ovr == null ? '—' : p.ovr, value:p.val == null ? null : p.val,
        nationality:p.nat || p.nationality || '', photo:p.photoUrl || p.strThumb || p.strCutout || '',
        source:p.source || 'Effectifs FM26'
      });
    };
    (S.sq || []).forEach(p => add(Object.assign({},p,{club:S.club})));
    (S.mk || []).forEach(add);
    try {
      if (typeof REAL !== 'undefined' && REAL && typeof REAL === 'object') {
        Object.entries(REAL).forEach(([club, raw]) => {
          String(raw || '').split(',').forEach(entry => {
            const match = entry.trim().match(/^(.+?)\s+(GK|DC|DL|DR|DM|MC|AMC|AMR|AML|ST)\s+(\d{2})$/);
            if (match) add({name:match[1],club,pos:match[2],level:Number(match[3]),ovr:Number(match[3]),source:'Base de clubs FM26'});
          });
        });
      }
    } catch (_) {}
    add({name:'Désiré Doué',club:'Paris SG',pos:'Attaquant',age:21,ovr:86,nat:'France',source:'Référence UEFA 2026/27'});
    add({name:'Cristiano Ronaldo',club:'Al-Nassr',pos:'Attaquant',age:41,ovr:84,nat:'Portugal',source:'Catalogue complémentaire'});
    add({name:'Lionel Messi',club:'Inter Miami',pos:'Attaquant',age:39,ovr:87,nat:'Argentine',source:'Catalogue complémentaire'});
    add({name:'Son Heung-min',club:'LAFC',pos:'Attaquant',age:34,ovr:82,nat:'Corée du Sud',source:'Catalogue complémentaire'});
    return list;
  }

  function playerRows(list) {
    if (!list.length) return '<div class="fm26-search-empty">Aucun joueur correspondant dans les données locales. La recherche en ligne peut compléter ce résultat.</div>';
    return '<div class="fm26-search-results">' + list.slice(0,45).map((p,i) => {
      const meta = [p.pos || 'Poste inconnu',p.age === '—' ? '' : p.age+' ans',p.nationality || ''].filter(Boolean).join(' · ');
      const details = p.level === '—' ? 'Niveau à évaluer' : 'Niveau '+esc(p.level)+'/100';
      const photo = p.photo ? '<img src="'+esc(p.photo)+'" alt="" loading="lazy">' : '<span>'+esc(String(p.name).split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase())+'</span>';
      return '<article class="fm26-search-player"><div class="fm26-search-player-avatar">'+photo+'</div><div class="fm26-search-player-main"><b>'+esc(p.name)+'</b><span>'+esc(p.club)+'</span><small>'+esc(meta)+' · '+esc(details)+'</small></div><button type="button" class="chip" data-fm26-add-player="'+i+'" data-player-name="'+esc(p.name)+'" data-player-club="'+esc(p.club)+'" data-player-pos="'+esc(p.pos)+'" data-player-age="'+esc(p.age)+'" data-player-level="'+esc(p.level)+'">Ajouter à la sélection</button></article>';
    }).join('') + '</div>';
  }

  function matchingPlayers(query) {
    const q = norm(query);
    const local = playerCatalogue();
    const remote = S.fm26RemotePlayerResults || [];
    const combined = local.concat(remote);
    if (!q) return combined.slice(0,18);
    return combined.filter(p => [p.name,p.club,p.pos,p.nationality].some(v => norm(v).includes(q)));
  }

  function playerSearchMarkup() {
    ensureState();
    const q = S.fm26SearchQuery || '';
    const results = matchingPlayers(q);
    return '<main class="fm26-pack-page fm26-global-scout"><div class="page-intro"><div><p class="eyebrow">CELLULE DE RECRUTEMENT · MONDE</p><h1>Recherche de joueurs</h1><p>Recherche dans les effectifs intégrés à FM26 et interroge le catalogue en ligne par nom.</p></div></div><section class="pn fm26-global-search-panel"><label for="fm26-world-player-search">Nom du joueur, club ou poste</label><input id="fm26-world-player-search" type="search" autocomplete="off" placeholder="Ex. : Désiré Doué, Haaland, Real Madrid…" value="'+esc(q)+'"><div class="fm26-search-help">Le catalogue local rassemble les effectifs présents dans le jeu. La recherche web complète les noms saisis quand le service répond.</div><div id="fm26-search-status" class="fm26-search-status">'+(q ? results.length+' résultat(s) local(aux)' : 'Joueurs connus à explorer')+'</div><div id="fm26-search-results">'+playerRows(results)+'</div></section></main>';
  }

  function remoteSearch(query) {
    if (!query || query.trim().length < 3 || !window.fetch) return;
    if (searchAbort) try { searchAbort.abort(); } catch (_) {}
    searchAbort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const url = 'https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=' + encodeURIComponent(query.trim().replace(/\s+/g,'_'));
    const options = searchAbort ? {signal:searchAbort.signal} : {};
    const status = $('fm26-search-status');
    if (status) status.textContent = 'Recherche complémentaire dans le catalogue en ligne…';
    fetch(url,options).then(response => {
      if (!response.ok) throw new Error('HTTP '+response.status);
      return response.json();
    }).then(data => {
      if (!S || !S.fm26SearchMode) return;
      const rows = Array.isArray(data && data.player) ? data.player : [];
      S.fm26RemotePlayerResults = rows.map(p => ({
        name:p.strPlayer || p.strAlternate || 'Joueur',
        club:p.strTeam || 'Club non renseigné',
        pos:p.strPosition || '—',
        age:p.dateBorn ? Math.max(0,Math.floor((Date.now()-new Date(p.dateBorn).getTime())/31557600000)) : '—',
        level:'—', nationality:p.strNationality || '', photo:p.strThumb || p.strCutout || '',
        source:'TheSportsDB'
      }));
      const resultBox = $('fm26-search-results');
      const statusBox = $('fm26-search-status');
      const results = matchingPlayers(query);
      if (resultBox) resultBox.innerHTML = playerRows(results);
      if (statusBox) statusBox.textContent = rows.length ? 'Catalogue en ligne : '+rows.length+' résultat(s) · ' + results.length + ' au total' : 'Aucun résultat en ligne pour ce nom · ' + results.length + ' résultat(s) local(aux)';
    }).catch(error => {
      if (error && error.name === 'AbortError') return;
      const statusBox = $('fm26-search-status');
      if (statusBox) statusBox.textContent = 'Catalogue en ligne indisponible pour le moment · résultats locaux conservés.';
    });
  }

  function scoutingResultsMarkup() {
    ensureState();
    const assignments = S.scoutingAssignments || [];
    const pool = S.mk || [];
    const filtered = pool.filter(p => assignments.length === 0 || assignments.some(a => (a.pos === 'Tous' || a.pos === p.pos) && Number(p.age) <= Number(a.age || 32)));
    return '<main class="fm26-pack-page"><div class="page-intro"><div><p class="eyebrow">RAPPORTS DES RECRUTEURS</p><h1>Résultats du recrutement</h1><p>Les joueurs ci-dessous sont issus du réseau de recrutement de ta sauvegarde et des missions actives.</p></div></div><section class="pn"><h3>Missions actives · '+assignments.length+'</h3>'+(assignments.map(a=>'<div class="ar"><span>'+esc(a.pos)+' · moins de '+esc(a.age)+' ans</span><b>'+esc(a.priority||'Normale')+'</b></div>').join('') || '<p class="mu">Aucune mission active : les joueurs du réseau restent consultables.</p>')+'<div style="overflow:auto;margin-top:14px"><table><thead><tr><th>Joueur</th><th>Club</th><th>Poste</th><th>Âge</th><th>Niveau estimé</th><th>Prix estimé</th></tr></thead><tbody>'+(filtered.slice().sort((a,b)=>(Number(b.ovr)||0)-(Number(a.ovr)||0)).map(p=>'<tr><td><b>'+esc(p.name)+'</b></td><td>'+esc(p.club)+'</td><td>'+esc(p.pos)+'</td><td>'+esc(p.age)+'</td><td>'+esc(p.ovr)+'/100</td><td>€'+esc(p.price)+' M</td></tr>').join('') || '<tr><td colspan="6">Aucun joueur ne correspond aux missions actuelles.</td></tr>')+'</tbody></table></div></section></main>';
  }

  function shortlistMarkup() {
    ensureState();
    const list = S.playerSearchSelection || [];
    return '<main class="fm26-pack-page"><div class="page-intro"><div><p class="eyebrow">RECRUTEMENT · SÉLECTION</p><h1>Ma sélection de joueurs</h1><p>Les joueurs repérés dans les recherches sont conservés ici pour comparaison.</p></div></div><section class="pn"><div class="wr"><button class="chip" data-fm26-open-search>Rechercher un joueur</button></div>'+(list.length ? '<div style="overflow:auto"><table><thead><tr><th>Joueur</th><th>Club</th><th>Poste</th><th>Âge</th><th>Niveau</th><th></th></tr></thead><tbody>'+list.map((p,i)=>'<tr><td><b>'+esc(p.name)+'</b></td><td>'+esc(p.club)+'</td><td>'+esc(p.pos)+'</td><td>'+esc(p.age)+'</td><td>'+esc(p.level)+'</td><td><button type="button" class="chip" data-fm26-remove-player="'+i+'">Retirer</button></td></tr>').join('')+'</tbody></table></div>' : '<p class="fm26-search-empty">Ta sélection est vide. Lance une recherche et ajoute les joueurs à suivre.</p>')+'</section></main>';
  }

  function pressMarkup() {
    ensureState();
    const step = Number(S.fm26PressStep) || 0;
    const done = !!S.fm26PressComplete;
    const games = (S.fx || []).filter(f => f.played && (f.home === S.club || f.away === S.club));
    const last = games[games.length-1];
    let score = last ? String(last.home)+' '+String(last.score||'—')+' '+String(last.away) : S.club;
    let question = step === 0 ? 'Après ce résultat, quel message souhaitez-vous faire passer au groupe ?' : 'Les journalistes vous interrogent sur les ambitions du club pour la suite.';
    let choices = step === 0 ? [
      ['Le groupe a montré du caractère. Je suis fier des joueurs.','positive'],
      ['Nous devons rester concentrés et continuer à travailler.','balanced'],
      ['Je prends ma part de responsabilité et nous allons corriger nos erreurs.','responsible']
    ] : [
      ['Nous voulons gagner chaque match et rester ambitieux.','ambitious'],
      ['La priorité est de progresser étape par étape.','measured'],
      ['Je préfère parler sur le terrain plutôt que promettre.','calm']
    ];
    const selected = choices.map(c=>'<button type="button" class="fm26-press-answer" data-fm26-press-answer="'+c[1]+'"><span>“'+esc(c[0])+'”</span><b>CHOISIR</b></button>').join('');
    return '<main class="fm26-pack-page fm26-press-page"><div class="fm26-press-studio"><div class="fm26-press-kicker">FM26 · MÉDIAS & COMMUNICATION</div><h1>Conférence de presse</h1><p class="fm26-press-sub">Salle de presse · '+esc(S.club)+' · '+esc(typeof fd==='function'?fd(S.date):S.date)+'</p><div class="fm26-press-journalists"><div class="fm26-press-avatar">PRESSE</div><div><b>Journaliste — conférence d’après-match</b><small>'+esc(score)+'</small></div></div><section class="fm26-press-question"><span>QUESTION '+(step+1)+'/2</span><h2>'+question+'</h2>'+(done ? '<p class="fm26-press-finish">Conférence terminée. Les journalistes publieront ton commentaire dans les actualités du club.</p>' : selected)+'</section><p class="fm26-press-note">Tes réponses influencent légèrement la confiance, le moral et la perception du groupe.</p></div></main>';
  }

  function archiveSeason() {
    if (!S) return;
    ensureState();
    const key = String(S.club)+'|'+String(S.season);
    S.fm26ArchivedSeasons = Array.isArray(S.fm26ArchivedSeasons) ? S.fm26ArchivedSeasons : [];
    if (S.fm26ArchivedSeasons.includes(key)) return;
    const table = typeof tbl === 'function' ? tbl() : [];
    const mine = table.find(x => x.c === S.club || x.club === S.club);
    const rank = table.findIndex(x => x.c === S.club || x.club === S.club)+1;
    const playedGames = (S.fx||[]).filter(f=>f.played&&(f.home===S.club||f.away===S.club));
    const wins = playedGames.filter(f => {
      const nums=String(f.score||'0-0').split('-').map(Number);
      return f.home===S.club ? nums[0]>nums[1] : nums[1]>nums[0];
    }).length;
    S.managerHistory.push({club:S.club,league:S.lg,season:S.season,rank:rank||'—',points:mine?mine.pts:0,played:playedGames.length,wins,recordedAt:S.date});
    S.fm26ArchivedSeasons.push(key);
    if (rank===1) {
      S.trophies.push({name:'Champion de '+S.lg,club:S.club,season:S.season,date:S.date});
    }
    save();
  }

  function richHistoryMarkup() {
    ensureState();
    const rows = (S.managerHistory||[]).slice().reverse().map(x=>'<tr><td>'+esc(x.season)+'</td><td>'+esc(x.club)+'</td><td>'+esc(x.league||'—')+'</td><td>'+esc(x.rank)+'</td><td>'+esc(x.points)+'</td><td>'+esc(x.played)+'</td><td>'+esc(x.wins)+'</td></tr>').join('');
    const current = (S.fx||[]).filter(f=>f.played&&(f.home===S.club||f.away===S.club));
    return '<main class="fm26-pack-page"><div class="page-intro"><div><p class="eyebrow">CARRIÈRE DU MANAGER</p><h1>Historique de l’entraîneur</h1><p>Archives des saisons terminées et résultats du club actuel.</p></div></div><section class="pn"><h3>Saisons archivées</h3><div style="overflow:auto"><table><thead><tr><th>Saison</th><th>Club</th><th>Championnat</th><th>Position</th><th>Points</th><th>Matchs</th><th>Victoires</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">Aucune saison terminée n’a encore été archivée.</td></tr>')+'</tbody></table></div><h3 style="margin-top:18px">Saison actuelle · '+esc(S.season)+'</h3><p>'+current.length+' match(s) terminé(s) avec '+esc(S.club)+'.</p></section></main>';
  }

  function richTrophiesMarkup() {
    ensureState();
    const rows = (S.trophies||[]).slice().reverse().map(t=>'<article class="fm26-trophy-card"><div class="fm26-trophy-icon">🏆</div><div><b>'+esc(t.name||t)+'</b><small>'+esc(t.club||S.club)+' · '+esc(t.season||S.season)+'</small></div></article>').join('');
    return '<main class="fm26-pack-page"><div class="page-intro"><div><p class="eyebrow">PALMARÈS DU MANAGER</p><h1>Vitrine des trophées</h1><p>Chaque titre remporté au terme d’une saison est conservé dans cette vitrine.</p></div></div><section class="pn"><div class="fm26-trophy-grid">'+(rows||'<div class="fm26-search-empty">Aucun trophée enregistré pour le moment. Remporte un championnat pour inaugurer ta vitrine.</div>')+'</div></section></main>';
  }

  const oldNewSeason = typeof newSeason === 'function' ? newSeason : null;
  if (oldNewSeason) {
    newSeason = function () { archiveSeason(); return oldNewSeason.apply(this,arguments); };
  }

  const oldManager = V && V.mgr;
  if (V) {
    V.mgr = function () {
      ensureState();
      if (S.fm26Panel === 'history') return richHistoryMarkup();
      if (S.fm26Panel === 'trophies') return richTrophiesMarkup();
      return typeof oldManager === 'function' ? oldManager() : '';
    };
  }

  const oldCont = typeof cont === 'function' ? cont : null;
  if (oldCont) {
    cont = function () {
      ensureState();
      if (S.view === 'press') {
        S.fm26PressComplete = false;
        S.fm26PressStep = 0;
        S.fm26PressAnswers = [];
        S.view = 'home';
        save();
        render();
        return;
      }
      if (S.view === 'home') {
        const count = (S.fx||[]).filter(f=>f.played&&(f.home===S.club||f.away===S.club)).length;
        const last = Number(S.fm26PressLastCount)||0;
        if (count>0 && count%3===0 && count>last) {
          S.fm26PressLastCount=count;
          S.fm26PressStep=0;
          S.fm26PressComplete=false;
          S.fm26PressAnswers=[];
          S.view='press';
          save();
          render();
          return;
        }
      }
      return oldCont.apply(this,arguments);
    };
  }

  function openSearch() {
    ensureState();
    S.fm26SearchMode = true;
    S.fm26SearchQuery = S.fm26SearchQuery || '';
    S.fm26Panel = 'player-search';
    S.view='squad';
    toggleRails(false);
    save();
    render();
  }

  const css = document.createElement('style');
  css.id = 'fm26-enhancements-style';
  css.textContent = [
    'body.fm26-screenpack-active #side{display:flex!important;flex-direction:column!important;justify-content:stretch!important;align-items:stretch!important;gap:4px!important;padding:8px 6px!important;overflow:hidden!important}',
    'body.fm26-screenpack-active #side .fm26-ref-back{position:relative!important;left:auto!important;top:auto!important;flex:0 0 72px!important;width:100%!important;height:72px!important;min-height:72px!important;display:grid!important;place-items:center!important;font-size:45px!important;line-height:1!important;border:0!important;border-bottom:1px solid #ffffff18!important;color:#fff!important;cursor:pointer!important}',
    'body.fm26-screenpack-active #side .fm26-ref-back svg{width:36px!important;height:36px!important;stroke:currentColor!important;stroke-width:2.5!important}',
    'body.fm26-screenpack-active #side .fm26-ref-railbtn{position:relative!important;left:auto!important;top:auto!important;flex:1 1 0!important;min-height:0!important;width:100%!important;height:auto!important;margin:0!important;padding:4px!important;display:grid!important;place-items:center!important;border-radius:10px!important}',
    'body.fm26-screenpack-active #side .fm26-ref-railbtn:after{display:none!important}',
    '.fm26-rail-icon{display:grid;place-items:center;width:100%;height:100%;min-height:34px}',
    '.fm26-rail-icon svg{display:block;width:clamp(25px,2.4vw,42px);height:clamp(25px,2.4vw,42px);fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.fm26-rail-crest{display:grid;place-items:center;width:clamp(36px,3.4vw,52px);height:clamp(36px,3.4vw,52px);overflow:hidden}',
    'body.fm26-screenpack-active #fm26-manager-sidebar{width:clamp(230px,19vw,330px)!important;min-width:230px!important;max-width:330px!important}',
    'body.fm26-screenpack-active #fm26-manager-sidebar .fm26-manager-links{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;display:flex!important;flex-direction:column!important}',
    'body.fm26-screenpack-active #fm26-manager-sidebar .fm26-manager-link{flex:1 1 0!important;min-height:42px!important;max-height:none!important;padding:7px 12px!important;line-height:1.2!important;white-space:normal!important}',
    'body.fm26-inbox-active #app:not(.hid){grid-template-columns:clamp(66px,9vw,186px) minmax(0,1fr)!important}',
    'body.fm26-inbox-active #side{grid-column:1!important;grid-row:1!important}',
    'body.fm26-inbox-active #fm26-manager-sidebar{display:none!important}',
    'body.fm26-inbox-active #main{grid-column:2!important;width:auto!important;min-width:0!important}',
    'body.fm26-inbox-active #vw{width:100%!important;min-width:0!important;flex:1 1 auto!important;overflow:auto!important;background:#101827!important}',
    '.fm26-inbox-page{min-width:0!important;width:100%!important;height:100%!important;min-height:100%!important;box-sizing:border-box!important;color:#f4f7ff!important;background:radial-gradient(ellipse at 65% 12%,#223450 0,#111c2d 56%,#0b1421 100%)!important}',
    '.fm26-inbox-panel{background:linear-gradient(145deg,#182940,#111e30)!important;border:1px solid #3a506e!important;color:#f5f7fc!important}',
    '.fm26-inbox-copy{color:#f4f7ff!important;background:transparent!important;font-size:clamp(16px,1.35vw,24px)!important;line-height:1.55!important}',
    '.fm26-inbox-title{color:#a99cff!important}',
    '.fm26-inbox-assignment h2,.fm26-inbox-assignment strong,.fm26-inbox-detail span,.fm26-inbox-detail b,.fm26-inbox-trait,.fm26-inbox-player-name,.fm26-inbox-player-meta{color:#f3f6fc!important}',
    '.fm26-inbox-assignment .value{color:#9edee7!important}',
    '.fm26-inbox-actions button{color:#fff!important;background:#263d5a!important;border:1px solid #465f80!important;border-radius:9px!important}',
    '.fm26-inbox-actions button.primary{background:linear-gradient(110deg,#735ee0,#287c99)!important;border-color:#a99cff!important}',
    'body.fm26-rails-collapsed.fm26-screenpack-active #app:not(.hid){grid-template-columns:minmax(0,1fr)!important}',
    'body.fm26-rails-collapsed.fm26-screenpack-active #side,body.fm26-rails-collapsed.fm26-screenpack-active #fm26-manager-sidebar{display:none!important}',
    'body.fm26-rails-collapsed.fm26-screenpack-active #main{grid-column:1!important;width:100%!important;min-width:0!important}',
    '#fm26-rails-reopen{display:none;position:fixed;z-index:9999;top:12px;left:12px;width:54px;height:54px;border-radius:12px;border:1px solid #9e92ff;background:linear-gradient(135deg,#8068f5,#287c99);color:#fff;font-size:25px;font-weight:900;box-shadow:0 8px 25px #0007;cursor:pointer}',
    'body.fm26-rails-collapsed.fm26-screenpack-active #fm26-rails-reopen{display:grid;place-items:center}',
    '.fm26-global-search-panel{max-width:none;padding:18px!important}',
    '.fm26-global-search-panel label{display:block;margin:0 0 8px;color:#c0cbe0;font-weight:800}',
    '.fm26-global-search-panel input{width:100%;min-height:48px;padding:12px 14px;background:#0c1728;border:1px solid #425a7a;border-radius:10px;color:#fff;font-size:16px}',
    '.fm26-search-help,.fm26-search-status{margin:10px 0;color:#afbed4;font-size:12px}',
    '.fm26-search-results{display:grid;gap:8px}',
    '.fm26-search-player{display:flex;align-items:center;gap:12px;padding:10px;background:#1b2e47;border:1px solid #3c5575;border-radius:10px;min-width:0}',
    '.fm26-search-player-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:9px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#3a5b7b,#17243a);color:#fff;font-weight:900}',
    '.fm26-search-player-avatar img{width:100%;height:100%;object-fit:cover}',
    '.fm26-search-player-main{display:grid;gap:3px;min-width:0;flex:1}',
    '.fm26-search-player-main b{color:#fff;font-size:14px}.fm26-search-player-main span{color:#d6e2f3}.fm26-search-player-main small{color:#a9b9cf}',
    '.fm26-search-player .chip{white-space:nowrap}',
    '.fm26-search-empty{padding:22px;border:1px dashed #526b8b;border-radius:10px;color:#b8c6d9;text-align:center}',
    '.fm26-press-page{display:grid;place-items:center;background:radial-gradient(ellipse at 50% 0%,#274a69,#0c1422 65%)!important}',
    '.fm26-press-studio{width:min(980px,100%);padding:clamp(18px,3vw,38px);background:linear-gradient(145deg,#192b43,#111b2b);border:1px solid #516785;border-radius:18px;box-shadow:0 24px 70px #0007}',
    '.fm26-press-kicker{color:#a99aff;font-weight:900;letter-spacing:.18em;font-size:11px}',
    '.fm26-press-studio h1{font-size:clamp(28px,3.2vw,46px);margin:8px 0;color:#fff}',
    '.fm26-press-sub{color:#b8c7dc;margin:0 0 20px}',
    '.fm26-press-journalists{display:flex;align-items:center;gap:13px;padding:14px;background:#0d192a;border:1px solid #344a65;border-radius:12px;margin-bottom:18px}',
    '.fm26-press-avatar{width:64px;height:64px;display:grid;place-items:center;background:linear-gradient(145deg,#5b6b87,#23334b);border-radius:12px;font-size:10px;font-weight:900;color:#fff}',
    '.fm26-press-journalists b,.fm26-press-journalists small{display:block}.fm26-press-journalists small{color:#aebbd0;margin-top:5px}',
    '.fm26-press-question{padding:17px;background:#202e45;border-radius:12px;border:1px solid #405777}',
    '.fm26-press-question>span{color:#a99aff;font-size:11px;font-weight:900;letter-spacing:.14em}.fm26-press-question h2{color:#fff;font-size:22px;margin:10px 0 15px}',
    '.fm26-press-answer{width:100%;display:flex;justify-content:space-between;gap:12px;align-items:center;text-align:left;margin:7px 0;padding:13px 15px;border-radius:10px;border:1px solid #516b8e;background:#172840;color:#eef4ff;cursor:pointer}',
    '.fm26-press-answer:hover{background:#273d5d;border-color:#9e92ff}.fm26-press-answer b{font-size:10px;color:#a99aff;white-space:nowrap}',
    '.fm26-press-finish{padding:14px;background:#183b42;border-radius:9px;color:#baf1df}',
    '.fm26-press-note{color:#aebbd0;font-size:12px;margin:14px 0 0}',
    '.fm26-trophy-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}',
    '.fm26-trophy-card{display:flex;align-items:center;gap:14px;padding:16px;background:linear-gradient(145deg,#293b55,#18283e);border:1px solid #7b6e4a;border-radius:12px;color:#fff}',
    '.fm26-trophy-icon{font-size:34px}.fm26-trophy-card small{display:block;color:#c3cfe0;margin-top:4px}',
    '.fm26-pack-stars{font-size:clamp(20px,2.2vw,34px);letter-spacing:-3px;color:#e6b84c!important;text-shadow:0 2px 8px #0005;margin:7px 0 15px}',
    '.fm26-lineup-field{background:repeating-linear-gradient(90deg,#2d8b4e 0 8.33%,#267b43 8.33% 16.66%)!important;box-shadow:0 12px 34px #0008,inset 0 0 50px #102f1b!important}',
    '.fm26-lineup-field:before,.fm26-lineup-field:after,.fm26-lineup-circle,.fm26-lineup-box{border-color:#eaffec!important}',
    '.fm26-lineup-player .photo{width:clamp(38px,3.5vw,52px)!important;height:clamp(30px,2.8vw,40px)!important;border-radius:7px!important;background:linear-gradient(145deg,#e5efff,#7da3c9)!important;color:#10253b!important;border:2px solid #f5f8ff!important}',
    '.fm26-lineup-player .photo img{display:none!important}',
    '.fm26-lineup-player b{background:#0e1c2c!important;border:1px solid #ffffff50!important;padding:2px 6px!important}',
    '@media(max-width:760px){.fm26-search-player{align-items:flex-start;flex-wrap:wrap}.fm26-search-player .chip{margin-left:60px}.fm26-inbox-content{grid-template-columns:minmax(0,1fr)!important}.fm26-press-studio{padding:14px}}'
  ].join('\n');
  document.head.appendChild(css);

  function refresh() {
    ensureReopenButton();
    paintStars();
  }

  function findCurrentQuery() {
    const input = $('fm26-world-player-search');
    if (!input) return;
    ensureState();
    S.fm26SearchQuery = input.value;
    const box = $('fm26-search-results');
    const status = $('fm26-search-status');
    const rows = matchingPlayers(input.value);
    if (box) box.innerHTML = playerRows(rows);
    if (status) status.textContent = rows.length+' résultat(s) dans les effectifs intégrés';
    if (searchTimer) clearTimeout(searchTimer);
    if (searchAbort) try { searchAbort.abort(); } catch (_) {}
    if (input.value.trim().length >= 3) searchTimer = setTimeout(() => remoteSearch(input.value.trim()),500);
  }

  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'fm26-world-player-search') findCurrentQuery();
  }, true);

  document.addEventListener('click', e => {
    const add = e.target.closest('[data-fm26-add-player]');
    if (add) {
      ensureState();
      const player = {name:add.dataset.playerName,club:add.dataset.playerClub,pos:add.dataset.playerPos,age:add.dataset.playerAge,level:add.dataset.playerLevel};
      if (!S.playerSearchSelection.some(p => norm(p.name) === norm(player.name))) S.playerSearchSelection.push(player);
      save(); notify(player.name+' ajouté à ta sélection.'); return;
    }
    const remove = e.target.closest('[data-fm26-remove-player]');
    if (remove) {
      S.playerSearchSelection.splice(Number(remove.dataset.fm26RemovePlayer),1); save(); render(); return;
    }
    const search = e.target.closest('[data-fm26-open-search]');
    if (search) { e.preventDefault(); e.stopImmediatePropagation(); openSearch(); return; }
    const press = e.target.closest('[data-fm26-press-answer]');
    if (press) {
      ensureState();
      const answer=press.dataset.fm26PressAnswer;
      S.fm26PressAnswers.push(answer);
      if (S.fm26PressStep===0) {
        if (answer==='positive') { S.mor=clamp(S.mor+2,0,100); S.fans=clamp(S.fans+1,0,100); }
        if (answer==='balanced') S.board=clamp(S.board+1,0,100);
        if (answer==='responsible') { S.board=clamp(S.board+2,0,100); S.mor=clamp(S.mor-1,0,100); }
        S.fm26PressStep=1;
      } else {
        if (answer==='ambitious') { S.fans=clamp(S.fans+2,0,100); S.board=clamp(S.board+1,0,100); }
        if (answer==='measured') S.board=clamp(S.board+1,0,100); 
        if (answer==='calm') S.mor=clamp(S.mor+1,0,100);
        S.fm26PressComplete=true;
      }
      save(); render(); return;
    }
    const item=e.target.closest('[data-pack-view][data-pack-label]');
    if (item) {
      const label=item.dataset.packLabel;
      const section=window.FM26ScreenPack&&window.FM26ScreenPack.section;
      const map={'Recherche de joueur':'player-search','Rech. de joueur':'player-search','Résultats recrut.':'scout-results','Résultats du recrutement':'scout-results','Sélection':'shortlist','Paramètres':'options','Réglages':'options','Options':'options','Confiance':'confidence','Profil entraîneur':'profile','Historiq. entraîneur':'history','Vitrine des trophées':'trophies','Vacances':'holiday','Prendre sa retraite':'retire','Requête dirig.':'requests','État de la partie':'state','Emplois':'jobs','Emplois et offres reçues':'jobs','Recherche de staff':'staff','Joueurs recommandés':'recommended','Missions de recrutement':'scouting','Contrats des joueurs':'contracts','Agence d’obs.':'scouting','Transferts':'transfers'};
      if (section==='search' && label==='Recherche de joueur' || label==='Rech. de joueur') { e.preventDefault(); e.stopImmediatePropagation(); openSearch(); return; }
      if (map[label]) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (map[label]==='player-search') { openSearch(); return; }
        if (map[label]==='retire') { if (window.FM26CareerActions&&typeof FM26CareerActions.retire==='function') FM26CareerActions.retire(); else { S.fm26Panel='options'; S.view='mgr'; render(); } return; }
        if (map[label]==='transfers') S.fm26Transfers=true;
        else if (map[label]==='scout-results') { S.fm26SearchMode=false; S.fm26Panel='scout-results'; S.view='squad'; }
        else if (map[label]==='shortlist') { S.fm26SearchMode=false; S.fm26Panel='shortlist'; S.view='squad'; }
        else { S.fm26SearchMode=false; S.fm26Panel=map[label]; S.view=map[label]==='jobs'?'jobs':map[label]==='transfers'?'fin':'mgr'; }
        save(); render(); return;
      }
    }
    const sectionBtn=e.target.closest('[data-pack-section]');
    if (sectionBtn) {
      const key=sectionBtn.dataset.packSection;
      if (key==='search') { e.preventDefault(); e.stopImmediatePropagation(); openSearch(); return; }
      if (key==='world') { e.preventDefault(); e.stopImmediatePropagation(); S.fm26World=true; S.fm26Country=''; S.view='comp'; save(); render(); return; }
      if (key==='coach') { e.preventDefault(); e.stopImmediatePropagation(); S.fm26Panel='confidence'; S.fm26SearchMode=false; S.view='mgr'; save(); render(); return; }
      if (key==='opt') { e.preventDefault(); e.stopImmediatePropagation(); S.fm26Panel='options'; S.fm26SearchMode=false; S.view='mgr'; save(); render(); return; }
    }
  }, true);

  document.addEventListener('click', e => {
    const country=e.target.closest('[data-fix-country]');
    if (country) {
      e.preventDefault(); e.stopImmediatePropagation(); S.fm26Country=country.dataset.fixCountry; S.fm26World=true; S.view='comp'; save(); render(); return;
    }
  }, true);

  const previousRender = render;
  render = function () {
    const output = previousRender.apply(this,arguments);
    try {
      if (S && S.view==='mgr') {
        const heading=$('#hd h2');
        if (heading && S.fm26Panel==='history') heading.textContent='Historique entraîneur';
        if (heading && S.fm26Panel==='trophies') heading.textContent='Vitrine des trophées';
      }
      if (S && S.view==='press') { const heading=$('#hd h2'); if (heading) heading.textContent='Conférence de presse'; }
      if (S && S.view==='squad' && S.fm26SearchMode) { const heading=$('#hd h2'); if (heading) heading.textContent='Recherche mondiale de joueurs'; }
      refresh();
    } catch (error) { console.warn('[FM26] Enhancements:',error); }
    return output;
  };

  window.FM26Enhancements = {
    version:'2.0.0',toggleRails,playerSearchMarkup,scoutingResultsMarkup,shortlistMarkup,pressMarkup,richHistoryMarkup,richTrophiesMarkup,refresh
  };

  if (S) ensureState();
  refresh();
})();