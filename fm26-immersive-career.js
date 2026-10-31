/* FM26 — Presse quotidienne, conférence interactive et analyse de mi-temps. */
(() => {
  'use strict';
  if (window.FM26ImmersiveCareer) return;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const clamp = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));
  const save = () => { try { if (typeof sv==='function') sv(); } catch (_) {} };
  const $ = id => document.getElementById(id);
  const scoreParts = f => String(f&&f.score||'0-0').split('-').map(v=>Number(v)||0);
  const isMyMatch = f => f&&(f.home===S.club||f.away===S.club);
  const scoreLine = f => { const n=scoreParts(f);return String(f.home)+' '+n[0]+'–'+n[1]+' '+String(f.away); };
  const resultOf = f => { const n=scoreParts(f),a=f.home===S.club?n[0]:n[1],b=f.home===S.club?n[1]:n[0];return a>b?'V':a<b?'D':'N'; };
  const dateLabel = d => { const x=new Date(String(d||S.date||'2026-08-01').slice(0,10)+'T12:00:00');return Number.isNaN(x.getTime())?String(d||'—'):x.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); };
  const shortDate = d => { const x=new Date(String(d||S.date||'2026-08-01').slice(0,10)+'T12:00:00');return Number.isNaN(x.getTime())?'—':x.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}); };
  const shiftDate = (iso,n) => { const d=new Date(String(iso||S.date||'2026-08-01').slice(0,10)+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10); };
  const played = () => (S.fx||[]).filter(f=>f.played&&isMyMatch(f)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const nextMatch = () => (S.fx||[]).filter(f=>!f.played&&isMyMatch(f)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0]||null;
  const table = () => {try{return typeof tbl==='function'?(tbl()||[]):[]}catch(_){return []}};
  const tableInfo = () => {const t=table(),i=t.findIndex(x=>x.c===S.club);return {rows:t,rank:i<0?0:i+1,mine:i<0?null:t[i]};};
  const avgCondition = list => {const a=(list||[]).filter(p=>Number.isFinite(Number(p.cond)));return a.length?Math.round(a.reduce((n,p)=>n+Number(p.cond),0)/a.length):100;};
  const recentForm = list => list.slice(-5).map(resultOf).join(' · ')||'Pas encore de résultat';
  const transferMessages = () => (S.ib||[]).filter(m=>/transfert|mercato|offre|recrut|proposition|départ|arrivée/i.test(String(m.t||'')+' '+String(m.b||''))).slice(0,3);
  const pad18 = (title,lines,fallback) => ({title,lines:lines.concat(Array.from({length:Math.max(0,18-lines.length)},()=>fallback||'Le staff poursuivra son observation lors de la prochaine échéance.')).slice(0,18)});

  function buildIssue(date) {
    const club=S.club||'Club actuel',league=S.lg||'Championnat',games=played(),last=games[games.length-1]||null,next=nextMatch(),recent=games.slice(-5);
    const tab=tableInfo(),rows=tab.rows,market=transferMessages(),targets=(S.shortlist||[]).slice(0,3);
    const others=(S.fx||[]).filter(f=>f.played&&(!f.comp||f.comp===league)&&f.home!==club&&f.away!==club&&String(f.date||'').slice(0,10)===String(date).slice(0,10));
    const low=(S.sq||[]).filter(p=>Number(p.cond)<65).sort((a,b)=>Number(a.cond)-Number(b.cond)).slice(0,3);
    const cond=avgCondition(S.sq||[]),board=cl(S.board||0,0,100),fans=cl(S.fans||0,0,100),morale=cl(S.mor||0,0,100);
    const leaders=rows.slice(0,3).map((r,i)=>(i+1)+'. '+r.c+' ('+r.pts+' pts)').join(' · ')||'Le classement attend ses premiers résultats';
    const lastStats=last&&last.stats?last.stats:{},shots=Array.isArray(lastStats.shots)?lastStats.shots:[0,0],xg=Array.isArray(lastStats.xg)?lastStats.xg:[0,0],side=last?(last.home===club?0:1):0;
    const forGoals=games.reduce((n,f)=>n+scoreParts(f)[f.home===club?0:1],0),against=games.reduce((n,f)=>n+scoreParts(f)[f.home===club?1:0],0);
    const wins=recent.filter(f=>resultOf(f)==='V').length,draws=recent.filter(f=>resultOf(f)==='N').length,losses=recent.filter(f=>resultOf(f)==='D').length;
    const lastTransfer=market.length?market[0].t:'Aucune opération confirmée dans les messages';
    const tracked=targets.length?targets.map(p=>p.name).join(', '):'Aucune cible dans la liste';
    const world=pad18('Le panorama du football',[
      'LE MONDE DU FOOT · ÉDITION DU '+dateLabel(date).toUpperCase(),
      'Le journal suit les résultats et les classements de l’univers simulé de cette carrière.',
      others.length?'Plusieurs rencontres de '+league+' ont été enregistrées à cette date.':'La journée ne contient pas de nouveau résultat de championnat saisi.',
      others.length?'Résultats suivis : '+others.slice(0,3).map(scoreLine).join(' ; ')+'.':'Le classement reste le meilleur indicateur de la hiérarchie du championnat.',
      'En tête du tableau : '+leaders+'.',
      'Les clubs les plus réguliers consolident progressivement leurs ambitions.',
      'Les équipes proches au classement savent que chaque point peut compter.',
      'La différence de buts reste un indicateur important lorsque les points sont serrés.',
      'Les matchs à l’extérieur peuvent bouleverser une série positive.',
      'Les prochains face-à-face entre concurrents directs seront particulièrement suivis.',
      'Les équipes en difficulté cherchent d’abord à retrouver une organisation stable.',
      'Les entraîneurs doivent adapter leurs choix à la densité du calendrier.',
      'Les jeunes joueurs restent une piste pour apporter de l’énergie aux effectifs.',
      'Le staff médical et les préparateurs jouent un rôle important dans les périodes chargées.',
      'Le calendrier des prochaines journées pèsera sur les rotations.',
      next?'Prochain match de '+club+' : '+(next.home===club?next.away:next.home)+' le '+shortDate(next.date)+'.':'Aucun prochain match n’est actuellement programmé pour '+club+'.',
      'Cette rubrique concerne le monde du football simulé dans ta sauvegarde, et non des dépêches réelles extérieures.',
      'Les résultats à venir actualiseront les tendances de cette édition.'
    ],'Le classement évoluera avec les prochaines journées.');
    const transfers=pad18('Mercato et recrutement',[
      'MERCATO · LES COULISSES DU MARCHÉ',
      'Dernière information de mercato : '+lastTransfer+'.',
      market.length?String(market[0].b||'Le dossier reste à suivre.'):'Aucune arrivée ou aucun départ officiel n’est confirmé aujourd’hui dans ta carrière.',
      'Joueurs suivis actuellement : '+tracked+'.',
      'La priorité est de relier chaque piste à un besoin précis de l’effectif.',
      'Le salaire et la durée du contrat comptent autant que l’indemnité de transfert.',
      'Une recrue doit trouver une place claire dans le projet sportif.',
      'Les départs doivent être évalués selon la profondeur disponible à chaque poste.',
      'Les joueurs proches de la fin de leur contrat méritent une attention particulière.',
      'Les recruteurs doivent distinguer une opportunité d’un besoin urgent.',
      'Le centre de formation peut offrir une solution complémentaire.',
      'Les jeunes joueurs ont besoin d’un temps de jeu cohérent pour progresser.',
      'La direction surveille la masse salariale et le budget restant.',
      'Une négociation n’est pas considérée comme conclue tant que la carrière ne l’enregistre pas.',
      'Le staff technique doit transmettre ses priorités au directeur sportif.',
      'Les performances récentes peuvent modifier la valeur estimée des cibles.',
      'Le prochain rapport de recrutement précisera les profils observés.',
      'Le mercato de '+club+' reste guidé par les informations disponibles dans cette sauvegarde.'
    ],'Le marché sera actualisé dès qu’une information sera enregistrée.');
    const clubLines=pad18('Le point sur '+club,[
      'À LA UNE DU CLUB · '+String(club).toUpperCase(),
      last?'Dernier résultat : '+scoreLine(last)+'.':'Le club attend son premier résultat officiel.',
      last?'Le dernier match est une '+(resultOf(last)==='V'?'victoire à confirmer':resultOf(last)==='D'?'défaite qui appelle une réaction':'rencontre partagée qui laisse des enseignements')+'.':'Le premier match donnera les premières indications sur la saison.',
      last?'Tirs du club : '+(Number(shots[side])||0)+'.':'Les statistiques apparaîtront après la première rencontre.',
      last?'Buts attendus du club : '+(Number(xg[side])||0).toFixed(2)+'.':'Le staff prépare l’analyse du prochain adversaire.',
      'Position actuelle : '+(tab.rank?tab.rank+'e sur '+rows.length:'pas encore classé')+'.',
      tab.mine?'Total de points : '+tab.mine.pts+' · différence de buts : '+tab.mine.gd+'.':'Le classement sera disponible après les premiers résultats.',
      'La condition physique moyenne du groupe est de '+cond+'%.',
      low.length?'Joueurs sous le seuil de vigilance : '+low.map(p=>p.name+' ('+p.cond+'%)').join(', ')+'.':'Aucun titulaire ne passe actuellement sous 65% de condition.',
      'La rotation doit tenir compte du poste naturel, de la forme et de la fatigue.',
      'Le staff observe les espaces entre la défense, le milieu et l’attaque.',
      'La qualité des occasions compte autant que le nombre de tirs.',
      'Les défenseurs doivent protéger la profondeur et aider la première relance.',
      'Les milieux doivent proposer des solutions autour du porteur.',
      'Les attaquants sont évalués sur leurs appels et leur efficacité.',
      next?'Prochain rendez-vous : '+next.home+' contre '+next.away+' en '+(next.comp||league)+'.':'Aucun match n’est prévu dans le calendrier actuel.',
      'Le prochain entraînement devra répondre aux besoins identifiés dans les matchs.',
      'Le club reste le sujet central de cette édition locale.'
    ],'Le staff transmettra un nouveau point après la prochaine rencontre.');
    const manager=pad18('Le rapport du manager',[
      'L’ANALYSE DU MANAGER · '+String(S.mg||'Entraîneur').toUpperCase(),
      String(S.mg||'Le manager')+' dirige actuellement '+club+'.',
      'Forme sur les cinq derniers matchs : '+recentForm(recent)+'.',
      'Sur cette période : '+wins+' victoire(s), '+draws+' nul(s) et '+losses+' défaite(s).',
      'La carrière compte '+games.length+' rencontre(s) officielle(s) terminée(s).',
      'Buts marqués par le club : '+forGoals+'.',
      'Buts encaissés : '+against+'.',
      'Confiance de la direction : '+board+'%.',
      'Popularité auprès des supporters : '+fans+'%.',
      'Moral collectif : '+morale+'%.',
      'Organisation avec ballon : '+String(S.tc&&S.tc.f||'4-3-3')+'.',
      'Organisation sans ballon : '+String(S.tc&&(S.tc.offF||S.tc.f)||'4-4-2')+'.',
      'Style de jeu : '+String(S.tc&&S.tc.s||'Control Possession')+'.',
      'Mentalité : '+String(S.tc&&S.tc.m||'Balanced')+'.',
      'Les déclarations du manager seront comparées aux choix tactiques.',
      'La condition des joueurs devra guider les décisions de rotation.',
      'Le staff attend une progression cohérente dans la création et la défense.',
      'Le bilan du manager évoluera avec les résultats et les décisions de carrière.'
    ],'Le manager sera de nouveau évalué après la prochaine échéance.');
    const reactions=pad18('Supporters, vestiaire et direction',[
      'VESTIAIRE · SUPPORTERS · DIRECTION',
      'La popularité des supporters est de '+fans+'%.',
      fans>=75?'Les tribunes affichent une confiance élevée.':fans>=55?'Les tribunes restent attentives et attendent de la régularité.':fans>=35?'La patience du public commence à être mise à l’épreuve.':'Les supporters demandent une réaction rapide.',
      'La confiance de la direction est de '+board+'%.',
      board>=75?'Le conseil soutient clairement le travail du staff.':board>=55?'La direction garde une confiance mesurée.':board>=35?'Les dirigeants attendent des résultats plus constants.':'La pression sur le poste d’entraîneur est élevée.',
      'Le moral du groupe se situe à '+morale+'%.',
      morale>=75?'Le vestiaire aborde la période avec confiance.':morale>=55?'L’ambiance reste correcte, mais les joueurs attendent de la clarté.':morale>=35?'Certains joueurs ont besoin de dialogue et de repères.':'Le staff doit restaurer la confiance du groupe.',
      'Les joueurs observent la cohérence entre les promesses et le temps de jeu.',
      'Les remplaçants attendent des occasions de gagner leur place.',
      'Les cadres du vestiaire peuvent aider à maintenir l’unité du groupe.',
      'Les supporters valorisent l’engagement et les résultats.',
      'Une victoire peut renforcer la confiance sans régler tous les problèmes tactiques.',
      'Une défaite doit être analysée sans chercher un responsable unique.',
      'Les échanges individuels peuvent apaiser les frustrations.',
      'La direction suit aussi les objectifs et la stabilité financière.',
      'Le public attend une équipe identifiable et fidèle à son projet.',
      'Le prochain match donnera un nouvel indice sur la dynamique du club.',
      'Les réactions évolueront avec les prochains résultats.'
    ],'Les réactions seront réévaluées à la prochaine journée.');
    const sections=[world,transfers,clubLines,manager,reactions];
    return {club:club,league:league,date:String(date).slice(0,10),key:String(club)+'|'+String(date).slice(0,10),sections:sections,lines:sections.flatMap(s=>s.lines)};
  }

  function ensureIssue(date,refresh) {
    if(!S)return null;
    S.fm26DailyIssues=Array.isArray(S.fm26DailyIssues)?S.fm26DailyIssues:[];
    const key=String(S.club)+'|'+String(date).slice(0,10),i=S.fm26DailyIssues.findIndex(x=>x.key===key);
    if(i>=0&&!refresh)return S.fm26DailyIssues[i];
    const issue=buildIssue(date);
    if(i>=0)S.fm26DailyIssues[i]=issue;else S.fm26DailyIssues.push(issue);
    S.fm26DailyIssues=S.fm26DailyIssues.slice(-30);
    return issue;
  }

  function dailyMarkup(issue) {
    if(!issue)return '';
    const sections=issue.sections.map(s=>'<section class="fm26-daily-section"><h3>'+esc(s.title)+'</h3>'+s.lines.map((line,i)=>'<p><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(line)+'</p>').join('')+'</section>').join('');
    return '<section id="fm26-daily-paper" class="fm26-daily-paper"><header><div><small>LE MONDE DU FOOT · JOURNAL DE CARRIÈRE</small><h2>La gazette de '+esc(issue.club)+'</h2><p>Édition du '+esc(dateLabel(issue.date))+' · '+issue.lines.length+' lignes · '+esc(issue.league)+'</p></div><button type="button" data-fm26-daily-toggle>Lire l’édition complète ↓</button></header><div class="fm26-daily-body">'+sections+'</div><footer>Édition générée à partir des résultats, effectifs, transferts et réactions de cette sauvegarde.</footer></section>';
  }
  function attachDaily() {
    if(!S||S.view!=='home')return;
    const view=$('vw');if(!view)return;
    const issue=ensureIssue(S.date,false);if(!issue)return;
    const old=$('fm26-daily-paper');if(old)old.remove();
    view.insertAdjacentHTML('afterbegin',dailyMarkup(issue));
  }
  function archiveBeforeFixture(start,end) {
    if(!S||!start||!end)return;
    let day=shiftDate(start,1),count=0,changed=false;
    while(day<end&&count<14){
      const key=String(S.club)+'|'+day;
      if(!(S.fm26DailyIssues||[]).some(x=>x.key===key)){ensureIssue(day,false);changed=true;}
      day=shiftDate(day,1);count++;
    }
    if(changed)save();
  }

  function factsForPress() {
    const games=played(),last=games[games.length-1]||null,tab=tableInfo();
    return {games:last,form:games.slice(-5),tab:tab,low:(S.sq||[]).filter(p=>Number(p.cond)<65),condition:avgCondition(S.sq||[]),board:cl(S.board||0,0,100),fans:cl(S.fans||0,0,100),morale:cl(S.mor||0,0,100)};
  }
  function journalistReply(raw) {
    const q=norm(raw),f=factsForPress(),last=f.games,next=nextMatch();
    const result=last?scoreLine(last):'aucun résultat officiel enregistré';
    const record=recentForm(f.form);
    const pick=(arr,seed)=>arr[Math.abs(seed)%arr.length];
    const choice=Math.abs((String(raw)+String(S.date)+(S.fm26PressDialogue||[]).length).split('').reduce((n,c)=>n+c.charCodeAt(0),0))%4;
    if(/resultat|score|gagne|perdu|defaite|victoire|match|8.?4|bilan/.test(q)){
      if(!last)return 'Aucun résultat officiel n’est encore disponible. Nous reviendrons sur le score et le contenu du match après la première rencontre.';
      const n=scoreParts(last),own=last.home===S.club?n[0]:n[1],opp=last.home===S.club?n[1]:n[0];
      return 'Vous évoquez '+result+'. Pour '+S.club+', le bilan est '+(own>opp?'positif, mais il faudra le confirmer.':own<opp?'décevant et appelle des corrections.':'partagé, avec des enseignements des deux côtés.')+' Sur les cinq dernières rencontres, la série est '+record+'. Qu’est-ce qui vous a le plus marqué dans le contenu du match ?';
    }
    if(/transfert|mercato|recrut|achat|vente/.test(q)){
      const m=transferMessages(),t=(S.shortlist||[]).slice(0,3);
      return m.length?'La dernière information enregistrée est « '+m[0].t+' ». '+String(m[0].b||'Aucune décision définitive n’est encore connue.')+' '+(t.length?'Les profils suivis sont '+t.map(p=>p.name).join(', ')+'.':'Aucune cible supplémentaire n’est enregistrée.')+' Quel secteur voulez-vous renforcer ?':'Aucun transfert n’est confirmé dans les informations de la carrière. '+(t.length?'Vous suivez actuellement '+t.map(p=>p.name).join(', ')+'.':'Votre sélection de recrutement est vide.')+' Nous distinguerons les pistes de travail des opérations conclues.';
    }
    if(/fatigue|condition|physique|repos|bless/.test(q)){
      const names=f.low.slice(0,4).map(p=>p.name+' ('+p.cond+'%)');
      return 'La condition moyenne du groupe est de '+f.condition+'%. '+(names.length?'Les joueurs les plus bas sont '+names.join(', ')+'.':'Aucun joueur ne passe sous 65% actuellement.')+' Le staff devra équilibrer continuité du onze et fraîcheur pour le prochain rendez-vous.';
    }
    if(/tactique|systeme|schema|formation|433|4 3 3|442|4 4 2|pressing|bloc|attaque|defense|style de jeu/.test(q)){
      return 'Votre équipe évolue en '+String(S.tc&&S.tc.f||'4-3-3')+' avec le ballon et en '+String(S.tc&&(S.tc.offF||S.tc.f)||'4-4-2')+' sans le ballon. Le style est '+String(S.tc&&S.tc.s||'Control Possession')+' et la mentalité '+String(S.tc&&S.tc.m||'Balanced')+'. '+pick(['Nous regarderons surtout les distances entre les lignes.','La protection des transitions et les espaces dans le dos des latéraux seront déterminants.','Le prochain match permettra de vérifier si les rôles valorisent les qualités du groupe.','Le plan devra tenir compte de la forme et de la condition des titulaires.'],choice);
    }
    if(/entrainement|seance|entrainer|preparation|physique|technique/.test(q)){
      const plan=String(S.tr||'non précisé');
      const facility=cl(Number(S.clubObj&&S.clubObj.training)||2,1,5);
      return 'Le programme actuellement enregistré est « '+plan+' » et le centre d’entraînement est au niveau '+facility+'/5. '+(plan==='Physique'?'Le travail physique peut soutenir l’intensité, mais il faut surveiller la fatigue.':plan==='Technique'?'Le travail technique vise les gestes, le contrôle et la qualité des passes.':plan==='Tactique'?'Le travail tactique aide les automatismes et la compréhension des déplacements.':plan==='Récupération'?'La récupération est adaptée lorsque le calendrier est chargé.':'Le staff doit choisir entre progression technique, cohésion tactique et fraîcheur physique.')+' La condition moyenne du groupe est de '+f.condition+'%.';
    }
    if(/supporter|public|tribune|direction|president|confiance/.test(q)){
      return 'Les indicateurs actuels sont : supporters '+f.fans+'%, direction '+f.board+'% et moral du vestiaire '+f.morale+'%. '+(f.fans>=65?'Le public reste plutôt favorable.':'Les tribunes attendent des signes de progrès.')+' '+(f.board>=60?'La direction conserve une confiance mesurée.':'Les dirigeants demandent des résultats plus convaincants.')+' Ces indicateurs évolueront avec vos prochains choix.';
    }
    if(/joueur|effectif|titulaire|remplacant|saka|gyokeres|odegaard|saliba|raya/.test(q)){
      const best=(S.sq||[]).slice().sort((a,b)=>(Number(b.form)||0)-(Number(a.form)||0))[0];
      return 'Sur la forme actuelle, '+(best?best.name+' affiche '+Number(best.form||0).toFixed(1)+'/10 et '+(best.cond==null?'une condition non renseignée':best.cond+'% de condition')+'.':'les données individuelles sont encore limitées.')+' Le onze doit croiser forme, condition, poste et rôle demandé. '+pick(['Avez-vous un joueur précis en tête ?','Parlez-vous du temps de jeu ou de la performance collective ?','Le banc peut devenir décisif lorsque le rythme baisse.','Un titulaire n’est pas automatiquement le meilleur choix contre chaque adversaire.'],choice);
    }
    return 'Vous demandez : « '+String(raw).slice(0,150)+' ». Pour '+S.club+', les éléments vérifiables aujourd’hui sont une série récente de '+record+', une confiance de la direction à '+f.board+'% et une popularité des supporters à '+f.fans+'%. '+pick(['Je vais suivre la décision concrète qui découlera de votre réponse.','Les journalistes compareront vos paroles aux prochains choix de composition.','Le prochain match sera un premier indicateur pour juger cette orientation.','Notre rédaction reviendra sur ce point à la lumière des prochains résultats.'],choice);
  }
  function pressChatMarkup() {
    if(!S)return '';
    S.fm26PressDialogue=Array.isArray(S.fm26PressDialogue)?S.fm26PressDialogue:[];
    if(S.fm26PressDialogueDate!==String(S.date||'')){S.fm26PressDialogue=[];S.fm26PressDialogueDate=String(S.date||'');}
    const history=S.fm26PressDialogue.slice(-8).map(x=>'<article class="fm26-press-chat-message '+(x.role==='manager'?'manager':'journalist')+'"><small>'+(x.role==='manager'?'VOTRE DÉCLARATION':'LE JOURNALISTE')+'</small><p>'+esc(x.text)+'</p></article>').join('');
    return '<section class="fm26-press-chat"><small>ÉCHANGE LIBRE · PRESSE INTERACTIVE</small><h3>Pose ta propre question</h3><p>Le journaliste tient compte des résultats, du mercato, de la tactique et de la situation de '+esc(S.club)+'.</p>'+(history?'<div class="fm26-press-chat-history">'+history+'</div>':'<p class="fm26-press-chat-empty">Aucun échange libre. Écris comme lors d’une vraie conférence.</p>')+'<textarea id="fm26-press-free-message" rows="3" maxlength="600" placeholder="Ex. : Pourquoi avez-vous laissé votre meilleur buteur sur le banc ?"></textarea><div class="fm26-press-chat-actions"><span>La réponse s’appuie sur les données de ta carrière.</span><button type="button" data-fm26-press-free>Envoyer →</button></div></section>';
  }
  if(window.FM26Enhancements&&typeof window.FM26Enhancements.pressMarkup==='function'){
    const basePress=window.FM26Enhancements.pressMarkup;
    window.FM26Enhancements.pressMarkup=function(){return basePress().replace('<p class="fm26-press-note">',pressChatMarkup()+'<p class="fm26-press-note">');};
  }
  function sendPressMessage() {
    const input=$('fm26-press-free-message'),raw=String(input&&input.value||'').trim();
    if(!raw)return;
    S.fm26PressDialogue=Array.isArray(S.fm26PressDialogue)?S.fm26PressDialogue:[];
    if(S.fm26PressDialogueDate!==String(S.date||'')){S.fm26PressDialogue=[];S.fm26PressDialogueDate=String(S.date||'');}
    S.fm26PressDialogue.push({role:'manager',text:raw,date:S.date});
    S.fm26PressDialogue.push({role:'journalist',text:journalistReply(raw),date:S.date});
    S.fm26PressDialogue=S.fm26PressDialogue.slice(-20);
    save();render();
  }

  function halfTimeMarkup() {
    if(!M||!M.f)return '<div class="pn">Aucun match en cours.</div>';
    const side=M.f.home===S.club?0:1,other=1-side,userScore=side===0?M.h:M.a,oppScore=side===0?M.a:M.h,stats=M.stats||{};
    const pair=k=>Array.isArray(stats[k])?stats[k]:[0,0];
    const pos=Array.isArray(M.possTicks)?M.possTicks:(pair('possession')),total=Math.max(1,(Number(pos[0])||0)+(Number(pos[1])||0));
    const userPoss=Math.round((Number(pos[side])||0)/total*100),shots=Array.isArray(M.sh)?M.sh:[0,0];
    const sx=Number(shots[side])||0,so=Number(shots[other])||0,xu=Number(pair('xg')[side])||0,xo=Number(pair('xg')[other])||0;
    const on=Number(pair('shotsOnTarget')[side])||0,oon=Number(pair('shotsOnTarget')[other])||0;
    const lineup=Array.isArray(M.matchXI)&&M.matchXI.length?M.matchXI:(window.FM26MatchDay&&typeof window.FM26MatchDay.getLineup==='function'?window.FM26MatchDay.getLineup():[]);
    const tired=lineup.filter(p=>Number(p.cond)<70).sort((a,b)=>Number(a.cond)-Number(b.cond)).slice(0,4);
    const best=lineup.slice().sort((a,b)=>(Number(b.form)||0)-(Number(a.form)||0))[0];
    let diagnosis='';
    if(userScore<oppScore&&xu>xo+.25)diagnosis='Le score ne reflète pas totalement les occasions créées. Le staff demande plus de calme dans la dernière passe et de précision dans la finition.';
    else if(userScore<oppScore)diagnosis='L’équipe est menée et doit gagner en présence dans les zones dangereuses, sans désorganiser toute la structure.';
    else if(userScore>oppScore&&xu<xo)diagnosis='L’avantage existe, mais l’adversaire a peut-être créé les occasions les plus dangereuses. Il faut protéger l’axe et mieux contrôler les transitions.';
    else if(userScore>oppScore)diagnosis='Le plan a produit un avantage. Il faut conserver les distances entre les lignes et éviter de reculer trop tôt.';
    else diagnosis='Le match reste équilibré. Le staff doit identifier le secteur où quelques ajustements peuvent faire basculer la rencontre.';
    const advice=tired.length?'À surveiller : '+tired.map(p=>p.name+' ('+p.cond+'%)').join(', ')+'.':'Aucun titulaire sous 70% de condition à la pause.';
    return '<main class="fm26-half-page"><header class="fm26-half-header"><div><small>RAPPORT DU STAFF · MI-TEMPS</small><h1>'+esc(S.club)+' · Analyse de l’entraîneur</h1><p>'+esc(M.f.home)+' contre '+esc(M.f.away)+' · 45 minutes jouées</p></div><div class="fm26-half-score">'+M.h+' – '+M.a+'</div></header>'+
      '<section class="fm26-half-summary"><div><small>LECTURE DU MATCH</small><h2>'+esc(userScore>oppScore?'Vous êtes devant':userScore<oppScore?'Vous êtes mené':'Les équipes sont à égalité')+'</h2><p>'+esc(diagnosis)+'</p></div><div class="fm26-half-result"><span>'+esc(S.club)+'</span><b>'+userScore+' – '+oppScore+'</b><span>'+esc(side===0?M.f.away:M.f.home)+'</span></div></section>'+
      '<section class="fm26-half-grid"><article><small>POSSESSION</small><b>'+userPoss+'%</b><span>Adversaire '+(100-userPoss)+'%</span></article><article><small>FRAPPES</small><b>'+sx+' – '+so+'</b><span>Tirs cadrés : '+on+' – '+oon+'</span></article><article><small>BUTS ATTENDUS · xG</small><b>'+xu.toFixed(2)+' – '+xo.toFixed(2)+'</b><span>Qualité des occasions</span></article><article><small>PASSES RÉUSSIES</small><b>'+pair('completed')[side]+' / '+pair('passes')[side]+'</b><span>Adversaire : '+pair('completed')[other]+' / '+pair('passes')[other]+'</span></article></section>'+
      '<section class="fm26-half-panel"><div><small>CONSEIL DE L’ADJOINT</small><p>'+esc(advice)+'</p></div><div><small>JOUEUR LE PLUS EN FORME</small><b>'+(best?esc(best.name)+' · '+Number(best.form||0).toFixed(1)+'/10':'À déterminer')+'</b></div></section>'+
      '<section class="fm26-half-talk"><small>TA CAUSERIE · CHOISIS TON MESSAGE</small><div class="fm26-half-talk-grid"><button data-fm26-half-talk="motivate"><b>Remobiliser</b><span>Redonner de l’énergie et demander une réaction.</span></button><button data-fm26-half-talk="press"><b>Intensifier le pressing</b><span>Récupérer plus haut, avec un effort physique supplémentaire.</span></button><button data-fm26-half-talk="defend"><b>Resserer le bloc</b><span>Protéger la profondeur et fermer les espaces.</span></button><button data-fm26-half-talk="calm"><b>Garder son calme</b><span>Conserver l’organisation et jouer avec maîtrise.</span></button></div></section></main>';
  }
  if(typeof V!=='undefined')V.halftime=halfTimeMarkup;

  if(typeof endMatch==='function'){
    const oldEnd=endMatch;
    endMatch=function(){const out=oldEnd.apply(this,arguments);if(S&&S.date){ensureIssue(S.date,true);save();}return out;};
  }
  function simulateWorldFixtures(date) {
    if(!S || !Array.isArray(S.fx) || typeof simLeagueScore!=='function' || typeof upd!=='function') return 0;
    const day=String(date||'').slice(0,10);
    const fixtures=S.fx.filter(f=>!f.played&&String(f.date||'').slice(0,10)===day&&f.home!==S.club&&f.away!==S.club&&(!f.comp||f.comp===S.lg));
    fixtures.forEach(f=>{
      const result=simLeagueScore(f.home,f.away);
      f.played=true;f.score=result[0]+'-'+result[1];
      upd(f.home,f.away,result[0],result[1]);
    });
    return fixtures.length;
  }

  if(typeof cont==='function'){
    const oldCont=cont;
    cont=function(){
      if(S&&S.view==='home'){
        const next=nextMatch();
        const currentDate=String(S.date||'').slice(0,10);
        const fixtureDate=next?String(next.date||'').slice(0,10):'';
        if(fixtureDate && currentDate<fixtureDate){
          const day=shiftDate(currentDate,1);
          S.date=day;
          simulateWorldFixtures(day);
          ensureIssue(day,false);
          save();
          render();
          return;
        }
      }
      const wasPress=!!(S&&S.view==='press'),out=oldCont.apply(this,arguments);
      if(wasPress&&S){S.fm26PressDialogue=[];S.fm26PressDialogueDate=String(S.date||'');save();}
      return out;
    };
  }

  const style=document.createElement('style');
  style.textContent=[
    '.fm26-daily-paper{margin:0 0 18px;padding:clamp(14px,1.7vw,24px);background:linear-gradient(135deg,#182b42,#0f1c2d);border:1px solid #47617e;border-radius:13px;color:#f1f6fd;box-shadow:0 12px 35px #0004}',
    '.fm26-daily-paper>header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid #ffffff1c;padding-bottom:12px}',
    '.fm26-daily-paper>header small,.fm26-press-chat>small,.fm26-half-header small{color:#a89cff;font-weight:900;letter-spacing:.15em;font-size:10px}',
    '.fm26-daily-paper h2{margin:5px 0;color:#fff;font-size:clamp(21px,2vw,31px)}.fm26-daily-paper>header p{margin:0;color:#b9c8da;font-size:12px}',
    '.fm26-daily-paper>header button,.fm26-press-chat-actions button{padding:10px 14px;border-radius:8px;background:#6e5dde;color:#fff;font-weight:850;border:1px solid #9d92ff}',
    '.fm26-daily-body{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px;margin-top:14px;max-height:390px;overflow:hidden}',
    '.fm26-daily-paper.expanded .fm26-daily-body{max-height:none;overflow:visible}',
    '.fm26-daily-section{padding:12px;background:#ffffff07;border:1px solid #ffffff12;border-radius:9px;min-width:0}',
    '.fm26-daily-section h3{margin:0 0 8px;color:#d4c7ff;font-size:14px;text-transform:uppercase;letter-spacing:.07em}',
    '.fm26-daily-section p{display:grid;grid-template-columns:23px minmax(0,1fr);gap:8px;margin:0;padding:5px 0;border-top:1px solid #ffffff0a;color:#dce6f2;font-size:12px;line-height:1.45}',
    '.fm26-daily-section p span{color:#8ea5bf;font-size:10px;font-weight:900}',
    '.fm26-daily-paper>footer{margin-top:12px;padding-top:10px;border-top:1px solid #ffffff18;color:#94a9c1;font-size:10px}',
    '.fm26-press-chat{margin-top:15px;padding:16px;background:#0d1b2c;border:1px solid #405d7d;border-radius:12px}.fm26-press-chat h3{margin:5px 0;color:#fff;font-size:18px}.fm26-press-chat>p,.fm26-press-chat-empty{margin:5px 0 12px;color:#aebfd3;font-size:12px}',
    '.fm26-press-chat-history{display:grid;gap:8px;max-height:300px;overflow:auto;margin:12px 0}.fm26-press-chat-message{padding:10px 12px;border-radius:9px;background:#172a41;border:1px solid #405675}.fm26-press-chat-message.manager{background:#282648;border-color:#655c9d}',
    '.fm26-press-chat-message small{font-size:9px;letter-spacing:.12em;color:#a99cff;font-weight:900}.fm26-press-chat-message p{margin:5px 0 0;color:#f1f5fb;font-size:13px;line-height:1.5}',
    '#fm26-press-free-message{display:block;width:100%;min-height:76px;padding:11px 13px;background:#091321;border:1px solid #4b6583;border-radius:8px;color:#fff;resize:vertical;font:inherit}',
    '.fm26-press-chat-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:9px}.fm26-press-chat-actions span{color:#91a7c0;font-size:10px}',
    '.fm26-half-page{min-height:100%;padding:clamp(15px,2.2vw,30px);color:#f4f7fc;background:radial-gradient(ellipse at 30% 0%,#263e56,#111927 70%)}',
    '.fm26-half-header{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.fm26-half-header h1{margin:6px 0;font-size:clamp(23px,2.5vw,36px)}.fm26-half-header p{margin:0;color:#acbfd4}.fm26-half-score{font-size:clamp(30px,4vw,50px);font-weight:950;background:#1c2c42;border:1px solid #607a98;border-radius:10px;padding:8px 20px}',
    '.fm26-half-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;margin-top:18px;padding:18px;background:#192a40;border:1px solid #405b7c;border-radius:12px}.fm26-half-summary h2{margin:4px 0 8px}.fm26-half-summary p{margin:0;color:#d2dce8;line-height:1.55}.fm26-half-result{display:grid;justify-items:center;gap:4px;color:#c7d6e7}.fm26-half-result b{font-size:29px;color:#fff}',
    '.fm26-half-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.fm26-half-grid article{display:grid;gap:4px;padding:13px;background:#17263a;border:1px solid #344e6c;border-radius:10px}.fm26-half-grid small,.fm26-half-panel small,.fm26-half-talk>small{color:#a99cff;font-size:9px;font-weight:900;letter-spacing:.12em}.fm26-half-grid b{font-size:24px;color:#fff}.fm26-half-grid span{font-size:11px;color:#afc0d4}',
    '.fm26-half-panel{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:12px;padding:15px;background:#1b2b40;border:1px solid #455e7c;border-radius:10px}.fm26-half-panel p{margin:7px 0 0;color:#dbe5f1;line-height:1.55}.fm26-half-panel b{display:block;margin-top:7px;color:#fff}',
    '.fm26-half-talk{margin-top:14px;padding:16px;background:#17263a;border:1px solid #455e7b;border-radius:11px}.fm26-half-talk-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px}.fm26-half-talk-grid button{display:grid;gap:7px;text-align:left;padding:13px;background:#213a56;border:1px solid #4c6786;border-radius:9px;color:#fff}.fm26-half-talk-grid button:hover{background:#314d70;border-color:#a89cff}.fm26-half-talk-grid span{font-size:11px;line-height:1.4;color:#c1d0e0}',
    '@media(max-width:900px){.fm26-half-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fm26-half-talk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media(max-width:580px){.fm26-half-summary,.fm26-half-panel{grid-template-columns:1fr}.fm26-daily-body{grid-template-columns:1fr}.fm26-half-talk-grid{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(style);

  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-fm26-daily-toggle]');
    if(toggle){const paper=toggle.closest('#fm26-daily-paper');if(paper){paper.classList.toggle('expanded');toggle.textContent=paper.classList.contains('expanded')?'Réduire le journal ↑':'Lire l’édition complète ↓';}return;}
    const send=event.target.closest('[data-fm26-press-free]');
    if(send){sendPressMessage();return;}
    const talk=event.target.closest('[data-fm26-half-talk]');
    if(talk&&window.FM26A&&typeof FM26A.halfTalk==='function'){FM26A.halfTalk(talk.dataset.fm26HalfTalk);return;}
  });
  document.addEventListener('keydown',event=>{
    if(event.target&&event.target.id==='fm26-press-free-message'&&event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();sendPressMessage();}
  });

  if(typeof render==='function'){
    const baseRender=render;
    render=function(){
      const output=baseRender.apply(this,arguments);
      if(S&&S.view==='home')attachDaily();
      if(S&&S.view==='halftime'){
        const title=document.querySelector('#hd h2');if(title)title.textContent='Mi-temps · Rapport du staff';
        const go=$('go');if(go){go.textContent='REPRENDRE LA SECONDE PÉRIODE';go.onclick=()=>{if(window.FM26A&&typeof FM26A.halfTalk==='function')FM26A.halfTalk('calm');};}
      }
      return output;
    };
  }
  window.FM26ImmersiveCareer={version:'1.0.0',refreshDaily:()=>{if(S){ensureIssue(S.date,true);save();if(S.view==='home')render();}},getDailyIssue:()=>S?ensureIssue(S.date,false):null,getPressReply:journalistReply,continueCareer:cont,simulateWorldFixtures:simulateWorldFixtures};
  if(S){ensureIssue(S.date,false);save();}
})();
