/* FM26 Experience Pack — portraits, messaging, lineup, live controls and career events.
   Original add-on for the user's FM26 browser game. */
(function () {
  'use strict';
  if (window.FM26UX) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));
  const txt = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names = ['Pep Guardiola','Mikel Arteta','Luis Enrique','Carlo Ancelotti','Hansi Flick','Sarina Wiegman'];
  const managerPhotoSources = [];
  let selectedPortraitPhoto = null;
  let selectedPortraitPage = null;
  const palette = [
    ['#c98b62','#342018','#e5b899','#253e6c','#f5c34e'],
    ['#f0c8a4','#5b3325','#d99e76','#384d5b','#e6e8ec'],
    ['#8a5139','#171516','#b7785b','#235e54','#f2d6a2'],
    ['#e7bc9a','#6b6b6b','#b88a6b','#573d68','#e8d8b8'],
    ['#ad7455','#141414','#d8a181','#a43f3f','#e9ddcd'],
    ['#f2d4b7','#8b5b32','#d7a77f','#2b4f45','#d4dcec']
  ];
  function portraitSvg(i) {
    const p = palette[(Number(i) || 0) % palette.length];
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="180" viewBox="0 0 160 180"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' + p[3] + '"/><stop offset="1" stop-color="#12162a"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop stop-color="' + p[4] + '"/><stop offset="1" stop-color="' + p[3] + '"/></linearGradient></defs><rect width="160" height="180" rx="18" fill="url(#b)"/><circle cx="80" cy="66" r="39" fill="' + p[0] + '"/><path d="M39 66 Q28 20 76 21 Q122 16 121 62 L112 47 Q83 36 60 43 L43 56Z" fill="' + p[1] + '"/><path d="M54 67 Q62 62 69 67 M91 67 Q98 62 106 67" fill="none" stroke="#35231c" stroke-width="4" stroke-linecap="round"/><path d="M70 86 Q80 92 91 86" fill="none" stroke="#743e36" stroke-width="3" stroke-linecap="round"/><path d="M59 101 L101 101 L117 123 L139 180 L21 180 L43 123Z" fill="url(#s)"/><path d="M61 101 L80 126 L99 101" fill="#f1f0ee"/><path d="M69 101 L80 116 L91 101" fill="#1e293b"/><rect x="7" y="7" width="146" height="166" rx="14" fill="none" stroke="#ffffff" stroke-opacity=".22"/></svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }
  function loadManagerPortraits(profile) {
    names.forEach((name,i)=>{
      const button=profile.querySelector('[data-portrait="'+i+'"]');
      if(!button)return;
      const key='fm26-manager-photo:'+name.toLowerCase();
      const apply=(url,page)=>{
        managerPhotoSources[i]={url,page};
        const img=button.querySelector('img');
        if(img)img.src=url;
        button.dataset.photoUrl=url;
        button.dataset.photoPage=page||'';
        button.title='Photo de référence : '+name+' — source Wikipédia';
        if(Number(selectedPortrait)===i){selectedPortraitPhoto=url;selectedPortraitPage=page||null;if(typeof S!=='undefined'&&S&&Number(S.managerPortrait)===i&&!S.managerPhoto){S.managerPhoto=url;S.managerPhotoPage=page||null;try{sv()}catch(e){};if(typeof render==='function')render();}}
      };
      let cached=null;
      try{cached=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
      if(cached&&cached.url){apply(cached.url,cached.page);return;}
      if(cached&&cached.missing){return;}
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(name.replace(/ /g,'_')),{headers:{'Accept':'application/json'}})
      .then(r=>{if(!r.ok)throw new Error('page absente');return r.json()})
      .then(data=>{
        if(!data||!data.thumbnail||!data.thumbnail.source)throw new Error('portrait absent');
        const page=data.content_urls&&data.content_urls.desktop&&data.content_urls.desktop.page||('https://en.wikipedia.org/wiki/'+encodeURIComponent(name));
        const val={url:data.thumbnail.source,page};
        try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}
        apply(val.url,val.page);
      }).catch(()=>{managerPhotoSources[i]={missing:true};try{localStorage.setItem(key,JSON.stringify({missing:true}))}catch(e){}});
    });
  }
  function face(name, idx, cls) {
    return '<span class="' + (cls || 'fm26-face') + '"><img alt="" src="' + portraitSvg(idx == null ? (Array.from(String(name || '')).reduce((a,c)=>a+c.charCodeAt(0),0)%6) : idx) + '"></span>';
  }
  function playerFace(player, cls) {
    if(!player)return '';
    return '<span class="'+(cls||'fm26-face')+'" data-fm26-player="'+Number(player.id)+'"><img alt="Portrait de '+txt(player.name)+'" src="'+portraitSvg((Number(player.id)||0)%6)+'"></span>';
  }
  const style = document.createElement('style');
  style.textContent = [
    '.fm26-portraits{display:grid;grid-template-columns:repeat(6,minmax(72px,1fr));gap:10px;margin:12px 0 18px}',
    '.fm26-portrait-choice{border:1px solid #ffffff20;background:#15152a;border-radius:12px;padding:7px;cursor:pointer;color:#eef0ff;text-align:center;min-width:0}',
    '.fm26-portrait-choice img{width:100%;aspect-ratio:4/4.4;object-fit:cover;border-radius:8px;display:block}',
    '.fm26-portrait-choice.selected{border:2px solid #a77cf5;box-shadow:0 0 0 2px #a77cf522}',
    '.fm26-portrait-choice small{display:block;font-size:10px;opacity:.72;margin-top:6px}',
    '.fm26-mode-switch{display:flex;gap:8px;margin:12px 0 10px;flex-wrap:wrap}',
    '.fm26-custom-club{display:none;border:1px solid #a77cf544;background:#141126;border-radius:14px;padding:15px;margin:10px 0 15px}',
    '.fm26-custom-club.active{display:block}.fm26-custom-club .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}',
    '.fm26-custom-club input,.fm26-custom-club select{width:100%;margin:5px 0 10px;padding:11px;border-radius:7px;background:#0b0c1b;color:#eef0ff;border:1px solid #ffffff20}',
    '.fm26-face{display:inline-flex;width:36px;height:36px;overflow:hidden;border-radius:50%;vertical-align:middle;background:#24213c;flex:none}',
    '.fm26-face img{width:100%;height:100%;object-fit:cover}.fm26-face.big{width:88px;height:98px;border-radius:12px}',
    '.fm26-photo-source{font-size:11px;color:#aaa4c4;margin-top:5px}.fm26-photo-source a{color:#aebeff}',
    '.fm26-chat-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:12px;min-height:540px}',
    '.fm26-contact{width:100%;display:flex;gap:10px;align-items:center;text-align:left;border:0;border-bottom:1px solid #ffffff12;background:transparent;color:#eef0ff;padding:12px;cursor:pointer}',
    '.fm26-contact.active{background:#a77cf51b;border-left:3px solid #a77cf5}.fm26-contact span:last-child{min-width:0}',
    '.fm26-bubble{padding:12px 14px;border-radius:13px;margin:8px 0;max-width:86%;line-height:1.5;white-space:pre-wrap}',
    '.fm26-bubble.me{background:#33285c;margin-left:auto}.fm26-bubble.them{background:#202036;margin-right:auto}',
    '.fm26-conversation{display:flex;flex-direction:column;min-height:470px}.fm26-messages{flex:1;max-height:420px;overflow:auto;padding:8px}',
    '.fm26-choice-list{display:grid;gap:8px;margin-top:12px}.fm26-choice{white-space:normal;text-align:left;line-height:1.35;padding:12px;border:1px solid #a77cf555;border-radius:10px;background:#18152b;color:#f0ecff;cursor:pointer}',
    '.fm26-choice:hover{background:#2b214b}.fm26-inbox-layout{display:grid;grid-template-columns:290px minmax(0,1fr);gap:12px}',
    '.fm26-mail-list{padding:0;overflow:hidden}.fm26-mail-item{display:block;width:100%;text-align:left;padding:13px;border:0;border-bottom:1px solid #ffffff10;background:transparent;color:#eef0ff;cursor:pointer}',
    '.fm26-mail-item.active{background:#a77cf51a;border-left:3px solid #a77cf5}.fm26-mail-item.unread strong:after{content:" •";color:#bb9aff}',
    '.fm26-mail-item small,.fm26-mail-item span{display:block;color:#aaa4c4;margin-top:4px;overflow:hidden;text-overflow:ellipsis}',
    '.fm26-mail-content{min-height:430px}.fm26-lineup-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(270px,.9fr);gap:12px}',
    '.fm26-lineup-pitch{position:relative;min-height:520px;border-radius:14px;overflow:hidden;background:linear-gradient(90deg,#125a3a,#19683f,#125a3a);border:2px solid #d9f5de55}',
    '.fm26-lineup-pitch:before{content:"";position:absolute;inset:15px;border:1px solid #dff8e7a8;border-radius:2px;background:linear-gradient(90deg,transparent 49.7%,#dff8e777 49.8%,#dff8e777 50.2%,transparent 50.3%)}',
    '.fm26-lineup-pitch:after{content:"";position:absolute;left:30%;right:30%;top:50%;height:16%;transform:translateY(-50%);border:1px solid #dff8e7a8}',
    '.fm26-slot{position:absolute;z-index:2;transform:translate(-50%,-50%);width:105px;max-width:23%;padding:4px;background:#071b14e8;border:1px solid #ffffff40;border-radius:9px;color:#fff;text-align:center}',
    '.fm26-slot button{border:0;background:transparent;color:#fff;cursor:grab;display:block;width:100%;padding:2px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.fm26-slot small{font-size:9px;color:#c9e8d2}.fm26-slot select{width:100%;max-width:100%;font-size:10px;background:#0d2119;color:#fff;border:1px solid #ffffff28;padding:3px}',
    '.fm26-player-row{display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #ffffff0f;cursor:pointer}',
    '.fm26-player-row .meta{flex:1;min-width:0}.fm26-player-row small{display:block;color:#aaa4c4}',
    '.fm26-live-tools{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-bottom:12px}',
    '.fm26-live-tools button,.fm26-live-tools select{border:1px solid #a77cf566;background:#151329;color:#f1eaff;padding:8px 10px;border-radius:8px;cursor:pointer}',
    '.fm26-live-tools button.active{background:#784fbb}.fm26-event-banner{margin:10px 0;padding:16px;border:1px solid #e7ca6c66;border-radius:12px;background:#40351844}',
    '.fm26-person-header{display:flex;align-items:center;gap:12px}.fm26-section-kicker{font-size:11px;letter-spacing:.13em;color:#bda8f6;text-transform:uppercase}',
    '@media(max-width:850px){.fm26-portraits{grid-template-columns:repeat(3,minmax(65px,1fr))}.fm26-chat-layout,.fm26-inbox-layout,.fm26-lineup-layout{grid-template-columns:1fr}.fm26-lineup-pitch{min-height:480px}.fm26-slot{width:92px}.fm26-custom-club .row{grid-template-columns:1fr}}'
  ].join('');
  document.head.appendChild(style);

  const lowerLeagues = {
    'France|Ligue régionale française': ['FC Montreuil','Racing Val-de-Marne','AS Rive-Nord','Olympique du Canal','US Grand Paris','Stade de Belleville','Sporting de Meaux','FC Saint-Denis','Étoile de l’Est','Union de l’Ouest','SC Val d’Europe','Athletic de Seine','FC des Lilas','Racing de Sologne','US Atlantique','Club à créer'],
    'Angleterre|County League anglaise': ['Northbridge FC','Kingsport Athletic','Riverside Town','Westmoor United','Eastborough FC','Meadowfield Rovers','Ashford Vale','Redbridge City','Stonehaven Athletic','Lakeside FC','Kingswell Town','Oldcastle United','Briarwood FC','Southport Vale','Oakford Rovers','Club à créer'],
    'Espagne|Liga regional española': ['Atlético Sierra','Deportivo del Norte','Unión Costa','Real Valle','CD Nueva Villa','Sporting del Río','CF Montaña','UD Albor','Racing del Sol','CD San Marcos','Atlético Bahía','Unión Serrana','FC Mediterráneo','Real Campiña','Deportivo Estrella','Club à créer'],
    'Italie|Campionato regionale italiano': ['AS Valverde','US Collina','Sporting del Lago','FC Bellavista','AC Porto Nuovo','Real Castello','AS Marina','Virtus Montelupo','Calcio Aurora','US San Pietro','Atletico Verdi','FC Pianura','AS Borgo','Union Riviera','Sporting Toscana','Club à créer'],
    'Allemagne|Oberliga régionale': ['FC Hohenwald','SV Linden','TuS Nordstadt','Sportfreunde Tal','Union Hafen','TSV Bergheim','VfR Sonnenfeld','SC Eichen','FC Waldtor','SV Neustadt','Kickers Auen','Viktoria Höhen','BSV Westpark','1. FC Ufer','Rot-Weiss Talheim','Club à créer'],
    'Portugal|Campeonato distrital': ['Atlético do Vale','União da Serra','Sporting Ribeira','FC Penedo','GD Mar Azul','CD Pinhal','SC Alvorada','Estrela do Minho','União do Sul','Atlético das Flores','FC Campestre','Sporting do Norte','CD Areal','Real da Costa','União Serrana','Club à créer'],
    'Pays-Bas|Regionale klasse': ['SV Noorddam','FC Waterland','VV Oosthaven','SC Veldwijk','Racing Westerdam','Sporting Duin','VV Groeneveld','FC Zuidpoort','AVC Meerdijk','SV Laren','VV Zonnedijk','FC Buitenhof','SC Rivier','VV Dorpzicht','Union Noordzee','Club à créer'],
    'Belgique|Provinciale afdeling': ['FC Rivieren','KSC Groenveld','Royal Noord','Sporting Ardenne','Union Meuse','VV Kempen','AC Bruxelles Nord','RFC du Centre','KFC Lumière','Olympique Sambre','Sporting Dyle','FC Campine','Union du Hainaut','Racing Condroz','AS Borinage','Club à créer'],
    'Écosse|Regional League écossaise': ['Caledonia Thistle','East Firth FC','West Loch United','Highland Rovers','North Brae Athletic','Dunmuir FC','Clyde Valley','Southmoor Albion','Forthbridge','Glenhaven Town','Stirling Vale','Kirkton United','Lochside FC','Redcastle Athletic','Seaview Rovers','Club à créer'],
    'Turquie|Bölgesel lig': ['Anadolu Gücü','Mavişehir FK','Kuzey Yıldızı','Akdeniz Spor','Yeni Ufuk','Altınova SK','Kıyıspor','Doğu Anadolu FK','Yıldırım Belediye','Güneşli Gençlik','Boğaz United','Karadeniz 1967','Marmara Atletik','Eskişehir Birlik','Toros FK','Club à créer'],
    'Grèce|Ligue régionale grecque': ['Athina United','Thessaloniki FC','Piraeus Athletic','Patras Sporting','Kriti FC','Larissa Olympique','Volos City','Rhodes Athletic','Ioannina FC','Kalamata Union','Serres Rovers','Chania Sporting','Trikala United','Drama FC','Corfu Athletic','Club à créer']
  };
  function getLowerLeague(country) {
    const key = Object.keys(lowerLeagues).find(k => k.startsWith(country + '|')) || Object.keys(lowerLeagues)[0];
    return {name:key.split('|')[1], clubs:lowerLeagues[key].slice()};
  }
  function getCareerPyramid(country) {
    const pyramids = {
      'France':['Ligue régionale française','Ligue 3','Ligue 2','Ligue 1'],
      'Angleterre':['County League anglaise','League Two','League One','Championship','Premier League'],
      'Espagne':['Liga regional española','Primera Federación – Groupe 1','Segunda División','La Liga'],
      'Italie':['Campionato regionale italiano','Serie C – Girone A','Serie B','Serie A'],
      'Allemagne':['Oberliga régionale','3. Liga','2. Bundesliga','Bundesliga'],
      'Portugal':['Campeonato distrital','Liga Portugal 2','Primeira Liga'],
      'Pays-Bas':['Regionale klasse','Tweede Divisie','Eerste Divisie','Eredivisie'],
      'Belgique':['Provinciale afdeling','Challenger Pro League','Jupiler Pro League'],
      'Écosse':['Regional League écossaise','Scottish League Two','Scottish League One','Scottish Championship','Scottish Premiership'],
      'Grèce':['Ligue régionale grecque','Super League 2','Super League Greece'],
      'Turquie':['Bölgesel lig','TFF 1. Lig','Süper Lig']
    };
    return pyramids[country] || [];
  }
  function promoteCustomClub(previousLeague) {
    if(!S || !S.clubCreated)return false;
    const pyramid=getCareerPyramid(S.clubCountry||'France');
    const index=pyramid.indexOf(previousLeague);
    if(index<0 || index>=pyramid.length-1)return false;
    const nextLeague=pyramid[index+1];
    if(!LG[nextLeague])return false;
    if(!LG[nextLeague].includes(S.club))LG[nextLeague]=LG[nextLeague].concat(S.club);
    S.lg=nextLeague;
    S.customTierIndex=index+1;
    S.customLeagueClubs=LG[nextLeague].slice();
    S.tb={};
    newTb();
    S.fx=mkFx();
    S.cupComps={};
    S.cupStateVersion=0;
    mail('Promotion','Ton club monte en division supérieure',S.club+' a remporté '+previousLeague+' et intègre désormais '+nextLeague+'. Le calendrier et le classement ont été reconstruits pour cette nouvelle division.');
    event('Promotion historique',S.club+' remporte '+previousLeague+' et accède à '+nextLeague+'.');
    return true;
  }
  let careerType = 'existing';
  let selectedPortrait = 0;
  let originalXI = null;
  let originalStartCareer = null;
  let originalStartMatch = null;
  let originalEndMatch = null;
  let originalNewSeason = null;
  let originalDraw = null;
  let originalPlayerView = null;
  let originalSquadView = null;
  let originalInboxView = null;
  let originalRender = null;

  function insertSetupWidgets() {
    if (!document.querySelector('#fm26-profile-select')) {
      const brand = document.querySelector('#setup .setup-brand');
      if (!brand) return;
      const profile = document.createElement('section');
      profile.id = 'fm26-profile-select';
      profile.className = 'pn';
      profile.style.margin = '14px 0';
      let html = '<div class="fm26-section-kicker">Ton identité de manager</div><h3 style="margin:5px 0 0">Choisis ton portrait</h3><p class="mu">Photos de référence d’entraîneurs lorsqu’elles sont disponibles ; sinon, un portrait illustré est utilisé.</p><div class="fm26-portraits">';
      for (let i = 0; i < 6; i++) {
        html += '<button type="button" class="fm26-portrait-choice' + (i === selectedPortrait ? ' selected' : '') + '" data-portrait="' + i + '" data-coach-name="' + txt(names[i]) + '"><img src="' + portraitSvg(i) + '" alt="Portrait de ' + txt(names[i]) + '"><small>' + txt(names[i]) + '</small></button>';
      }
      html += '</div>';
      profile.innerHTML = html;
      brand.insertAdjacentElement('afterend', profile);
      loadManagerPortraits(profile);
      profile.addEventListener('click', e => {
        const b = e.target.closest('[data-portrait]');
        if (!b) return;
        selectedPortrait = Number(b.dataset.portrait) || 0;
        selectedPortraitPhoto = b.dataset.photoUrl || (managerPhotoSources[selectedPortrait]&&managerPhotoSources[selectedPortrait].url) || null;
        selectedPortraitPage = b.dataset.photoPage || (managerPhotoSources[selectedPortrait]&&managerPhotoSources[selectedPortrait].page) || null;
        profile.querySelectorAll('[data-portrait]').forEach(el => el.classList.toggle('selected', Number(el.dataset.portrait) === selectedPortrait));
      });
    }
    if (!document.querySelector('#fm26-career-type')) {
      const setup = document.querySelector('#setup .sc');
      const row = document.querySelector('#setup .row');
      if (!setup || !row) return;
      const mode = document.createElement('section');
      mode.id = 'fm26-career-type';
      mode.innerHTML = '<div class="fm26-mode-switch"><button type="button" class="chip on" data-career-type="existing">Gérer un club existant</button><button type="button" class="chip" data-career-type="create">Créer mon propre club</button></div><div id="fm26-create-panel" class="fm26-custom-club"><div class="fm26-section-kicker">Nouvelle aventure</div><h3>Fonder un club et commencer au plus bas</h3><p class="mu">Ton équipe sera inscrite dans une ligue régionale de jeu. Les autres clubs de cette ligue sont des clubs fictifs générés pour cette carrière.</p><div class="row"><div><label for="fm26-club-name">Nom du club</label><input id="fm26-club-name" maxlength="38" placeholder="Ex. Paris Horizon FC"></div><div><label for="fm26-club-short">Nom court</label><input id="fm26-club-short" maxlength="5" placeholder="PHF"><label for="fm26-country">Pays de départ</label><select id="fm26-country"><option>France</option><option>Angleterre</option><option>Espagne</option><option>Italie</option><option>Allemagne</option><option>Portugal</option><option>Pays-Bas</option><option>Belgique</option><option>Écosse</option><option>Grèce</option><option>Turquie</option></select></div></div></div>';
      setup.insertBefore(mode, row);
      mode.addEventListener('click', e => {
        const b = e.target.closest('[data-career-type]');
        if (!b) return;
        careerType = b.dataset.careerType;
        mode.querySelectorAll('[data-career-type]').forEach(el => el.classList.toggle('on', el === b));
        const panel = document.querySelector('#fm26-create-panel');
        if (panel) panel.classList.toggle('active', careerType === 'create');
        row.style.display = careerType === 'create' ? 'none' : '';
        const clubLabel = Array.from(document.querySelectorAll('#setup label')).find(el => el.textContent.trim() === 'Club');
        const clubBox = document.querySelector('#cl');
        if (clubLabel) clubLabel.style.display = careerType === 'create' ? 'none' : '';
        if (clubBox) clubBox.style.display = careerType === 'create' ? 'none' : '';
      });
    }
  }
  function setupSeed() {
    if (typeof S === 'undefined' || !S) return;
    if (!Array.isArray(S.sq)) S.sq = [];
    S.managerPortrait = Number.isFinite(Number(S.managerPortrait)) ? Number(S.managerPortrait) : selectedPortrait;
    selectedPortrait = S.managerPortrait;
    S.managerPhoto = S.managerPhoto || null;
    S.managerPhotoPage = S.managerPhotoPage || null;
    selectedPortraitPhoto = S.managerPhoto;
    selectedPortraitPage = S.managerPhotoPage;
    S.chatThreads = S.chatThreads || {};
    S.activeTalk = S.activeTalk || 'president';
    S.careerEvents = Array.isArray(S.careerEvents) ? S.careerEvents : [];
    S.lineup = Array.isArray(S.lineup) ? S.lineup : [];
    S.clubCreated = !!S.clubCreated;
    S.clubCode = S.clubCode || '';
    if (S.clubCreated && S.lg && Array.isArray(S.customLeagueClubs) && S.customLeagueClubs.length) LG[S.lg] = S.customLeagueClubs.slice();
    if (!S.lineup.length && typeof xi === 'function') S.lineup = xi().map(p => p.id);
    seedConversations();
  }
  function seedConversations() {
    if (!S) return;
    S.chatThreads = S.chatThreads || {};
    if (S.chatThreads.seeded) {
      (S.sq || []).forEach(p => { const k='player-'+p.id; if(!S.chatThreads[k]) S.chatThreads[k]={name:p.name,role:'Joueur · '+p.pos,icon:'J',messages:[{from:'them',text:'Coach, comment vois-tu mon rôle dans l’équipe ?'}]}; else { S.chatThreads[k].name=p.name; S.chatThreads[k].role='Joueur · '+p.pos; } });
      return;
    }
    S.chatThreads = {
      seeded: true,
      president: {name:'Président', role:'Direction du club', icon:'P', messages:[{from:'them',text:'Bienvenue. J’aimerais comprendre ton projet sportif. Quelle identité veux-tu donner à l’équipe ?'}]},
      assistant: {name:'Adjoint', role:'Staff technique', icon:'A', messages:[{from:'them',text:'J’ai regardé le groupe. On peut progresser rapidement si on choisit clairement nos priorités.'}]},
      captain: {name:'Capitaine', role:'Vestiaire', icon:'C', messages:[{from:'them',text:'Le groupe attend de savoir ce que tu veux de nous cette saison.'}]},
      medical: {name:'Responsable médical', role:'Performance et blessures', icon:'M', messages:[{from:'them',text:'Je suis prêt à faire le point sur la condition, la récupération et les joueurs à ménager.'}]},
      director: {name:'Directeur sportif', role:'Recrutement', icon:'D', messages:[{from:'them',text:'Nous pouvons cibler quelques postes. Qu’est-ce qui te semble prioritaire ?'}]},
      media: {name:'Journaliste sportif', role:'Presse & conférences', icon:'J', messages:[{from:'them',text:'Coach, quelle est votre analyse de l’équipe et des objectifs du club cette saison ?'}]},
      star: {name:'Leader du vestiaire', role:'Joueur de l’effectif', icon:'★', messages:[{from:'them',text:'Coach, je veux comprendre le rôle que tu me réserves. Comment vois-tu ma place dans le projet ?'}]}
    };
    (S.sq || []).forEach(p => { const k='player-'+p.id; S.chatThreads[k]={name:p.name,role:'Joueur · '+p.pos,icon:'J',messages:[{from:'them',text:'Coach, comment vois-tu mon rôle dans l’équipe ?'}]}; });
  }
  function addChat(key, from, text) {
    seedConversations();
    const t = S.chatThreads[key];
    if (!t) return;
    t.messages.push({from:from,text:text});
    t.messages = t.messages.slice(-30);
    S.activeTalk = key;
    try { sv(); } catch (e) {}
  }
  function chatChoices(key) {
    if (String(key).indexOf('player-') === 0) return [
      ['Je compte sur toi : tu auras des occasions de montrer ta valeur.','trust'],
      ['Ton temps de jeu dépendra de tes performances et du collectif.','competition'],
      ['Que penses-tu de ton rôle et de l’ambiance du groupe ?','honest']
    ];
    const roleText = {
      president: [
        ['Je veux construire un projet durable, avec un effectif équilibré.','durable'],
        ['Je veux viser haut et accepter une pression plus forte.','ambition'],
        ['La priorité est de stabiliser les finances et les résultats.','finance']
      ],
      assistant: [
        ['Prépare un 4-3-3 offensif et travaille les sorties de balle.','attack'],
        ['Priorité à la récupération et à la discipline défensive.','defence'],
        ['Fais-moi un rapport sur la fatigue et les joueurs en forme.','fitness']
      ],
      captain: [
        ['Je compte sur les leaders pour tirer le groupe vers le haut.','leader'],
        ['La place de chacun dépendra de l’entraînement et des performances.','competition'],
        ['Je veux un vestiaire soudé, parlons franchement des tensions.','unity']
      ],
      medical: [
        ['Ménage les joueurs fatigués et prépare un plan de récupération.','recovery'],
        ['Évalue les risques pour les joueurs qui reviennent de blessure.','injury'],
        ['Je veux un point individuel sur la condition de chaque titulaire.','report']
      ],
      director: [
        ['Cherche un jeune joueur à fort potentiel, à prix raisonnable.','youth'],
        ['Renforce en priorité la défense centrale.','defence'],
        ['Ne dépense pas avant d’avoir vérifié notre masse salariale.','finance']
      ],
      media: [
        ['Nous respectons l’adversaire, mais nous préparons ce match pour gagner.','ambition'],
        ['Je ne sous-estime personne : le prochain match est le plus important.','calm'],
        ['Je préfère parler du collectif plutôt que d’un seul joueur.','respect']
      ],
      star: [
        ['Tu as un rôle important, montre-le sur le terrain.','trust'],
        ['La concurrence est ouverte, ton travail décidera.','competition'],
        ['Dis-moi honnêtement ce qui te gêne dans le vestiaire.','honest']
      ]
    };
    return roleText[key] || roleText.assistant;
  }
  function responseFor(key, kind) {
    if (key === 'president') {
      if (kind === 'ambition') { S.board = clamp((S.board||70)+2,0,100); return 'J’apprécie l’ambition. Elle devra se voir dans les résultats, mais aussi dans les décisions de recrutement.'; }
      if (kind === 'finance') { S.board = clamp((S.board||70)+3,0,100); return 'C’est raisonnable. La direction suivra les dépenses, les salaires et l’évolution des résultats.'; }
      S.board = clamp((S.board||70)+1,0,100); return 'Très bien. Nous voulons un projet cohérent, pas une succession de décisions prises dans la panique.';
    }
    if (key === 'assistant') {
      if (kind === 'attack') { S.tc = S.tc || {}; S.tc.m = 'Attacking'; return 'Je vais préparer une approche plus agressive. Il faudra surveiller les espaces dans notre dos.'; }
      if (kind === 'defence') { S.tc = S.tc || {}; S.tc.m = 'Cautious'; return 'On travaillera le bloc, le replacement et la récupération. Je te signalerai si le groupe manque de jambes.'; }
      return 'Je vais comparer la condition, la forme et la disponibilité des joueurs. Pense à faire tourner avant que la fatigue ne pèse sur les résultats.';
    }
    if (key === 'captain') {
      S.mor = clamp((S.mor||70)+(kind==='unity'?4:kind==='competition'?-1:3),0,100);
      return kind==='competition' ? 'Compris. On sait que personne n’a sa place garantie. L’important sera que les règles soient les mêmes pour tous.' : 'Le message est passé. Je vais parler au groupe pour qu’on reste soudés et qu’on réponde sur le terrain.';
    }
    if (key === 'medical') {
      if (kind === 'recovery') { S.sq.forEach(p=>{if((p.cond||100)<72) p.cond=cl(p.cond+3,0,100);}); return 'Plan de récupération activé pour les joueurs les plus fatigués. Une partie de la condition reviendra au prochain cycle.'; }
      if (kind === 'injury') return 'Je vais surveiller de près les retours de blessure. Un joueur qui n’est pas prêt ne doit pas être forcé à reprendre trop tôt.';
      return 'Regarde aussi l’onglet Effectif : il montre désormais la condition et la forme avant de faire la composition.';
    }
    if (key === 'director') {
      if (kind === 'youth') { S.mk = Array.isArray(S.mk)?S.mk:[]; return 'Mission lancée dans notre simulation : un rapport de recrutement sera ajouté à la boîte mail lors d’une prochaine étape de carrière.'; }
      if (kind === 'defence') return 'Bien reçu. Je donne la priorité aux défenseurs centraux dans le centre de recrutement.';
      return 'Bonne décision. Je tiendrai compte du budget et de la masse salariale avant toute proposition.';
    }
    if (key === 'media') {
      if (kind === 'ambition') { S.fans=clamp((S.fans||70)+2,0,100); return 'C’est noté. Les supporters attendent maintenant de voir cette ambition se traduire sur le terrain. Nous en reparlerons après le match.'; }
      if (kind === 'respect') { S.fans=clamp((S.fans||70)+1,0,100); return 'Merci pour votre réponse. Le collectif reste au centre du projet et nous interrogerons aussi vos joueurs sur leur préparation.'; }
      return 'Une réponse mesurée. La pression reste forte, et les journalistes suivront surtout les résultats et les choix tactiques.';
    }
    if (String(key).indexOf('player-') === 0) {
      const id=Number(String(key).slice(7));
      const player=(S.sq||[]).find(p=>Number(p.id)===id);
      if(player){ if(player.morale==null)player.morale=70; player.morale=clamp(player.morale+(kind==='trust'?5:kind==='honest'?2:-2),0,100); }
      return kind==='trust' ? 'Merci coach. Je vais faire le maximum pour aider le collectif.' : kind==='honest' ? 'Je pense que des échanges réguliers nous aideront à progresser.' : 'C’est clair. Je vais travailler pour mériter davantage de temps de jeu.';
    }
    if (key === 'star') {
      S.sq.forEach(p=>{if(p.morale==null)p.morale=70;});
      const p = (S.sq||[]).slice().sort((a,b)=>(b.ovr||0)-(a.ovr||0))[0];
      if (p) p.morale = clamp((p.morale||70)+(kind==='trust'?5:kind==='honest'?2:-2),0,100);
      return kind==='trust' ? 'Merci coach. Je vais essayer de rendre cette confiance sur le terrain.' : kind==='honest' ? 'Je vais parler franchement. Un vestiaire a besoin de règles claires et de conversations régulières.' : 'D’accord. Je vais faire le nécessaire pour gagner ma place.';
    }
    return 'Compris. Je te ferai un retour à la prochaine étape.';
  }
  function chatView() {
    seedConversations();
    const keys = ['president','assistant','captain','medical','director','media','star'].concat((S.sq||[]).map(p=>'player-'+p.id));
    const active = S.chatThreads[S.activeTalk] || S.chatThreads.president;
    let left = '<div class="pn" style="padding:0"><div style="padding:14px"><h3 style="margin:0">Contacts du club</h3><small class="mu">Messages et discussions</small></div>';
    keys.forEach(k => {
      const t = S.chatThreads[k];
      const person = String(k).indexOf('player-')===0 ? (S.sq||[]).find(p=>Number(p.id)===Number(String(k).slice(7))) : null;
      const avatar = person ? playerFace(person) : face(t.name, k.length%6);
      left += '<button class="fm26-contact' + (k===S.activeTalk?' active':'') + '" onclick="FM26UX.openTalk(&quot;' + k + '&quot;)">' + avatar + '<span><b>' + txt(t.name) + '</b><small class="mu">' + txt(t.role) + '</small></span></button>';
    });
    left += '</div>';
    let msgs = '';
    active.messages.forEach(m => { msgs += '<div class="fm26-bubble ' + (m.from==='me'?'me':'them') + '">' + txt(m.text) + '</div>'; });
    const choices = chatChoices(S.activeTalk);
    const activePerson = String(S.activeTalk).indexOf('player-')===0 ? (S.sq||[]).find(p=>Number(p.id)===Number(String(S.activeTalk).slice(7))) : null;
    const activeAvatar = activePerson ? playerFace(activePerson) : face(active.name, keys.indexOf(S.activeTalk));
    let right = '<div class="pn fm26-conversation"><div class="fm26-person-header">' + activeAvatar + '<div><h2 style="margin:0">' + txt(active.name) + '</h2><small class="mu">' + txt(active.role) + '</small></div><span class="spacer"></span><span class="b h">En ligne</span></div><div id="fm26-chat-messages" class="fm26-messages">' + msgs + '</div><div class="mu">Choisis une réponse :</div><div class="fm26-choice-list">';
    choices.forEach((ch,i) => { right += '<button class="fm26-choice" onclick="FM26UX.reply(\'' + S.activeTalk + '\',' + i + ')">' + (i+1) + '. ' + txt(ch[0]) + '</button>'; });
    right += '</div><div style="display:flex;gap:8px;margin-top:10px"><input id="fm26-free-message" placeholder="Ou écris ton propre message…" style="flex:1;min-width:0;background:#0c0c1b;color:#fff;border:1px solid #ffffff25;border-radius:8px;padding:10px"><button class="chip" onclick="FM26UX.sendFree()">Envoyer</button></div><small class="mu">Écris librement : le contact interprète ton message selon son rôle et les données de ta carrière.</small></div>';
    return '<div class="page-intro"><div><p class="eyebrow">VIE DU CLUB</p><h1>Discussions</h1><p>Parle à la direction, au staff et aux leaders du vestiaire.</p></div></div><div class="fm26-chat-layout">' + left + right + '</div>';
  }
  function openTalk(key) { seedConversations(); if (S.chatThreads[key]) S.activeTalk=key; try{sv()}catch(e){}; render(); }
  function reply(key, index) {
    const choices = chatChoices(key);
    const choice = choices[index];
    if (!choice) return;
    addChat(key,'me',choice[0]);
    const answer = responseFor(key,choice[1]);
    addChat(key,'them',answer);
    if (S.careerEvents) {
      S.careerEvents.unshift({date:S.date,title:'Discussion avec ' + S.chatThreads[key].name,text:answer});
      S.careerEvents=S.careerEvents.slice(0,40);
    }
    try{sv()}catch(e){}
    render();
  }
  function chatNorm(value) {
    return String(value == null ? '' : value).toLocaleLowerCase('fr-FR').normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-z0-9€%+\- ]/g,' ').replace(/\s+/g,' ').trim();
  }
  function chatFacts() {
    const club=S.club||'notre club', players=Array.isArray(S.sq)?S.sq:[];
    const fx=(S.fx||[]).filter(f=>f.home===club||f.away===club);
    const next=fx.filter(f=>!f.played).sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0]||null;
    const last=fx.filter(f=>f.played).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
    let table=[];try{if(typeof tbl==='function')table=tbl()||[];}catch(_){}
    const rank=table.findIndex(r=>r.c===club)+1,row=rank>0?table[rank-1]:null;
    const tired=players.filter(p=>Number(p.cond)<65),injured=players.filter(p=>Number(p.inj)>0);
    const morales=players.map(p=>Number(p.morale!=null?p.morale:p.mrl)).filter(Number.isFinite);
    return {club,players,fx,next,last,table,rank,row,tired,injured,avg:morales.length?Math.round(morales.reduce((a,b)=>a+b,0)/morales.length):Math.round(Number(S.mor)||70),budget:Number(S.bud),wages:players.reduce((a,p)=>a+(Number(p.sal)||0),0)};
  }
  function chatClassify(raw) {
    const n=chatNorm(raw), has=(...p)=>p.some(re=>re.test(n));
    let kind='general';
    if(has(/\b(bonjour|salut|coucou|bonsoir|comment tu vas|ca va)\b/))kind='greeting';
    else if(has(/\b(merci|bravo|bien joue|parfait|super|excellent)\b/))kind='thanks';
    else if(has(/\b(tu ne comprends pas|tu comprends rien|pas compris|ce n est pas ce que je veux|tu repete|toujours la meme|meme reponse|tu ne m ecoutes pas)\b/))kind='frustration';
    else if(has(/\b(prochain match|match suivant|contre qui|quel adversaire|calendrier|quand joue|on joue quand)\b/))kind='nextmatch';
    else if(has(/\b(classement|quelle place|notre place|combien de points|on est combien|relegation|qualification)\b/))kind='standings';
    else if(has(/\b(dernier match|match precedent|score|resultat|bilan du match|on a gagne|on a perdu|match nul)\b/))kind='lastmatch';
    else if(has(/\b(budget|argent|finances|financier|masse salariale|salaires|fonds disponibles|euros|depenses)\b/))kind='finance';
    else if(has(/\b(blessure|blesse|infirmerie|medical|fatigue|condition physique|recuperation|recuperer|indisponible)\b/))kind='fitness';
    else if(has(/\b(titulaire|titularisation|temps de jeu|jouer plus|remplacant|composition|mon role|ma place|dans le onze|selectionne|pourquoi je joue)\b/))kind='playingtime';
    else if(has(/\b(moral|ambiance|vestiaire|confiance|mecontent|tension|motiver|motivation|cohesion)\b/))kind='morale';
    else if(has(/\b(entrainement|entrainer|seance|progresser|developpement individuel|developper les joueurs)\b/))kind='training';
    else if(has(/\b(formation|4 3 3|433|4 2 3 1|4231|4 4 2|442|3 5 2|352|systeme de jeu|schema tactique)\b/))kind='formation';
    else if(has(/\b(offensif|offensive|attaquer|attaque|pressing|gegenpress|bloc haut|ligne haute|agressif)\b/)&&!has(/\bpas\b.{0,20}\b(offensif|offensive|attaquer|pressing|agressif)\b/))kind='attack';
    else if(has(/\b(defensif|defensive|defense|bloc bas|repli|prudence|prudent|contre attaque|fermer les espaces)\b/)||has(/\bpas\b.{0,20}\b(offensif|offensive|attaquer|pressing|agressif)\b/))kind='defence';
    else if(has(/\b(transfert|recrut|recrue|mercato|acheter|vendre|vente|attaquant|defenseur|gardien|milieu|jeune joueur|centre de formation|academie|potentiel|scout)\b/))kind='recruitment';
    else if(has(/\b(contrat|prolongation|prolonger|renouveler|fin de contrat)\b/))kind='contract';
    else if(has(/\b(presse|journaliste|media|conference|interview|declaration publique)\b/))kind='press';
    else if(has(/\b(objectif|ambition|titre|champion|coupe|direction attend|conseil|projet sportif)\b/))kind='objectives';
    else if(has(/\b(effectif|equipe|joueurs|points forts|faiblesses|analyse de l equipe|comment tu vois)\b/))kind='team';
    else if(has(/\b(je veux|je voudrais|il faut|fais|change|mets|passe|prepare|lance|cherche|organise|demande|conseille|propose|aide moi)\b/))kind='request';
    return {kind,n,question:/[?？]/.test(raw)||has(/\b(comment|pourquoi|combien|quand|quel|quelle|qui|ou|est ce que|peux tu|peut on|pourrais tu|explique|conseille|penses tu)\b/)};
  }
  function chatDate(value){try{return typeof fd==='function'?fd(value):new Date(value).toLocaleDateString('fr-FR');}catch(_){return String(value||'date inconnue');}}
  function chatPlayerReply(key,kind,f) {
    const p=f.players.find(x=>Number(x.id)===Number(String(key).slice(7)));
    if(!p)return 'Je ne retrouve pas ma fiche dans l’effectif. Rouvre ma conversation depuis la liste des joueurs et repose-moi la question.';
    const mood=clamp(Number(p.morale!=null?p.morale:p.mrl!=null?p.mrl:70),0,100),cond=clamp(Number(p.cond==null?100:p.cond),0,100),injured=Number(p.inj)>0;
    if(kind==='greeting')return 'Salut coach ! Je suis disponible pour parler de mon rôle, de ma forme ou de ce que tu attends de moi.';
    if(kind==='thanks')return 'Avec plaisir, coach. Pour moi, le plus important est qu’on puisse se parler franchement et que je sache ce que tu attends sur le terrain.';
    if(kind==='fitness')return injured?'Je ne suis pas encore disponible à 100 % à cause de ma blessure. Il faut suivre mon retour avec le staff médical plutôt que forcer.':cond<65?'Je commence à manquer de fraîcheur : ma condition est à '+cond+' %. Une récupération ou une rotation m’aiderait à retrouver de l’intensité.':'Ma condition est à '+cond+' %. Je suis disponible, mais je veux éviter une surcharge qui me ferait perdre en intensité.';
    if(kind==='playingtime')return mood<45?'Pour être honnête, je suis frustré par mon temps de jeu. J’aimerais savoir précisément ce que je dois améliorer pour retrouver une place.':'Je veux naturellement jouer davantage. Ma place doit dépendre de mes performances et de l’adversaire. Dis-moi le rôle que tu veux me confier et je travaillerai dans ce sens.';
    if(kind==='formation'||kind==='attack'||kind==='defence')return 'Je peux m’adapter au plan de jeu, coach. Comme '+(p.pos||'joueur')+', je dois respecter mes consignes et aider mes partenaires. Si tu changes le système, explique-nous les déplacements attendus.';
    if(kind==='training')return 'Je veux progresser. Donne-moi un axe de travail concret et veille à équilibrer la charge avec la récupération.';
    if(kind==='contract')return mood<50?'Je me pose des questions sur mon avenir et sur la place que tu me réserves. J’aimerais discuter de mon rôle et des conditions.':'Je suis prêt à discuter de mon avenir. Je veux comprendre le projet sportif et le rôle que tu comptes me confier.';
    if(kind==='morale')return 'Mon moral est à '+mood+'/100. '+(mood<50?'Je ne vais pas te cacher que ma situation me préoccupe. Une discussion claire sur mon rôle m’aiderait.':'Je pense que la confiance, des objectifs clairs et un retour régulier nous aideront à progresser.');
    if(kind==='standings')return f.row?'Nous sommes '+f.rank+'e avec '+f.row.pts+' point(s). Je vais me concentrer sur mon travail et aider l’équipe à prendre les points nécessaires.':'Je n’ai pas de classement fiable à te donner pour le moment. Vérifie Compétitions.';
    if(kind==='nextmatch')return f.next?'Je prépare le prochain rendez-vous contre '+(f.next.home===f.club?f.next.away:f.next.home)+', le '+chatDate(f.next.date)+'. Il faudra que je sois prêt à appliquer le plan de jeu.':'Je ne vois pas de prochain match programmé. Vérifie le calendrier.';
    if(kind==='lastmatch')return f.last?'Le dernier résultat enregistré est '+f.last.home+' '+(f.last.score||'—')+' '+f.last.away+'. On doit analyser ce qu’on a bien fait et ce qu’on doit corriger.':'Aucun résultat n’est encore enregistré pour le club.';
    if(kind==='frustration')return 'Je t’entends, coach. Je ne veux pas esquiver ce que tu dis. Est-ce que tu parles de mon rôle, du temps de jeu ou des résultats ?';
    return mood<45?'Je veux te répondre franchement : je ne suis pas entièrement satisfait de ma situation. Parlons de mon rôle et de ce que je dois faire pour gagner ta confiance.':'Je t’écoute, coach. Comme '+(p.pos||'joueur')+', mon point de vue dépend de mon rôle et de la situation du groupe. Dis-moi précisément ce que tu veux aborder.';
  }
  function chatNaturalReply(key,raw) {
    const it=chatClassify(raw),k=it.kind,n=it.n,f=chatFacts(),thread=S.chatThreads[key]||{};
    const isPlayer=String(key).indexOf('player-')===0,pres=key==='president',adj=key==='assistant',captain=key==='captain'||key==='star',med=key==='medical',dir=key==='director',press=key==='media';
    if(isPlayer)return chatPlayerReply(key,k,f);
    if(k==='greeting')return pres?'Bonjour coach. Le budget transfert est de '+(Number.isFinite(f.budget)?f.budget+' M€':'non renseigné')+' et le soutien de la direction est à '+Math.round(Number(S.board)||70)+'/100. Quel sujet veux-tu examiner ?':adj?'Salut coach. On peut parler du système, du pressing, de la composition ou de la préparation du prochain match.':med?'Bonjour coach. Je peux faire le point sur les blessures, la condition et la récupération.':dir?'Bonjour coach. Je peux examiner les besoins de l’effectif, les profils de recrutement et les limites du budget.':press?'Bonjour coach. Parlons des objectifs, des résultats et de la pression autour du club.':'Salut coach. Le vestiaire a besoin de consignes claires. Qu’est-ce que tu veux aborder ?';
    if(k==='thanks')return pres?'Très bien. Je préfère un dialogue direct : nous jugerons les décisions à leurs conséquences sur les résultats et les finances.':adj?'Avec plaisir. Je reste disponible pour analyser la tactique, la forme ou les choix de titulaires.':med?'Je t’en prie. La priorité reste de connaître la disponibilité et la charge des joueurs.':dir?'Très bien. Je comparerai le besoin, le coût, le salaire et l’intérêt sportif.':press?'Merci coach. Je confronterai ta déclaration aux résultats du terrain.':'Avec plaisir, coach. Gardons cette communication ouverte pour régler les problèmes avant qu’ils ne s’installent.';
    if(k==='nextmatch'){if(!f.next)return 'Je ne trouve pas de prochain match non joué pour '+f.club+'. Vérifions le calendrier avant de fixer la préparation.';const opp=f.next.home===f.club?f.next.away:f.next.home,venue=f.next.home===f.club?'à domicile':'à l’extérieur';return adj?'Le prochain match est contre '+opp+', le '+chatDate(f.next.date)+' ('+venue+'). Je recommande d’adapter le plan à notre forme, à la fatigue et aux points forts de l’adversaire.':med?'Le prochain rendez-vous est contre '+opp+', le '+chatDate(f.next.date)+'. Vérifions les '+f.tired.length+' joueur(s) sous 65 % de condition et les retours de blessure.':'Le prochain match de '+f.club+' est contre '+opp+', le '+chatDate(f.next.date)+' ('+venue+'). Alignons la préparation et les choix de composition sur cet objectif.';}
    if(k==='standings'){if(!f.row)return 'Le classement actuel n’est pas disponible dans les données consultables. Je préfère ne pas inventer une position : ouvre Compétitions pour vérifier le tableau.';return pres?'Nous sommes '+f.rank+'e avec '+f.row.pts+' point(s) après '+f.row.p+' match(s). '+(f.rank<=4?'La course aux objectifs élevés reste ouverte.':f.rank>=f.table.length-3?'La situation exige un redressement rapide.':'Il faut plus de régularité pour gagner des places.')+' Cette position comptera dans le bilan de saison.':'Nous sommes '+f.rank+'e avec '+f.row.pts+' point(s) : '+f.row.w+' victoire(s), '+f.row.d+' nul(s) et '+f.row.l+' défaite(s). '+(f.rank<=4?'Nous sommes bien placés pour viser haut.':f.rank>=f.table.length-3?'Il faut rapidement prendre des points.':'La régularité fera la différence.');}
    if(k==='lastmatch'){if(!f.last)return 'Aucun résultat n’est enregistré pour '+f.club+'. Après notre premier match, on pourra analyser le score et les points à corriger.';return adj?'Dernier résultat : '+f.last.home+' '+(f.last.score||'—')+' '+f.last.away+'. Je propose d’étudier les occasions et les moments où nous avons perdu le contrôle avant de changer la tactique.':'Le dernier résultat enregistré est '+f.last.home+' '+(f.last.score||'—')+' '+f.last.away+'. Utilisons-le pour décider quoi corriger, sans réagir uniquement à chaud.';}
    if(k==='finance'){const budget=Number.isFinite(f.budget)?f.budget.toFixed(1)+' M€':'non renseigné',wages=(f.wages/1000000).toFixed(2)+' M€ par semaine';return pres?'Le budget transfert est de '+budget+' et la masse salariale calculée à partir de l’effectif est d’environ '+wages+'. Chaque recrue doit répondre à un besoin précis.':dir?'Je partirai du budget de '+budget+' et d’une masse salariale d’environ '+wages+'. Je comparerai coût, salaire et besoin sportif avant de recommander une piste.':'Les données actuelles indiquent un budget transfert de '+budget+'. La direction et le directeur sportif doivent valider les dépenses.';}
    if(k==='fitness'){const low=f.tired.slice(0,4).map(p=>p.name+' ('+Math.round(Number(p.cond))+' %)').join(', '),inj=f.injured.slice(0,4).map(p=>p.name).join(', ');return med?'Bilan actuel : '+f.injured.length+' blessure(s)/indisponibilité(s)'+(inj?' — '+inj:'')+' et '+f.tired.length+' joueur(s) sous 65 % de condition'+(low?' — '+low:'')+'. Il faut différencier fatigue et blessure avant la composition.':'Le point physique indique '+f.injured.length+' blessure(s)/indisponibilité(s) et '+f.tired.length+' joueur(s) sous 65 % de condition. Le responsable médical peut détailler les cas ; prévoyons aussi une rotation.';}
    if(k==='formation'||k==='attack'||k==='defence'){if(!adj)return 'Le choix tactique doit être coordonné avec l’adjoint. Depuis mon rôle de '+(thread.role||'membre du club')+', je peux parler des conséquences, mais pas prétendre changer moi-même les consignes techniques.';const command=/\b(mets|met|passe|change|joue|prepare|adopte|je veux|on va jouer|essaie|lance)\b/.test(n)&&!it.question;if(k==='formation'){const form=/\b(4 2 3 1|4231)\b/.test(n)?'4-2-3-1':/\b(4 4 2|442)\b/.test(n)?'4-4-2':/\b(3 5 2|352)\b/.test(n)?'3-5-2':'4-3-3';if(command){S.tc=S.tc||{};S.tc.f=form;try{sv()}catch(_){};return 'C’est noté : j’ai réglé le schéma sur '+form+'. Vérifie les postes naturels et les automatismes avant le match.';}return 'Le système actuellement enregistré est '+((S.tc&&S.tc.f)||'4-3-3')+'. Le 4-3-3 offre de la largeur et trois milieux ; le 4-2-3-1 sécurise davantage la base du milieu. Le choix dépend des joueurs disponibles.';}if(k==='attack'){if(command){S.tc=S.tc||{};S.tc.m='Attacking';try{sv()}catch(_){};return 'D’accord, j’ai réglé la mentalité sur Attacking. Nous chercherons à avancer plus vite, en surveillant les espaces derrière la défense.';}return 'Pour attaquer davantage, je recommande une mentalité positive, des relais proches du porteur et de la largeur. Il faudra surveiller les transitions adverses.';}if(command){S.tc=S.tc||{};S.tc.m='Cautious';try{sv()}catch(_){};return 'Compris : j’ai réglé la mentalité sur Cautious. Nous allons resserrer les espaces et protéger l’axe, au risque de réduire notre volume offensif.';}return 'Pour défendre mieux, protégeons l’axe et gardons des distances courtes entre les lignes. Un bloc très bas protège la profondeur, mais rend la sortie de balle plus difficile.';}
    if(k==='training'){if(adj){if(/\b(physique|endurance|vitesse)\b/.test(n)){S.tr='Physique';try{sv()}catch(_){};return 'J’ai sélectionné le programme Physique. Il aide les qualités physiques, mais la charge peut augmenter la fatigue.';}if(/\b(technique|passe|tir|controle|dribble)\b/.test(n)){S.tr='Technique';try{sv()}catch(_){};return 'J’ai sélectionné le programme Technique pour travailler les gestes et la progression individuelle.';}if(/\b(tactique|placement|automatismes)\b/.test(n)){S.tr='Tactique';try{sv()}catch(_){};return 'J’ai sélectionné le programme Tactique pour renforcer les automatismes.';}if(/\b(repos|reposer|recuperation|souffler)\b/.test(n)){S.tr='Récupération';try{sv()}catch(_){};return 'J’ai sélectionné Récupération. C’est le choix prudent lorsque le calendrier est chargé ou que plusieurs joueurs sont fatigués.';}return 'Je conseille Technique pour la progression, Tactique si nous changeons de système, Physique si la condition baisse, ou Récupération si la charge est élevée. Quel objectif privilégies-tu ?';}return 'L’entraînement doit équilibrer progression et récupération. Précise si tu vises la technique, le physique ou les automatismes.';}
    if(k==='recruitment'){if(dir){const market=Array.isArray(S.mk)?S.mk:[],best=market.slice().sort((a,b)=>(Number(b.ovr)||0)-(Number(a.ovr)||0))[0];return 'Je prends la demande de recrutement. Le marché simulé contient '+market.length+' piste(s) à examiner'+(best?'; la meilleure note de cette liste est '+best.name+' ('+best.ovr+').' : '.')+' Je comparerai le poste, le coût, le salaire et le potentiel avant de te recommander quelqu’un. Précise le poste prioritaire si tu en as un.';}return 'Le recrutement doit être coordonné avec le directeur sportif. Le meilleur choix dépend du poste, du niveau, de l’âge, du potentiel, du salaire et du budget.';}
    if(k==='contract')return (pres||dir)?'Pour un contrat, vérifions la durée restante, le rôle promis, le salaire et l’impact sur la masse salariale. Aucune prolongation ne doit être promise sans passer par la fiche du joueur et l’onglet Contrats.':'Un renouvellement doit rester cohérent avec le rôle sportif, la durée et les finances. Vérifions la fiche du joueur et l’onglet Contrats avant de faire une promesse.';
    if(k==='morale'){if(captain&&/\b(motive|rassemble|soude|encourage|parle au groupe|remonte le moral)\b/.test(n))S.mor=clamp((Number(S.mor)||70)+3,0,100);return 'Le moral moyen de l’effectif est autour de '+f.avg+'/100. '+(f.avg<55?'Certains joueurs ont besoin de clarté et de confiance.':'Le groupe a une base correcte, mais il faut garder une communication régulière.')+' Les temps de jeu, les résultats et la cohérence des règles influenceront le vestiaire.';}
    if(k==='press')return press?'Les journalistes jugeront la cohérence entre tes déclarations et les résultats. Tu peux défendre l’équipe sans promettre un titre à chaque conférence : explique les progrès attendus et la préparation du prochain match.':'Pour la presse, défendons le collectif, reconnaissons les axes de progrès et évitons les promesses impossibles à tenir.';
    if(k==='objectives')return pres?'Nous devons relier les objectifs aux résultats, à la progression de l’effectif et aux finances. Le soutien de la direction est à '+Math.round(Number(S.board)||70)+'/100. Je jugerai la cohérence entre l’ambition annoncée et les décisions.':'Le projet sportif doit combiner résultat et progression. '+(f.row?'Notre position est '+f.rank+'e avec '+f.row.pts+' point(s).':'Le classement n’est pas encore disponible.')+' Fixons une cible réaliste et ajustons-la selon les résultats et les moyens.';
    if(k==='frustration')return pres?'Je comprends que tu attendes une réponse plus précise. Est-ce que le problème concerne les résultats, le budget, le recrutement ou les objectifs ? Je répondrai sur ce point.':adj?'Tu as raison de demander une analyse concrète. Parlons du système, du pressing, de la condition ou des choix de titulaires.':dir?'Je comprends. Donne-moi le poste, le budget maximal ou le profil recherché et je comparerai ces critères.':'Je t’entends. Je veux répondre au point qui te dérange, pas répéter une phrase passe-partout. Dis-moi ce qui coince précisément.';
    if(k==='team'){const top=f.players.slice().sort((a,b)=>(Number(b.ovr)||0)-(Number(a.ovr)||0)).slice(0,3).map(p=>p.name+' ('+p.ovr+')').join(', ');return 'Les meilleures notes de l’effectif sont '+(top||'non disponibles')+'. Le moral moyen est à '+f.avg+'/100 et '+f.tired.length+' joueur(s) sont sous 65 % de condition. '+(adj?'Je recommande de choisir le système qui valorise les points forts des joueurs disponibles.':'Il faut croiser niveau, forme, postes et objectifs avant de juger le groupe.');}
    if(k==='request'){if(adj)return 'Je peux t’aider à le mettre en place. Je ferai la différence entre une recommandation et un changement réellement appliqué. Veux-tu agir sur le système, l’entraînement, la composition ou l’analyse du match ?';if(dir)return 'Je peux transformer ta demande en critères de recrutement : poste, coût, salaire et potentiel. Quel secteur veux-tu renforcer ?';if(med)return 'Je vais privilégier les données vérifiables : blessures signalées et condition physique. Les joueurs fatigués ou blessés doivent être évalués individuellement.';}
    if(pres)return 'Je veux comprendre le fond de ta demande, coach. Le soutien de la direction est à '+Math.round(Number(S.board)||70)+'/100. Je regarderai les effets sur les résultats, le budget et les objectifs ; quelle décision veux-tu prendre concrètement ?';
    if(adj)return 'Je peux t’aider à analyser l’effectif et la tactique en place. Pour éviter une réponse générique, ton problème concerne-t-il la défense, la création d’occasions, le pressing ou les choix de titulaires ?';
    if(med)return 'Je peux faire le point sur les données physiques : '+f.injured.length+' blessure(s)/indisponibilité(s) et '+f.tired.length+' joueur(s) sous 65 % de condition. Veux-tu la liste des absents ou des joueurs à faire souffler ?';
    if(dir)return 'Je peux t’aider à prioriser le recrutement en croisant poste, niveau, âge, potentiel, salaire et budget. Quel secteur veux-tu renforcer en priorité ?';
    if(press)return 'Je vais te répondre du point de vue de la presse : les déclarations seront jugées à la lumière des résultats et des choix de l’équipe. Quelle décision veux-tu commenter ?';
    return 'Je t’écoute, coach. Je vais tenir compte de mon rôle et de la situation du club pour te répondre, pas simplement répéter la même phrase.';
  }
  function sendFree() {
    const input=document.getElementById('fm26-free-message');
    const textValue=(input && input.value || '').trim();
    if(!textValue||!S)return;
    const key=S.activeTalk||'president';
    addChat(key,'me',textValue);
    let answer='';
    try{answer=chatNaturalReply(key,textValue);}catch(e){answer='Je veux répondre correctement, coach, mais je n’ai pas pu lire toutes les données nécessaires. Reformule ta question ou ouvre l’onglet correspondant pour vérifier le chiffre.';}
    if(!answer)answer='Je t’écoute, coach. Peux-tu préciser ce que tu veux savoir pour que je réponde au bon sujet ?';
    addChat(key,'them',answer);
    if(S.careerEvents){S.careerEvents.unshift({date:S.date,title:'Discussion avec '+(S.chatThreads[key]&&S.chatThreads[key].name||'le club'),text:answer});S.careerEvents=S.careerEvents.slice(0,40);}
    try{sv()}catch(e){}
    render();
  }

  function inboxView() {
    const mails=(S.ib||[]);
    if (!mails.length) return '<div class="pn"><h2>Boîte de réception</h2><p class="mu">Aucun message pour le moment.</p></div>';
    if (S.mi==null || S.mi<0 || S.mi>=mails.length) S.mi=0;
    const m=mails[S.mi]||mails[0]; m.r=true;
    let list='<div class="pn fm26-mail-list"><div style="padding:14px;border-bottom:1px solid #ffffff18"><h3 style="margin:0">Boîte de réception</h3><small class="mu">'+mails.filter(x=>!x.r).length+' message(s) non lu(s)</small></div>';
    mails.forEach((x,i)=>{
      list += '<button class="fm26-mail-item '+(i===S.mi?'active ':'')+(!x.r?'unread':'')+'" onclick="FM26UX.readMail('+i+')"><strong>'+txt(x.t||'Message')+'</strong><span>'+txt(x.s||'Club')+' · '+txt(String(x.b||'').slice(0,70))+'</span><small>'+txt(x.d?fd(x.d):'')+'</small></button>';
    });
    list+='</div>';
    let body='<div class="pn fm26-mail-content"><div class="fm26-section-kicker">'+txt(m.s||'Club')+'</div><h1 style="font-size:27px;margin:7px 0 5px">'+txt(m.t||'Message')+'</h1><p class="mu">'+txt(m.d?fd(m.d):S.date||'')+'</p><div style="height:1px;background:#ffffff18;margin:15px 0"></div><div style="font-size:16px;line-height:1.8;white-space:pre-wrap">'+txt(m.b||'')+'</div>';
    if (Array.isArray(m.o) && m.o.length) {
      body+='<div class="fm26-choice-list"><b>Ta réponse</b>';
      m.o.forEach((choice,i)=>{body+='<button class="fm26-choice" onclick="FM26UX.answerMail('+S.mi+','+i+')">'+txt(choice)+'</button>';});
      body+='</div>';
    }
    if (m.s && /Match report|Rapport de match/i.test(m.s)) body+='<div class="fm26-event-banner"><b>Bilan sportif</b><p class="mu">Le résultat influe sur le moral, la confiance de la direction et les supporters. La condition sera prise en compte au prochain match.</p><button class="chip" onclick="S.view=\'history\';render()">Voir l’historique</button></div>';
    body+='<div class="wr" style="margin-top:20px"><button class="chip" onclick="FM26UX.readMail('+(Math.min(mails.length-1,S.mi+1))+')">Message suivant →</button><button class="chip" onclick="S.view=\'talk\';render()">Discuter avec le club</button></div></div>';
    return '<div class="fm26-inbox-layout">'+list+body+'</div>';
  }
  function readMail(i){if(!S.ib[i])return;S.mi=i;S.ib[i].r=true;try{sv()}catch(e){};render();}
  function answerMail(i,j){
    const m=S.ib[i]; if(!m || !Array.isArray(m.o) || !m.o[j]) return;
    if(typeof ans==='function') { try { ans(i,j); } catch(e) {} }
    else { m.answer=m.o[j];m.r=true; }
    try{sv()}catch(e){}; render();
  }
  function lineupIds() {
    const valid=(S.lineup||[]).map(Number).filter(id=>(S.sq||[]).some(p=>Number(p.id)===id));
    const result=[];
    valid.forEach(id=>{if(!result.includes(id)&&result.length<11)result.push(id)});
    if(result.length<11) {
      const picks=typeof xi==='function'?xi():[];
      picks.forEach(p=>{if(result.length<11&&!result.includes(p.id))result.push(p.id)});
      (S.sq||[]).slice().sort((a,b)=>(b.ovr||0)-(a.ovr||0)).forEach(p=>{if(result.length<11&&!result.includes(p.id))result.push(p.id)});
    }
    S.lineup=result.slice(0,11);
    return S.lineup.map(id=>S.sq.find(p=>Number(p.id)===Number(id))).filter(Boolean);
  }
  function slotPosition(slot) {
    const positions=(FM && FM[S.tc && S.tc.f] || FM['4-3-3']).map(s=>s[2]);
    return positions[slot] || 'MC';
  }
  function assign(slot, id) {
    const players=lineupIds();
    const nextId=Number(id);
    const p=(S.sq||[]).find(x=>Number(x.id)===nextId);
    if (!p) return;
    if ((p.inj||0)>0 || (p.susp||0)>0) return alert('Ce joueur est indisponible (blessure ou suspension).');
    const oldId=S.lineup[slot];
    const other=S.lineup.indexOf(nextId);
    S.lineup[slot]=nextId;
    if(other>=0 && other!==slot) S.lineup[other]=oldId;
    else {
      const bench=(S.sq||[]).find(x=>Number(x.id)===Number(oldId));
      if(bench) { /* Old starter returns to the bench; it is no longer selected. */ }
    }
    S.lineup=S.lineup.slice(0,11);
    try{sv()}catch(e){};render();
  }
  function swap(a,b) {
    a=Number(a);b=Number(b);
    if(a<0||b<0||a>=11||b>=11||a===b)return;
    const ids=lineupIds();
    const temp=ids[a].id;
    S.lineup[a]=ids[b].id;S.lineup[b]=temp;
    try{sv()}catch(e){};render();
  }
  function dragStart(event, slot) { event.dataTransfer.setData('text/plain',String(slot)); }
  function dropSlot(event, slot) { event.preventDefault(); const from=Number(event.dataTransfer.getData('text/plain')); if(Number.isFinite(from))swap(from,slot); }
  function lineupView() {
    const ids=lineupIds();
    const form=FM[S.tc.f]||FM['4-3-3'];
    const pitch=[];
    form.forEach((pos,i)=>{
      const p=ids[i]||S.sq[0]; if(!p)return;
      const left=pos[0],top=pos[1];
      const opts=(S.sq||[]).map(q=>'<option value="'+q.id+'" '+(q.id===p.id?'selected':'')+((q.inj||0)>0||(q.susp||0)>0?' disabled':'')+'>'+txt(q.name)+' · '+txt(q.pos)+' · '+txt(q.ovr)+'</option>').join('');
      pitch.push('<div class="fm26-slot" draggable="true" ondragstart="FM26UX.dragStart(event,'+i+')" ondragover="event.preventDefault()" ondrop="FM26UX.dropSlot(event,'+i+')" style="left:'+left+'%;top:'+top+'%">'+playerFace(p)+'<button onclick="openP('+p.id+')">'+txt(p.name)+'</button><small>'+txt(pos[2])+' · '+txt(p.ovr)+'</small><select aria-label="Joueur pour le poste '+txt(pos[2])+'" onchange="FM26UX.assign('+i+',this.value)">'+opts+'</select></div>');
    });
    const starters=new Set(S.lineup);
    const bench=(S.sq||[]).filter(p=>!starters.has(p.id));
    const benchHtml=bench.map(p=>'<div class="fm26-player-row">'+playerFace(p)+'<div class="meta"><b>'+txt(p.name)+'</b><small>'+txt(p.pos)+' · '+p.ovr+' · Condition '+(p.cond||0)+'%</small></div><button class="chip" onclick="FM26UX.addToLineup('+p.id+')">Remplacer…</button></div>').join('');
    const avg=ids.length?Math.round(ids.reduce((a,p)=>a+(p.ovr||0),0)/ids.length):0;
    const liveReturn = M && !M.done ? '<div style="margin:8px 0"><button class="chip" onclick="FM26UX.resumeMatch()">← Retour au match en direct</button></div>' : '';
    return liveReturn + '<div class="page-intro"><div><p class="eyebrow">PRÉPARATION DU MATCH</p><h1>Composition d’équipe</h1><p>Choisis tes titulaires, permute-les par glisser-déposer ou avec les menus des postes.</p></div><div class="season-pill">Note moyenne : '+avg+'</div></div><div class="fm26-lineup-layout"><div class="pn"><div class="wr" style="margin-bottom:10px"><button class="chip '+(S.tc.f==='4-3-3'?'on':'')+'" onclick="FM26UX.formation(\'4-3-3\')">4-3-3</button><button class="chip '+(S.tc.f==='4-2-3-1'?'on':'')+'" onclick="FM26UX.formation(\'4-2-3-1\')">4-2-3-1</button><button class="chip '+(S.tc.f==='4-4-2'?'on':'')+'" onclick="FM26UX.formation(\'4-4-2\')">4-4-2</button></div><div class="fm26-lineup-pitch">'+pitch.join('')+'</div><small class="mu">Glisse un joueur sur un autre pour les intervertir. Le onze choisi influence la force de l’équipe en match.</small></div><div class="pn"><h3>Banc et disponibilité</h3>'+benchHtml+'<div class="fm26-event-banner"><b>À vérifier avant le coup d’envoi</b><p class="mu">Un joueur fatigué, blessé, suspendu ou en perte de moral peut diminuer le niveau collectif. Pense à faire tourner.</p><button class="chip" onclick="S.view=\'talk\';S.activeTalk=\'medical\';render()">Parler au staff médical</button></div></div></div>';
  }
  function addToLineup(id) {
    const current=lineupIds();
    const player=S.sq.find(p=>p.id===Number(id));
    if(!player || (player.inj||0)>0 || (player.susp||0)>0) return alert('Joueur indisponible.');
    const worstIndex=current.map((p,i)=>({i,p})).filter(x=>x.p.pos!=='GK').sort((a,b)=>(a.p.ovr||0)-(b.p.ovr||0))[0];
    if(!worstIndex)return;
    assign(worstIndex.i,player.id);
  }
  function formation(value) {
    if (!FM[value]) return;
    S.tc=S.tc||{};S.tc.f=value;
    const now=typeof originalXI==='function'?originalXI():(typeof xi==='function'?xi():[]);
    S.lineup=now.map(p=>p.id).slice(0,11);
    try{sv()}catch(e){};render();
  }
  function effectiveStrength() {
    const players=lineupIds();
    if(!players.length)return 0;
    const rating=players.reduce((a,p)=>a+(Number(p.ovr)||60),0)/players.length;
    const cond=players.reduce((a,p)=>a+cl(p.cond==null?90:p.cond,0,100),0)/players.length;
    const morale=players.reduce((a,p)=>a+cl(p.morale==null?70:p.morale,0,100),0)/players.length;
    const form=players.reduce((a,p)=>a+cl(p.form==null?7:p.form,4,10),0)/players.length;
    const injured=players.filter(p=>(p.inj||0)>0 || (p.susp||0)>0).length;
    return clamp((rating-70)*.13+(cond-80)*.10+(morale-70)*.08+(form-7)*1.4-injured*2, -12, 10);
  }
  function liveTactic(value) {
    if(!M || M.done)return;
    if(!['Cautious','Balanced','Positive','Attacking'].includes(value))return;
    S.tc=S.tc||{};S.tc.m=value;
    const mult={Cautious:.83,Balanced:1,Positive:1.09,Attacking:1.17}[value];
    M.m=[mult, value==='Cautious'?.86:value==='Attacking'?1.12:1];
    const uplift= value==='Attacking'?2.5:value==='Positive'?1.2:value==='Cautious'?-1.4:0;
    if(M.f.home===S.club)M.hp=cl(M.hp+uplift,35,100);else M.ap=cl(M.ap+uplift,35,100);
    if(M.min>=60 && value==='Attacking') M.cm='Changement de mentalité : notre équipe joue plus haut et prend davantage de risques.';
    else M.cm='Mentalité modifiée : '+value+'.';
    try{sv()}catch(e){};render();
  }
  function substitute(outId, inId) {
    if(!M || M.done)return alert('Les changements sont disponibles pendant un match en cours.');
    const out=Number(outId),incoming=Number(inId);
    const idx=(S.lineup||[]).indexOf(out);
    const pIn=S.sq.find(p=>Number(p.id)===incoming);
    const pOut=S.sq.find(p=>Number(p.id)===out);
    if(idx<0||!pIn||!pOut||incoming===out)return;
    if((pIn.inj||0)>0||(pIn.susp||0)>0)return alert('Ce joueur est indisponible.');
    S.lineup[idx]=incoming;
    pIn.cond=cl((pIn.cond==null?85:pIn.cond)+4,0,100);
    pOut.cond=cl((pOut.cond==null?85:pOut.cond)+2,0,100);
    M.cm='Remplacement : '+pOut.name+' sort, '+pIn.name+' entre.';
    const boost=cl(((pIn.ovr||60)-(pOut.ovr||60))*.14+(pIn.cond||70)*.018, -1.8, 2.2);
    if(M.f.home===S.club)M.hp=cl(M.hp+boost,35,100);else M.ap=cl(M.ap+boost,35,100);
    try{sv()}catch(e){};render();
  }
  function matchTools() {
    if(!M)return '';
    const tactics=['Cautious','Balanced','Positive','Attacking'];
    let html='<div class="pn" style="margin-top:12px"><h3>Gestion en direct</h3><div class="fm26-live-tools"><span class="mu">Mentalité</span>';
    tactics.forEach(t=>{html+='<button class="'+(S.tc.m===t?'active':'')+'" onclick="FM26UX.liveTactic(\''+t+'\')">'+({Cautious:'Prudente',Balanced:'Équilibrée',Positive:'Positive',Attacking:'Offensive'}[t])+'</button>';});
    html+='<button onclick="FM26UX.pauseForLineup()">Modifier la composition</button></div>';
    const starters=lineupIds();
    const selectedOut=starters.map(p=>'<option value="'+p.id+'">'+txt(p.name)+' ('+txt(p.pos)+')</option>').join('');
    const bench=(S.sq||[]).filter(p=>!S.lineup.includes(p.id)&&!(p.inj||0)&&!(p.susp||0));
    const selectedIn=bench.map(p=>'<option value="'+p.id+'">'+txt(p.name)+' ('+txt(p.pos)+', '+p.cond+'%)</option>').join('');
    html+='<div class="fm26-live-tools"><label>Sortie <select id="fm26-sub-out">'+selectedOut+'</select></label><label>Entrée <select id="fm26-sub-in">'+selectedIn+'</select></label><button onclick="FM26UX.subFromForm()">Effectuer le changement</button></div><small class="mu">Les changements modifient l’effectif utilisé pour simuler la suite du match.</small></div>';
    return html;
  }
  function subFromForm() {
    const out=document.getElementById('fm26-sub-out'),inc=document.getElementById('fm26-sub-in');
    if(!out||!inc||!inc.value)return;
    if(window.FM26A && typeof window.FM26A.sub==='function') { window.FM26A.sub(out.value,inc.value); return; }
    substitute(out.value,inc.value);
  }
  function pauseForLineup() {
    if(M && !M.done) { clearInterval(T); M.p=true; }
    S.view='lineup'; try{sv()}catch(e){}; render();
  }
  function resumeMatch() {
    if(!M || M.done) { S.view='pre'; render(); return; }
    S.view='match'; M.p=false; render(); clearInterval(T); T=setInterval(tick,M.sp||170);
  }
  function attachPlayerPhoto() {
    if(!S || S.view!=='player')return;
    const p=(S.sq||[]).find(x=>Number(x.id)===Number(S.pid))||(S.sq||[])[0];
    const box=document.querySelector('.ph .av');
    if(!p || !box)return;
    box.classList.add('fm26-photo-box');
    box.innerHTML='<img alt="Portrait illustré de '+txt(p.name)+'" src="'+portraitSvg((Number(p.id)||0)%6)+'">';
    if (!p.realPerson || !p.name) return;
    const key='fm26-photo:'+p.name.toLowerCase();
    let cached=null;
    try{cached=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
    if(cached && cached.url) { setPhoto(box,p,cached.url,cached.page||'https://en.wikipedia.org/wiki/'+encodeURIComponent(p.name)); return; }
    if(cached && cached.missing) return;
    const url='https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(p.name.replace(/ /g,'_'));
    fetch(url,{headers:{'Accept':'application/json'}}).then(r=>{if(!r.ok)throw new Error('missing');return r.json()}).then(data=>{
      if(!data || !data.thumbnail || !data.thumbnail.source)throw new Error('no thumbnail');
      const result={url:data.thumbnail.source,page:data.content_urls&&data.content_urls.desktop&&data.content_urls.desktop.page||('https://en.wikipedia.org/wiki/'+encodeURIComponent(p.name))};
      try{localStorage.setItem(key,JSON.stringify(result))}catch(e){}
      if(document.querySelector('.ph .av')===box)setPhoto(box,p,result.url,result.page);
    }).catch(()=>{try{localStorage.setItem(key,JSON.stringify({missing:true}))}catch(e){}});
  }
  function setPhoto(box,p,url,page) {
    box.innerHTML='<img alt="Photo de '+txt(p.name)+'" src="'+txt(url)+'" referrerpolicy="no-referrer"><small class="fm26-photo-source"><a href="'+txt(page)+'" target="_blank" rel="noopener">Source de la photo : Wikipédia</a></small>';
    box.classList.add('has-photo');
    const img=box.querySelector('img');
    img.onerror=()=>{box.innerHTML='<img alt="Portrait illustré de '+txt(p.name)+'" src="'+portraitSvg((Number(p.id)||0)%6)+'">';box.classList.remove('has-photo');};
  }
  function squadView() {
    let html='<div class="page-intro"><div><p class="eyebrow">EFFECTIF PROFESSIONNEL</p><h1>'+txt(S.club)+'</h1><p>Portraits de secours disponibles pour chaque joueur ; les photos réelles sont cherchées sur Wikipédia lorsqu’une identité réelle est connue.</p></div><button class="chip" onclick="S.view=\'lineup\';render()">Préparer la composition →</button></div><div class="pn"><table><thead><tr><th>Joueur</th><th>Poste</th><th>Âge</th><th>Niveau</th><th>Forme</th><th>Condition</th><th>Moral</th><th>Matchs</th><th>Buts</th></tr></thead><tbody>';
    (S.sq||[]).forEach(p=>{
      html+='<tr class="cp" onclick="openP('+p.id+')"><td><span class="fm26-face" data-photo-player="'+p.id+'" data-fm26-player="'+p.id+'"><img alt="Portrait de '+txt(p.name)+'" src="'+portraitSvg((Number(p.id)||0)%6)+'"></span> <b>'+txt(p.name)+'</b>'+(p.realPerson?' <small title="Nom réel importé">●</small>':'')+'</td><td>'+txt(p.pos)+'</td><td>'+txt(p.age)+'</td><td>'+txt(p.ovr)+'</td><td>'+Number(p.form||7).toFixed(1)+'</td><td>'+txt(p.cond==null?90:p.cond)+'%</td><td>'+txt(p.morale==null?70:p.morale)+'</td><td>'+txt(p.ap||0)+'</td><td>'+txt(p.g||0)+'</td></tr>';
    });
    html+='</tbody></table></div>';
    return html;
  }
  function managerView() {
    const p=Number(S.managerPortrait)||0;
    const games=(S.fx||[]).filter(f=>f.played&&(f.home===S.club||f.away===S.club));
    const wins=games.filter(f=>{const z=String(f.score||'0-0').split('-').map(Number);return f.home===S.club?z[0]>z[1]:z[1]>z[0]}).length;
    const draws=games.filter(f=>{const z=String(f.score||'0-0').split('-').map(Number);return z[0]===z[1]}).length;
    const titles=(S.history||[]).filter(h=>h.position===1).length;
    const mgrFace=S.managerPhoto ? '<span class="fm26-face big"><img alt="Portrait du manager" src="'+txt(S.managerPhoto)+'"></span>'+(S.managerPhotoPage?'<div class="fm26-photo-source"><a href="'+txt(S.managerPhotoPage)+'" target="_blank" rel="noopener">Source de la photo : Wikipédia</a></div>':'') : face(S.mg,p,'fm26-face big');
    return '<div class="page-intro"><div><p class="eyebrow">PROFIL DE CARRIÈRE</p><h1>'+txt(S.mg)+'</h1><p>Ton identité, ton bilan et les jalons à venir.</p></div></div><div class="gr" style="grid-template-columns:260px minmax(0,1fr)"><div class="pn" style="text-align:center">'+mgrFace+'<h2>'+txt(S.mg)+'</h2><p class="mu">'+txt(S.managerNation||'FRA')+' · '+txt(S.managerExperience||'Manager')+'</p><button class="chip" onclick="FM26UX.changePortrait()">Changer le portrait</button></div><div class="pn"><h3>Bilan de la carrière</h3><div class="gr g3"><div><div class="big">'+games.length+'</div><small class="mu">Matchs joués</small></div><div><div class="big">'+wins+'</div><small class="mu">Victoires</small></div><div><div class="big">'+draws+'</div><small class="mu">Nuls</small></div></div><p class="mu">Titres de championnat inscrits : '+titles+'</p><h3>Événements marquants</h3>'+(S.careerEvents||[]).slice(0,8).map(e=>'<div class="ar"><span>'+txt(e.title)+'</span><small class="mu">'+txt(e.text)+'</small></div>').join('')+'</div></div>';
  }
  function changePortrait() {
    const current=Number(S.managerPortrait)||0;
    S.managerPortrait=(current+1)%6;
    const photo=managerPhotoSources[S.managerPortrait];
    S.managerPhoto=photo&&photo.url||null;
    S.managerPhotoPage=photo&&photo.page||null;
    selectedPortrait=S.managerPortrait;selectedPortraitPhoto=S.managerPhoto;selectedPortraitPage=S.managerPhotoPage;
    try{sv()}catch(e){};render();
  }
  function event(title,text) {
    S.careerEvents=Array.isArray(S.careerEvents)?S.careerEvents:[];
    S.careerEvents.unshift({date:S.date,title:title,text:text});
    S.careerEvents=S.careerEvents.slice(0,40);
    if(typeof mail==='function')mail('Événement de carrière',title,text);
  }
  function attachCareerMilestone() {
    const topLeagues=['Premier League','La Liga','Serie A','Bundesliga','Ligue 1','Eredivisie','Primeira Liga','Süper Lig',"Women's Super League",'Liga F','Super League Greece','Scottish Premiership','Jupiler Pro League'];
    const leagueTitles=(S.history||[]).filter(h=>h.position===1&&topLeagues.includes(h.league)).length;
    const europeanTitles=Number(S.europeanTitles||0);
    if((leagueTitles>=3 || europeanTitles>=3) && !S.stadiumNamedForManager) {
      S.stadiumNamedForManager=true;
      S.clubObj=S.clubObj||{};
      const family=String(S.mg||'Manager').trim().split(/\s+/).slice(-1)[0]||'Manager';
      S.clubObj.stadium='Stade '+family;
      S.clubObj.capacity=Math.round((S.clubObj.capacity||25000)*1.15);
      S.board=cl((S.board||70)+8,0,100);S.fans=cl((S.fans||70)+10,0,100);
      const reason=europeanTitles>=3?'Après trois sacres européens, la direction et les supporters annoncent un stade agrandi baptisé « Stade '+family+' ».':'Après trois titres de championnat, la direction et les supporters annoncent un stade agrandi baptisé « Stade '+family+' ».';
      event('Un stade porte ton nom',reason);
    }
  }
  function recoveryAndMorale() {
    const starters=new Set((S.lineup||[]).map(Number));
    (S.sq||[]).forEach(p=>{
      if(!starters.has(Number(p.id))) p.cond=cl((p.cond==null?85:p.cond)+7,35,100);
      if(p.morale==null)p.morale=70;
      if(p.form==null)p.form=7;
    });
    const unavailable=(S.sq||[]).filter(p=>(p.inj||0)>0).length;
    if(unavailable>=3) event('Effectif amoindri', unavailable+' joueurs sont indisponibles. L’adjoint recommande de faire tourner et de protéger les joueurs valides.');
  }
  function applyCurrentParisFC() {
    if(!S || S.club!=='Paris FC' || !Array.isArray(S.sq))return;
    const roster=[
      ['Kevin Trapp','GK',83,36],['Obed Nkambadio','GK',72,23],
      ['Thibault De Smet','DL',72,28],['Otávio Ataíde da Silva','DC',77,24],['Nhoa Sangui','DL',70,20],
      ['Moustapha Mbow','DC',73,26],['Yoan Koré','DC',70,21],['Samir Chergui','DC',73,27],
      ['Hamari Traoré','DR',79,34],['Diego Coppola','DC',76,22],['Emmanuel Mbemba','DL',67,18],
      ['Vincent Marchetti','MC',70,29],['Adama Camara','DM',70,30],['Pierre Lees-Melou','DM',75,33],
      ['Maxime Lopez','MC',75,28],['Ilan Kebbal','AMC',78,28],['Rudy Matondo','MC',67,18],
      ['Patrick Zabi','DM',70,20],['Jean-Philippe Krasso','ST',76,29],['Omar Sissoko','ST',68,22],
      ['Jonathan Ikoné','AMR',73,28],['Moses Simon','AML',78,31],['Luca Koleosho','AML',75,22],
      ['Lassine Sinayoko','ST',75,26],['Pablo Pagis','AMR',72,23]
    ];
    while(S.sq.length < roster.length) {
      const index = S.sq.length;
      S.sq.push(mkP(roster[index][1], 68, index));
    }
    roster.forEach((r,i)=>{
      const p=S.sq[i];if(!p)return;
      p.name=r[0];p.pos=r[1];p.ovr=r[2];p.age=r[3];p.realPerson=true;p.photoQuery=r[0];p.club='Paris FC';
      p.nat=p.nat||'FRA';
    });
    S.realRosterSource='Effectif de l’équipe première recoupé avec la liste officielle du Paris FC 2026/27 ; notes de jeu estimées pour la simulation.';
    // Rebuild the starting eleven after mapping the real roster to the positional slots.
    if(typeof originalXI==='function') S.lineup=originalXI().map(p=>p.id).slice(0,11);
  }
  function maybeUpdatePhotosAfterRender() {
    if (!S) return;
    if (S.view==='player') attachPlayerPhoto();
    document.querySelectorAll('[data-fm26-player], [data-photo-player]').forEach(holder=>{
      const id=holder.dataset.fm26Player || holder.dataset.photoPlayer;
      const p=(S.sq||[]).find(player=>Number(player.id)===Number(id));
      if(!p || !p.realPerson || !p.name || holder.dataset.photoStatus)return;
      holder.dataset.photoStatus='loading';
      const key='fm26-photo:'+p.name.toLowerCase();
      let cached=null;
      try{cached=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
      const apply=(url,page)=>{
        const img=holder.querySelector('img');
        if(!img || !url)return;
        img.src=url;img.alt='Photo de '+p.name;
        img.onerror=()=>{img.onerror=null;img.src=portraitSvg((Number(p.id)||0)%6);holder.dataset.photoStatus='fallback';};
        holder.title='Photo de '+p.name+' — source Wikipédia';
        holder.dataset.photoStatus='loaded';holder.style.cursor='pointer';
        holder.onclick=(event)=>{event.stopPropagation();if(page)window.open(page,'_blank','noopener')};
      };
      if(cached&&cached.url){apply(cached.url,cached.page);return;}
      if(cached&&cached.missing){holder.dataset.photoStatus='fallback';return;}
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(p.name.replace(/ /g,'_')),{headers:{'Accept':'application/json'}})
      .then(r=>{if(!r.ok)throw new Error('no page');return r.json()})
      .then(data=>{
        if(!data||!data.thumbnail||!data.thumbnail.source)throw new Error('no thumbnail');
        const url=data.thumbnail.source;
        const page=data.content_urls&&data.content_urls.desktop&&data.content_urls.desktop.page||('https://en.wikipedia.org/wiki/'+encodeURIComponent(p.name));
        try{localStorage.setItem(key,JSON.stringify({url,page}))}catch(e){}
        apply(url,page);
      }).catch(()=>{holder.dataset.photoStatus='fallback';try{localStorage.setItem(key,JSON.stringify({missing:true}))}catch(e){}});
    });
    const header=document.querySelector('#hd');
    if(header && S.managerPortrait!=null && !header.querySelector('.fm26-header-face')) {
      const faceEl=document.createElement('span');
      faceEl.className='fm26-header-face';
      faceEl.innerHTML='<img alt="Portrait de '+txt(S.mg)+'" src="'+(S.managerPhoto?txt(S.managerPhoto):portraitSvg(S.managerPortrait))+'">';
      faceEl.style.cssText='display:inline-flex;width:34px;height:38px;border-radius:7px;overflow:hidden;flex:none;margin-right:4px';
      const first=header.firstElementChild;
      if(first)header.insertBefore(faceEl,first);
    }
  }
  function drawWithMovement() {
    if(originalDraw) originalDraw();
    if(!M || !document.getElementById('pt')) return;
    const pitch=document.getElementById('pt');
    const items=Array.from(pitch.querySelectorAll('.dt.hm,.dt.aw'));
    if(!M.worldLocs || M.worldLocs.length!==items.length) {
      M.worldLocs=items.map(e=>({x:Number(e.dataset.x)||50,y:Number(e.dataset.y)||50,phase:Math.random()*6.28}));
    }
    items.forEach((el,i)=>{
      const loc=M.worldLocs[i];
      const isHome=el.classList.contains('hm');
      const dir=isHome?1:-1;
      const baseX=Number(el.dataset.x)||50,baseY=Number(el.dataset.y)||50;
      const advanced=(M.bx-50)*0.23*dir;
      const ballY=(M.by-50)*0.13;
      const roleFactor=(i%11===10)?1.45:(i%11>=8?1.18:(i%11<=4?.65:1));
      let tx=baseX+advanced*roleFactor;
      let ty=baseY+ballY+(Math.sin(M.min*.12+loc.phase)*3.1);
      const ballDistance=Math.hypot(loc.x-M.bx,loc.y-M.by);
      if(ballDistance<24) { tx += (M.bx-loc.x)*.12; ty += (M.by-loc.y)*.09; }
      loc.x += (tx-loc.x)*.24;
      loc.y += (ty-loc.y)*.24;
      el.style.left=cl(loc.x,3,97)+'%';
      el.style.top=cl(loc.y,5,95)+'%';
      el.style.transition='left 160ms linear,top 160ms linear';
    });
  }

  const api = {
    openTalk:openTalk, reply:reply, sendFree:sendFree, readMail:readMail, answerMail:answerMail,
    assign:assign, swap:swap, dragStart:dragStart, dropSlot:dropSlot, addToLineup:addToLineup,
    formation:formation, liveTactic:liveTactic, substitute:substitute, subFromForm:subFromForm,
    pauseForLineup:pauseForLineup, resumeMatch:resumeMatch, changePortrait:changePortrait, get lowerLeagues(){return lowerLeagues;}, getLowerLeague:getLowerLeague,
    portraitSvg:portraitSvg, effectiveStrength:effectiveStrength
  };
  window.FM26UX=api;

  function install() {
    insertSetupWidgets();

    // Make the user-selected eleven the actual match engine eleven, not just a visual lineup.
    if (typeof xi === 'function') {
      originalXI = xi;
      xi = function() {
        if (!S || !Array.isArray(S.lineup) || S.lineup.length !== 11) return originalXI();
        const seen = new Set();
        const chosen = [];
        S.lineup.forEach(id => {
          const p = (S.sq || []).find(q => Number(q.id) === Number(id));
          if (p && !(p.inj > 0) && !(p.susp > 0) && !seen.has(p.id)) {
            seen.add(p.id); chosen.push(p);
          }
        });
        const pool = [];
        try { pool.push(...originalXI()); } catch (e) {}
        (S.sq || []).filter(p => !(p.inj > 0) && !(p.susp > 0)).sort((a,b) => (b.ovr||0)-(a.ovr||0)).forEach(p => pool.push(p));
        for (const p of pool) {
          if (chosen.length >= 11) break;
          if (p && !seen.has(p.id) && !(p.inj > 0) && !(p.susp > 0)) { seen.add(p.id); chosen.push(p); }
        }
        return chosen.length === 11 ? chosen : originalXI();
      };
    }

    if (typeof startCareer==='function') {
      originalStartCareer=startCareer;
      startCareer=function() {
        const fn=(document.getElementById('fn')||{}).value||'';
        const ln=(document.getElementById('ln')||{}).value||'';
        const nation=(document.getElementById('fm26-country')||{}).value||'France';
        const customName=((document.getElementById('fm26-club-name')||{}).value||'').trim();
        if(careerType==='create') {
          if(customName.length<3)return alert('Choisis un nom de club d’au moins 3 caractères.');
          const lower=getLowerLeague(nation);
          lower.clubs[lower.clubs.length-1]=customName;
          LG[lower.name]=lower.clubs;
          sel.lg=lower.name;sel.cl=customName;
        }
        const oldSetup=window.setup;
        originalStartCareer();
        if(!S)return;
        S.managerPortrait=selectedPortrait;
        S.managerPhoto=selectedPortraitPhoto;
        S.managerPhotoPage=selectedPortraitPage;
        S.managerNation=(document.getElementById('managerNation')||{}).value||'FRA';
        S.managerExperience=(document.getElementById('managerExperience')||{}).value||'debutant';
        S.managerLicense=(document.getElementById('managerLicense')||{}).value||'none';
        S.managerName=String(fn+' '+ln).trim();
        S.clubCreated=careerType==='create';
        if(S.clubCreated) {
          S.clubCountry=nation;
          S.customLeagueClubs=(LG[S.lg]||[]).slice();
          S.clubCode=((document.getElementById('fm26-club-short')||{}).value||customName.slice(0,3)).trim().toUpperCase().slice(0,5);
          S.clubObj=S.clubObj||{};
          S.clubObj.name=S.club;
          S.clubObj.shortName=S.clubCode;
          S.clubObj.stadium='Stade '+customName;
          S.clubObj.capacity=2500;
          S.bud=1.5;
          S.sq.forEach(p=>{p.ovr=clamp(p.ovr-13,48,70);p.val=clamp(p.val*.35,1,30);p.sal=clamp(p.sal,1000,18000);p.club=S.club;});
          mail('Président','Bienvenue dans ton nouveau club','Ton club débute au niveau régional. Construis progressivement ton effectif, tes installations et tes finances.');
        }
        S.sq.forEach(p=>{if(p.morale==null)p.morale=70;});
        S.lineup=typeof xi==='function'?xi().map(p=>p.id):S.sq.slice(0,11).map(p=>p.id);
        S.chatThreads={};S.careerEvents=[];
        seedConversations();
        addChat('president','them','Le conseil attend ton plan de développement. Ton premier objectif : définir une identité et poser des bases stables.');
        if(S.club==='Paris FC')applyCurrentParisFC();
        if(typeof sv==='function')sv();
        try {render()} catch(e) {}
      };
    }

    if (typeof cont==='function') {
      const originalContinue=cont;
      cont=function() {
        if(S && S.view==='lineup' && M && !M.done) { S.view='match'; render(); return; }
        originalContinue();
      };
    }

    if(window.FM26A && typeof window.FM26A.job==='function') {
      const originalJobAction=window.FM26A.job.bind(window.FM26A);
      window.FM26A.job=function(i) {
        const before=S&&S.club;
        originalJobAction(i);
        if(S&&S.club!==before) {
          S.clubCreated=false;
          S.customLeagueClubs=null;
          S.customTierIndex=null;
          try{sv()}catch(e){}
        }
      };
    }

    if (typeof startMatch==='function') {
      originalStartMatch=startMatch;
      startMatch=function() {
        if(!S.lineup || S.lineup.length!==11) S.lineup=typeof xi==='function'?xi().map(p=>p.id):[];
        originalStartMatch();
        if(M) {
          const delta=effectiveStrength();
          if(M.f.home===S.club)M.hp=cl(M.hp+delta,35,100);else M.ap=cl(M.ap+delta,35,100);
          M.managerSubstitutions=0;
        }
      };
    }
    if (typeof endMatch==='function') {
      originalEndMatch=endMatch;
      endMatch=function() {
        const beforeMorale=S ? S.mor||70 : 70;
        originalEndMatch();
        if(!S || !M)return;
        const f=M.f, clubHome=f.home===S.club, own=clubHome?M.h:M.a, opp=clubHome?M.a:M.h;
        // Record continental trophies once per career season, after the cup bracket has resolved.
        if(f && f.cupKey==='continental' && S.cupComps && S.cupComps.continental &&
           S.cupComps.continental.done && S.cupComps.continental.champion===S.club) {
          const seasonTag=String(S.season||1);
          S.europeanTitleSeasons=Array.isArray(S.europeanTitleSeasons)?S.europeanTitleSeasons:[];
          if(!S.europeanTitleSeasons.includes(seasonTag)) {
            S.europeanTitleSeasons.push(seasonTag);
            S.europeanTitles=(Number(S.europeanTitles)||0)+1;
            S.trophyHistory=Array.isArray(S.trophyHistory)?S.trophyHistory:[];
            S.trophyHistory.unshift({season:S.season,competition:S.cupComps.continental.name,club:S.club});
            event('Champion d’Europe',S.club+' remporte '+S.cupComps.continental.name+'. Total en carrière : '+S.europeanTitles+' titre(s) européen(s).');
            attachCareerMilestone();
          }
        }
        const outcome=own>opp?'Victoire':own<opp?'Défaite':'Match nul';
        if(own>opp) {
          S.winStreak=(S.winStreak||0)+1;
          if(S.winStreak===3)event('Série de trois victoires','Le groupe est en confiance et les supporters commencent à croire au projet.');
          if(S.winStreak===5)event('La presse s’enflamme','Cinq victoires de suite : la presse sportive te demande de raconter les secrets de la série.');
        } else S.winStreak=0;
        (S.sq||[]).forEach(p=>{
          if(p.morale==null)p.morale=70;
          if(S.lineup.includes(p.id))p.morale=clamp(p.morale+(own>opp?4:own<opp?-5:1)+(p.form>7.5?1:0),0,100);
          else p.morale=clamp(p.morale+(own>opp?2:own<opp?-2:0),0,100);
        });
        if(own<opp && beforeMorale<55) {
          event('Le vestiaire réclame une réaction','Le moral était déjà bas avant cette défaite. L’adjoint recommande une réunion et quelques changements dans le onze.');
        }
        recoveryAndMorale();
        if((S.sq||[]).filter(p=>(p.cond||100)<52 && S.lineup.includes(p.id)).length>=2) {
          const candidate=S.sq.find(p=>S.lineup.includes(p.id)&&(p.cond||100)<52 && !(p.inj||0));
          if(candidate && Math.random()<.13) {
            candidate.inj=1+Math.floor(Math.random()*2);
            event('Alerte médicale',candidate.name+' présente un risque de blessure lié à la fatigue. Il sera indisponible pour '+candidate.inj+' étape(s).');
          }
        }
        if(S.managerPortrait==null)S.managerPortrait=0;
        if(typeof sv==='function')sv();
      };
    }
    if (typeof newSeason==='function') {
      originalNewSeason=newSeason;
      newSeason=function() {
        const previousLeague=S&&S.lg;
        let previousPosition=0;
        if(S&&S.clubCreated&&typeof tbl==='function') {
          const priorTable=tbl();
          previousPosition=priorTable.findIndex(row=>row.c===S.club)+1;
        }
        originalNewSeason();
        if(!S)return;
        if(S.clubCreated && previousPosition===1) promoteCustomClub(previousLeague);
        applyCurrentParisFC();
        attachCareerMilestone();
        S.lineup=typeof xi==='function'?xi().map(p=>p.id):S.lineup;
        recoveryAndMorale();
        if(typeof sv==='function')sv();render();
      };
    }
    if (typeof draw==='function') {
      originalDraw=draw;
      draw=drawWithMovement;
    }

    if (typeof V !== 'undefined') {
      originalPlayerView=V.player;
      V.player=function() {
        const html=originalPlayerView?originalPlayerView():'';
        return html.replace('<div class="av"></div>','<div class="av" data-fm26-photo="profile"></div>') + '<div class="pn" style="margin-top:12px"><small class="mu">Les portraits réels sont chargés quand une source correspondant au joueur est disponible ; sinon, un portrait illustré est affiché.</small></div>';
      };
      originalSquadView=V.squad;
      V.squad=squadView;
      originalInboxView=V.inbox;
      V.inbox=inboxView;
      V.talk=chatView;
      V.lineup=lineupView;
      V.profile=managerView;
      if (!NAV.some(n=>n[0]==='talk')) NAV.push(['talk','Discussions','☏']);
      if (!NAV.some(n=>n[0]==='lineup')) NAV.splice(3,0,['lineup','Composition','♟']);
      if (!NAV.some(n=>n[0]==='profile')) NAV.push(['profile','Profil manager','☺']);
    }
    if (typeof render==='function') {
      originalRender=render;
      render=function() {
        setupSeed();
        if(S && S.view==='lineup' && M && !M.done && !M.p) { clearInterval(T); M.p=true; }
        originalRender();
        const titleMap={talk:'Discussions',lineup:'Composition d’équipe',profile:'Profil manager',staff:'Équipe technique',academy:'Centre de formation',data:'Centre de données',contracts:'Contrats',scouting:'Recrutement',club:'Club & installations',press:'Conférence de presse',history:'Historique',settings:'Options & diagnostic'};
        const titleNode=document.querySelector('#hd h2');
        if(titleNode && S && titleMap[S.view]) titleNode.textContent=titleMap[S.view];
        const header=document.querySelector('#hd');
        if(header && S && S.managerPortrait!=null) {
          const existing=header.querySelector('.fm26-header-face');
          if(!existing) {
            const faceEl=document.createElement('span');faceEl.className='fm26-header-face';
            faceEl.innerHTML='<img alt="Portrait de manager" src="'+(S.managerPhoto?txt(S.managerPhoto):portraitSvg(S.managerPortrait))+'">';
            faceEl.style.cssText='display:inline-flex;width:34px;height:38px;border-radius:7px;overflow:hidden;flex:none;margin-right:4px';
            if(header.firstElementChild)header.insertBefore(faceEl,header.firstElementChild);
          }
        }
        maybeUpdatePhotosAfterRender();
        if(S && S.view==='lineup' && M && !M.done) {
          const go=document.querySelector('#go');
          if(go){go.textContent='REPRENDRE LE MATCH';go.onclick=resumeMatch;}
        }
        if(S && ['staff','academy','scouting','contracts'].includes(S.view)) {
          document.querySelectorAll('#vw table tbody tr, #vw table tr').forEach((tr, index) => {
            if(index===0)return;
            const cell=tr.querySelector('td');
            if(!cell || cell.querySelector('.fm26-face'))return;
            const nameNode=cell.querySelector('b') || cell;
            const name=(nameNode.textContent||'').trim();
            if(!name || name.length>80)return;
            const avatar=document.createElement('span');
            avatar.className='fm26-face';
            avatar.innerHTML='<img alt="" src="'+portraitSvg(name.split('').reduce((a,ch)=>a+ch.charCodeAt(0),0)%6)+'">';
            avatar.style.marginRight='7px';
            cell.insertBefore(avatar,cell.firstChild);
          });
        }
        if(S && S.view==='match') {
          const vw=document.getElementById('vw');
          if(vw && !vw.querySelector('#fm26-live-controls')) {
            const box=document.createElement('div');box.id='fm26-live-controls';box.innerHTML=matchTools();vw.appendChild(box);
          } else if(vw && vw.querySelector('#fm26-live-controls')) vw.querySelector('#fm26-live-controls').innerHTML=matchTools();
        }
      };
    }
    // Add small photo/avatar styles after original app CSS has loaded.
    const extra=document.createElement('style');
    extra.textContent='.fm26-photo-box{position:relative;overflow:hidden;border-radius:12px!important;width:92px!important;height:102px!important;background:#211d3d!important}.fm26-photo-box img{width:100%;height:100%;object-fit:cover}.fm26-photo-box.has-photo{width:100px!important;height:112px!important}.fm26-photo-source{display:block;position:absolute;left:2px;right:2px;bottom:1px;background:#080816de;font-size:8px;text-align:center}.fm26-photo-source a{color:#e5d8ff}.fm26-hide{display:none!important}';
    document.head.appendChild(extra);
    if(typeof S!=='undefined' && S){setupSeed();if(S.club==='Paris FC'){applyCurrentParisFC();try{sv()}catch(e){}}try{render()}catch(e){}}
    insertSetupWidgets();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();