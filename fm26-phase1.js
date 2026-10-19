/* FM26 — Extension Phase 1 (chargée APRÈS le script principal de index.html)
   Ajoute : entraînement, blessures/fatigue, finances réelles, recrutement, sauvegardes export/import + secours, validation. */
(()=>{
const esc=s=>String(s??"").replace(/[<>&\u0000-\u001f]/g,"").slice(0,80);
const eff=p=>p.ovr*(.88+.12*p.cond/100)*(p.inj>0?0:1);
const r1=n=>Math.round(n*10)/10;
const PL={"Équilibré":"Charge équilibrée : bonne récupération, progression lente.","Physique":"Endurance en hausse, mais fatigue plus forte.","Technique":"Meilleure progression des jeunes, charge modérée.","Tactique":"Familiarité tactique en hausse : bonus en match.","Récupération":"Forte récupération, aucune progression."};
const mkMk=()=>{const big=BIG.includes(S.club),cs=Object.values(LG).flat().filter(c=>c!==S.club);return Array.from({length:12},()=>{const p=mkP(pick(POS),(big?78:70)+rnd(-5,8),0);p.club=pick(cs);p.u=rnd(1,3);p.price=Math.max(1,Math.round(p.val*(1+rnd(5,25)/100)));return p})};
const ens=()=>{if(!S||!S.sq)return;S.tr=S.tr||"Équilibré";S.fam=S.fam||0;S.fi=S.fi||{r:0,e:0};S.mg=esc(S.mg);
 S.sq.forEach(p=>{p.inj=p.inj||0;p.cond=cl(p.cond==null?100:p.cond,0,100);p.sal=Math.max(0,p.sal||0);if(!GRP[p.pos])p.pos="MC"});
 if(!S.mk||!S.mk.length)S.mk=mkMk()};
const ok=o=>!!(o&&Array.isArray(o.sq)&&o.sq.length>=11&&Array.isArray(o.fx)&&o.tb&&LG[o.lg]&&LG[o.lg].includes(o.club)&&o.sq.every(p=>p&&GRP[p.pos]&&p.a&&p.sal>=0&&p.ovr>0));
const load=t=>{let o;try{o=JSON.parse(t)}catch(e){}if(!ok(o))return alert("Sauvegarde invalide : fichier refusé. Ta carrière actuelle n'a pas été modifiée.");localStorage.setItem(K,JSON.stringify(o));location.reload()};

/* Composition : exclut les blessés, favorise les joueurs frais (rotation) */
xi=function(){const u=new Set(),r=[],ok=S.sq.filter(p=>!(p.inj>0)),pool=ok.length>=11?ok:S.sq;
 for(const s of FM[S.tc.f]){const c=pool.filter(p=>!u.has(p.id)),b=f=>c.filter(f).sort((a,b)=>eff(b)-eff(a))[0],p=b(x=>x.pos===s[2])||b(x=>GRP[x.pos]===GRP[s[2]])||b(x=>1);u.add(p.id);r.push(p)}return r};

/* Match : la fatigue et la familiarité tactique modifient la force réelle */
const sm=startMatch;startMatch=function(){ens();sm();const X=xi(),d=X.reduce((s,p)=>s+eff(p)-p.ovr,0)/11+S.fam/10;if(M.f.home===S.club)M.hp+=d;else M.ap+=d};

/* Après chaque match : blessures, entraînement, finances, marché, copie de secours */
const em=endMatch;endMatch=function(){em();ens();const f=M.f,home=f.home===S.club,t=S.tr;
 S.sq.forEach(p=>{if(p.inj>0)p.inj--});
 const X=xi();
 X.forEach(p=>{if(Math.random()<(p.cond<70?.09:.035)){p.inj=rnd(1,8);mail("Service médical",p.name+" est blessé","Absent environ "+p.inj+" match(s). Il est retiré de la composition.")}});
 S.sq.forEach(p=>{const pl=X.includes(p);
  if(t==="Récupération")p.cond=cl(p.cond+(pl?10:14),0,100);
  else if(t==="Physique"){p.cond=cl(p.cond+(pl?-3:4),0,100);if(Math.random()<.1)p.a.Stamina=cl(p.a.Stamina+1,1,20)}
  else p.cond=cl(p.cond+(pl?2:6),0,100);
  const g={"Technique":.07,"Équilibré":.04,"Tactique":.03,"Physique":.03,"Récupération":0}[t]*(p.age<24?1.6:1);
  if(p.ovr<p.pot&&p.age<30&&Math.random()<g){p.ovr++;p.val=Math.round(p.ovr*p.ovr/60*.75)+1}});
 if(t==="Tactique")S.fam=Math.min(10,S.fam+1);
 const wb=S.sq.reduce((s,p)=>s+p.sal,0)/1e6,rev=1.1+(BIG.includes(S.club)?.9:.3)+(home?.8+S.fans/100:0);
 S.fi.r+=rev;S.fi.e+=wb;S.bud=r1(S.bud+(rev-wb)*.3);
 if(f.id%3===2)S.mk=mkMk();
 try{localStorage.setItem(K+"_bak",JSON.stringify(S))}catch(e){}
 sv()};

const ns=newSeason;newSeason=function(){ns();S.fi={r:0,e:0};S.fam=0;S.mk=mkMk();sv()};

/* Sécurité : retire les caractères HTML du nom saisi à la création */
const sc0=startCareer;startCareer=function(){["fn","ln"].forEach(i=>$(i).value=esc($(i).value));sc0()};$("start").onclick=startCareer;

const row=(a,b)=>`<div class="ar"><span>${a}</span><b>${b}</b></div>`;
V.train=()=>{ens();return`<div class="gr" style="grid-template-columns:300px minmax(0,1fr)"><div class="pn"><h3>Plan de la semaine</h3><div class="wr">${Object.keys(PL).map(k=>`<button class="chip${S.tr===k?" on":""}" onclick="XF.tr('${k}')">${k}</button>`).join("")}</div><p class="mu">${PL[S.tr]}</p>${row("Familiarité tactique",S.fam+"/10")}</div>
<div class="pn"><h3>Condition de l'effectif</h3><table><tr><th>Joueur</th><th>Poste</th><th>Condition</th><th>Statut</th></tr>${S.sq.slice().sort((a,b)=>a.cond-b.cond).map(p=>`<tr class="cp" onclick="openP(${p.id})"><td>${p.name}</td><td>${p.pos}</td><td style="width:30%"><div class="bar"><i style="width:${p.cond}%"></i></div></td><td>${p.inj>0?`<span class="b l">Blessé ${p.inj} m.</span>`:p.cond<70?`<span class="b m">Fatigué</span>`:`<span class="b h">Apte</span>`}</td></tr>`).join("")}</table></div></div>`};

V.fin=()=>{ens();const wb=S.sq.reduce((s,p)=>s+p.sal,0)/1e6,n=S.fi.r-S.fi.e;return`<div class="gr g3"><div class="pn"><h3>Budget transferts</h3><div class="big">€${S.bud}M</div></div><div class="pn"><h3>Masse salariale</h3><div class="big">€${wb.toFixed(2)}M</div><p class="mu">par semaine</p></div><div class="pn"><h3>Valeur de l'effectif</h3><div class="big">€${S.sq.reduce((s,p)=>s+p.val,0)}M</div></div></div>
<div class="gr g3" style="margin-top:12px"><div class="pn"><h3>Revenus de la saison</h3><div class="big">€${S.fi.r.toFixed(1)}M</div></div><div class="pn"><h3>Dépenses de la saison</h3><div class="big">€${S.fi.e.toFixed(1)}M</div></div><div class="pn"><h3>Résultat</h3><div class="big" style="color:${n>=0?"#85d36b":"#f0717d"}">€${n.toFixed(1)}M</div></div></div>`};

V.xfer=()=>{ens();return`<div class="gr" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="pn"><h3>Marché des transferts · budget €${S.bud}M</h3><table><tr><th>Joueur</th><th>Poste</th><th>Âge</th><th>Note estimée</th><th>Prix</th><th></th></tr>${S.mk.map((p,i)=>`<tr><td><b>${p.name}</b><br><small class="mu">${p.club}</small></td><td>${p.pos}</td><td>${p.age}</td><td><i class="b">${p.ovr-p.u}–${p.ovr+p.u}</i></td><td>€${p.price}M</td><td><button class="chip" onclick="XF.buy(${i})">Acheter</button></td></tr>`).join("")}</table><p class="mu">Les notes sont des estimations de recruteur ; la vraie valeur se révèle après la signature.</p></div>
<div class="pn"><h3>Mon effectif (${S.sq.length})</h3><table><tr><th>Joueur</th><th>Poste</th><th>Vente</th><th></th></tr>${S.sq.slice().sort((a,b)=>b.val-a.val).map(p=>`<tr><td>${p.name}</td><td>${p.pos}</td><td>€${r1(p.val*.9)}M</td><td><button class="chip" onclick="XF.sell(${p.id})">Vendre</button></td></tr>`).join("")}</table></div></div>`};

V.save=()=>`<div class="gr g3"><div class="pn"><h3>Exporter</h3><p class="mu">Télécharge ta carrière en fichier .json.</p><button class="btn" onclick="XF.exp()">Exporter</button></div><div class="pn"><h3>Importer</h3><p class="mu">Le fichier est vérifié avant chargement.</p><input type="file" accept=".json" onchange="XF.imp(this.files[0])"></div><div class="pn"><h3>Copie de secours</h3><p class="mu">Créée automatiquement après chaque match.</p><button class="btn" onclick="XF.bak()">Restaurer</button></div></div>`;

window.XF={
 tr(k){S.tr=k;sv();render()},
 buy(i){ens();const p=S.mk[i];if(!p)return;
  if(S.sq.length>=30)return alert("Effectif complet (30 joueurs maximum).");
  if(S.bud<p.price)return alert("Budget insuffisant : il manque €"+r1(p.price-S.bud)+"M.");
  const{price,u,club,...q}=p,id=Math.max(...S.sq.map(x=>x.id))+1;q.id=id;q.no=id+1;S.sq.push(q);S.mk.splice(i,1);S.bud=r1(S.bud-price);
  mail("Direction","Transfert : "+q.name,q.name+" ("+q.pos+") rejoint "+S.club+" pour €"+price+"M.");sv();render()},
 sell(id){const p=S.sq.find(x=>x.id===id);if(!p)return;
  if(S.sq.length<=16)return alert("Il faut garder au moins 16 joueurs.");
  if(p.pos==="GK"&&S.sq.filter(x=>x.pos==="GK").length<2)return alert("Tu dois garder au moins 1 gardien.");
  if(!confirm("Vendre "+p.name+" pour €"+r1(p.val*.9)+"M ?"))return;
  S.bud=r1(S.bud+p.val*.9);S.sq=S.sq.filter(x=>x.id!==id);mail("Direction","Vente : "+p.name,p.name+" quitte le club pour €"+r1(p.val*.9)+"M.");sv();render()},
 exp(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:"application/json"}));a.download="fm26-"+S.club.replace(/\W+/g,"-")+"-saison"+S.season+".json";a.click()},
 imp(f){if(f)f.text().then(load)},
 bak(){const t=localStorage.getItem(K+"_bak");t?load(t):alert("Aucune copie de secours pour le moment.")}};

NAV.splice(4,0,["train","Entraînement","⚒"],["xfer","Recrutement","⇄"]);NAV.push(["save","Sauvegardes","⬇"]);
const T2={train:"Entraînement",xfer:"Recrutement",save:"Sauvegardes"},r0=render;
render=function(){ens();r0();if(T2[S.view]){const h=document.querySelector("#hd h2");if(h)h.textContent=T2[S.view]}};
if(S){ens();render()}
})();