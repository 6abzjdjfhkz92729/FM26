/* FM26 — couche carrière avancée. Module original, chargé après les systèmes Phase 1 et 2. */
(()=>{
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const money=n=>'€'+Math.round(n||0).toLocaleString('fr-FR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).slice(0,120);
const row=(a,b)=>`<div class="ar"><span>${a}</span><b>${b}</b></div>`;
const ensure=()=>{
 if(!S||!Array.isArray(S.sq))return;
 S.options=S.options||{speed:170,animations:true};S.tc=S.tc||{};S.tc.press=clamp(S.tc.press==null?50:S.tc.press,0,100);S.tc.line=clamp(S.tc.line==null?50:S.tc.line,0,100);S.tc.tempo=clamp(S.tc.tempo==null?50:S.tc.tempo,0,100);S.tc.width=clamp(S.tc.width==null?50:S.tc.width,0,100);
 S.managerRep=clamp(S.managerRep==null?20:S.managerRep,0,100);
 S.history=Array.isArray(S.history)?S.history:[];
 S.shortlist=Array.isArray(S.shortlist)?S.shortlist:[];
 S.scoutMissions=Array.isArray(S.scoutMissions)?S.scoutMissions:[];
 S.pressLog=Array.isArray(S.pressLog)?S.pressLog:[];
 S.jobOffers=Array.isArray(S.jobOffers)?S.jobOffers:[];
 S.objectives=S.objectives||{position:BIG.includes(S.club)?4:10,youthPromotions:1,spendLimit:Math.max(5,(S.bud||20)*.75)};
 S.lineup=Array.isArray(S.lineup)?S.lineup:[];
 S.subsUsed=Number(S.subsUsed)||0;
 S.clubObj=S.clubObj||{stadium:'Stade Municipal',capacity:25000,training:2,youth:2};
 S.clubObj.training=clamp(S.clubObj.training||2,1,5);S.clubObj.youth=clamp(S.clubObj.youth||2,1,5);S.clubObj.stadiumLevel=clamp(S.clubObj.stadiumLevel||1,1,5);
 S.sq.forEach((p,i)=>{p.morale=clamp(p.morale==null?70:p.morale,0,100);p.status=p.status||'Rotation';p.personality=p.personality||['Professionnel','Ambitieux','Calme','Compétiteur'][Math.abs((p.id||i)*7)%4];p.susp=clamp(p.susp||0,0,10);p.yellow=clamp(p.yellow||0,0,5);p.end=p.end||2028;});
};
const initCareer=()=>{
 ensure();if(!S)return;
 if(!S.statusesInitialized){S.sq.forEach((p,i)=>{p.status=i<11?'Titulaire':i<17?'Rotation':'Jeune';});S.statusesInitialized=true;}
 if(!S.goalsSet){S.boardGoals=[{id:'league',title:S.objectives.position<=4?'Finir dans le top 4':'Finir dans la première moitié',desc:'Objectif sportif',done:false},{id:'youth',title:'Faire débuter un jeune',desc:'Développement du club',done:false},{id:'budget',title:'Respecter le budget transferts',desc:'Gestion financière',done:false}];S.goalsSet=true;}
 if(!S.lineup.length){try{S.lineup=xi().map(p=>p.id)}catch(e){S.lineup=[]}}
};
const oldStart=startCareer;
startCareer=function(){oldStart();if(S){initCareer();mail('Directeur sportif','Projet sportif initialisé','Tes objectifs sont définis. Consulte le Portail du club, le Centre de recrutement et la Gestion des contrats pour préparer la saison.');sv();render()}};

/* Les compositions tiennent compte des blessures et suspensions ; une composition modifiable reste persistante. */
const baseXI=xi;
xi=function(){
 if(!S||!Array.isArray(S.sq)||!S.tc)return baseXI();
 const form=FM[S.tc.f]||FM['4-3-3'];
 const available=S.sq.filter(p=>(p.inj||0)<=0&&(p.susp||0)<=0);
 if(available.length<11)return baseXI();
 let preferred=Array.isArray(S.lineup)?S.lineup:[];
 if(preferred.length<11){const first=baseXI();preferred=first.map(p=>p.id);S.lineup=preferred.slice()}
 const used=new Set(),chosen=[];
 for(let i=0;i<form.length;i++){
  const pos=form[i][2];
  let p=available.find(q=>q.id===preferred[i]&&!used.has(q.id));
  if(!p)p=available.filter(q=>!used.has(q.id)&&q.pos===pos).sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0];
  if(!p)p=available.filter(q=>!used.has(q.id)&&GRP[q.pos]===GRP[pos]).sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0];
  if(!p)p=available.filter(q=>!used.has(q.id)).sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0];
  if(p){used.add(p.id);chosen.push(p)}
 }
 if(chosen.length===11){S.lineup=chosen.map(p=>p.id)}
 return chosen;
};

/* Contract hub: renewals affect wage bill, deal length and the budget. */
V.contracts=function(){ensure();return `<div class="gr" style="grid-template-columns:minmax(0,1fr) 290px"><div class="pn"><h3>Contrats et statut des joueurs</h3><table><tr><th>Joueur</th><th>Poste</th><th>Âge</th><th>Statut</th><th>Salaire / semaine</th><th>Fin</th><th>Action</th></tr>${S.sq.slice().sort((a,b)=>(a.end||2029)-(b.end||2029)).map(p=>`<tr><td><b>${esc(p.name)}</b><br><small class="mu">Moral ${p.morale}/100</small></td><td>${p.pos}</td><td>${p.age}</td><td><select aria-label="Statut ${esc(p.name)}" onchange="FM26A.role(${p.id},this.value)">${['Joueur clé','Titulaire','Rotation','Remplaçant','Jeune'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td>${money(p.sal)}</td><td>30/06/${p.end}</td><td><button class="chip" onclick="FM26A.renew(${p.id})">Prolonger</button></td></tr>`).join('')}</table></div><div class="pn"><h3>Vue contrats</h3><div class="big">${S.sq.filter(p=>(p.end||2030)<=2027).length}</div><p class="mu">Contrats à surveiller dans les 12 prochains mois</p>${row('Masse salariale / sem.',money(S.sq.reduce((a,p)=>a+(p.sal||0),0)))}${row('Budget transferts',money((S.bud||0)*1000000))}<p class="mu">Les prolongations augmentent le salaire estimé et peuvent demander une prime de signature.</p></div></div>`};

/* Recrutement progressif : missions, cibles sauvegardées et rapport différé. */
V.scouting=function(){ensure();const opts=Object.keys(LG).map(x=>`<option>${esc(x)}</option>`).join('');return `<div class="gr" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="pn"><h3>Missions de recrutement</h3><div class="row"><div><label>Championnat</label><select id="scLeague">${opts}</select></div><div><label>Poste recherché</label><select id="scPos">${['Tous',...Object.keys(GRP)].map(x=>`<option>${x}</option>`).join('')}</select></div></div><div class="row"><div><label>Âge maximum</label><select id="scAge"><option>21</option><option selected>25</option><option>29</option><option>35</option></select></div><div><label>Durée</label><select id="scWeeks"><option value="1">1 semaine</option><option value="2" selected>2 semaines</option><option value="4">4 semaines</option></select></div></div><button class="btn" onclick="FM26A.mission()">Lancer la mission · €0,2 M</button><h3 style="margin-top:16px">Missions en cours</h3>${S.scoutMissions.filter(m=>!m.done).map(m=>`<div class="ar"><span>${esc(m.league)} · ${m.pos} · max. ${m.age} ans</span><b>${m.left} sem.</b></div>`).join('')||'<p class="mu">Aucune mission en cours.</p>'}</div><div class="pn"><h3>Liste des cibles</h3>${S.shortlist.map(p=>`<div class="ar"><span><b>${esc(p.name)}</b><br><small class="mu">${esc(p.club)} · ${p.pos} · ${p.age} ans</small></span><b>${p.ovr}/20</b></div>`).join('')||'<p class="mu">Les joueurs observés apparaîtront ici, avec un rapport plus fiable au fil du temps.</p>'}<button class="chip" onclick="FM26A.clearShortlist()">Vider la liste</button></div></div>`};
const advanceScout=()=>{ensure();S.scoutMissions.forEach(m=>{if(m.done)return;m.left--;if(m.left<=0){m.done=true;const teams=LG[m.league]||LG[S.lg],found=[];for(let k=0;k<24;k++){const club=pick(teams),p=mkP(m.pos==='Tous'?pick(POS):m.pos,58+rnd(0,26),10000+S.season*100+k);p.club=club;p.age=rnd(17,m.age);p.ovr=clamp(p.ovr,45,92);p.pot=clamp(Math.max(p.ovr,p.pot),p.ovr,96);p.val=Math.max(1,Math.round(p.ovr*p.ovr/55));p.reportConfidence=45+rnd(0,45);if((m.pos==='Tous'||p.pos===m.pos)&&p.age<=m.age)found.push(p);}
 const ranked=found.sort((a,b)=>b.ovr-a.ovr).slice(0,5);ranked.forEach(p=>{if(!S.shortlist.some(x=>x.name===p.name&&x.club===p.club))S.shortlist.push(p)});S.shortlist=S.shortlist.slice(-40);mail('Rapport de recrutement',`Mission terminée : ${m.league}`,ranked.length?`${ranked.length} joueur(s) recommandés ont été ajoutés à ta liste de cibles.`:'Peu de profils correspondent à ce rapport. Élargis les critères.');}})};

V.club=function(){ensure();const c=S.clubObj,cost=(key)=>Math.round(4*Math.pow(2,(c[key]||1)-1));return `<div class="gr" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))"><div class="pn hero"><h3>Identité du club</h3><div class="big" style="font-size:30px">${esc(S.club)}</div><p class="mu">${esc(S.lg)} · Saison ${S.season}</p>${row('Stade',esc(c.stadium))}${row('Capacité',c.capacity.toLocaleString('fr-FR'))}${row('Budget transfert',money((S.bud||0)*1000000))}</div><div class="pn"><h3>Centre d'entraînement</h3><div class="big">${'★'.repeat(c.training)}${'☆'.repeat(5-c.training)}</div><p class="mu">Niveau ${c.training}/5. Augmente l'effet de la progression technique et physique.</p><button class="btn" onclick="FM26A.upgrade('training')">Améliorer · €${cost('training')} M</button></div><div class="pn"><h3>Académie</h3><div class="big">${'★'.repeat(c.youth)}${'☆'.repeat(5-c.youth)}</div><p class="mu">Niveau ${c.youth}/5. Augmente la qualité des prochaines générations.</p><button class="btn" onclick="FM26A.upgrade('youth')">Améliorer · €${cost('youth')} M</button></div><div class="pn"><h3>Objectifs de la direction</h3>${(S.boardGoals||[]).map(g=>`<div class="ar"><span>${esc(g.title)}</span><b>${g.done?'✓':'En cours'}</b></div>`).join('')}<p class="mu">Confiance : ${S.board}% · Supporters : ${S.fans}% · Moral collectif : ${S.mor}%</p></div>${S.jobOffers.length?`<div class="pn"><h3>Propositions d'emploi</h3>${S.jobOffers.map((o,i)=>`<div class="ar"><span><b>${esc(o.club)}</b><br><small>${esc(o.league)} · ambition ${o.ambition}</small></span><button class="chip" onclick="FM26A.job(${i})">Accepter</button></div>`).join('')}</div>`:''}</div>`};

V.press=function(){ensure();const n=nxt(),opponent=n?(n.home===S.club?n.away:n.home):'';const prompts=[['Objectif du match','Nous voulons gagner en restant fidèles à notre projet.','Nous respecterons l’adversaire mais jouerons pour la victoire.','Nous devons d’abord éviter les erreurs.'],['État du vestiaire','Le groupe travaille bien et progresse ensemble.','La concurrence est forte, chacun doit mériter sa place.','Je protège mes joueurs et je ne commenterai pas les rumeurs.'],['Mercato','Nous étudions les possibilités sans compromettre nos finances.','Je veux renforcer l’effectif si une vraie opportunité existe.','La priorité est de faire progresser les joueurs déjà présents.']];return `<div class="gr" style="grid-template-columns:minmax(0,1fr) 280px"><div class="pn"><h3>Conférence de presse</h3><p class="mu">${opponent?'Prochain adversaire : '+esc(opponent):'Prépare ton prochain rendez-vous médiatique.'}</p>${prompts.map((p,i)=>`<div class="pn" style="margin:10px 0"><h3>${p[0]}</h3>${p.slice(1).map((t,j)=>`<button class="chip" style="width:100%;margin:4px 0;text-align:left" onclick="FM26A.press(${i},${j})">${t}</button>`).join('')}</div>`).join('')}</div><div class="pn"><h3>Historique médiatique</h3>${S.pressLog.slice(-8).reverse().map(p=>`<div class="ml"><b>${esc(p.topic)}</b><p class="mu">${esc(p.answer)}</p></div>`).join('')||'<p class="mu">Aucune conférence enregistrée.</p>'}</div></div>`};

V.history=function(){ensure();return `<div class="gr" style="grid-template-columns:minmax(0,1fr) 300px"><div class="pn"><h3>Historique des saisons</h3>${S.history.slice().reverse().map(h=>`<div class="ar"><span><b>Saison ${h.season}</b><br><small class="mu">${esc(h.club)} · ${esc(h.league)}</small></span><b>${h.position}e · ${h.points} pts · ${h.wins} V</b></div>`).join('')||'<p class="mu">Ton historique se remplira à la fin de chaque saison complète.</p>'}</div><div class="pn"><h3>Records de carrière</h3>${row('Saisons',S.history.length)}${row('Buts marqués',S.history.reduce((a,h)=>a+h.goals,0))}${row('Victoires',S.history.reduce((a,h)=>a+h.wins,0))}${row('Meilleur classement',S.history.length?Math.min(...S.history.map(h=>h.position))+'e':'—')}${row('Trophées',S.history.filter(h=>h.position===1).length)}</div></div>`};

V.settings=function(){ensure();return `<div class="gr g3"><div class="pn"><h3>Vitesse du match</h3><p class="mu">Choisis la vitesse de simulation. Elle s'applique au prochain match lancé.</p><div class="wr">${[[300,'Lent'],[170,'Normal'],[80,'Rapide'],[25,'Très rapide']].map(([n,l])=>`<button class="chip ${S.options.speed===n?'on':''}" onclick="FM26A.speed(${n})">${l}</button>`).join('')}</div></div><div class="pn"><h3>Animations</h3><p class="mu">Réduire les animations améliore le confort sur les appareils modestes.</p><button class="btn" onclick="FM26A.anim()">${S.options.animations?'Désactiver':'Activer'} les animations</button></div><div class="pn"><h3>Diagnostic de carrière</h3><p class="mu">Vérifie les données principales de la partie.</p><button class="btn" onclick="FM26A.audit()">Lancer le contrôle</button><div id="auditResult"></div></div></div>`};
const oldStaff=V.staff;V.staff=function(){return oldStaff()+`<div class="pn" style="margin-top:12px"><h3>Recruter un membre du staff</h3><p class="mu">Coût estimé : €25 000 de frais, puis salaire mensuel en fonction de la qualité.</p><div class="wr">${[['Adjoint','Analyse tactique'],['Préparateur physique','Condition'],['Analyste','Données'],['Recruteur','Observation'],['Médecin','Médical'],['Entraîneur des gardiens','Gardiens']].map((r,i)=>`<button class="chip" onclick="FM26A.hireStaff('${r[0]}','${r[1]}')">+ ${r[0]}</button>`).join('')}</div></div>`};
const oldInbox=V.inbox;V.inbox=function(){return oldInbox()+`<div class="pn" style="margin-top:12px"><h3>Accès rapide</h3><div class="wr"><button class="chip" onclick="S.view='press';render()">Conférence de presse</button><button class="chip" onclick="S.view='scouting';render()">Centre de recrutement</button><button class="chip" onclick="S.view='contracts';render()">Contrats</button><button class="chip" onclick="S.view='club';render()">Objectifs du club</button></div></div>`};
NAV.push(['contracts','Contrats','▤'],['scouting','Recruteurs','⌕'],['club','Club & installations','⌂'],['press','Conférence','▣'],['history','Historique','◷'],['settings','Options & tests','⚙']);
const titles={contracts:'Contrats',scouting:'Centre de recrutement',club:'Club & installations',press:'Conférence de presse',history:'Historique',settings:'Options & diagnostic'};
const beforeRender=render;render=function(){ensure();beforeRender();const h=document.querySelector('#hd h2');if(h&&titles[S.view])h.textContent=titles[S.view];if(S.view==='home'){const vw=document.querySelector('#vw');if(vw&&!document.querySelector('#globalSearchWrap')){const wrap=document.createElement('div');wrap.id='globalSearchWrap';wrap.className='pn';wrap.style.marginBottom='12px';wrap.innerHTML='<h3>Recherche globale</h3><input id="globalSearch" placeholder="Rechercher un joueur, un message ou un club…" oninput="FM26A.search(this.value)"><div id="globalSearchResults" class="mu">Recherche dans la carrière</div>';vw.prepend(wrap)}}};
const oldEnd=endMatch;endMatch=function(){oldEnd();if(!S)return;ensure();const oldSusp=new Map((S.preMatchSusp||[]).map(x=>[x.id,x.susp]));S.sq.forEach(p=>{const before=oldSusp.get(p.id)||0;if((p.susp||0)<=before&&p.susp>0)p.susp--;});S.preMatchSusp=[];const win=M.h===M.a?0:(M.f.home===S.club?M.h>M.a:M.a>M.h)?1:-1;S.sq.forEach(p=>{if(xi().some(x=>x.id===p.id))p.morale=clamp(p.morale+win*3+(p.form>7.5?1:0),0,100);else p.morale=clamp(p.morale+(win>0?1:-1),0,100)});advanceScout();if(S.sq.some(p=>(p.end||2029)<=2027)&&!S.contractAlertSent){S.contractAlertSent=true;mail('Ressources humaines','Contrats à examiner','Au moins un contrat arrive bientôt à échéance. Consulte le menu Contrats.')}S.subsUsed=0;sv()};
const oldNewSeason=newSeason;newSeason=function(){ensure();const t=tbl(),my=t.find(x=>x.c===S.club),pos=(t.findIndex(x=>x.c===S.club)+1)||t.length;const games=S.fx.filter(f=>f.played&&(f.home===S.club||f.away===S.club)&&(!f.comp||f.comp===S.lg));const goals=S.sq.reduce((a,p)=>a+(p.g||0),0),wins=games.filter(f=>{const [h,a]=f.score.split('-').map(Number);return f.home===S.club?h>a:a>h}).length;S.history.push({season:S.season,club:S.club,league:S.lg,position:pos,points:my?.pts||0,wins,goals});S.history=S.history.slice(-30);if(S.boardGoals){S.boardGoals.forEach(g=>{if(g.id==='league')g.done=pos<=(S.objectives.position||10);if(g.id==='budget')g.done=S.bud>=0;if(g.id==='youth')g.done=games.some(f=>f.played)&&S.sq.some(p=>p.age<21&&p.ap>0);});const completed=S.boardGoals.filter(g=>g.done).length;S.board=clamp(S.board+(completed-1)*3,0,100)}if(pos<=Math.min(4,t.length/4)&&S.managerRep<100){S.managerRep=(S.managerRep||20)+4;const alternatives=Object.entries(LG).flatMap(([league,clubs])=>clubs.map(club=>({league,club}))).filter(x=>x.club!==S.club&&x.club!==S.clubObj.stadium);if(alternatives.length&&Math.random()<.45)S.jobOffers.push({...pick(alternatives),ambition:pos<=2?'Élevée':'Modérée'});S.jobOffers=S.jobOffers.slice(-3)}oldNewSeason();ensure();S.contractAlertSent=false;sv();render()};
const oldStartMatch=startMatch;startMatch=function(){initCareer();S.preMatchSusp=S.sq.map(p=>({id:p.id,susp:p.susp||0}));oldStartMatch();if(M){M.sp=S.options.speed||170;const bonus=((S.tc.press-50)*.018)+((S.tc.line-50)*.012)+((S.tc.tempo-50)*.01)+((S.tc.width-50)*.006);if(M.f.home===S.club)M.hp=clamp(M.hp+bonus,35,100);else M.ap=clamp(M.ap+bonus,35,100);clearInterval(T);T=setInterval(tick,M.sp)}};
window.FM26A={
 instruction(k,v){if(!['press','line','tempo','width'].includes(k))return;S.tc[k]=clamp(v,0,100);const out=document.getElementById(k+'Value');if(out)out.textContent=S.tc[k]+'%';sv()},
 setLineup(){ensure();const form=FM[S.tc.f]||FM['4-3-3'];const ids=form.map((_,i)=>Number(document.getElementById('lineupslot'+i)?.value));if(ids.length!==11||new Set(ids).size!==11)return alert('Choisis 11 joueurs différents.');const ps=ids.map(id=>S.sq.find(p=>p.id===id));if(ps.some(p=>!p||(p.inj||0)>0||(p.susp||0)>0))return alert('Un joueur sélectionné est indisponible.');S.lineup=ids;sv();render()},
 loanYouth(id){ensure();const p=(S.youth||[]).find(x=>x.id===id);if(!p)return;if(p.loanLeft>0)return alert('Ce jeune est déjà prêté.');p.loanLeft=8;p.status='Prêté';mail('Centre de formation',p.name+' part en prêt',p.name+' part chercher du temps de jeu pendant huit journées.');sv();render()},
 role(id,v){const p=S.sq.find(p=>p.id===id);if(!p)return;p.status=esc(v);sv();render()},
 renew(id){const p=S.sq.find(p=>p.id===id);if(!p)return;const bonus=Math.round((p.sal||10000)*8),newSal=Math.round((p.sal||10000)*1.12);if((S.bud||0)*1000000<bonus)return alert('Budget insuffisant pour la prime de signature.');if(!confirm(`Proposer à ${p.name} un contrat jusqu’en ${p.end+3} avec un salaire de ${money(newSal)} par semaine et une prime de ${money(bonus)} ?`))return;S.bud-=bonus/1000000;p.sal=newSal;p.end+=3;p.morale=clamp((p.morale||70)+3,0,100);mail('Contrats',p.name+' prolonge','Le nouveau contrat court désormais jusqu’en juin '+p.end+'.');sv();render()},
 mission(){ensure();const price=.2;if(S.bud<price)return alert('Budget insuffisant pour cette mission.');S.bud=Math.round((S.bud-price)*10)/10;S.scoutMissions.push({id:Date.now(),league:$('scLeague').value,pos:$('scPos').value,age:Number($('scAge').value),left:Number($('scWeeks').value),done:false});mail('Recrutement','Nouvelle mission lancée','Un recruteur observe le marché : '+$('scLeague').value+'. Rapport attendu dans '+$('scWeeks').value+' semaine(s).');sv();render()},
 clearShortlist(){S.shortlist=[];sv();render()},
 upgrade(key){const c=S.clubObj;if(!['training','youth','stadiumLevel'].includes(key))return;if(c[key]>=5)return alert('Niveau maximal déjà atteint.');const cost=Math.round(4*Math.pow(2,c[key]-1));if(S.bud<cost)return alert('Budget insuffisant pour cet investissement.');if(!confirm(`Investir €${cost} M dans les installations ?`))return;S.bud-=cost;c[key]++;if(key==='stadiumLevel')c.capacity=Math.round(c.capacity*1.12);mail('Direction','Investissement du club',`Les installations (${key}) passent au niveau ${c[key]}.`);sv();render()},
 press(topic,choice){const topics=['Objectif du match','État du vestiaire','Mercato'];const answers=[['Nous voulons gagner en restant fidèles à notre projet.','Nous respecterons l’adversaire mais jouerons pour la victoire.','Nous devons d’abord éviter les erreurs.'],['Le groupe travaille bien et progresse ensemble.','La concurrence est forte, chacun doit mériter sa place.','Je protège mes joueurs et je ne commenterai pas les rumeurs.'],['Nous étudions les possibilités sans compromettre nos finances.','Je veux renforcer l’effectif si une vraie opportunité existe.','La priorité est de faire progresser les joueurs déjà présents.']];const delta=choice===1?3:choice===0?2:-1;S.pressLog.push({topic:topics[topic],answer:answers[topic][choice],date:S.date});S.mor=clamp(S.mor+delta,0,100);S.fans=clamp(S.fans+(choice===1?2:0),0,100);S.board=clamp(S.board+(choice===2?-1:1),0,100);mail('Presse','Conférence de presse',answers[topic][choice]);sv();render()},
 job(i){const o=S.jobOffers[i];if(!o)return;if(!confirm(`Accepter le poste à ${o.club} ? Cette décision termine ton emploi actuel.`))return;S.club=o.club;S.lg=o.league;S.jobOffers.splice(i,1);S.bud=Math.max(12,Math.round(S.bud*.65));S.date='2026-08-01';S.sq=real(POS.map((pos,k)=>{const q=mkP(pos,BIG.includes(o.club)?78:69,k);q.club=o.club;q.ap=0;q.g=0;return q}));S.goalsSet=false;S.statusesInitialized=false;S.lineup=[];S.board=55;S.fans=60;S.mor=70;sel={lg:o.league,cl:o.club};initCareer();S.fx=mkFx();newTb();mail('Direction',`Bienvenue à ${o.club}`,'Un nouveau chapitre de ta carrière commence. Vérifie le calendrier et les objectifs du nouveau club.');sv();S.view='home';render()},
 hireStaff(role,speciality){if(S.staff.length>=14)return alert('Limite de staff atteinte.');const fee=25000;if(S.bud*1000000<fee)return alert('Budget insuffisant.');S.bud-=fee/1000000;S.staff.push({id:Date.now(),name:pick(FN)+' '+pick(LN),role,speciality,quality:8+rnd(0,11),salary:4000+rnd(0,15)*1000});mail('Ressources humaines',role+' recruté',`Un nouveau membre du staff arrive pour ${money(fee)} de frais.`);sv();render()},
 speed(n){S.options.speed=n;sv();render()},
 anim(){S.options.animations=!S.options.animations;document.documentElement.classList.toggle('reduce-motion',!S.options.animations);sv();render()},
 audit(){const errs=(window.FMX?.validate?.()||[]);if(S){const ids=new Set(),rounds=new Map();if(!Array.isArray(S.fx)||(S.fx.filter(f=>!f.comp||f.comp===S.lg).length)!==LG[S.lg].length*(LG[S.lg].length-1))errs.push('calendrier de championnat incomplet ou nombre de matchs incohérent');(S.fx||[]).forEach(f=>{if(ids.has(f.id))errs.push('identifiant de match en double : '+f.id);ids.add(f.id);const key=f.round||String(f.date).slice(0,10);const used=rounds.get(key)||new Set();if(used.has(f.home)||used.has(f.away))errs.push('club programmé deux fois lors de la journée '+key);used.add(f.home);used.add(f.away);rounds.set(key,used)});const pids=new Set();(S.sq||[]).forEach(p=>{if(pids.has(p.id))errs.push('identifiant de joueur en double : '+p.id);pids.add(p.id);if(!Number.isFinite(p.sal)||p.sal<0)errs.push('salaire invalide pour '+p.name);if(!Number.isFinite(p.ovr)||p.ovr<1||p.ovr>100)errs.push('note invalide pour '+p.name)});if(!Number.isFinite(S.bud)||S.bud<0)errs.push('budget transferts invalide')}const el=$('auditResult');if(el)el.innerHTML=errs.length?'<p style="color:#f0717d">'+errs.slice(0,15).map(esc).join('<br>')+'</p>':'<p style="color:#85d36b">Tous les contrôles disponibles sont passés : effectif, budget, identifiants et calendrier.</p>'},
 search(q){const el=$('globalSearchResults');if(!el)return;const s=q.trim().toLocaleLowerCase('fr');if(!s){el.textContent='Recherche dans les joueurs, clubs et messages';return}const hits=[];S.sq.filter(p=>(p.name+' '+p.pos).toLocaleLowerCase('fr').includes(s)).slice(0,8).forEach(p=>hits.push(`<div class="ar"><span>${esc(p.name)} · ${p.pos}</span><button class="chip" onclick="openP(${p.id})">Ouvrir</button></div>`));Object.entries(LG).forEach(([league,clubs])=>clubs.filter(c=>c.toLocaleLowerCase('fr').includes(s)).slice(0,4).forEach(c=>hits.push(`<div class="ar"><span>${esc(c)} <small class="mu">${esc(league)}</small></span><button class="chip" onclick="FM26A.clubSearch('${esc(c)}','${esc(league)}')">Voir</button></div>`)));S.ib.filter(m=>(m.t+' '+m.s+' '+m.b).toLocaleLowerCase('fr').includes(s)).slice(0,5).forEach(m=>hits.push(`<div class="ar"><span>${esc(m.t)} <small class="mu">${esc(m.s)}</small></span></div>`));el.innerHTML=hits.join('')||'<p class="mu">Aucun résultat.</p>'},
 clubSearch(club,league){const p=LG[league]||[];alert(`${club}\nChampionnat : ${league}\nClub répertorié : ${p.includes(club)?'oui':'non'}. Le profil complet est disponible lorsque ce club est dirigé dans ta carrière.`)},
 sub(outId,inId){if(!M||M.done)return alert('Les remplacements sont disponibles uniquement pendant un match.');ensure();const xiNow=xi(),out=xiNow.find(p=>p.id===Number(outId)),inn=S.sq.find(p=>p.id===Number(inId));if(!out||!inn||xiNow.some(p=>p.id===inn.id))return alert('Sélection de remplacement invalide.');if((inn.inj||0)>0||(inn.susp||0)>0)return alert('Ce joueur est indisponible.');if(S.subsUsed>=5)return alert('Les cinq changements autorisés ont été utilisés.');S.lineup=xiNow.map(p=>p.id===out.id?inn.id:p.id);S.subsUsed++;out.cond=clamp(out.cond+3,0,100);inn.cond=clamp(inn.cond-5,0,100);if(M.ev)M.ev.unshift({m:M.min,k:'⇄',t:`Changement : ${inn.name} remplace ${out.name}.`});M.cm=`${inn.name} remplace ${out.name}.`;sv();render()},
 promote(id){window.FMX?.promote?.(id)},
 exportCareer(){window.XF?.exp?.()}
};

/* Mercato : les propositions deviennent négociables au lieu d'un achat automatique. */
const oldMarket=V.xfer;
V.xfer=function(){
  ensure();
  let html=oldMarket();
  html=html.replace(/onclick="XF\.buy\((\d+)\)"/g,'onclick="FM26A.startOffer($1)"').replace(/>Acheter<\/button>/g,'>Négocier<\/button>');
  if(S.negotiation){
    const n=S.negotiation,p=(S.mk||[])[n.index];
    if(p)html+=`<div class="pn" style="margin-top:12px;border-color:#7b73ef"><h3>Négociation · ${esc(p.name)}</h3><p class="mu">Le club vendeur demande €${p.price} M. Ajuste ton offre : une proposition trop basse peut être refusée.</p><div class="row"><div><label>Indemnité proposée (en millions d’euros)</label><input id="offerAmount" type="number" min="0.1" max="${S.bud}" step="0.1" value="${n.bid}"></div><div><label>État de la négociation</label><input readonly value="${n.status||'Première proposition'}"></div></div><div class="wr"><button class="btn" onclick="FM26A.submitOffer()">Envoyer l’offre</button><button class="chip" onclick="FM26A.cancelOffer()">Annuler</button></div></div>`;
  }
  return html;
};
FM26A.startOffer=function(i){ensure();const p=(S.mk||[])[i];if(!p)return;S.negotiation={index:i,bid:Math.round(p.price*.85*10)/10,round:0,status:'Première proposition'};sv();render()};
FM26A.cancelOffer=function(){S.negotiation=null;sv();render()};
FM26A.submitOffer=function(){
 ensure();const n=S.negotiation,p=n&&(S.mk||[])[n.index];if(!p)return;
 const bid=Number(document.getElementById('offerAmount')?.value);
 if(!Number.isFinite(bid)||bid<=0)return alert('Entre une offre valide.');
 if(bid>S.bud)return alert('Cette offre dépasse le budget transferts disponible.');
 if(bid>=p.price*.95){
  const fee=Math.round(bid*10)/10;
  if(S.sq.length>=30)return alert('Effectif complet : 30 joueurs maximum.');
  const q={...p};delete q.price;delete q.u;delete q.reportConfidence;delete q.club;
  q.id=Math.max(-1,...S.sq.map(x=>Number(x.id)||0))+1;
  q.no=Math.max(0,...S.sq.map(x=>Number(x.no)||0))+1;
  q.club=S.club;q.ap=0;q.g=0;q.inj=0;q.susp=0;q.morale=72;
  S.sq.push(q);S.mk.splice(n.index,1);S.bud=Math.round((S.bud-fee)*10)/10;S.negotiation=null;
  mail('Direction sportive',q.name+' signe à '+S.club,q.name+' rejoint ton équipe après une négociation de €'+fee+' M.');
  mail('Agent',q.name+' · accord trouvé','Le joueur a accepté le projet sportif et les conditions du transfert.');
  sv();render();return;
 }
 if(bid<p.price*.72||n.round>=2){
  n.status='Offre refusée';mail('Recrutement','Offre refusée pour '+p.name,'Le club vendeur n’accepte pas ton offre. Tu peux relancer une mission ou suivre une autre cible.');S.negotiation=null;sv();render();return;
 }
 n.round++;n.bid=Math.round(p.price*(n.round===1?.94:.98)*10)/10;n.status='Contre-offre du club : €'+n.bid+' M';
 mail('Recrutement','Contre-offre pour '+p.name,'Le club demande désormais €'+n.bid+' M. Consulte le Centre de recrutement pour répondre.');
 sv();render();
};
/* Rendre les prêts de jeunes accessibles depuis l'académie. */
const oldAcademy=V.academy;
V.academy=function(){
 let html=oldAcademy();
 html=html.replace(/<button class="chip" onclick="FMX\.promote\((\d+)\)">Promouvoir<\/button>/g,(_,rawId)=>{
   const id=Number(rawId),p=(S.youth||[]).find(x=>x.id===id),loaned=(p?.loanLeft||0)>0;
   return `<button class="chip" onclick="FMX.promote(${id})">${loaned?'À promouvoir au retour':'Promouvoir'}</button><button class="chip" ${loaned?'disabled':''} onclick="FM26A.loanYouth(${id})">${loaned?'Prêt · '+p.loanLeft+' match(s)':'Prêter'}</button>`;
 });
 return html;
};
const oldPromote=window.FMX?.promote;
if(oldPromote)window.FMX.promote=function(id){const p=(S.youth||[]).find(x=>x.id===id);if(p&&(p.loanLeft||0)>0)return alert('Ce jeune doit terminer son prêt avant d’être promu.');return oldPromote(id)};

const oldMatch=V.match;V.match=function(){const core=oldMatch();ensure();if(!M||M.done)return core;const players=xi(),bench=S.sq.filter(p=>!players.some(x=>x.id===p.id)&&(p.inj||0)<=0&&(p.susp||0)<=0);return core+`<div class="pn" style="margin-top:12px"><h3>Gestion du banc · ${S.subsUsed}/5 changements</h3><div class="row"><div><label>Sortant</label><select id="subOut">${players.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.pos}</option>`).join('')}</select></div><div><label>Entrant</label><select id="subIn">${bench.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.pos}</option>`).join('')}</select></div><div style="align-self:end"><button class="btn" onclick="FM26A.sub($('subOut').value,$('subIn').value)">Effectuer le changement</button></div></div></div>`};


/* Nouvelles interactions tactiques et progression des jeunes prêtés. */
const oldTactics=V.tactics;
V.tactics=function(){
  ensure();
  const base=oldTactics();
  const form=FM[S.tc.f]||FM['4-3-3'];
  const xs=xi();
  const choices=form.map((pos,i)=>`<div><label>${pos[2]} · Poste ${i+1}</label><select id="lineupslot${i}">${S.sq.filter(p=>(p.inj||0)<=0&&(p.susp||0)<=0).map(p=>`<option value="${p.id}" ${xs[i]?.id===p.id?'selected':''}>${esc(p.name)} · ${p.pos} · ${p.ovr}</option>`).join('')}</select></div>`).join('');
  return base+`<div class="pn" style="margin-top:12px"><h3>Composition personnalisée</h3><p class="mu">Choisis chaque titulaire. Les blessés, suspendus et doublons sont refusés.</p><div class="gr" style="grid-template-columns:repeat(auto-fit,minmax(175px,1fr))">${choices}</div><button class="btn" style="margin-top:12px" onclick="FM26A.setLineup()">Enregistrer le onze titulaire</button></div><div class="pn" style="margin-top:12px"><h3>Consignes collectives</h3><p class="mu">Ces curseurs modifient la force de l'équipe au match suivant. Plus haut n'est pas toujours mieux : un pressing et une ligne trop élevés demandent un effectif adapté.</p>${[['press','Intensité du pressing'],['line','Hauteur de la ligne défensive'],['tempo','Rythme de jeu'],['width','Largeur offensive']].map(([k,l])=>`<div style="display:grid;grid-template-columns:minmax(130px,210px) 1fr 48px;align-items:center;gap:12px;margin:10px 0"><label>${l}</label><input type="range" min="0" max="100" value="${S.tc[k]}" oninput="FM26A.instruction('${k}',this.value)"><b id="${k}Value">${S.tc[k]}%</b></div>`).join('')}</div>`;
};
const previousEndAdvanced=endMatch;
endMatch=function(){
  previousEndAdvanced();
  if(!S||!Array.isArray(S.youth))return;
  S.youth.forEach(p=>{
    if((p.loanLeft||0)>0){
      p.loanLeft--;
      if(p.loanLeft===0){
        p.status='Revenu de prêt';
        p.ovr=clamp((p.ovr||50)+rnd(0,2),1,95);
        p.pot=clamp(Math.max(p.ovr,p.pot||p.ovr),p.ovr,96);
        mail('Centre de formation',p.name+' revient de prêt','Le prêt est terminé. Le rapport de retour a été ajouté à son dossier.');
      }
    }
  });
  sv();
};


/* Domestic and continental knockout cups. Cup results never affect league standings. */
const cupTeamPool=()=>Object.entries(LG).flatMap(([league,clubs])=>clubs.map(club=>({club,league})));
function initCups(){
 if(!S||!S.fx||!LG[S.lg])return;
 const existing=S.fx.filter(f=>f.cupKey);
 if(S.cupComps&&S.cupComps.domestic&&S.cupComps.continental&&existing.length)return;
 S.cupComps={};
 const addTournament=(key,name,entrants,offset)=>{
   const teams=[...new Set(entrants)].slice(0,16);
   if(teams.length<16)return;
   const nextId=Math.max(-1,...S.fx.map(f=>Number(f.id)||0))+1;
   const base=new Date((S.date||'2026-08-01')+'T12:00:00Z');base.setUTCDate(base.getUTCDate()+offset);
   const games=[];
   for(let i=0;i<8;i++){
     const home=teams[i],away=teams[15-i],d=new Date(base);d.setUTCDate(d.getUTCDate()+Math.floor(i/4)*1);
     games.push({id:nextId+i,date:d.toISOString(),home,away,played:false,score:'',round:key+'-R16',comp:name,cupKey:key,cupRound:1});
   }
   S.fx.push(...games);S.cupComps[key]={key,name,round:1,done:false,champion:'',history:[]};
 };
 const domestic=LG[S.lg].slice().filter(c=>c!==S.club).sort(()=>Math.random()-.5).slice(0,15);
 addTournament('domestic','Coupe nationale',[S.club,...domestic],10);
 const pool=cupTeamPool().filter(x=>x.club!==S.club).sort(()=>Math.random()-.5).slice(0,15).map(x=>x.club);
 addTournament('continental','Coupe continentale',[S.club,...pool],13);
 S.fx.sort((a,b)=>new Date(a.date)-new Date(b.date)||Number(a.id)-Number(b.id));
 S.cupStateVersion=1;
}
function advanceCup(playedFixture){
 if(!S||!playedFixture||!playedFixture.cupKey)return;
 const key=playedFixture.cupKey,state=S.cupComps?.[key];
 if(!state||state.done)return;
 const round=Number(playedFixture.cupRound)||state.round||1;
 if(round!==state.round)return;
 // Resolve every remaining tie in the current round, including other clubs.
 S.fx.filter(f=>f.cupKey===key&&f.cupRound===round&&!f.played).forEach(f=>{
   const score=simLeagueScore(f.home,f.away);f.played=true;f.score=score[0]+'-'+score[1];
 });
 const completed=S.fx.filter(f=>f.cupKey===key&&f.cupRound===round&&f.played);
 const winners=completed.map(f=>{
   const [h,a]=String(f.score).split('-').map(Number);
   if(h===a)return pick([f.home,f.away]); // Cup tie decider, represented as extra-time/penalty advancement.
   return h>a?f.home:f.away;
 });
 state.history.push({round,name:round===1?'Huitièmes':round===2?'Quarts':round===3?'Demi-finales':'Finale',matches:completed.length});
 if(winners.length===1){
   state.done=true;state.champion=winners[0];
   mail('Compétitions',state.name+' : champion',state.champion+' remporte '+state.name+'.');
 }else{
   const nextRound=round+1,dates=completed.map(f=>new Date(f.date).getTime()).filter(Number.isFinite),base=new Date((dates.length?Math.max(...dates):Date.now())+21*864e5);
   const startId=Math.max(-1,...S.fx.map(f=>Number(f.id)||0))+1;
   for(let i=0;i<winners.length;i+=2){
     const home=winners[i],away=winners[i+1];if(!away)continue;
     const id=startId+i/2,turn=nextRound===2?'Quarts':nextRound===3?'Demi-finales':'Finale';
     const roundLabel=key==='domestic'?'CN':'CC';
     S.fx.push({id,date:new Date(base.getTime()+Math.floor(i/2)*3600e3).toISOString(),home,away,played:false,score:'',round:roundLabel+'-'+nextRound,comp:state.name,cupKey:key,cupRound:nextRound});
   }
   state.round=nextRound;
   mail('Compétitions',state.name+' : tour suivant',turn+' programmé(s). Les résultats des autres confrontations ont été simulés.');
   if(!winners.includes(S.club))simulateRemainingCup(key);
 }
 S.fx.sort((a,b)=>new Date(a.date)-new Date(b.date)||Number(a.id)-Number(b.id));
 sv();
}

function simulateRemainingCup(key){
 const state=S.cupComps?.[key];if(!state||state.done)return;
 let guard=4;
 while(!state.done&&guard-->0){
  const round=state.round;
  const fixtures=S.fx.filter(f=>f.cupKey===key&&f.cupRound===round);
  if(!fixtures.length)break;
  fixtures.forEach(f=>{if(!f.played){const z=simLeagueScore(f.home,f.away);f.played=true;f.score=z[0]+'-'+z[1]}});
  const winners=fixtures.map(f=>{const [h,a]=String(f.score).split('-').map(Number);return h===a?pick([f.home,f.away]):h>a?f.home:f.away});
  state.history.push({round,name:round===1?'Huitièmes':round===2?'Quarts':round===3?'Demi-finales':'Finale',matches:fixtures.length});
  if(winners.length===1){state.done=true;state.champion=winners[0];mail('Compétitions',state.name+' : champion',state.champion+' remporte '+state.name+'.');break;}
  const nextRound=round+1,base=new Date(Math.max(...fixtures.map(f=>new Date(f.date).getTime()).filter(Number.isFinite))+21*864e5),startId=Math.max(-1,...S.fx.map(f=>Number(f.id)||0))+1,roundLabel=key==='domestic'?'CN':'CC';
  for(let i=0;i<winners.length;i+=2){if(!winners[i+1])continue;S.fx.push({id:startId+i/2,date:new Date(base.getTime()+Math.floor(i/2)*3600e3).toISOString(),home:winners[i],away:winners[i+1],played:false,score:'',round:roundLabel+'-'+nextRound,comp:state.name,cupKey:key,cupRound:nextRound});}
  state.round=nextRound;
 }
 S.fx.sort((a,b)=>new Date(a.date)-new Date(b.date)||Number(a.id)-Number(b.id));
}

const startCareerBeforeCups=startCareer;
startCareer=function(){startCareerBeforeCups();if(S){initCups();sv();render()}};
const newSeasonBeforeCups=newSeason;
newSeason=function(){
 if(S){
   const doneBefore=!!S.cupStateVersion;
   if(!S.fx.some(f=>!f.played&&(f.home===S.club||f.away===S.club)))S.cupComps={};
 }
 newSeasonBeforeCups();
 if(S){S.fx=S.fx.filter(f=>!f.cupKey);S.cupComps={};S.cupStateVersion=0;initCups();sv();render();}
};
const oldCompWithCups=V.comp;
V.comp=function(){
 const league=oldCompWithCups();
 const status=(key)=>{
   const s=S.cupComps?.[key];if(!s)return 'Pas commencé';
   if(s.done)return 'Champion : '+esc(s.champion);
   return s.round===1?'Huitièmes de finale':s.round===2?'Quarts de finale':s.round===3?'Demi-finales':'Finale';
 };
 const cupCard=(key)=>{
   const s=S.cupComps?.[key];if(!s)return '';
   const next=S.fx.filter(f=>f.cupKey===key&&f.home===S.club||f.cupKey===key&&f.away===S.club).filter(f=>!f.played).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
   const played=S.fx.filter(f=>f.cupKey===key&&f.played);
   return '<div class="pn"><h3>'+esc(s.name)+'</h3><div class="big" style="font-size:21px">'+esc(status(key))+'</div><p class="mu">'+played.length+' rencontre(s) terminée(s)</p>'+(next?'<div class="ar"><span>Prochain match</span><b>'+esc(next.home)+' – '+esc(next.away)+'</b></div>':'')+(s.history||[]).map(h=>'<div class="ar"><span>'+esc(h.name)+'</span><b>'+h.matches+' matchs</b></div>').join('')+'</div>';
 };
 return '<div class="gr" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-bottom:12px">'+cupCard('domestic')+cupCard('continental')+'</div>'+league;
};
const startMatchBeforeCups=startMatch;
startMatch=function(){
 if(S){initCups()}
 startMatchBeforeCups();
};
const endBeforeCupAdvance=endMatch;
endMatch=function(){endBeforeCupAdvance();if(M?.f?.cupKey)advanceCup(M.f)};
if(S){initCups();sv();render();}


/* Multiple independent career slots, in addition to JSON export/import. */
const savedSlots=()=>Array.from({length:5},(_,i)=>{
 const raw=localStorage.getItem(K+'_slot_'+(i+1));if(!raw)return {slot:i+1,empty:true};
 try{const v=JSON.parse(raw);return {slot:i+1,empty:false,manager:v.mg||'Manager',club:v.club||'Club',league:v.lg||'Championnat',season:v.season||1,date:v.date||'',valid:Array.isArray(v.sq)&&Array.isArray(v.fx)}}catch(e){return {slot:i+1,empty:false,valid:false}}
});
const oldSavePage=V.save;
V.save=function(){
 const base=oldSavePage(),slots=savedSlots();
 return base+`<div class="pn" style="margin-top:12px"><h3>Carrières sauvegardées · 5 emplacements</h3><p class="mu">Tu peux garder plusieurs carrières séparées dans ce navigateur. Les sauvegardes peuvent aussi être exportées en JSON pour les transférer sur un autre appareil.</p><table><tr><th>Emplacement</th><th>Carrière</th><th>Championnat</th><th>Saison</th><th>Actions</th></tr>${slots.map(x=>`<tr><td>${x.slot}</td><td>${x.empty?'Vide':esc(x.manager)+' · '+esc(x.club)}</td><td>${x.empty?'—':esc(x.league)}</td><td>${x.empty?'—':x.season}</td><td><div class="wr">${x.empty?`<button class="chip" onclick="FM26A.slotSave(${x.slot})">Enregistrer ici</button>`: `<button class="chip" ${x.valid?'':'disabled'} onclick="FM26A.slotLoad(${x.slot})">Charger</button><button class="chip" onclick="FM26A.slotSave(${x.slot})">Remplacer</button><button class="chip" onclick="FM26A.slotDelete(${x.slot})">Supprimer</button>`}</div></td></tr>`).join('')}</table></div>`;
};
FM26A.slotSave=function(n){if(!Number.isInteger(n)||n<1||n>5)return;const key=K+'_slot_'+n;if(localStorage.getItem(key)&&!confirm('Remplacer la carrière de cet emplacement ?'))return;try{sv();localStorage.setItem(key,JSON.stringify(S));mail('Sauvegarde','Carrière enregistrée','La carrière '+S.club+' a été enregistrée dans l’emplacement '+n+'.');sv();localStorage.setItem(key,JSON.stringify(S));alert('Carrière enregistrée dans l’emplacement '+n+'.');render()}catch(e){alert('Impossible d’enregistrer cette carrière : stockage du navigateur plein.') }};
FM26A.slotLoad=function(n){const raw=localStorage.getItem(K+'_slot_'+n);if(!raw)return alert('Cet emplacement est vide.');let v;try{v=JSON.parse(raw)}catch(e){return alert('La sauvegarde est illisible.')};if(!v||!Array.isArray(v.sq)||v.sq.length<11||!Array.isArray(v.fx)||!LG[v.lg]?.includes(v.club)||!v.tb)return alert('La sauvegarde est invalide; la partie actuelle reste inchangée.');if(!confirm('Charger la carrière de '+v.club+' ?'))return;localStorage.setItem(K,JSON.stringify(v));location.reload()};
FM26A.slotDelete=function(n){if(!confirm('Supprimer définitivement cette sauvegarde locale ?'))return;localStorage.removeItem(K+'_slot_'+n);render()};
const oldSub=FM26A.sub;
FM26A.sub=function(outId,inId){
 const xiBefore=xi(),out=xiBefore.find(p=>p.id===Number(outId)),inn=S.sq.find(p=>p.id===Number(inId));
 if(!out||!inn)return alert('Sélection de remplacement invalide.');
 oldSub(outId,inId);
 if(M&&!M.done){const delta=(inn.ovr||60)-(out.ovr||60);if(M.f.home===S.club)M.hp=clamp(M.hp+delta*.18,35,100);else M.ap=clamp(M.ap+delta*.18,35,100);sv();render()}
};


/* Transfers received and player conversations: choices now alter the career state. */
const initLifeSystems=()=>{
 if(!S)return;
 S.transferOffers=Array.isArray(S.transferOffers)?S.transferOffers:[];
 S.conversations=Array.isArray(S.conversations)?S.conversations:[];
 S.promises=Array.isArray(S.promises)?S.promises:[];
};
const previousStartForLife=startCareer;
startCareer=function(){previousStartForLife();if(S){initLifeSystems();sv();render()}};
if(S)initLifeSystems();

V.offers=function(){
 initLifeSystems();
 const pending=S.transferOffers.filter(o=>o.status==='pending');
 const history=S.transferOffers.filter(o=>o.status!=='pending').slice(-10).reverse();
 return `<div class="gr" style="grid-template-columns:minmax(0,1.4fr) minmax(260px,1fr)"><div class="pn"><h3>Offres reçues · ${pending.length} en attente</h3>${pending.map(o=>{const p=S.sq.find(x=>x.id===o.playerId);return `<div class="pn" style="margin:10px 0"><div class="ph"><div><h3>${esc(o.club)} propose une offre</h3><b>${esc(o.playerName)}</b><p class="mu">${p?esc(p.pos)+' · '+p.age+' ans · Note '+p.ovr:'Joueur de ton effectif'}</p></div><div class="shirt"><small>OFFRE</small><b>${o.offer.toFixed(1)} M€</b></div></div><p class="mu">Date : ${esc(o.date||S.date)} · Valeur estimée : ${p?(p.val||0)+' M€':'—'}</p><div class="wr"><button class="chip" onclick="FM26A.offerDecision(${o.id},'accept')">Accepter</button><button class="chip" onclick="FM26A.offerDecision(${o.id},'counter')">Contre-proposer</button><button class="chip" onclick="FM26A.offerDecision(${o.id},'reject')">Refuser</button></div></div>`}).join('')||'<p class="mu">Aucune offre en attente. Les clubs rivaux pourront bientôt faire des propositions pour tes joueurs.</p>'}</div><div class="pn"><h3>Historique des négociations</h3>${history.map(o=>`<div class="ar"><span><b>${esc(o.playerName)}</b><br><small class="mu">${esc(o.club)} · ${esc(o.status)}</small></span><b>${o.finalFee?o.finalFee.toFixed(1):o.offer.toFixed(1)} M€</b></div>`).join('')||'<p class="mu">Les propositions acceptées et refusées apparaîtront ici.</p>'}</div></div>`;
};
NAV.push(['offers','Offres reçues','€']);
const previousPlayer=V.player;
V.player=function(){
 const base=previousPlayer();
 const p=S.sq.find(x=>x.id===S.pid)||S.sq[0];if(!p)return base;
 initLifeSystems();
 const recent=S.conversations.filter(c=>c.playerId===p.id).slice(-4).reverse();
 const promised=S.promises.filter(c=>c.playerId===p.id&&c.status==='active');
 return base+`<div class="pn" style="margin-top:12px"><h3>Entretien individuel</h3><p class="mu">Le dialogue influence le moral du joueur, ses attentes et la confiance envers le manager.</p><div class="wr"><button class="chip" onclick="FM26A.playerTalk(${p.id},'support')">Encourager</button><button class="chip" onclick="FM26A.playerTalk(${p.id},'challenge')">Exiger davantage</button><button class="chip" onclick="FM26A.playerTalk(${p.id},'promise')">Promettre du temps de jeu</button><button class="chip" onclick="FM26A.playerTalk(${p.id},'warn')">Recadrer</button></div><div class="ar"><span>Moral individuel</span><b>${p.morale??70}/100</b></div><div class="ar"><span>Statut dans l’équipe</span><b>${esc(p.status||'Rotation')}</b></div><div class="ar"><span>Promesses actives</span><b>${promised.length}</b></div>${recent.map(c=>`<div class="ml"><b>${esc(c.topic)}</b><p class="mu">${esc(c.text)}</p></div>`).join('')||'<p class="mu">Aucune discussion récente avec ce joueur.</p>'}</div>`;
};
FM26A.playerTalk=function(id,topic){
 initLifeSystems();const p=S.sq.find(x=>x.id===Number(id));if(!p)return;
 const today=String(S.date||'').slice(0,10);
 if(p.lastTalkDate===today)return alert('Tu as déjà parlé à ce joueur aujourd’hui.');
 let text='',delta=0;
 if(topic==='support'){text='Tu lui as apporté ton soutien et rappelé son importance dans le projet.';delta=p.morale<45?9:5}
 if(topic==='challenge'){const strong=(p.a?.Determination||10)>=14||p.personality==='Professionnel'||p.personality==='Compétiteur';text=strong?'Tu lui as demandé d’élever ses exigences. Il semble prêt à relever le défi.':'Tu lui as demandé davantage et il l’a mal pris.';delta=strong?2:-5}
 if(topic==='warn'){text='Tu lui as demandé de respecter les exigences collectives.';delta=p.morale<35?-6:-2}
 if(topic==='promise'){
  const promise=prompt('Quelle promesse de temps de jeu veux-tu lui faire ?','Lui donner une chance lors des trois prochains matchs');
  if(!promise)return;
  S.promises.push({id:Date.now(),playerId:p.id,playerName:p.name,text:promise,startApps:p.ap||0,matchesLeft:3,status:'active'});
  text='Tu lui as promis : '+promise;delta=8;
 }
 p.morale=clamp((p.morale??70)+delta,0,100);p.lastTalkDate=today;
 S.conversations.push({id:Date.now(),playerId:p.id,playerName:p.name,topic:topic==='support'?'Encouragement':topic==='challenge'?'Exigences':topic==='promise'?'Promesse':'Recadrage',text,date:today});
 S.conversations=S.conversations.slice(-100);S.mor=clamp(S.mor+(delta>0?1:0),0,100);
 mail('Vestiaire','Discussion avec '+p.name,text);sv();render();
};
FM26A.offerDecision=function(id,action){
 initLifeSystems();const o=S.transferOffers.find(x=>x.id===Number(id)&&x.status==='pending');if(!o)return;
 const p=S.sq.find(x=>x.id===o.playerId);if(!p){o.status='annulée';sv();return render()}
 if(action==='reject'){o.status='refusée';p.morale=clamp((p.morale||70)+(p.morale<35?-2:1),0,100);mail('Mercato','Offre refusée pour '+p.name,'Tu as refusé la proposition de '+o.club+'.');sv();return render()}
 if(action==='counter'){
  const ask=Number(prompt('Contre-proposition en millions d’euros :',String(Math.round(o.offer*1.2*10)/10)));
  if(!Number.isFinite(ask)||ask<=o.offer)return alert('La contre-proposition doit être supérieure à l’offre initiale.');
  if(ask<=o.offer*1.35&&Math.random()<.72){o.finalFee=Math.round(ask*10)/10;o.status='contre-offre acceptée'}
  else{o.status='contre-offre refusée';mail('Mercato','Contre-offre refusée',o.club+' ne souhaite pas dépasser son offre initiale pour '+p.name+'.')}
  if(o.status==='contre-offre acceptée')mail('Mercato','Accord trouvé pour '+p.name,o.club+' accepte une indemnité de '+o.finalFee.toFixed(1)+' M€.');
  sv();return render();
 }
 if(action==='accept'){
  if(S.sq.length<=16)return alert('Tu dois conserver au moins 16 joueurs dans l’effectif.');
  if(p.pos==='GK'&&S.sq.filter(x=>x.pos==='GK').length<2)return alert('Tu dois conserver au moins deux gardiens avant de vendre celui-ci.');
  o.status='acceptée';o.finalFee=o.offer;S.bud=Math.round((S.bud+o.offer)*10)/10;S.sq=S.sq.filter(x=>x.id!==p.id);S.lineup=(S.lineup||[]).filter(x=>x!==p.id);S.managerRep=clamp((S.managerRep||20)+1,0,100);
  mail('Mercato',p.name+' vendu à '+o.club,'Accord final : '+o.offer.toFixed(1)+' M€. Le budget de transfert a été crédité.');sv();return render();
 }
};
const previousEndForLife=endMatch;
endMatch=function(){
 previousEndForLife();
 if(!S)return;initLifeSystems();
 S.promises.forEach(pr=>{
  if(pr.status!=='active')return;
  pr.matchesLeft--;
  const p=S.sq.find(x=>x.id===pr.playerId);
  if(!p){pr.status='annulée';return}
  if((p.ap||0)>pr.startApps){pr.status='tenue';mail('Vestiaire','Promesse tenue envers '+p.name,'Tu as donné du temps de jeu à '+p.name+'. Sa confiance augmente.');p.morale=clamp((p.morale||70)+3,0,100)}
  else if(pr.matchesLeft<=0){pr.status='non tenue';p.morale=clamp((p.morale||70)-10,0,100);S.board=clamp(S.board-1,0,100);mail('Vestiaire','Promesse non tenue envers '+p.name,'Tu n’as pas pu respecter ta promesse : '+pr.text+'.');}
 });
 const userGames=S.fx.filter(f=>f.played&&(f.home===S.club||f.away===S.club));
 if(userGames.length&&userGames.length%4===0&&Math.random()<.72){
  const candidates=S.sq.filter(p=>p.age>=22&&!p.inj&&!(S.transferOffers||[]).some(o=>o.playerId===p.id&&o.status==='pending'));
  if(candidates.length){
   const p=pick(candidates),all=Object.entries(LG).flatMap(([league,clubs])=>clubs.map(club=>({league,club}))).filter(x=>x.club!==S.club),buyer=pick(all);
   const offer=Math.max(.5,Math.round((p.val||1)*(.85+Math.random()*.65)*10)/10);
   const entry={id:Date.now()+rnd(1,9999),playerId:p.id,playerName:p.name,club:buyer.club,league:buyer.league,offer,status:'pending',date:S.date};
   S.transferOffers.push(entry);S.transferOffers=S.transferOffers.slice(-40);mail('Mercato',buyer.club+' fait une offre pour '+p.name,'Proposition : '+offer.toFixed(1)+' M€. Consulte le menu Offres reçues pour accepter, refuser ou contre-proposer.');
  }
 }
 sv();
};

initCareer();if(S){sv();render()}
})();
