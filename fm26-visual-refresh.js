/* FM26 Visual Refresh — unified midnight navy, violet and cyan interface. */
(function () {
  'use strict';
  if (document.getElementById('fm26-visual-refresh')) return;

  const style = document.createElement('style');
  style.id = 'fm26-visual-refresh';
  style.textContent = String.raw`
    :root {
      --bg:#17181e!important;
      --pn:#292a32!important;
      --ln:#41434d!important;
      --ac:#9d65e8!important;
      --tx:#f4f7ff!important;
      --mu:#a9aab2!important;
      --hc:#2b2c34!important;
      color-scheme:dark;
    }
    html,body{background:#17181e!important;color:#f4f7ff!important}
    body{font-family:Inter,"Segoe UI",system-ui,sans-serif!important;letter-spacing:.005em}
    ::selection{background:#9d65e8;color:#fff}
    ::-webkit-scrollbar{width:10px;height:10px}
    ::-webkit-scrollbar-track{background:#111218}
    ::-webkit-scrollbar-thumb{background:#354865;border:2px solid #111218;border-radius:20px}
    ::-webkit-scrollbar-thumb:hover{background:#7865df}

    #setup{
      background:
        radial-gradient(ellipse at 12% 0%,#6349d94d,transparent 38%),
        radial-gradient(ellipse at 94% 100%,#16b8c42b,transparent 42%),
        linear-gradient(140deg,#111217,#22232a 55%,#191a21)!important;
    }
    #setup .sc{
      background:linear-gradient(145deg,#292b34f5,#1d1f27f7)!important;
      border:1px solid #3b5071!important;border-radius:20px!important;
      box-shadow:0 28px 80px #020710a6, inset 0 1px #ffffff12!important;
    }
    #setup .setup-mark{
      background:linear-gradient(135deg,#886cff,#39cbd4)!important;
      box-shadow:0 10px 35px #6f59e35c!important;border-radius:14px!important;
    }
    #setup h1{letter-spacing:-.045em!important}
    label{color:#aab9d0!important;font-weight:700!important;letter-spacing:.04em}
    input,select,textarea{
      background:#14151c!important;border:1px solid #454751!important;
      border-radius:10px!important;color:#f5f8ff!important;
      min-height:42px;transition:border-color .18s,box-shadow .18s,background .18s;
    }
    input:focus,select:focus,textarea:focus{
      outline:none!important;border-color:#8d78ff!important;
      box-shadow:0 0 0 3px #9d65e833!important;background:#101f34!important;
    }
    input::placeholder,textarea::placeholder{color:#73849d!important}

    #app:not(.hid){background:#17181e!important}
    #side{
      background:linear-gradient(180deg,#292b34 0%,#1b1d24 48%,#14151b 100%)!important;
      border-right:1px solid #41434d!important;
      box-shadow:5px 0 28px #02091435!important;
    }
    .si{
      color:#c2cde0!important;border-left:3px solid transparent!important;
      border-bottom:1px solid #ffffff08!important;
      transition:background .18s,color .18s,border-color .18s,transform .18s;
    }
    .si:hover{background:#ffffff0e!important;color:#fff!important}
    .si.on{
      color:#fff!important;border-left-color:#8d78ff!important;
      background:linear-gradient(90deg,#765de64a,#37c7d21a)!important;
      box-shadow:inset 0 0 24px #9d65e81c!important;
    }
    .si .nav-icon svg{stroke:currentColor!important}
    #hd{
      background:linear-gradient(100deg,#292b35 0%,#20222a 48%,#181a21 100%)!important;
      border-bottom:1px solid #41434d!important;
      box-shadow:0 8px 28px #02081338!important;
    }
    #hd h2{color:#f7f9ff!important;font-weight:850!important;letter-spacing:-.025em!important}
    #hd small{color:#afbdd3!important}
    #go{
      background:linear-gradient(115deg,#9d65e8,#c04cc3 57%,#db438f)!important;
      color:#fff!important;border:1px solid #a99cff!important;border-radius:11px!important;
      box-shadow:0 8px 24px #5d52d64a!important;font-weight:900!important;
      letter-spacing:.035em!important;transition:transform .18s,filter .18s,box-shadow .18s!important;
    }
    #go:hover{filter:brightness(1.1)!important;transform:translateY(-2px)!important;box-shadow:0 12px 30px #5d52d66b!important}
    #go:active{transform:translateY(0) scale(.985)!important}

    #vw{background:linear-gradient(145deg,#1a1b22,#14151b)!important}
    body.fm26-screenpack-active #side{
      background:linear-gradient(180deg,#292b34 0%,#1b1d24 48%,#14151b 100%)!important;
      border-right:1px solid #41434d!important;
    }
    body.fm26-screenpack-active #hd{
      background:linear-gradient(100deg,#292b35 0%,#20222a 48%,#181a21 100%)!important;
      border-bottom:1px solid #41434d!important;
    }
    body.fm26-screenpack-active #main{
      background:linear-gradient(145deg,#1a1b22,#14151b)!important;
    }
    body.fm26-screenpack-active #vw{
      background:radial-gradient(ellipse at 82% 3%,#5146a91b,transparent 38%),linear-gradient(145deg,#202129,#14151b)!important;
    }
    body.fm26-screenpack-active #fm26-manager-sidebar{
      background:linear-gradient(180deg,#282a33,#1b1c23)!important;
      border-right:1px solid #405777!important;
      box-shadow:5px 0 24px #02091435!important;
    }
    body.fm26-screenpack-active .fm26-manager-link{
      border-top:1px solid #ffffff0d!important;color:#d8e1f1!important;
      transition:background .16s,color .16s,border-color .16s!important;
    }
    body.fm26-screenpack-active .fm26-manager-link:hover{background:#ffffff0d!important;color:#fff!important}
    body.fm26-screenpack-active .fm26-manager-link.selected{
      background:linear-gradient(90deg,#765de63d,#db438f15)!important;
      box-shadow:inset 3px 0 #9684ff!important;color:#fff!important;
    }
    .pn,.portal-panel,.mcard,.fixture-card,.fm26-pack-fixture,.fm26-inbox-panel,
    .fm26-career-card,.fm26-jobs-grid>.pn{
      background:linear-gradient(145deg,#292b34f5,#20222af7)!important;
      border:1px solid #454751!important;border-radius:15px!important;
      box-shadow:0 12px 30px #02091438,inset 0 1px #ffffff0a!important;
    }
    .pn h3,.fm26-pack-label,.fm26-inbox-title{
      color:#d1a2ec!important;letter-spacing:.1em!important;
    }
    .portal-panel .panel-top h2,.fm26-home-section-title{
      color:#d5b4ea!important;letter-spacing:.12em!important;
    }
    .mu,.subtle-link{color:#a9b8ce!important}
    .subtle-link{font-weight:850!important}
    .subtle-link:hover{color:#c3b8ff!important}
    .ar{border-bottom:1px solid #ffffff12!important}
    .ar b{color:#f3f6ff!important}
    table{border-collapse:separate!important;border-spacing:0!important}
    thead th,th{
      background:#303139!important;color:#aebbd0!important;
      font-weight:850!important;letter-spacing:.06em!important;text-transform:uppercase;
    }
    td,th{border-bottom:1px solid #ffffff12!important;padding:10px 9px!important}
    tbody tr{transition:background .15s}
    tbody tr:nth-child(even){background:#ffffff04!important}
    tbody tr:hover{background:#7b68ef18!important}
    tr.me,tr.me td{background:#6e5bd52b!important}
    .b{border-radius:7px!important;padding:3px 8px!important}
    .b.h{background:#147c80!important;color:#e7ffff!important}
    .b.m{background:#634bb0!important;color:#f8f4ff!important}
    .b.l{background:#293b56!important;color:#c1cce0!important}

    button,.chip,.btn,.fm26-pack-button,.fm26-career-actions button{
      -webkit-tap-highlight-color:transparent;
    }
    button:focus-visible,a:focus-visible,[role=button]:focus-visible,
    input:focus-visible,select:focus-visible{
      outline:2px solid #a99cff!important;outline-offset:3px!important;
    }
    .btn,.fixture-cta,#go,.fm26-pack-button.primary,.fm26-career-actions button.primary{
      background:linear-gradient(115deg,#9d65e8,#c253c2 58%,#db438f)!important;
      border:1px solid #9c8dff!important;color:#fff!important;
      border-radius:10px!important;font-weight:900!important;
      box-shadow:0 7px 22px #6253d53c!important;
    }
    .btn:hover,.fixture-cta:hover,.fm26-pack-button:hover,.fm26-career-actions button:hover{
      filter:brightness(1.12)!important;transform:translateY(-1px);
    }
    .chip{
      background:linear-gradient(145deg,#30323a,#25262e)!important;
      border:1px solid #4a4c56!important;border-radius:9px!important;
      color:#eaf0fc!important;font-weight:700!important;
      transition:background .17s,border-color .17s,transform .17s,box-shadow .17s;
    }
    .chip:hover{background:#3b3d47!important;border-color:#a787d8!important;transform:translateY(-1px)}
    .chip.on,.chip.selected{
      background:linear-gradient(120deg,#8c58d1,#b047a5)!important;
      border-color:#b3a5ff!important;color:#fff!important;
      box-shadow:0 0 0 2px #8c79f52a!important;
    }
    .fm26-pack-button.secondary,.fm26-career-actions button:not(.primary):not(.danger){
      background:linear-gradient(145deg,#2a3d59,#25262e)!important;
      border:1px solid #555660!important;border-radius:9px!important;color:#f1f5ff!important;
    }
    button:disabled,.chip:disabled,.btn:disabled{opacity:.42!important;cursor:not-allowed!important;transform:none!important;filter:none!important}

    .fm26-manager-sidebar{
      background:linear-gradient(180deg,#282a33,#1b1c23)!important;
      border-right:1px solid #405777!important;
      box-shadow:5px 0 24px #02091435!important;
    }
    .fm26-manager-head{border-bottom:1px solid #354b68!important}
    .fm26-manager-title{color:#d1a2ec!important;letter-spacing:.12em!important}
    .fm26-manager-link{
      border-top:1px solid #ffffff0d!important;color:#d8e1f1!important;
      transition:background .16s,color .16s,border-color .16s;
    }
    .fm26-manager-link:hover{background:#ffffff0d!important;color:#fff!important}
    .fm26-manager-link.selected{
      background:linear-gradient(90deg,#765de63d,#db438f15)!important;
      box-shadow:inset 3px 0 #9684ff!important;color:#fff!important;
    }
    .fm26-career-shortcut-title{color:#d8a9ee!important;border-top-color:#405574!important}
    .fm26-career-shortcut{color:#dce6f6!important;border-top-color:#ffffff0d!important}
    .fm26-career-shortcut:hover{background:#ffffff12!important;color:#fff!important}

    .fm26-pack-page,.fm26-inbox-page,.fm26-career-page{
      background:
        radial-gradient(ellipse at 82% 3%,#5146a91b,transparent 38%),
        linear-gradient(145deg,#202129,#14151b)!important;
    }
    .fm26-pack-fixture,.fm26-inbox-panel,.fm26-career-card{
      border-color:#444650!important;
    }
    .fm26-pack-note,.fm26-career-note{
      background:#292a35!important;border-left-color:#8d79ff!important;
      border-radius:0 8px 8px 0!important;color:#b9b7c2!important;
    }
    .fm26-inbox-title{color:#d8a9ee!important}
    .fm26-inbox-assignment h2{color:#b9b7c2!important}
    .fm26-inbox-actions button{
      background:linear-gradient(145deg,#293b58,#1b2a41)!important;
      border:1px solid #526989!important;border-radius:9px!important;
      color:#f3f6ff!important;font-weight:800!important;
    }
    .fm26-inbox-actions .primary{
      background:linear-gradient(115deg,#9d65e8,#c44fb8)!important;
      border-color:#9e8dff!important;
    }
    .fm26-inbox-list button{
      border:1px solid #3c5272!important;border-radius:10px!important;
      background:#1a2c45!important;color:#f4f7ff!important;
    }
    .fm26-inbox-list button.active{
      border-color:#9b87ff!important;background:linear-gradient(100deg,#6d58d33d,#34b9c51b)!important;
    }

    .fm26-lineup-page{
      background:#0c1b2c!important;color:#f5f8ff!important;
    }
    .fm26-lineup-top,.fm26-lineup-bottom{
      background:linear-gradient(100deg,#202129,#282a33)!important;
      border-color:#454751!important;
    }
    .fm26-lineup-bench{
      background:linear-gradient(180deg,#282a33,#101f35)!important;
      border-left:1px solid #67616f!important;color:#f5f8ff!important;
    }
    .fm26-lineup-bench h2{color:#d8a9ee!important;letter-spacing:.1em!important}
    .fm26-lineup-bench-row{
      background:#30323a!important;border-bottom:1px solid #ffffff12!important;
      transition:background .16s,border-color .16s!important;
    }
    .fm26-lineup-bench-row:hover{background:#44404c!important}
    .fm26-lineup-bench-row.selected,.fm26-lineup-player.selected{
      outline:2px solid #d8a9ee!important;outline-offset:1px!important;
    }
    .fm26-lineup-player .photo{border:2px solid #e2b5ed!important;box-shadow:0 5px 16px #02091488!important}
    .fm26-lineup-bottom select{background:#13253c!important;border:1px solid #506a8a!important;color:#fff!important;border-radius:8px!important}
    .fm26-lineup-club-crest{filter:drop-shadow(0 10px 20px #08101d88)!important}

    .fm26-matchday{
      background:
        radial-gradient(ellipse at 50% 100%,#3a2848 0%,transparent 42%),
        linear-gradient(155deg,#0c1727,#08111e)!important;
    }
    .md-topbar{
      background:linear-gradient(100deg,#0b1524,#172a44 60%,#0d1b2d)!important;
      border-bottom:1px solid #415a7a!important;
      box-shadow:0 8px 24px #02091466!important;
    }
    .md-clock{
      background:linear-gradient(160deg,#9d65e8,#4d6bd0)!important;
      border-right:1px solid #b0a5ff!important;
    }
    .md-score-team.home,.md-score-team.away{filter:saturate(.82) brightness(.92)}
    .md-score-number{color:#fff!important;text-shadow:0 3px 18px #000!important}
    .md-pause-btn{
      background:linear-gradient(115deg,#9d65e8,#587fe2)!important;
      border-left:1px solid #d8a9ee!important;font-weight:900!important;
    }
    .md-pause-btn.paused{background:linear-gradient(115deg,#7a4b9a,#573a68)!important}
    .md-field-stage{
      background:
        radial-gradient(ellipse at 50% 50%,#4a795d 0%,#30243b 55%,#1c1b25 100%)!important;
    }
    .md-commentary{
      background:linear-gradient(100deg,#65456e,#493451)!important;
      color:#f6fcff!important;border-left:3px solid #49d6d3!important;
    }
    .md-bottom{background:#0d1929!important;border-top:1px solid #454751!important}
    .md-bottom-icon,.md-tool{background:#13243a!important;border-color:#344a67!important;color:#e8efff!important}
    .md-tool:hover,.md-bottom-icon:hover{background:#233b59!important}
    .md-tool .purple{color:#e2b5ed!important}
    .md-drawer,.md-modal{
      background:linear-gradient(145deg,#192b43,#101d30)!important;
      border:1px solid #4b6385!important;border-radius:14px!important;
      box-shadow:0 24px 70px #0009!important;
    }
    .md-drawer-head,.md-modal-head,.md-modal-foot{border-color:#3d5575!important}
    .md-btn{border-radius:9px!important;background:#283d59!important;border-color:#5a7294!important}
    .md-btn.primary{background:linear-gradient(115deg,#9d65e8,#c253c2)!important;border-color:#ac9dff!important}
    .md-btn.blue{background:linear-gradient(115deg,#8e54cb,#5a4e8f)!important;border-color:#59c4d3!important}
    .md-btn.selected{outline:2px solid #b5a8ff!important;background:#433b78!important}
    .md-progress-dot.done{background:#49d4b1!important}
    .md-progress-dot.live{background:#a89aff!important;box-shadow:0 0 12px #a89aff!important}

    #fm26-ref-menu{
      background:linear-gradient(145deg,#162944f5,#1a1b22f7)!important;
      border:1px solid #526b8d!important;box-shadow:0 25px 70px #0009!important;
      backdrop-filter:blur(14px);
    }
    .fm26-ref-menu-head{border-bottom:1px solid #405879!important}
    .fm26-ref-menu-item{
      border-top:1px solid #ffffff10!important;color:#edf3ff!important;
      transition:background .16s,color .16s!important;
    }
    .fm26-ref-menu-item:hover{background:#9d65e82e!important;color:#fff!important}
    .fm26-ref-menu-section{color:#d8a9ee!important;letter-spacing:.1em!important}
    .fm26-ref-toolbar{background:#1a2d49!important;border:1px solid #405a7d!important}
    .fm26-ref-info{background:linear-gradient(145deg,#1c9aa4,#176a84)!important}
    .fm26-ref-continue{
      background:linear-gradient(115deg,#9d65e8,#cc4fb0 58%,#db438f)!important;
      border:1px solid #d8a9ee!important;box-shadow:0 8px 22px #6957da4a!important;
    }
    .fm26-ref-date{background:#303139!important;color:#eef3ff!important}

    .fm26-jobs-page{background:transparent!important}
    .fm26-jobs-current,.fm26-jobs-empty{
      background:#1a2b43!important;border-color:#3d5575!important;border-radius:12px!important;
    }
    .fm26-job-actions .chip{border-radius:8px!important}
    .fm26-career-page h1,.fm26-pack-page h1{letter-spacing:-.035em!important}
    .fm26-career-kpi{color:#d8a9ee!important}
    .toast,.fm26-toast{
      background:#282a33!important;border:1px solid #9d65e8!important;
      border-radius:10px!important;box-shadow:0 14px 40px #0008!important;color:#fff!important;
    }

    @media(max-width:900px){
      #hd{padding:8px 12px!important;gap:9px!important}
      #hd h2{font-size:17px!important}
      #vw{padding:12px!important}
      .pn,.portal-panel{border-radius:12px!important}
      .fm26-career-page{padding:14px!important}
      .fm26-inbox-content{grid-template-columns:minmax(0,1fr)!important}
      .fm26-inbox-assignment{min-height:270px}
      .fm26-inbox-player-area{grid-template-columns:minmax(90px,120px) minmax(0,1fr)!important}
      .fm26-inbox-traits{grid-column:1/-1;border-left:0;border-top:1px solid #52627b;padding:10px 0!important}
      .fm26-lineup-stage{grid-template-columns:minmax(0,1fr) minmax(180px,31%)!important}
    }
    @media(max-width:620px){
      #setup .sc{padding:15px!important;border-radius:14px!important}
      #setup h1{font-size:30px!important}
      .fm26-pack-grid{grid-template-columns:minmax(0,1fr)!important}
      .fm26-inbox-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .fm26-inbox-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .fm26-inbox-player-area{grid-template-columns:100px minmax(0,1fr)!important}
      .fm26-career-grid{grid-template-columns:minmax(0,1fr)!important}
      .fm26-career-actions button{flex:1 1 100%}
      .fm26-lineup-stage{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(320px,1fr) minmax(170px,38%)!important;overflow:auto!important}
      .fm26-lineup-bench{border-left:0!important;border-top:1px solid #67616f!important}
      .fm26-lineup-page{grid-template-rows:auto minmax(0,1fr) auto!important;overflow:auto!important}
      .fm26-lineup-top{flex-wrap:wrap!important}
      .fm26-lineup-bottom{flex-wrap:wrap!important;gap:10px!important}
      .md-topbar{grid-template-columns:36px 65px minmax(0,1fr) 58px!important}
      .md-match-progress{display:none!important}
      .md-gear{display:none!important}
      .md-score-team{font-size:12px!important}
      .md-score-team .cr{width:24px!important;height:24px!important}
      .md-bottom{grid-template-columns:40px minmax(0,1fr)!important}
      .md-toolbar{grid-column:1/-1;overflow-x:auto;min-height:46px}
      .md-commentary{font-size:13px!important}
      .fm26-matchday{grid-template-rows:62px minmax(0,1fr) 110px!important}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('fm26-visual-refresh-active');
  window.FM26VisualRefresh = { version:'1.0.0', active:true };
})();