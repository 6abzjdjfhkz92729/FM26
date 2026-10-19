/* FM26 — couche carrière avancée. Module original, chargé après les systèmes Phase 1 et 2. */
(()=>{
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const money=n=>'€'+Math.round(n||0).toLocaleString('fr-FR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).slice(0,120);
const row=(a,b)=>`<div class="ar"><span>${a}</span><b>${b}</b></div>`;
const ensure=()=>{
 if(!S)return;
 S.options=S.options||{speed:170,animations:true};
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
 S.sq.forEach((p,i)=>{if(!p.status||p.status==='Rotation')p.status=i<11?'Titulaire':i<17?'Rotation':'Jeune';});
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
V.scouting=function(){ensure();const opts=Object.keys(LG).map(x=>`<option>${esc(x)}</option>`).join('');return `<div class="gr" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="pn"><h3>Missions de recrutement</h3><div class="row"><div><label>Championnat</label><select id="scLeague">${opts}</select></div><div><label>Poste recherché</label><select id="scPos">${['Tous',...Object.keys(GRP)].map(x=>`<option>${x}</option>`).join('')}</select></div></div><div class="row"><div><label>Âge maximum</label><select id="scAge"><option>21</option><option selected>25</option><option>29</option><option>35</option></select></div><div><label>Durée</label><select id="scWeeks"><option value="1">1 semaine</option><option value="2" selected>2 semaines</option><option value="4">4 semaines</option></select></div></div><button class="btn" onclick="FM26A.mission()">Lancer la mission · €0,2 M</button><h3 style="margin-top:16px">Missions en cours</h3>${S.scoutMissions.filter(m=>!m.done).map(m