/* FM26 — interface de référence reliée aux écrans et données de carrière existants. */
(function () {
  'use strict';

  const css = [
    'body.fm26-ref-active{overflow:hidden}',
    '#app:not(.hid){position:fixed!important;left:50%!important;top:50%!important;width:2000px!important;height:924px!important;min-height:924px!important;grid-template-columns:208px 1792px!important;transform-origin:center center;z-index:2;background:radial-gradient(ellipse 900px 500px at 70% 30%,#34353b 0%,transparent 70%),radial-gradient(ellipse 700px 400px at 30% 80%,#2a2b31 0%,transparent 70%),radial-gradient(ellipse at 50% 50%,#202126 0%,#141519 100%);}',
    '#side{position:relative!important;width:208px!important;height:924px!important;overflow:hidden!important;display:block!important;padding:0!important;background:#1c1f2e!important;border-right:0!important;z-index:32}',
    '#main{position:relative!important;width:1792px!important;height:924px!important;min-width:1792px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:transparent!important}',
    '#hd{position:relative!important;flex:0 0 91px!important;width:1792px!important;height:91px!important;min-height:91px!important;display:block!important;padding:0!important;margin:0!important;background:#202126!important;border:0!important;overflow:hidden!important;z-index:3}',
    '#vw{position:relative!important;flex:0 0 833px!important;width:1792px!important;height:833px!important;max-height:833px!important;overflow:hidden!important;padding:0!important;margin:0!important;background:transparent!important}',
    '#vw>.fm26-ref-home,#vw>.fm26-ref-inbox,#vw>.fm26-ref-pre{position:relative;width:1792px;height:833px;overflow:hidden;color:#f4f4f6;font-family:Barlow Condensed,Arial,sans-serif}',
    '.fm26-ref-panel{position:absolute;box-sizing:border-box;background:rgba(65,66,72,.72);border:1px solid #55565c;overflow:hidden}',
    '.fm26-ref-panel-head{height:57px;background:#626369;color:#fff;padding:11px 10px;font-size:27px;line-height:1.25;font-weight:700;box-sizing:border-box}',
    '.fm26-ref-row{position:relative;height:66px;display:flex;align-items:center;gap:15px;background:rgba(44,45,51,.95);border-bottom:1px solid #3b3c43;padding:5px 14px;box-sizing:border-box;min-width:0}',
    '.fm26-ref-row .r-icon{display:grid;place-items:center;width:38px;flex:0 0 38px}',
    '.fm26-ref-row .r-icon svg{width:28px;height:28px;display:block}',
    '.fm26-ref-row .r-copy{min-width:0;flex:1}',
    '.fm26-ref-row .r-name{font-size:25px;line-height:1.05;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fm26-ref-row .r-label{font-size:19px;color:#d0d0d6;line-height:1.2}',
    '.fm26-ref-row .r-value{font-size:28px;font-weight:700;min-width:42px;text-align:right}',
    '.fm26-ref-label{font-size:22px;font-weight:600;color:#c2c2c9;letter-spacing:.015em}',
    '.fm26-ref-form{display:flex;gap:14px;align-items:center;flex-wrap:nowrap}',
    '.fm26-ref-formbox{width:52px;height:46px;display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:700;background:#696a70;color:#fff;box-sizing:border-box}',
    '.fm26-ref-formbox.win{background:#5d6d60}.fm26-ref-formbox.draw{background:#898a90}.fm26-ref-formbox.loss{background:#734c58}',
    '.fm26-ref-formbox:first-child{outline:3px solid #aaa;outline-offset:3px}',
    '.fm26-ref-matchrow{height:66px;display:grid;grid-template-columns:115px 52px minmax(0,1fr) 65px 78px;gap:10px;align-items:center;padding:5px 14px;background:rgba(44,45,51,.94);border-bottom:1px solid #3b3c43;box-sizing:border-box;font-size:24px}',
    '.fm26-ref-matchrow .match-date{font-size:22px;white-space:nowrap}.fm26-ref-matchrow .match-name{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm26-ref-matchrow .match-comp{font-size:15px;color:#c6c6cb}.fm26-ref-matchrow .match-score{text-align:right;font-weight:700;font-size:24px}',
    '.fm26-ref-crest-caption{font-size:25px;text-align:center;font-weight:700;margin-top:12px;max-width:220px;overflow-wrap:anywhere}',
    '.fm26-ref-stars{font-size:34px;letter-spacing:-2px;color:#96979c;line-height:1.1}',
    '.fm26-ref-smallflag{display:inline-block;width:35px;height:23px;background:linear-gradient(90deg,#1f4f9b 33%,#fff 33% 66%,#d5223c 66%);border:1px solid #aaa}',
    '.fm26-ref-toolbar{position:absolute;top:14px;height:77px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;background:#2b2c32;color:white;cursor:pointer}',
    '.fm26-ref-dot{position:absolute;top:68px;width:11px;height:11px;background:#888990}.fm26-ref-dot.active{top:67px;width:14px;height:14px;background:#fff}',
    '.fm26-ref-info svg,.fm26-ref-menu-button svg{display:block}',
    '.fm26-ref-date{left:1259px;width:229px;flex-direction:column;font-size:22px;line-height:1.05;text-align:center}',
    '.fm26-ref-date b{font-size:24px;line-height:1.25}',
    '.fm26-ref-continue{left:1496px;width:296px;background:#a97af8;font-size:31px;font-weight:700;letter-spacing:.025em;text-align:center;line-height:1.05;border:0;color:#fff;font-family:inherit}',
    '.fm26-ref-continue:active{filter:brightness(.86)}',
    '.fm26-ref-info{left:1032px;width:76px}.fm26-ref-menu-button{left:1126px;width:125px}',
    '.fm26-ref-back{position:absolute;left:0;top:0;width:208px;height:105px;display:flex;align-items:center;justify-content:center;padding-right:10px;box-sizing:border-box;cursor:pointer;border:0;background:transparent}',
    '.fm26-ref-back:after{content:"";position:absolute;left:26px;right:25px;bottom:0;height:2px;background:#2b2f44}',
    '.fm26-ref-railbtn{position:absolute;left:109px;width:99px;height:74px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;cursor:pointer;border:0;background:transparent;color:#fff;padding:0}',
    '.fm26-ref-railbtn:after{content:"";position:absolute;left:9px;right:13px;bottom:-24px;height:2px;background:#2b2f44}',
    '.fm26-ref-railbtn svg{width:53px;height:53px;display:block;stroke:#fff;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.fm26-ref-railbtn.active{background:linear-gradient(90deg,#ff3d86,#d42fe6)}',
    '.fm26-ref-clubbox{width:80px;height:62px;background:#4b8fd6;border:2px solid #6fb0f0;border-radius:6px;display:flex;align-items:center;justify-content:center}',
    '#fm26-ref-menu{position:absolute;left:208px;top:0;width:367px;height:924px;display:none;z-index:30;box-sizing:border-box;background:#1f2232;border-left:6px solid #a24bf2;border-right:2px solid #a24bf2;color:#fff;font-family:Barlow Condensed,Arial,sans-serif;overflow:hidden}',
    '#fm26-ref-menu.show{display:block}',
    '.fm26-ref-menu-head{position:absolute;left:24px;top:20px;display:flex;align-items:center;gap:15px;width:320px}',
    '.fm26-ref-menu-head .club-name{font-size:25px;font-weight:800;line-height:1.1}.fm26-ref-menu-head small{display:block;font-size:22px;font-weight:500;line-height:1.2;color:#e3e0ed}',
    '.fm26-ref-menu-section{position:absolute;left:5px;top:136px;font-size:32px;font-weight:800}',
    '.fm26-ref-menu-item{position:absolute;left:4px;width:349px;height:82px;display:flex;align-items:center;gap:12px;padding:0 24px 0 28px;box-sizing:border-box;border-top:2px solid #2c3046;color:#fff;font-size:27px;font-weight:700;cursor:pointer;background:transparent;text-align:left}',
    '.fm26-ref-menu-item:last-child{border-bottom:2px solid #2c3046}.fm26-ref-menu-item:hover{background:#ffffff0e}',
    '.fm26-ref-menu-item svg{width:29px;height:29px;flex:0 0 29px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.fm26-ref-inbox-top{position:absolute;left:37px;top:17px;height:70px;display:flex;gap:35px;align-items:center}',
    '.fm26-ref-inbox-top strong{font-size:32px}.fm26-ref-inbox-top small{display:block;font-size:26px;color:#e0e0e5}',
    '.fm26-ref-report-intro{font-size:29px;line-height:1.35;white-space:normal}',
    '.fm26-ref-player-card{position:absolute;left:12px;top:216px;width:210px;height:284px;background:linear-gradient(#1c1b3a,#2b1f55);border:3px solid #6c2ff0;border-radius:4px;overflow:hidden;box-sizing:border-box}',
    '.fm26-ref-player-card .shirt-art{position:absolute;left:45px;top:14px;width:120px;height:142px}',
    '.fm26-ref-player-card .player-number{position:absolute;left:8px;top:2px;font-size:35px;font-weight:800}',
    '.fm26-ref-player-card .player-name{position:absolute;left:0;top:162px;width:100%;height:44px;background:#6c2ff0;text-align:center;padding-top:4px;box-sizing:border-box;font-size:26px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fm26-ref-player-card .player-pos{position:absolute;left:0;top:208px;width:100%;text-align:center;font-size:22px;padding:3px 0;border-bottom:1px solid #444}',
    '.fm26-ref-player-card .player-club{position:absolute;left:0;top:245px;width:100%;text-align:center;font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.fm26-ref-prop-list{position:absolute;left:235px;top:224px;font-size:27px;line-height:1.65;max-width:420px}',
    '.fm26-ref-prop-stars{position:absolute;left:488px;top:228px;font-size:32px;line-height:1.8;letter-spacing:-2px}',
    '.fm26-ref-assignment{position:absolute;left:1167px;top:21px;width:541px;height:723px;background:rgba(38,40,56,.78);text-align:center;box-sizing:border-box;padding-top:37px}',
    '.fm26-ref-assignment .assignment-label{font-size:27px;color:#c6c6d0}.fm26-ref-assignment .assignment-value{font-size:28px;margin-top:22px}.fm26-ref-progress{width:330px;height:26px;background:#3a3d52;margin:26px auto 0}.fm26-ref-progress i{display:block;height:100%;background:#5bc95b}',
    '.fm26-ref-bottom-btn{position:absolute;top:758px;height:63px;display:flex;align-items:center;justify-content:center;gap:24px;font-size:28px;font-family:inherit;box-sizing:border-box;border:0;cursor:pointer;color:#fff}',
    '.fm26-ref-bottom-btn.primary{background:#6b22f0}.fm26-ref-bottom-btn.secondary{background:#3e4152}',
    '.fm26-ref-pitch{position:absolute;left:355px;top:8px;width:470px;height:345px;background:#5a5b60;clip-path:polygon(11% 0,89% 0,100% 100%,0 100%)}',
    '.fm26-ref-pitch:before{content:"";position:absolute;left:27%;right:27%;top:0;height:80px;border:2px solid #888}.fm26-ref-pitch:after{content:"";position:absolute;left:4%;right:4%;top:65%;border-top:2px solid #888}',
    '.fm26-ref-pitch-line{position:absolute;left:50%;top:65%;width:136px;height:136px;border:2px solid #888;border-radius:50%;transform:translate(-50%,-50%)}',
    '.fm26-ref-position{position:absolute;transform:translate(-50%,-50%);background:#3a3b40;border:1px solid #777;font-size:16px;padding:2px 6px;color:#fff}',
    '.fm26-ref-small-panel-title{font-size:32px;font-weight:800;text-align:center}',
    '.fm26-ref-pre .fm26-ref-form{gap:6px}.fm26-ref-pre .fm26-ref-formbox{width:27px;height:27px;font-size:18px}',
    '.fm26-ref-pre-quote{position:absolute;left:917px;top:619px;width:855px;height:188px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:28px;line-height:1.35;padding:0 15px;box-sizing:border-box}',
    '@media(max-width:820px){#app:not(.hid){grid-template-columns:208px 1792px!important;width:2000px!important;height:924px!important}#side{width:208px!important;display:block!important;padding:0!important}#main{width:1792px!important;min-width:1792px!important}#hd{display:block!important;height:91px!important;min-height:91px!important}#vw{padding:0!important;height:833px!important;max-height:833px!important}#hd small{display:block!important}}'
  ].join('\n');
  const style = document.createElement('style');
  style.id = 'fm26-reference-ui-style';
  style.textContent = css;
  document.head.appendChild(style);

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svgIcon = {
    mail: '<svg viewBox="0 0 58 40"><rect x="2" y="2" width="54" height="36"/><path d="M2 2 29 24 56 2M2 38 22 18M56 38 36 18"/></svg>',
    home: '<svg viewBox="0 0 58 52"><path d="M29 2 56 26H48V50H36V34H22V50H10V26H2Z" fill="#fff" stroke="none"/></svg>',
    club: '<svg viewBox="0 0 50 50"><path d="M8 4H42V26C42 38 33 45 25 47 17 45 8 38 8 26Z" fill="#fff" stroke="#fff"/><path d="M25 4V46" stroke="#1c2c5b" stroke-width="6"/></svg>',
    coach: '<svg viewBox="0 0 58 54"><circle cx="29" cy="14" r="12" fill="#fff" stroke="none"/><path d="M2 54C2 36 12 29 22 29L29 46 36 29C46 29 56 36 56 54Z" fill="#fff" stroke="none"/></svg>',
    world: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="25"/><path d="M3 28H53M28 3C16 13 16 43 28 53M28 3C40 13 40 43 28 53"/></svg>',
    search: '<svg viewBox="0 0 56 56"><circle cx="23" cy="23" r="17"/><path d="m36 36 16 16"/></svg>',
    opt: '<svg viewBox="0 0 58 58"><path d="M29 3 34 10 43 9 44 18 52 23 47 31 50 40 41 43 36 51 28 46 20 50 16 42 7 40 10 31 4 24 12 18 13 10 22 11Z"/><circle cx="29" cy="29" r="8"/></svg>',
    info: '<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="27" fill="#1fb4ef" stroke="none"/><circle cx="28" cy="15" r="4.5" fill="#fff" stroke="none"/><rect x="23.5" y="23" width="9" height="22" rx="4" fill="#fff" stroke="none"/></svg>',
    menu: '<svg width="44" height="40" viewBox="0 0 44 40"><rect y="0" width="44" height="10" rx="5" fill="#fff" stroke="none"/><rect y="15" width="44" height="10" rx="5" fill="#fff" stroke="none"/><rect y="30" width="44" height="10" rx="5" fill="#fff" stroke="none"/></svg>',
    back: '<svg width="56" height="78" viewBox="0 0 56 78"><path d="M44 8 12 39 44 70" stroke="#000" stroke-opacity=".5" stroke-width="16" fill="none" transform="translate(4 4)" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 8 12 39 44 70" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ball: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#fff" stroke="none"/><path d="m15 8 6 4-2 7h-8l-2-7z" fill="#303137" stroke="none"/></svg>',
    star: '<svg viewBox="0 0 34 34"><path d="m17 2 4 11h11l-9 7 3 12-9-7-9 7 3-12-9-7h11z" fill="#a4a4aa" stroke="none"/></svg>',
    condition: '<svg viewBox="0 0 34 34"><path d="M3 28V5M3 28H31M7 23l7-7 5 3 8-11" fill="none" stroke="#fff" stroke-width="3"/></svg>',
    assist: '<svg viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" fill="none" stroke="#ddd" stroke-width="3"/><path d="M17 7v18M8 17h18" stroke="#ddd" stroke-width="3"/></svg>',
    team: '<svg viewBox="0 0 34 34"><circle cx="9" cy="10" r="4" fill="#fff" stroke="none"/><circle cx="25" cy="10" r="4" fill="#fff" stroke="none"/><path d="M2 29v-6a7 7 0 0 1 14 0v6M18 29v-6a7 7 0 0 1 14 0v6" fill="#fff" stroke="none"/></svg>'
  };
  const menus = {
    club: { title:'Centre d’avant-match', section:'', items:[['squad','Équipe première','team'],['squad','Équipe réserve','team'],['tactics','Tactique','tactics'],['mgr','Rapport équipe','doc'],['squad','Centre de dév.','dev'],['squad','Centre médical','med'],['sched','Calendrier','cal'],['fin','Finances','fin'],['mgr','Staff','staff']]},
    coach: { title:'Menu du manager', section:'ENTRAÎNEUR', items:[['mgr','Options de l’entraîneur','opts'],['mgr','Confiance','team'],['mgr','Profil entraîneur','coach'],['sched','Historiq. entraîneur','cal'],['comp','Vitrine des trophées','trophy'],['sched','Vacances','clock'],['inbox','Requête dirig.','doc'],['mgr','État de la partie','save']]},
    world: { title:'Menu du monde', section:'COMPÉTITIONS', items:[['comp','Division du club','table'],['comp','Continental','world'],['comp','International','world'],['comp','France','world'],['comp','Angleterre','world'],['comp','Espagne','world'],['comp','Allemagne','world'],['comp','Stand. de la ligue','table']]},
    search: { title:'Recherche', section:'RECRUTEMENT', items:[['squad','Résultats recrut.','search'],['squad','Rech. de joueur','search'],['squad','Sélection','doc'],['mgr','Recherche de staff','team'],['mgr','Emplois','doc'],['fin','Transferts','swap'],['comp','Trouver Club','club'],['mgr','Agence d’obs.','search']]},
    opt: { title:'Menu d’accueil', section:'OPTIONS', items:[['reset','Quitter partie','quit'],['comp','Panthéon du foot','star'],['comp','Récompenses','trophy'],['mgr','Paramètres','gear'],['mgr','Manuel','doc'],['squad','Album','doc'],['save','Sauvegarder partie','save']]}
  };
  const smallIcons = {
    team:'<svg viewBox="0 0 26 26"><circle cx="6" cy="6" r="3"/><circle cx="13" cy="5" r="3"/><circle cx="20" cy="6" r="3"/><path d="M3 12h6v12H3zM10 11h6v13h-6zM17 12h6v12h-6z"/></svg>',
    tactics:'<svg viewBox="0 0 26 26"><path d="m3 20 6-6M3 14l6 6M14 6h8v8M22 6l-9 9"/><circle cx="19" cy="20" r="3"/></svg>',
    doc:'<svg viewBox="0 0 26 26"><path d="M5 2h11l5 5v17H5zM16 2v6h5M8 13h10M8 17h10M8 21h6"/></svg>',
    dev:'<svg viewBox="0 0 26 26"><path d="m13 2 8 10h-5v7h-6v-7H5zM3 23h20"/></svg>',
    med:'<svg viewBox="0 0 26 26"><rect x="2" y="2" width="22" height="22" rx="3"/><path d="M13 7v12M7 13h12"/></svg>',
    cal:'<svg viewBox="0 0 26 26"><rect x="2" y="4" width="22" height="20" rx="2"/><path d="M7 2v5M19 2v5M2 10h22M6 14h4M14 14h5M6 19h4"/></svg>',
    fin:'<svg viewBox="0 0 26 26"><path d="M3 3v20h21M6 18l6-7 4 4 6-9"/></svg>',
    staff:'<svg viewBox="0 0 26 26"><circle cx="13" cy="7" r="4"/><path d="M3 24v-3a10 10 0 0 1 20 0v3z"/></svg>',
    opts:'<svg viewBox="0 0 26 26"><rect x="2" y="3" width="22" height="20" rx="2"/><path d="M8 6v14M18 6v14M5 10h6M15 14h6"/></svg>',
    trophy:'<svg viewBox="0 0 26 26"><path d="M6 3h14v6a7 7 0 0 1-14 0zM6 5H2v3a5 5 0 0 0 5 5M20 5h4v3a5 5 0 0 1-5 5M13 16v5M8 24h10M10 21h6"/></svg>',
    clock:'<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="10"/><path d="M13 6v7l5 3"/></svg>',
    table:'<svg viewBox="0 0 26 26"><rect x="2" y="3" width="22" height="20" rx="1"/><path d="M2 9h22M2 15h22M9 3v20M16 3v20"/></svg>',
    world:'<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="11"/><path d="M2 13h22M13 2c-6 5-6 17 0 22M13 2c6 5 6 17 0 22"/></svg>',
    search:'<svg viewBox="0 0 26 26"><circle cx="10" cy="10" r="7"/><path d="m15 15 8 8"/></svg>',
    swap:'<svg viewBox="0 0 26 26"><path d="M3 8h18l-4-4M23 18H5l4 4"/></svg>',
    club:'<svg viewBox="0 0 26 26"><path d="M3 3h20v10c0 6-6 9-10 10-4-1-10-4-10-10z"/></svg>',
    save:'<svg viewBox="0 0 26 26"><path d="M13 2v15M7 11l6 6 6-6M3 22h20"/></svg>',
    quit:'<svg viewBox="0 0 26 26"><path d="M14 3H3v20h11M10 13h14M18 7l6 6-6 6"/></svg>',
    gear:'<svg viewBox="0 0 26 26"><path d="M13 2v4M13 20v4M2 13h4M20 13h4M5 5l3 3M18 18l3 3M21 5l-3 3M8 18l-3 3"/><circle cx="13" cy="13" r="7"/></svg>',
    star:'<svg viewBox="0 0 26 26"><path d="m13 2 3 8h8l-6 5 2 9-7-5-7 5 2-9-6-5h8z"/></svg>',
    coach:'<svg viewBox="0 0 26 26"><circle cx="13" cy="7" r="4"/><path d="M3 24a10 10 0 0 1 20 0"/></svg>'
  };
  let openMenu = '';
  let lastMenu = 'coach';
  let baseRender = null;

  function ensureMenu() {
    let menu = $('fm26-ref-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'fm26-ref-menu';
      $('app').appendChild(menu);
    }
    return menu;
  }
  function currentMatch() {
    if (typeof nxt === 'function') return nxt();
    return (S.fx || []).find(f => !f.played && (f.home === S.club || f.away === S.club));
  }
  function opponent(f) {
    if (!f) return '';
    return f.home === S.club ? f.away : f.home;
  }
  function routeForRail(k) {
    if (k === 'home' || k === 'inbox') {
      openMenu = '';
      S.view = k;
      render();
      return;
    }
    if (k === 'club') {
      S.view = 'pre';
      if (openMenu === 'club') openMenu = '';
      else { openMenu = 'club'; lastMenu = 'club'; }
      render();
      return;
    }
    if (openMenu === k) openMenu = '';
    else { openMenu = k; lastMenu = k; }
    renderShell();
  }
  function menuAction(v, label) {
    if (v === 'save') {
      if (typeof sv === 'function') sv();
      if (typeof toast === 'function') toast('Partie sauvegardée');
      openMenu = '';
      renderShell();
      return;
    }
    if (v === 'reset') {
      openMenu = '';
      if (window.confirm('Quitter cette carrière et revenir à l’écran de départ ?')) {
        try { localStorage.removeItem('fm26_v2'); } catch (e) {}
        $('setup').classList.remove('hid');
        $('app').classList.add('hid');
        document.body.classList.remove('fm26-ref-active');
        S = null;
      }
      renderShell();
      return;
    }
    openMenu = '';
    S.view = v;
    if (v === 'inbox') S.mi = Math.max(0, Number(S.mi) || 0);
    render();
  }
  function renderMenu() {
    const menu = ensureMenu();
    if (!openMenu || !menus[openMenu]) {
      menu.classList.remove('show');
      menu.innerHTML = '';
      return;
    }
    const m = menus[openMenu];
    const isSection = !!m.section;
    const y0 = isSection ? 190 : 125;
    menu.innerHTML = '<div class="fm26-ref-menu-head">' + crest(S.club, 50) + '<div><div class="club-name">' + esc(S.club) + '</div><small>' + esc(m.title) + '</small></div></div>' +
      (isSection ? '<div class="fm26-ref-menu-section">' + esc(m.section) + '</div>' : '') +
      m.items.map((item, i) => '<button class="fm26-ref-menu-item" type="button" data-view="' + esc(item[0]) + '" data-label="' + esc(item[1]) + '" style="top:' + (y0 + i * 82) + 'px"><span>' + (smallIcons[item[2]] || smallIcons.doc) + '</span><span>' + esc(item[1]) + '</span></button>').join('');
    menu.classList.add('show');
    menu.querySelectorAll('.fm26-ref-menu-item').forEach(btn => {
      btn.addEventListener('click', () => menuAction(btn.dataset.view, btn.dataset.label));
    });
    menu.onclick = e => {
      if (e.target === menu) { openMenu = ''; renderShell(); }
    };
  }
  function renderRail() {
    const active = openMenu || (S.view === 'pre' ? 'club' : S.view === 'home' ? 'home' : S.view === 'inbox' ? 'inbox' : S.view === 'squad' || S.view === 'player' ? 'search' : S.view === 'tactics' || S.view === 'mgr' ? 'coach' : S.view === 'comp' || S.view === 'sched' ? 'world' : 'opt');
    const items = [
      ['inbox', svgIcon.mail, 155],
      ['home', svgIcon.home, 255],
      ['club', '<span class="fm26-ref-clubbox">' + crest(S.club, 46) + '</span>', 353],
      ['coach', svgIcon.coach, 453],
      ['world', svgIcon.world, 550],
      ['search', svgIcon.search, 648],
      ['opt', svgIcon.opt, 746]
    ];
    $('side').innerHTML = '<button type="button" class="fm26-ref-back" data-fm26-back aria-label="Fermer le menu">' + svgIcon.back + '</button>' +
      items.map(it => '<button type="button" class="fm26-ref-railbtn' + (active === it[0] ? ' active' : '') + '" style="top:' + it[2] + 'px" data-fm26rail="' + it[0] + '" title="' + it[0] + '" aria-label="' + it[0] + '">' + it[1] + '</button>').join('');
    $('side').onclick = e => {
      const back = e.target.closest('[data-fm26-back]');
      if (back) { openMenu = ''; renderShell(); return; }
      const btn = e.target.closest('[data-fm26rail]');
      if (btn) routeForRail(btn.dataset.fm26rail);
    };
  }
  function renderTopBar() {
    const d = new Date(String(S.date || '2025-08-01') + 'T12:00:00');
    const weekdays = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'];
    const months = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛT','SEP','OCT','NOV','DÉC'];
    const isPre = S.view === 'pre';
    const isInbox = S.view === 'inbox';
    const next = currentMatch();
    const opp = opponent(next) || 'PROCHAIN MATCH';
    const short = opp.toUpperCase().replace(/[^A-ZÀ-Ÿ ]/g, '').trim().slice(0, 3) || 'MAT';
    const dots = isInbox ? '' : '<i id="fm26-dot0" class="fm26-ref-dot' + (!isPre ? ' active' : '') + '" style="left:927px"></i><i class="fm26-ref-dot' + (isPre ? ' active' : '') + '" style="left:962px"></i><i class="fm26-ref-dot" style="left:995px"></i>';
    const infoLeft = isInbox ? 1164 : 1032;
    const info = '<button type="button" id="fm26-ref-info" class="fm26-ref-toolbar fm26-ref-info" style="left:' + infoLeft + 'px" aria-label="Informations">' + svgIcon.info + '</button>';
    const hamburger = isInbox ? '' : '<button type="button" id="fm26-ref-menu-btn" class="fm26-ref-toolbar fm26-ref-menu-button" aria-label="Ouvrir le menu">' + svgIcon.menu + '</button>';
    const dateText = isPre
      ? '<span style="font-size:20px;line-height:1.5">MATCH SUIVANT</span><b>' + esc(short) + ' (' + (next && next.home === S.club ? 'DOM.' : 'EXT.') + ')</b>'
      : weekdays[d.getDay()] + '<b>' + d.getDate() + ' ' + months[d.getMonth()] + '</b>' + d.getFullYear();
    const continueText = isPre ? 'ALLER AU<br>MATCH' : (S.view === 'match' ? 'MATCH EN COURS' : 'CONTINUER');
    $('hd').innerHTML = dots +
      '<button type="button" class="fm26-ref-toolbar" id="fm26-ref-info-spacer" style="left:0;width:0;display:none"></button>' +
      info + hamburger +
      '<div class="fm26-ref-toolbar fm26-ref-date" id="fm26-ref-date">' + dateText + '</div>' +
      '<button type="button" id="go" class="fm26-ref-toolbar fm26-ref-continue">' + continueText + '</button>';
    $('go').onclick = function () { cont(); };
    $('fm26-ref-info').onclick = function () {
      if (typeof toast === 'function') toast(S.club + ' · ' + S.lg + ' · Saison ' + S.season + ' · ' + S.mg);
    };
    const mb = $('fm26-ref-menu-btn');
    if (mb) mb.onclick = function () {
      if (openMenu) openMenu = '';
      else { openMenu = lastMenu || (S.view === 'pre' ? 'club' : 'coach'); if (!menus[openMenu]) openMenu = 'coach'; }
      renderShell();
    };
  }
  function renderShell() {
    if (!S || $('app').classList.contains('hid')) return;
    renderRail();
    renderTopBar();
    renderMenu();
    fitStage();
  }
  function fitStage() {
    const app = $('app');
    if (!app || app.classList.contains('hid')) { document.body.classList.remove('fm26-ref-active'); return; }
    document.body.classList.add('fm26-ref-active');
    const scale = Math.min(window.innerWidth / 2000, window.innerHeight / 924);
    app.style.transform = 'translate(-50%,-50%) scale(' + Math.max(0.08, scale) + ')';
  }
  function matchRows(list) {
    if (!list.length) return '<div class="fm26-ref-matchrow"><span class="match-date">—</span><span></span><span class="match-name">Aucun match enregistré</span><span></span><span class="match-score">—</span></div>';
    return list.map(f => {
      const opp = opponent(f);
      const d = new Date(String(f.date || S.date) + 'T12:00:00');
      const date = d.getDate() + ' ' + ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'][d.getMonth()];
      const status = f.played ? esc(f.score || '—') : esc(f.comp || S.lg);
      return '<div class="fm26-ref-matchrow"><span class="match-date">' + date + '</span><span>' + crest(opp, 42) + '</span><span class="match-name">' + esc(opp) + '<div class="match-comp">' + esc(f.comp || S.lg) + ' · ' + (f.home === S.club ? 'DOM.' : 'EXT.') + '</div></span><span class="match-comp">' + (f.played ? esc(f.comp || 'FIN') : 'À venir') + '</span><span class="match-score">' + status + '</span></div>';
    }).join('');
  }
  function formItems(recent) {
    const maps = { W:['win','V'], D:['draw','N'], L:['loss','D'] };
    const values = recent.slice().reverse();
    while (values.length < 5) values.unshift(null);
    return values.slice(-5).map(f => {
      if (!f) return '<span class="fm26-ref-formbox">—</span>';
      const r = res(f);
      const val = maps[r] || ['draw',r || '—'];
      return '<span class="fm26-ref-formbox ' + val[0] + '">' + val[1] + '</span>';
    }).join('');
  }
  V.home = function () {
    const club = S.club;
    const all = (S.fx || []).filter(f => f.home === club || f.away === club).slice().sort((a,b) => String(a.date).localeCompare(String(b.date)));
    const next = currentMatch();
    const recent = all.filter(f => f.played).slice().sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,5);
    const selected = next || recent[0];
    const opp = selected ? opponent(selected) : 'Aucun adversaire';
    const diff = selected ? Math.round((new Date(String(selected.date) + 'T12:00:00') - new Date(String(S.date) + 'T12:00:00')) / 86400000) : 0;
    const when = !selected ? 'Aucun match programmé' : selected.played ? 'Dernier match' : diff <= 0 ? 'Aujourd’hui' : 'Dans ' + diff + ' jour' + (diff > 1 ? 's' : '');
    const table = typeof tbl === 'function' ? tbl() : [];
    const mine = table.find(t => t.c === club) || {pts:0,gd:0};
    const rank = Math.max(1, table.findIndex(t => t.c === club) + 1);
    const players = (S.sq || []).slice();
    const scorer = players.slice().sort((a,b) => (Number(b.g)||0) - (Number(a.g)||0))[0];
    const assists = players.slice().sort((a,b) => (Number(b.ast != null ? b.ast : b.assists)||0) - (Number(a.ast != null ? a.ast : a.assists)||0))[0];
    const rated = players.slice().sort((a,b) => (Number(b.form)||0) - (Number(a.form)||0))[0];
    const condition = players.slice().sort((a,b) => (Number(b.cond)||0) - (Number(a.cond)||0))[0];
    const played = all.filter(f => f.played).slice().sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,1);
    const fixtureList = all.filter(f => !f.played).slice(0,3);
    const rows = played.concat(fixtureList).slice(0,4);
    const injury = players.filter(p => p.injured || p.injury || p.inj);
    const rowsData = [
      [svgIcon.ball, scorer ? scorer.name : '—', 'Meilleur buteur', scorer ? (Number(scorer.g)||0) : '—'],
      [svgIcon.assist, assists ? assists.name : '—', 'Meilleur passeur décisif', assists ? (Number(assists.ast != null ? assists.ast : assists.assists)||0) : '—'],
      [svgIcon.team, condition ? condition.name : '—', 'Meilleure condition physique', condition ? Math.round(Number(condition.cond)||0) + '%' : '—'],
      [svgIcon.star, rated ? rated.name : '—', 'Meilleure note moyenne', rated ? (Number(rated.form)||0).toFixed(2) : '—']
    ];
    return '<div class="fm26-ref-home">' +
      '<section class="fm26-ref-panel" style="left:22px;top:25px;width:1033px;height:476px">' +
        '<div style="position:absolute;left:64px;top:96px;width:225px;text-align:center">' + crest(club,150) + '<div class="fm26-ref-crest-caption">' + esc(club) + '</div><div class="fm26-ref-stars">★★★★★</div></div>' +
        '<div style="position:absolute;left:300px;top:28px;font-size:28px;color:#eee">' + esc(when) + (selected ? ' (' + (selected.home === club ? 'À domicile' : 'À l’extérieur') + ')' : '') + '</div>' +
        '<div style="position:absolute;left:300px;top:79px;width:570px;font-size:37px;font-weight:800;line-height:1.12">' + esc(opp) + '</div>' +
        '<div style="position:absolute;left:300px;top:130px" class="fm26-ref-stars">★★★★★</div>' +
        '<div style="position:absolute;left:300px;top:191px;font-size:27px;color:#ddd">' + esc(selected ? (selected.comp || S.lg) : S.lg) + '</div>' +
        '<div style="position:absolute;left:300px;top:240px" class="fm26-ref-label">FORME RÉCENTE</div>' +
        '<div style="position:absolute;left:303px;top:286px" class="fm26-ref-form">' + formItems(recent) + '</div>' +
        '<div style="position:absolute;left:300px;top:360px" class="fm26-ref-label">ENTRAÎNEUR</div>' +
        '<div style="position:absolute;left:300px;top:398px;font-size:27px;font-weight:800">' + esc(S.mg || 'Manager') + '</div>' +
        '<div style="position:absolute;left:942px;top:20px">' + svgIcon.club.replace('<svg','<svg width="54" height="66"') + '</div>' +
      '</section>' +
      '<div class="fm26-ref-panel" style="left:22px;top:524px;width:1033px;height:57px;background:#5b5c61;font-size:27px;font-weight:700;padding:12px 16px">CLASSEMENT · ' + esc(S.lg) + '</div>' +
      '<div class="fm26-ref-panel" style="left:22px;top:589px;width:1033px;height:60px;background:rgba(44,45,51,.9);padding:11px 18px;font-size:26px">Position : <b>' + rank + '</b> &nbsp;&nbsp; Points : <b>' + esc(mine.pts) + '</b> &nbsp;&nbsp; Différence de buts : <b>' + (Number(mine.gd) > 0 ? '+' : '') + esc(mine.gd) + '</b></div>' +
      '<div class="fm26-ref-panel" style="left:22px;top:657px;width:1033px;height:60px;background:rgba(44,45,51,.9);padding:11px 18px;font-size:25px">Budget transferts : <b>' + esc(S.bud) + ' M€</b> &nbsp;&nbsp; Direction : <b>' + esc(S.board) + '%</b> &nbsp;&nbsp; Supporters : <b>' + esc(S.fans) + '%</b></div>' +
      '<div class="fm26-ref-panel" style="left:22px;top:725px;width:1033px;height:61px;background:rgba(44,45,51,.9);font-size:26px;padding:12px 18px">Blessés : ' + esc(injury.length ? injury.map(p => p.name).join(', ') : 'Aucun joueur blessé signalé') + '</div>' +
      '<section class="fm26-ref-panel" style="left:1087px;top:25px;width:618px;height:321px">' +
        '<div class="fm26-ref-panel-head">Stats (Joueurs)</div>' +
        rowsData.map((r,i) => '<div class="fm26-ref-row" style="position:absolute;left:0;right:0;top:' + (57 + i * 66) + 'px;height:66px"><span class="r-icon">' + r[0] + '</span><div class="r-copy"><div class="r-name">' + esc(r[1]) + '</div><div class="r-label">' + esc(r[2]) + '</div></div><b class="r-value">' + esc(r[3]) + '</b></div>').join('') +
      '</section>' +
      '<section class="fm26-ref-panel" style="left:1087px;top:422px;width:618px;height:365px">' +
        '<div class="fm26-ref-panel-head">Matchs &amp; Résultats</div>' +
        rows.map(f => {
          const o = opponent(f);
          const d = new Date(String(f.date || S.date) + 'T12:00:00');
          const date = d.getDate() + ' ' + ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'][d.getMonth()];
          return '<div class="fm26-ref-matchrow"><span class="match-date">' + esc(date) + '</span><span>' + crest(o,40) + '</span><span class="match-name">' + esc(o) + '<div class="match-comp">' + esc(f.comp || S.lg) + '</div></span><span class="match-comp">' + (f.played ? 'TERMINÉ' : (f.home === club ? 'DOM.' : 'EXT.')) + '</span><span class="match-score">' + esc(f.played ? f.score : 'À venir') + '</span></div>';
        }).join('') +
        (rows.length < 4 ? '<div class="fm26-ref-matchrow"><span class="match-date">—</span><span></span><span class="match-name">Calendrier de la saison</span><span></span><span class="match-score">' + all.length + '</span></div>' : '') +
      '</section>' +
    '</div>';
  };

  V.inbox = function () {
    const msgs = S.ib || [];
    const idx = Math.max(0, Math.min(msgs.length - 1, Number(S.mi) || 0));
    const m = msgs[idx] || {s:'Direction du club',t:'Aucun message',b:'Ta boîte de réception est vide.',d:S.date,r:true};
    const searchable = String(m.t || '') + ' ' + String(m.b || '');
    const player = (S.sq || []).find(p => searchable.toLowerCase().includes(String(p.name || '').toLowerCase())) ||
      (S.sq || []).slice().sort((a,b) => (Number(b.ovr)||0)-(Number(a.ovr)||0))[0] || {name:'Joueur',pos:'—',age:'—',ovr:0,pot:0,val:0,sal:0};
    const role = player.pos || player.position || 'Joueur';
    const percent = m.r ? 100 : 64;
    const date = m.d ? esc(fd(m.d)) : '';
    const cardStats = '<div class="fm26-ref-prop-list">Capacité&nbsp;&nbsp; ' + esc(player.ovr || '—') + '<br>Potentiel&nbsp;&nbsp; ' + esc(player.pot || '—') + '<br>' + esc(role) + '<br>€' + esc(Number(player.sal || 0).toLocaleString('fr-FR')) + ' / semaine<br>Évalué à €' + esc(player.val || 0) + 'M</div>';
    return '<div class="fm26-ref-inbox">' +
      '<div class="fm26-ref-inbox-top">' + crest(S.club,52) + '<div><strong>Infos</strong><small>' + (msgs.filter(x => !x.r).length ? msgs.filter(x => !x.r).length + ' message(s) non lu(s)' : 'Pas d’infos non lues') + '</small></div></div>' +
      '<section class="fm26-ref-panel" style="left:22px;top:21px;width:1137px;height:718px;background:rgba(38,40,56,.82);padding:18px 25px">' +
        '<div style="font-size:27px;font-weight:800;color:#b07cff;margin-bottom:12px;text-transform:uppercase">' + esc(m.t || 'Message du club') + '</div>' +
        '<div class="fm26-ref-report-intro">' + esc(m.s || 'Direction du club') + ' · ' + date + '<br>' + esc(m.b || 'Aucun détail complémentaire pour ce message.') + '</div>' +
        '<div style="position:absolute;left:8px;top:328px;width:1122px;height:386px;background:rgba(48,51,70,.8)">' +
          '<div class="fm26-ref-player-card">' +
            '<div class="player-number">' + esc(player.no || '—') + '</div>' +
            '<svg class="shirt-art" viewBox="0 0 120 148" aria-hidden="true"><ellipse cx="60" cy="47" rx="34" ry="42" fill="#07080d" stroke="#555" stroke-width="2"/><path d="M0 148C5 110 30 98 60 98S115 110 120 148Z" fill="#08090d" stroke="#555" stroke-width="2"/></svg>' +
            '<div style="position:absolute;left:12px;top:111px;width:28px;height:28px;background:#a3204a;border-radius:4px;border:2px solid #234"></div>' +
            '<div style="position:absolute;right:9px;top:119px;width:32px;height:20px;background:linear-gradient(#c60b1e 25%,#ffc400 25% 75%,#c60b1e 75%)"></div>' +
            '<div class="player-name">' + esc(player.name) + '</div><div class="player-pos">' + esc(role) + '</div><div class="player-club">' + esc(S.club) + '</div>' +
          '</div>' +
          cardStats +
          '<div class="fm26-ref-prop-stars"><span style="color:#f7a21b">★★★★</span><span style="color:#888">★</span><br><span style="color:#f7a21b">★★★★</span><span style="color:#888">★</span></div>' +
          '<div style="position:absolute;left:674px;top:14px;width:2px;height:262px;background:#4a4d62"></div>' +
          '<div style="position:absolute;left:690px;top:16px;width:420px;font-size:24px;line-height:1.5">' +
            '<div>• ' + esc(player.pos || 'Polyvalence') + '</div><div>• ' + esc(player.nat || 'Joueur de l’effectif') + '</div><div>• Moral : ' + esc(player.morale != null ? player.morale : '—') + '</div><div>• Condition : ' + esc(player.cond != null ? player.cond + '%' : '—') + '</div>' +
          '</div>' +
          '<div style="position:absolute;left:0;top:310px;width:1122px;display:flex;text-align:center">' +
            '<div style="flex:1"><div class="fm26-ref-label">STATUT</div><div style="font-size:25px;margin-top:10px">' + (m.r ? 'Consulté' : 'À lire') + '</div></div>' +
            '<div style="flex:1"><div class="fm26-ref-label">NOTE MOYENNE</div><div style="font-size:25px;margin-top:10px">' + esc(Number(player.form || 0).toFixed(2)) + '</div></div>' +
            '<div style="flex:1"><div class="fm26-ref-label">VALEUR ESTIMÉE</div><div style="font-size:25px;margin-top:10px;color:#65d56d">€' + esc(player.val || 0) + 'M</div></div>' +
            '<div style="flex:1"><div class="fm26-ref-label">SALAIRE</div><div style="font-size:25px;margin-top:10px;color:#65d56d">€' + esc(Number(player.sal || 0).toLocaleString('fr-FR')) + '/sem.</div></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="fm26-ref-assignment">' +
        '<div class="assignment-label">AFFECTATION ACTUELLE</div><div class="assignment-value">' + esc(m.s || 'Équipe du club') + '</div>' +
        '<div class="assignment-label" style="margin-top:28px">ÉTAT DU MESSAGE</div><div class="fm26-ref-progress"><i style="width:' + percent + '%"></i></div>' +
        '<div class="assignment-label" style="margin-top:32px">DATE DU MESSAGE</div><div class="assignment-value">' + (date || '—') + '</div>' +
        '<div class="assignment-label" style="margin-top:28px">MESSAGES REÇUS</div><div class="assignment-value">' + msgs.length + '</div>' +
        '<button type="button" class="fm26-ref-bottom-btn primary" style="left:62px;top:624px;width:416px;height:69px" id="fm26-ref-manage">' + (m.r ? 'Marquer non lu' : 'Marquer comme lu') + '</button>' +
      '</section>' +
      '<button type="button" class="fm26-ref-bottom-btn primary" style="left:53px;width:334px" id="fm26-ref-open-report">Voir rapport</button>' +
      '<button type="button" class="fm26-ref-bottom-btn secondary" style="left:729px;width:335px" id="fm26-ref-inbox-home">Boîte de réception</button>' +
      '<button type="button" class="fm26-ref-bottom-btn secondary" style="left:1069px;width:334px" id="fm26-ref-prev"><span>◀</span>Précédent</button>' +
      '<button type="button" class="fm26-ref-bottom-btn secondary" style="left:1407px;width:335px" id="fm26-ref-next"><span>▶</span>Suivant</button>' +
      '</div>';
  };

  V.pre = function () {
    const f = currentMatch();
    const club = S.club;
    const opp = opponent(f) || 'Adversaire à confirmer';
    const isHome = f ? f.home === club : true;
    const form = (S.fx || []).filter(x => x.played && (x.home === opp || x.away === opp)).slice(-5).map(x => res(x));
    const squad = typeof oppXI === 'function' ? oppXI(opp) : [];
    const tactical = S.tc || {};
    const formation = tactical.f || '4-3-3';
    const played = (S.fx || []).filter(x => x.played && (x.home === club || x.away === club)).slice(-5);
    const strengths = [];
    const weaknesses = [];
    const avg = squad.length ? squad.reduce((a,p) => a + (Number(p.ovr)||70),0) / squad.length : 70;
    if (avg >= 76) strengths.push('Qualité technique');
    if (avg >= 73) strengths.push('Puissance offensive');
    if (squad.some(p => /ST|AC|FW/i.test(String(p.pos || '')))) strengths.push('Présence dans la surface');
    if (!strengths.length) strengths.push('Organisation collective','Transitions rapides');
    if (squad.length < 11) weaknesses.push('Effectif à analyser');
    if (squad.some(p => Number(p.cond) < 68)) weaknesses.push('Condition physique à surveiller');
    if (!weaknesses.length) weaknesses.push('Espace dans le dos de la défense');
    const positions = [[50,88,'GB'],[21,72,'DG'],[40,76,'DC'],[60,76,'DC'],[79,72,'DD'],[36,52,'MC'],[64,52,'MC'],[50,59,'MDC'],[21,34,'AG'],[79,34,'AD'],[50,20,'AC']];
    const oppP = positions.map((p,i) => '<span class="fm26-ref-position" style="left:' + (355 + p[0]*4.7) + 'px;top:' + (8 + p[1]*3.25) + 'px">' + p[2] + '</span>').join('');
    const recentForm = form.length ? form : [];
    return '<div class="fm26-ref-pre">' +
      '<section class="fm26-ref-panel" style="left:22px;top:25px;width:881px;height:351px">' +
        '<div class="fm26-ref-small-panel-title" style="margin-top:9px">' + esc(f && f.comp ? f.comp : S.lg).toUpperCase() + '</div>' +
        '<div style="text-align:center;font-size:23px;margin-top:4px">' + (f && f.round ? esc(f.round) : 'Prochain match') + '</div>' +
        '<div style="position:absolute;left:35px;top:91px;width:220px;text-align:center">' + crest(opp,80) + '<div style="font-size:30px;margin-top:5px">' + esc(opp) + '</div><div class="fm26-ref-stars" style="font-size:28px">★★★★★</div></div>' +
        '<div style="position:absolute;left:425px;top:128px;font-size:32px">–</div>' +
        '<div style="position:absolute;left:555px;top:91px;width:245px;text-align:center">' + crest(club,80) + '<div style="font-size:30px;margin-top:5px">' + esc(club) + '</div><div class="fm26-ref-stars">★★★★★</div><div style="margin-top:5px">' + formItems(played).replace(/fm26-ref-formbox/g,'fm26-ref-formbox').replace(/width:52px/g,'width:27px') + '</div></div>' +
        '<div style="position:absolute;left:678px;top:306px;font-size:24px">◔</div><div style="position:absolute;left:760px;top:306px;width:8px;height:28px;background:#ccc;border-radius:4px"></div><div style="position:absolute;left:810px;top:304px;font-size:29px">' + (f ? esc(new Date(String(f.date) + 'T12:00:00').getHours()) : '—') + '</div>' +
      '</section>' +
      '<section class="fm26-ref-panel" style="left:22px;top:389px;width:881px;height:158px">' +
        '<div class="fm26-ref-small-panel-title" style="margin-top:9px">TACTIQUE DE MATCH</div>' +
        '<div style="position:absolute;left:295px;top:66px;font-size:30px;font-weight:800">' + esc(tactical.m || 'Équilibrée') + '</div>' +
        '<div style="position:absolute;right:12px;top:60px;font-size:23px;color:#ccc">Formation</div><div style="position:absolute;right:12px;top:98px;font-size:29px">' + esc(formation) + '</div>' +
      '</section>' +
      '<section class="fm26-ref-panel" style="left:22px;top:560px;width:881px;height:247px">' +
        '<div class="fm26-ref-small-panel-title" style="margin-top:9px">PRÉPARATION DE MATCH</div>' +
        '<div style="position:absolute;left:300px;top:56px;font-size:29px;font-weight:800">Consignes actuelles</div>' +
        '<div style="position:absolute;left:300px;top:96px;font-size:25px;line-height:1.35;width:560px">' + esc(tactical.s || 'Récupérer rapidement le ballon et jouer vers l’avant lorsque les espaces se présentent.') + '</div>' +
      '</section>' +
      '<section class="fm26-ref-panel" style="left:917px;top:25px;width:855px;height:587px;overflow:hidden">' +
        '<div style="position:absolute;left:12px;top:20px;font-size:30px;font-weight:800">' + esc(opp.toUpperCase()) + '</div>' +
        '<div class="fm26-ref-label" style="position:absolute;left:12px;top:90px">STYLE</div><div style="position:absolute;left:12px;top:124px;font-size:29px">Transition rapide</div>' +
        '<div class="fm26-ref-label" style="position:absolute;left:12px;top:178px">FORMATION</div><div style="position:absolute;left:12px;top:212px;font-size:29px">4-3-3</div>' +
        '<div class="fm26-ref-label" style="position:absolute;left:12px;top:266px">JOUEUR CLÉ</div><div style="position:absolute;left:12px;top:300px;font-size:29px">' + esc((squad.find(p => /ST|AC|FW/i.test(String(p.pos || ''))) || squad[0] || {name:'À analyser'}).name) + '</div>' +
        '<div class="fm26-ref-pitch"></div><div class="fm26-ref-pitch-line"></div>' + oppP +
        '<div style="position:absolute;left:0;top:353px;width:855px;height:58px;background:#3c3d42;display:flex;font-size:22px;font-weight:800"><div style="flex:1;text-align:center;padding-top:14px">POINTS FORTS</div><div style="flex:1;text-align:center;padding-top:14px;border-left:1px solid #555">FAIBLESSES</div></div>' +
        '<div style="position:absolute;left:28px;top:420px;font-size:27px;line-height:1.65">' + strengths.slice(0,3).map(x => '›&nbsp;&nbsp;' + esc(x)).join('<br>') + '</div>' +
        '<div style="position:absolute;left:427px;top:411px;width:1px;height:176px;background:#555"></div>' +
        '<div style="position:absolute;left:452px;top:420px;font-size:25px;line-height:1.7">' + weaknesses.slice(0,2).map(x => '›&nbsp;&nbsp;' + esc(x)).join('<br>') + '</div>' +
      '</section>' +
      '<section class="fm26-ref-panel fm26-ref-pre-quote">' + (isHome ? esc(club) + ' jouera à domicile.' : esc(club) + ' devra se déplacer pour ce prochain match.') + ' La préparation tactique et la condition physique peuvent peser sur la rencontre.</section>' +
    '</div>';
  };

  function wireInbox() {
    if (!$('fm26-ref-manage')) return;
    const msgs = S.ib || [];
    const idx = Math.max(0, Math.min(msgs.length - 1, Number(S.mi) || 0));
    $('fm26-ref-manage').onclick = function () { if (msgs[idx]) msgs[idx].r = !msgs[idx].r; if (typeof sv === 'function') sv(); render(); };
    $('fm26-ref-open-report').onclick = function () { if (msgs[idx]) msgs[idx].r = true; if (typeof sv === 'function') sv(); if (typeof toast === 'function') toast('Rapport marqué comme consulté'); render(); };
    $('fm26-ref-inbox-home').onclick = function () { S.view = 'inbox'; render(); };
    $('fm26-ref-prev').onclick = function () { S.mi = Math.max(0, idx - 1); if (msgs[S.mi]) msgs[S.mi].r = true; render(); };
    $('fm26-ref-next').onclick = function () { S.mi = Math.min(Math.max(0, msgs.length - 1), idx + 1); if (msgs[S.mi]) msgs[S.mi].r = true; render(); };
  }

  baseRender = render;
  render = function () {
    baseRender();
    renderShell();
    if (S && S.view === 'inbox') wireInbox();
  };

  window.addEventListener('resize', fitStage);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) { openMenu = ''; renderShell(); }
  });
  if (S && !$('app').classList.contains('hid')) render();
  else fitStage();
})();