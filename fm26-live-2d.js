/* FM26 Live 2D — adapted from the user-supplied Claude engine draft.
   Uses the existing FM26 career schema and keeps the classic match engine as fallback. */
(function () {
  'use strict';

  const freshPhysicsStats = () => newStats();
  const FM26_PHYSICS_SOURCE = true;

  // --- Engine source begins ---

(function () {
  'use strict';
  if (window.FM26Live2D) return;

  const esc2d = value => String(value == null ? '' : value).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp2d = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const nowMs = () => (window.performance && performance.now ? performance.now() : Date.now());

  // Existing FM26 formations are [x, y, position]. Claude's engine expects
  // [position, x, y], so the adapter changes only this representation.
  const FORM = Object.fromEntries(Object.entries(FM).map(([name, slots]) =>
    [name, slots.map(slot => [slot[2], slot[0], slot[1]])]
  ));

  function posInfo(position) {
    const line = ({GK:0,DR:1,DL:1,DC:1,DM:2,MC:2,AMC:3,AMR:3,AML:3,ST:3})[position];
    return [line == null ? 2 : line];
  }

  function attribute(player, keys, fallback) {
    const values = (keys || []).map(key => Number(player && player.a && player.a[key]))
      .filter(value => Number.isFinite(value));
    return values.length ? values.reduce((a,b) => a+b, 0) / values.length : fallback;
  }

  function mkAttr(position, overall) {
    const base = clamp2d((Number(overall) || 65) / 5.2, 2, 20);
    return {
      pac:base, pas:base, vis:base, dri:base, sho:base, gk:base, tck:base, cmp:base
    };
  }

  function fit(player, position) {
    if (!player) return .45;
    if (player.pos === position) return 1;
    const playerGroup = GRP[player.pos] || 'M';
    const slotGroup = GRP[position] || 'M';
    if (playerGroup === slotGroup) return .84;
    if ((playerGroup === 'M' && slotGroup === 'A') ||
        (playerGroup === 'A' && slotGroup === 'M') ||
        (playerGroup === 'D' && slotGroup === 'M') ||
        (playerGroup === 'M' && slotGroup === 'D')) return .64;
    return .46;
  }

  function engineAttributes(player) {
    const fallback = clamp2d((Number(player && player.ovr) || 65) / 5.2, 2, 20);
    return {
      pac: attribute(player, ['Pace','Acceleration'], fallback),
      pas: attribute(player, ['Passing','Technique'], fallback),
      vis: attribute(player, ['Vision','Decisions'], fallback),
      dri: attribute(player, ['Dribbling','First Touch'], fallback),
      sho: attribute(player, ['Finishing','Long Shots'], fallback),
      gk: attribute(player, ['Reflexes','One On Ones','Handling','Positioning'], fallback),
      tck: attribute(player, ['Tackling','Marking'], fallback),
      cmp: attribute(player, ['Composure','First Touch','Technique'], fallback)
    };
  }

  function toEnginePlayer(player, fallbackId, fallbackRating) {
    const source = player || {};
    const copy = {
      id: Number(source.id != null ? source.id : fallbackId),
      no: Number(source.no != null ? source.no : fallbackId + 1),
      num: Number(source.no != null ? source.no : fallbackId + 1),
      name: String(source.name || ('Joueur ' + (fallbackId + 1))),
      pos: source.pos || 'MC',
      ovr: clamp2d(source.ovr == null ? fallbackRating : source.ovr, 35, 99),
      age: Number(source.age) || 25,
      cond: clamp2d(source.cond == null ? 86 : source.cond, 0, 100),
      form: Number(source.form) || 6.8,
      a: engineAttributes(source),
      source: source,
      sourceId: Number(source.id != null ? source.id : fallbackId)
    };
    return copy;
  }

  function fakeOpponentPlayer(club, player, index) {
    const position = player && player.pos || ['GK','DC','DC','DR','DL','DM','MC','MC','AMR','AML','ST'][index % 11];
    const name = String(player && player.name || ('Joueur ' + (index + 1)));
    const seed = typeof hash === 'function' ? hash(club + '|' + name + '|' + index) : index * 31 + 67;
    const rating = clamp2d(62 + (Math.abs(seed) % 17) + (BIG.includes(club) ? 5 : 0), 58, 88);
    const attrs = {};
    Object.values(AT).flat().forEach((key, j) => {
      attrs[key] = clamp2d(Math.round(rating / 5.2) + ((Math.abs(seed + j * 13) % 7) - 3), 2, 20);
    });
    return toEnginePlayer({
      id:900000 + index + Math.abs(seed % 70000),
      no:player && player.no != null ? player.no : index + 1,
      name:name,pos:position,ovr:rating,age:24 + (index % 8),cond:87 + (index % 11),
      form:6.2 + (index % 9) / 10,a:attrs
    }, 900000 + index, rating);
  }

  function makeOpponent(club) {
    const source = typeof oppXI === 'function' ? oppXI(club) : [];
    const positions = FORM['4-3-3'];
    const xiPlayers = positions.map((slot, index) =>
      fakeOpponentPlayer(club, source[index] || {pos:slot[0]}, index)
    );
    const benchPositions = ['GK','DC','DL','DR','DM','MC','AMC','ST'];
    const bench = benchPositions.map((position, index) =>
      fakeOpponentPlayer(club, {pos:position,name:'Remplaçant '+(index+1)}, 30 + index)
    );
    return {
      name:club,
      form:'4-3-3',
      xi:xiPlayers,
      bench:bench,
      tc:{ment:'bal',press:'mid'}
    };
  }

  function teamTactics(isUser) {
    if (!isUser) return {ment:'bal',press:'mid'};
    const mentality = ({Cautious:'cau',Balanced:'bal',Positive:'pos',Attacking:'att'})[S.tc.m] || 'bal';
    const pressValue = Number(S.tc.press);
    const press = !Number.isFinite(pressValue) ? 'mid' :
      pressValue < 38 ? 'low' : pressValue > 72 ? 'high' : 'mid';
    return {ment:mentality,press:press,prep:S.tc.prep || ''};
  }

  function newStats() {
    return {
      passes:[0,0],completed:[0,0],shots:[0,0],shotsOnTarget:[0,0],saves:[0,0],
      fouls:[0,0],yellow:[0,0],red:[0,0],corners:[0,0],offsides:[0,0],
      xg:[0,0],keyPasses:[0,0],tackles:[0,0],recoveries:[0,0],possession:[0,0],
      assists:[0,0]
    };
  }

  let lastFrame = 0;
  let halftimeScreenOpen = false;
  let finishing = false;

  function currentUserTeam() {
    if (!M || !M.f || !ENG) return null;
    return ENG.teams[M._fm26PhysicsMeta.userSide];
  }

  function isUserSide(side) {
    return !!(M && M._fm26PhysicsMeta && Number(side) === M._fm26PhysicsMeta.userSide);
  }

  function playerStat(id) {
    const meta = M && M._fm26PhysicsMeta;
    if (!meta) return null;
    const key = String(id);
    if (!meta.playerStats[key]) meta.playerStats[key] = {g:0,ast:0,yellow:0,red:0};
    return meta.playerStats[key];
  }

  function onPhysicsGoal(side, scorer, assister) {
    if (!M || !M._fm26PhysicsMeta || !isUserSide(side) || !scorer) return;
    const scorerStats = playerStat(scorer.id);
    if (scorerStats) scorerStats.g++;
    let assistName = '';
    if (assister && assister.t === side && assister !== scorer) {
      const assistStats = playerStat(assister.id);
      if (assistStats) assistStats.ast++;
      assistName = assister.name || '';
      if (!Array.isArray(M.stats.assists)) M.stats.assists = [0,0];
      M.stats.assists[side]++;
    }
    if (!Array.isArray(M.proAssistEvents)) M.proAssistEvents = [];
    M.proAssistEvents.push({
      min:Math.floor((ENG && ENG.clk || 0) / 60),
      player:assistName,
      scorer:scorer.name || 'Buteur',
      team:M.f.home === S.club ? M.f.home : M.f.away
    });
    if (!Array.isArray(M.scr)) M.scr = [];
    M.scr.push(Number(scorer.id));
    M.proLastProcessedH = Number(M.h) || 0;
    M.proLastProcessedA = Number(M.a) || 0;
  }

  function syncMatchData() {
    if (!M || !ENG || !M._fm26PhysicsMeta) return;
    const stats = M.stats || (M.stats = newStats());
    const bySide = key => [0,1].map(side => ENG.pl
      .filter(player => player.t === side)
      .reduce((sum,player) => sum + (Number(player.st && player.st[key]) || 0), 0));
    stats.passes = bySide('pa');
    stats.completed = bySide('po');
    stats.shots = (M.sh || [0,0]).slice();
    stats.shotsOnTarget = (M.sot || [0,0]).slice();
    stats.xg = (M.xg || [0,0]).slice();
    stats.saves = bySide('sv');
    stats.fouls = bySide('fo');
    stats.tackles = bySide('tk');
    stats.recoveries = bySide('tkw');
    stats.yellow = [0,1].map(side => (M.cards || []).filter(card => card.t === side && card.k === 'y').length);
    stats.red = [0,1].map(side => (M.cards || []).filter(card => card.t === side && card.k === 'r').length);
    stats.corners = [0,1].map(side => (M.ev || []).filter(event =>
      event.k === '🚩' && String(event.t || '').toLowerCase().includes('corner') &&
      event.t.indexOf(ENG.teams[side].name) >= 0
    ).length);
    stats.offsides = [0,0];
    stats.keyPasses = [0,0];
    stats.assists = Array.isArray(stats.assists) ? stats.assists : [0,0];
    stats.possession = ENG.pos.slice();
    M.possTicks = ENG.pos.slice();
    const total = ENG.pos[0] + ENG.pos[1] || 1;
    M.ps = Math.round(100 * ENG.pos[0] / total);
    M.min = Math.min(130, Math.floor(ENG.clk / 60));
    M.bx = clamp2d(B.x / PW * 100, 0, 100);
    M.by = clamp2d(B.y / PH * 100, 0, 100);
    M.cm = M.ev && M.ev[0] ? M.ev[0].t : M.cm || 'Le match se poursuit.';
    M.proLastProcessedH = Number(M.h) || 0;
    M.proLastProcessedA = Number(M.a) || 0;
    const team = currentUserTeam();
    if (team) M.lu = team.xi.map(player => player && player.source).filter(Boolean);
  }

  function buildPhysicsMatch() {
    const fixture = M && M.f;
    if (!fixture || !S || !Array.isArray(S.sq)) throw new Error('Carrière ou match introuvable.');
    let userXI = typeof xi === 'function' ? xi().slice(0,11) : [];
    if (userXI.length !== 11) throw new Error('Il faut onze titulaires pour lancer le moteur 2D.');
    const ids = userXI.map(player => Number(player.id));
    const userBench = S.sq.filter(player =>
      !ids.includes(Number(player.id)) && !(player.inj > 0) && !(player.susp > 0)
    ).map((player,index) => toEnginePlayer(player, 100 + index, player.ovr));
    userXI = userXI.map((player,index) => toEnginePlayer(player,index,player.ovr));
    const opponentName = fixture.home === S.club ? fixture.away : fixture.home;
    const opponent = makeOpponent(opponentName);
    const userTeam = {
      name:S.club,
      form:FORM[S.tc.f] ? S.tc.f : '4-3-3',
      xi:userXI,
      bench:userBench,
      tc:teamTactics(true)
    };
    const userSide = fixture.home === S.club ? 0 : 1;
    const home = userSide === 0 ? userTeam : opponent;
    const away = userSide === 1 ? userTeam : opponent;

    M.h = 0; M.a = 0; M.min = 0; M.ps = 50; M.sh = [0,0]; M.sot = [0,0]; M.xg = [0,0];
    M.bx = 50; M.by = 50; M.ev = []; M.cards = []; M.scr = [];
    M.stats = newStats(); M.possTicks = [1,1]; M.proAssistEvents = [];
    M.proLastProcessedH = 0; M.proLastProcessedA = 0;
    M.u = userSide; M.phase = 'live'; M.speed = 1; M.paused = false; M.p = false;
    M._fm26PhysicsMeta = {
      userSide:userSide,
      playerStats:{},
      snapshots:Object.fromEntries(S.sq.map(player => [String(player.id),{
        g:Number(player.g)||0,ast:Number(player.ast)||Number(player.assists)||0,
        ap:Number(player.ap)||0,yellow:Number(player.yellow)||0,red:Number(player.red)||0
      }])),
      participants:new Set(userXI.map(player => Number(player.id)))
    };
    M.lu = userTeam.xi.map(player => player.source);
    ENG = null; ACC = 0;
    startEngine(fixture,home,away);
    syncMatchData();
  }

  // Record the actual scorer and assister from Claude's engine while keeping the
  // existing player IDs and season statistics intact.
  function originalPhysicsGoal(side, scorer, assister) {
    onPhysicsGoal(side,scorer,assister);
  }

  function finalizeUserPlayerStats() {
    if (!M || !M._fm26PhysicsMeta || !S) return;
    const meta = M._fm26PhysicsMeta;
    for (const player of S.sq) {
      const snap = meta.snapshots[String(player.id)];
      if (!snap) continue;
      const recorded = meta.playerStats[String(player.id)] || {g:0,ast:0,yellow:0,red:0};
      player.g = snap.g + recorded.g;
      player.ast = snap.ast + recorded.ast;
      player.assists = player.ast;
      if (meta.participants.has(Number(player.id))) player.ap = snap.ap + 1;
      if (recorded.yellow) player.yellow = snap.yellow + recorded.yellow;
      if (recorded.red) player.red = snap.red + recorded.red;
    }
    const ratings = Array.isArray(M.proPlayerRatings) ? M.proPlayerRatings : [];
    ratings.forEach(row => {
      const player = S.sq.find(item => Number(item.id) === Number(row.id));
      if (!player) return;
      const actual = meta.playerStats[String(player.id)] || {g:0,ast:0};
      const oldGoals = Number(row.goals) || 0;
      const oldAssists = Number(row.assists) || 0;
      const delta = (actual.g - oldGoals) * 1.05 + (actual.ast - oldAssists) * .72;
      const before = Number(player.lastRating);
      const after = clamp2d((Number.isFinite(before) ? before : Number(row.rating) || 6.2) + delta, 4.5, 9.9);
      if (Number.isFinite(before) && Number.isFinite(Number(player.ratingTotal))) {
        player.ratingTotal = Math.max(0, player.ratingTotal + (after - before));
        player.averageRating = Number((player.ratingTotal / Math.max(1, Number(player.ratingCount)||1)).toFixed(2));
      }
      player.lastRating = Number(after.toFixed(1));
      row.goals = actual.g; row.assists = actual.ast; row.rating = player.lastRating;
    });
    if (M.f && M.f.stats && M.f.stats.proMatch) {
      M.f.stats.proMatch.playerRatings = ratings.slice();
      M.f.stats.proMatch.assists = (M.proAssistEvents || []).slice();
    }
    if (Array.isArray(S.proMatchHistory) && S.proMatchHistory[0]) {
      S.proMatchHistory[0].top = ratings.slice().sort((a,b)=>b.rating-a.rating).slice(0,3)
        .map(row=>({name:row.name,rating:row.rating}));
    }
  }

  function completePhysicsMatch() {
    if (!M || !M._fm26Physics2D || finishing) return;
    finishing = true;
    clearInterval(T);
    syncMatchData();
    // Seed the official career player totals with the engine's real scorers before
    // the existing end-of-match workflow calculates ratings and saves the fixture.
    const meta = M._fm26PhysicsMeta;
    for (const player of S.sq) {
      const snap = meta.snapshots[String(player.id)];
      const recorded = meta.playerStats[String(player.id)] || {g:0,ast:0};
      if (!snap) continue;
      player.g = snap.g + recorded.g;
      player.ast = snap.ast + recorded.ast;
      player.assists = player.ast;
    }
    try {
      endMatch();
      finalizeUserPlayerStats();
      if (typeof sv === 'function') sv();
      S.view = 'post';
      render();
    } finally {
      finishing = false;
    }
  }

  function updatePitchCanvas() {
    if (!M || !M._fm26Physics2D || S.view !== 'match' || !ENG) return;
    const canvas = document.getElementById('fm26-2d-pitch');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w = rect.width, h = rect.height;
    const pad = Math.max(15,Math.min(24,w*.018));
    const fw = w - pad*2, fh = h - pad*2;
    const x = value => pad + (value / PW) * fw;
    const y = value => pad + (value / PH) * fh;

    const grass = ctx.createLinearGradient(0,0,w,h);
    grass.addColorStop(0,'#1a733f'); grass.addColorStop(1,'#155a35');
    ctx.fillStyle = grass; ctx.fillRect(0,0,w,h);
    for (let stripe=0; stripe<10; stripe++) {
      ctx.fillStyle = stripe%2 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.045)';
      ctx.fillRect(pad + fw*stripe/10,pad,fw/10,fh);
    }
    ctx.strokeStyle = 'rgba(245,255,245,.78)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(pad,pad,fw,fh);
    ctx.beginPath(); ctx.moveTo(x(PW/2),pad); ctx.lineTo(x(PW/2),pad+fh); ctx.stroke();
    ctx.beginPath(); ctx.arc(x(PW/2),y(PH/2),Math.min(fw*.105,fh*.17),0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#f7fff2'; ctx.beginPath(); ctx.arc(x(PW/2),y(PH/2),3,0,Math.PI*2); ctx.fill();
    [0,PW-16.5].forEach(start => {
      ctx.strokeRect(x(start),y(PH/2-20.16),fw*16.5/PW,fh*40.32/PH);
    });
    [0,PW-5.5].forEach(start => {
      ctx.strokeRect(x(start),y(PH/2-9.16),fw*5.5/PW,fh*18.32/PH);
    });
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillRect(pad-5,y(PH/2-3.66),5,fh*7.32/PH);
    ctx.fillRect(pad+fw,y(PH/2-3.66),5,fh*7.32/PH);

    ENG.pl.forEach(player => {
      if (!player.on) return;
      const px=x(clamp2d(player.x,0,PW)), py=y(clamp2d(player.y,0,PH));
      const radius=Math.max(10,Math.min(18,fw/72));
      const color=player.t===0?'#5d88ff':'#ef6277';
      ctx.save();
      if (B.owner === player) {
        ctx.strokeStyle='rgba(255,240,145,.95)';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(px,py,radius+5,0,Math.PI*2);ctx.stroke();
      }
      ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.lineWidth=1.5;ctx.strokeStyle='#fff';ctx.stroke();
      ctx.fillStyle='#fff';ctx.font='700 '+Math.max(9,radius*.83)+'px system-ui';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(player.num || player.i+1),px,py+.4);
      ctx.restore();
    });

    const bx=x(clamp2d(B.x,0,PW)), by=y(clamp2d(B.y,0,PH));
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=6;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,Math.max(4,fw/190),0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#252525';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx-2,by-2);ctx.lineTo(bx+2,by+2);ctx.moveTo(bx+2,by-2);ctx.lineTo(bx-2,by+2);ctx.stroke();
    ctx.restore();
  }

  function matchStatsHTML() {
    const stats=M.stats || newStats();
    const pair=(label,left,right) => '<div class="fm26-2d-statrow"><span>'+label+'</span><b>'+left+' <small>–</small> '+right+'</b></div>';
    const home=M.f.home,away=M.f.away;
    return pair('Possession',M.ps+'%',(100-M.ps)+'%') +
      pair('Tirs',stats.shots[0]||0,stats.shots[1]||0) +
      pair('Tirs cadrés',stats.shotsOnTarget[0]||0,stats.shotsOnTarget[1]||0) +
      pair('Buts attendus',Number(stats.xg[0]||0).toFixed(2),Number(stats.xg[1]||0).toFixed(2)) +
      pair('Passes réussies',(stats.completed[0]||0)+'/'+(stats.passes[0]||0),(stats.completed[1]||0)+'/'+(stats.passes[1]||0)) +
      pair('Tacles gagnés',stats.recoveries[0]||0,stats.recoveries[1]||0) +
      pair('Fautes',stats.fouls[0]||0,stats.fouls[1]||0) +
      '<div class="fm26-2d-statrow"><span>Cartons jaunes / rouges</span><b>'+(stats.yellow[0]||0)+'/'+(stats.red[0]||0)+' <small>–</small> '+(stats.yellow[1]||0)+'/'+(stats.red[1]||0)+'</b></div>';
  }

  function updateMatchPanel() {
    if (!M || !M._fm26Physics2D || S.view !== 'match') return;
    const clock=document.getElementById('fm26-2d-clock');
    const score=document.getElementById('fm26-2d-score');
    const comment=document.getElementById('fm26-2d-comment');
    const possession=document.getElementById('fm26-2d-possession');
    const state=document.getElementById('fm26-2d-state');
    if (clock) clock.textContent = M.phase === 'ht' ? 'MI-TEMPS' :
      M.phase === 'ft' ? '90+' : String(M.min||0)+"'";
    if (score) score.textContent=(M.h||0)+' – '+(M.a||0);
    if (comment) comment.textContent=M.cm || 'Le jeu se poursuit…';
    if (possession) possession.textContent=M.ps+'% – '+(100-M.ps)+'%';
    if (state) state.textContent=M.p?'PAUSE':(M.speed||1)+'× EN DIRECT';
    const stats=document.getElementById('fm26-2d-stats');
    if (stats) stats.innerHTML=matchStatsHTML();
    const events=document.getElementById('fm26-2d-events');
    if (events) events.innerHTML=(M.ev||[]).slice(0,8).map(event =>
      '<div class="fm26-2d-event"><b>'+esc2d(event.m)+"'</b><span>"+esc2d(event.k)+'</span><p>'+esc2d(event.t)+'</p></div>'
    ).join('') || '<p class="fm26-2d-empty">En attente des premières actions…</p>';
    const go=$('go');
    if (go) { go.textContent='VITESSE '+(M.speed||1)+'×'; go.onclick=() =>
      window.FM26Live2D.speed((M.speed||1)===1?2:(M.speed||1)===2?4:1); }
    updatePitchCanvas();
  }

  function renderMatch2D() {
    if (!M || !M.f || !M._fm26Physics2D) return '';
    const f=M.f,home=esc2d(f.home),away=esc2d(f.away);
    const side=M._fm26PhysicsMeta.userSide;
    const team=ENG.teams[side];
    const starters=(team && team.xi || []).map(player =>
      '<div class="fm26-2d-player"><i>'+esc2d(player.num)+'</i><span>'+esc2d(player.name)+'<small>'+esc2d(player.pos)+'</small></span><b>'+Math.round(player.stam*100)+'%</b></div>'
    ).join('');
    const userIds=(team && team.xi || []).map(player=>Number(player.id));
    const bench=(S.sq||[]).filter(player=>!userIds.includes(Number(player.id))&&!(player.inj||0)&&!(player.susp||0));
    const outOptions=(team && team.xi || []).map(player =>
      '<option value="'+esc2d(player.id)+'">'+esc2d(player.name)+' · '+esc2d(player.pos)+'</option>'
    ).join('');
    const inOptions=bench.map(player =>
      '<option value="'+esc2d(player.id)+'">'+esc2d(player.name)+' · '+esc2d(player.pos)+' · '+esc2d(player.ovr)+'</option>'
    ).join('');
    return '<div class="fm26-2d-match">' +
      '<div class="fm26-2d-hud"><div class="fm26-2d-team"><span class="fm26-2d-crest">'+crest(f.home,44)+'</span><b>'+home+'</b></div>' +
      '<div class="fm26-2d-score"><span id="fm26-2d-clock">00\'</span><b id="fm26-2d-score">0 – 0</b></div>' +
      '<div class="fm26-2d-team away"><b>'+away+'</b><span class="fm26-2d-crest">'+crest(f.away,44)+'</span></div>' +
      '<span class="fm26-2d-state" id="fm26-2d-state">1× EN DIRECT</span></div>' +
      '<div class="fm26-2d-body"><section class="fm26-2d-field-column"><div class="fm26-2d-field-wrap"><canvas id="fm26-2d-pitch" aria-label="Terrain de football animé en vue de dessus"></canvas></div>' +
      '<div class="fm26-2d-comment" id="fm26-2d-comment">Coup d’envoi imminent.</div>' +
      '<div class="fm26-2d-controls"><button onclick="FM26Live2D.pause()">Pause / Reprendre</button><button onclick="FM26UX.pauseForLineup()">Modifier la composition</button>' +
      '<button onclick="FM26Live2D.speed(1)">1×</button><button onclick="FM26Live2D.speed(2)">2×</button><button onclick="FM26Live2D.speed(4)">4×</button></div></section>' +
      '<aside class="fm26-2d-sidebar"><section class="fm26-2d-box"><h3>Statistiques du match</h3><div id="fm26-2d-stats">'+matchStatsHTML()+'</div></section>' +
      '<section class="fm26-2d-box"><h3>Changer un joueur</h3><div class="fm26-2d-sub-form"><label>Sortie<select id="fm26-2d-sub-out">'+outOptions+'</select></label>' +
      '<label>Entrée<select id="fm26-2d-sub-in">'+inOptions+'</select></label><button onclick="FM26Live2D.subFromForm()">Confirmer le changement</button></div>' +
      '<small class="fm26-2d-muted">'+(S.subsUsed||0)+' / 5 changements utilisés</small></section>' +
      '<section class="fm26-2d-box fm26-2d-team-list"><h3>Onze de '+esc2d(S.club)+'</h3><div id="fm26-2d-starters">'+starters+'</div></section>' +
      '<section class="fm26-2d-box"><h3>Temps forts</h3><div id="fm26-2d-events"></div></section>' +
      '</aside></div></div>';
  }

  function drawLive2D() {
    if (!M || !M._fm26Physics2D) return;
    updateMatchPanel();
  }

  function applyEngineSub(outId,inId) {
    if (!ENG || !M || !M._fm26PhysicsMeta) return false;
    const side=M._fm26PhysicsMeta.userSide;
    const team=ENG.teams[side];
    const agent=ENG.pl.find(player=>player.t===side && player.on && Number(player.id)===Number(outId));
    const incoming=team && team.bench.find(player=>Number(player.id)===Number(inId));
    if (!agent || !incoming) return false;
    const slot=agent.i;
    doSub(side,agent,incoming);
    team.xi[slot]=incoming;
    M._fm26PhysicsMeta.participants.add(Number(inId));
    M.lu=team.xi.map(player=>player.source).filter(Boolean);
    syncMatchData();
    return true;
  }

  function updateUserTotalsBeforeEnd() {
    if (!M || !M._fm26PhysicsMeta || !S) return;
    const meta=M._fm26PhysicsMeta;
    S.sq.forEach(player=>{
      const snap=meta.snapshots[String(player.id)];
      if(!snap)return;
      const stats=meta.playerStats[String(player.id)]||{g:0,ast:0};
      player.g=snap.g+stats.g;
      player.ast=snap.ast+stats.ast;
      player.assists=player.ast;
    });
  }

  // Append the scorer callback to the engine's own goal routine.
  const originalGoalScored = goalScored;
  goalScored = function (side, scorer) {
    return originalGoalScored.apply(this, arguments);
  };

  const originalSetRestart = setRestart;
  setRestart = function (type, side, x, y, preferred) {
    const result=originalSetRestart.apply(this,arguments);
    if(type==='corner' && M && M.stats && M.stats.corners) M.stats.corners[side]++;
    return result;
  };

  // A real substitution updates both the saved FM26 lineup and the physics agent.
  if (window.FM26A && typeof window.FM26A.sub === 'function' && !window.FM26A.sub.__fm26PhysicsWrapped) {
    const oldSub=window.FM26A.sub;
    const subWithPhysics=function(outId,inId) {
      const active=!!(M && M._fm26Physics2D && !M.done);
      const result=oldSub.apply(this,arguments);
      if(active) {
        applyEngineSub(Number(outId),Number(inId));
        render();
      }
      return result;
    };
    subWithPhysics.__fm26PhysicsWrapped=true;
    window.FM26A.sub=subWithPhysics;
  }

  const previousManagerSubstitute=window.FM26UX && window.FM26UX.substitute;
  if (window.FM26UX && typeof previousManagerSubstitute === 'function' && !previousManagerSubstitute.__fm26PhysicsWrapped) {
    const substituteWithPhysics=function(outId,inId) {
      const active=!!(M && M._fm26Physics2D && !M.done);
      const result=previousManagerSubstitute.apply(this,arguments);
      if(active) { applyEngineSub(Number(outId),Number(inId)); render(); }
      return result;
    };
    substituteWithPhysics.__fm26PhysicsWrapped=true;
    window.FM26UX.substitute=substituteWithPhysics;
  }

  const previousResume=window.FM26UX && window.FM26UX.resumeMatch;
  if (window.FM26UX && typeof previousResume === 'function') {
    window.FM26UX.resumeMatch=function() {
      const result=previousResume.apply(this,arguments);
      lastFrame=nowMs();
      if(M && M._fm26Physics2D) { clearInterval(T); T=setInterval(tick,50); }
      return result;
    };
  }

  const previousVMatch=V.match;
  V.match=function() {
    return M && M._fm26Physics2D ? renderMatch2D() : previousVMatch.apply(this,arguments);
  };

  const previousDraw=draw;
  draw=function() {
    if (M && M._fm26Physics2D) { drawLive2D(); return; }
    return previousDraw.apply(this,arguments);
  };

  const previousTick=tick;
  tick=function() {
    if (!M || !M._fm26Physics2D) return previousTick.apply(this,arguments);
    const now=nowMs();
    if (M.p || M.paused) {
      M.paused=true; lastFrame=now; drawLive2D(); return;
    }
    M.paused=false;
    if (M.phase === 'ht') {
      if (M.halfTimeDone) {
        startSecondHalf(); M.halfTimeDone=false; halftimeScreenOpen=false; ACC=0;
      } else {
        if (!halftimeScreenOpen) {
          halftimeScreenOpen=true; clearInterval(T); S.view='halftime'; render();
        }
        lastFrame=now; return;
      }
    }
    if (M.phase === 'ft') { completePhysicsMatch(); return; }
    const elapsed=lastFrame ? clamp2d((now-lastFrame)/1000,0,.25) : .05;
    lastFrame=now;
    physicsTick(elapsed);
    syncMatchData();
    if (M.phase === 'ht') {
      halftimeScreenOpen=true; clearInterval(T); S.view='halftime'; render(); return;
    }
    if (M.phase === 'ft') { completePhysicsMatch(); return; }
    drawLive2D();
  };

  const previousStartMatch=startMatch;
  startMatch=function() {
    const result=previousStartMatch.apply(this,arguments);
    clearInterval(T);
    finishing=false;halftimeScreenOpen=false;lastFrame=nowMs();
    try {
      buildPhysicsMatch();
      M._fm26Physics2D=true;
      M.speed=1;M.paused=false;M.p=false;
      S.view='match';
      render();
      drawLive2D();
      T=setInterval(tick,50);
    } catch (error) {
      console.error('FM26 2D engine fallback:',error);
      if(M) M._fm26Physics2D=false;
      T=setInterval(tick,M && M.sp || 170);
      if(typeof toast==='function') toast('Moteur 2D indisponible : simulation classique utilisée.');
    }
    return result;
  };

  const previousRender=render;
  render=function() {
    const result=previousRender.apply(this,arguments);
    if(M && M._fm26Physics2D && S.view==='match') drawLive2D();
    return result;
  };

  const previousCont=cont;
  cont=function() {
    if(M && M._fm26Physics2D && S.view==='match' && !M.done) {
      window.FM26Live2D.speed((M.speed||1)===1?2:(M.speed||1)===2?4:1);
      return;
    }
    return previousCont.apply(this,arguments);
  };

  window.FM26Live2D={
    version:'1.0.0',
    pause:function() {
      if(!M || !M._fm26Physics2D || M.done)return;
      M.p=!M.p;M.paused=!!M.p;lastFrame=nowMs();drawLive2D();
    },
    speed:function(value) {
      if(!M || !M._fm26Physics2D || M.done)return;
      M.speed=clamp2d(value,1,4);lastFrame=nowMs();drawLive2D();
    },
    subFromForm:function() {
      const out=document.getElementById('fm26-2d-sub-out');
      const incoming=document.getElementById('fm26-2d-sub-in');
      if(!out || !incoming || !incoming.value)return;
      if(window.FM26A && typeof window.FM26A.sub==='function') window.FM26A.sub(out.value,incoming.value);
    },
    openLineup:function() {
      if(window.FM26UX && typeof window.FM26UX.pauseForLineup==='function') window.FM26UX.pauseForLineup();
    },
    diagnostics:function() {
      return {
        active:!!(M && M._fm26Physics2D),
        phase:M && M.phase,
        score:M ? [M.h,M.a] : null,
        players:ENG ? ENG.pl.length : 0,
        userSide:M && M._fm26PhysicsMeta ? M._fm26PhysicsMeta.userSide : null
      };
    }
  };

  window.addEventListener('resize',function(){if(M && M._fm26Physics2D) drawLive2D();});
  if (typeof S !== 'undefined' && S && typeof render === 'function') {
    try { render(); } catch (e) { /* setup screen may not have a career yet */ }
  }
})();
/* ===== MOTEUR DE MATCH 2D (jumeau FM26) ===== */
var PW = 105, PH = 68, GOALW = 7.32;
var B = {x: 52.5, y: 34, vx: 0, vy: 0, owner: null, passTo: null, last: null, shot: null};
var ENG = null;
var DT = 1 / 60;           // pas de physique (s)
var CLOCK = 7.5;           // 1 s de physique = 7,5 s de temps de match
function rnd() { return Math.random(); }
function hyp(a, b) { return Math.sqrt(a * a + b * b); }
function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
function dirOf(t) { return t === 0 ? 1 : -1; }
function wx(t, d) { return t === 0 ? d * PW : PW - d * PW; }
function wy(t, l) { return t === 0 ? l * PH : PH - l * PH; }
function depthOf(t, x) { return t === 0 ? x / PW : 1 - x / PW; }
function latOf(t, y) { return t === 0 ? y / PH : 1 - y / PH; }
function goalX(t) { return t === 0 ? PW : 0; }          // but attaqué par l'équipe t
function ownGoalX(t) { return t === 0 ? 0 : PW; }
function distSeg(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  var u = l2 ? cl(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return hyp(px - (ax + u * dx), py - (ay + u * dy));
}

function tacParams(tc) {
  var m = {def: -.09, cau: -.045, bal: 0, pos: .04, att: .09}[tc.ment || 'bal'];
  var pr = {low: .5, mid: .8, high: 1.1}[tc.press || 'mid'] || .8;
  if (tc.prep === 'press') pr += .15;
  return {push: m, press: pr, tempo: 1 + m};
}

function mkAgent(t, i, pl, slot) {
  var d = (100 - slot[2]) / 100, l = slot[1] / 100;
  var a = pl.a || mkAttr(pl.pos, pl.ovr, rnd);
  var ln = posInfo(slot[0])[0];
  var ag = {t: t, i: i, id: pl.id, p: pl, name: pl.name, num: pl.num, code: slot[0], line: ln, hd: d, hl: l, a: a,
    x: 0, y: 0, vx: 0, vy: 0, face: t === 0 ? 0 : Math.PI, stam: 1, cool: 0, tkcd: 0, st: {pa: 0, po: 0, sh: 0, g: 0, ast: 0, tk: 0, tkw: 0, sv: 0, tc: 0, fo: 0}, yc: 0, red: false, inj: 0, on: true, mins: 0, tx: 0, ty: 0, sup: 0};
  ag.fit = fit(pl, slot[0]);
  ag.spd = (6.6 + a.pac * .13) * (.88 + ag.fit * .12);   // m/s de pointe
  return ag;
}

function placeKickoff(E, kt) {
  E.pl.forEach(function (a) {
    var d = a.hd * .5;      // chaque équipe dans sa moitié
    if (a.line === 0) d = a.hd;
    a.x = wx(a.t, d); a.y = wy(a.t, a.hl); a.vx = a.vy = 0; a.face = a.t === 0 ? 0 : Math.PI;
  });
  // l'équipe qui engage met un joueur au centre
  var best = null, bd = 1e9;
  E.pl.forEach(function (a) { if (a.t === kt && a.line >= 2) { var dd = hyp(a.x - PW / 2, a.y - PH / 2) - (a.line === 3 ? 4 : 0); if (dd < bd) { bd = dd; best = a; } } });
  if (!best) return;
  best.x = PW / 2 + (kt === 0 ? -.8 : .8); best.y = PH / 2;
  B.x = PW / 2; B.y = PH / 2; B.vx = B.vy = 0; B.owner = best; B.passTo = null; B.shot = null; B.last = best;
  best.cool = .6; E.poss = kt; E.restart = null;
}

function startEngine(fx, home, away) {
  var E = {pl: [], t: 0, clk: 0, half: 1, ht: false, ft: false, poss: 0, pos: [1, 1], restart: null, pause: 1.2, cele: 0, celeT: -1, M: null, wait: 0, nextSub: [58 + Math.floor(rnd() * 8), 70 + Math.floor(rnd() * 8), 80 + Math.floor(rnd() * 6)], ai: null, stopA: 1 + Math.floor(rnd() * 3), stopB: 2 + Math.floor(rnd() * 4), tp: [tacParams(home.tc), tacParams(away.tc)]};
  E.teams = [home, away];
  [home, away].forEach(function (tm, t) {
    tm.xi.forEach(function (pl, i) { E.pl.push(mkAgent(t, i, pl, FORM[tm.form][i])); });
    tm.subs = 0;
  });
  ENG = E;
  placeKickoff(E, rnd() < .5 ? 0 : 1);
  E.pause = 1.0;
  return E;
}

/* ---------- événements ---------- */
function minute() { return Math.max(1, Math.floor(ENG.clk / 60) + 1); }
function evt(k, t) { if (M) { M.ev.unshift({m: minute(), k: k, t: t}); if (M.ev.length > 80) M.ev.pop(); } }

/* ---------- décision du porteur ---------- */
function nearestOpp(a, x, y) {
  var E = ENG, best = 99, o = null;
  for (var i = 0; i < 22; i++) { var p = E.pl[i]; if (p.t === a.t || !p.on) continue; var d = hyp(p.x - x, p.y - y); if (d < best) { best = d; o = p; } }
  return {d: best, o: o};
}
function laneRisk(a, m) {
  var E = ENG, r = 99;
  for (var i = 0; i < 22; i++) { var p = E.pl[i]; if (p.t === a.t || !p.on) continue; var d = distSeg(p.x, p.y, a.x, a.y, m.x, m.y); if (d < r) r = d; }
  return r;
}

function carrierThink(a) {
  var E = ENG, t = a.t, dir = dirOf(t), gx = goalX(t), gy = PH / 2;
  var dg = hyp(gx - a.x, gy - a.y);
  var pr = nearestOpp(a, a.x, a.y), press = pr.d;
  var tp = E.tp[t];
  // GK : dégagement
  if (a.line === 0) { return distribute(a); }
  // tir
  if (dg < 30) {
    var ang = Math.abs(a.y - gy);
    var pS = Math.pow(cl((27 - dg) / 27, 0, 1), .75) * (a.line === 3 ? 1 : a.line === 2 ? .65 : .12) * (1 - ang / 60) * (a.a.sho / 11);
    if (dg < 9) pS += .12;
    if (press < 2) pS *= .8;
    if (rnd() < pS * .17) return doShot(a);
  }
  // options de passe
  var best = null, bs = -1e9;
  for (var i = 0; i < 22; i++) {
    var m = E.pl[i];
    if (m.t !== t || m === a || !m.on) continue;
    var dist = hyp(m.x - a.x, m.y - a.y);
    if (dist < 5 || dist > 48) continue;
    var prog = (m.x - a.x) * dir;
    var sp = nearestOpp(m, m.x, m.y).d;
    var lane = laneRisk(a, m);
    var sc = prog * .34 + Math.min(sp, 10) * 1.7 + Math.min(lane, 7) * 2.6 - Math.abs(dist - 17) * .16 + (m.line >= 2 ? 2.2 : 0) + rnd() * 5 + a.a.vis * .08;
    if (m.line === 0) sc = press < 3.5 ? 4 + rnd() * 3 : -50;
    if (lane < 1.6) sc -= 12;
    if (sc > bs) { bs = sc; best = m; }
  }
  // dribble ?
  var space = press > 7 ? 1 : press > 4 ? .45 : .1;
  var ahead = nearestOpp(a, a.x + dir * 8, a.y).d;
  var pDr = space * (a.a.dri / 14) * (ahead > 5 ? 1 : .35) * (a.line >= 2 ? 1 : .55) * .55;
  if (a.x * dir > (t === 0 ? 0 : -PW)) { }
  if (rnd() < pDr) { a.dribble = .6 + rnd() * .9; a.dribbleDir = 0; return; }
  if (best && bs > -8) return doPass(a, best);
  // dégagement long
  if (best) return doPass(a, best);
  a.dribble = .7;
}

function distribute(a) {
  var E = ENG, t = a.t, best = null, bs = -1e9;
  for (var i = 0; i < 22; i++) {
    var m = E.pl[i];
    if (m.t !== t || m === a || !m.on || m.line === 0) continue;
    var sp = nearestOpp(m, m.x, m.y).d;
    var sc = Math.min(sp, 12) * 1.5 + (m.line === 1 ? 3 : m.line === 2 ? 2.5 : 1) + rnd() * 6;
    if (sc > bs) { bs = sc; best = m; }
  }
  if (best) doPass(a, best, true); else { B.owner = null; B.vx = B.vy = 0; }
}

function doPass(a, m, long) {
  var E = ENG, t = a.t;
  var dist = hyp(m.x - a.x, m.y - a.y);
  var spd = cl(11 + dist * .62, 13, 27);
  var tt = dist / spd;
  var lx = m.x + m.vx * tt * .8, ly = m.y + m.vy * tt * .8;
  lx = cl(lx, 1, PW - 1); ly = cl(ly, 1, PH - 1);
  var dx = lx - a.x, dy = ly - a.y, dl = hyp(dx, dy) || 1;
  var err = (rnd() - .5) * (.34 - a.a.pas * .013) * (1 + dist / 40) * (long ? 2 : 1);
  var c = Math.cos(err), s = Math.sin(err);
  var ux = (dx / dl) * c - (dy / dl) * s, uy = (dx / dl) * s + (dy / dl) * c;
  spd = spd * (a.fit > .8 ? 1 : .92);
  B.x = a.x + ux * .8; B.y = a.y + uy * .8;
  B.vx = ux * spd; B.vy = uy * spd; B.owner = null; B.passTo = m; B.last = a; B.shot = null; B.age = 0;
  a.cool = .55; a.st.pa++; a.dribble = 0;
  E.poss = t; m.sup = 0;
}

function doShot(a) {
  var E = ENG, t = a.t, gx = goalX(t), gy = PH / 2, M0 = M;
  var dg = hyp(gx - a.x, gy - a.y);
  var near = nearestOpp(a, a.x, a.y).d;
  var q = cl(.015 + .38 * Math.pow(1 - cl(dg / 32, 0, 1), 2.2), .01, .45);
  q *= cl(.6 + near / 10, .55, 1.1);
  q *= .6 + a.a.sho / 20 * .8;
  var gk = null; E.pl.forEach(function (p) { if (p.t !== t && p.line === 0 && p.on) gk = p; });
  var pen = E.restart && E.restart.type === 'pen';
  if (pen) q = .77;
  a.st.sh++; if (M0) { M0.sh[t]++; M0.xg[t] += q; }
  var out;
  var pBlock = pen ? 0 : near < 3 ? .3 : .09;
  var pOn = cl(.27 + a.a.sho / 62 + q * .45 - (dg > 22 ? .1 : 0), .25, .8);
  var r = rnd();
  var ty;
  if (r < pBlock) out = 'block';
  else if (rnd() > pOn) out = 'off';
  else {
    var pG = cl(q * 2.2, .04, .8) * (1 + (a.a.sho - (gk ? gk.a.gk : 10)) * .025);
    out = rnd() < pG ? 'goal' : 'save';
  }
  if (out === 'goal' || out === 'save') ty = gy + (rnd() - .5) * (GOALW - 1.2) * (out === 'save' ? .8 : 1.3);
  else if (out === 'off') ty = gy + (rnd() < .5 ? -1 : 1) * (GOALW / 2 + .6 + rnd() * 5);
  else ty = gy + (rnd() - .5) * 6;
  var dx = gx - a.x, dy = ty - a.y, dl = hyp(dx, dy) || 1, spd = 26 + a.a.sho * .25 + rnd() * 3;
  B.x = a.x + dx / dl * .8; B.y = a.y + dy / dl * .8; B.vx = dx / dl * spd; B.vy = dy / dl * spd;
  B.owner = null; B.passTo = null; B.last = a; B.age = 0;
  B.shot = {t: t, out: out, ty: ty, a: a, q: q, gk: gk};
  if (out === 'block') { B.shot.blkAt = .15 + rnd() * .35; }
  if (out === 'save' || out === 'goal') { if (M0) M0.sot[t]++; if (gk) { gk.dive = ty; } }
  a.cool = .7; a.dribble = 0;
  E.poss = t;
  evt('🥅', a.name + ' tente sa chance' + (out === 'goal' ? '…' : ''));
}

/* ---------- sortie / reprise ---------- */
function setRestart(type, t, x, y, takerPref) {
  var E = ENG;
  var taker = null, bd = 1e9;
  E.pl.forEach(function (p) {
    if (p.t !== t || !p.on) return;
    if (type === 'goalkick') { if (p.line === 0) taker = p; return; }
    if (type === 'pen') { var s = -p.a.sho; if (s < bd) { bd = s; taker = p; } return; }
    if (p.line === 0) return;
    var d = hyp(p.x - x, p.y - y) + (type === 'corner' && p.line === 1 ? 20 : 0);
    if (d < bd) { bd = d; taker = p; }
  });
  B.x = x; B.y = y; B.vx = B.vy = 0; B.owner = null; B.passTo = null; B.shot = null;
  E.restart = {type: type, t: t, x: x, y: y, taker: taker, timer: 0};
  E.poss = t;
  if (!taker) { E.restart = null; return; }
  taker.sup = 0;
}

function outOfPlay() {
  var E = ENG, lt = B.last ? B.last.t : 0;
  if (B.y < 0 || B.y > PH) {
    var t = 1 - lt;
    setRestart('throw', t, cl(B.x, 1, PW - 1), B.y < 0 ? .3 : PH - .3);
    return;
  }
  // ligne de but
  var side = B.x < 0 ? 0 : 1;     // 0 : but gauche (défendu par l'équipe 0)
  var defT = side === 0 ? 0 : 1;
  if (lt === defT) {              // corner pour l'attaque
    setRestart('corner', 1 - defT, side === 0 ? .3 : PW - .3, B.y < PH / 2 ? .3 : PH - .3);
    evt('🚩', 'Corner');
  } else {
    setRestart('goalkick', defT, side === 0 ? 5.5 : PW - 5.5, PH / 2 + (rnd() < .5 ? -4 : 4));
  }
}

function goalScored(t, scorer) {
  var E = ENG;
  if (t === 0) M.h++; else M.a++;
  scorer.st.g++; var as = null;
  if (B.prev && B.prev !== scorer && B.prev.t === t && rnd() < .8) { as = B.prev; as.st.ast++; }
  evt('⚽', 'BUT ! ' + scorer.name + (as ? ' (passe de ' + as.name + ')' : '') + ' — ' + M.h + '-' + M.a);
  if (typeof onPhysicsGoal === 'function') onPhysicsGoal(t, scorer, as);
  if (typeof onPhysicsGoal === 'function') onPhysicsGoal(t, scorer, as);
  E.cele = 4.2; E.celeT = t; E.celeBy = scorer; M.gt = 4;
  E.restart = null; B.owner = null; B.vx = B.vy = 0; B.shot = null; B.passTo = null;
  B.x = goalX(t) + (t === 0 ? 1.2 : -1.2); B.y = PH / 2;
  E.kickTeam = 1 - t;
}

function foul(def, vic) {
  var E = ENG;
  def.st.fo++;
  var d = depthOf(vic.t, vic.x), box = d > .843 && Math.abs(vic.y - PH / 2) < 20.2;
  var yc = box ? .3 : .17;
  var txt = def.name + ' commet une faute sur ' + vic.name;
  evt('🟨', 'Faute — ' + txt);
  if (rnd() < yc) {
    def.yc++;
    if (def.yc >= 2) { sendOff(def, 'Deuxième jaune'); }
    else evt('🟨', 'Carton jaune pour ' + def.name);
    M.cards = M.cards || []; M.cards.push({id: def.id, t: def.t, k: def.yc >= 2 ? 'r' : 'y'});
  } else if (rnd() < .012) { sendOff(def, 'Carton rouge direct'); M.cards.push({id: def.id, t: def.t, k: 'r'}); }
  if (box && rnd() < .55) { evt('⚠️', 'PENALTY pour ' + E.teams[vic.t].name + ' !'); setRestart('pen', vic.t, goalX(vic.t) - (vic.t === 0 ? 11 : -11), PH / 2); }
  else setRestart('free', vic.t, vic.x, vic.y);
}
function sendOff(a, why) { a.red = true; a.on = false; a.x = -50; a.y = -50; evt('🟥', why + ' — ' + a.name + ' est expulsé'); }

/* ---------- boucle de physique ---------- */
function targetOf(a, E) {
  var t = a.t, tp = E.tp[t], has = E.poss === t, d, l;
  var bd = depthOf(t, B.x), bl = latOf(t, B.y);
  var ls = a.line === 0 ? .05 : a.line === 1 ? .8 : a.line === 2 ? 1 : 1.12;
  var push = ((has ? .1 : -.08) + (bd - .5) * .32 + tp.push) * ls;
  d = a.hd + push;
  l = a.hl + (bl - .5) * (a.line === 0 ? .1 : .2);
  if (has && a.line === 3) d += .06;
  if (has && a.line === 2 && a.hd > .45) d += .03;
  d = cl(d, .02, .97); l = cl(l, .03, .97);
  var x = wx(t, d), y = wy(t, l);
  if (a.line === 0) { x = ownGoalX(t) + (t === 0 ? 1.8 : -1.8) + (bd > .6 ? dirOf(t) * 4 : 0); y = cl(PH / 2 + (B.y - PH / 2) * .16, PH / 2 - 5, PH / 2 + 5); if (a.dive !== undefined && B.shot && B.shot.gk === a) y = a.dive; }
  else if (!has) {
    // marquage : se rapproche de l'adversaire le plus proche de son poste
    var o = nearestOpp(a, x, y);
    if (o.o && o.d < 11 && a.line <= 2) { x += (o.o.x - x) * .38; y += (o.o.y - y) * .38; }
  } else if (B.owner && B.owner !== a && B.owner.t === t) {
    // soutien : offre une solution
    var c = B.owner, dc = hyp(c.x - x, c.y - y);
    if (dc < 22 && a.line >= 1) {
      var sx = c.x + dirOf(t) * (8 + (a.line - 1) * 4), sy = c.y + (a.hl < .5 ? -1 : 1) * (7 + ((a.i * 7) % 5));
      var w = .42; x += (sx - x) * w; y += (sy - y) * w;
    }
  }
  return [cl(x, 1, PW - 1), cl(y, 1, PH - 1)];
}

function stepEngine(dt) {
  var E = ENG, i, a;
  if (E.ft) return;
  // chrono
  E.clk += dt * CLOCK;
  E.pos[E.poss] += dt;
  var lim = E.half === 1 ? 2700 + E.stopA * 60 : 5400 + E.stopB * 60;
  if (E.clk >= lim) {
    if (E.half === 1) { E.ht = true; evt('⏱', 'Mi-temps'); M.phase = 'ht'; return; }
    E.ft = true; M.phase = 'ft'; evt('⏱', 'Fin du match'); return;
  }
  // célébration
  if (E.cele > 0) {
    E.cele -= dt;
    E.pl.forEach(function (p) {
      if (!p.on) return;
      var tg;
      if (p.t === E.celeT) tg = (p === E.celeBy) ? [E.celeBy.x + dirOf(p.t) * 6, E.celeBy.y + (E.celeBy.y < PH / 2 ? -3 : 3)] : [E.celeBy.x - dirOf(p.t) * 3 + (p.i % 3 - 1) * 4, E.celeBy.y + (p.i % 4 - 1.5) * 3];
      else tg = [wx(p.t, p.hd * .5 + .02), wy(p.t, p.hl)];
      steer(p, tg[0], tg[1], p.t === E.celeT ? 5.5 : 3, dt);
    });
    if (E.cele <= 0) placeKickoff(E, E.kickTeam);
    return;
  }
  // décisions IA : remplacements
  aiSubs(E);
  // cibles + mouvements
  var chasers = [[], []];
  var ballFree = !B.owner;
  for (i = 0; i < 22; i++) { a = E.pl[i]; if (a.on) { a.tg = targetOf(a, E); } }
  // pressing
  var carrier = B.owner, opp = carrier ? 1 - carrier.t : null;
  if (!E.restart) {
    [0, 1].forEach(function (t) {
      var list = [];
      for (var j = 0; j < 22; j++) { var p = E.pl[j]; if (p.t !== t || !p.on || p.line === 0) continue; list.push([hyp(p.x - B.x, p.y - B.y), p]); }
      list.sort(function (u, v) { return u[0] - v[0]; });
      var n = ballFree ? 1 : (carrier.t === t ? 0 : 2);
      var rng = 40 * E.tp[t].press;
      for (var k = 0; k < n && k < list.length; k++) {
        if (list[k][0] < rng) { var p2 = list[k][1]; p2.chase = k === 0 ? 1 : .75; if (ballFree && B.passTo && B.passTo.t === t && B.passTo !== p2) continue; }
      }
      for (var k2 = 0; k2 < n && k2 < list.length; k2++) { if (list[k2][0] < rng) { var q = list[k2][1]; if (!(ballFree && B.passTo && B.passTo.t === t)) { var tx = B.x + B.vx * .25, ty = B.y + B.vy * .25; if (carrier) { tx = carrier.x + carrier.vx * .3; ty = carrier.y + carrier.vy * .3; } q.tg = [tx, ty]; q.sprint = k2 === 0 ? 1 : .7; } } }
    });
    if (ballFree && B.passTo && B.passTo.on) { var r = B.passTo; var tt = hyp(r.x - B.x, r.y - B.y) / Math.max(4, hyp(B.vx, B.vy)); r.tg = [cl(B.x + B.vx * Math.min(tt, 3) * .75, 1, PW - 1), cl(B.y + B.vy * Math.min(tt, 3) * .75, 1, PH - 1)]; r.sprint = .85; }
  }
  // reprises de jeu : positions spéciales
  if (E.restart) restartTargets(E);
  for (i = 0; i < 22; i++) {
    a = E.pl[i]; if (!a.on) continue;
    var sp = .62;
    if (a.sprint) { sp = a.sprint; a.sprint = 0; }
    else { var dd = hyp(a.tg[0] - a.x, a.tg[1] - a.y); sp = cl(.4 + dd / 14, .45, .85); }
    if (B.owner === a) { sp = a.dribble > 0 ? .92 : .5; a.tg = dribbleTarget(a); }
    steer(a, a.tg[0], a.tg[1], a.spd * sp * (.78 + .22 * a.stam), dt);
    a.stam = Math.max(.35, a.stam - dt * CLOCK * (hyp(a.vx, a.vy) / 8) * (hyp(a.vx, a.vy) / 8) / 5400 * .65 * (1.2 - a.a.pac * .01));
    a.cool = Math.max(0, a.cool - dt); a.tkcd = Math.max(0, a.tkcd - dt);
    if (a.dribble > 0) a.dribble -= dt;
    if (a.dive !== undefined && !(B.shot && B.shot.gk === a)) a.dive = undefined;
  }
  // séparation
  for (i = 0; i < 22; i++) { var p = E.pl[i]; if (!p.on) continue; for (var j = i + 1; j < 22; j++) { var q2 = E.pl[j]; if (!q2.on) continue; var dx = q2.x - p.x, dy = q2.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 3.2 && d2 > .0001) { var d = Math.sqrt(d2), f = (1.8 - d) * .5 / d; p.x -= dx * f; p.y -= dy * f; q2.x += dx * f; q2.y += dy * f; } } }
  // balle
  stepBall(E, dt);
  // stats
  if (M) {
    M.min = Math.min(130, Math.floor(E.clk / 60));
    M.ps = Math.round(100 * E.pos[0] / (E.pos[0] + E.pos[1]));
    M.bx = cl(B.x / PW * 100, 0, 100); M.by = cl(B.y / PH * 100, 0, 100);
  }
  E.pl.forEach(function (p) { p.chase = 0; });
}

function dribbleTarget(a) {
  var t = a.t, dir = dirOf(t), gx = goalX(t);
  var tx = a.x + dir * 12, ty = a.y + (PH / 2 - a.y) * .28;
  var o = nearestOpp(a, a.x + dir * 3, a.y);
  if (o.o && o.d < 7) { ty += (a.y - o.o.y >= 0 ? 1 : -1) * 6; }
  return [cl(tx, 1, PW - 1), cl(ty, 1, PH - 1)];
}

function steer(a, tx, ty, vmax, dt) {
  var dx = tx - a.x, dy = ty - a.y, d = hyp(dx, dy);
  var v = vmax;
  if (d < 3) v *= d / 3;
  var dvx = d > .05 ? dx / d * v : 0, dvy = d > .05 ? dy / d * v : 0;
  var ax = dvx - a.vx, ay = dvy - a.vy, al = hyp(ax, ay), mx = 7.5 * dt;
  if (al > mx) { ax = ax / al * mx; ay = ay / al * mx; }
  a.vx += ax; a.vy += ay;
  a.x += a.vx * dt; a.y += a.vy * dt;
  a.x = cl(a.x, -1, PW + 1); a.y = cl(a.y, -1, PH + 1);
  if (hyp(a.vx, a.vy) > .6) { var f = Math.atan2(a.vy, a.vx), df = f - a.face; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; a.face += df * Math.min(1, dt * 9); }
}

function restartTargets(E) {
  var R = E.restart, tk = R.taker, t = R.t;
  R.timer += DT;
  E.pl.forEach(function (p) {
    if (!p.on) return;
    if (p === tk) { p.tg = [R.x - dirOf(t) * .9 * (R.type === 'throw' ? 0 : 1), R.y + (R.type === 'throw' ? (R.y < PH / 2 ? -.5 : .5) : 0)]; p.sprint = 1; return; }
    var box = (R.type === 'corner' || R.type === 'pen') || (R.type === 'free' && depthOf(t, R.x) > .7);
    if (box && p.line > 0 && !(p.t === t && p.line === 1 && p.hd < .3)) {
      var gx = goalX(t), s = (p.i * 13 % 11) - 5;
      if (R.type === 'pen') { var ax = gx - dirOf(t) * (p.t === t ? 21 : 20); p.tg = [ax, PH / 2 + (p.i % 11 - 5) * 3]; }
      else p.tg = [gx - dirOf(t) * (6 + ((p.i * 5) % 9)), PH / 2 + s * 2.4];
    }
    if (p.line === 0 && p.t === t && R.type === 'goalkick') p.tg = [R.x, R.y];
  });
  var d = tk ? hyp(tk.x - (R.x - dirOf(t) * .9), tk.y - R.y) : 0;
  if (d < .9 || R.timer > 5) {
    if (R.type === 'pen') { if (R.timer < 2.6) return; }
    else if (R.timer < 1.4 && R.type !== 'throw') return;
    E.restart = null; B.owner = tk; B.last = tk; tk.cool = .3; tk.dribble = 0; tk.hold = 0;
    if (R.type === 'pen') { B.owner = null; doShot(tk); E.restart = {type: 'pen', t: t, taker: tk, timer: 99}; E.restart = null; }
  }
}

function stepBall(E, dt) {
  var o = B.owner;
  if (E.restart) { B.vx = B.vy = 0; B.x = E.restart.x; B.y = E.restart.y; return; }
  if (o) {
    if (!o.on) { B.owner = null; return; }
    B.prev = B.prevOwner !== o ? B.last : B.prev;
    B.prevOwner = o;
    var fx = Math.cos(o.face), fy = Math.sin(o.face);
    B.x += (o.x + fx * .75 - B.x) * Math.min(1, dt * 14); B.y += (o.y + fy * .75 - B.y) * Math.min(1, dt * 14);
    B.vx = o.vx; B.vy = o.vy; B.last = o; E.poss = o.t;
    o.st.tc++;
    // décision
    o.hold = (o.hold || 0) - dt;
    if (!(o.cool > 0) && !(o.dribble > 0) && o.hold <= 0) { o.hold = .25 + rnd() * .35 - (E.tp[o.t].tempo - 1) * .8; carrierThink(o); if (B.owner === o && !(o.dribble > 0)) o.dribble = .4; }
    else if (o.dribble <= 0 && o.cool <= 0 && o.hold > 0 && o.hold < .05) { }
    // tacle
    for (var i = 0; i < 22; i++) {
      var d = E.pl[i]; if (d.t === o.t || !d.on || d.tkcd > 0) continue;
      var dd = hyp(d.x - o.x, d.y - o.y);
      if (dd < 1.7) {
        d.tkcd = 1.0 + rnd() * .8;
        d.st.tk++;
        var p = cl(.34 + (d.a.tck - o.a.dri) * .022 + (d.stam - o.stam) * .15, .12, .7);
        if (rnd() < p) {
          d.st.tkw++;
          B.owner = null; B.prev = o; B.last = d; B.vx = (rnd() - .5) * 6; B.vy = (rnd() - .5) * 6; B.passTo = null;
          if (rnd() < .6) { B.owner = d; d.cool = .35; d.dribble = 0; d.hold = .3; E.poss = d.t; }
          else E.poss = d.t;
          o.cool = .5;
          if (rnd() < .5) evt('🛡', d.name + ' récupère le ballon');
        } else if (rnd() < .22) { foul(d, o); }
        break;
      }
    }
    return;
  }
  // balle libre
  var sp = hyp(B.vx, B.vy);
  B.x += B.vx * dt; B.y += B.vy * dt;
  var fr = B.shot ? .1 : .55; var k = Math.exp(-fr * dt);
  B.vx *= k; B.vy *= k;
  B.age = (B.age || 0) + dt;
  var sh = B.shot;
  if (sh) {
    // but ?
    var gxl = goalX(sh.t);
    var crossed = sh.t === 0 ? B.x >= gxl : B.x <= gxl;
    if (sh.out === 'block' && B.age > sh.blkAt) {
      B.shot = null; B.vx = (rnd() - .5) * 18; B.vy = (rnd() - .5) * 18; B.last = nearestOpp(sh.a, B.x, B.y).o || B.last; E.poss = 1 - sh.t; evt('🛡', 'Tir contré !');
      return;
    }
    if (sh.out === 'save' && sh.gk) {
      var dg2 = hyp(sh.gk.x - B.x, sh.gk.y - B.y);
      if (dg2 < 1.9 || crossed) {
        var r = rnd(); sh.gk.st.sv++;
        if (r < .58) { B.owner = sh.gk; B.last = sh.gk; sh.gk.hold = 1.6; sh.gk.cool = .8; E.poss = sh.gk.t; evt('🧤', 'Arrêt de ' + sh.gk.name); B.vx = B.vy = 0; B.x = sh.gk.x + (sh.t === 0 ? -.5 : .5); B.y = sh.gk.y; }
        else if (r < .85) { B.vx = (sh.t === 0 ? 1 : -1) * (3 + rnd() * 2); B.vy = (B.y > PH / 2 ? 1 : -1) * (7 + rnd() * 5); B.last = sh.gk; evt('🧤', sh.gk.name + ' détourne en corner'); }
        else { B.vx = -(sh.t === 0 ? 1 : -1) * (5 + rnd() * 4); B.vy = (rnd() - .5) * 12; B.last = sh.gk; evt('🧤', 'Repoussé par ' + sh.gk.name + ' !'); E.poss = sh.gk.t; }
        B.shot = null; B.passTo = null;
        return;
      }
    }
    if (crossed) {
      if (sh.out === 'goal') { goalScored(sh.t, sh.a); return; }
      if (sh.out === 'off') { B.shot = null; B.last = sh.a; }
    }
  }
  // sortie
  if (B.x < 0 || B.x > PW || B.y < 0 || B.y > PH) { if (B.shot && B.shot.out === 'goal') { return; } B.shot = null; outOfPlay(); return; }
  if (B.shot && B.age > 5) B.shot = null;
  // contrôle du ballon
  var best = null, bp = 0;
  for (var i2 = 0; i2 < 22; i2++) {
    var p2 = E.pl[i2]; if (!p2.on || p2.cool > 0) continue;
    var d3 = hyp(p2.x - B.x, p2.y - B.y);
    var isR = (p2 === B.passTo);
    var rad = 1.15 + (isR ? .9 : 0) + (p2.line === 0 ? .9 : 0);
    if (d3 > rad) continue;
    if (B.shot && p2.line !== 0) continue;
    if (B.shot && p2.line === 0) { if (p2.t === B.shot.t) continue; }
    var s = hyp(B.vx, B.vy);
    var base = isR ? .98 : .5;
    base *= cl(1.15 - s / 40, .35, 1);
    base *= (.6 + p2.a.cmp / 25 + p2.a.dri / 80);
    var pr = 1 - Math.pow(1 - cl(base, 0, 1), dt * 30);
    if (rnd() < pr) { best = p2; break; }
  }
  if (best) {
    if (B.passTo && best === B.passTo) { if (B.last) { B.last.st.po++; } }
    else if (B.passTo && best.t !== B.passTo.t) { best.st.tk++; best.st.tkw++; evt('✂', best.name + ' intercepte'); }
    B.prev = B.last; B.owner = best; B.passTo = null; B.shot = null; B.vx = B.vy = 0; B.last = best; E.poss = best.t;
    best.cool = .25; best.dribble = 0; best.hold = .25 + rnd() * .25;
    // reprise de volée pour le GK
    if (best.line === 0) { best.hold = 1.3; }
  }
}

/* ---------- remplacements IA & blessures ---------- */
function aiSubs(E) {
  var min = E.clk / 60;
  if (!E.ai) { E.ai = {n: 0}; }
  var t = M && M.u === 0 ? 1 : 0;
  if (E.ai.n < 3 && min > E.nextSub[E.ai.n]) {
    var tm = E.teams[t];
    var tired = null, ts = 9;
    E.pl.forEach(function (p) { if (p.t === t && p.on && p.line > 0 && p.stam < ts) { ts = p.stam; tired = p; } });
    if (tired && tm.bench && tm.bench.length) {
      var sub = null, sb = -1; tm.bench.forEach(function (b) { var s = fit(b, tired.code) * 100 + b.ovr * .3; if (s > sb) { sb = s; sub = b; } });
      if (sub) doSub(t, tired, sub);
    }
    E.ai.n++;
  }
}

function doSub(t, a, sub) {
  var E = ENG, tm = E.teams[t];
  var idx = tm.bench.indexOf(sub); if (idx >= 0) tm.bench.splice(idx, 1);
  tm.bench.push(a.p);
  a.mins = Math.floor(E.clk / 60);
  E.subLog = E.subLog || [];
  E.subLog.push({t: t, off: a.p, on: sub, min: a.mins});
  evt('🔄', 'Remplacement (' + E.teams[t].name + ') : ' + sub.name + ' entre à la place de ' + a.name);
  a.p = sub; a.name = sub.name; a.num = sub.num; a.a = sub.a || mkAttr(sub.pos, sub.ovr, rnd); a.stam = 1; a.fit = fit(sub, a.code);
  a.spd = (6.6 + a.a.pac * .13) * (.88 + a.fit * .12); a.id = sub.id; a.yc = 0; a.st = {pa: 0, po: 0, sh: 0, g: 0, ast: 0, tk: 0, tkw: 0, sv: 0, tc: 0, fo: 0}; a.mins = 0;
  tm.subs++;
}

/* ---------- avance par temps réel ---------- */
var ACC = 0;
function physicsTick(real) {
  var E = ENG; if (!E || !M || M.phase !== 'live' || M.paused) return;
  var n = M.speed * real * 60 * 2;   // x1 = 2x temps réel
  ACC += n;
  var steps = 0;
  while (ACC >= 1 && steps < 40) {
    ACC -= 1; steps++;
    if (E.pause > 0) { E.pause -= DT; E.pl.forEach(function (p) { if (p.on) steer(p, p.x, p.y, 0, DT); }); continue; }
    stepEngine(DT);
    if (M.phase !== 'live') break;
  }
  if (steps >= 40) ACC = 0;
}

function skipMatch() {
  var E = ENG, guard = 0;
  while (M.phase === 'live' && guard < 400000) {
    if (E.pause > 0) E.pause -= DT; else stepEngine(DT);
    guard++;
    if (M.phase === 'ht') { startSecondHalf(); }
  }
}
function startSecondHalf() {
  var E = ENG; if (!E.ht) return;
  E.ht = false; E.half = 2; E.clk = 2700 + E.stopA * 60 + 1; M.phase = 'live';
  placeKickoff(E, 1 - (E.firstKick == null ? 0 : E.firstKick)); E.pause = 1;
}
  // --- Engine source ends ---

  // Existing engine player data use named attributes; these adapters supply the
  // compact numerical attributes expected by Claude's movement/decision model.

  const basePlayerAdaptersReady = true;
  const actualDraw = draw;
