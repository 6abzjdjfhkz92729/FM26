/* FM26 — composition d'équipe par glisser-déposer, branchée sur la carrière active. */
(function () {
  'use strict';

  const css = [
    '.fm26-dnd-root{position:relative;width:1792px;height:833px;overflow:hidden;color:#f5f5f8;font-family:Barlow Condensed,Arial,sans-serif}',
    '.fm26-dnd-panel{position:absolute;top:25px;height:782px;box-sizing:border-box;background:linear-gradient(155deg,rgba(66,68,76,.88),rgba(35,37,45,.94));border:1px solid #555761;box-shadow:0 15px 38px #0005,inset 0 1px 0 #ffffff10;overflow:hidden;animation:fm26DndEnter .25s ease-out}',
    '@keyframes fm26DndEnter{from{opacity:.55;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}',
    '.fm26-dnd-panel-head{height:57px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:linear-gradient(180deg,#777980,#595b62);font-size:26px;font-weight:800;letter-spacing:.025em;box-sizing:border-box}',
    '.fm26-dnd-panel-head small{font-size:16px;color:#e0e0e7;font-weight:500;letter-spacing:0}',
    '.fm26-dnd-roster-tools{display:flex;align-items:center;gap:6px;padding:9px 12px;background:#2c2e36;border-bottom:1px solid #484a54}',
    '.fm26-dnd-filter{border:1px solid #555865;background:#373943;color:#e7e7ed;padding:5px 10px;font:600 15px Barlow Condensed,Arial,sans-serif;cursor:pointer}',
    '.fm26-dnd-filter.active{background:#a04be8;border-color:#d0a0ff;color:#fff}',
    '.fm26-dnd-hint{padding:8px 12px 9px;font-size:16px;color:#d1d2da;background:#252730;border-bottom:1px solid #41434c}',
    '.fm26-dnd-roster{position:absolute;top:139px;bottom:0;left:0;right:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#777 #292b32}',
    '.fm26-dnd-roster-row{display:grid;grid-template-columns:43px minmax(0,1fr) 50px;gap:9px;align-items:center;min-height:62px;padding:7px 12px;border-bottom:1px solid #ffffff12;background:linear-gradient(90deg,#30323a,#292b32);cursor:grab;box-sizing:border-box;transition:background .13s,border-color .13s,transform .13s}',
    '.fm26-dnd-roster-row:nth-child(even){background:linear-gradient(90deg,#2b2d35,#25272e)}',
    '.fm26-dnd-roster-row:hover{background:#3b3d48}',
    '.fm26-dnd-roster-row:active{cursor:grabbing}',
    '.fm26-dnd-roster-row.in-lineup{box-shadow:inset 3px 0 0 #79bd82}',
    '.fm26-dnd-roster-row.selected{background:#563a76;box-shadow:inset 0 0 0 2px #b68aff}',
    '.fm26-dnd-roster-row.unavailable{opacity:.55;cursor:not-allowed}',
    '.fm26-dnd-number{display:grid;place-items:center;width:38px;height:38px;border-radius:3px;background:#41444e;border:1px solid #6d707d;font-size:20px;font-weight:800;color:#fff}',
    '.fm26-dnd-player-name{font-size:21px;font-weight:800;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;line-height:1.05}',
    '.fm26-dnd-player-meta{margin-top:4px;font-size:15px;color:#c5c7d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fm26-dnd-player-state{font-size:13px;font-weight:800;text-align:right;color:#9fdfa5}',
    '.fm26-dnd-player-state.bench{color:#d8d9e0}.fm26-dnd-player-state.unavailable-text{color:#ff9da6}',
    '.fm26-dnd-count{font-size:14px;color:#d8d9e0;padding:8px 12px;background:#1e2027;border-top:1px solid #484a54}',
    '.fm26-dnd-controls{position:absolute;left:0;right:0;top:57px;height:49px;display:flex;align-items:center;gap:7px;padding:0 13px;background:#2a2c34;border-bottom:1px solid #4e5059;box-sizing:border-box}',
    '.fm26-dnd-chip{border:1px solid #535662;background:#393b45;color:#eee;padding:6px 12px;font:700 16px Barlow Condensed,Arial,sans-serif;cursor:pointer;border-radius:2px}',
    '.fm26-dnd-chip:hover{filter:brightness(1.15)}.fm26-dnd-chip.active{background:linear-gradient(100deg,#ff3d86,#a744e8);border-color:#ed9bff}',
    '.fm26-dnd-status{margin-left:auto;font-size:16px;color:#d4d5dd;white-space:nowrap}',
    '.fm26-dnd-tactical-layout{position:absolute;left:0;right:0;top:106px;bottom:0;display:grid;grid-template-columns:570px minmax(0,1fr);gap:13px;padding:14px;box-sizing:border-box}',
    '.fm26-dnd-pitch{position:relative;height:100%;min-height:0;overflow:hidden;border:2px solid #d7efd066;box-shadow:inset 0 0 75px #0004,0 8px 22px #0005;background:repeating-linear-gradient(90deg,#29723d 0 7.14%,#2d7d43 7.14% 14.28%)}',
    '.fm26-dnd-pitch:before{content:"";position:absolute;inset:3%;border:2px solid #d9f0dc99;pointer-events:none}',
    '.fm26-dnd-pitch:after{content:"";position:absolute;left:3%;right:3%;top:50%;border-top:2px solid #d9f0dc99;pointer-events:none}',
    '.fm26-dnd-center-circle{position:absolute;left:50%;top:50%;width:21%;aspect-ratio:1;border:2px solid #d9f0dc99;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}',
    '.fm26-dnd-center-spot{position:absolute;left:50%;top:50%;width:7px;height:7px;background:#e2f4e4;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}',
    '.fm26-dnd-box{position:absolute;left:23%;width:54%;height:13%;border:2px solid #d9f0dc99;pointer-events:none}',
    '.fm26-dnd-box.top{top:3%;border-top:0}.fm26-dnd-box.bottom{bottom:3%;border-bottom:0}',
    '.fm26-dnd-six{position:absolute;left:37%;width:26%;height:5%;border:2px solid #d9f0dc99;pointer-events:none}',
    '.fm26-dnd-six.top{top:3%;border-top:0}.fm26-dnd-six.bottom{bottom:3%;border-bottom:0}',
    '.fm26-dnd-marker{position:absolute;transform:translate(-50%,-50%);z-index:4;width:86px;min-height:66px;padding:2px;border:0;background:transparent;color:#fff;font-family:inherit;text-align:center;cursor:grab;touch-action:manipulation}',
    '.fm26-dnd-marker .shirt{position:relative;margin:0 auto 3px;width:39px;height:35px;display:grid;place-items:center;border:2px solid #e4efff;border-radius:9px 9px 5px 5px;background:var(--club-color,#3379bb);box-shadow:0 3px 8px #0008;font-size:18px;font-weight:900;text-shadow:0 1px 2px #000}',
    '.fm26-dnd-marker .shirt:before{content:"";position:absolute;left:-6px;top:2px;width:10px;height:15px;background:inherit;border:1px solid #d5e9ff;border-radius:3px;transform:rotate(22deg);z-index:-1}',
    '.fm26-dnd-marker .marker-role{display:block;margin:0 auto 2px;width:max-content;max-width:82px;border:1px solid #f5f5f6ad;border-radius:2px;background:#1e2320e8;padding:1px 4px;font-size:12px;font-weight:900;line-height:1.1}',
    '.fm26-dnd-marker .marker-name{display:block;max-width:86px;margin:0 auto;padding:1px 3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-radius:2px;background:#10120fe8;font-size:14px;font-weight:800;line-height:1.12}',
    '.fm26-dnd-marker:hover{z-index:8;filter:brightness(1.15);scale:1.07}',
    '.fm26-dnd-marker.selected{z-index:9;filter:drop-shadow(0 0 7px #f0c5ff);scale:1.12}',
    '.fm26-dnd-marker.drop-target{z-index:10;outline:2px dashed #fff;outline-offset:3px;border-radius:8px;background:#b88aff65}',
    '.fm26-dnd-marker:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    '.fm26-dnd-marker.unavailable .shirt{background:#70545a!important;filter:grayscale(.6)}',
    '.fm26-dnd-side{min-width:0;display:flex;flex-direction:column;gap:12px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#777 #292b32}',
    '.fm26-dnd-box-panel{background:linear-gradient(160deg,#33353f,#292b33);border:1px solid #4e505b;box-shadow:0 8px 23px #0003}',
    '.fm26-dnd-box-title{padding:10px 13px;background:#50525b;font-size:20px;font-weight:800;letter-spacing:.035em}',
    '.fm26-dnd-box-content{padding:12px 13px}',
    '.fm26-dnd-formation-list{display:flex;flex-wrap:wrap;gap:6px}',
    '.fm26-dnd-statline{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid #ffffff12;font-size:17px}',
    '.fm26-dnd-statline span{color:#d1d2dc}.fm26-dnd-statline b{font-size:18px}',
    '.fm26-dnd-instructions{display:grid;grid-template-columns:minmax(105px,160px) minmax(80px,1fr) 38px;align-items:center;gap:8px;margin:9px 0;font-size:16px}',
    '.fm26-dnd-instructions label{color:#dedfe5;font-size:15px;letter-spacing:0;text-transform:none;font-weight:600;margin:0}',
    '.fm26-dnd-instructions input{margin:0;width:100%;accent-color:#c17aff}',
    '.fm26-dnd-tips{font-size:15px;color:#d4d5dd;line-height:1.35}',
    '.fm26-dnd-swatches{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}',
    '.fm26-dnd-swatches i{width:12px;height:12px;display:inline-block;border-radius:50%;margin-right:4px}',
    '.fm26-dnd-bottom{padding:10px 13px;background:#272931;border-top:1px solid #444650;font-size:14px;color:#d4d5dd}',
    '@media(prefers-reduced-motion:reduce){.fm26-dnd-panel,.fm26-dnd-marker,.fm26-dnd-roster-row{animation:none;transition:none}}'
  ].join('\n');
  if (!document.getElementById('fm26-dnd-style')) {
    const st = document.createElement('style'); st.id = 'fm26-dnd-style'; st.textContent = css; document.head.appendChild(st);
  }

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pickedPlayer = null;
  let rosterFilter = 'all';
  let draggedPlayer = null;

  const isUnavailable = p => !p || Number(p.inj || p.injuryWeeks || 0) > 0 || Number(p.susp || p.suspensionWeeks || 0) > 0 || p.injured === true || (typeof p.injury === 'string' && p.injury.length > 0);
  const posRole = pos => ({GK:'Gardien',DR:'Latéral droit',DL:'Latéral gauche',DC:'Défenseur central',DM:'Milieu défensif',MC:'Milieu central',AMC:'Milieu offensif',AMR:'Ailier droit',AML:'Ailier gauche',ST:'Avant-centre'})[pos] || pos || 'Polyvalent';
  const moraleOf = p => Number(p.morale != null ? p.morale : p.mrl != null ? p.mrl : 70);
  const ovrOf = p => Number(p.ovr) || 0;
  const clubColor = () => {
    const h = (typeof hash === 'function' ? hash(S.club) : 210) % 360;
    return 'hsl(' + h + ' 62% 40%)';
  };
  const currentXI = () => {
    const slots = (typeof xi === 'function' ? xi() : []).slice(0,11);
    while (slots.length < 11) slots.push((S.sq || []).find(p => !slots.some(q => q && q.id === p.id)));
    return slots;
  };

  function applyPlayerToSlot(playerId, slot) {
    const ids = currentXI().map(p => p ? Number(p.id) : NaN);
    const player = (S.sq || []).find(p => Number(p.id) === Number(playerId));
    if (!player || slot < 0 || slot > 10 || !Number.isInteger(slot)) return;
    if (isUnavailable(player)) {
      if (typeof toast === 'function') toast(player.name + ' est indisponible.');
      pickedPlayer = null;
      render();
      return;
    }
    const oldIndex = ids.indexOf(Number(playerId));
    if (oldIndex === slot) {
      pickedPlayer = null;
      render();
      return;
    }
    if (oldIndex >= 0) {
      const oldTarget = ids[slot];
      ids[slot] = Number(playerId);
      ids[oldIndex] = oldTarget;
    } else {
      ids[slot] = Number(playerId);
    }
    if (ids.some(id => !Number.isFinite(id)) || new Set(ids).size !== 11) {
      if (typeof toast === 'function') toast('La composition doit contenir 11 joueurs différents.');
      return;
    }
    S.lineup = ids;
    S.lineupUpdatedAt = new Date().toISOString();
    if (typeof sv === 'function') sv();
    pickedPlayer = null;
    draggedPlayer = null;
    render();
  }

  function choosePlayer(playerId) {
    const p = (S.sq || []).find(x => Number(x.id) === Number(playerId));
    if (!p || isUnavailable(p)) {
      if (typeof toast === 'function') toast((p ? p.name : 'Ce joueur') + ' est indisponible.');
      return;
    }
    pickedPlayer = Number(playerId);
    render();
  }

  function changeFormation(form) {
    if (!FM[form]) return;
    S.tc = S.tc || {};
    S.tc.f = form;
    pickedPlayer = null;
    if (typeof sv === 'function') sv();
    render();
  }

  function changeMentality(value) {
    if (!MEN[value]) return;
    S.tc = S.tc || {};
    S.tc.m = value;
    if (typeof sv === 'function') sv();
    render();
  }

  function changeStyle(value) {
    if (typeof STY === 'object' && STY && !Object.prototype.hasOwnProperty.call(STY,value)) return;
    S.tc = S.tc || {};
    S.tc.s = value;
    if (typeof sv === 'function') sv();
    render();
  }

  V.tactics = function () {
    S.tc = S.tc || {};
    const club = escapeHtml(S.club || 'Mon club');
    const form = FM[S.tc.f] ? S.tc.f : '4-3-3';
    const formation = FM[form] || FM['4-3-3'];
    const lineup = currentXI();
    const starters = new Set(lineup.filter(Boolean).map(p => Number(p.id)));
    const squad = (S.sq || []).slice().sort((a,b) => Number(b.ovr||0) - Number(a.ovr||0));
    const visibleSquad = squad.filter(p => {
      if (rosterFilter === 'starters') return starters.has(Number(p.id));
      if (rosterFilter === 'bench') return !starters.has(Number(p.id));
      return true;
    });
    const formationButtons = Object.keys(FM).map(f => '<button type="button" class="fm26-dnd-chip' + (f === form ? ' active' : '') + '" data-fm26formation="' + escapeHtml(f) + '">' + escapeHtml(f) + '</button>').join('');
    const mentalities = [['Cautious','Prudente'],['Balanced','Équilibrée'],['Positive','Positive'],['Attacking','Offensive']].map(([v,label]) => '<button type="button" class="fm26-dnd-chip' + ((S.tc.m || 'Balanced') === v ? ' active' : '') + '" data-fm26mentality="' + v + '">' + label + '</button>').join('');
    const styles = typeof STY === 'object' && STY ? Object.keys(STY) : [];
    const chosenStyle = S.tc.s || 'Control Possession';
    const styleButtons = styles.slice(0,6).map(v => '<button type="button" class="fm26-dnd-chip' + (chosenStyle === v ? ' active' : '') + '" data-fm26style="' + escapeHtml(v) + '">' + escapeHtml(({ 'Control Possession':'Possession', 'Gegenpress':'Contre-pressing', 'Wing Play':'Jeu sur les ailes', 'Tiki-Taka':'Tiki-taka', 'Direct Counter-Attack':'Contres directs', 'Route One':'Jeu direct' })[v] || v) + '</button>').join('');
    const eligibleCount = squad.filter(p => !isUnavailable(p)).length;
    const rosterRows = visibleSquad.map(p => {
      const onPitch = starters.has(Number(p.id));
      const unavailable = isUnavailable(p);
      const selected = Number(pickedPlayer) === Number(p.id);
      const state = unavailable ? (p.susp || p.suspensionWeeks ? 'Suspendu' : 'Blessé') : onPitch ? 'TITULAIRE' : 'REMPLAÇANT';
      return '<button type="button" draggable="' + (!unavailable) + '" data-fm26player="' + Number(p.id) + '" class="fm26-dnd-roster-row' + (onPitch ? ' in-lineup' : '') + (selected ? ' selected' : '') + (unavailable ? ' unavailable' : '') + '" aria-grabbed="' + selected + '">' +
        '<span class="fm26-dnd-number">' + escapeHtml(p.no != null ? p.no : '•') + '</span>' +
        '<span style="min-width:0"><span class="fm26-dnd-player-name">' + escapeHtml(p.name) + '</span><span class="fm26-dnd-player-meta">' + escapeHtml(p.pos || 'POLY') + ' · ' + escapeHtml(posRole(p.pos)) + ' · GEN ' + ovrOf(p) + ' · Cond. ' + Math.round(Number(p.cond)||0) + '%</span></span>' +
        '<span class="fm26-dnd-player-state' + (!onPitch ? ' bench' : '') + (unavailable ? ' unavailable-text' : '') + '">' + state + '</span></button>';
    }).join('');
    const markers = formation.map((s,i) => {
      const p = lineup[i];
      if (!p) return '';
      const selected = Number(pickedPlayer) === Number(p.id);
      const unavailable = isUnavailable(p);
      const color = clubColor();
      const shortName = String(p.name || '').split(/\s+/).slice(-1)[0];
      return '<button type="button" draggable="' + (!unavailable) + '" data-fm26player="' + Number(p.id) + '" data-fm26slot="' + i + '" class="fm26-dnd-marker' + (selected ? ' selected' : '') + (unavailable ? ' unavailable' : '') + '" style="left:' + Number(s[0]) + '%;top:' + Number(s[1]) + '%;--club-color:' + color + '" aria-label="Poste ' + escapeHtml(s[2]) + ', ' + escapeHtml(p.name) + '" title="' + escapeHtml(p.name + ' — ' + s[2] + ' — note ' + p.ovr) + '">' +
        '<span class="shirt">' + escapeHtml(p.no != null ? p.no : i+1) + '</span><span class="marker-role">' + escapeHtml(s[2]) + '</span><span class="marker-name">' + escapeHtml(shortName) + '</span></button>';
    }).join('');
    const bestXI = lineup.reduce((sum,p)=>sum+ovrOf(p),0);
    const averageCondition = lineup.length ? Math.round(lineup.reduce((sum,p)=>sum+(Number(p && p.cond)||0),0)/lineup.length) : 0;
    const instructions = [['press','Intensité du pressing'],['line','Hauteur de la ligne'],['tempo','Rythme de jeu'],['width','Largeur offensive']];
    const instructionHTML = instructions.map(([k,label]) => {
      const value = Number(S.tc[k] == null ? 50 : S.tc[k]);
      return '<div class="fm26-dnd-instructions"><label for="fm26-'+k+'">' + label + '</label><input id="fm26-'+k+'" type="range" min="0" max="100" step="5" value="' + value + '" data-fm26instruction="' + k + '"><b id="fm26-'+k+'-value">' + value + '%</b></div>';
    }).join('');
    const help = pickedPlayer != null
      ? 'Sélection : ' + escapeHtml(((S.sq||[]).find(p=>Number(p.id)===Number(pickedPlayer))||{}).name || 'joueur') + '. Clique sur un poste pour remplacer ou échanger.'
      : 'Fais glisser un joueur sur un emplacement du terrain. Tu peux aussi cliquer sur un joueur puis sur un poste.';
    return '<div class="fm26-dnd-root">' +
      '<section class="fm26-dnd-panel" style="left:22px;width:535px">' +
        '<div class="fm26-dnd-panel-head"><span>EFFECTIF</span><small>' + squad.length + ' joueurs · ' + eligibleCount + ' disponibles</small></div>' +
        '<div class="fm26-dnd-roster-tools">' +
          '<button type="button" class="fm26-dnd-filter' + (rosterFilter==='all'?' active':'') + '" data-fm26filter="all">Tous</button>' +
          '<button type="button" class="fm26-dnd-filter' + (rosterFilter==='starters'?' active':'') + '" data-fm26filter="starters">Onze</button>' +
          '<button type="button" class="fm26-dnd-filter' + (rosterFilter==='bench'?' active':'') + '" data-fm26filter="bench">Banc</button>' +
        '</div>' +
        '<div class="fm26-dnd-hint">' + help + '</div>' +
        '<div class="fm26-dnd-roster">' + (rosterRows || '<div class="fm26-dnd-count">Aucun joueur dans cette sélection.</div>') + '</div>' +
        '<div class="fm26-dnd-count">Composition enregistrée automatiquement · ' + lineup.filter(Boolean).length + '/11 titulaires</div>' +
      '</section>' +
      '<section class="fm26-dnd-panel" style="left:570px;width:1202px">' +
        '<div class="fm26-dnd-panel-head"><span>TACTIQUE · ' + club + '</span><small>Glisser-déposer actif</small></div>' +
        '<div class="fm26-dnd-controls"><span style="font-size:16px;color:#ddd;font-weight:800">FORMATION</span>' + formationButtons + '<span class="fm26-dnd-status">' + escapeHtml(S.tc.m || 'Balanced') + '</span></div>' +
        '<div class="fm26-dnd-tactical-layout">' +
          '<div class="fm26-dnd-pitch" aria-label="Terrain tactique : dépose un joueur sur le poste à modifier">' +
            '<div class="fm26-dnd-box top"></div><div class="fm26-dnd-six top"></div><div class="fm26-dnd-center-circle"></div><div class="fm26-dnd-center-spot"></div><div class="fm26-dnd-box bottom"></div><div class="fm26-dnd-six bottom"></div>' +
            markers +
          '</div>' +
          '<div class="fm26-dnd-side">' +
            '<div class="fm26-dnd-box-panel"><div class="fm26-dnd-box-title">CONSIGNES D’ÉQUIPE</div><div class="fm26-dnd-box-content">' +
              '<div class="fm26-dnd-statline"><span>Force du onze</span><b>' + Math.round(bestXI/11) + '/100</b></div>' +
              '<div class="fm26-dnd-statline"><span>Condition moyenne</span><b>' + averageCondition + '%</b></div>' +
              '<div class="fm26-dnd-statline"><span>Effectif disponible</span><b>' + eligibleCount + '</b></div>' +
              '<div style="font-size:16px;font-weight:800;margin-top:12px;margin-bottom:7px">Mentalité</div><div class="fm26-dnd-formation-list">' + mentalities + '</div>' +
              '<div style="font-size:16px;font-weight:800;margin-top:14px;margin-bottom:7px">Style de jeu</div><div class="fm26-dnd-formation-list">' + styleButtons + '</div>' +
            '</div></div>' +
            '<div class="fm26-dnd-box-panel"><div class="fm26-dnd-box-title">RÉGLAGES TACTIQUES</div><div class="fm26-dnd-box-content">' + instructionHTML + '</div></div>' +
            '<div class="fm26-dnd-box-panel"><div class="fm26-dnd-box-title">REMPLACEMENTS</div><div class="fm26-dnd-box-content"><p class="fm26-dnd-tips">Dépose un remplaçant sur un titulaire pour le faire entrer. Déplace un titulaire sur un autre titulaire pour échanger leurs postes. Les changements sont sauvegardés dans cette carrière et utilisés par le moteur de match.</p><div class="fm26-dnd-swatches"><span><i style="background:#79bd82"></i> Titulaire</span><span><i style="background:#d8d9e0"></i> Remplaçant</span><span><i style="background:#ff9da6"></i> Indisponible</span></div></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="fm26-dnd-bottom">Composition : ' + formation + ' · Les remplacements et les échanges sont sauvegardés automatiquement.</div>' +
      '</section>' +
    '</div>';
  };

  function wireTactics() {
    if (!S || S.view !== 'tactics') return;
    const root = document.querySelector('.fm26-dnd-root');
    if (!root) return;
    root.querySelectorAll('[data-fm26filter]').forEach(el => el.addEventListener('click', () => {
      rosterFilter = el.dataset.fm26filter;
      render();
    }));
    root.querySelectorAll('[data-fm26formation]').forEach(el => el.addEventListener('click', () => changeFormation(el.dataset.fm26formation)));
    root.querySelectorAll('[data-fm26mentality]').forEach(el => el.addEventListener('click', () => changeMentality(el.dataset.fm26mentality)));
    root.querySelectorAll('[data-fm26style]').forEach(el => el.addEventListener('click', () => changeStyle(el.dataset.fm26style)));
    root.querySelectorAll('[data-fm26instruction]').forEach(el => el.addEventListener('input', e => {
      const k = e.currentTarget.dataset.fm26instruction;
      const value = Number(e.currentTarget.value);
      if (typeof FM26A === 'object' && FM26A && typeof FM26A.instruction === 'function') FM26A.instruction(k, value);
      else { S.tc[k] = value; if (typeof sv === 'function') sv(); }
      const v = root.querySelector('#fm26-' + k + '-value');
      if (v) v.textContent = value + '%';
    }));
    root.querySelectorAll('[data-fm26player]').forEach(el => {
      el.addEventListener('dragstart', e => {
        const id = Number(el.dataset.fm26player);
        draggedPlayer = id;
        pickedPlayer = id;
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', String(id));
          e.dataTransfer.effectAllowed = 'move';
        }
        el.classList.add('selected');
      });
      el.addEventListener('dragend', () => { draggedPlayer = null; render(); });
      el.addEventListener('click', e => {
        if (e.detail === 0 && draggedPlayer != null) return;
        e.preventDefault();
        const id = Number(el.dataset.fm26player);
        const slot = el.dataset.fm26slot;
        if (slot != null && pickedPlayer != null) {
          applyPlayerToSlot(Number(pickedPlayer), Number(slot));
        } else if (pickedPlayer != null && Number(pickedPlayer) === id) {
          pickedPlayer = null;
          render();
        } else {
          choosePlayer(id);
        }
      });
      if (el.dataset.fm26slot != null) {
        el.addEventListener('dragover', e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; el.classList.add('drop-target'); });
        el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
        el.addEventListener('drop', e => {
          e.preventDefault();
          el.classList.remove('drop-target');
          const id = Number(e.dataTransfer && e.dataTransfer.getData('text/plain') || draggedPlayer || pickedPlayer);
          applyPlayerToSlot(id, Number(el.dataset.fm26slot));
        });
      }
    });
  }

  const previousRender = render;
  render = function () {
    previousRender();
    wireTactics();
  };
})();