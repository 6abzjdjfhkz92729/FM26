/* FM26 Pro Career Layer — role-aware match preparation, individual roles,
   weekly training, assists and match ratings. Additive extension of the existing S/M engine. */
(function () {
  'use strict';

  const clampPro = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const intPro = (v, lo, hi) => Math.round(clampPro(v, lo, hi));
  const escPro = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr = (p, key, fallback) => {
    const v = Number(p && p.a && p.a[key]);
    return Number.isFinite(v) ? v : (fallback == null ? 10 : fallback);
  };
  const grp = pos => (typeof GRP === 'object' && GRP[pos]) || 'M';

  const ROLE_BOOK = [
    {name:'Goalkeeper · Défense',positions:['GK'],weights:{'Handling':3,'Reflexes':3,'One On Ones':3,'Positioning':2,'Anticipation':2,'Concentration':2,'Communication':1,'Passing':1,'Composure':1}},
    {name:'Gardien libéro · Soutien',positions:['GK'],weights:{'Reflexes':3,'One On Ones':2,'Anticipation':3,'Decisions':2,'Passing':2,'First Touch':1,'Pace':1,'Communication':1}},
    {name:'Latéral · Soutien',positions:['DR','DL'],weights:{'Tackling':2,'Marking':2,'Positioning':2,'Stamina':2,'Pace':2,'Acceleration':2,'Passing':1,'Crossing':1,'Teamwork':1}},
    {name:'Piston · Attaque',positions:['DR','DL'],weights:{'Stamina':3,'Pace':3,'Acceleration':3,'Crossing':3,'Dribbling':2,'Work Rate':2,'Off The Ball':1,'Tackling':1}},
    {name:'Latéral inversé · Soutien',positions:['DR','DL'],weights:{'Passing':3,'Technique':2,'First Touch':2,'Decisions':2,'Vision':2,'Positioning':2,'Tackling':1,'Teamwork':1}},
    {name:'Défenseur central · Défense',positions:['DC'],weights:{'Marking':3,'Tackling':3,'Positioning':3,'Anticipation':2,'Concentration':2,'Heading':2,'Strength':2,'Jumping Reach':1}},
    {name:'Défenseur relanceur · Défense',positions:['DC'],weights:{'Passing':3,'Technique':2,'Vision':2,'Decisions':2,'Marking':2,'Tackling':2,'Composure':2,'Positioning':1}},
    {name:'Sentinelle · Défense',positions:['DM'],weights:{'Positioning':3,'Anticipation':3,'Marking':2,'Tackling':2,'Decisions':2,'Teamwork':2,'Concentration':2,'Passing':1}},
    {name:'Milieu récupérateur · Défense',positions:['DM','MC'],weights:{'Tackling':3,'Aggression':2,'Work Rate':3,'Stamina':2,'Teamwork':2,'Anticipation':2,'Marking':2,'Strength':1}},
    {name:'Meneur reculé · Soutien',positions:['DM','MC'],weights:{'Passing':3,'Vision':3,'First Touch':2,'Technique':2,'Decisions':3,'Composure':2,'Teamwork':1,'Positioning':1}},
    {name:'Milieu central · Soutien',positions:['MC'],weights:{'Passing':2,'First Touch':2,'Technique':2,'Teamwork':2,'Decisions':2,'Work Rate':2,'Stamina':2,'Vision':1,'Positioning':1}},
    {name:'Box-to-box · Soutien',positions:['MC'],weights:{'Stamina':3,'Work Rate':3,'Off The Ball':2,'Passing':2,'Tackling':2,'Pace':1,'Strength':1,'Determination':1}},
    {name:'Meneur de jeu avancé · Attaque',positions:['MC','AMC'],weights:{'Vision':3,'Passing':3,'Technique':2,'First Touch':2,'Flair':2,'Decisions':2,'Composure':2,'Dribbling':1}},
    {name:'Milieu offensif · Attaque',positions:['AMC'],weights:{'First Touch':2,'Technique':2,'Vision':2,'Passing':2,'Dribbling':2,'Off The Ball':2,'Flair':2,'Finishing':1,'Decisions':1}},
    {name:'Second attaquant · Attaque',positions:['AMC'],weights:{'Off The Ball':3,'Finishing':2,'Acceleration':2,'Composure':2,'Anticipation':2,'Dribbling':2,'Technique':1,'Pace':1}},
    {name:'Ailier · Soutien',positions:['AMR','AML'],weights:{'Dribbling':3,'Pace':3,'Acceleration':3,'Crossing':3,'Technique':2,'Off The Ball':2,'Flair':1,'Work Rate':1}},
    {name:'Ailier intérieur · Attaque',positions:['AMR','AML'],weights:{'Dribbling':3,'Finishing':2,'Off The Ball':3,'Acceleration':2,'Pace':2,'Technique':2,'Composure':1,'First Touch':1}},
    {name:'Attaquant avancé · Attaque',positions:['ST'],weights:{'Finishing':3,'Off The Ball':3,'Anticipation':3,'Composure':2,'Acceleration':2,'Pace':2,'First Touch':1,'Heading':1}},
    {name:'Faux neuf · Soutien',positions:['ST'],weights:{'First Touch':3,'Passing':3,'Vision':2,'Technique':2,'Dribbling':2,'Decisions':2,'Off The Ball':2,'Finishing':1}}
  ];

  const DEFAULT_ROLE = {
    GK:'Goalkeeper · Défense', DR:'Latéral · Soutien', DL:'Latéral · Soutien',
    DC:'Défenseur central · Défense', DM:'Sentinelle · Défense',
    MC:'Milieu central · Soutien', AMC:'Milieu offensif · Attaque',
    AMR:'Ailier · Soutien', AML:'Ailier · Soutien', ST:'Attaquant avancé · Attaque'
  };

  const TRAINING = {
    'Repos': {desc:'Baisser la charge et restaurer les organismes.',condition:9,attributes:[],familiarity:0,morale:1,risk:0},
    'Physique': {desc:'Développer l’endurance, la vitesse et la puissance.',condition:-7,attributes:['Stamina','Strength','Pace','Acceleration','Agility','Natural Fitness','Work Rate'],familiarity:0,morale:0,risk:0.011},
    'Technique': {desc:'Améliorer la qualité de passe, le premier contrôle et la finition.',condition:-5,attributes:['Passing','First Touch','Technique','Dribbling','Finishing','Crossing','Long Shots'],familiarity:0,morale:0,risk:0.004},
    'Tactique': {desc:'Travailler les décisions, le placement et les automatismes du onze.',condition:-3,attributes:['Decisions','Positioning','Anticipation','Teamwork','Vision','Concentration'],familiarity:3,morale:0,risk:0.002},
    'Préparation de match': {desc:'Préparer le plan de jeu, les déplacements et les transitions.',condition:-2,attributes:['Concentration','Decisions','Anticipation','Positioning','Teamwork'],familiarity:5,morale:0,risk:0.002},
    'Récupération': {desc:'Favoriser le retour à la fraîcheur et réduire la charge médicale.',condition:11,attributes:[],familiarity:0,morale:1,risk:0},
    'Cohésion': {desc:'Renforcer les liens, la communication et les efforts collectifs.',condition:-1,attributes:['Teamwork','Leadership','Determination','Work Rate'],familiarity:1,morale:3,risk:0.001},
    'Développement jeunes': {desc:'Individualiser la progression des joueurs de moins de 22 ans.',condition:-2,attributes:['First Touch','Passing','Decisions','Technique','Stamina','Off The Ball'],familiarity:0,morale:1,risk:0.003}
  };
  const INTENSITY = {'Légère':{load:.58,growth:.65,risk:.45},'Normale':{load:1,growth:1,risk:1},'Intense':{load:1.36,growth:1.26,risk:1.9}};
  const FOCUS = {
    'Équilibré':[],
    'Technique':['Corners','Crossing','Dribbling','Finishing','First Touch','Free Kick Taking','Heading','Long Shots','Passing','Technique'],
    'Mental':['Aggression','Anticipation','Bravery','Composure','Concentration','Decisions','Determination','Flair','Leadership','Off The Ball','Positioning','Teamwork','Vision','Work Rate'],
    'Physique':['Acceleration','Agility','Balance','Jumping Reach','Natural Fitness','Pace','Stamina','Strength'],
    'Défense':['Marking','Tackling','Heading','Positioning','Anticipation','Concentration','Strength','Jumping Reach'],
    'Attaque':['Finishing','Dribbling','Off The Ball','Vision','Crossing','Composure','Acceleration','First Touch'],
    'Gardiens':['Reflexes','One On Ones','Handling','Aerial Reach','Command of Area','Kicking','Throwing']
  };

  function ensureState() {
    if (!S || !Array.isArray(S.sq)) return;
    S.tc = S.tc || {};
    S.tc.slotRoles = Array.isArray(S.tc.slotRoles) ? S.tc.slotRoles : [];
    S.tc.roleFamiliarity = S.tc.roleFamiliarity && typeof S.tc.roleFamiliarity === 'object' ? S.tc.roleFamiliarity : {};
    S.tc.trainingSession = TRAINING[S.tc.trainingSession] ? S.tc.trainingSession : 'Tactique';
    S.tc.trainingIntensity = INTENSITY[S.tc.trainingIntensity] ? S.tc.trainingIntensity : 'Normale';
    S.tc.trainingFocus = FOCUS[S.tc.trainingFocus] ? S.tc.trainingFocus : 'Équilibré';
    S.tc.trainingLastFixture = S.tc.trainingLastFixture || '';
    S.proTrainingHistory = Array.isArray(S.proTrainingHistory) ? S.proTrainingHistory : [];
    S.proMatchHistory = Array.isArray(S.proMatchHistory) ? S.proMatchHistory : [];
    S.sq.forEach(p => {
      p.a = p.a && typeof p.a === 'object' ? p.a : {};
      if (p.pos === 'GK') ['Reflexes','One On Ones','Handling','Aerial Reach','Command of Area','Kicking','Throwing','Communication'].forEach(key => {
        if (p.a[key] == null) p.a[key] = clampPro(Math.round((Number(p.ovr)||65)/5.2 + ((typeof hash === 'function' ? hash(String(p.id)+key) : 2) % 5) - 2), 2, 20);
      });
      p.ast = Number.isFinite(Number(p.ast)) ? Number(p.ast) : (Number(p.assists) || 0);
      p.assists = p.ast;
      p.ratingTotal = Number.isFinite(Number(p.ratingTotal)) ? Number(p.ratingTotal) : 0;
      p.ratingCount = Number.isFinite(Number(p.ratingCount)) ? Number(p.ratingCount) : 0;
      p.lastRating = Number.isFinite(Number(p.lastRating)) ? Number(p.lastRating) : null;
      p.trainingGains = Number.isFinite(Number(p.trainingGains)) ? Number(p.trainingGains) : 0;
    });
  }

  function formationNow() {
    const form = S && S.tc && S.tc.f;
    return (typeof FM === 'object' && FM && FM[form]) ? FM[form] : (FM && FM['4-3-3']) || [];
  }
  function xiNow() {
    try {
      if (M && Array.isArray(M.lu) && M.lu.length === 11) return M.lu.slice();
      return typeof xi === 'function' ? xi().slice(0, 11) : [];
    } catch (e) { return []; }
  }
  function isRoleValid(role, pos) {
    const def = ROLE_BOOK.find(r => r.name === role);
    return !!def && def.positions.includes(pos);
  }
  function roleForSlot(index, pos) {
    const saved = S && S.tc && S.tc.slotRoles && S.tc.slotRoles[index];
    return isRoleValid(saved, pos) ? saved : (DEFAULT_ROLE[pos] || ROLE_BOOK.find(r => r.positions.includes(pos))?.name || 'Milieu central · Soutien');
  }
  function slotFamiliarity(player, role) {
    const k = String(player && player.id) + '|' + role;
    const v = Number(S && S.tc && S.tc.roleFamiliarity[k]);
    return Number.isFinite(v) ? clampPro(v, 0, 100) : 52;
  }
  function roleGrade(player, slot, index) {
    if (!player) return 50;
    const pos = slot && slot[2] ? slot[2] : (player.pos || 'MC');
    const role = roleForSlot(index, pos);
    const def = ROLE_BOOK.find(r => r.name === role) || ROLE_BOOK.find(r => r.positions.includes(pos)) || ROLE_BOOK[10];
    const w = def.weights;
    let sum = 0, total = 0;
    Object.keys(w).forEach(key => { sum += attr(player, key, 10) * w[key]; total += w[key]; });
    const technical = total ? sum / total : 10;
    const ovr = Number(player.ovr) || technical * 5;
    const condition = Number(player.cond == null ? 85 : player.cond);
    const moral = Number(player.mrl == null ? player.morale == null ? 70 : player.morale : player.mrl);
    const form = Number(player.form == null ? 7 : player.form);
    const familiarity = slotFamiliarity(player, role);
    const posFit = player.pos === pos ? 2 : (grp(player.pos) === grp(pos) ? 0 : -4);
    return clampPro(technical * 5 * .72 + ovr * .28 + (condition - 85) * .055 + (moral - 70) * .028 + (form - 7) * .65 + (familiarity - 52) * .035 + posFit, 30, 98);
  }
  function attributeAverage(players, keys) {
    const items = (players || []).filter(Boolean);
    if (!items.length) return 10;
    let total = 0, n = 0;
    items.forEach(p => keys.forEach(k => { total += attr(p, k, 10); n++; }));
    return n ? total / n : 10;
  }
  function teamRoleMetrics(players) {
    const line = formationNow();
    const list = (players || []).slice(0, 11);
    const entries = list.map((p, i) => ({p, i, pos:(line[i] && line[i][2]) || p.pos || 'MC', grade:roleGrade(p,line[i],i), role:roleForSlot(i,(line[i] && line[i][2]) || p.pos || 'MC')}));
    const ovr = entries.length ? entries.reduce((a,x)=>a+(Number(x.p.ovr)||60),0)/entries.length : 60;
    const weighted = key => {
      const weights = {G:key==='attack'?0.25:0.45,D:key==='attack'?0.62:1.32,M:1,A:key==='attack'?1.32:0.62};
      let n=0,d=0;
      entries.forEach(x=>{const q=weights[grp(x.pos)]||1;n+=x.grade*q;d+=q;});
      return d?n/d:ovr;
    };
    const attack=weighted('attack');
    const defense=weighted('defense');
    const condition=entries.length?entries.reduce((a,x)=>a+(Number(x.p.cond)||0),0)/entries.length:85;
    const wide=entries.filter(x=>['DR','DL','AMR','AML'].includes(x.pos)).map(x=>x.p);
    let synergyA=0,synergyD=0;
    const press=Number(S.tc.press == null ? 50 : S.tc.press);
    const lineHeight=Number(S.tc.line == null ? 50 : S.tc.line);
    const tempo=Number(S.tc.tempo == null ? 50 : S.tc.tempo);
    const width=Number(S.tc.width == null ? 50 : S.tc.width);
    if(press>=72){const work=attributeAverage(list,['Work Rate','Stamina','Aggression']);synergyA+=work>=13?1.2:-1.1;synergyD+=work>=13?.6:-.6;}
    if(lineHeight>=72){const pace=attributeAverage(entries.filter(x=>grp(x.pos)==='D').map(x=>x.p),['Pace','Acceleration','Anticipation']);synergyD+=pace>=12.5?.9:-1;}
    if(tempo>=72){const pass=attributeAverage(list,['Passing','First Touch','Technique','Decisions']);synergyA+=pass>=13?.8:-.7;}
    if(width>=72){const crossing=attributeAverage(wide,['Crossing','Pace','Acceleration']);synergyA+=crossing>=13?.8:-.6;}
    const style=String(S.tc.s || 'Control Possession');
    if(/Tiki-Taka|Control Possession/i.test(style)){const a=attributeAverage(list,['Passing','First Touch','Technique','Vision']);synergyA+=(a-12)*.18;}
    if(/Gegenpress/i.test(style)){const a=attributeAverage(list,['Work Rate','Stamina','Teamwork']);synergyA+=(a-12)*.14;synergyD+=(a-12)*.1;}
    if(/Wing Play/i.test(style)){const a=attributeAverage(wide,['Crossing','Pace','Dribbling']);synergyA+=(a-12)*.17;}
    if(/Route One|Direct/i.test(style)){const a=attributeAverage(entries.filter(x=>grp(x.pos)==='A').map(x=>x.p),['Heading','Strength','Pace']);synergyA+=(a-12)*.14;}
    if(/Counter/i.test(style)){const a=attributeAverage(list,['Pace','Off The Ball','Decisions']);synergyA+=(a-12)*.13;}
    return {attack,defense,ovr,condition,synergyA,synergyD,entries};
  }

  function applyRoleModifiers() {
    if (!M || M.proRoleAppliedBase == null || !M.proRoleMetrics) return;
    const r = M.proRoleMetrics;
    const attackFactor = clampPro(1 + (r.attack - r.ovr) * .004 + r.synergyA * .004, .88, 1.12);
    const defenseFactor = clampPro(1 + (r.defense - r.ovr) * .004 + r.synergyD * .004, .88, 1.12);
    if (Array.isArray(M.proBaseM) && Array.isArray(M.m)) {
      M.m = M.proBaseM.slice();
      if (M.m.length) M.m[0] = clampPro(M.proBaseM[0] * attackFactor, .4, 2.0);
    }
    if (Number.isFinite(Number(M.proBaseOp))) M.op = clampPro(Number(M.proBaseOp) / defenseFactor, 5, 25);
    M.proRoleFactors = {attack:attackFactor,defense:defenseFactor};
    if (M.stats) {
      M.stats.roleAnalysis = {
        attack:+r.attack.toFixed(1),defense:+r.defense.toFixed(1),base:+r.ovr.toFixed(1),
        attackFactor:+attackFactor.toFixed(3),defenseFactor:+defenseFactor.toFixed(3)
      };
    }
  }

  function staffMultiplier(key) {
    let score = 0, found = false;
    (S.staff || []).forEach(p => {
      if (new RegExp(key === 'medical' ? 'médical|médecin|physique' : 'entraîneur|adjoint|préparateur','i').test(String(p.role || p.speciality || ''))) {
        score += Number(p.quality || p.level || 10); found = true;
      }
    });
    const quality = found ? score / Math.max(1,(S.staff || []).filter(p=>new RegExp(key === 'medical' ? 'médical|médecin|physique' : 'entraîneur|adjoint|préparateur','i').test(String(p.role || p.speciality || ''))).length) : 11;
    const phase = S.stx && Number(S.stx[key === 'medical' ? 'med' : 'ent']);
    return clampPro(.72 + quality/45 + (Number.isFinite(phase)?(phase-3)*.035:0), .75, 1.35);
  }
  function trainingAttributeSet(session, focus) {
    const base = (TRAINING[session] && TRAINING[session].attributes) || [];
    const f = FOCUS[focus] || [];
    if (!f.length) return base.slice();
    if (!base.length) return [];
    const overlap = base.filter(k=>f.includes(k));
    return overlap.length ? overlap : f.slice(0,5);
  }
  function applyTrainingForFixture(fixture) {
    ensureState();
    if (!S || !fixture || !S.sq.length) return;
    const fixtureKey = String(fixture.id == null ? (fixture.date || S.date) + '|' + fixture.home + '|' + fixture.away : fixture.id);
    if (S.tc.trainingLastFixture === fixtureKey) return;
    const session = TRAINING[S.tc.trainingSession] ? S.tc.trainingSession : 'Tactique';
    const intensityName = INTENSITY[S.tc.trainingIntensity] ? S.tc.trainingIntensity : 'Normale';
    const intensity = INTENSITY[intensityName];
    const plan = TRAINING[session];
    const attrs = trainingAttributeSet(session, S.tc.trainingFocus);
    const coach = staffMultiplier('coach');
    const medical = staffMultiplier('medical');
    const playerSet = S.sq.concat(session === 'Développement jeunes' ? (S.youth || []) : []);
    let gains = 0, rested = 0, injuries = 0, moraleChange = 0;
    playerSet.forEach(p => {
      if (!p || (session === 'Développement jeunes' && Number(p.age) > 21) || (S.tc.trainingFocus === 'Gardiens' && p.pos !== 'GK')) return;
      const load = intensity.load;
      const baseCondition = Number(p.cond == null ? 85 : p.cond);
      p.cond = clampPro(baseCondition + plan.condition * load * (session === 'Récupération' ? medical : 1), 20, 100);
      if (plan.condition > 0) rested++;
      if (plan.morale) {
        const moraleKey = p.mrl != null ? 'mrl' : 'morale';
        p[moraleKey] = clampPro(Number(p[moraleKey] == null ? 70 : p[moraleKey]) + plan.morale * load, 0, 100);
        moraleChange += plan.morale * load;
      }
      if (session === 'Récupération' && Number(p.inj || 0) > 0 && Math.random() < .22 * medical) p.inj = Math.max(0, Number(p.inj)-1);
      if (attrs.length && Number(p.ovr || 0) < Number(p.pot || 99) + 1) {
        const chance = clampPro(.075 * intensity.growth * coach * (Number(p.age) <= 21 ? 1.3 : Number(p.age) >= 30 ? .45 : 1), .01, .22);
        if (Math.random() < chance) {
          let filtered = attrs;
          if (session === 'Développement jeunes' && p.pos === 'GK') filtered = ['Decisions','Concentration','Positioning','Passing','Composure'];
          const key = filtered[Math.floor(Math.random()*filtered.length)];
          p.a = p.a || {};
          p.a[key] = clampPro((Number(p.a[key]) || 10) + 1, 2, 20);
          p.trainingGains = (Number(p.trainingGains) || 0) + 1;
          gains++;
          if (p.trainingGains % 6 === 0 && Number(p.ovr) < Number(p.pot || 99) && Number(p.age) < 29) {
            p.ovr = clampPro(Number(p.ovr)+1, 45, 95);
            p.val = Math.max(Number(p.val)||1, Math.round(p.ovr*p.ovr/120));
          }
        }
      }
      if (plan.risk && intensity.risk && Number(p.inj||0)<=0 && Math.random() < plan.risk*intensity.risk*(1.05-medical*.25)) {
        p.inj = Math.max(1, Math.round(1 + Math.random()*2));
        injuries++;
      }
    });
    if (plan.familiarity) {
      const roster = xiNow(), form = formationNow();
      roster.forEach((p,i) => {
        const pos = form[i] && form[i][2] || p.pos;
        const role = roleForSlot(i,pos);
        const key = String(p.id)+'|'+role;
        S.tc.roleFamiliarity[key] = clampPro(slotFamiliarity(p,role) + plan.familiarity*intensity.growth,0,100);
      });
    }
    const record = {
      key:fixtureKey,date:fixture.date || S.date,match:(fixture.home || S.club)+' – '+(fixture.away || ''),
      session,intensity:intensityName,focus:S.tc.trainingFocus,gains,rested,injuries,
      conditionDelta:plan.condition*intensity.load,moraleDelta:moraleChange
    };
    S.proTrainingHistory.unshift(record);
    S.proTrainingHistory = S.proTrainingHistory.slice(0,20);
    S.tc.trainingLastFixture = fixtureKey;
    if (typeof sv === 'function') sv();
  }

  function roleFamiliarityAverage(players, formation) {
    const entries = players.map((p,i)=>slotFamiliarity(p,roleForSlot(i,(formation[i]&&formation[i][2])||p.pos)));
    return entries.length ? Math.round(entries.reduce((a,b)=>a+b,0)/entries.length) : 0;
  }
  function renderTraining() {
    ensureState();
    const squad = S.sq || [];
    const session = S.tc.trainingSession;
    const intensity = S.tc.trainingIntensity;
    const focus = S.tc.trainingFocus;
    const average = squad.length ? Math.round(squad.reduce((a,p)=>a+(Number(p.cond)||0),0)/squad.length) : 0;
    const injuries = squad.filter(p=>Number(p.inj||0)>0 || Number(p.susp||0)>0).length;
    const tired = squad.filter(p=>Number(p.cond||0)<65).length;
    const coach = staffMultiplier('coach');
    const medical = staffMultiplier('medical');
    const history = S.proTrainingHistory.slice(0,6).map(h =>
      '<div class="fm26-pro-history-row"><span><b>'+escPro(h.session)+'</b><small>'+escPro(h.match)+'</small></span><span>'+escPro(h.intensity)+'</span><b style="color:'+(h.gains?'#95df8b':'#d4d5de')+'">'+h.gains+' amélioration(s)</b></div>'
    ).join('') || '<div class="fm26-pro-empty">La séance sera appliquée au lancement de la prochaine rencontre.</div>';
    const sessions = Object.keys(TRAINING).map(name => {
      const t = TRAINING[name];
      return '<button type="button" class="fm26-pro-session'+(name===session?' active':'')+'" data-pro-session="'+escPro(name)+'"><b>'+escPro(name)+'</b><small>'+escPro(t.desc)+'</small><span class="fm26-pro-session-meta">'+(t.condition>0?'Condition +'+t.condition+'%':t.condition<0?'Charge '+t.condition+'%':'Charge légère')+' · '+(t.risk>0?'Risque physique':'Risque faible')+'</span></button>';
    }).join('');
    const intensities = Object.keys(INTENSITY).map(name => '<button type="button" class="fm26-pro-chip'+(name===intensity?' active':'')+'" data-pro-intensity="'+escPro(name)+'">'+escPro(name)+'</button>').join('');
    const focuses = Object.keys(FOCUS).map(name => '<option value="'+escPro(name)+'"'+(name===focus?' selected':'')+'>'+escPro(name)+'</option>').join('');
    const attrs = trainingAttributeSet(session,focus);
    return '<div class="fm26-pro-training-root">'+
      '<section class="fm26-pro-panel" style="left:22px;top:25px;width:1120px;height:782px">'+
        '<div class="fm26-pro-panel-head"><span>PLAN D’ENTRAÎNEMENT</span><small>'+escPro(S.club)+' · prochaine rencontre</small></div>'+
        '<div class="fm26-pro-training-grid">'+sessions+'</div>'+
        '<div class="fm26-pro-training-footer"><div><b>Objectif de séance</b><p>'+escPro(TRAINING[session].desc)+'</p><small>Attributs ciblés : '+escPro(attrs.length?attrs.join(', '):'récupération et moral')+'</small></div><div><b>Intensité</b><div class="fm26-pro-chip-row">'+intensities+'</div><label for="fm26-pro-focus">Focus individuel</label><select id="fm26-pro-focus">'+focuses+'</select><small>Une séance est appliquée une seule fois au lancement du prochain match.</small></div></div>'+
      '</section>'+
      '<section class="fm26-pro-panel" style="left:1160px;top:25px;width:612px;height:782px">'+
        '<div class="fm26-pro-panel-head"><span>ÉTAT DU GROUPE</span><small>Staff inclus</small></div>'+
        '<div class="fm26-pro-kpis"><div><small>Condition moyenne</small><b>'+average+'%</b><i><span style="width:'+average+'%"></span></i></div><div><small>Joueurs fatigués</small><b>'+tired+'</b><small>Condition sous 65%</small></div><div><small>Indisponibles</small><b>'+injuries+'</b><small>Blessés ou suspendus</small></div><div><small>Coach</small><b>'+coach.toFixed(2)+'×</b><small>Impact progression</small></div></div>'+
        '<div class="fm26-pro-training-section-title">HISTORIQUE DES SÉANCES</div><div class="fm26-pro-history">'+history+'</div>'+
        '<div class="fm26-pro-training-section-title">CONSEIL DE L’ADJOINT</div><div class="fm26-pro-advice">'+(average<65?'Le groupe est fatigué. Privilégie une séance de récupération ou du repos.':tired>4?'Plusieurs joueurs sont en dessous de 65% de condition. Réduis l’intensité.':intensity==='Intense'?'L’intensité élevée peut accélérer les progrès, mais augmente le risque de blessure.':'La charge actuelle semble raisonnable. La préparation tactique améliore les automatismes du onze.')+'</div>'+
        '<div class="fm26-pro-staffline"><span>Récupération médicale</span><b>'+medical.toFixed(2)+'×</b></div>'+
      '</section>'+
    '</div>';
  }

  const proCSS = [
    '.fm26-pro-training-root{position:relative;width:1792px;height:833px;overflow:hidden;color:#f4f4f7;font-family:Barlow Condensed,Arial,sans-serif}',
    '.fm26-pro-panel{position:absolute;box-sizing:border-box;overflow:hidden;background:linear-gradient(150deg,rgba(64,66,74,.9),rgba(34,36,44,.96));border:1px solid #555761;box-shadow:0 14px 34px #0004,inset 0 1px 0 #ffffff0c}',
    '.fm26-pro-panel-head{height:57px;background:linear-gradient(180deg,#777980,#595b62);display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 16px;font-size:26px;font-weight:800;letter-spacing:.03em;box-sizing:border-box}',
    '.fm26-pro-panel-head small{font-size:16px;font-weight:500;color:#dddde5;letter-spacing:0}',
    '.fm26-pro-training-grid{position:absolute;left:14px;right:14px;top:71px;bottom:255px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:9px}',
    '.fm26-pro-session{min-width:0;text-align:left;display:flex;flex-direction:column;gap:5px;padding:11px 12px;background:linear-gradient(140deg,#363943,#292b33);color:#f3f3f6;border:1px solid #4b4e59;border-radius:3px;font:inherit;cursor:pointer;transition:background .14s,border-color .14s,transform .14s}',
    '.fm26-pro-session:hover{background:#424550;border-color:#777b89;transform:translateY(-1px)}.fm26-pro-session.active{background:linear-gradient(135deg,#563a78,#32253e);border-color:#c59aff;box-shadow:inset 3px 0 0 #d49aff}',
    '.fm26-pro-session b{font-size:21px;line-height:1.05}.fm26-pro-session small{font-size:15px;color:#d0d1d9;line-height:1.2}.fm26-pro-session-meta{font-size:14px;color:#c1c3cc;margin-top:auto}',
    '.fm26-pro-training-footer{position:absolute;left:14px;right:14px;bottom:14px;height:226px;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:13px;background:#272931;border:1px solid #444751;box-sizing:border-box}',
    '.fm26-pro-training-footer b{font-size:20px}.fm26-pro-training-footer p{font-size:17px;color:#e0e1e8;line-height:1.3;margin:6px 0}.fm26-pro-training-footer small{display:block;color:#c2c4ce;font-size:14px;margin-top:6px;line-height:1.25}',
    '.fm26-pro-chip-row{display:flex;gap:6px;margin:6px 0 9px}.fm26-pro-chip{padding:6px 11px;background:#3b3e48;border:1px solid #575b67;color:white;cursor:pointer;font:700 15px Barlow Condensed,Arial,sans-serif}.fm26-pro-chip.active{background:linear-gradient(100deg,#ff3d86,#a744e8);border-color:#e6a0ff}',
    '.fm26-pro-training-footer label{display:block;font-size:14px;color:#d6d7df;margin:5px 0 3px}.fm26-pro-training-footer select{width:100%;padding:7px;background:#171920;color:#fff;border:1px solid #555966;font:600 16px Barlow Condensed,Arial,sans-serif}',
    '.fm26-pro-kpis{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:14px}',
    '.fm26-pro-kpis>div{min-width:0;background:#2c2e37;border:1px solid #454853;padding:11px}.fm26-pro-kpis small{display:block;color:#c7c8d0;font-size:14px;line-height:1.2}.fm26-pro-kpis b{display:block;font-size:31px;line-height:1.15;margin:4px 0}.fm26-pro-kpis i{display:block;height:6px;background:#171920;margin-top:6px}.fm26-pro-kpis i span{display:block;height:100%;background:linear-gradient(90deg,#55b86b,#b5ec84)}',
    '.fm26-pro-training-section-title{background:#50525b;padding:9px 14px;font-size:19px;font-weight:800;margin-top:3px}',
    '.fm26-pro-history{padding:5px 13px;max-height:270px;overflow:auto}.fm26-pro-history-row{display:flex;justify-content:space-between;align-items:center;gap:7px;padding:9px 0;border-bottom:1px solid #ffffff12;font-size:15px}.fm26-pro-history-row span:first-child{min-width:0;display:block}.fm26-pro-history-row b{font-size:16px}.fm26-pro-history-row small{display:block;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#bfc1cb;font-size:13px}',
    '.fm26-pro-empty{padding:14px 0;color:#bfc1cb;font-size:16px;line-height:1.35}.fm26-pro-advice{padding:12px 14px;color:#e0e1e8;font-size:17px;line-height:1.4;min-height:80px}.fm26-pro-staffline{display:flex;justify-content:space-between;padding:9px 14px;border-top:1px solid #ffffff12;font-size:16px}.fm26-pro-staffline span{color:#c6c8d1}',
    '.fm26-pro-role-card .fm26-pro-role-row{display:grid;grid-template-columns:34px minmax(0,1fr) minmax(185px,.9fr) 62px;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #ffffff12;font-size:15px}',
    '.fm26-pro-role-number{width:28px;height:28px;display:grid;place-items:center;background:#41434c;border:1px solid #686b77;font-size:15px;font-weight:800}',
    '.fm26-pro-role-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:800}.fm26-pro-role-pos{display:block;font-size:13px;font-weight:500;color:#c5c7d0}',
    '.fm26-pro-role-row select{width:100%;min-width:0;padding:6px 7px;background:#20222a;border:1px solid #5b5e69;color:#fff;font:600 14px Barlow Condensed,Arial,sans-serif}',
    '.fm26-pro-role-fit{font-size:14px;text-align:right;color:#a9e09c;font-weight:800}.fm26-pro-role-fit.low{color:#ffc56b}',
    '.fm26-pro-role-note{padding:9px 12px;background:#252730;font-size:14px;line-height:1.3;color:#d0d2db}',
    '.fm26-pro-training-rail{position:absolute!important;left:109px!important;top:844px!important;width:99px!important;height:74px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;color:#fff!important;background:transparent!important;cursor:pointer!important;z-index:10!important}',
    '.fm26-pro-training-rail:after{content:"";position:absolute;left:9px;right:13px;bottom:-24px;height:2px;background:#2b2f44}.fm26-pro-training-rail.active{background:linear-gradient(90deg,#ff3d86,#d42fe6)!important}.fm26-pro-training-rail svg{width:48px;height:48px;stroke:#fff;fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}',
    '.fm26-pro-post{margin-top:12px}.fm26-pro-rating{font-weight:800;color:#fff}.fm26-pro-rating.good{color:#91e17f}.fm26-pro-rating.low{color:#ff9da6}',
    '@media(max-width:800px){.fm26-pro-training-grid{grid-template-columns:1fr;grid-template-rows:repeat(8,minmax(72px,auto));bottom:270px;overflow:auto}.fm26-pro-training-footer{grid-template-columns:1fr;height:246px;overflow:auto}.fm26-pro-role-card .fm26-pro-role-row{grid-template-columns:30px minmax(0,1fr) minmax(140px,.9fr);}.fm26-pro-role-fit{display:none}}'
  ].join('\n');
  if (!document.getElementById('fm26-pro-career-style')) {
    const style = document.createElement('style');
    style.id = 'fm26-pro-career-style';
    style.textContent = proCSS;
    document.head.appendChild(style);
  }

  V.training = renderTraining;

  function injectRolePanel() {
    if (!S || S.view !== 'tactics') return;
    const side = document.querySelector('.fm26-dnd-side');
    if (!side || side.querySelector('.fm26-pro-role-card')) return;
    ensureState();
    const line = formationNow();
    const lineup = xiNow();
    const rows = lineup.map((p,i) => {
      const pos = line[i] && line[i][2] || (p && p.pos) || 'MC';
      const role = roleForSlot(i,pos);
      const choices = ROLE_BOOK.filter(r=>r.positions.includes(pos)).map(r => '<option value="'+escPro(r.name)+'"'+(r.name===role?' selected':'')+'>'+escPro(r.name)+'</option>').join('');
      const grade = roleGrade(p,line[i],i);
      const fit = clampPro(Math.round(grade),30,99);
      return '<div class="fm26-pro-role-row"><span class="fm26-pro-role-number">'+(i+1)+'</span><span class="fm26-pro-role-name">'+escPro(p && p.name || 'Joueur')+'<small class="fm26-pro-role-pos">'+escPro(pos)+' · GEN '+escPro(p && p.ovr || '—')+'</small></span><select data-pro-role-slot="'+i+'" aria-label="Rôle de '+escPro(p && p.name || 'joueur')+'">'+choices+'</select><span class="fm26-pro-role-fit'+(fit<62?' low':'')+'">'+fit+'/100</span></div>';
    }).join('');
    const panel = '<div class="fm26-dnd-box-panel fm26-pro-role-card"><div class="fm26-dnd-box-title">RÔLES INDIVIDUELS · 19 RÔLES</div>'+rows+'<div class="fm26-pro-role-note">Le rôle modifie l’évaluation tactique de chaque joueur. La qualité du rôle, la condition, le moral et les automatismes influencent le moteur de match.</div></div>';
    side.insertAdjacentHTML('beforeend', panel);
    side.querySelectorAll('[data-pro-role-slot]').forEach(select => {
      select.addEventListener('change', () => {
        const i = Number(select.dataset.proRoleSlot);
        S.tc.slotRoles[i] = select.value;
        const p = xiNow()[i];
        if (p) {
          const key = String(p.id)+'|'+select.value;
          if (S.tc.roleFamiliarity[key] == null) S.tc.roleFamiliarity[key] = 45;
        }
        if (typeof sv === 'function') sv();
        render();
      });
    });
  }

  function injectTrainingRail() {
    const rail = $('side');
    if (!rail) return;
    let btn = rail.querySelector('[data-fm26-pro-training]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fm26-pro-training-rail';
      btn.setAttribute('data-fm26-pro-training','1');
      btn.setAttribute('title','Entraînement');
      btn.setAttribute('aria-label','Entraînement');
      btn.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 35V13h28v22M6 35h36M17 13V7h14v6M16 21h16M16 27h16"/><path d="M21 21v6M27 21v6"/></svg>';
      rail.appendChild(btn);
    }
    btn.classList.toggle('active', !!S && S.view === 'training');
  }
  const rail = $('side');
  if (rail && !rail.dataset.fm26ProTrainingBound) {
    rail.dataset.fm26ProTrainingBound = '1';
    rail.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest('[data-fm26-pro-training]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (!S) return;
      const menu = $('fm26-ref-menu');
      if (menu) menu.classList.remove('show');
      S.view = 'training';
      render();
    }, true);
  }

  function wireTraining() {
    if (!S || S.view !== 'training') return;
    const root = document.querySelector('.fm26-pro-training-root');
    if (!root) return;
    root.querySelectorAll('[data-pro-session]').forEach(btn => btn.addEventListener('click', () => {
      S.tc.trainingSession = btn.dataset.proSession;
      if (typeof sv === 'function') sv();
      render();
    }));
    root.querySelectorAll('[data-pro-intensity]').forEach(btn => btn.addEventListener('click', () => {
      S.tc.trainingIntensity = btn.dataset.proIntensity;
      if (typeof sv === 'function') sv();
      render();
    }));
    const focus = root.querySelector('#fm26-pro-focus');
    if (focus) focus.addEventListener('change', () => {
      S.tc.trainingFocus = focus.value;
      if (typeof sv === 'function') sv();
      render();
    });
  }

  /* FM26 MANAGER PORTRAIT PICKER — generic portraits, stored in the active career. */
  const FM26_MANAGER_PORTRAITS = [
    {label:'Portrait 01', url:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=360&h=420&fit=crop&crop=faces'},
    {label:'Portrait 02', url:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=360&h=420&fit=crop&crop=faces'},
    {label:'Portrait 03', url:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=360&h=420&fit=crop&crop=faces'},
    {label:'Portrait 04', url:'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=360&h=420&fit=crop&crop=faces'},
    {label:'Portrait 05', url:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=360&h=420&fit=crop&crop=faces'},
    {label:'Portrait 06', url:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=360&h=420&fit=crop&crop=faces'}
  ];
  let selectedManagerPortrait = 0;

  function managerPortraitIndex() {
    const stored = S && S.mgrPortraitIndex != null ? Number(S.mgrPortraitIndex) : selectedManagerPortrait;
    return intPro(Number.isFinite(stored) ? stored : 0, 0, FM26_MANAGER_PORTRAITS.length - 1);
  }

  function managerPortraitUrl() {
    return FM26_MANAGER_PORTRAITS[managerPortraitIndex()].url;
  }

  function installManagerPortraitPicker() {
    const setupRoot = $('setup');
    const brand = setupRoot && setupRoot.querySelector('.setup-brand');
    if (!brand || document.getElementById('fm26-manager-portrait-picker')) return;

    if (S && S.mgrPortraitIndex != null) selectedManagerPortrait = managerPortraitIndex();

    const css = [
      '#fm26-manager-portrait-picker{margin:0 0 20px;padding:14px 16px;border:1px solid #343b50;border-radius:13px;background:linear-gradient(145deg,#171d2d,#111725)}',
      '#fm26-manager-portrait-picker .fm26-portrait-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}',
      '#fm26-manager-portrait-picker .fm26-portrait-heading strong{font-size:13px;color:#f3f2ff}',
      '#fm26-manager-portrait-picker .fm26-portrait-heading span{font-size:11px;color:#a7afc8}',
      '#fm26-manager-portrait-picker .fm26-coach-portraits{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}',
      '#fm26-manager-portrait-picker .fm26-coach-choice{min-width:0;padding:5px;background:#0d1220;border:2px solid #30384c;border-radius:10px;color:#dbe3f8;text-align:center;transition:border-color .16s,transform .16s,background .16s}',
      '#fm26-manager-portrait-picker .fm26-coach-choice img{display:block;width:100%;height:92px;object-fit:cover;object-position:center 28%;border-radius:6px;background:#242b3e}',
      '#fm26-manager-portrait-picker .fm26-coach-choice small{display:block;padding:6px 0 2px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#fm26-manager-portrait-picker .fm26-coach-choice.selected{border-color:#a993ff;background:#30234c;box-shadow:0 0 0 1px #a993ff35}',
      '#fm26-manager-portrait-picker .fm26-coach-choice:hover{transform:translateY(-2px);border-color:#8f7adb}',
      '.fm26-manager-avatar{overflow:hidden;background:#20283b}',
      '.fm26-manager-avatar img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 28%}',
      '@media(max-width:720px){#fm26-manager-portrait-picker .fm26-coach-portraits{grid-template-columns:repeat(3,minmax(0,1fr))}#fm26-manager-portrait-picker .fm26-coach-choice img{height:106px}}'
    ].join('\n');
    if (!document.getElementById('fm26-manager-portrait-style')) {
      const style = document.createElement('style');
      style.id = 'fm26-manager-portrait-style';
      style.textContent = css;
      document.head.appendChild(style);
    }

    const section = document.createElement('section');
    section.id = 'fm26-manager-portrait-picker';
    section.setAttribute('aria-label', 'Choix du portrait de manager');
    section.innerHTML =
      '<div class="fm26-portrait-heading"><strong>PORTRAIT DU MANAGER</strong><span>Choisis ton apparence avant de lancer la carrière</span></div>' +
      '<div class="fm26-coach-portraits">' +
      FM26_MANAGER_PORTRAITS.map((p, i) =>
        '<button type="button" class="fm26-coach-choice' + (i === selectedManagerPortrait ? ' selected' : '') +
        '" data-fm26-coach-portrait="' + i + '" aria-pressed="' + (i === selectedManagerPortrait ? 'true' : 'false') + '">' +
        '<img src="' + escPro(p.url) + '" alt="' + escPro(p.label) + '" loading="lazy">' +
        '<small>' + escPro(p.label) + '</small></button>'
      ).join('') +
      '</div>';
    brand.insertAdjacentElement('afterend', section);

    section.addEventListener('click', function (event) {
      const button = event.target && event.target.closest('[data-fm26-coach-portrait]');
      if (!button) return;
      selectedManagerPortrait = intPro(button.dataset.fm26CoachPortrait, 0, FM26_MANAGER_PORTRAITS.length - 1);
      section.querySelectorAll('[data-fm26-coach-portrait]').forEach(el => {
        const active = Number(el.dataset.fm26CoachPortrait) === selectedManagerPortrait;
        el.classList.toggle('selected', active);
        el.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
  }

  /* Save the selected portrait to the same career object as the existing game. */
  const previousStartCareerForPortrait = startCareer;
  startCareer = function () {
    previousStartCareerForPortrait.apply(this, arguments);
    if (S) {
      S.mgrPortraitIndex = selectedManagerPortrait;
      if (typeof sv === 'function') sv();
    }
  };

  /* Reuse the existing manager screen and replace only its decorative avatar. */
  if (V && typeof V.mgr === 'function' && !V.mgr.__fm26PortraitWrapped) {
    const previousManagerViewForPortrait = V.mgr;
    const managerViewWithPortrait = function () {
      const html = previousManagerViewForPortrait.apply(this, arguments);
      const portrait = '<div class="av fm26-manager-avatar" style="width:100%;height:150px;border-radius:0"><img src="' +
        escPro(managerPortraitUrl()) + '" alt="Portrait du manager"></div>';
      return String(html).replace('<div class="av" style="width:100%;height:150px;border-radius:0"></div>', portrait);
    };
    managerViewWithPortrait.__fm26PortraitWrapped = true;
    V.mgr = managerViewWithPortrait;
  }

  const previousStartMatch = startMatch;
  startMatch = function () {
    ensureState();
    const fixture = typeof nxt === 'function' ? nxt() : null;
    if (fixture) applyTrainingForFixture(fixture);
    previousStartMatch();
    if (!M || !M.f) return;
    ensureState();
    M.proStartPlayerStats = {};
    S.sq.forEach(p => {
      M.proStartPlayerStats[p.id] = {g:Number(p.g)||0,ast:Number(p.ast)||0,yellow:Number(p.yellow)||0};
    });
    const lineup = xiNow();
    M.proRoleMetrics = teamRoleMetrics(lineup);
    M.proXIIds = lineup.map(p=>p.id);
    M.proAssistEvents = [];
    M.proCreditedScoreStates = [];
    M.proLastProcessedH = Number(M.h)||0;
    M.proLastProcessedA = Number(M.a)||0;
    M.proRoleAppliedBase = true;
    M.proBaseM = Array.isArray(M.m) ? M.m.slice() : null;
    M.proBaseOp = Number.isFinite(Number(M.op)) ? Number(M.op) : null;
    M.proRoleMetrics.familiarity = roleFamiliarityAverage(lineup,formationNow());
    applyRoleModifiers();
  };

  function weightedPick(items, weightFn) {
    if (!items.length) return null;
    const weights = items.map(p=>Math.max(.1,Number(weightFn(p))||.1));
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for (let i=0;i<items.length;i++){r-=weights[i];if(r<=0)return items[i];}
    return items[items.length-1];
  }
  function recordGoalAssists() {
    if (!M || !M.f || !S) return;
    const h = Number(M.h)||0, a = Number(M.a)||0;
    const oldH = Number(M.proLastProcessedH)||0, oldA = Number(M.proLastProcessedA)||0;
    const countH = Math.max(0,h-oldH), countA = Math.max(0,a-oldA);
    if (!countH && !countA) return;
    const goals = [];
    for (let i=0;i<countH;i++) goals.push(M.f.home);
    for (let i=0;i<countA;i++) goals.push(M.f.away);
    const userGoalsThisTick = S.club === M.f.home ? countH : countA;
    const userScorerIds = userGoalsThisTick > 0 && Array.isArray(M.scr) ? M.scr.slice(-userGoalsThisTick) : [];
    let userScorerIndex = 0;
    goals.forEach(team => {
      if (team !== S.club) return;
      const lineup = xiNow();
      const scorerId = userScorerIds[userScorerIndex++];
      const scorer = scorerId != null ? S.sq.find(p=>Number(p.id)===Number(scorerId)) : S.sq.find(p=>p.name===M.lastScorer);
      if (Math.random() < .80) {
        const options = lineup.filter(p=>p && p.pos!=='GK' && (!scorer || p.id!==scorer.id));
        const assister = weightedPick(options,p=>attr(p,'Passing',10)*.55+attr(p,'Vision',10)*.25+attr(p,'Teamwork',10)*.12+attr(p,'Crossing',10)*.08);
        if (assister) {
          assister.ast = (Number(assister.ast)||0)+1;
          assister.assists = assister.ast;
          M.proAssistEvents.push({min:Number(M.min)||0,player:assister.name,scorer:scorer && scorer.name || M.lastScorer || 'Buteur',team:team});
          if (M.stats) {
            if (!Array.isArray(M.stats.assists)) M.stats.assists=[0,0];
            M.stats.assists[team===M.f.home?0:1]++;
          }
        } else {
          M.proAssistEvents.push({min:Number(M.min)||0,player:'',scorer:scorer && scorer.name || M.lastScorer || 'Buteur',team:team});
        }
      } else {
        M.proAssistEvents.push({min:Number(M.min)||0,player:'',scorer:scorer && scorer.name || M.lastScorer || 'Buteur',team:team});
      }
    });
    M.proLastProcessedH = h;
    M.proLastProcessedA = a;
  }

  function calculatePlayerRatings() {
    if (!M || !M.f || !S || M.proRatingsDone) return;
    const home = M.f.home === S.club;
    const userGoals = home ? Number(M.h)||0 : Number(M.a)||0;
    const oppGoals = home ? Number(M.a)||0 : Number(M.h)||0;
    const result = userGoals>oppGoals ? 1 : userGoals<oppGoals ? -1 : 0;
    const currentLineup = xiNow();
    const form = formationNow();
    const ids = Array.from(new Set([].concat(M.proXIIds || [], currentLineup.map(p=>p&&p.id).filter(id=>id!=null))));
    const players = ids.map(id=>S.sq.find(p=>Number(p.id)===Number(id))).filter(Boolean);
    const ratings = [];
    players.forEach(p => {
      if (!p) return;
      const currentIndex = currentLineup.findIndex(x=>x && Number(x.id)===Number(p.id));
      const startIndex = (M.proXIIds || []).findIndex(id=>Number(id)===Number(p.id));
      const i = currentIndex >= 0 ? currentIndex : Math.max(0,startIndex);
      const role = roleForSlot(i,(form[i]&&form[i][2])||p.pos);
      const start = (M.proStartPlayerStats && M.proStartPlayerStats[p.id]) || {g:0,ast:0,yellow:0};
      const goals = Math.max(0,(Number(p.g)||0)-start.g);
      const assists = Math.max(0,(Number(p.ast)||0)-start.ast);
      const yellow = Math.max(0,(Number(p.yellow)||0)-start.yellow);
      const grade = roleGrade(p,form[i],i);
      const resultMod = result>0?.38:result<0?-.28:0;
      const performance = clampPro(6.25 + (grade-65)*.026 + resultMod + goals*1.05 + assists*.72 - yellow*.18 + (Number(p.cond||80)-75)*.008 + (Math.random()-.4)*.38,4.5,9.9);
      p.lastRating = Number(performance.toFixed(1));
      p.ratingTotal = (Number(p.ratingTotal)||0) + p.lastRating;
      p.ratingCount = (Number(p.ratingCount)||0) + 1;
      p.averageRating = Number((p.ratingTotal/Math.max(1,p.ratingCount)).toFixed(2));
      p.form = Number(clampPro((Number(p.form)||6.7)*.63 + p.lastRating*.37,5,9.8).toFixed(2));
      ratings.push({id:p.id,name:p.name,pos:p.pos,role:role,rating:p.lastRating,goals:goals,assists:assists,condition:Math.round(Number(p.cond)||0),grade:Number(grade.toFixed(1))});
    });
    ratings.sort((a,b)=>b.rating-a.rating);
    M.proPlayerRatings = ratings;
    M.proRatingsDone = true;
    const fixture = M.f;
    if (!fixture.stats || typeof fixture.stats !== 'object') fixture.stats = {};
    fixture.stats.proMatch = {
      playerRatings:ratings,assists:(M.proAssistEvents||[]).slice(),
      roleAnalysis:M.stats && M.stats.roleAnalysis || null,
      xg:Array.isArray(M.xg)?M.xg.slice():M.stats && Array.isArray(M.stats.xg)?M.stats.xg.slice():[0,0],
      shots:Array.isArray(M.sh)?M.sh.slice():[0,0],
      shotsOnTarget:Array.isArray(M.sot)?M.sot.slice():M.stats && Array.isArray(M.stats.shotsOnTarget)?M.stats.shotsOnTarget.slice():[0,0],
      possession:Number(M.ps)||50
    };
    S.proMatchHistory.unshift({date:fixture.date||S.date,home:fixture.home,away:fixture.away,score:String(M.h)+'-'+String(M.a),result:result,top:ratings.slice(0,3).map(r=>({name:r.name,rating:r.rating})),roleAnalysis:fixture.stats.proMatch.roleAnalysis});
    S.proMatchHistory = S.proMatchHistory.slice(0,60);
    if (typeof sv === 'function') sv();
  }

  const previousTick = tick;
  tick = function () {
    if (M && !M.done) {
      M.proLastProcessedH = Number(M.h)||0;
      M.proLastProcessedA = Number(M.a)||0;
    }
    previousTick();
    if (M && M.f) recordGoalAssists();
  };

  const previousEndMatch = endMatch;
  endMatch = function () {
    if (M && M.f) recordGoalAssists();
    previousEndMatch();
    if (M && M.f) calculatePlayerRatings();
  };

  if (window.XE && typeof window.XE.tac === 'function') {
    const priorTac = window.XE.tac;
    window.XE.tac = function () {
      const r = priorTac.apply(this,arguments);
      if (M && !M.done) {
        if (typeof MEN === 'object' && MEN[S.tc.m] && typeof STY === 'object' && STY[S.tc.s || 'Control Possession']) M.m = MEN[S.tc.m].map((v,i)=>v*STY[S.tc.s || 'Control Possession'][i]);
        M.proBaseM = Array.isArray(M.m) ? M.m.slice() : null;
        M.proRoleMetrics = teamRoleMetrics(xiNow());
        applyRoleModifiers();
      }
      return r;
    };
  }

  if (window.XE && typeof window.XE.sub === 'function') {
    const priorSub = window.XE.sub;
    window.XE.sub = function () {
      const result = priorSub.apply(this, arguments);
      if (M && !M.done) {
        M.proRoleMetrics = teamRoleMetrics(xiNow());
        applyRoleModifiers();
      }
      return result;
    };
  }

  const previousPost = V.post;
  if (typeof previousPost === 'function') {
    V.post = function () {
      const base = previousPost();
      const m = M;
      if (!m || !m.f || !m.proPlayerRatings || !m.proPlayerRatings.length) return base;
      const home = m.f.home;
      const away = m.f.away;
      const xg = Array.isArray(m.xg) ? m.xg : m.stats && m.stats.xg || [0,0];
      const sot = Array.isArray(m.sot) ? m.sot : m.stats && m.stats.shotsOnTarget || [0,0];
      const shots = Array.isArray(m.sh) ? m.sh : m.stats && m.stats.shots || [0,0];
      const pcHome = Number(m.ps)||50;
      const detail = m.proPlayerRatings.map(p =>
        '<tr><td>'+escPro(p.name)+'</td><td>'+escPro(p.pos)+'</td><td>'+escPro(p.role)+'</td><td><span class="fm26-pro-rating'+(p.rating>=7.5?' good':p.rating<6?' low':'')+'">'+p.rating.toFixed(1)+'</span></td><td>'+(p.goals||0)+'</td><td>'+(p.assists||0)+'</td></tr>'
      ).join('');
      const assists = (m.proAssistEvents||[]).map(e => '<div class="ar"><span>'+(e.min||'—')+'′ · '+escPro(e.scorer)+'</span><b>'+(e.player?'Passe décisive : '+escPro(e.player):'Sans passe décisive')+'</b></div>').join('') || '<p class="mu">Aucune passe décisive enregistrée.</p>';
      const pro = '<div class="pn fm26-pro-post"><h3>Analyse de performance · moteur avancé</h3><div class="gr g3">'+
        '<div class="pn"><h3>Buts attendus (xG)</h3><div class="big" style="font-size:26px">'+Number(xg[0]||0).toFixed(2)+' – '+Number(xg[1]||0).toFixed(2)+'</div><p class="mu">'+escPro(home)+' · '+escPro(away)+'</p></div>'+
        '<div class="pn"><h3>Tirs cadrés</h3><div class="big" style="font-size:26px">'+Number(sot[0]||0)+' – '+Number(sot[1]||0)+'</div><p class="mu">Possession : '+pcHome+'% – '+(100-pcHome)+'%</p></div>'+
        '<div class="pn"><h3>Qualité tactique</h3><div class="big" style="font-size:26px">'+(m.proRoleMetrics?Number(m.proRoleMetrics.attack).toFixed(1)+' / '+Number(m.proRoleMetrics.defense).toFixed(1):'—')+'</div><p class="mu">Attaque / défense, notes pondérées par les rôles.</p></div></div>'+
        '<h3 style="margin-top:16px">Notes individuelles</h3><table><thead><tr><th>Joueur</th><th>Pos.</th><th>Rôle</th><th>Note</th><th>Buts</th><th>Passes déc.</th></tr></thead><tbody>'+detail+'</tbody></table>'+
        '<h3 style="margin-top:16px">Buts et passes décisives</h3>'+assists+'</div>';
      return base + pro;
    };
  }

  const previousRender = render;
  render = function () {
    ensureState();
    previousRender();
    injectTrainingRail();
    if (S && S.view === 'tactics') injectRolePanel();
    if (S && S.view === 'training') wireTraining();
  };

  ensureState();
  injectTrainingRail();
  if (S && S.view === 'training') wireTraining();
})();