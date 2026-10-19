/* FM26 — International management module: original national-team career and tournament layer. */
(()=>{
'use strict';
const NATIONS=[
 {name:'France',iso:'FRA',level:88},{name:'Angleterre',iso:'ENG',level:87},
 {name:'Espagne',iso:'ESP',level:87},{name:'Allemagne',iso:'GER',level:85},
 {name:'Italie',iso:'ITA',level:84},{name:'Portugal',iso:'POR',level:85},
 {name:'Pays-Bas',iso:'NED',level:84},{name:'Belgique',iso:'BEL',level:82},
 {name:'Croatie',iso:'CRO',level:81},{name:'Brésil',iso:'BRA',level:89},
 {name:'Argentine',iso:'ARG',level:88},{name:'Uruguay',iso:'URU',level:81},
 {name:'États-Unis',iso:'USA',level:77},{name:'Mexique',iso:'MEX',level:77},
 {name:'Japon',iso:'JPN',level:78},{name:'Maroc',iso:'MAR',level:80}
];
const POS=['GK','GK','GK','DR','DC','DC','DC','DL','DM','DM','MC','MC','MC','AMC','AMR','AML','ST','ST','DR','DC','DL','MC','ST'];
const GROUPS=[
 {name:'A',teams:['France','Uruguay','Japon','États-Unis']},
 {name:'B',teams:['Angleterre','Croatie','Mexique','Maroc']},
 {name:'C',teams:['Espagne','Belgique','Pays-Bas','Argentine']},
 {name:'D',teams:['Allemagne','Portugal','Brésil','Italie']}
];
const safe=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const info=n=>NATIONS.find(x=>x.name===n)||NATIONS[0];
const avg=xs=>xs.length?xs.reduce((a,p)=>a+(Number(p.ovr)||60),0)/xs.length:60;
function ensure(){
 if(!S)return;
 S.international=S.international||{nation:'France',style:'Équilibré',rosters:{},history:[],tournament:null};
 const x=S.international;
 if(!NATIONS.some(n=>n.name===x.nation))x.nation='France';
 x.style=x.style||'Équilibré';x.rosters=x.rosters||{};x.history=Array.isArray(x.history)?x.history:[];
 if(!x.tournament||!Array.isArray(x.tournament.fixtures))x.tournament=createTournament();
}
function roster(nation){
 ensure();
 const x=S.international;
 if(x.rosters[nation]?.length===23)return x.rosters[nation];
 const meta=info(nation),iso=meta.iso;
 const known=(S.sq||[]).filter(p=>p.nat===iso).slice().sort((a,b)=>(b.ovr||0)-(a.ovr||0)).slice(0,23)
  .map((p,i)=>({...p,a:{...(p.a||{})},iid:nation+'-club-'+p.id,club:S.club,calledFromClub:true}));
 const result=known.slice();
 let idx=0;
 while(result.length<23){
  const p=mkP(POS[result.length]||POS[idx%POS.length],meta.level,700000+NATIONS.findIndex(n=>n.name===nation)*100+idx);
  p.iid=nation+'-generated-'+idx;p.nat=iso;p.club='Sélection '+nation;
  p.age=clamp(p.age||25,17,35);p.ovr=clamp(p.ovr||meta.level,48,96);p.pot=clamp(p.pot||p.ovr,p.ovr,98);
  p.val=Math.round(p.ovr*p.ovr/60);p.morale=72;p.calledFromClub=false;
  result.push(p);idx++;
 }
 // Fill any positions missing from the naturally selected club players with generated profiles.
 result.sort((a,b)=>(b.ovr||0)-(a.ovr||0));
 x.rosters[nation]=result.slice(0,23);
 return x.rosters[nation];
}
function teamRating(nation){
 const x=roster(nation).slice().sort((a,b)=>(b.ovr||0)-(a.ovr||0)).slice(0,11);
 let rating=avg(x);
 const current=S.international;
 if(nation===current.nation){
  const style={Équilibré:0,Possession:1.2,Pressing:1.5,Contre:1.1,Prudent:-.2};
  rating+=style[current.style]||0;
 }
 return rating;
}
function poisson(l){
 const L=Math.exp(-Math.max(.05,l));let k=0,p=1;
 do{k++;p*=Math.random()}while(p>L&&k<8);
 return k-1;
}
function score(f,t){
 const a=teamRating(f.home),b=teamRating(f.away);
 const same=(f.home===S.international.nation||f.away===S.international.nation);
 const styleBoost=same?({Équilibré:0,Possession:.07,Pressing:.1,Contre:.08,Prudent:-.04}[S.international.style]||0):0;
 const hg=clamp(1.28+(a-b)*.045+styleBoost,.25,2.8);
 const ag=clamp(1.16+(b-a)*.045,.2,2.7);
 f.h=poisson(hg);f.a=poisson(ag);f.played=true;
 if(f.phase!=='group'&&f.h===f.a){
  f.pen=[rnd(3,6),rnd(3,6)];
  if(f.pen[0]===f.pen[1])f.pen[0]++;
  f.winner=f.pen[0]>f.pen[1]?f.home:f.away;
 }else f.winner=f.h>f.a?f.home:f.away;
 return f;
}
function createTournament(){
 const fixtures=[];let id=1;
 const rounds=[[[0,3],[1,2]],[[0,2],[3,1]],[[0,1],[2,3]]];
 GROUPS.forEach(g=>rounds.forEach((round,ri)=>round.forEach(pair=>{
  fixtures.push({id:id++,phase:'group',round:ri+1,group:g.name,home:g.teams[pair[0]],away:g.teams[pair[1]],played:false});
 })));
 return {season:S?.season||1,year:new Date(S?.date||'2026-08-01').getFullYear(),phase:'group',round:1,groups:GROUPS.map(g=>({name:g.name,teams:g.teams.slice()})),fixtures,history:[],champion:null};
}
function standings(group){
 const t=S.international.tournament;
 const teams=(t.groups.find(g=>g.name===group)?.teams)||[];
 const rows=teams.map(n=>({name:n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
 t.fixtures.filter(f=>f.phase==='group'&&f.group===group&&f.played).forEach(f=>{
  const h=rows.find(x=>x.name===f.home),a=rows.find(x=>x.name===f.away);if(!h||!a)return;
  h.p++;a.p++;h.gf+=f.h;h.ga+=f.a;a.gf+=f.a;a.ga+=f.h;
  if(f.h>f.a){h.w++;a.l++;h.pts+=3}else if(f.h<f.a){a.w++;h.l++;a.pts+=3}else{h.d++;a.d++;h.pts++;a.pts++}
 });
 return rows.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name));
}
function stageName(t){
 if(t.phase==='group')return 'Phase de groupes · journée '+t.round+'/3';
 if(t.phase==='quarter')return 'Quarts de finale';
 if(t.phase==='semi')return 'Demi-finales';
 if(t.phase==='final')return 'Finale';
 return 'Tournoi terminé';
}
function currentFixtures(t){
 return t.fixtures.filter(f=>!f.played&&f.phase===t.phase&&(t.phase==='group'?f.round===t.round:true));
}
function startKnockout(t,phase,teams){
 t.phase=phase;t.round=1;
 const ids=Math.max(0,...t.fixtures.map(f=>f.id||0))+1;
 const pairs=[];
 if(phase==='quarter')pairs.push([teams[0],teams[3]],[teams[1],teams[2]],[teams[4],teams[7]],[teams[5],teams[6]]);
 else if(phase==='semi')pairs.push([teams[0],teams[1]],[teams[2],teams[3]]);
 else pairs.push([teams[0],teams[1]]);
 pairs.forEach((p,i)=>t.fixtures.push({id:ids+i,phase,round:1,home:p[0],away:p[1],played:false}));
}
function advance(){
 const x=S.international,t=x.tournament,fixtures=currentFixtures(t);
 if(!fixtures.length)return alert('Aucune rencontre à simuler pour cette étape.');
 fixtures.forEach(f=>score(f,t));
 t.history.push({phase:t.phase,round:t.round,matches:fixtures.map(f=>({home:f.home,away:f.away,h:f.h,a:f.a,pen:f.pen||null,winner:f.winner}))});
 if(t.phase==='group'){
  if(t.round<3)t.round++;
  else{
   const q=['A','B','C','D'].map(g=>standings(g));
   const qualifiers=[q[0][0].name,q[1][1].name,q[1][0].name,q[0][1].name,q[2][0].name,q[3][1].name,q[3][0].name,q[2][1].name];
   startKnockout(t,'quarter',qualifiers);
  }
 }else if(t.phase==='quarter'){
  const w=fixtures.map(f=>f.winner);startKnockout(t,'semi',w);
 }else if(t.phase==='semi'){
  const w=fixtures.map(f=>f.winner);startKnockout(t,'final',w);
 }else if(t.phase==='final'){
  t.champion=fixtures[0].winner;t.phase='done';
  x.history.push({year:t.year,season:t.season,nation:x.nation,champion:t.champion});
  mail('Sélection nationale','Champion international : '+t.champion,t.champion+' remporte le tournoi international de la saison '+t.season+'.');
 }
 sv();render();
}
V.international=function(){
 ensure();
 const x=S.international,t=x.tournament,meta=info(x.nation),players=roster(x.nation);
 const next=currentFixtures(t),grp=t.groups.find(g=>g.teams.includes(x.nation));
 const table=grp?standings(grp.name):[];
 const stageResults=t.history.slice(-1)[0]?.matches||[];
 const scoreText=f=>f.h+' – '+f.a+(f.pen?' (TAB '+f.pen[0]+'–'+f.pen[1]+')':'');
 const resultRows=stageResults.map(f=>'<div class="ar"><span>'+safe(f.home)+' · '+safe(f.away)+'</span><b>'+scoreText(f)+'</b></div>').join('');
 const nextRows=next.map(f=>'<div class="ar"><span>'+safe(f.home)+' – '+safe(f.away)+'</span><b>'+safe(f.phase==='group'?'Poules':stageName(t))+'</b></div>').join('');
 const tableRows=table.map((r,i)=>'<tr class="'+(r.name===x.nation?'me':'')+'"><td>'+(i+1)+'</td><td>'+safe(r.name)+'</td><td>'+r.p+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td>'+r.gf+':'+r.ga+'</td><td><b>'+r.pts+'</b></td></tr>').join('');
 const rosterRows=players.map((p,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+safe(p.name)+'</b>'+(p.calledFromClub?'<br><small class="mu">Joueur du '+safe(S.club)+'</small>':'')+'</td><td>'+safe(p.pos)+'</td><td>'+p.age+'</td><td><span class="b '+(p.ovr>=82?'h':p.ovr>=72?'m':'l')+'">'+p.ovr+'</span></td></tr>').join('');
 return '<div class="page-intro"><div><p class="eyebrow">SÉLECTIONS NATIONALES</p><h1>Le football international</h1><p>Prends les commandes d’une sélection et mène-la jusqu’au titre.</p></div><div class="season-pill">Saison '+t.season+' · '+t.year+'</div></div>'+
 '<div class="gr" style="grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr)">'+
 '<div class="pn hero"><h3>Choisir la sélection</h3><label>Équipe nationale</label><select id="intlNation" onchange="FM26I.selectNation(this.value)">'+NATIONS.map(n=>'<option '+(n.name===x.nation?'selected':'')+'>'+safe(n.name)+'</option>').join('')+'</select>'+
 '<div class="mh" style="justify-content:flex-start"><div class="big" style="font-size:31px">'+safe(x.nation)+'</div><span class="b h">FIFA · '+meta.iso+'</span></div>'+
 '<p class="mu">Niveau estimé de l’effectif : '+Math.round(teamRating(x.nation))+'/100 · '+players.length+' joueurs dans le groupe.</p><label>Plan de jeu</label><select onchange="FM26I.setStyle(this.value)">'+['Équilibré','Possession','Pressing','Contre','Prudent'].map(v=>'<option '+(x.style===v?'selected':'')+'>'+v+'</option>').join('')+'</select>'+
 '<p class="mu">Le plan choisi modifie légèrement la force offensive simulée de la sélection pour le tournoi.</p>'+
 '<div class="wr"><button class="btn" onclick="FM26I.playRound()" '+(t.phase==='done'?'disabled':'')+'>Simuler '+(t.phase==='group'?'la journée':t.phase==='final'?'la finale':t.phase==='done'?'':'le prochain tour')+'</button><button class="chip" onclick="FM26I.newTournament()">Nouveau tournoi</button></div></div>'+
 '<div class="pn"><h3>Tournoi international</h3><div class="big" style="font-size:23px">'+safe(stageName(t))+'</div><p class="mu">'+(t.champion?'Champion : '+safe(t.champion):'16 sélections · 4 groupes · phases finales')+'</p><h3 style="margin-top:16px">Prochaines rencontres</h3>'+(nextRows||'<p class="mu">Le tournoi est terminé. Tu peux lancer une nouvelle édition.</p>')+'<div class="dash-divider"></div><h3>Derniers résultats</h3>'+(resultRows||'<p class="mu">Aucun match international joué.</p>')+'</div></div>'+
 (grp?'<div class="pn" style="margin-top:12px"><h3>Groupe '+grp.name+'</h3><table><tr><th>#</th><th>Sélection</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP:BC</th><th>Pts</th></tr>'+tableRows+'</table></div>':'')+
 '<div class="pn" style="margin-top:12px"><div class="section-title"><div><h1>Effectif national</h1><p>Joueurs professionnels présents ou profils générés pour cette simulation.</p></div><span class="season-pill">'+players.filter(p=>p.calledFromClub).length+' joueurs issus de ton club</span></div><div style="overflow:auto"><table><tr><th>#</th><th>Joueur</th><th>Poste</th><th>Âge</th><th>Note</th></tr>'+rosterRows+'</table></div></div>'+
 '<div class="pn" style="margin-top:12px"><h3>Historique international</h3>'+(x.history.slice(-6).reverse().map(h=>'<div class="ar"><span>'+safe(h.nation)+' · édition '+h.year+'</span><b>'+safe(h.champion)+'</b></div>').join('')||'<p class="mu">Les titres remportés seront enregistrés ici.</p>')+'</div>';
};
window.FM26I={
 selectNation(n){if(!NATIONS.some(x=>x.name===n))return;ensure();S.international.nation=n;roster(n);sv();render()},
 setStyle(v){if(!['Équilibré','Possession','Pressing','Contre','Prudent'].includes(v))return;ensure();S.international.style=v;sv();render()},
 playRound(){ensure();advance()},
 newTournament(){ensure();if(!confirm('Lancer une nouvelle édition du tournoi international ? Les anciens titres seront conservés.'))return;S.international.tournament=createTournament();sv();render()}
};
if(!NAV.some(n=>n[0]==='international'))NAV.push(['international','Sélections','⚽']);
const baseRender=render;
render=function(){baseRender();if(S&&S.view==='international'){const h=document.querySelector('#hd h2');if(h)h.textContent='Sélections nationales';}};
const baseStart=startCareer;
startCareer=function(){baseStart();if(S){ensure();sv();render()}};
if(S){ensure();sv();render()}
})();