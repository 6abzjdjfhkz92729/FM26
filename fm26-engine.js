/* FM26 — Engine layer 2
   Coherent live-match statistics, tactical phases, data centre, academy and staff.
   Loads after index.html and fm26-phase1.js. This is an original simulation engine. */
(()=>{
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const avg=(arr,key)=>arr.length?arr.reduce((n,p)=>n+(Number(p?.a?.[key])||0),0)/arr.length:12;
  const safeNum=(n,min,max,fallback=0)=>Number.isFinite(Number(n))?clamp(Number(n),min,max):fallback;
  const freshStats=()=>({passes:[0,0],completed:[0,0],shots:[0,0],shotsOnTarget:[0,0],saves:[0,0],fouls:[0,0],yellow:[0,0],red:[0,0],corners:[0,0],offsides:[0,0],xg:[0,0],keyPasses:[0,0],tackles:[0,0],recoveries:[0,0],possession:[0,0]});
  const copy=o=>JSON.parse(JSON.stringify(o));
  const options=()=>Object.keys(FM);
  const USER_POS=()=>S.club;
  const userTeamSide=()=>M?.f?.home===S.club?0:1;
  const teamName=side=>side===0?M.f.home:M.f.away;
  const userHasBall=side=>teamName(side)===S.club;
  const teamPlayers=side=>userHasBall(side)?xi():[];
  const ability=(side,key)=>{
    if(userHasBall(side)){
      const ps=teamPlayers(side);
      const aliases={pass:'Passing',vision:'Vision',dribble:'Dribbling',finish:'Finishing',pace:'Pace',tackle:'Tackling',position:'Positioning',anticipation:'Anticipation',composure:'Composure',stamina:'Stamina',keeper:'Reflexes'};
      const val=avg(ps,aliases[key]||key);
      const mean=(field,fallback)=>ps.length?ps.reduce((total,p)=>total+(Number(p[field])||fallback),0)/ps.length:fallback;
      const condition=mean('cond',85);
      const morale=mean('morale',70);
      const form=mean('form',7);
      const stamina=avg(ps,'Stamina')||12;
      // Low condition, confidence and form reduce the technical execution of the whole selected XI.
      const readiness=(condition-85)*.045+(morale-70)*.028+(form-7)*.72;
      // Players with lower stamina lose more precision and intensity in the final stages.
      const matchLoad=Math.max(0,((Number(M.min)||0)-55)/8)*clamp((15-stamina)/10,0,1);
      const fatiguePenalty=key==='keeper'?matchLoad*.55:matchLoad;
      return clamp((val||12)+readiness-fatiguePenalty,4,20);
    }
    const power=safeNum(side===0?M.hp:M.ap,35,100,68);
    return clamp(11+(power-68)*.28+((hash(teamName(side)+key)%7)-3)*.35,6,18);
  };
  const style=side=>userHasBall(side)?(S.tc.s||'Control Possession'):(['Control Possession','Counter-Attack','Gegenpress','Wing Play'][hash(teamName(side))%4]);
  const mentality=side=>userHasBall(side)?(S.tc.m||'Balanced'):'Balanced';
  const note=(k,t)=>{M.ev.unshift({m:M.min,k,t});M.ev=M.ev.slice(0,80);M.cm=t;};
  const tickPossession=()=>{const sum=M.possTicks[0]+M.possTicks[1];M.ps=sum?Math.round(100*M.possTicks[0]/sum):50;};
  const finishAction=(side,xg,desc)=>{
    const other=1-side;M.sh[side]++;M.stats.shots[side]=(M.stats.shots[side]||0)+1;M.stats.xg[side]+=xg;
    const target=clamp(.36+xg*.9+(ability(side,'finish')-12)*.012, .22,.83);
    const onTarget=Math.random()<target;
    if(onTarget){M.stats.shotsOnTarget[side]++;}
    if(Math.random()<xg){
      if(side===0)M.h++;else M.a++;
      M.stats.shotsOnTarget[side]=Math.max(1,M.stats.shotsOnTarget[side]);
      const scorer=userHasBall(side)?pick(xi().filter(p=>p.pos!=='GK')):null;
      if(scorer){scorer.g=(scorer.g||0)+1;M.lastScorer=scorer.name;}
      const label=teamName(side)+' marque ! '+M.h+'-'+M.a;
      note('⚽',label+(scorer?' ('+scorer.name+')':''));M.gt=18;M.gc=label;M.gk=teamName(side);
      M.zone[side]=1;M.possessionSide=other;M.zone[other]=2;M.bx=side===0?94:6;M.by=50;
    }else{
      if(onTarget)M.stats.saves[other]++;
      if(Math.random()<.23){M.stats.corners[side]++;note('◩','Corner pour '+teamName(side)+'.');M.zone[side]=3;}
      else {note('◉',desc+' — le tir ne trouve pas le cadre.');M.possessionSide=other;M.zone[other]=2;M.zone[side]=1;}
    }
  };
  const updateBall=()=>{
    const s=M.possessionSide??0,z=clamp(M.zone[s]??2,0,4);
    M.bx=s===0?8+z*21:92-z*21;M.by=clamp(50+(Math.random()-.5)*(z>=3?48:65),7,93);
  };
  const oldTick=tick;
  tick=function(){
    if(!M||M.done||M.p)return;
    M.min=Math.min(90,(M.min||0)+1);
    if(!M.stats)M.stats=freshStats();if(!M.possTicks)M.possTicks=[0,0];if(!M.zone)M.zone=[2,2];
    const side=M.possessionSide===0||M.possessionSide===1?M.possessionSide:(M.possessionSide=Math.random()<.52?0:1),other=1-side;
    M.possTicks[side]++;M.stats.possession[side]++;tickPossession();
    const pass=ability(side,'pass'),press=ability(other,'tackle'),pace=ability(side,'pace'),vision=ability(side,'vision'),fin=ability(side,'finish');
    const st=style(side),men=mentality(side);
    const passBonus=st==='Tiki-Taka'||st==='Control Possession'?0.055:st==='Route One'?-0.04:0;
    const pressBonus=st==='Gegenpress'?.035:0;
    const passChance=clamp(.77+(pass-12)*.012+(vision-12)*.004+passBonus-(press-12)*.006,.58,.94);
    const lossChance=clamp(.075+(press-12)*.006-(pace-12)*.003+pressBonus,.035,.18);
    let shotTaken=false;
    if(Math.random()<lossChance){
      M.stats.tackles[other]++;M.stats.recoveries[other]++;
      note('↔',teamName(other)+' récupère le ballon.');M.possessionSide=other;M.zone[other]=clamp(4-(M.zone[side]||2)+((ability(other,'vision')>12)?1:0),0,4);
    }else{
      M.stats.passes[side]++;
      if(Math.random()<passChance){
        M.stats.completed[side]++;
        const progressChance=clamp(.26+(vision-12)*.012+(men==='Attacking'?.12:men==='Cautious'?-.08:0)+(st==='Wing Play'?.06:0),.08,.58);
        if(Math.random()<progressChance)M.zone[side]=clamp((M.zone[side]||2)+1,0,4);
        else if(Math.random()<.15)M.zone[side]=clamp((M.zone[side]||2)-1,0,4);
        if(Math.random()<.11){M.stats.keyPasses[side]++;note('➜',teamName(side)+' trouve une passe vers l’avant.');}
        else if(Math.random()<.38)M.cm=teamName(side)+' fait circuler le ballon.';
      }else{
        note('↔','Passe interceptée par '+teamName(other)+'.');M.possessionSide=other;M.zone[other]=clamp(4-(M.zone[side]||2),0,4);
      }
    }
    const current=M.possessionSide;
    const z=clamp(M.zone[current]||2,0,4);
    if(current===side&&z>=3&&Math.random()<(z===4?.23:.11)){
      shotTaken=true;
      const keeper=ability(other,'keeper'),pressure=ability(other,'position');
      const base=z===4?.22:z===3?.095:.045;
      const xg=clamp(base+(fin-12)*.013+(ability(side,'composure')-12)*.004-(keeper-12)*.008-(pressure-12)*.004+(men==='Attacking'?.025:men==='Cautious'?-.018:0),.015,.62);
      const shooter=userHasBall(side)?pick(xi().filter(p=>p.pos!=='GK')):null;
      finishAction(side,xg,(shooter?.name||teamName(side))+' tente sa chance');
    }
    if(Math.random()<.052){
      M.stats.fouls[other]++;note('⚑','Faute sifflée contre '+teamName(other)+'.');
      if(Math.random()<.14){
        M.stats.yellow[other]++;note('🟨','Carton jaune pour '+teamName(other)+'.');
        if(userHasBall(other)){
          const candidates=xi().filter(p=>p.pos!=='GK');const p=candidates.length?pick(candidates):null;
          if(p){p.yellow=(p.yellow||0)+1;if(p.yellow>=5){p.susp=Math.max(p.susp||0,2);p.yellow=0;mail('Discipline',p.name+' est suspendu','Accumulation de cartons : indisponible pour le prochain match.');}}
        }
      }
      if(Math.random()<.009){
        M.stats.red[other]++;note('🟥','Carton rouge pour '+teamName(other)+'.');
        if(userHasBall(other)){const candidates=xi().filter(p=>p.pos!=='GK');const p=candidates.length?pick(candidates):null;if(p){p.susp=Math.max(p.susp||0,2);mail('Discipline',p.name+' est expulsé',p.name+' sera suspendu au prochain match.');}}
        if(other===0)M.hp*=.91;else M.ap*=.91;
      }
      if(z>=4&&Math.random()<.09){
        const pxg=.76;M.sh[current]++;M.stats.shots[current]=(M.stats.shots[current]||0)+1;M.stats.xg[current]+=pxg;M.stats.shotsOnTarget[current]++;
        if(Math.random()<pxg){if(current===0)M.h++;else M.a++;note('⚽','Penalty transformé par '+teamName(current)+' ! '+M.h+'-'+M.a);M.gt=18;M.gc='Penalty transformé';M.gk=teamName(current);}else{M.stats.saves[other]++;note('◉','Le penalty est arrêté !');}
        M.possessionSide=other;M.zone[other]=2;M.zone[current]=1;
      }
    }
    if(!shotTaken&&Math.random()<.007&&z>=3){M.stats.offsides[current]++;note('↗','Hors-jeu contre '+teamName(current)+'.');M.possessionSide=other;M.zone[other]=2;}
    updateBall();tickPossession();draw();
    if(M.min>=90)endMatch();
  };
  const oldStart=startMatch;
  startMatch=function(){
    oldStart();
    if(!M)return;
    M.stats=freshStats();M.possTicks=[0,0];M.possessionSide=Math.random()<.52?0:1;M.zone=[2,2];
    M.suspensionsToServe=[];M.lastScorer='';
  };
  const oldXI=xi;
  xi=function(){const active=S.sq.filter(p=>!(p.inj>0)&&!(p.susp>0));const source=active.length>=11?active:S.sq;const u=new Set(),out=[];for(const spot of FM[S.tc.f]){const pool=source.filter(p=>!u.has(p.id));const best=fn=>pool.filter(fn).sort((a,b)=>(b.ovr*(.88+.12*(b.cond||100)/100))-(a.ovr*(.88+.12*(a.cond||100)/100)))[0];const p=best(x=>x.pos===spot[2])||best(x=>GRP[x.pos]===GRP[spot[2]])||best(x=>true);if(p){u.add(p.id);out.push(p)}}return out.length===11?out:oldXI();};
  const oldEnd=endMatch;
  endMatch=function(){
    if(M&&M.f){M.f.stats=copy(M.stats||freshStats());M.f.stats.possession=copy(M.possTicks||[0,0]);for(const p of S.sq){if(p.susp>0)p.susp=Math.max(0,p.susp-1);}}
    oldEnd();
    if(S){S.youth=S.youth||[];S.staff=S.staff||[];S.youth.forEach(p=>{if(p.age<21&&p.ovr<p.pot&&Math.random()<.035){p.ovr++;p.val=Math.round(p.ovr*p.ovr/100)+1;}});sv();}
  };
  const oldDraw=draw;
  draw=function(){oldDraw();if(!M||!M.stats)return;const node=document.querySelector('#ms');if(!node)return;const s=M.stats;const rows=[['xG',M.f.home+' '+(s.xg[0]||0).toFixed(2)+' – '+(s.xg[1]||0).toFixed(2)+' '+M.f.away],['Passes réussies',(s.completed[0]||0)+'/'+(s.passes[0]||0)+' – '+(s.completed[1]||0)+'/'+(s.passes[1]||0)],['Tirs cadrés',(s.shotsOnTarget[0]||0)+' – '+(s.shotsOnTarget[1]||0)],['Fautes',(s.fouls[0]||0)+' – '+(s.fouls[1]||0)]];node.insertAdjacentHTML('beforeend',rows.map(r=>`<div class="ar"><span>${r[0]}</span><b>${r[1]}</b></div>`).join(''));};

  function upgradeCalendar(){if(!S||!Array.isArray(S.fx)||!LG[S.lg])return;const total=LG[S.lg].length*(LG[S.lg].length-1),oldLeague=S.fx.filter(f=>!f.cupKey&&(!f.comp||f.comp===S.lg));if(oldLeague.length>=total){S.calendarVersion=2;return;}const old=S.fx.slice(),current=S.date;const base=new Date(old[0]?.date||'2026-08-01T12:00:00Z');base.setDate(base.getDate()-7);S.date=base.toISOString().slice(0,10);const all=mkFx();S.date=current;const day=String(current||'2026-08-01').slice(0,10);all.forEach(f=>{const prev=old.find(x=>!x.cupKey&&(!x.comp||x.comp===S.lg)&&x.home===f.home&&x.away===f.away);if(prev&&prev.played&&/^\d+-\d+$/.test(prev.score||'')){f.played=true;f.score=prev.score;f.stats=prev.stats||null;}else if(f.date.slice(0,10)<=day&&f.home!==S.club&&f.away!==S.club){const score=simLeagueScore(f.home,f.away);f.played=true;f.score=score[0]+'-'+score[1];}});newTb();all.filter(f=>f.played).forEach(f=>{const z=String(f.score||'').split('-').map(Number);if(z.length===2&&z.every(Number.isFinite))upd(f.home,f.away,z[0],z[1]);});S.fx=all;S.calendarVersion=2;}
  function initSystems(){if(!S)return;upgradeCalendar();S.youth=Array.isArray(S.youth)?S.youth:[];S.staff=Array.isArray(S.staff)?S.staff:[];S.tc=S.tc||{};S.tc.offF=S.tc.offF||'4-4-2';S.tc.f=S.tc.f||'4-3-3';S.tc.tacticView=S.tc.tacticView||'with';S.clubObj=S.clubObj||{stadium:hash(S.club)%2?'Arena du Club':'Stade Municipal',capacity:15000+(hash(S.club)%45000),training:2,youth:2};
    if(!S.youthInitialized){S.youth=Array.from({length:7},(_,i)=>{const p=mkP(pick(POS.filter(x=>x!=='GK')),55+rnd(0,10),500+i);p.age=rnd(16,19);p.ovr=cl(p.ovr,48,68);p.pot=cl(Math.max(p.pot,p.ovr+8),p.ovr,94);p.cond=rnd(82,100);p.val=Math.max(1,Math.round(p.ovr*p.ovr/140));p.sal=800+rnd(0,12)*100;p.club=S.club;p.status='Académie';return p;});S.youthInitialized=true;}
    if(!S.staff.length){S.staff=[['Adjoint','Analyse tactique'],['Préparateur physique','Condition'],['Entraîneur technique','Technique'],['Entraîneur des gardiens','Gardiens'],['Recruteur','Observation'],['Médecin','Médical']].map((r,i)=>({id:i+1,name:pick(FN)+' '+pick(LN),role:r[0],speciality:r[1],quality:rnd(8,17),salary:8000+rnd(0,16)*1000}));}
    S.sq.forEach(p=>{p.susp=safeNum(p.susp,0,10,0);p.yellow=safeNum(p.yellow,0,5,0);});
  }
  const oldStartCareer=startCareer;
  startCareer=function(){oldStartCareer();if(S){initSystems();sv();render();}};
  const oldNewSeason=newSeason;
  newSeason=function(){oldNewSeason();if(S){S.youth=S.youth||[];S.youth.forEach(p=>{p.age++;if(p.age>21) p.status='À promouvoir';});S.youth=S.youth.filter(p=>p.age<=23);S.youth=S.youth.concat(Array.from({length:4},(_,i)=>{const p=mkP(pick(POS.filter(x=>x!=='GK')),56+rnd(0,8),700+S.season*10+i);p.age=rnd(16,18);p.status='Nouveau';return p;}));S.staff=S.staff||[];sv();render();}};
  const ownTab=V.tactics;
  V.tactics=function(){initSystems();const view=S.tc.tacticView||'with',form=view==='without'?S.tc.offF:S.tc.f,positions=FM[form]||FM['4-3-3'],X=xi(),h=hash(S.club)%360;
    const tab=(k,label)=>`<button class="chip ${view===k?'on':''}" onclick="FMX.phase('${k}')">${label}</button>`;
    const forms=options().map(f=>`<button class="chip ${form===f?'on':''}" onclick="FMX.form('${view==='without'?'offF':'f'}','${f}')">${f}</button>`).join('');
    const style=Object.keys(STY).map(n=>`<button class="chip ${(S.tc.s||'Control Possession')===n?'on':''}" onclick="tc('s','${n}')">${n}</button>`).join('');
    const pitch=`<div class="pitch" style="aspect-ratio:3/4;max-width:420px;margin:auto">${positions.map((s,i)=>{const p=X[i]||X[0];return `<div class="tp" style="left:${s[0]}%;top:${s[1]}%"><i style="background:hsl(${h} 65% 42%)">${p?.no||i+1}</i><u>${ROLE[s[2]]||s[2]}</u><b>${p?.name?.split(' ').slice(-1)[0]||'Joueur'}</b></div>`}).join('')}</div>`;
    const roster=`<table><tr><th>Poste</th><th>Rôle</th><th>Joueur</th><th>Forme</th></tr>${positions.map((s,i)=>{const p=X[i]||X[0];return `<tr class="cp" onclick="openP(${p?.id||0})"><td>${s[2]}</td><td>${ROLE[s[2]]||'Équilibre'}</td><td>${p?.name||'—'}</td><td>${p?.form?.toFixed?.(1)||'—'}</td></tr>`}).join('')}</table>`;
    return `<div class="pn"><h3>Organisation tactique</h3><div class="wr">${tab('with','Avec le ballon')}${tab('without','Sans le ballon')}${tab('compare','Comparer les deux')}</div>${view==='compare'?`<div class="gr" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin-top:12px"><div class="pn"><h3>Avec le ballon · ${S.tc.f}</h3>${roster}</div><div class="pn"><h3>Sans le ballon · ${S.tc.offF}</h3><p class="mu">Structure de replacement défensif</p>${FM[S.tc.offF].map((s,i)=>`<div class="ar"><span>${s[2]}</span><b>${X[i]?.name||'Joueur'}</b></div>`).join('')}</div></div>`:`<div class="gr" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);margin-top:12px"><div class="pn"><h3>Formation</h3><div class="wr">${forms}</div><p><b>Mentalité</b></p><div class="wr">${Object.keys(MEN).map(m=>`<button class="chip ${S.tc.m===m?'on':''}" onclick="tc('m','${m}')">${m}</button>`).join('')}</div><h3 style="margin-top:14px">Style de jeu</h3><div class="wr">${style}</div><p class="mu">La formation et le style influencent désormais les probabilités de progression et la qualité des occasions simulées.</p></div><div class="pn"><h3>${view==='without'?'Organisation sans ballon':'Organisation avec ballon'}</h3>${pitch}<div style="margin-top:12px">${roster}</div></div></div>`}</div>`;
  };
  V.data=function(){initSystems();const own=S.fx.filter(f=>f.played&&(f.home===S.club||f.away===S.club));let gf=0,ga=0,shots=0,sot=0,xgf=0,xga=0,passA=0,passC=0,fouls=0,yellow=0,red=0;
    own.forEach(f=>{const [h,a]=String(f.score||'0-0').split('-').map(Number),side=f.home===S.club?0:1;gf+=side===0?h:a;ga+=side===0?a:h;const st=f.stats||freshStats();shots+=f.stats?(Array.isArray(f.stats.shots)?(f.stats.shots[side]||0):(f.stats.shotsOnTarget[side]||0)):0;sot+=st.shotsOnTarget[side]||0;xgf+=st.xg[side]||0;xga+=st.xg[1-side]||0;passA+=st.passes[side]||0;passC+=st.completed[side]||0;fouls+=st.fouls[side]||0;yellow+=st.yellow[side]||0;red+=st.red[side]||0;});
    const row=(a,b)=>`<div class="ar"><span>${a}</span><b>${b}</b></div>`;return `<div class="gr g3"><div class="pn"><h3>Production offensive</h3><div class="big">${gf}</div><p class="mu">Buts marqués en ${own.length} match(s)</p>${row('xG cumulés',xgf.toFixed(2))}${row('xG concédés',xga.toFixed(2))}${row('Tirs cadrés',sot)}</div><div class="pn"><h3>Construction</h3><div class="big">${passA?Math.round(passC/passA*100):0}%</div><p class="mu">Précision de passe</p>${row('Passes réussies',passC+' / '+passA)}${row('Fautes commises',fouls)}${row('Cartons jaunes / rouges',yellow+' / '+red)}</div><div class="pn"><h3>Progression récente</h3>${own.slice(-6).reverse().map(f=>`<div class="ar"><span>${fd(f.date)}</span><b>${f.home} ${f.score} ${f.away}</b></div>`).join('')||'<p class="mu">Les données seront calculées après le premier match.</p>'}</div></div><div class="pn" style="margin-top:12px"><h3>Classement actuel</h3><table><tr><th>#</th><th>Club</th><th>J</th><th>V</th><th>N</th><th>D</th><th>Diff.</th><th>Pts</th></tr>${tbl().map((t,i)=>`<tr class="${t.c===S.club?'me':''}"><td>${i+1}</td><td>${t.c}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gd}</td><td><b>${t.pts}</b></td></tr>`).join('')}</table></div>`;
  };
  V.academy=function(){initSystems();return `<div class="gr" style="grid-template-columns:minmax(0,1fr) 300px"><div class="pn"><h3>Centre de formation · ${S.youth.length} jeunes</h3><table><tr><th>Joueur</th><th>Poste</th><th>Âge</th><th>Niveau</th><th>Potentiel</th><th></th></tr>${S.youth.map(p=>`<tr><td><b>${p.name}</b></td><td>${p.pos}</td><td>${p.age}</td><td>${p.ovr}</td><td>${p.pot}</td><td><button class="chip" onclick="FMX.promote(${p.id})">Promouvoir</button></td></tr>`).join('')}</table></div><div class="pn"><h3>Installations</h3>${`<div class="ar"><span>Stade</span><b>${S.clubObj.stadium}</b></div><div class="ar"><span>Capacité</span><b>${S.clubObj.capacity.toLocaleString('fr-FR')}</b></div><div class="ar"><span>Formation</span><b>${'★'.repeat(S.clubObj.youth)}${'☆'.repeat(5-S.clubObj.youth)}</b></div>`}<p class="mu">Les jeunes progressent au fil des matchs et des saisons. Les promotions rejoignent l’effectif principal.</p></div></div>`;};
  V.staff=function(){initSystems();return `<div class="gr" style="grid-template-columns:minmax(0,1fr) 300px"><div class="pn"><h3>Équipe technique</h3><table><tr><th>Nom</th><th>Fonction</th><th>Spécialité</th><th>Qualité</th><th>Salaire mensuel</th></tr>${S.staff.map(p=>`<tr><td><b>${p.name}</b></td><td>${p.role}</td><td>${p.speciality}</td><td><i class="b ${p.quality>=15?'h':p.quality>=11?'m':'l'}">${p.quality}/20</i></td><td>€${p.salary.toLocaleString('fr-FR')}</td></tr>`).join('')}</table></div><div class="pn"><h3>Impact du staff</h3><div class="ar"><span>Qualité moyenne</span><b>${(S.staff.reduce((a,p)=>a+p.quality,0)/Math.max(1,S.staff.length)).toFixed(1)}/20</b></div><p class="mu">Les rôles et les spécialités sont enregistrés avec la carrière. Le prochain lot reliera leurs compétences plus directement aux entraînements et aux rapports de recrutement.</p></div></div>`;};
  const oldPost=V.post;V.post=function(){const base=oldPost();if(!M?.stats)return base;const s=M.stats;return base+`<div class="pn" style="margin-top:12px"><h3>Analyse avancée du match</h3><div class="gr g3">${[['Buts attendus (xG)',(s.xg[0]||0).toFixed(2)+' – '+(s.xg[1]||0).toFixed(2)],['Passes réussies',(s.completed[0]||0)+'/'+(s.passes[0]||0)+' – '+(s.completed[1]||0)+'/'+(s.passes[1]||0)],['Fautes / cartons',(s.fouls[0]||0)+'-'+(s.fouls[1]||0)+' · '+(s.yellow[0]||0)+' jaunes']].map(r=>`<div class="pn"><h3>${r[0]}</h3><div class="big" style="font-size:24px">${r[1]}</div></div>`).join('')}</div></div>`;};
  V.sched=function(){const fx=S.fx.filter(f=>f.home===S.club||f.away===S.club);return `<div class="pn"><h3>Calendrier de ${S.club}</h3><table><tr><th>Journée</th><th>Date</th><th>Match</th><th>Résultat</th></tr>${fx.map((f,i)=>`<tr><td>${f.round||i+1}</td><td>${fd(f.date)}</td><td>${f.home} – ${f.away}</td><td>${f.played?`<span class="b ${{W:'h',D:'m',L:'l'}[res(f)]}">${f.score}</span>`:'—'}</td></tr>`).join('')}</table></div>`;};
  NAV.push(['data','Centre de données','▤'],['academy','Centre jeunes','✦'],['staff','Staff','♙']);
  const labels={data:'Centre de données',academy:'Centre de formation',staff:'Équipe technique'};const oldRender=render;
  render=function(){initSystems();oldRender();const h=document.querySelector('#hd h2');if(h&&labels[S.view])h.textContent=labels[S.view];};
  window.FMX={
    phase(v){S.tc.tacticView=v;sv();render()},
    form(k,v){if(k==='offF')S.tc.offF=v;else S.tc.f=v;sv();render()},
    promote(id){initSystems();const p=S.youth.find(x=>x.id===id);if(!p)return;if(S.sq.length>=30)return alert('Effectif principal complet.');const q=copy(p);q.id=Math.max(-1,...S.sq.map(x=>Number(x.id)||0))+1;q.no=Math.max(0,...S.sq.map(x=>Number(x.no)||0))+1;q.club=S.club;q.status='Jeune promu';q.end=q.end||2029;q.sal=Math.max(800,q.sal||1200);S.sq.push(q);S.youth=S.youth.filter(x=>x.id!==id);mail('Centre de formation',q.name+' rejoint l’équipe première',q.name+' est promu dans le groupe professionnel.');sv();render()},
    validate(){const errors=[];if(!S||!Array.isArray(S.sq)||S.sq.length<11)errors.push('effectif inférieur à 11');if(S&&S.sq.some(p=>!Number.isFinite(p.ovr)||p.ovr<1||p.ovr>99))errors.push('note de joueur invalide');if(S&&S.fx){const ids=new Set();for(const f of S.fx){if(ids.has(f.id))errors.push('identifiant de match dupliqué');ids.add(f.id);if(f.played&&!/^\d+-\d+$/.test(f.score||''))errors.push('résultat de match invalide');}}return errors;},
    saveBackup(){localStorage.setItem(K+'_bak',JSON.stringify(S));alert('Copie de secours créée.')}
  };
  initSystems();if(S){sv();render();}
})();