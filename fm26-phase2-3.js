/* FM26 — FUSION DES EXTENSIONS PHASE 2 + PHASE 3
   Ordre : après le jeu principal et fm26-phase1.js.
   Phase 2 : moteur de match par actions, xG, fautes, cartons, remplacements et tactique.
   Phase 3 : staff, moral, vestiaire, contrats, diagnostic et réparation.
   Les deux modules sont conservés dans des IIFE séparées pour éviter les collisions de constantes.
*/

/* FM26 — Extension Phase 2 : moteur de match par actions (points 69-78, 80, 123, 127)
   À charger APRÈS fm26-phase1.js. Remplace la simulation aléatoire par des séquences de jeu
   dépendant des attributs, de la fatigue, de la tactique et des cartons rouges. */
(()=>{
const ef=p=>p.ovr*(.88+.12*p.cond/100);
const mc=p=>p.cond-(M.min-(M.in[p.id]||0))*(.4-((p.a&&p.a.Stamina)||10)*.012);
const A=(p,ks)=>ks.reduce((s,k)=>s+((p.a&&p.a[k])||10),0)/ks.length;
const sA=p=>A(p,["Finishing","Dribbling","Off The Ball","Composure"]),sM=p=>A(p,["Passing","Vision","Decisions","First Touch"]),sD=p=>A(p,["Tackling","Marking","Positioning","Anticipation"]);
const wavg=(L,w,f)=>{let s=0,t=0;L.forEach(p=>{const k=w(p);s+=k*f(p);t+=k});return t?s/t:10};
const lastN=n=>String(n).split(" ").pop(),club=s=>s?M.f.away:M.f.home;
const R=["{n} perd le ballon au milieu","{n} temporise et cherche ses partenaires","Belle interception de {n}","{n} tente une longue transversale","{n} remonte le ballon dans l'axe","{n} gagne son duel et relance"];
let Ts=[];

/* Force de chaque équipe, calculée minute par minute */
function TM(s){const mine=s===M.mineS,rf=1-.12*M.red[s];let a,m,d,g;
 if(mine){const L=M.lu,out=L.filter(p=>GRP[p.pos]!=="G"),gk=L.find(p=>p.pos==="GK")||L[0],
  F=L.reduce((x,p)=>x+cl(.78+.22*mc(p)/100,.7,1),0)/L.length,fam=(S.fam||0)*.05;
  a=wavg(out,p=>GRP[p.pos]==="A"?2:GRP[p.pos]==="M"?1:.2,sA)*F*M.m[0]+fam;
  m=wavg(out,()=>1,sM)*F+fam;d=wavg(out,p=>GRP[p.pos]==="D"?2:GRP[p.pos]==="M"?.7:.1,sD)*F;g=gk.ovr/4.6*F}
 else{a=M.op*M.m[1];m=M.op;d=M.op;g=M.op*1.13}
 return{a:a*rf,m:m*rf+(s===0?.3:0),d:d*rf,g}}

const who=(s,gr)=>{if(s===M.mineS){const L=M.lu.filter(p=>gr.includes(GRP[p.pos])),p=pick(L.length?L:M.lu);return{n:p.name,id:p.id}}
 const L=oppXI(M.oc).filter(x=>gr.includes(GRP[x.pos]));return{n:pick(L.length?L:oppXI(M.oc)).name}};
const ev=(k,t,g)=>{M.ev.unshift({m:M.min,k,t});M.cm=t;if(k==="⚽"){M.gt=16;M.gc=t;M.gk=g}};
const card=(d,w)=>{const k=w.n+d;M.yc[k]=(M.yc[k]||0)+1;if(M.yc[k]>=2){M.red[d]++;ev("🟥","Second jaune puis rouge pour "+lastN(w.n)+" ("+club(d)+")")}else ev("🟨","Carton jaune — "+lastN(w.n)+" ("+club(d)+")")};
const goal=(p,w,pen)=>{p?M.a++:M.h++;M.sot[p]++;if(p===M.mineS&&w.id!=null)M.scr.push(w.id);
 ev("⚽",club(p)+" marque ! "+M.h+"-"+M.a+" ("+lastN(w.n)+(pen?", pen.":"")+" "+M.min+"')",club(p));M.bx=p?5:95};

/* Tir : la qualité de l'occasion (xG) dépend de l'attaque, de la défense et du gardien adverses */
const shot=(p,o,pen,sp)=>{const P=Ts[p],O=Ts[o],r=Math.random(),
 xg=pen?.76:(.03+.24*r*r)*cl(1+(P.a-(O.d+O.g)/2)*.06,.6,1.6)*(sp?1.2:1);
 M.xg[p]+=xg;M.sh[p]++;const w=who(p,["A","A","M"]);
 if(Math.random()<xg){goal(p,w,pen);return}
 if(Math.random()<.4){M.sot[p]++;ev("🧤","Arrêt du gardien de "+club(o)+" devant "+lastN(w.n))}
 else if(xg>.18)ev("◉","Grosse occasion manquée par "+lastN(w.n));
 else M.cm=lastN(w.n)+" tente sa chance, ça passe à côté";
 if(!sp&&!pen&&Math.random()<.3){M.co[p]++;M.cm="Corner pour "+club(p);shot(p,o,false,true)}};

/* Faute : coup franc, carton jaune/rouge ou penalty */
const foul=(d,a)=>{M.fl[d]++;const w=who(d,["D","M"]);
 if(Math.random()<.06){ev("⚠️","Penalty pour "+club(a)+" ! Faute de "+lastN(w.n));if(Math.random()<.2)card(d,w);shot(a,d,true);return}
 const r=Math.random();
 if(r<.16)card(d,w);
 else if(r<.17){M.red[d]++;ev("🟥","Carton rouge direct pour "+lastN(w.n)+" ("+club(d)+")")}
 else M.cm="Faute de "+lastN(w.n)+", coup franc pour "+club(a);
 if(Math.random()<.2)shot(a,d,false,true)};

/* Une minute = 2 séquences de possession */
tick=function(){M.min++;Ts=[TM(0),TM(1)];
 for(let k=0;k<2;k++){
  const p=Math.random()<Ts[0].m/(Ts[0].m+Ts[1].m)?0:1,o=1-p,P=Ts[p],O=Ts[o];M.pc[p]++;M.by=rnd(15,85);
  const reach=cl(.24+(P.m-O.m)*.018+(P.a-O.d)*.012,.08,.5);
  if(Math.random()>reach){M.bx=cl(rnd(30,70)+(p?-8:8),5,95);if(Math.random()<.3)M.cm=pick(R).replace("{n}",lastN(who(p,["M","D"]).n));continue}
  M.bx=p?rnd(8,38):rnd(62,92);const r=Math.random();
  if(r<.09)foul(o,p);
  else if(r<.14)M.cm="Hors-jeu signalé contre "+lastN(who(p,["A"]).n);
  else shot(p,o)}
 if(Math.random()<.12){const d=Math.random()<.5?1:0,w=who(d,["D","M"]);M.fl[d]++;if(Math.random()<.13)card(d,w);else M.cm="Faute de "+lastN(w.n)}
 if(M.min===45)ev("⏱","Mi-temps : "+M.h+"-"+M.a);
 M.ps=Math.round(100*M.pc[0]/(M.pc[0]+M.pc[1]));
 draw();if(M.min>=90)endMatch()};

/* Initialisation d'un match */
const sm2=startMatch;startMatch=function(){sm2();const f=M.f,me=f.home===S.club,oc=me?f.away:f.home;
 Object.assign(M,{lu:xi(),in:{},sb:0,red:[0,0],yc:{},xg:[0,0],sot:[0,0],fl:[0,0],co:[0,0],pc:[1,1],oc,mineS:me?0:1,scr:[],op:pw(oc)/5.2*(.97+Math.random()*.06)})};

/* Fin de match : les buteurs réels remplacent l'attribution aléatoire d'origine */
const em2=endMatch;endMatch=function(){const snap=S.sq.map(p=>p.g);em2();S.sq.forEach((p,i)=>p.g=snap[i]);
 (M.scr||[]).forEach(id=>{const p=S.sq.find(x=>x.id===id);if(p)p.g++});sv()};

/* Affichage : joueurs qui suivent le ballon + stats avancées (xG, tirs cadrés, fautes, corners, rouges) */
const d0=draw;draw=function(){d0();if(!M||!M.xg)return;const pt=$("pt");
 if(pt)pt.querySelectorAll(".dt.hm,.dt.aw").forEach(e=>{e.style.left=cl(+e.dataset.x+(M.bx-50)*.62+rnd(-2,2),3,97)+"%";e.style.top=cl(+e.dataset.y+(M.by-50)*.3+rnd(-2,2),6,94)+"%"});
 const e=$("ms");if(e){let x=$("ms-extra");if(!x){x=document.createElement("div");x.id="ms-extra";e.appendChild(x)}x.innerHTML=[["Tirs",M.sh],["Tirs cadrés",M.sot],["xG",M.xg.map(v=>v.toFixed(2))],["Fautes",M.fl],["Corners",M.co],["Cartons rouges",M.red]].map(([l,v])=>`<div class="ar"><span>${l}</span><b>${v[0]} – ${v[1]}</b></div>`).join("")}};

/* Actions du manager pendant le match */
window.XE={
 sub(){if(!M||M.done||S.view!=="match")return;if(M.sb>=5)return alert("5 changements maximum.");
  const L=M.lu,ou=L.filter(p=>GRP[p.pos]!=="G").sort((a,b)=>mc(a)-mc(b))[0],
  bn=S.sq.filter(p=>!L.includes(p)&&!(p.inj>0)&&GRP[p.pos]===GRP[ou.pos]).sort((a,b)=>ef(b)-ef(a))[0];
  if(!bn)return alert("Aucun remplaçant disponible à ce poste.");
  if(!confirm("Remplacer "+ou.name+" (énergie "+Math.round(mc(ou))+"%) par "+bn.name+" ?"))return;
  L[L.indexOf(ou)]=bn;M.in[bn.id]=M.min;M.sb++;ev("🔄",club(M.mineS)+" : "+lastN(bn.name)+" remplace "+lastN(ou.name))},
 tac(){if(!M||M.done)return;const k=Object.keys(MEN),n=k[(k.indexOf(S.tc.m)+1)%k.length];S.tc.m=n;
  M.m=MEN[n].map((v,i)=>v*STY[S.tc.s||"Control Possession"][i]);ev("◈","Nouvelle mentalité : "+(FR[n]||n))}};

const vm=V.match;V.match=()=>vm().replace('<span id="pb"','<button class="speed-btn" onclick="XE.tac()">TACTIQUE</button><button class="speed-btn" onclick="XE.sub()">CHANGEMENT</button><span id="pb"');
})();

/* ===== PHASE 3 : STAFF, MORAL, CONTRATS ET DIAGNOSTIC ===== */

/* FM26 — Extension Phase 3 (à charger APRÈS fm26-phase1.js et fm26-phase2.js)
   Ajoute : staff (entraîneur / médecin / recruteur), moral individuel, vestiaire,
   contrats (expiration + prolongation), recrutement plus précis, diagnostic et réparation. */
(()=>{
const esc=s=>String(s).replace(/[<>&"'`]/g,"");
const r1=n=>Math.round(n*10)/10;
const val=p=>Math.round(p.ovr*p.ovr/60*.75)+1;
const row=(a,b)=>`<div class="ar"><span>${a}</span><b>${b}</b></div>`;
const STF={ent:["Entraîneur adjoint","Les joueurs progressent plus vite."],med:["Responsable médical","Blessures plus courtes, meilleure récupération."],rec:["Chef recruteur","Les notes estimées du marché sont plus précises."]};
const L=()=>S.stx;
const played=()=>S.fx.filter(f=>f.played).length;

/* Valeurs par défaut (anciennes sauvegardes comprises) */
const ens3=()=>{if(!S||!S.sq)return;
 const s=S.stx=S.stx&&typeof S.stx==="object"?S.stx:{};
 ["ent","med","rec"].forEach(k=>s[k]=cl(Math.round(+s[k]||1),1,5));
 S.sq.forEach(p=>{
  if(!Number.isFinite(p.ctr))p.ctr=2+(((p.id|0)*37+3)%4);
  p.ctr=cl(p.ctr,0,5);
  if(!Number.isFinite(p.mrl))p.mrl=70;
  p.mrl=cl(p.mrl,0,100)});
 (S.mk||[]).forEach(p=>{if(!p.sc){p.sc=1;p.u=Math.max(0,(p.u||0)-((s.rec-1)>>1))}})};

/* Match : un moral bas réduit la force réelle de l'équipe */
const sm3=startMatch;startMatch=function(){ens3();sm3();
 if(!M||!M.f||typeof M.hp!=="number"||typeof M.ap!=="number")return;
 const d=xi().reduce((s,p)=>s+(p.mrl-70)*.05,0)/11;
 if(M.f.home===S.club)M.hp+=d;else M.ap+=d;
 // Le moteur Phase 2 utilise aussi M.m[0] pour l'attaque de l'équipe contrôlée.
 if(Array.isArray(M.m)&&M.m.length)M.m[0]*=cl(1+d/100,.85,1.15)};

/* Après le match : médecin, progression, moral, demandes de départ, coût du staff */
const em3=endMatch;endMatch=function(){ens3();
 const X0=new Set(xi().map(p=>p.id)),hurt=new Set(S.sq.filter(p=>p.inj>0).map(p=>p.id));
 em3();ens3();
 const me=M.f.home===S.club,mg=me?M.h:M.a,og=me?M.a:M.h,st=L(),w=mg>og?1:mg<og?-1:0;
 const ovs=S.sq.map(p=>p.ovr).sort((a,b)=>a-b),med=ovs[ovs.length>>1];
 S.sq.forEach(p=>{
  if(p.inj>0&&!hurt.has(p.id)){const red=(st.med-1)>>1;if(red)p.inj=Math.max(1,p.inj-red)}
  p.cond=cl(p.cond+(st.med-1)*.8,0,100);
  if(p.ovr<p.pot&&p.age<30&&Math.random()<.012*(st.ent-1)*(p.age<24?1.6:1)){p.ovr++;p.val=val(p)}
  let d=w*.5;
  if(X0.has(p.id))d+=w>0?2.5:w<0?-2:.5;
  else if(!(p.inj>0)&&p.ovr>=med)d-=1.5;
  p.mrl=r1(cl(p.mrl+d+(70-p.mrl)*.05,0,100));
  if(p.mrl<30&&!p.rq){p.rq=1;mail("Vestiaire",p.name+" est mécontent",p.name+" demande à quitter le club. Parle-lui dans l'écran Vestiaire.")}
  else if(p.mrl>=50)p.rq=0});
 const avg=S.sq.reduce((s,p)=>s+p.mrl,0)/S.sq.length;
 if(Number.isFinite(S.mor))S.mor=cl(Math.round(S.mor+(avg-70)/20),0,100);
 if(S.fi){const c=.03*(st.ent+st.med+st.rec);S.fi.e+=c;S.bud=r1(S.bud-c*.3)}
 /* Boîte mail : limite la taille (carrière longue), seulement si le plus récent est en tête */
 if(S.ib&&S.ib.length>200&&S.ib[0].d>S.ib[S.ib.length-1].d){S.ib.length=120;S.mi=0}
 try{localStorage.setItem(K+"_bak",JSON.stringify(S))}catch(e){}
 sv()};

/* Nouvelle saison : fins de contrat */
const ns3=newSeason;newSeason=function(){ens3();ns3();ens3();
 S.sq.forEach(p=>p.ctr--);
 const left=[];
 S.sq.filter(p=>p.ctr<=0).sort((a,b)=>a.ovr-b.ovr).forEach(p=>{
  const gk=S.sq.filter(x=>x.pos==="GK").length;
  if(S.sq.length>16&&!(p.pos==="GK"&&gk<=2)){S.sq=S.sq.filter(x=>x.id!==p.id);left.push(p.name)}else p.ctr=1});
 if(left.length)mail("Direction","Fins de contrat","Sont partis libres : "+left.join(", ")+".");
 const soon=S.sq.filter(p=>p.ctr===1).map(p=>p.name);
 if(soon.length)mail("Direction","Contrats à renégocier","Contrat qui expire l'an prochain : "+soon.slice(0,8).join(", ")+(soon.length>8?"…":"")+".");
 sv()};

/* Les nouvelles recrues arrivent avec un contrat long et un bon moral */
if(window.XF&&XF.buy){const b0=XF.buy;XF.buy=function(i){const n=S.sq.length;b0(i);if(S.sq.length>n){const q=S.sq[S.sq.length-1];q.ctr=4;q.mrl=75;sv()}}}
if(V.xfer){const x0=V.xfer;V.xfer=()=>{ens3();return x0()}}

/* Écran Vestiaire (moral + contrats) */
V.vest=()=>{ens3();const t=S.vt||"Moral",n=played();
 const tabs=`<div class="wr" style="margin-bottom:10px">${["Moral","Contrats"].map(k=>`<button class="chip${t===k?" on":""}" onclick="XF3.tab('${k}')">${k}</button>`).join("")}</div>`;
 if(t==="Moral"){const avg=S.sq.reduce((s,p)=>s+p.mrl,0)/S.sq.length;
  return tabs+`<div class="gr" style="grid-template-columns:300px minmax(0,1fr)"><div class="pn"><h3>Ambiance du vestiaire</h3><div class="big">${avg.toFixed(0)}%</div><p class="mu">Moral moyen du groupe</p>${row("Joueurs mécontents",S.sq.filter(p=>p.mrl<50).length)}${row("Demandes de départ",S.sq.filter(p=>p.rq).length)}<p class="mu">Les titulaires gagnent en moral avec les victoires ; les bons joueurs laissés sur le banc s'agacent. Un moral bas réduit la force réelle en match.</p></div>
<div class="pn"><h3>Moral des joueurs</h3><table><tr><th>Joueur</th><th>Poste</th><th>Moral</th><th>Statut</th><th></th></tr>${S.sq.slice().sort((a,b)=>a.mrl-b.mrl).map(p=>`<tr><td>${p.name}</td><td>${p.pos}</td><td style="width:26%"><div class="bar"><i style="width:${p.mrl}%"></i></div></td><td>${p.rq?`<span class="b l">Veut partir</span>`:p.mrl<50?`<span class="b m">Mécontent</span>`:`<span class="b h">Heureux</span>`}</td><td><button class="chip" onclick="XF3.talk(${p.id})">${p.tk===n?"Fait":"Discuter"}</button></td></tr>`).join("")}</table></div></div>`}
 return tabs+`<div class="pn"><h3>Contrats</h3><table><tr><th>Joueur</th><th>Poste</th><th>Âge</th><th>Salaire</th><th>Contrat</th><th></th></tr>${S.sq.slice().sort((a,b)=>a.ctr-b.ctr).map(p=>`<tr><td>${p.name}</td><td>${p.pos}</td><td>${p.age}</td><td>€${Math.round(p.sal/1e3)}k</td><td>${p.ctr<=1?`<span class="b l">${p.ctr} an</span>`:`${p.ctr} ans`}</td><td><button class="chip" onclick="XF3.ren(${p.id})">Prolonger</button></td></tr>`).join("")}</table><p class="mu">Prolongation : salaire +15 % et prime de signature (10 % de la valeur). Un joueur au moral inférieur à 40 refuse de négocier. Les contrats expirés partent libres à la nouvelle saison.</p></div>`};

/* Écran Staff */
V.staff=()=>{ens3();const st=L();
 return`<div class="gr g3">${Object.keys(STF).map(k=>`<div class="pn"><h3>${STF[k][0]}</h3><div class="big">Niv. ${st[k]}/5</div><div class="bar"><i style="width:${st[k]*20}%"></i></div><p class="mu">${STF[k][1]}</p>${st[k]<5?`<button class="btn" onclick="XF3.up('${k}')">Améliorer · €${4*st[k]}M</button>`:`<p class="mu">Niveau maximal</p>`}</div>`).join("")}</div>
<p class="mu" style="margin-top:12px">Coût de fonctionnement : €${(.03*(st.ent+st.med+st.rec)).toFixed(2)}M par match. Budget disponible : €${S.bud}M.</p>`};

/* Diagnostic (tests de cohérence P0 : effectif, calendrier, classement, budget, sauvegarde) */
const diag=()=>{const o=[],sq=S.sq,cs=LG[S.lg]||[],fx=S.fx||[],add=(ok,t,d)=>o.push([ok,t,esc(d||"")]);
 add(sq.length>=16&&sq.length<=30,"Effectif entre 16 et 30 joueurs",sq.length+" joueurs");
 add(sq.some(p=>p.pos==="GK"),"Au moins un gardien","");
 add(new Set(sq.map(p=>p.id)).size===sq.length,"Identifiants joueurs uniques","");
 add(sq.every(p=>GRP[p.pos]&&p.ovr>0&&p.sal>=0&&p.cond>=0&&p.cond<=100),"Données joueurs valides","");
 const dispo=sq.filter(p=>!(p.inj>0)).length;add(dispo>=11,"11 joueurs disponibles minimum",dispo+" disponibles");
 add(Number.isFinite(S.bud)&&S.bud>=0,"Budget valide","€"+S.bud+"M");
 add(new Set(fx.map(f=>f.id)).size===fx.length,"Aucun match dupliqué",fx.length+" matchs");
 add(fx.every(f=>f.home!==f.away&&cs.includes(f.home)&&cs.includes(f.away)),"Calendrier cohérent","");
 if(!fx.every(f=>f.home===S.club||f.away===S.club)){const c={};cs.forEach(x=>c[x]=0);fx.forEach(f=>{c[f.home]++;c[f.away]++});const v=cs.map(x=>c[x]);add(v.length>0&&v.every(n=>n===v[0]),"Toutes les équipes jouent autant de matchs","")}
 const tb=JSON.stringify(S.tb||"");add(cs.every(c=>tb.includes(c)),"Toutes les équipes figurent au classement","");
 const kb=Math.round(JSON.stringify(S).length/1024);add(kb<2500,"Taille de la sauvegarde",kb+" Ko");
 add(!S.ib||S.ib.length<=200,"Boîte mail raisonnable",(S.ib?S.ib.length:0)+" messages");
 return o};
const diagHtml=()=>{ens3();let r;try{r=diag()}catch(e){r=[[false,"Diagnostic",esc(e.message)]]}
 const bad=r.filter(x=>!x[0]).length;
 return`<div class="pn" style="margin-top:12px"><h3>Diagnostic de la carrière</h3>${r.map(x=>row((x[0]?"✔ ":"❗ ")+x[1],x[2])).join("")}<p class="mu">${bad?bad+" point(s) à vérifier.":"Tout est cohérent."}</p><button class="btn" onclick="XF3.fix()">Réparer automatiquement</button></div>`};
if(V.save){const v0=V.save;V.save=()=>v0()+diagHtml()}

window.XF3={
 tab(t){S.vt=t;render()},
 talk(id){const p=S.sq.find(x=>x.id===id);if(!p)return;const n=played();
  if(p.tk===n)return alert("Tu as déjà parlé à "+p.name+" cette semaine.");
  p.tk=n;p.mrl=r1(cl(p.mrl+8,0,100));sv();render()},
 ren(id){ens3();const p=S.sq.find(x=>x.id===id);if(!p)return;
  if(p.mrl<40)return alert(p.name+" refuse de négocier : son moral est trop bas.");
  if(p.ctr>=4)return alert("Le contrat de "+p.name+" est déjà long.");
  const bonus=r1(p.val*.1),ns=Math.round(p.sal*1.15);
  if(S.bud<bonus)return alert("Budget insuffisant : il manque €"+r1(bonus-S.bud)+"M.");
  if(!confirm("Prolonger "+p.name+" ? Salaire €"+Math.round(ns/1e3)+"k, prime €"+bonus+"M."))return;
  p.sal=ns;p.ctr=Math.min(5,p.ctr+(p.age<30?4:2));p.mrl=r1(cl(p.mrl+5,0,100));S.bud=r1(S.bud-bonus);
  mail("Direction","Prolongation : "+p.name,p.name+" prolonge jusqu'en "+(S.season+p.ctr)+".");sv();render()},
 up(k){ens3();const st=L();if(!STF[k]||st[k]>=5)return;const c=4*st[k];
  if(S.bud<c)return alert("Budget insuffisant : il manque €"+r1(c-S.bud)+"M.");
  st[k]++;S.bud=r1(S.bud-c);mail("Direction","Staff : "+STF[k][0],"Niveau "+st[k]+" atteint pour €"+c+"M.");sv();render()},
 fix(){ens3();let n=0;const num=(o,k,d)=>{if(!Number.isFinite(o[k])){o[k]=d;n++}};
  num(S,"bud",0);if(S.bud<0){S.bud=0;n++}
  S.sq.forEach(p=>{num(p,"ovr",60);num(p,"pot",p.ovr);num(p,"age",25);num(p,"sal",0);num(p,"val",val(p));num(p,"cond",100);num(p,"inj",0);if(!GRP[p.pos]){p.pos="MC";n++}});
  sv();render();alert(n?n+" valeur(s) corrigée(s).":"Rien à réparer.")}};

if(!NAV.some(n=>n[0]==="vest")){const i=NAV.findIndex(n=>n[0]==="save"),it=[["vest","Vestiaire","☺"],["staff","Staff","☰"]];
 if(i<0)NAV.push(...it);else NAV.splice(i,0,...it)}
const T3={vest:"Vestiaire",staff:"Staff"},r3=render;
render=function(){ens3();r3();if(T3[S.view]){const h=document.querySelector("#hd h2");if(h)h.textContent=T3[S.view]}};
if(S){ens3();render()}
})();