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
    const club=S.club||'Club actuel',league=S.lg||'Championnat';
    const games=played(),last=games[games.length-1]||null,next=nextMatch(),recent=games.slice(-5);
    const tab=tableInfo(),rows=tab.rows,market=transferMessages(),targets=(S.shortlist||[]).slice(0,3);
    const day=String(date||S.date||'2026-08-01').slice(0,10);
    const others=(S.fx||[]).filter(f=>f.played&&(!f.comp||f.comp===league)&&f.home!==club&&f.away!==club&&String(f.date||'').slice(0,10)===day);
    const squad=Array.isArray(S.sq)?S.sq:[];
    const low=squad.filter(p=>Number(p.cond)<65).sort((a,b)=>Number(a.cond)-Number(b.cond)).slice(0,3);
    const cond=avgCondition(squad),board=cl(S.board||0,0,100),fans=cl(S.fans||0,0,100),morale=cl(S.mor||0,0,100);
    const leaders=rows.slice(0,3).map((r,i)=>(i+1)+'e, '+r.c+' avec '+r.pts+' points').join(' ; ')||'le classement attend ses premiers résultats';
    const lastStats=last&&last.stats?last.stats:{},shots=Array.isArray(lastStats.shots)?lastStats.shots:[0,0],xg=Array.isArray(lastStats.xg)?lastStats.xg:[0,0];
    const side=last?(last.home===club?0:1):0,opponent=last?(last.home===club?last.away:last.home):'';
    const ownShots=Number(shots[side])||0,ownXg=Number(xg[side])||0;
    const scored=games.reduce((n,f)=>n+scoreParts(f)[f.home===club?0:1],0);
    const conceded=games.reduce((n,f)=>n+scoreParts(f)[f.home===club?1:0],0);
    const wins=recent.filter(f=>resultOf(f)==='V').length,draws=recent.filter(f=>resultOf(f)==='N').length,losses=recent.filter(f=>resultOf(f)==='D').length;
    const best=squad.slice().sort((a,b)=>(Number(b.form)||0)-(Number(a.form)||0))[0]||null;
    const scorer=squad.slice().sort((a,b)=>(Number(b.g)||0)-(Number(a.g)||0))[0]||null;
    const result=last?resultOf(last):'';
    const nextOpponent=next?(next.home===club?next.away:next.home):'';
    const budget=Number(S.bud)||0;
    const formText=recentForm(recent);
    const articles=[];

    let leadHeadline,leadDeck,leadParagraphs;
    if(!last){
      leadHeadline=club+' cherche encore son premier repère';
      leadDeck='La saison est lancée, mais le terrain n’a pas encore livré son premier verdict. Le staff avance entre préparation, gestion de l’effectif et observation du calendrier.';
      leadParagraphs=[
        'À '+club+', l’heure est encore à la construction. Sans rencontre officielle à commenter, le travail se concentre sur les automatismes, l’équilibre des lignes et la manière dont le groupe pourra répondre aux premières exigences du championnat.',
        'Le classement ne raconte pas encore d’histoire et les chiffres restent à écrire. Le premier rendez-vous donnera une indication plus nette sur les intentions du manager, notamment sur la place accordée au ballon et sur la capacité de l’équipe à se réorganiser dès sa perte.',
        next?'Le prochain match est déjà dans toutes les têtes : '+club+' retrouvera '+nextOpponent+' le '+shortDate(next.date)+'. La préparation devra permettre d’arriver à cette échéance avec un onze cohérent et un groupe suffisamment frais.':'Le calendrier ne propose pas encore de prochaine affiche. Le staff dispose donc d’un peu de temps pour poursuivre son travail.'
      ];
    }else{
      leadHeadline=result==='V'?club+' avance, mais refuse de s’emballer':result==='D'?club+' face à ses responsabilités après le revers':'Un point pour '+club+', et plusieurs questions à résoudre';
      leadDeck=club+' a vécu '+(result==='V'?'une victoire':result==='D'?'une défaite':'un match nul')+' face à '+opponent+'. Le score de '+scoreLine(last)+' fixe le résultat ; le contenu de la rencontre, lui, offre déjà quelques pistes pour la suite.';
      const outcome=result==='V'
        ?'Le résultat récompense le travail du groupe, sans pour autant effacer les séquences qui ont demandé davantage de maîtrise.'
        :result==='D'
          ?'Le résultat impose une réaction, mais l’analyse ne peut pas se limiter au tableau d’affichage : les occasions créées, les espaces concédés et la gestion des temps faibles devront être examinés.'
          :'Le partage des points laisse un sentiment contrasté. L’équipe a su rester dans le match, mais elle n’a pas transformé toutes ses périodes favorables en avantage décisif.';
      leadParagraphs=[
        'Le '+shortDate(last.date)+', '+club+' a croisé '+opponent+' dans une rencontre dont le score — '+scoreLine(last)+' — résume imparfaitement les débats. '+outcome,
        'Les chiffres donnent un premier éclairage. '+club+' a tenté '+ownShots+' tirs et affiche '+ownXg.toFixed(2)+' but(s) attendu(s) selon les données enregistrées dans la carrière. Ces indicateurs ne remplacent pas le regard sur le terrain, mais ils permettent de distinguer une équipe qui parvient à se créer des situations d’une formation qui subit trop longtemps.',
        'Au classement, '+(tab.rank?club+' occupe la '+tab.rank+'e place avec '+(tab.mine?tab.mine.pts:0)+' point(s).':'la position de '+club+' reste à préciser.')+' Sur les cinq dernières rencontres, la dynamique se lit ainsi : '+formText+'.',
        next?'Le prochain rendez-vous contre '+nextOpponent+', programmé le '+shortDate(next.date)+', apportera un nouvel élément de réponse. Le staff devra décider s’il prolonge les choix qui ont fonctionné ou s’il corrige les secteurs qui ont coûté des occasions.':'Le calendrier offre désormais au staff une période d’analyse avant la prochaine échéance.'
      ];
    }
    articles.push({type:'lead',title:'À la une',kicker:'LE MATCH ET SES ENSEIGNEMENTS',headline:leadHeadline,deck:leadDeck,paragraphs:leadParagraphs});

    const leagueHeadline=others.length?'La journée redistribue quelques cartes en '+league:'La hiérarchie de '+league+' se dessine progressivement';
    const leagueParagraphs=others.length
      ?[
        'La journée du '+shortDate(day)+' a ajouté de nouveaux résultats au tableau de '+league+'. '+others.slice(0,3).map(scoreLine).join(' ; ')+'. Ces rencontres alimentent une hiérarchie qui reste encore susceptible d’évoluer.',
        'En tête, '+leaders+'. Les écarts de points prennent progressivement du relief, mais les confrontations directes et la différence de buts peuvent encore modifier l’ordre établi.',
        next?'Pour '+club+', le calendrier ne laisse pas le temps de regarder longtemps les autres : '+nextOpponent+' se présente comme le prochain test.':'Les prochaines affiches permettront de mesurer la solidité des équipes les mieux placées.'
      ]
      :[
        'Aucune autre rencontre de championnat n’a été enregistrée à cette date dans cette sauvegarde. Le panorama reste donc calme, mais la saison continue de se structurer au fil des matches déjà joués.',
        'Le haut du tableau est actuellement occupé par '+leaders+'. Derrière, les écarts restent à surveiller : une série de résultats peut rapidement rapprocher des équipes que le classement semble encore séparer.',
        'La course ne se résume pas aux points. La différence de buts, la régularité à domicile et la capacité à prendre des points à l’extérieur pèseront au fil des journées.'
      ];
    articles.push({type:'story',title:'Le championnat',kicker:'LE TOUR DE LA LIGUE',headline:leagueHeadline,deck:'Les résultats de la carrière, le classement et les prochaines affiches dessinent le paysage de la compétition.',paragraphs:leagueParagraphs});

    const transferHeadline=market.length?'Le mercato s’anime autour de '+club:'À '+club+', le recrutement se prépare sans précipitation';
    const transferParagraphs=market.length
      ?[
        'Le dernier message reçu par le club concerne « '+String(market[0].t||'un dossier de recrutement')+' ». '+String(market[0].b||'Le dossier reste en cours d’examen.'),
        targets.length?'Dans le même temps, le réseau suit notamment '+targets.map(p=>p.name).join(', ')+'. Ces noms restent des pistes tant qu’aucun accord n’est enregistré dans la carrière.':'La sélection de recrutement ne comporte pas encore de cible supplémentaire. Le staff devra préciser les postes à renforcer avant de multiplier les démarches.',
        'Avec une enveloppe annoncée de '+budget.toFixed(1)+' M€, la cellule doit arbitrer entre indemnité, salaire et place dans la rotation. Une arrivée ne sera utile que si elle répond à un besoin clairement identifié.'
      ]
      :[
        'Aucune offre ni arrivée officielle n’apparaît aujourd’hui dans les messages de la carrière. Le marché reste donc un chantier ouvert plutôt qu’un dossier déjà conclu.',
        targets.length?'Le réseau garde toutefois un œil sur '+targets.map(p=>p.name).join(', ')+'. Ces profils constituent une première base de travail, à confronter aux besoins réels de l’effectif.':'Aucun joueur n’est actuellement placé dans la sélection. Le recrutement pourra commencer par l’étude des postes où la profondeur est la plus faible.',
        'Le budget disponible est estimé à '+budget.toFixed(1)+' M€. La marge de manœuvre devra être appréciée avec les salaires, les contrats en cours et les éventuels départs. Une piste suivie n’est pas un transfert bouclé.'
      ];
    articles.push({type:'story',title:'Mercato',kicker:'ENQUÊTE SUR LES DOSSIERS DU CLUB',headline:transferHeadline,deck:'La direction sportive doit faire coïncider les besoins du terrain avec les limites économiques de la saison.',paragraphs:transferParagraphs});

    const pressure=board<35?'La marge d’erreur se réduit et chaque décision sera observée de près.':board<60?'La direction attend davantage de continuité avant de renforcer son soutien.':'Le manager dispose d’un crédit de confiance, qu’il devra confirmer dans la durée.';
    const managerHeadline=board<40?'Le banc sous pression à '+club:board>75?'Le projet du manager gagne du crédit':'Le manager attendu sur la régularité';
    articles.push({
      type:'story',title:'Le banc',kicker:'DANS LE BUREAU DU MANAGER',headline:managerHeadline,
      deck:String(S.mg||'Le manager')+' est jugé sur une période qui mêle résultats, organisation collective et gestion du groupe.',
      paragraphs:[
        'Depuis le début de son mandat, '+String(S.mg||'le manager')+' a dirigé '+games.length+' rencontre(s), pour '+wins+' victoire(s), '+draws+' nul(s) et '+losses+' défaite(s) sur la séquence récente. Le bilan comptable — '+scored+' but(s) marqué(s), '+conceded+' encaissé(s) — donne un cadre à l’évaluation.',
        'Sur le terrain, le projet repose sur un '+String(S.tc&&S.tc.f||'4-3-3')+' avec le ballon et un '+String(S.tc&&(S.tc.offF||S.tc.f)||'4-4-2')+' sans ballon. Le style '+String(S.tc&&S.tc.s||'Control Possession')+' et la mentalité '+String(S.tc&&S.tc.m||'Balanced')+' définissent les intentions, mais leur efficacité dépendra de la qualité d’exécution.',
        'La confiance de la direction est évaluée à '+board+' %, celle des supporters à '+fans+' %. '+pressure+' Le vestiaire, lui, affiche un moral de '+morale+' %, indicateur à surveiller au même titre que la forme individuelle.'
      ]
    });

    const atmosphere=morale>=75?'L’ambiance du vestiaire est décrite comme positive.':morale>=55?'Le groupe reste mobilisé, même si la régularité demeure attendue.':morale>=35?'La période appelle davantage de dialogue et de clarté dans les rôles.':'Le climat est fragile et le staff doit retisser de la confiance.';
    const supporters=fans>=75?'Les tribunes restent derrière l’équipe.':fans>=55?'Le public observe les progrès avec prudence.':fans>=35?'L’impatience commence à se faire sentir.':'Les supporters attendent un signal fort.';
    const standout=best?best.name+' ('+Number(best.form||0).toFixed(1)+'/10)':'aucun joueur ne se détache encore nettement';
    const reactionHeadline=morale<40?'Au vestiaire, l’heure est au dialogue':'Supporters et vestiaire attendent la confirmation';
    articles.push({
      type:'story',title:'Les coulisses',kicker:'TRIBUNES ET VESTIAIRE',headline:reactionHeadline,
      deck:'Au-delà du résultat, la dynamique d’un club se mesure aussi à la confiance qui circule entre les joueurs, le staff et le public.',
      paragraphs:[
        atmosphere+' Les indicateurs de la sauvegarde placent le moral collectif à '+morale+' %. Les joueurs les mieux notés ne peuvent toutefois pas masquer les questions de rotation et de condition physique.',
        supporters+' La popularité du club atteint '+fans+' %. Le public attend une équipe identifiable, capable de défendre ensemble et de montrer de l’intention lorsqu’elle récupère le ballon.',
        'Dans le groupe, '+standout+' ressort actuellement des évaluations. '+(low.length?'La condition de '+low.map(p=>p.name+' ('+p.cond+' %)').join(', ')+' mérite une attention particulière.':'Aucun joueur ne se trouve sous le seuil de vigilance physique retenu par le staff.')+' La prochaine composition sera un signal concret envoyé au vestiaire.'
      ]
    });

    const paragraphs=articles.flatMap(a=>a.paragraphs);
    return {version:2,club:club,league:league,date:day,key:String(club)+'|'+day,sections:articles,lines:paragraphs,
      facts:{rank:tab.rank,points:tab.mine?tab.mine.pts:0,budget:budget,last:last?scoreLine(last):'—',next:next?next.home+' – '+next.away:'—',condition:cond}
    };
  }

  function ensureIssue(date,refresh) {
    if(!S)return null;
    S.fm26DailyIssues=Array.isArray(S.fm26DailyIssues)?S.fm26DailyIssues:[];
    const key=String(S.club)+'|'+String(date).slice(0,10),i=S.fm26DailyIssues.findIndex(x=>x.key===key);
    if(i>=0&&!refresh&&Number(S.fm26DailyIssues[i].version)>=2)return S.fm26DailyIssues[i];
    const issue=buildIssue(date);
    if(i>=0)S.fm26DailyIssues[i]=issue;else S.fm26DailyIssues.push(issue);
    S.fm26DailyIssues=S.fm26DailyIssues.slice(-30);
    return issue;
  }

  function dailyMarkup(issue) {
    if(!issue)return '';
    const sections=Array.isArray(issue.sections)?issue.sections:[];
    const paragraphs=section=>(Array.isArray(section.paragraphs)?section.paragraphs:Array.isArray(section.lines)?section.lines:[]).map(p=>'<p>'+esc(p)+'</p>').join('');
    const lead=sections[0]||{kicker:'À LA UNE',headline:'Le football continue',deck:'Les informations de ta carrière sont réunies dans cette édition.',paragraphs:[]};
    const secondary=sections.slice(1).map(section=>'<article class="fm26-paper-story"><div class="fm26-paper-kicker">'+esc(section.kicker||section.title||'FOOTBALL')+'</div><h3>'+esc(section.headline||section.title||'Le point du jour')+'</h3><p class="fm26-paper-deck">'+esc(section.deck||'')+'</p><div class="fm26-paper-copy">'+paragraphs(section)+'</div></article>').join('');
    const crestHtml=typeof crest==='function'?crest(issue.club,86):'<span class="fm26-paper-monogram">'+esc(String(issue.club||'FM').slice(0,2).toUpperCase())+'</span>';
    const facts=issue.facts||{};
    const lineCount=sections.reduce((n,section)=>n+(Array.isArray(section.paragraphs)?section.paragraphs.length:Array.isArray(section.lines)?section.lines.length:0),0);
    return '<section id="fm26-daily-paper" class="fm26-daily-paper">'+
      '<div class="fm26-paper-masthead"><div><div class="fm26-paper-brand">LA GAZETTE <span>DU FOOT</span></div><div class="fm26-paper-tagline">Le journal quotidien de ta carrière</div></div><div class="fm26-paper-edition"><b>ÉDITION CLUB</b><span>'+esc(dateLabel(issue.date))+'</span><span>'+esc(issue.league)+'</span></div></div>'+
      '<div class="fm26-paper-ribbon"><span>FOOTBALL · ANALYSE · MERCATO</span><button type="button" data-fm26-daily-toggle>Lire l’édition complète ↓</button></div>'+
      '<article class="fm26-paper-lead"><div class="fm26-paper-lead-copy"><div class="fm26-paper-kicker">'+esc(lead.kicker||'À LA UNE')+'</div><h2>'+esc(lead.headline||'Le point du jour')+'</h2><p class="fm26-paper-deck">'+esc(lead.deck||'')+'</p><div class="fm26-paper-byline">Rédaction de la Gazette · Édition du '+esc(shortDate(issue.date))+'</div><div class="fm26-paper-copy fm26-paper-lead-body">'+paragraphs(lead)+'</div></div><aside class="fm26-paper-club"><div class="fm26-paper-club-crest">'+crestHtml+'</div><h3>'+esc(issue.club)+'</h3><div class="fm26-paper-club-stat"><span>Classement</span><b>'+(facts.rank?facts.rank+'e':'—')+'</b></div><div class="fm26-paper-club-stat"><span>Points</span><b>'+esc(facts.points==null?'—':facts.points)+'</b></div><div class="fm26-paper-club-stat"><span>Budget</span><b>'+esc(Number(facts.budget||0).toFixed(1))+' M€</b></div><div class="fm26-paper-next"><small>PROCHAIN RENDEZ-VOUS</small><b>'+esc(facts.next||'À déterminer')+'</b></div></aside></article>'+
      '<div class="fm26-paper-section-head"><span>LES AUTRES HISTOIRES</span><span>'+lineCount+' paragraphes · Univers simulé</span></div><div class="fm26-paper-columns">'+secondary+'</div>'+
      '<footer class="fm26-paper-footer"><b>La Gazette du foot</b><span>Édition fictive générée à partir des résultats, effectifs, transferts et décisions enregistrés dans ta sauvegarde. Les citations et angles éditoriaux sont narratifs, pas des dépêches réelles.</span></footer></section>';
  }

  function attachDaily() {
    if(!S||S.view!=='home')return;
    const view=$('vw');if(!view)return;
    const issue=ensureIssue(S.date,false);if(!issue)return;
    const old=$('fm26-daily-paper');if(old)old.remove();
    view.insertAdjacentHTML('beforeend',dailyMarkup(issue));
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
    '.fm26-daily-paper{margin:0 0 18px;padding:clamp(14px,1.7vw,24px);background:linear-gradient(135deg,#292b34,#1a1b22);border:1px solid #464853;border-radius:13px;color:#f1f6fd;box-shadow:0 12px 35px #0004}',
    '.fm26-daily-paper>header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid #ffffff1c;padding-bottom:12px}',
    '.fm26-daily-paper>header small,.fm26-press-chat>small,.fm26-half-header small{color:#d6a5f5;font-weight:900;letter-spacing:.15em;font-size:10px}',
    '.fm26-daily-paper h2{margin:5px 0;color:#fff;font-size:clamp(21px,2vw,31px)}.fm26-daily-paper>header p{margin:0;color:#b9c8da;font-size:12px}',
    '.fm26-daily-paper>header button,.fm26-press-chat-actions button{padding:10px 14px;border-radius:8px;background:#955fe7;color:#fff;font-weight:850;border:1px solid #9d92ff}',
    '.fm26-daily-body{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px;margin-top:14px;max-height:390px;overflow:hidden}',
    '.fm26-daily-paper.expanded .fm26-daily-body{max-height:none;overflow:visible}',
    '.fm26-daily-section{padding:12px;background:#ffffff07;border:1px solid #ffffff12;border-radius:9px;min-width:0}',
    '.fm26-daily-section h3{margin:0 0 8px;color:#d4c7ff;font-size:14px;text-transform:uppercase;letter-spacing:.07em}',
    '.fm26-daily-section p{display:grid;grid-template-columns:23px minmax(0,1fr);gap:8px;margin:0;padding:5px 0;border-top:1px solid #ffffff0a;color:#dce6f2;font-size:12px;line-height:1.45}',
    '.fm26-daily-section p span{color:#8ea5bf;font-size:10px;font-weight:900}',
    '.fm26-daily-paper>footer{margin-top:12px;padding-top:10px;border-top:1px solid #ffffff18;color:#94a9c1;font-size:10px}',
    '.fm26-press-chat{margin-top:15px;padding:16px;background:#15171e;border:1px solid #464853;border-radius:12px}.fm26-press-chat h3{margin:5px 0;color:#fff;font-size:18px}.fm26-press-chat>p,.fm26-press-chat-empty{margin:5px 0 12px;color:#aebfd3;font-size:12px}',
    '.fm26-press-chat-history{display:grid;gap:8px;max-height:300px;overflow:auto;margin:12px 0}.fm26-press-chat-message{padding:10px 12px;border-radius:9px;background:#262832;border:1px solid #405675}.fm26-press-chat-message.manager{background:#35263d;border-color:#76528f}',
    '.fm26-press-chat-message small{font-size:9px;letter-spacing:.12em;color:#d6a5f5;font-weight:900}.fm26-press-chat-message p{margin:5px 0 0;color:#f1f5fb;font-size:13px;line-height:1.5}',
    '#fm26-press-free-message{display:block;width:100%;min-height:76px;padding:11px 13px;background:#17181e;border:1px solid #4b6583;border-radius:8px;color:#fff;resize:vertical;font:inherit}',
    '.fm26-press-chat-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:9px}.fm26-press-chat-actions span{color:#91a7c0;font-size:10px}',
    '.fm26-half-page{min-height:100%;padding:clamp(15px,2.2vw,30px);color:#f4f7fc;background:radial-gradient(ellipse at 30% 0%,#2b2935,#1b1b22 70%)}',
    '.fm26-half-header{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.fm26-half-header h1{margin:6px 0;font-size:clamp(23px,2.5vw,36px)}.fm26-half-header p{margin:0;color:#acbfd4}.fm26-half-score{font-size:clamp(30px,4vw,50px);font-weight:950;background:#2d2d36;border:1px solid #5a5864;border-radius:10px;padding:8px 20px}',
    '.fm26-half-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;margin-top:18px;padding:18px;background:#292a33;border:1px solid #474853;border-radius:12px}.fm26-half-summary h2{margin:4px 0 8px}.fm26-half-summary p{margin:0;color:#d2dce8;line-height:1.55}.fm26-half-result{display:grid;justify-items:center;gap:4px;color:#c7d6e7}.fm26-half-result b{font-size:29px;color:#fff}',
    '.fm26-half-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.fm26-half-grid article{display:grid;gap:4px;padding:13px;background:#252730;border:1px solid #42434e;border-radius:10px}.fm26-half-grid small,.fm26-half-panel small,.fm26-half-talk>small{color:#d6a5f5;font-size:9px;font-weight:900;letter-spacing:.12em}.fm26-half-grid b{font-size:24px;color:#fff}.fm26-half-grid span{font-size:11px;color:#afc0d4}',
    '.fm26-half-panel{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:12px;padding:15px;background:#292a33;border:1px solid #484954;border-radius:10px}.fm26-half-panel p{margin:7px 0 0;color:#dbe5f1;line-height:1.55}.fm26-half-panel b{display:block;margin-top:7px;color:#fff}',
    '.fm26-half-talk{margin-top:14px;padding:16px;background:#252730;border:1px solid #484954;border-radius:11px}.fm26-half-talk-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:10px}.fm26-half-talk-grid button{display:grid;gap:7px;text-align:left;padding:13px;background:#34313e;border:1px solid #5a5265;border-radius:9px;color:#fff}.fm26-half-talk-grid button:hover{background:#4c3a58;border-color:#d6a5f5}.fm26-half-talk-grid span{font-size:11px;line-height:1.4;color:#c1d0e0}',
    '@media(max-width:900px){.fm26-half-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fm26-half-talk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media(max-width:580px){.fm26-half-summary,.fm26-half-panel{grid-template-columns:1fr}.fm26-daily-body{grid-template-columns:1fr}.fm26-half-talk-grid{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(style);
  const newspaperStyle=document.createElement('style');
  newspaperStyle.id='fm26-newspaper-style';
  newspaperStyle.textContent="\n.fm26-daily-paper{max-width:1600px;margin:24px auto 34px;padding:0;background:#eee9df;border:1px solid #c4beb4;border-radius:2px;color:#252321;box-shadow:0 15px 42px #0005;overflow:hidden;font-family:Georgia,\"Times New Roman\",serif}\n.fm26-paper-masthead{display:flex;align-items:end;justify-content:space-between;gap:20px;padding:22px 26px 17px;border-bottom:5px double #292724;background:linear-gradient(180deg,#f7f3eb,#e9e3d8)}\n.fm26-paper-brand{font-family:Georgia,\"Times New Roman\",serif;font-size:clamp(28px,4vw,54px);line-height:.95;font-weight:900;letter-spacing:-.055em;color:#24211f}\n.fm26-paper-brand span{color:#9b3540}\n.fm26-paper-tagline{margin-top:8px;color:#696158;font:italic 13px Georgia,serif;letter-spacing:.04em}\n.fm26-paper-edition{display:grid;gap:4px;text-align:right;color:#534e48;font:11px/1.3 Arial,sans-serif}\n.fm26-paper-edition b{color:#9b3540;letter-spacing:.13em}\n.fm26-paper-ribbon{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 26px;background:#282725;color:#f7f2e8;font:800 10px Arial,sans-serif;letter-spacing:.15em}\n.fm26-paper-ribbon button{padding:7px 11px;border:1px solid #8c8580;border-radius:2px;background:#403c39;color:#fff;font:800 10px Arial,sans-serif;letter-spacing:.03em}\n.fm26-paper-lead{display:grid;grid-template-columns:minmax(0,1fr) 255px;gap:24px;padding:26px;border-bottom:1px solid #c8c0b4;background:#f4f0e8}\n.fm26-paper-kicker{margin-bottom:10px;color:#9b3540;font:900 10px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}\n.fm26-paper-lead h2{margin:0 0 12px;color:#201e1c;font:900 clamp(29px,3.6vw,48px)/1.02 Georgia,\"Times New Roman\",serif;letter-spacing:-.035em}\n.fm26-paper-deck{margin:0 0 13px;color:#55504a;font:italic 17px/1.45 Georgia,serif}\n.fm26-paper-byline{padding:9px 0;border-top:1px solid #c9c1b7;border-bottom:1px solid #c9c1b7;color:#6a625a;font:700 9px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}\n.fm26-paper-copy{color:#302d29;font:14px/1.7 Georgia,\"Times New Roman\",serif}\n.fm26-paper-copy p{margin:13px 0 0;text-align:left}\n.fm26-paper-lead-body p:first-child:first-letter{float:left;margin:4px 7px 0 0;color:#9b3540;font:700 44px/.8 Georgia,serif}\n.fm26-paper-club{align-self:stretch;padding:16px;background:#e5dfd5;border-left:1px solid #c7bfb4;font-family:Arial,sans-serif}\n.fm26-paper-club-crest{display:grid;place-items:center;min-height:104px}\n.fm26-paper-club h3{margin:5px 0 18px;text-align:center;color:#252321;font:bold 18px Georgia,serif}\n.fm26-paper-monogram{display:grid;place-items:center;width:72px;height:72px;border:2px solid #aaa096;border-radius:50%;font:bold 22px Georgia,serif}\n.fm26-paper-club-stat{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-top:1px solid #c8bfb4;color:#696158;font:11px Arial,sans-serif}\n.fm26-paper-club-stat b{color:#282522;font-size:13px}\n.fm26-paper-next{display:grid;gap:7px;margin-top:14px;padding:12px;background:#d7d0c6;color:#393430}\n.fm26-paper-next small{font-size:9px;font-weight:900;letter-spacing:.12em;color:#9b3540}\n.fm26-paper-next b{font:700 13px/1.4 Georgia,serif}\n.fm26-paper-section-head{display:flex;justify-content:space-between;gap:12px;padding:9px 26px;background:#ddd6cb;border-bottom:1px solid #c8bfb4;color:#514a43;font:900 10px Arial,sans-serif;letter-spacing:.13em}\n.fm26-paper-section-head span+span{font-weight:600;letter-spacing:.02em}\n.fm26-paper-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 26px;padding:4px 26px 22px;background:#eee9df;max-height:430px;overflow:hidden}\n.fm26-daily-paper.expanded .fm26-paper-columns{max-height:none;overflow:visible}\n.fm26-paper-story{padding:20px 0 17px;border-bottom:1px solid #c8c0b4;min-width:0}\n.fm26-paper-story h3{margin:0 0 8px;color:#24211e;font:800 clamp(20px,2vw,27px)/1.1 Georgia,serif;letter-spacing:-.02em}\n.fm26-paper-story .fm26-paper-deck{font-size:14px;margin-bottom:9px}\n.fm26-paper-story .fm26-paper-copy{font-size:13px;line-height:1.65}\n.fm26-paper-footer{display:flex;gap:15px;align-items:baseline;padding:13px 26px;background:#dcd5ca;border-top:3px double #292724;color:#6a625a;font:10px/1.5 Arial,sans-serif}\n.fm26-paper-footer b{flex:0 0 auto;color:#9b3540;letter-spacing:.08em;text-transform:uppercase}\n@media(max-width:850px){.fm26-paper-lead{grid-template-columns:1fr}.fm26-paper-club{display:grid;grid-template-columns:70px minmax(0,1fr) 1fr 1fr;align-items:center;gap:8px}.fm26-paper-club-crest{min-height:60px}.fm26-paper-club h3{margin:0;text-align:left}.fm26-paper-next{grid-column:1/-1;margin:0}.fm26-paper-columns{gap:0 16px;padding-left:18px;padding-right:18px}}\n@media(max-width:600px){.fm26-paper-masthead{align-items:flex-start;flex-direction:column;padding:17px}.fm26-paper-edition{text-align:left}.fm26-paper-ribbon,.fm26-paper-section-head{padding-left:17px;padding-right:17px}.fm26-paper-lead{padding:18px}.fm26-paper-columns{grid-template-columns:1fr}.fm26-paper-footer{align-items:flex-start;flex-direction:column;padding:12px 17px}.fm26-paper-section-head span+span{display:none}}\n";
  document.head.appendChild(newspaperStyle);


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
  window.FM26ImmersiveCareer={version:'1.1.0',refreshDaily:()=>{if(S){ensureIssue(S.date,true);save();if(S.view==='home')render();}},getDailyIssue:()=>S?ensureIssue(S.date,false):null,getDailyMarkup:()=>S?dailyMarkup(ensureIssue(S.date,false)):'',getPressReply:journalistReply,continueCareer:cont,simulateWorldFixtures:simulateWorldFixtures};
  if(S){ensureIssue(S.date,false);save();}
})();
