/* FM26 Matchday UI — écran de match plein écran et outils tactiques.
   Extension originale branchée sur l'état de carrière, xi(), tick() et draw(). */
(function () {
  'use strict';
  if (window.FM26MatchDay || typeof V === 'undefined' || typeof S === 'undefined') return;

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = name => String(name || 'Joueur').split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase();
  const teamColor = name => 'hsl(' + ((typeof hash === 'function' ? hash(String(name || 'FM26')) : 215) % 360) + ' 62% 38%)';
  const currentXI = () => typeof xi === 'function' ? xi().slice(0, 11) : [];
  const safeTeamName = side => M && M.f ? (side === 0 ? M.f.home : M.f.away) : '';
  const isUserSide = side => safeTeamName(side) === S.club;

  let selectedPreSlot = null;
  let selectedSubSlot = null;
  let modalMode = '';
  let drawerMode = '';
  let speedValue = 170;
  let miniMessage = '';

  const style = document.createElement('style');
  style.id = 'fm26-matchday-style';
  style.textContent = `
  body.fm26-matchday-active{overflow:hidden!important;background:#090b10!important}
  body.fm26-matchday-active #app:not(.hid){position:fixed!important;inset:0!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;min-height:100vh!important;display:block!important;grid-template-columns:1fr!important;transform:none!important;transform-origin:top left!important;z-index:100!important;background:#090b10!important}
  body.fm26-matchday-active #side,body.fm26-matchday-active #hd{display:none!important}
  body.fm26-matchday-active #main{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important;min-width:0!important;min-height:0!important;display:block!important;overflow:hidden!important}
  body.fm26-matchday-active #vw{position:absolute!important;inset:0!important;flex:none!important;width:100vw!important;height:100vh!important;max-height:none!important;min-width:0!important;overflow:hidden!important;padding:0!important;margin:0!important;background:#080a0e!important}
  .fm26-matchday,.fm26-matchday-pre{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;color:#f7f8fb;background:#080a0e;font-family:'Barlow Condensed','Arial Narrow','Segoe UI',sans-serif;isolation:isolate}
  .fm26-matchday{display:grid;grid-template-rows:clamp(58px,7.2vh,82px) minmax(0,1fr) clamp(64px,8vh,88px)}
  .md-topbar{display:grid;grid-template-columns:clamp(42px,4vw,72px) clamp(78px,9vw,150px) minmax(140px,1fr) minmax(120px,24vw,410px) clamp(46px,5vw,76px) clamp(112px,14vw,190px);align-items:stretch;background:#030407;border-bottom:2px solid #34363c;z-index:4;min-width:0}
  .md-icon-btn,.md-pause-btn{border:0;color:#fff;background:transparent;display:flex;align-items:center;justify-content:center;font:700 clamp(18px,2vw,30px) inherit;cursor:pointer;min-width:0}
  .md-icon-btn:hover{background:#ffffff17}.md-menu-btn{font-size:clamp(25px,2.4vw,36px)}
  .md-clock{display:flex;align-items:center;justify-content:center;background:#321044;color:#fff;font-size:clamp(17px,2vw,30px);font-weight:800;font-variant-numeric:tabular-nums;border-right:2px solid #08080b}
  .md-clock small{font-size:.44em;opacity:.78;margin-right:7px;letter-spacing:.08em}
  .md-scoreline{display:flex;align-items:stretch;justify-content:center;min-width:0}
  .md-score-team{display:flex;align-items:center;justify-content:center;gap:clamp(5px,1vw,14px);min-width:0;flex:1;padding:0 clamp(5px,1vw,16px);font-size:clamp(16px,2.2vw,32px);font-weight:900;letter-spacing:.02em;overflow:hidden;white-space:nowrap}
  .md-score-team.home{background:#c99a25;color:#15130c}.md-score-team.away{background:#6b9fc8;color:#071522}
  .md-score-team .cr{width:clamp(24px,3vw,42px)!important;height:clamp(24px,3vw,42px)!important;flex:0 0 auto}
  .md-score-number{display:flex;align-items:center;justify-content:center;gap:5px;padding:0 clamp(7px,1.3vw,22px);background:#101117;color:#fff;font-size:clamp(25px,3vw,44px);font-weight:950;white-space:nowrap;font-variant-numeric:tabular-nums}
  .md-match-progress{display:flex;align-items:center;justify-content:center;gap:clamp(3px,.5vw,8px);padding:0 8px;background:#030407}
  .md-progress-dot{width:clamp(5px,.72vw,12px);height:clamp(5px,.72vw,12px);background:#555961;border-radius:1px}.md-progress-dot.done{background:#f0f2f7}.md-progress-dot.live{background:#ab65ff;box-shadow:0 0 9px #a15aff}
  .md-gear{font-size:clamp(22px,2.8vw,36px)}
  .md-pause-btn{background:#9539e9;font-size:clamp(17px,2.1vw,31px);font-weight:900;padding:0 10px}.md-pause-btn:hover{background:#aa4dff}.md-pause-btn.paused{background:#bd3e65}
  .md-field-stage{position:relative;min-height:0;overflow:hidden;background:linear-gradient(90deg,#d9d9d8 0 3.7%,#e8e8e6 3.7% 7.1%,#60935e 7.1% 92.9%,#e8e8e6 92.9% 96.3%,#d9d9d8 96.3% 100%);}
  .md-stand{position:absolute;top:0;bottom:0;width:7.2%;background:repeating-linear-gradient(0deg,#d6d6d4 0 22px,#bfc0bf 23px 25px,#e7e7e5 26px 46px);opacity:.95}
  .md-stand.left{left:0;border-right:4px solid #c5c6c4}.md-stand.right{right:0;border-left:4px solid #c5c6c4}
  .md-barrier{position:absolute;top:8%;bottom:8%;width:8px;background:#111821;box-shadow:0 0 0 3px #0002}.md-barrier.left{left:8.4%}.md-barrier.right{right:8.4%}
  .md-pitch{position:absolute;left:10.2%;right:10.2%;top:2.5%;bottom:2.5%;overflow:hidden;border:2px solid #d9efd0;background:linear-gradient(105deg,#4f8c51 0%,#66a65d 17%,#4d8b4e 34%,#67a85f 50%,#4c884b 67%,#66a35b 83%,#4e8b4d 100%),repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 8.333%,rgba(0,0,0,.035) 8.333% 16.666%);background-blend-mode:soft-light,normal;box-shadow:0 0 26px #0005,inset 0 0 45px #1f4d2330}
  .md-pitch:before{content:'';position:absolute;inset:2.7%;border:2px solid #e4f4dfb8;pointer-events:none}
  .md-pitch:after{content:'';position:absolute;left:50%;top:2.7%;bottom:2.7%;border-left:2px solid #e4f4dfb8;pointer-events:none}
  .md-pitch .bx{position:absolute;top:22%;bottom:22%;width:14%;border:2px solid #e4f4dfb8;z-index:1}.md-pitch .bx.l{left:2.7%;border-left:0}.md-pitch .bx.r{right:2.7%;border-right:0}
  .md-pitch .cc{position:absolute;left:50%;top:50%;width:16%;aspect-ratio:1;border:2px solid #e4f4dfb8;border-radius:50%;transform:translate(-50%,-50%);z-index:1}
  .md-pitch .goalbox{position:absolute;top:37%;height:26%;width:5.8%;border:2px solid #e4f4dfb8;z-index:1}.md-pitch .goalbox.left{left:2.7%;border-left:0}.md-pitch .goalbox.right{right:2.7%;border-right:0}
  .md-pitch .goal{position:absolute;top:43%;height:14%;width:1.5%;background:#eff6eb88;z-index:1}.md-pitch .goal.left{left:0}.md-pitch .goal.right{right:0}
  .md-pitch .penalty-spot{position:absolute;top:50%;width:5px;height:5px;background:#eaf6e4;border-radius:50%;transform:translate(-50%,-50%);z-index:2}.md-pitch .penalty-spot.left{left:10%}.md-pitch .penalty-spot.right{right:10%}
  .md-pitch .dt{position:absolute;z-index:3;display:grid;place-items:center;width:clamp(20px,2.25vw,34px);height:clamp(20px,2.25vw,34px);border-radius:50%;font:800 clamp(9px,.85vw,14px)/1 'Segoe UI',sans-serif;transform:translate(-50%,-50%);border:2px solid #ffffffa8;box-shadow:0 2px 7px #0008;cursor:pointer;padding:0;transition:left .48s cubic-bezier(.2,.7,.2,1),top .48s cubic-bezier(.2,.7,.2,1),box-shadow .18s}
  .md-pitch .dt.hm{background:#397ec0;color:#fff;border-color:#c7ddf2}.md-pitch .dt.aw{background:#e5b742;color:#251a04;border-color:#fff0c2}.md-pitch .dt.ref{width:clamp(19px,2vw,30px);height:clamp(19px,2vw,30px);background:#151820;color:#fff;border-color:#f1f3f5;cursor:default}.md-pitch .dt.ass{width:clamp(18px,1.8vw,26px);height:clamp(18px,1.8vw,26px);background:#17191d;color:#fff;border-color:#050608;cursor:default}
  .md-pitch .dt.bc{box-shadow:0 0 0 4px #fff8,0 0 18px #fff;z-index:5}
  .md-pitch .ball{position:absolute;z-index:6;width:clamp(17px,1.45vw,24px);height:clamp(17px,1.45vw,24px);border-radius:50%;background:transparent url('./fm26-ball.svg') center/contain no-repeat;border:0;transform:translate(-50%,-50%);filter:drop-shadow(0 2px 3px #000b);transition:left .4s ease,top .4s ease;animation:fm26-ball-roll .7s linear infinite;pointer-events:none;will-change:left,top,transform}@keyframes fm26-ball-roll{to{transform:translate(-50%,-50%) rotate(360deg)}}
  .md-goal-card{position:absolute;z-index:8;left:50%;top:13%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;background:#132b43eb;color:white;padding:12px 22px;border:1px solid #b5d3ed;border-radius:7px;box-shadow:0 10px 30px #0007;font-size:clamp(15px,1.8vw,25px);font-weight:850;opacity:0;pointer-events:none;transition:opacity .2s}.md-goal-card.on{opacity:1}
  .md-bottom{display:grid;grid-template-columns:clamp(50px,5vw,92px) minmax(0,1fr) auto;align-items:stretch;background:#050608;border-top:2px solid #20242b;min-width:0;z-index:4}
  .md-bottom-icon{display:flex;align-items:center;justify-content:center;font-size:clamp(21px,2.1vw,32px);color:#fff;background:#07090c;border-right:1px solid #30343a;cursor:pointer}
  .md-commentary{display:flex;align-items:center;justify-content:center;background:#6da4d2;color:#f8fbff;text-align:center;padding:8px 16px;font-size:clamp(15px,1.7vw,26px);font-weight:600;line-height:1.15;min-width:0;overflow:hidden}
  .md-toolbar{display:flex;align-items:stretch;gap:0;white-space:nowrap}.md-tool{display:flex;align-items:center;justify-content:center;gap:9px;padding:0 clamp(8px,1.2vw,22px);border:0;border-left:1px solid #242830;background:#090b0f;color:#f6f7fa;font-size:clamp(13px,1.35vw,20px);cursor:pointer}.md-tool:hover{background:#222632}.md-tool strong{font-size:1.13em}.md-tool .purple{color:#bd8aff}.md-tool.md-final-btn{background:#235d42;color:#fff;font-weight:900}
  .md-drawer{position:absolute;z-index:10;right:0;top:clamp(58px,7.2vh,82px);bottom:clamp(64px,8vh,88px);width:min(430px,42vw);padding:18px;background:#111722f5;border-left:1px solid #58616f;box-shadow:-18px 0 35px #0007;overflow:auto;transform:translateX(105%);transition:transform .22s ease}.md-drawer.open{transform:translateX(0)}
  .md-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid #39404d;margin-bottom:12px}.md-drawer-head h2{margin:0;font-size:25px}.md-close{border:1px solid #596171;background:#222a39;color:#fff;border-radius:4px;padding:5px 10px;cursor:pointer}
  .md-stat-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:10px 4px;border-bottom:1px solid #ffffff14;font-size:16px}.md-stat-row b{font-variant-numeric:tabular-nums}.md-stat-sub{margin:18px 0 7px;color:#b9c4d4;font-size:12px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
  .md-event{display:grid;grid-template-columns:42px 26px minmax(0,1fr);gap:8px;align-items:start;padding:9px 0;border-bottom:1px solid #ffffff13;font-size:14px}.md-event time{color:#c6a5ff;font-weight:900}.md-event p{margin:0;line-height:1.35}.md-event-icon{font-size:18px}
  .md-modal-wrap{position:absolute;z-index:20;inset:0;display:flex;align-items:center;justify-content:center;padding:clamp(10px,3vw,42px);background:#03050bc9;backdrop-filter:blur(5px)}.md-modal-wrap[hidden]{display:none}.md-modal{width:min(940px,96vw);max-height:90vh;overflow:auto;background:#191e29;border:1px solid #606a7b;box-shadow:0 25px 90px #000b;border-radius:8px;color:#f5f6fa}
  .md-modal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 20px;background:#292f3d;border-bottom:1px solid #454f60}.md-modal-head h2{margin:0;font-size:clamp(20px,2.2vw,31px)}.md-modal-body{padding:18px 20px}.md-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px;border-top:1px solid #3b4453;background:#151923}
  .md-btn{border:1px solid #586277;background:#252e3e;color:#fff;border-radius:4px;padding:9px 14px;font-weight:750;cursor:pointer}.md-btn:hover{filter:brightness(1.2)}.md-btn.primary{background:#8b37df;border-color:#c08dff}.md-btn.blue{background:#2e6596;border-color:#73a9d5}.md-btn.danger{background:#80354a;border-color:#b96578}.md-btn.selected{outline:2px solid #cba1ff;background:#49306d}
  .md-choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}.md-choice{display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;width:100%;min-height:44px}
  .md-player-detail{display:grid;grid-template-columns:130px minmax(0,1fr);gap:18px}.md-player-portrait{display:grid;place-items:center;aspect-ratio:4/5;background:linear-gradient(145deg,#405c77,#151b2b);border:3px solid #8fb4d1;border-radius:6px;font-size:42px;font-weight:900}.md-player-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.md-player-kpi{padding:9px;background:#242c3a;border:1px solid #3a4659;border-radius:4px}.md-player-kpi small{display:block;color:#aab4c2;font-size:11px}.md-player-kpi b{display:block;margin-top:4px;font-size:18px}
  .md-attribute-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.md-attribute-group{background:#202735;border:1px solid #3a4453;border-radius:4px;padding:10px}.md-attribute-group h4{margin:0 0 8px;color:#c7a2ff}.md-attribute{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid #ffffff0e;font-size:12px}.md-attribute b{font-variant-numeric:tabular-nums}
  .md-sub-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px}.md-sub-list{display:grid;gap:6px;align-content:start}.md-sub-player{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:9px;text-align:left;width:100%;padding:8px 10px}.md-sub-shirt{width:28px;height:30px;display:grid;place-items:center;border-radius:5px;background:#386e9d;font-size:11px;font-weight:900}.md-sub-player small{display:block;color:#abb5c6}.md-sub-help{color:#bbc5d3;line-height:1.5;margin:0 0 12px}
  .md-tactic-block{margin-bottom:17px}.md-tactic-block h3{margin:0 0 8px;color:#cda7ff;font-size:15px;text-transform:uppercase;letter-spacing:.08em}.md-role-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.md-role-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;background:#222a38;border:1px solid #394458;border-radius:4px}.md-role-row select{max-width:58%;background:#101722;color:#fff;border:1px solid #59667a;border-radius:3px;padding:6px}
  .md-halftime{text-align:center;padding:10px 0 4px}.md-halftime-score{font-size:42px;font-weight:950;margin:10px 0}.md-halftime-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:18px}.md-halftime-choice{padding:18px 10px;min-height:100px}
  .fm26-matchday-pre{display:grid;grid-template-rows:clamp(64px,9vh,98px) minmax(0,1fr) clamp(62px,8vh,86px);background:linear-gradient(145deg,#edf0f3,#dfe4e9);color:#17202c}
  .md-pre-top{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px clamp(12px,2vw,34px);background:#101522;color:#fff}
  .md-pre-brand{font-size:clamp(15px,1.7vw,24px);font-weight:900;letter-spacing:.08em}.md-pre-sub{font-size:12px;color:#b7c0ce}
  .md-pre-match{display:flex;align-items:center;justify-content:center;gap:clamp(12px,3vw,55px);min-width:0}.md-pre-club{display:flex;align-items:center;gap:10px;font-size:clamp(16px,2vw,29px);font-weight:900}.md-pre-club .cr{width:clamp(28px,4vw,54px)!important;height:clamp(28px,4vw,54px)!important}.md-pre-vs{font-size:18px;color:#afb8c4}
  .md-pre-content{display:grid;grid-template-columns:minmax(0,1fr) minmax(270px,27%);gap:clamp(12px,2vw,28px);min-height:0;padding:clamp(10px,1.8vw,28px);overflow:hidden}
  .md-pre-field{position:relative;min-width:0;min-height:0;border:1px solid #c6ccd2;border-radius:6px;background:linear-gradient(180deg,#fff,#edf0f3);box-shadow:0 8px 25px #10182812;overflow:hidden}
  .md-pre-field:before{content:'';position:absolute;inset:4%;border:2px solid #ccd4d9;border-radius:12px}.md-pre-field:after{content:'';position:absolute;left:4%;right:4%;top:50%;border-top:2px solid #d4dade}
  .md-pre-center{position:absolute;left:50%;top:50%;width:18%;aspect-ratio:1;border:2px solid #d4dade;border-radius:50%;transform:translate(-50%,-50%)}
  .md-pre-player{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);display:grid;justify-items:center;gap:2px;width:clamp(68px,8.6vw,125px);padding:5px 4px;background:#ffffffd9;border:1px solid #d8dde3;border-radius:5px;box-shadow:0 4px 12px #1420331a;cursor:pointer;color:#1d2633;z-index:2}
  .md-pre-player.selected{outline:3px solid #9b4de5;z-index:4}.md-pre-avatar{width:clamp(27px,3.3vw,48px);height:clamp(27px,3.3vw,48px);display:grid;place-items:center;border-radius:50%;background:linear-gradient(140deg,#4d7597,#172d46);color:#fff;font-size:clamp(11px,1.05vw,15px);font-weight:900;border:2px solid #fff;box-shadow:0 2px 6px #0003}
  .md-pre-player b{font-size:clamp(9px,.85vw,13px);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.md-pre-player small{font-size:clamp(8px,.75vw,11px);color:#6d7885}
  .md-pre-bench{min-width:0;min-height:0;display:flex;flex-direction:column;background:#eef2f7;border:1px solid #c8d0da;border-radius:6px;overflow:hidden}.md-pre-bench-head{padding:14px 16px;background:#dae5ef;color:#243246;font-weight:900;font-size:clamp(15px,1.4vw,21px)}.md-pre-bench-list{overflow:auto;padding:8px;display:grid;gap:6px}
  .md-pre-bench-player{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px;background:#fff;border:1px solid #d6dde5;border-radius:4px;text-align:left;color:#202a36;cursor:pointer}.md-pre-bench-player:hover{border-color:#9b4de5}.md-pre-bench-player.selected{outline:2px solid #9b4de5}.md-pre-number{display:grid;place-items:center;width:31px;height:34px;background:#416f95;color:#fff;border-radius:4px;font-weight:900}.md-pre-bench-player small{display:block;color:#778393}
  .md-pre-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px clamp(12px,2vw,34px);background:#101522;color:#fff}.md-pre-bottom select{background:#252e3c;color:#fff;border:1px solid #5a6677;border-radius:4px;padding:9px}.md-pre-actions{display:flex;gap:8px}
  @media(max-width:760px){.md-topbar{grid-template-columns:42px 74px minmax(110px,1fr) 106px}.md-match-progress{display:none}.md-score-team{font-size:13px;padding:0 4px;gap:3px}.md-score-number{font-size:21px;padding:0 6px}.md-gear{display:none}.md-toolbar .md-tool{padding:0 7px;font-size:12px}.md-bottom{grid-template-columns:42px minmax(0,1fr) auto}.md-field-stage{background:#659663}.md-stand,.md-barrier{display:none}.md-pitch{left:2%;right:2%;top:3%;bottom:3%}.md-drawer{width:min(92vw,410px)}.md-pre-content{grid-template-columns:minmax(0,1fr) 38%;padding:7px;gap:7px}.md-pre-player{width:60px}.md-pre-bench-head{padding:8px;font-size:14px}.md-pre-bench-player{grid-template-columns:27px minmax(0,1fr);padding:5px}.md-pre-number{width:25px;height:28px}.md-pre-bench-player>strong{display:none}.md-pre-club{font-size:14px}.md-role-list{grid-template-columns:1fr}}
  @media(max-width:480px){.md-topbar{grid-template-columns:34px 62px minmax(90px,1fr) 90px}.md-clock small{display:none}.md-pause-btn{font-size:13px}.md-score-team .cr{display:none}.md-pre-top{padding:6px}.md-pre-brand{font-size:14px}.md-pre-sub{display:none}.md-pre-match{gap:8px}.md-pre-club{font-size:11px;gap:3px}.md-pre-club .cr{width:22px!important;height:22px!important}.md-pre-content{grid-template-columns:1fr;grid-template-rows:minmax(260px,1fr) minmax(110px,28%);overflow:auto}.md-pre-bench-list{grid-template-columns:repeat(2,minmax(0,1fr));align-content:start}.md-pre-field{min-height:300px}.md-pre-player{width:56px}.md-player-detail{grid-template-columns:80px minmax(0,1fr)}.md-player-portrait{font-size:28px}.md-player-meta,.md-attribute-grid{grid-template-columns:1fr 1fr}.md-sub-layout{grid-template-columns:1fr}.md-halftime-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function getLineup() {
    const validIds = Array.isArray(S.lineup) ? S.lineup : [];
    if (validIds.length === 11) {
      const selected = validIds.map(id => (S.sq || []).find(p => Number(p.id) === Number(id))).filter(Boolean);
      if (selected.length === 11 && new Set(selected.map(p => p.id)).size === 11) return selected;
    }
    return typeof xi === 'function' ? xi().slice(0, 11) : [];
  }

  function playerById(id) {
    return (S.sq || []).find(p => Number(p.id) === Number(id)) || null;
  }

  function playerRole(player) {
    return (S.playerRoles && S.playerRoles[player.id]) || (typeof ROLE === 'object' && ROLE[player.pos]) || 'Rôle standard';
  }

  const ROLE_OPTIONS = {
    GK:['Gardien','Gardien libéro'],
    DR:['Latéral','Latéral inversé','Piston','Arrière latéral inversé'],
    DL:['Latéral','Latéral inversé','Piston','Arrière latéral inversé'],
    DC:['Défenseur central','Défenseur relanceur','Défenseur central élargi','Stoppeur'],
    DM:['Milieu défensif','Sentinelle','Récupérateur','Meneur de jeu en retrait'],
    MC:['Milieu central','Box-to-box','Mezzala','Meneur de jeu avancé'],
    AMC:['Meneur de jeu avancé','Milieu offensif','Deuxième attaquant'],
    AMR:['Ailier','Ailier intérieur','Attaquant intérieur'],
    AML:['Ailier','Ailier intérieur','Attaquant intérieur'],
    ST:['Attaquant avancé','Attaquant pivot','Faux neuf','Renard des surfaces']
  };

  function makePreMarkup() {
    const f = typeof nxt === 'function' ? nxt() : null;
    if (!f) return '<div class="fm26-matchday-pre"><div class="md-pre-top"><b>FM26 · JOUR DE MATCH</b></div><div class="md-pre-content"><section class="md-pre-field">Aucun match programmé</section></div><div class="md-pre-bottom"></div></div>';
    const opponent = f.home === S.club ? f.away : f.home;
    const lineup = getLineup();
    const ids = lineup.map(p => p.id);
    const bench = (S.sq || []).filter(p => !ids.some(id => Number(id) === Number(p.id)) && !(p.inj > 0) && !(p.susp > 0));
    const form = (typeof FM === 'object' && FM[S.tc && S.tc.f]) || FM['4-3-3'];
    const active = selectedPreSlot == null ? -1 : selectedPreSlot;
    const pitchPlayers = lineup.map((p, i) => {
      const pos = form[i] || form[form.length - 1];
      const x = clamp(pos[0], 7, 93), y = clamp(pos[1], 9, 91);
      return '<button type="button" class="md-pre-player ' + (active === i ? 'selected' : '') + '" style="--x:' + x + '%;--y:' + y + '%" data-md-action="pre-slot" data-slot="' + i + '" title="Sélectionner ' + esc(p.name) + '">' +
        '<span class="md-pre-avatar">' + esc(initials(p.name)) + '</span><b>' + esc(p.name.split(' ').slice(-1)[0]) + '</b><small>' + esc(p.pos) + ' · N° ' + esc(p.no) + '</small></button>';
    }).join('');
    const benchRows = bench.map(p => '<button class="md-pre-bench-player ' + (active >= 0 && selectedPreSlot === active && miniMessage === String(p.id) ? 'selected' : '') + '" type="button" data-md-action="pre-bench" data-player="' + esc(p.id) + '"><span class="md-pre-number">' + esc(p.no) + '</span><span><b>' + esc(p.name) + '</b><small>' + esc(p.pos) + ' · Note ' + esc(p.ovr) + ' · ' + esc(p.cond) + '%</small></span><strong>' + esc(Number(p.form || 0).toFixed(1)) + '</strong></button>').join('');
    return '<main class="fm26-matchday-pre">' +
      '<header class="md-pre-top"><div><div class="md-pre-brand">FM26 · COMPOSITIONS</div><div class="md-pre-sub">Prépare ton onze de départ avant le coup d’envoi</div></div>' +
      '<div class="md-pre-match"><div class="md-pre-club">' + crest(f.home, 42) + '<span>' + esc(f.home) + '</span></div><b class="md-pre-vs">VS</b><div class="md-pre-club">' + crest(f.away, 42) + '<span>' + esc(f.away) + '</span></div></div>' +
      '<div class="md-pre-sub">' + esc(f.comp || S.lg) + ' · ' + esc(typeof fd === 'function' ? fd(f.date) : f.date) + '</div></header>' +
      '<section class="md-pre-content"><div class="md-pre-field"><div class="md-pre-center"></div>' + pitchPlayers + '</div>' +
      '<aside class="md-pre-bench"><div class="md-pre-bench-head">REMPLAÇANTS <small style="display:block;font-size:11px;font-weight:500;opacity:.7">Clique d’abord un titulaire, puis son remplaçant</small></div><div class="md-pre-bench-list">' + (benchRows || '<p style="padding:10px">Aucun remplaçant disponible.</p>') + '</div></aside></section>' +
      '<footer class="md-pre-bottom"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><label for="md-pre-formation">Formation</label><select id="md-pre-formation" data-md-change="formation">' + Object.keys(FM).map(k => '<option value="' + esc(k) + '" ' + (S.tc.f === k ? 'selected' : '') + '>' + esc(k) + '</option>').join('') + '</select><span style="font-size:12px;color:#c3ccda">' + esc(miniMessage || (selectedPreSlot == null ? 'Onze de départ' : 'Titulaire sélectionné : ' + (lineup[active] ? lineup[active].name : ''))) + '</span></div>' +
      '<div class="md-pre-actions"><button class="md-btn" type="button" data-md-action="pre-clear">Réinitialiser</button><button class="md-btn primary" type="button" data-md-action="pre-start">GO TO MATCH →</button></div></footer>' +
      '</main>';
  }

  function markerMarkup(side) {
    const formation = (typeof FM === 'object' && FM[S.tc && S.tc.f]) || FM['4-3-3'];
    const f = M && M.f;
    const team = side === 0 ? f.home : f.away;
    const userTeam = team === S.club;
    const rows = userTeam ? formation : FM['4-3-3'];
    return rows.map((spot, i) => {
      const x = 4 + (100 - Number(spot[1])) * .42;
      const mirrored = side === 0 ? x : 100 - x;
      const squad = userTeam ? getLineup() : (typeof oppXI === 'function' ? oppXI(team) : []);
      const p = squad[i] || {no:i+1,name:team + ' ' + (i+1),pos:spot[2],id:''};
      return '<button type="button" class="dt ' + (side === 0 ? 'hm' : 'aw') + '" data-x="' + mirrored + '" data-y="' + spot[0] + '" data-md-action="player-detail" data-player-id="' + esc(p.id) + '" data-side="' + side + '" data-slot="' + i + '" title="' + esc(p.name) + '">' + esc(p.no || i+1) + '</button>';
    }).join('');
  }

  function modalContent() {
    if (!M || !M.f) return '';
    if (modalMode === 'subs') {
      const lineup = currentXI();
      const ids = lineup.map(p => p.id);
      const bench = (S.sq || []).filter(p => !ids.some(id => Number(id) === Number(p.id)) && !(p.inj > 0) && !(p.susp > 0));
      return '<div class="md-modal-head"><h2>Remplacements</h2><button class="md-close" data-md-action="close-modal">✕</button></div><div class="md-modal-body"><p class="md-sub-help">Choisis un titulaire à sortir, puis le joueur qui entre. Cinq changements maximum sont disponibles.</p><div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:12px"><b>Changements utilisés</b><b>' + (M.subsUsed || 0) + ' / 5</b></div><div class="md-sub-layout"><section><h3>Onze titulaire</h3><div class="md-sub-list">' + lineup.map((p, i) => '<button class="md-btn md-sub-player ' + (selectedSubSlot === i ? 'selected' : '') + '" data-md-action="sub-slot" data-slot="' + i + '"><span class="md-sub-shirt">' + esc(p.no || i+1) + '</span><span><b>' + esc(p.name) + '</b><small>' + esc(p.pos) + ' · ' + esc(p.cond) + '%</small></span><strong>' + esc(Number(p.form || 0).toFixed(1)) + '</strong></button>').join('') + '</div></section><section><h3>Banc</h3><div class="md-sub-list">' + (bench.length ? bench.map(p => '<button class="md-btn md-sub-player" data-md-action="sub-player" data-player="' + esc(p.id) + '"><span class="md-sub-shirt" style="background:#8a6a34">' + esc(p.no) + '</span><span><b>' + esc(p.name) + '</b><small>' + esc(p.pos) + ' · ' + esc(p.cond) + '%</small></span><strong>' + esc(Number(p.form || 0).toFixed(1)) + '</strong></button>').join('') : '<p>Aucun joueur disponible sur le banc.</p>') + '</div></section></div></div><div class="md-modal-foot"><button class="md-btn" data-md-action="close-modal">Fermer</button></div>';
    }
    if (modalMode === 'tactics') {
      const formations = Object.keys(FM);
      const styles = ['Control Possession','Tiki-Taka','Gegenpress','Wing Play','Counter-Attack','Route One','Clean Sheet','Catenaccio','Low Block'];
      const mentalities = ['Cautious','Balanced','Positive','Attacking'];
      const lineup = currentXI();
      const roles = lineup.map(p => {
        const options = ROLE_OPTIONS[p.pos] || ['Rôle standard'];
        return '<div class="md-role-row"><span><b>' + esc(p.name) + '</b><small style="display:block;color:#aeb8c6">' + esc(p.pos) + '</small></span><select data-md-role="' + esc(p.id) + '">' + options.map(role => '<option ' + (playerRole(p) === role ? 'selected' : '') + '>' + esc(role) + '</option>').join('') + '</select></div>';
      }).join('');
      const choices = (key, values, current) => '<div class="md-choice-grid">' + values.map(v => '<button class="md-btn md-choice ' + (current === v ? 'selected' : '') + '" data-md-action="tactic-setting" data-key="' + key + '" data-value="' + esc(v) + '">' + esc(v) + '</button>').join('') + '</div>';
      return '<div class="md-modal-head"><h2>Consignes tactiques</h2><button class="md-close" data-md-action="close-modal">✕</button></div><div class="md-modal-body"><div class="md-tactic-block"><h3>Formation</h3>' + choices('f', formations, S.tc.f) + '</div><div class="md-tactic-block"><h3>Mentalité</h3>' + choices('m', mentalities, S.tc.m) + '</div><div class="md-tactic-block"><h3>Style de jeu</h3>' + choices('s', styles, S.tc.s || 'Control Possession') + '</div><div class="md-tactic-block"><h3>Organisation défensive</h3>' + choices('defence', ['Bloc bas','Bloc médian','Bloc haut'], S.tc.defence || 'Bloc médian') + '</div><div class="md-tactic-block"><h3>Rôles individuels</h3><div class="md-role-list">' + roles + '</div></div><p class="md-sub-help">Les changements de formation, de mentalité et de style sont transmis au moteur de match existant. Les rôles sont enregistrés dans la carrière pour tes prochaines compositions.</p></div><div class="md-modal-foot"><button class="md-btn primary" data-md-action="close-modal">Terminer</button></div>';
    }
    if (modalMode === 'player') {
      const p = playerById(modalPlayerId);
      if (!p) return '<div class="md-modal-head"><h2>Fiche joueur</h2><button class="md-close" data-md-action="close-modal">✕</button></div><div class="md-modal-body">Joueur non disponible.</div>';
      const categories = typeof AT === 'object' ? AT : {};
      const attrGrid = Object.entries(categories).map(([group, attrs]) => '<section class="md-attribute-group"><h4>' + esc(group) + '</h4>' + attrs.slice(0, 9).map(key => '<div class="md-attribute"><span>' + esc(key) + '</span><b>' + esc(p.a && p.a[key] != null ? p.a[key] : '—') + '</b></div>').join('') + '</section>').join('');
      return '<div class="md-modal-head"><h2>Profil joueur · ' + esc(p.name) + '</h2><button class="md-close" data-md-action="close-modal">✕</button></div><div class="md-modal-body"><div class="md-player-detail"><div class="md-player-portrait">' + esc(initials(p.name)) + '</div><div><div style="color:#c19bff;font-size:12px;font-weight:900;letter-spacing:.14em">' + esc(p.pos) + ' · N° ' + esc(p.no) + '</div><h2 style="font-size:clamp(22px,2.5vw,35px);margin:6px 0">' + esc(p.name) + '</h2><p style="margin:0;color:#c2cad5">' + esc(p.age) + ' ans · ' + esc(p.nat || '—') + ' · ' + esc(S.club) + '</p><p style="margin:8px 0;color:#b9c4d3">Rôle : ' + esc(playerRole(p)) + '</p><div class="md-player-meta"><div class="md-player-kpi"><small>NOTE</small><b>' + esc(p.ovr) + ' / 100</b></div><div class="md-player-kpi"><small>FORME</small><b>' + esc(Number(p.form || 0).toFixed(1)) + '</b></div><div class="md-player-kpi"><small>CONDITION</small><b>' + esc(p.cond) + '%</b></div><div class="md-player-kpi"><small>VALEUR</small><b>' + esc(p.val) + ' M€</b></div><div class="md-player-kpi"><small>SALAIRE</small><b>' + esc(Number(p.sal || 0).toLocaleString('fr-FR')) + ' €/sem.</b></div><div class="md-player-kpi"><small>CONTRAT</small><b>30/06/' + esc(p.end || '—') + '</b></div></div></div></div><div class="md-attribute-grid">' + attrGrid + '</div></div><div class="md-modal-foot"><button class="md-btn primary" data-md-action="close-modal">Fermer</button></div>';
    }
    if (modalMode === 'settings') {
      return '<div class="md-modal-head"><h2>Paramètres du match</h2><button class="md-close" data-md-action="close-modal">✕</button></div><div class="md-modal-body"><div class="md-tactic-block"><h3>Vitesse de simulation</h3><div class="md-choice-grid">' + [[240,'Lente'],[170,'Normale'],[100,'Rapide'],[45,'Très rapide']].map(x => '<button class="md-btn md-choice ' + (speedValue === x[0] ? 'selected' : '') + '" data-md-action="speed" data-speed="' + x[0] + '">' + x[1] + '</button>').join('') + '</div></div><div class="md-tactic-block"><h3>Reprendre</h3><p class="md-sub-help">La simulation utilise les statistiques, la forme, la condition, la mentalité et le style de jeu de ta carrière actuelle.</p></div></div><div class="md-modal-foot"><button class="md-btn primary" data-md-action="close-modal">Terminer</button></div>';
    }
    return '';
  }

  let modalPlayerId = null;
  function matchMarkup() {
    if (!M || !M.f) return '<main class="fm26-matchday"><div class="md-topbar"><b style="padding:18px">FM26 · Aucun match en cours</b></div></main>';
    const f = M.f;
    const homeColor = teamColor(f.home), awayColor = teamColor(f.away);
    const homeScore = Number(M.h) || 0, awayScore = Number(M.a) || 0;
    const modal = modalMode ? '<div class="md-modal-wrap"><section class="md-modal">' + modalContent() + '</section></div>' : '<div class="md-modal-wrap" hidden></div>';
    const events = (M.ev || []).slice(0, 1)[0];
    const paused = !!M.p;
    const isHalfTime = !!(M.halftimeShown && !M.halftimeTalked && !M.done);
    const halfOverlay = isHalfTime ? '<div class="md-modal-wrap"><section class="md-modal"><div class="md-modal-head"><h2>MI-TEMPS</h2></div><div class="md-modal-body md-halftime"><p style="color:#c2ccda;margin:0">' + esc(f.home) + ' · ' + esc(f.away) + '</p><div class="md-halftime-score">' + homeScore + ' – ' + awayScore + '</div><h3>Que dis-tu à ton équipe ?</h3><div class="md-halftime-grid"><button class="md-btn md-halftime-choice" data-md-action="team-talk" data-talk="Demandant"><b>Exigeant</b><small style="display:block;margin-top:8px">Réclamer une réaction</small></button><button class="md-btn md-halftime-choice selected" data-md-action="team-talk" data-talk="Balanced"><b>Équilibré</b><small style="display:block;margin-top:8px">Rester concentré</small></button><button class="md-btn md-halftime-choice" data-md-action="team-talk" data-talk="Relaxed"><b>Rassurant</b><small style="display:block;margin-top:8px">Redonner confiance</small></button></div></div></section></div>' : '';
    const drawerOpen = !!drawerMode;
    return '<main class="fm26-matchday"><header class="md-topbar">' +
      '<button class="md-icon-btn md-menu-btn" data-md-action="menu" aria-label="Menu">☰</button>' +
      '<div class="md-clock"><small>MIN</small><span id="tm">' + String(M.min || 0).padStart(2, '0') + ':00</span></div>' +
      '<div class="md-scoreline"><div class="md-score-team home" style="background:' + homeColor + '">' + crest(f.home, 38) + '<span>' + esc(f.home) + '</span></div><div class="md-score-number" id="sc">' + homeScore + ' – ' + awayScore + '</div><div class="md-score-team away" style="background:' + awayColor + '"><span>' + esc(f.away) + '</span>' + crest(f.away, 38) + '</div></div>' +
      '<div class="md-match-progress">' + Array.from({length:10}, (_,i) => '<i class="md-progress-dot ' + (i < Math.floor((M.min || 0)/9) ? 'done' : (i === Math.floor((M.min || 0)/9) ? 'live' : '')) + '"></i>').join('') + '</div>' +
      '<button class="md-icon-btn md-gear" data-md-action="settings" aria-label="Paramètres">⚙</button>' +
      '<button class="md-pause-btn ' + (paused ? 'paused' : '') + '" id="md-pause" data-md-action="pause">' + (M.done ? 'Terminé' : paused ? 'Reprendre ▶' : 'Pause Ⅱ') + '</button></header>' +
      '<section class="md-field-stage"><div class="md-stand left"></div><div class="md-stand right"></div><div class="md-barrier left"></div><div class="md-barrier right"></div>' +
      '<div class="md-pitch pitch hz" id="pt"><s class="bx l"></s><s class="bx r"></s><s class="cc"></s><i class="goalbox left"></i><i class="goalbox right"></i><i class="goal left"></i><i class="goal right"></i><i class="penalty-spot left"></i><i class="penalty-spot right"></i>' +
      markerMarkup(0) + markerMarkup(1) + '<i class="dt ref">R</i><i class="dt ass" style="left:28%;top:2%">A</i><i class="dt ass" style="left:72%;top:98%">A</i><i class="ball" id="bl" style="left:' + clamp(M.bx || 50, 2, 98) + '%;top:' + clamp(M.by || 50, 2, 98) + '%"></i><div id="gc" class="md-goal-card"><span></span></div></div></section>' +
      '<footer class="md-bottom"><button class="md-bottom-icon" data-md-action="stats" title="Statistiques">▤</button><div class="md-commentary" id="cm">' + esc(M.cm || 'Coup d’envoi') + '</div><div class="md-toolbar"><button class="md-tool" data-md-action="events">▣ <strong>Temps forts</strong></button><button class="md-tool" data-md-action="subs" ' + (M.done ? 'disabled' : '') + '>⇄ <strong>' + Math.max(0, 5 - (M.subsUsed || 0)) + '/5</strong></button><button class="md-tool" data-md-action="tactics"><strong class="purple">' + esc(S.tc.m || 'Balanced') + '</strong></button>' + (M.done ? '<button class="md-tool md-final-btn" data-md-action="end-report">Bilan du match →</button>' : '') + '</div></footer>' +
      '<aside class="md-drawer ' + (drawerOpen ? 'open' : '') + '"><div class="md-drawer-head"><h2>' + (drawerMode === 'events' ? 'Temps forts' : 'Statistiques du match') + '</h2><button class="md-close" data-md-action="close-drawer">✕</button></div>' +
      '<div id="ms" ' + (drawerMode === 'events' ? 'style="display:none"' : '') + '></div><div id="evcount" class="md-stat-sub" ' + (drawerMode === 'stats' ? 'style="display:none"' : '') + '>' + (M.ev || []).length + ' événement(s)</div><div id="evs" ' + (drawerMode === 'stats' ? 'style="display:none"' : '') + '></div></aside>' + modal + halfOverlay +
      '</main>';
  }

  V.pre = makePreMarkup;
  V.match = matchMarkup;

  // Les onze choisis avant le match et les changements en cours sont utilisés par le moteur.
  const baseXI = xi;
  xi = function () {
    if (M && Array.isArray(M.matchXI) && M.matchXI.length === 11) return M.matchXI.slice();
    const chosen = Array.isArray(S.lineup) ? S.lineup.map(id => playerById(id)).filter(Boolean) : [];
    if (chosen.length === 11 && new Set(chosen.map(p => p.id)).size === 11) return chosen;
    return baseXI.apply(this, arguments);
  };

  const baseStart = startMatch;
  startMatch = function () {
    selectedPreSlot = null;
    modalMode = '';
    drawerMode = '';
    const result = baseStart.apply(this, arguments);
    if (M) {
      M.matchXI = Array.isArray(S.lineup) && S.lineup.length === 11 ? S.lineup.map(id => playerById(id)).filter(Boolean) : baseXI();
      M.matchXI = M.matchXI.slice(0, 11);
      M.subsUsed = 0;
      M.halftimeShown = false;
      M.halftimeTalked = false;
      M.matchSpeed = speedValue;
      miniMessage = '';
      if (M.stats) M.lastStatsSnapshot = null;
      M.sp = speedValue;
      clearInterval(T);
      T = setInterval(tick, speedValue);
      try { sv(); } catch (error) {}
      draw();
    }
    return result;
  };

  const baseTick = tick;
  tick = function () {
    if (!M || M.done || M.p) return baseTick.apply(this, arguments);
    const wasHalf = M.halftimeShown;
    const result = baseTick.apply(this, arguments);
    if (M && !M.done && Number(M.min) >= 45 && !wasHalf && !M.halftimeShown && !M.halftimeTalked) {
      M.halftimeShown = true;
      M.p = 1;
      clearInterval(T);
      render();
    }
    return result;
  };

  function positionsFor(side, index) {
    const rows = (isUserSide(side) ? FM[S.tc.f] : FM['4-3-3']) || FM['4-3-3'];
    const spot = rows[index] || rows[rows.length - 1];
    const baseX = 4 + (100 - Number(spot[1])) * .42;
    const x0 = side === 0 ? baseX : 100 - baseX;
    const y0 = Number(spot[0]);
    const poss = Number(M.possessionSide) === side;
    const zone = M.zone && Number(M.zone[side]) || 2;
    const advance = (zone - 2) * 3.1 * (side === 0 ? 1 : -1) * (poss ? 1 : .48);
    const bx = clamp(Number(M.bx) || 50, 0, 100), by = clamp(Number(M.by) || 50, 0, 100);
    const phase = Math.sin((Number(M.min) || 0) * .42 + index * 1.61) * 1.4;
    return { x: clamp(x0 + advance + (bx - x0) * .045, 3, 97), y: clamp(y0 + (by - y0) * .055 + phase, 4, 96) };
  }

  function updatePitch() {
    if (!M || !M.f) return;
    const pitch = document.getElementById('pt');
    if (!pitch) return;
    const homeXI = M.f.home === S.club ? currentXI() : (typeof oppXI === 'function' ? oppXI(M.f.home) : []);
    const awayXI = M.f.away === S.club ? currentXI() : (typeof oppXI === 'function' ? oppXI(M.f.away) : []);
    [0,1].forEach(side => {
      const elements = pitch.querySelectorAll(side === 0 ? '.dt.hm' : '.dt.aw');
      const squad = side === 0 ? homeXI : awayXI;
      elements.forEach((el, i) => {
        const p = squad[i] || {no:i+1,name:'Joueur '+(i+1)};
        const pos = positionsFor(side, i);
        el.style.left = pos.x + '%';
        el.style.top = pos.y + '%';
        el.style.right = 'auto';
        el.style.transition = 'left .48s cubic-bezier(.2,.7,.2,1),top .48s cubic-bezier(.2,.7,.2,1)';
        el.textContent = String(p.no || i + 1);
        el.title = (p.name || 'Joueur') + ' · ' + (p.pos || '—');
        el.dataset.playerId = p.id == null ? '' : p.id;
        el.dataset.slot = String(i);
        el.dataset.side = String(side);
      });
    });
    const ball = document.getElementById('bl');
    if (ball) { ball.style.left = clamp(M.bx || 50, 2, 98) + '%'; ball.style.top = clamp(M.by || 50, 2, 98) + '%'; }
    const ref = pitch.querySelector('.ref');
    if (ref) { ref.style.left = clamp((Number(M.bx)||50)*.91+4, 4, 96) + '%'; ref.style.top = clamp((Number(M.by)||50)+8, 5, 95) + '%'; }
    const nearest = Array.from(pitch.querySelectorAll('.dt.hm,.dt.aw')).sort((a,b) => {
      const dist = el => Math.pow(parseFloat(el.style.left)-Number(M.bx||50),2)+Math.pow(parseFloat(el.style.top)-Number(M.by||50),2);
      return dist(a)-dist(b);
    });
    pitch.querySelectorAll('.dt.hm,.dt.aw').forEach(el => el.classList.remove('bc'));
    if (nearest[0]) nearest[0].classList.add('bc');
  }

  function updateDraw() {
    if (!M || !M.f) return;
    const time = document.getElementById('tm');
    const score = document.getElementById('sc');
    const commentary = document.getElementById('cm');
    if (time) time.textContent = String(M.min || 0).padStart(2, '0') + ':00';
    if (score) score.textContent = (Number(M.h)||0) + ' – ' + (Number(M.a)||0);
    if (commentary) commentary.textContent = M.done ? 'Coup de sifflet final · ' + M.f.home + ' ' + M.h + ' – ' + M.a + ' ' + M.f.away : (M.cm || 'Le jeu se poursuit');
    const pause = document.getElementById('md-pause');
    if (pause) { pause.textContent = M.done ? 'Terminé' : M.p ? 'Reprendre ▶' : 'Pause Ⅱ'; pause.classList.toggle('paused', !!M.p); pause.disabled = !!M.done; }
    document.querySelectorAll('.md-progress-dot').forEach((dot, index) => {
      dot.classList.toggle('done', index < Math.floor((Number(M.min) || 0) / 9));
      dot.classList.toggle('live', !M.done && index === Math.floor((Number(M.min) || 0) / 9));
    });
    const card = document.getElementById('gc');
    if (card && Number(M.gt) > 0) { card.classList.add('on'); card.innerHTML = '<span>⚽</span><span>' + esc(M.gc || 'BUT !') + '</span>'; }
    else if (card) card.classList.remove('on');

    const statsNode = document.getElementById('ms');
    const eventsNode = document.getElementById('evs');
    if (statsNode) {
      const s = M.stats || {};
      const pair = key => (s[key] || [0,0]);
      const rows = [
        ['Possession', (Number(M.ps)||50) + '% – ' + (100-(Number(M.ps)||50)) + '%'],
        ['Tirs', (M.sh||[0,0])[0] + ' – ' + (M.sh||[0,0])[1]],
        ['Tirs cadrés', pair('shotsOnTarget')[0] + ' – ' + pair('shotsOnTarget')[1]],
        ['Buts attendus (xG)', (pair('xg')[0]||0).toFixed(2) + ' – ' + (pair('xg')[1]||0).toFixed(2)],
        ['Passes réussies', pair('completed')[0] + '/' + pair('passes')[0] + ' – ' + pair('completed')[1] + '/' + pair('passes')[1]],
        ['Corners', pair('corners')[0] + ' – ' + pair('corners')[1]],
        ['Fautes', pair('fouls')[0] + ' – ' + pair('fouls')[1]],
        ['Cartons', (pair('yellow')[0] + pair('red')[0]) + ' – ' + (pair('yellow')[1] + pair('red')[1])]
      ];
      statsNode.innerHTML = rows.map(row => '<div class="md-stat-row"><span>' + esc(row[0]) + '</span><b>' + esc(row[1]) + '</b></div>').join('');
    }
    if (eventsNode) {
      const list = (M.ev || []).slice(0, 22);
      eventsNode.innerHTML = list.length ? list.map(ev => '<div class="md-event"><time>' + esc(ev.m) + "'" + '</time><span class="md-event-icon">' + esc(ev.k) + '</span><p>' + esc(ev.t) + '</p></div>').join('') : '<p style="color:#aeb9c8">Aucun événement important pour le moment.</p>';
    }
    const count = document.getElementById('evcount');
    if (count) count.textContent = (M.ev || []).length + ' événement(s)';
    updatePitch();
  }

  const baseEndMatch = endMatch;
  endMatch = function () {
    const result = baseEndMatch.apply(this, arguments);
    if (S && S.view === 'match') render();
    return result;
  };

  const baseDraw = draw;
  draw = function () {
    try { baseDraw.apply(this, arguments); }
    catch (error) { console.warn('[FM26] Rendu matchday secondaire :', error); }
    try { updateDraw(); }
    catch (error) { console.warn('[FM26] Mise à jour de l’affichage du match ignorée :', error); }
  };

  function setMatchStage() {
    const active = !!(S && (S.view === 'match' || S.view === 'pre'));
    document.body.classList.toggle('fm26-matchday-active', active);
  }

  function pauseAndRender() {
    if (M && !M.done && !M.p) {
      M.p = 1;
      clearInterval(T);
    }
    render();
  }

  function changeSpeed(value) {
    speedValue = Number(value) || 170;
    if (M) M.matchSpeed = speedValue;
    if (M && !M.done && !M.p) {
      clearInterval(T);
      T = setInterval(tick, speedValue);
    }
    render();
  }

  function closeModal() { modalMode = ''; modalPlayerId = null; render(); }
  function openModal(name) { modalMode = name; drawerMode = ''; if (name === 'subs') selectedSubSlot = null; if (M && !M.done && !M.p) pauseAndRender(); else render(); }

  function onClick(event) {
    const button = event.target.closest('[data-md-action]');
    if (!button) return;
    const action = button.dataset.mdAction;
    if (action === 'pre-slot') {
      selectedPreSlot = Number(button.dataset.slot);
      miniMessage = 'Titulaire sélectionné : ' + (getLineup()[selectedPreSlot]?.name || '');
      render();
    } else if (action === 'pre-bench') {
      const player = playerById(button.dataset.player);
      if (!player || selectedPreSlot == null) { miniMessage = 'Sélectionne d’abord un titulaire sur le terrain.'; render(); return; }
      const lineup = getLineup();
      const out = lineup[selectedPreSlot];
      if (!out) return;
      lineup[selectedPreSlot] = player;
      S.lineup = lineup.map(p => p.id);
      selectedPreSlot = null;
      miniMessage = player.name + ' remplace ' + out.name + '.';
      try { sv(); } catch (error) {}
      render();
    } else if (action === 'pre-clear') {
      S.lineup = [];
      selectedPreSlot = null;
      miniMessage = 'Composition réinitialisée selon les meilleurs joueurs disponibles.';
      try { sv(); } catch (error) {}
      render();
    } else if (action === 'pre-start') {
      S.lineup = getLineup().map(p => p.id);
      try { sv(); } catch (error) {}
      startMatch();
    } else if (action === 'pause') {
      if (M && !M.done) {
        M.p = !M.p;
        clearInterval(T);
        if (!M.p) T = setInterval(tick, speedValue);
        render();
      }
    } else if (action === 'end-report') {
      if (M && M.done) { S.view = 'post'; render(); }
    } else if (action === 'settings') openModal('settings');
    else if (action === 'stats') { drawerMode = drawerMode === 'stats' ? '' : 'stats'; modalMode = ''; render(); }
    else if (action === 'events') { drawerMode = drawerMode === 'events' ? '' : 'events'; modalMode = ''; render(); }
    else if (action === 'close-drawer') { drawerMode = ''; render(); }
    else if (action === 'close-modal') closeModal();
    else if (action === 'menu') openModal('settings');
    else if (action === 'tactics') openModal('tactics');
    else if (action === 'subs') openModal('subs');
    else if (action === 'speed') { event.preventDefault(); changeSpeed(button.dataset.speed); }
    else if (action === 'sub-slot') { selectedSubSlot = Number(button.dataset.slot); render(); }
    else if (action === 'sub-player') {
      const incoming = playerById(button.dataset.player);
      if (!incoming || selectedSubSlot == null) { miniMessage = 'Choisis d’abord le joueur qui sort.'; return; }
      if ((M.subsUsed || 0) >= 5) { miniMessage = 'Les cinq changements ont déjà été utilisés.'; return; }
      const lineup = currentXI();
      const outgoing = lineup[selectedSubSlot];
      if (!outgoing) return;
      M.matchXI[selectedSubSlot] = incoming;
      M.subsUsed = (M.subsUsed || 0) + 1;
      selectedSubSlot = null;
      modalMode = '';
      M.ev.unshift({m:M.min,k:'⇄',t:incoming.name + ' remplace ' + outgoing.name + '.'});
      M.cm = incoming.name + ' entre en jeu.';
      updateDraw();
      render();
    } else if (action === 'player-detail') {
      const id = button.dataset.playerId;
      if (id == null || id === '') return;
      modalPlayerId = id;
      openModal('player');
    } else if (action === 'tactic-setting') {
      const key = button.dataset.key;
      const value = button.dataset.value;
      if (!key || !value || !S.tc) return;
      S.tc[key] = value;
      if (key === 'f' && M) { M.zone = M.zone || [2,2]; }
      try { sv(); } catch (error) {}
      if (M) M.ev.unshift({m:M.min,k:'⚙',t:'Consigne modifiée : ' + (key === 'm' ? 'mentalité' : key === 's' ? 'style de jeu' : key === 'f' ? 'formation' : 'organisation défensive') + ' — ' + value + '.'});
      render();
    } else if (action === 'team-talk') {
      const talk = button.dataset.talk;
      if (talk === 'Demandant') S.mor = clamp((Number(S.mor)||70)+1,0,100);
      if (talk === 'Relaxed') S.mor = clamp((Number(S.mor)||70)+2,0,100);
      if (M) {
        M.halftimeTalked = true;
        M.halftimeShown = true;
        M.p = 0;
        M.cm = talk === 'Demandant' ? 'Le manager demande une réaction.' : talk === 'Relaxed' ? 'Le manager rassure son équipe.' : 'Le manager demande de rester concentré.';
        M.ev.unshift({m:45,k:'🗣',t:M.cm});
        clearInterval(T);
        T = setInterval(tick, speedValue);
      }
      try { sv(); } catch (error) {}
      render();
    }
  }

  function onChange(event) {
    const el = event.target;
    if (el.matches('[data-md-change="formation"]')) {
      if (S && S.tc) { S.tc.f = el.value; S.lineup = []; selectedPreSlot = null; try { sv(); } catch (error) {} render(); }
    }
    if (el.matches('[data-md-role]')) {
      const id = el.dataset.mdRole;
      S.playerRoles = S.playerRoles || {};
      S.playerRoles[id] = el.value;
      try { sv(); } catch (error) {}
    }
  }

  const view = document.getElementById('vw');
  if (view) {
    view.addEventListener('click', onClick);
    view.addEventListener('change', onChange);
  }

  const baseRender = render;
  render = function () {
    const result = baseRender.apply(this, arguments);
    setMatchStage();
    if (S && S.view === 'match') updateDraw();
    return result;
  };

  window.addEventListener('resize', setMatchStage);
  window.FM26MatchDay = {
    openTactics: () => openModal('tactics'),
    openSubstitutions: () => openModal('subs'),
    openStats: () => { drawerMode = 'stats'; render(); },
    updateDraw,
    getLineup,
    get state() { return M; }
  };

  // L'ancienne interface reste disponible sur les autres écrans.
  setMatchStage();
})();