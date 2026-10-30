/* FM26 Screen Pack — interfaces adaptatives basées sur les données de la carrière. */
(function () {
  'use strict';
  if (window.FM26ScreenPack || typeof S === 'undefined' || typeof V === 'undefined') return;

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n || 0).toLocaleString('fr-FR');
  const portraitSrc = (p, index) => {
    if (p && p.photoUrl) return p.photoUrl;
    if (window.FM26UX && typeof window.FM26UX.portraitSvg === 'function') return window.FM26UX.portraitSvg(p ? Number(p.id) || 0 : (Number(index) || 0));
    return '';
  };
  const dateOf = v => {
    const d = new Date(String(v || S.date || '2026-08-01').slice(0,10) + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  };
  let section = 'coach';
  let selectedLabel = 'Accueil';
  let playerFilter = '';
  let mailListMode = false;
  let preSelectedSlot = null;

  const css = [
    "body.fm26-screenpack-active{overflow:hidden!important;background:#101014!important}",
    "body.fm26-screenpack-active #app:not(.hid){position:fixed!important;inset:0!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-height:0!important;display:grid!important;grid-template-columns:clamp(66px,10.5vw,190px) clamp(210px,18.2vw,330px) minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important;transform:none!important;transform-origin:top left!important;z-index:20!important;background:#111114!important;overflow:hidden!important}",
    "body.fm26-screenpack-active #side{grid-column:1!important;grid-row:1!important;position:relative!important;left:auto!important;top:auto!important;width:100%!important;height:100%!important;min-height:0!important;overflow:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:7px!important;padding:10px 7px 16px!important;background:#202433!important;border-right:1px solid #454654!important;z-index:5!important}",
    "body.fm26-screenpack-active #main{grid-column:3!important;grid-row:1!important;position:relative!important;inset:auto!important;width:auto!important;min-width:0!important;height:100%!important;min-height:0!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;background:radial-gradient(ellipse at 40% 35%,#343438 0%,#19191c 56%,#101014 100%)!important}",
    "body.fm26-screenpack-active #fm26-manager-sidebar{grid-column:2!important;grid-row:1!important;display:flex!important;flex-direction:column!important;min-width:0!important;min-height:0!important;overflow:hidden!important;background:#232735!important;border-right:3px solid #ae2af1!important;box-shadow:4px 0 18px #0004!important;z-index:4!important;color:#f4f4f6!important;font-family:Arial,sans-serif!important}",
    "body.fm26-screenpack-active #fm26-ref-menu{display:none!important}",
    "body.fm26-screenpack-active #hd{position:relative!important;flex:0 0 clamp(60px,11.3vh,104px)!important;width:100%!important;height:clamp(60px,11.3vh,104px)!important;min-height:0!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:clamp(4px,1vw,15px)!important;padding:7px clamp(8px,1.1vw,22px)!important;margin:0!important;background:#09090b!important;border-bottom:1px solid #ffffff12!important;overflow:hidden!important;z-index:3!important}",
    "body.fm26-screenpack-active #vw{position:relative!important;flex:1 1 auto!important;width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:auto!important;padding:0!important;margin:0!important;background:transparent!important}",
    "body.fm26-screenpack-active .fm26-ref-back{position:relative!important;left:auto!important;top:auto!important;width:100%!important;height:clamp(58px,11vh,105px)!important;flex:0 0 clamp(58px,11vh,105px)!important;padding:0!important}",
    "body.fm26-screenpack-active .fm26-ref-railbtn{position:relative!important;left:auto!important;top:auto!important;width:clamp(48px,5vw,86px)!important;height:clamp(48px,7.7vh,76px)!important;flex:0 0 clamp(48px,7.7vh,76px)!important;margin:0 auto!important;padding:0!important}",
    "body.fm26-screenpack-active .fm26-ref-railbtn:after{left:5px!important;right:5px!important;bottom:-4px!important}",
    "body.fm26-screenpack-active .fm26-ref-railbtn svg{width:clamp(28px,3vw,53px)!important;height:clamp(28px,3vw,53px)!important}",
    "body.fm26-screenpack-active .fm26-ref-clubbox{width:clamp(42px,4vw,72px)!important;height:clamp(40px,5.7vh,62px)!important}",
    "body.fm26-screenpack-active .fm26-ref-dot{position:relative!important;left:auto!important;top:auto!important;flex:0 0 10px!important;width:10px!important;height:10px!important}",
    "body.fm26-screenpack-active .fm26-ref-toolbar{position:relative!important;left:auto!important;top:auto!important;height:clamp(40px,7.8vh,70px)!important;flex:0 0 auto!important}",
    "body.fm26-screenpack-active .fm26-ref-info{order:1;width:clamp(42px,4vw,70px)!important}",
    "body.fm26-screenpack-active .fm26-ref-menu-button{order:2;width:clamp(45px,6.5vw,114px)!important}",
    "body.fm26-screenpack-active .fm26-ref-date{order:3;width:clamp(100px,12vw,213px)!important;min-width:0!important;font-size:clamp(10px,1vw,20px)!important}",
    "body.fm26-screenpack-active .fm26-ref-date b{font-size:clamp(12px,1.2vw,22px)!important}",
    "body.fm26-screenpack-active .fm26-ref-continue{order:4;width:clamp(110px,15vw,267px)!important;font-size:clamp(12px,1.5vw,26px)!important}",
    ".fm26-manager-head{height:clamp(64px,11.4vh,105px);flex:0 0 clamp(64px,11.4vh,105px);display:flex;align-items:center;gap:clamp(10px,1.4vw,28px);padding:8px clamp(10px,1.3vw,28px);border-bottom:1px solid #414451;min-width:0}",
    ".fm26-manager-head .cr{width:clamp(35px,3.4vw,48px)!important;height:clamp(35px,3.4vw,48px)!important;flex:0 0 auto}",
    ".fm26-manager-head strong{display:block;font-size:clamp(14px,1.45vw,27px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".fm26-manager-head small{display:block;font-size:clamp(11px,1.2vw,20px);margin-top:5px;color:#dedee7;white-space:nowrap}",
    ".fm26-manager-title{padding:clamp(10px,1.3vh,16px) 10px 9px;font-size:clamp(17px,1.6vw,29px);font-weight:900}",
    ".fm26-manager-links{overflow:auto;display:flex;flex-direction:column;min-height:0}",
    ".fm26-manager-link{width:100%;min-height:clamp(48px,7.6vh,74px);flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:6px clamp(9px,1vw,20px);background:transparent;border:0;border-top:1px solid #414451;color:#fff;text-align:left;font-size:clamp(12px,1.25vw,23px);font-weight:750;cursor:pointer}",
    ".fm26-manager-link:hover,.fm26-manager-link.selected{background:#ffffff13}.fm26-manager-link .mi{width:25px;flex:0 0 25px;text-align:center;font-size:1.05em}",
    ".fm26-pack-page{width:100%;min-height:100%;height:100%;padding:clamp(10px,1.55vw,26px);overflow:auto;color:#f4f4f6;font-family:'Arial Narrow','Segoe UI',Arial,sans-serif;background:radial-gradient(ellipse at 35% 38%,#343438 0%,#19191c 56%,#101014 100%)}",
    ".fm26-pack-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:clamp(12px,1.6vw,28px);align-items:start;min-height:100%}.fm26-pack-col{display:grid;gap:clamp(12px,1.4vw,20px);min-width:0;align-content:start}",
    ".fm26-pack-fixture{position:relative;min-height:clamp(340px,53vh,500px);overflow:hidden;border:1px solid #ffffff38;padding:clamp(22px,3.2vh,45px) clamp(16px,2.5vw,45px);background:linear-gradient(115deg,#303034f2,#18181bf5);box-shadow:inset 0 0 35px #ffffff08}",
    ".fm26-pack-fixture-inner{position:relative;display:grid;grid-template-columns:minmax(82px,22%) minmax(0,1fr);gap:clamp(16px,2vw,34px);align-items:center;height:100%}.fm26-pack-club{text-align:center;min-width:0}",
    ".fm26-pack-club .cr{width:clamp(58px,9vw,150px)!important;height:clamp(58px,9vw,150px)!important}.fm26-pack-club strong{display:block;font-size:clamp(12px,1.25vw,22px);margin-top:10px;overflow-wrap:anywhere}",
    ".fm26-pack-eyebrow{font-size:clamp(13px,1.4vw,23px);color:#dedee6;margin:0 0 13px}.fm26-pack-fixture h1{font-size:clamp(22px,2vw,34px);line-height:1.12;margin:0 0 8px;font-weight:900}",
    ".fm26-pack-stars{font-size:clamp(20px,2.2vw,34px);letter-spacing:-3px;color:#aaa;margin:7px 0 15px}.fm26-pack-comp{font-size:clamp(15px,1.45vw,24px);line-height:1.28;color:#eee;margin:0 0 17px}",
    ".fm26-pack-label{font-size:clamp(12px,1.15vw,19px);font-weight:900;color:#bfc0c6;margin:12px 0 8px}.fm26-pack-form{display:flex;gap:clamp(5px,.65vw,12px);flex-wrap:wrap;margin-bottom:15px}",
    ".fm26-pack-form span{width:clamp(31px,3vw,48px);height:clamp(31px,3.1vw,48px);display:grid;place-items:center;background:#6c6c70;font-size:clamp(16px,1.45vw,24px);font-weight:900}.fm26-pack-form .win{background:#42694a}.fm26-pack-form .draw{background:#77777b}.fm26-pack-form .loss{background:#784958}",
    ".fm26-pack-section{min-width:0;background:#242529ef;border:1px solid #ffffff20;overflow:hidden}.fm26-pack-section-head{min-height:clamp(38px,5.8vh,55px);display:flex;align-items:center;padding:8px 12px;background:#59595d;font-size:clamp(16px,1.35vw,23px);font-weight:900}",
    ".fm26-pack-stat{min-height:clamp(47px,7vh,64px);display:grid;grid-template-columns:42px minmax(0,1fr) 55px;gap:8px;align-items:center;padding:5px 10px;background:#29292c;border-top:1px solid #ffffff0d}.fm26-pack-stat-icon{text-align:center;font-size:clamp(17px,1.7vw,29px);color:#ddd}",
    ".fm26-pack-stat strong{display:block;font-size:clamp(13px,1.35vw,23px);line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm26-pack-stat small{display:block;font-size:clamp(11px,1.05vw,18px);margin-top:4px;color:#ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm26-pack-stat b{font-size:clamp(16px,1.5vw,25px);text-align:right}",
    ".fm26-pack-result{min-height:clamp(47px,6.7vh,64px);display:grid;grid-template-columns:clamp(45px,6vw,83px) 35px minmax(0,1fr) auto;gap:7px;align-items:center;padding:5px 9px;background:#ffffff0d;border-top:1px solid #ffffff0c}.fm26-pack-result time{font-size:clamp(11px,1.05vw,18px);white-space:nowrap}",
    ".fm26-pack-result .cr{width:clamp(23px,2.5vw,40px)!important;height:clamp(23px,2.5vw,40px)!important}.fm26-pack-result strong{font-size:clamp(12px,1.25vw,21px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm26-pack-result small{font-size:clamp(10px,.95vw,15px);color:#ccc;white-space:nowrap}",
    ".fm26-pack-minirow{padding:12px 14px;background:#ffffff0d;border-top:1px solid #ffffff10;font-size:clamp(12px,1.2vw,21px);line-height:1.5}.fm26-pack-minirow b{color:#fff}",
    ".fm26-pack-title{font-size:clamp(19px,1.8vw,30px);font-weight:900;margin:0 0 14px}.fm26-pack-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.fm26-pack-kpi{padding:clamp(12px,1.5vw,22px);background:#292a2e;border:1px solid #ffffff1c;min-width:0}",
    ".fm26-pack-kpi small{display:block;color:#c1c2ca;font-size:clamp(11px,1vw,16px);font-weight:700}.fm26-pack-kpi strong{display:block;font-size:clamp(22px,2.2vw,36px);margin-top:8px;line-height:1.05;overflow-wrap:anywhere}.fm26-pack-kpi .pack-bar{height:10px;margin-top:12px;background:#41434b;overflow:hidden}.fm26-pack-kpi .pack-bar i{display:block;height:100%;background:#a86af2}",
    ".fm26-pack-table-wrap{overflow:auto;background:#242529;border:1px solid #ffffff22}.fm26-pack-table{width:100%;border-collapse:collapse;min-width:580px;font-size:clamp(12px,1.05vw,17px)}.fm26-pack-table th{position:sticky;top:0;background:#55565b;padding:11px 9px;text-align:left;white-space:nowrap}.fm26-pack-table td{padding:9px;border-top:1px solid #ffffff16;white-space:nowrap}.fm26-pack-table tr:nth-child(even){background:#ffffff08}.fm26-pack-table tr.me{background:#7135a655;outline:1px solid #ad76ed}",
    ".fm26-pack-search{width:100%;padding:12px 14px;border:1px solid #575a64;background:#202126;color:#fff;font-size:16px;margin:0 0 12px}.fm26-pack-note{font-size:13px;line-height:1.45;color:#bbb;padding:12px;background:#ffffff09;border-left:3px solid #a86af2;margin-top:13px}",
    ".fm26-lineup-page{width:100%;height:100%;min-height:0;display:grid;grid-template-rows:clamp(54px,8vh,78px) minmax(0,1fr) clamp(58px,8vh,78px);background:#17283a;color:#fff;overflow:hidden;font-family:Arial,sans-serif}",
    ".fm26-lineup-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px clamp(10px,2vw,30px);background:#0b1420ef;z-index:3}",
    ".fm26-lineup-top .club{display:flex;align-items:center;gap:10px;font-weight:900;font-size:clamp(13px,1.6vw,23px);min-width:0}.fm26-lineup-top .cr{width:clamp(28px,4vw,50px)!important;height:clamp(28px,4vw,50px)!important;flex:0 0 auto}",
    ".fm26-lineup-stage{position:relative;min-height:0;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) clamp(220px,26%,370px);background:radial-gradient(ellipse at 50% 0%,#c3d4dc 0%,#6c8799 25%,#24394b 70%,#17283a 100%)}",
    ".fm26-lineup-stadium{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#ffffff10 0 4px,#0c1d2b1a 4px 9px),repeating-linear-gradient(90deg,#ffffff06 0 16px,#162c3c24 16px 32px);opacity:.8}",
    ".fm26-lineup-field{position:relative;z-index:1;margin:clamp(14px,2vw,28px);border:2px solid #eef5edb8;border-radius:4px;background:repeating-linear-gradient(90deg,#4c7c43 0 8.33%,#578a4c 8.33% 16.66%);box-shadow:0 10px 30px #0007;overflow:hidden}",
    ".fm26-lineup-field:before{content:'';position:absolute;inset:2.5%;border:2px solid #eef5edb8}.fm26-lineup-field:after{content:'';position:absolute;left:2.5%;right:2.5%;top:50%;border-top:2px solid #eef5edb8}.fm26-lineup-circle{position:absolute;left:50%;top:50%;width:22%;aspect-ratio:1;transform:translate(-50%,-50%);border:2px solid #eef5edb8;border-radius:50%}",
    ".fm26-lineup-box{position:absolute;left:34%;width:32%;height:18%;border:2px solid #eef5edb8}.fm26-lineup-box.top{top:0;border-top:0}.fm26-lineup-box.bottom{bottom:0;border-bottom:0}",
    ".fm26-lineup-player{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);z-index:2;display:grid;justify-items:center;gap:2px;padding:0;border:0;background:transparent;color:white;cursor:pointer;min-width:0}",
    ".fm26-lineup-player .photo{width:clamp(33px,4.1vw,62px);height:clamp(33px,4.1vw,62px);border-radius:50%;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#e3edf4,#47759b 48%,#162d46);border:2px solid #dbe9f0;box-shadow:0 3px 8px #0008;font-weight:900;font-size:clamp(10px,1.1vw,16px);color:#11263a}.fm26-lineup-player .photo img{width:100%;height:100%;object-fit:cover;border-radius:50%}",
    ".fm26-lineup-player.selected .photo{outline:3px solid #c581ff;outline-offset:2px}.fm26-lineup-player b{max-width:clamp(48px,6vw,94px);padding:2px 4px;background:#09101acc;border-radius:3px;font-size:clamp(8px,.82vw,12px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fm26-lineup-player small{font-size:clamp(8px,.7vw,11px);text-shadow:0 1px 4px #000}",
    ".fm26-lineup-bench{position:relative;z-index:2;background:linear-gradient(145deg,#76b1dd,#3d72a2);padding:clamp(13px,2vw,24px);overflow:auto;border-left:1px solid #d2e4f3}.fm26-lineup-bench h2{margin:0 0 12px;text-align:center;font-size:clamp(18px,1.55vw,27px)}",
    ".fm26-lineup-bench-row{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 7px;background:transparent;border:0;border-top:1px solid #ffffff35;color:#fff;text-align:left;cursor:pointer}.fm26-lineup-bench-row:nth-child(even){background:#ffffff18}.fm26-lineup-bench-row.selected{outline:2px solid #fff;background:#315d86}.fm26-lineup-bench-row .num{font-weight:900}.fm26-lineup-bench-row strong{font-size:clamp(11px,1vw,16px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fm26-lineup-bench-row small{font-size:clamp(9px,.8vw,12px);white-space:nowrap}",
    ".fm26-lineup-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 12px;background:#05070b}.fm26-lineup-bottom select{background:#242b35;color:#fff;border:1px solid #657282;padding:8px}.fm26-lineup-bottom .actions{display:flex;gap:7px}.fm26-pack-button{padding:9px 13px;background:#a76af2;color:#fff;font-weight:850;border:0;cursor:pointer}.fm26-pack-button.secondary{background:#363943;border:1px solid #5c5e67}",
    ".fm26-inbox-page{width:100%;height:100%;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) clamp(58px,9vh,86px);padding:clamp(7px,1.15vw,18px);gap:8px;overflow:auto;color:#f5f5fa;background:radial-gradient(ellipse at 67% 40%,#25263b 0,#111421 53%,#0c0e18 100%);font-family:'Arial Narrow','Segoe UI',Arial,sans-serif}",
    ".fm26-inbox-content{display:grid;grid-template-columns:minmax(0,2.05fr) minmax(255px,.95fr);gap:8px;min-height:0}",
    ".fm26-inbox-panel{min-width:0;min-height:0;overflow:auto;background:linear-gradient(115deg,#242536ed,#292a3bee);border:1px solid #343548;padding:clamp(10px,1.2vw,18px);display:flex;flex-direction:column}",
    ".fm26-inbox-title{min-height:39px;display:flex;align-items:center;color:#b66cff;font-size:clamp(15px,1.3vw,24px);font-weight:900}",
    ".fm26-inbox-copy{font-size:clamp(15px,1.45vw,27px);line-height:1.4;padding:3px 12px 16px;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".fm26-inbox-player-area{margin-top:auto;display:grid;grid-template-columns:clamp(105px,11vw,191px) minmax(0,1fr) minmax(170px,1fr);gap:10px;align-items:stretch;padding:8px 8px 0}",
    ".fm26-inbox-player-card{min-width:0;min-height:230px;border:2px solid #7e10e7;border-radius:7px;overflow:hidden;background:#101020;display:flex;flex-direction:column;text-align:center}",
    ".fm26-inbox-card-art{height:135px;flex:0 0 135px;position:relative;background:radial-gradient(ellipse at 50% 35%,#292c47,#121327 70%);border-bottom:1px solid #6d0ed0;display:grid;place-items:center}",
    ".fm26-inbox-avatar{width:86px;height:105px;position:relative;border-radius:45% 45% 8% 8%;background:linear-gradient(145deg,#6685a5,#17263c 72%);border:2px solid #7c8fa8;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;color:#fff}",
    ".fm26-inbox-number{position:absolute;left:6px;top:5px;font-size:22px;font-weight:900}.fm26-inbox-player-name{background:#7605d7;padding:7px 4px;font-size:clamp(12px,1.1vw,20px);font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fm26-inbox-player-meta{background:#11121d;border-top:1px solid #292a3b;padding:5px;font-size:clamp(11px,1vw,17px)}",
    ".fm26-inbox-details{min-width:0;padding:8px 4px;display:flex;flex-direction:column;gap:9px;font-size:clamp(12px,1.1vw,21px)}",
    ".fm26-inbox-detail{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #ffffff14;padding:5px 0}.fm26-inbox-detail span{color:#c2c2d0}.fm26-inbox-detail b{text-align:right}",
    ".fm26-inbox-traits{min-width:0;border-left:1px solid #525265;padding:8px 0 8px 12px;display:flex;flex-direction:column;justify-content:center;gap:12px;font-size:clamp(12px,1.05vw,19px)}",
    ".fm26-inbox-trait{display:flex;align-items:center;gap:9px}.fm26-inbox-check{width:28px;height:28px;flex:0 0 28px;border-radius:50%;display:grid;place-items:center;background:#12a83d;color:#fff;font-weight:900}",
    ".fm26-inbox-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;text-align:center;padding:12px 0 0;margin-top:8px}.fm26-inbox-stats small{display:block;color:#bfc0ca;font-size:clamp(9px,.9vw,15px)}.fm26-inbox-stats b{display:block;margin-top:5px;font-size:clamp(12px,1.15vw,21px);overflow-wrap:anywhere}",
    ".fm26-inbox-assignment{align-items:center;text-align:center;padding:clamp(16px,2.5vw,37px) clamp(10px,1.4vw,24px)}.fm26-inbox-assignment h2{font-size:clamp(15px,1.3vw,24px);font-weight:500;color:#c5c5cf;margin:0 0 16px}.fm26-inbox-assignment strong{font-size:clamp(16px,1.35vw,25px);margin-bottom:25px}.fm26-inbox-assignment .line{width:100%;height:1px;background:#ffffff19;margin:12px 0}.fm26-inbox-assignment .value{font-size:clamp(16px,1.3vw,24px);margin-bottom:20px}",
    ".fm26-inbox-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.fm26-inbox-actions button{min-width:0;height:clamp(42px,7vh,60px);background:#4a485d;border:1px solid #69677d;font-size:clamp(11px,1.15vw,22px);cursor:pointer}.fm26-inbox-actions .primary{background:#650bd2;border-color:#650bd2}.fm26-inbox-actions button:disabled{opacity:.4;cursor:not-allowed}",
    ".fm26-inbox-list{display:grid;gap:6px;align-content:start}.fm26-inbox-list button{width:100%;text-align:left;padding:12px;background:#ffffff0d;border:1px solid #ffffff17;color:#fff;cursor:pointer}.fm26-inbox-list button.active{border-color:#a56bff;background:#6b36a944}.fm26-inbox-list small{display:block;color:#bbb;margin-top:5px}.fm26-inbox-empty{padding:20px;color:#c8c8d0}",
    "body.fm26-inbox-active #app:not(.hid){grid-template-columns:clamp(66px,9vw,186px) minmax(0,1fr)!important}",
    "body.fm26-inbox-active #side{grid-column:1!important;grid-row:1!important}",
    "body.fm26-inbox-active #fm26-manager-sidebar{display:none!important}",
    "body.fm26-inbox-active #main{grid-column:2!important}",
    "body.fm26-lineup-active.fm26-matchday-active #app:not(.hid){position:fixed!important;inset:0!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-height:0!important;display:block!important;grid-template-columns:1fr!important;transform:none!important;z-index:200!important;background:#17283a!important}",
    "body.fm26-lineup-active.fm26-matchday-active #side,body.fm26-lineup-active.fm26-matchday-active #hd,body.fm26-lineup-active.fm26-matchday-active #fm26-manager-sidebar{display:none!important}",
    "body.fm26-lineup-active.fm26-matchday-active #main{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-width:0!important;min-height:0!important;display:block!important;overflow:hidden!important}",
    "body.fm26-lineup-active.fm26-matchday-active #vw{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;max-height:none!important;min-width:0!important;min-height:0!important;overflow:hidden!important;padding:0!important;margin:0!important;background:#17283a!important}",
    "@media(max-width:900px){body.fm26-screenpack-active #app:not(.hid){grid-template-columns:58px minmax(0,1fr)!important;grid-template-rows:auto minmax(0,1fr)!important}body.fm26-screenpack-active #side{grid-column:1!important;grid-row:1/span 2!important;padding:6px 3px!important}body.fm26-screenpack-active #main{grid-column:2!important;grid-row:2!important}body.fm26-screenpack-active #fm26-manager-sidebar{grid-column:2!important;grid-row:1!important;min-height:0!important;border-right:0!important;border-bottom:2px solid #ae2af1!important;box-shadow:none!important}.fm26-manager-head{height:52px;flex-basis:52px;padding:4px 10px}.fm26-manager-head .cr{width:33px!important;height:33px!important}.fm26-manager-head strong{font-size:16px}.fm26-manager-head small{font-size:12px;margin-top:1px}.fm26-manager-title{display:none}.fm26-manager-links{flex-direction:row;overflow-x:auto;overflow-y:hidden;padding:4px;gap:4px}.fm26-manager-link{width:auto;min-width:max-content;min-height:36px;height:36px;border:1px solid #454956;padding:0 9px;border-radius:3px;font-size:12px;gap:6px}.fm26-manager-link .mi{width:16px;flex-basis:16px}body.fm26-screenpack-active #hd{flex-basis:58px!important;height:58px!important;gap:4px!important;padding:4px!important}body.fm26-screenpack-active .fm26-ref-dot{display:none!important}body.fm26-screenpack-active .fm26-ref-toolbar{height:40px!important}body.fm26-screenpack-active .fm26-ref-date{width:82px!important;font-size:10px!important}body.fm26-screenpack-active .fm26-ref-date b{font-size:11px!important}body.fm26-screenpack-active .fm26-ref-continue{width:96px!important;font-size:11px!important}.fm26-pack-grid{grid-template-columns:minmax(0,1fr);gap:12px}.fm26-pack-fixture{min-height:340px}.fm26-inbox-player-area{grid-template-columns:105px minmax(0,1fr)}.fm26-inbox-traits{grid-column:1/-1;border-left:0;border-top:1px solid #525265;display:grid;grid-template-columns:1fr 1fr}.fm26-inbox-content{grid-template-columns:minmax(0,1fr) minmax(190px,.8fr)}}",
    "@media(max-width:600px){.fm26-pack-page{padding:8px}.fm26-pack-fixture{min-height:320px;padding:18px 12px}.fm26-pack-fixture-inner{grid-template-columns:78px minmax(0,1fr);gap:12px}.fm26-pack-club .cr{width:66px!important;height:66px!important}.fm26-pack-cards{grid-template-columns:1fr}.fm26-lineup-stage{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(260px,1fr) 190px;overflow:auto}.fm26-lineup-field{min-height:270px}.fm26-lineup-bench{border-left:0;border-top:1px solid #d2e4f3;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start}.fm26-lineup-bench h2{grid-column:1/-1}.fm26-lineup-bottom{flex-wrap:wrap}.fm26-inbox-page{padding:5px;grid-template-rows:auto auto}.fm26-inbox-content{grid-template-columns:minmax(0,1fr);overflow:visible}.fm26-inbox-panel{min-height:270px}.fm26-inbox-assignment{min-height:240px}.fm26-inbox-player-area{grid-template-columns:95px minmax(0,1fr);gap:6px}.fm26-inbox-player-card{min-height:190px}.fm26-inbox-card-art{height:100px;flex-basis:100px}.fm26-inbox-avatar{height:80px;width:65px}.fm26-inbox-traits{grid-template-columns:1fr}.fm26-inbox-stats{grid-template-columns:1fr 1fr}.fm26-inbox-actions{grid-template-columns:1fr 1fr}.fm26-lineup-bottom{align-items:flex-start}.fm26-lineup-top{gap:5px;padding:5px}.fm26-lineup-top .club{font-size:11px}.fm26-lineup-top .cr{width:23px!important;height:23px!important}}"
,
    ".fm26-lineup-page{position:relative;display:block;width:100%;height:100%;min-height:0;overflow:hidden;background:radial-gradient(ellipse at 51% 5%,#b4c9d7bf,transparent 43%),repeating-radial-gradient(circle at 48% 18%,#9caebc 0 1px,#526c80 1.5px 3px,#24394e 3.5px 5px);background-size:auto,8px 8px}",,
    ".fm26-lineup-top{position:absolute;left:0;right:0;top:0;height:54px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 3%;background:linear-gradient(90deg,#101522a8,#10152255);z-index:5}",,
    ".fm26-lineup-stage{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(75.5vw,139.0625vh);height:min(64.5vh,760px);min-height:440px;max-height:760px;display:grid;grid-template-columns:70.5% 29.5%;gap:0;border-radius:28px;overflow:visible;box-shadow:0 16px 50px #0b162555;background:transparent}",,
    ".fm26-lineup-stadium{display:none}",,
    ".fm26-lineup-field{position:relative;z-index:1;min-width:0;min-height:0;margin:0;border:0;border-radius:27px 0 0 27px;background:linear-gradient(135deg,#fffffffa,#f6f5f9fa);box-shadow:none;overflow:hidden}",,
    ".fm26-lineup-field:before{inset:14px;border:2px solid #d7d3dc;border-radius:18px;opacity:.75}.fm26-lineup-field:after{left:0;right:0;top:50%;border-top:2px solid #ded9e1;border-bottom:0}",,
    ".fm26-lineup-circle{width:29%;height:27%;border-color:#e2dde5;border-width:3px}.fm26-lineup-box{left:34%;width:32%;height:18%;border-color:#e2dde5;border-width:3px}",,
    ".fm26-lineup-bench{position:relative;z-index:2;min-width:0;background:linear-gradient(135deg,#80b8e0,#68a5d3);padding:clamp(45px,13%,110px) 9% 5% 24%;border:0;border-radius:62px 26px 26px 62px;color:#fff;overflow:auto}",,
    ".fm26-lineup-bench h2{margin:0 0 14px;text-align:center;font-size:clamp(18px,1.55vw,32px);font-weight:650;white-space:nowrap}",,
    ".fm26-lineup-bench-row{min-height:clamp(28px,3.3vh,43px);padding:0 10px;border-top:0;font-size:clamp(13px,1.15vw,23px);font-weight:650}.fm26-lineup-bench-row:nth-child(even){background:#ffffff21}.fm26-lineup-bench-row small{font-size:10px;opacity:.8}",,
    ".fm26-lineup-bottom{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(75.5vw,139.0625vh);min-height:44px;padding:5px 10px;background:#05070bdc;border:1px solid #ffffff25;border-radius:5px;z-index:8}",,
    "@media(max-width:1050px){.fm26-lineup-stage{width:94vw;height:62vh;min-height:385px;grid-template-columns:68% 32%}.fm26-lineup-bench{padding-left:23%;padding-right:4%;border-radius:42px 20px 20px 42px}.fm26-lineup-bench-row{font-size:clamp(11px,1.6vw,16px);min-height:clamp(25px,3.5vh,34px)}}",,
    "@media(max-width:650px){.fm26-lineup-page{height:auto;min-height:100%;overflow:auto;padding-bottom:10px}.fm26-lineup-top{position:relative;height:48px;padding:5px 8px}.fm26-lineup-top .club{font-size:11px}.fm26-lineup-top .cr{width:23px!important;height:23px!important}.fm26-lineup-stage{position:relative;left:auto;top:auto;transform:none;margin:12px auto 20px;width:96vw;height:auto;min-height:0;display:flex;flex-direction:column;border-radius:18px;overflow:visible}.fm26-lineup-field{height:390px;min-height:390px;flex:none;border-radius:18px 18px 0 0}.fm26-lineup-bench{min-height:275px;border-radius:0 0 18px 18px;padding:35px 10% 20px 20%}.fm26-lineup-bench h2{font-size:21px}.fm26-lineup-bench-row{min-height:25px;font-size:14px}.fm26-lineup-bottom{position:relative;left:auto;bottom:auto;transform:none;margin:0 auto 10px;width:96vw;flex-wrap:wrap}}"
,
    ".fm26-lineup-club-crest{position:absolute;z-index:6;left:70.5%;top:50%;transform:translate(-50%,-50%);width:clamp(78px,8.3vw,172px);height:clamp(78px,8.3vw,172px);display:grid;place-items:center;pointer-events:none;filter:drop-shadow(0 2px 2px #102b4a60)}.fm26-lineup-club-crest .cr{width:100%!important;height:100%!important}",
    "@media(max-width:650px){.fm26-lineup-club-crest{left:50%;top:390px;width:67px;height:67px}}",
  ].join('\n');
  const style = document.createElement('style');
  style.id = 'fm26-screen-pack-style';
  style.textContent = css;
  document.head.appendChild(style);

  function ensurePane() {
    const app = $('app'), main = $('main');
    if (!app || !main) return null;
    let pane = $('fm26-manager-sidebar');
    if (!pane) {
      pane = document.createElement('aside');
      pane.id = 'fm26-manager-sidebar';
      pane.setAttribute('aria-label','Menu du manager');
      app.insertBefore(pane, main);
    }
    return pane;
  }

  const menus = {
    coach:{title:'ENTRAÎNEUR',items:[['Options de l’entraîneur','mgr','⚙'],['Confiance','mgr','♟'],['Profil entraîneur','mgr','●'],['Historiq. entraîneur','sched','↶'],['Vitrine des trophées','comp','🏆'],['Vacances','sched','♧'],['Requête dirig.','inbox','?'],['État de la partie','mgr','▣']]},
    club:{title:'CLUB',items:[['Équipe première','squad','♟'],['Équipe réserve','squad','♟'],['Tactique','tactics','◈'],['Rapport équipe','mgr','▤'],['Centre de dév.','squad','↗'],['Centre médical','squad','✚'],['Calendrier','sched','▦'],['Finances','fin','€']]},
    world:{title:'COMPÉTITIONS',items:[['Division du club','comp','▤'],['Continental','comp','◉'],['International','comp','◎'],['France','comp','🇫🇷'],['Angleterre','comp','🇬🇧'],['Espagne','comp','🇪🇸'],['Italie','comp','🇮🇹'],['Allemagne','comp','🇩🇪'],['Stand. de la ligue','comp','▣']]},
    search:{title:'RECRUTEMENT',items:[['Résultats recrut.','squad','♟'],['Rech. de joueur','squad','◉'],['Sélection','squad','▤'],['Recherche de staff','mgr','♙'],['Emplois','jobs','▤'],['Transferts','fin','⟳'],['Trouver Club','comp','⌕'],['Agence d’obs.','squad','♧']]},
    opt:{title:'OPTIONS',items:[['Sauvegarder partie','save','▣'],['Paramètres','mgr','⚙'],['Panthéon du foot','comp','★'],['Nouvelle carrière','reset','↻']]}
  };

  function renderRail(activeSection) {
    const side = $('side');
    if (!side) return;
    const items = [['inbox','✉','Messagerie'],['home','⌂','Accueil'],['club','♜','Club'],['coach','♟','Manager'],['world','◎','Monde'],['search','⌕','Recherche'],['opt','⚙','Options']];
    side.innerHTML = '<button class="fm26-ref-back" type="button" data-pack-section="home" title="Accueil">‹</button>' +
      items.map(x => '<button type="button" class="fm26-ref-railbtn ' + (activeSection === x[0] ? 'active' : '') + '" data-pack-section="' + x[0] + '" title="' + x[2] + '" aria-label="' + x[2] + '"><span style="font-size:clamp(25px,2.6vw,44px)">' + x[1] + '</span></button>').join('');
    side.onclick = e => {
      const b = e.target.closest('[data-pack-section]');
      if (!b) return;
      const key = b.dataset.packSection;
      if (key === 'inbox') { mailListMode = false; S.view = 'inbox'; render(); return; }
      section = key === 'home' ? 'coach' : key;
      selectedLabel = key === 'home' ? 'Accueil' : key === 'club' ? 'Équipe première' : key === 'coach' ? 'Confiance' : key === 'world' ? 'Division du club' : key === 'search' ? 'Rech. de joueur' : 'Options';
      S.view = ({home:'home',club:'squad',coach:'mgr',world:'comp',search:'squad',opt:'mgr'})[key] || 'home';
      render();
    };
  }

  function renderPane() {
    const pane = ensurePane();
    if (!pane) return;
    const menu = menus[section] || menus.coach;
    pane.innerHTML = '<div class="fm26-manager-head">' + (typeof crest === 'function' ? crest(S.club,48) : '') +
      '<div style="min-width:0"><strong>' + esc(S.club) + '</strong><small>Menu d’accueil</small></div></div>' +
      '<div class="fm26-manager-title">' + menu.title + '</div><nav class="fm26-manager-links">' +
      menu.items.map(item => '<button class="fm26-manager-link ' + (selectedLabel === item[0] ? 'selected' : '') + '" type="button" data-pack-view="' + item[1] + '" data-pack-label="' + esc(item[0]) + '"><span class="mi">' + item[2] + '</span><span>' + esc(item[0]) + '</span></button>').join('') + '</nav>';
    pane.onclick = e => {
      const b = e.target.closest('[data-pack-view]');
      if (!b) return;
      const view = b.dataset.packView;
      selectedLabel = b.dataset.packLabel;
      if (section === 'world') {
        if (selectedLabel === 'Continental' || selectedLabel === 'International') { if (typeof toast === 'function') toast('Cette compétition n’est pas encore simulée dans cette carrière.'); return; }
        const countryLeagues = {'France':'Ligue 1','Angleterre':'Premier League','Espagne':'La Liga','Italie':'Serie A','Allemagne':'Bundesliga'};
        if (countryLeagues[selectedLabel] && countryLeagues[selectedLabel] !== S.lg) { if (typeof toast === 'function') toast('La carrière active simule uniquement ' + S.lg + '.'); return; }
      }
      if (view === 'save') { try { sv(); } catch (_) {} if (typeof toast === 'function') toast('Partie sauvegardée'); render(); return; }
      if (view === 'reset') { if (confirm('Commencer une nouvelle carrière ?')) { try { localStorage.removeItem('fm26_v2'); } catch (_) {} location.reload(); } return; }
      if (view === 'inbox') { mailListMode = false; S.mi = 0; S.view = 'inbox'; render(); return; }
      if (view === 'jobs') { S.view = 'jobs'; render(); return; }
      S.view = view;
      render();
    };
  }

  function getMatches() {
    return (S.fx || []).filter(f => f.home === S.club || f.away === S.club).slice().sort((a,b) => String(a.date).localeCompare(String(b.date)));
  }
  function getForm() {
    const recent = getMatches().filter(f => f.played).slice(-5);
    const map = {W:['win','V'],D:['draw','N'],L:['loss','D']};
    return recent.map(f => {
      const r = typeof res === 'function' ? res(f) : 'D';
      const item = map[r] || ['draw','—'];
      return '<span class="' + item[0] + '">' + item[1] + '</span>';
    }).join('') || '<span>—</span><span>—</span><span>—</span><span>—</span><span>—</span>';
  }
  function statRow(icon, player, label, value) {
    return '<div class="fm26-pack-stat"><span class="fm26-pack-stat-icon">' + icon + '</span><div><strong>' + esc(player ? player.name : '—') + '</strong><small>' + label + '</small></div><b>' + esc(value == null ? '—' : value) + '</b></div>';
  }
  function resultRows(list) {
    if (!list.length) return '<div class="fm26-pack-result"><time>—</time><span></span><strong>Aucun match enregistré</strong><small>—</small></div>';
    return list.map(f => {
      const opp = f.home === S.club ? f.away : f.home;
      return '<div class="fm26-pack-result"><time>' + esc(dateOf(f.date)) + '</time>' + (typeof crest === 'function' ? crest(opp,38) : '') +
        '<strong>' + esc(opp) + '<small style="display:block">' + esc(f.comp || S.lg) + ' · ' + (f.home === S.club ? 'DOM.' : 'EXT.') + '</small></strong><small>' +
        esc(f.played ? (f.score || 'TERMINÉ') : 'À venir') + '</small></div>';
    }).join('');
  }

  function dashboardMarkup() {
    const all = getMatches();
    const next = all.find(f => !f.played);
    const recent = all.filter(f => f.played).slice(-1);
    const upcoming = all.filter(f => !f.played).slice(0,3);
    const selected = next || recent[0] || null;
    const opponent = selected ? (selected.home === S.club ? selected.away : selected.home) : 'Aucun adversaire';
    const gap = selected && !selected.played ? Math.round((new Date(String(selected.date).slice(0,10) + 'T12:00:00') - new Date(String(S.date).slice(0,10) + 'T12:00:00')) / 86400000) : 0;
    const when = !selected ? 'Aucun match programmé' : selected.played ? 'Dernier match' : gap <= 0 ? 'Aujourd’hui' : 'Dans ' + gap + ' jour' + (gap > 1 ? 's' : '');
    const players = S.sq || [];
    const top = key => players.slice().sort((a,b) => (Number(b[key]) || 0) - (Number(a[key]) || 0))[0];
    const scorer = top('g');
    const assists = players.slice().sort((a,b) => (Number(b.ast || b.assists) || 0) - (Number(a.ast || a.assists) || 0))[0];
    const rating = top('form');
    const hasCardStats = players.some(p => p.yellow != null || p.yc != null || p.cards != null);
    const cards = hasCardStats ? players.slice().sort((a,b) => (Number(b.yellow || b.yc || b.cards) || 0) - (Number(a.yellow || a.yc || a.cards) || 0))[0] : null;
    const table = typeof tbl === 'function' ? tbl() : [];
    const mine = table.find(x => x.c === S.club) || {pts:0,gd:0};
    const rank = Math.max(1, table.findIndex(x => x.c === S.club) + 1);
    const injured = players.filter(p => p.injured || p.injury || Number(p.inj) > 0);
    const rows = recent.concat(upcoming).slice(0,4);
    const clubCrest = typeof crest === 'function' ? crest(opponent,112) : '';
    return '<main class="fm26-pack-page"><div class="fm26-pack-grid">' +
      '<div class="fm26-pack-col"><section class="fm26-pack-fixture"><div class="fm26-pack-fixture-inner"><div class="fm26-pack-club">' + clubCrest + '<strong>' + esc(opponent) + '</strong><div class="fm26-pack-stars">★★★★★</div></div>' +
      '<div><p class="fm26-pack-eyebrow">' + esc(when) + (selected ? ' (' + (selected.home === S.club ? 'À domicile' : 'À l’extérieur') + ')' : '') + '</p><h1>' + esc(opponent) + '</h1>' +
      '<div class="fm26-pack-stars">★★★★★</div><p class="fm26-pack-comp">' + esc(selected ? (selected.comp || S.lg) : S.lg) + '</p>' +
      '<div class="fm26-pack-label">FORME RÉCENTE</div><div class="fm26-pack-form">' + getForm() + '</div>' +
      '<div class="fm26-pack-label">ENTRAÎNEUR</div><strong style="font-size:clamp(15px,1.45vw,24px)">' + esc(S.mg || 'Manager') + '</strong></div></div></section>' +
      '<section class="fm26-pack-section"><div class="fm26-pack-section-head">CLASSEMENT · ' + esc(S.lg) + '</div>' +
      '<div class="fm26-pack-minirow">Position : <b>' + rank + 'e</b> &nbsp; Points : <b>' + esc(mine.pts) + '</b> &nbsp; Différence de buts : <b>' + (mine.gd > 0 ? '+' : '') + esc(mine.gd) + '</b></div>' +
      '<div class="fm26-pack-minirow">Budget transferts : <b>€' + esc(S.bud) + ' M</b> &nbsp; Direction : <b>' + esc(S.board) + '%</b> &nbsp; Supporters : <b>' + esc(S.fans) + '%</b></div>' +
      '<div class="fm26-pack-minirow">Blessés : <b>' + esc(injured.length ? injured.map(p => p.name).join(', ') : 'Aucun joueur blessé signalé') + '</b></div></section></div>' +
      '<div class="fm26-pack-col"><section class="fm26-pack-section"><div class="fm26-pack-section-head">Stats (Joueurs)</div>' +
      statRow('⚽', scorer, 'Meilleur buteur', scorer ? Number(scorer.g) || 0 : '—') +
      statRow('◉', assists, 'Meilleur passeur décisif', assists ? Number(assists.ast || assists.assists) || 0 : '—') +
      statRow('▰', cards, 'Cartons jaunes', cards ? Number(cards.yellow || cards.yc || cards.cards) || 0 : '—') +
      statRow('★', rating, 'Meilleure note moyenne', rating ? Number(rating.form || 0).toFixed(2) : '—') +
      '</section><section class="fm26-pack-section"><div class="fm26-pack-section-head">Matchs &amp; Résultats</div>' + resultRows(rows) + '</section></div></div></main>';
  }

  function managerMarkup() {
    const played = getMatches().filter(f => f.played);
    const wins = played.filter(f => typeof res === 'function' && res(f) === 'W').length;
    const losses = played.filter(f => typeof res === 'function' && res(f) === 'L').length;
    const draws = played.length - wins - losses;
    const board = Math.max(0,Math.min(100,Number(S.board) || 0));
    const fans = Math.max(0,Math.min(100,Number(S.fans) || 0));
    const morale = Math.max(0,Math.min(100,Number(S.mor) || 0));
    return '<main class="fm26-pack-page"><h1 class="fm26-pack-title">Profil de l’entraîneur</h1>' +
      '<div class="fm26-pack-cards"><div class="fm26-pack-kpi"><small>CONFIANCE DE LA DIRECTION</small><strong>' + board + '%</strong><div class="pack-bar"><i style="width:' + board + '%"></i></div></div>' +
      '<div class="fm26-pack-kpi"><small>POPULARITÉ DES SUPPORTERS</small><strong>' + fans + '%</strong><div class="pack-bar"><i style="width:' + fans + '%"></i></div></div>' +
      '<div class="fm26-pack-kpi"><small>MORAL DU GROUPE</small><strong>' + morale + '%</strong><div class="pack-bar"><i style="width:' + morale + '%"></i></div></div></div>' +
      '<div class="fm26-pack-grid"><div class="fm26-pack-col"><section class="fm26-pack-section"><div class="fm26-pack-section-head">Historique entraîneur</div>' +
      '<div class="fm26-pack-minirow">Saison : <b>' + esc(S.season) + '</b></div><div class="fm26-pack-minirow">Matchs joués : <b>' + played.length + '</b></div>' +
      '<div class="fm26-pack-minirow">Victoires : <b>' + wins + '</b> · Nuls : <b>' + draws + '</b> · Défaites : <b>' + losses + '</b></div>' +
      '<div class="fm26-pack-minirow">Club actuel : <b>' + esc(S.club) + '</b></div><div class="fm26-pack-minirow">Championnat : <b>' + esc(S.lg) + '</b></div></section>' +
      '<section class="fm26-pack-section"><div class="fm26-pack-section-head">Vitrine des trophées</div><div class="fm26-pack-minirow">Aucun trophée n’est enregistré dans cette carrière pour le moment.</div></section></div>' +
      '<div class="fm26-pack-col"><section class="fm26-pack-section"><div class="fm26-pack-section-head">Profil entraîneur</div><div style="padding:22px;text-align:center">' +
      '<div style="width:clamp(90px,10vw,155px);height:clamp(90px,10vw,155px);margin:0 auto 15px;border-radius:50%;overflow:hidden;border:4px solid #9e74e4;background:#1c2738">' + (S.managerPhoto ? '<img src="' + esc(S.managerPhoto) + '" alt="Portrait du manager" style="width:100%;height:100%;object-fit:cover">' : (portraitSrc({id:Number(S.managerPortrait)||0},0) ? '<img src="' + esc(portraitSrc({id:Number(S.managerPortrait)||0},0)) + '" alt="Portrait du manager" style="width:100%;height:100%;object-fit:cover">' : '<span style="display:grid;place-items:center;height:100%;font-size:48px">♟</span>')) + '</div>' +
      '<div style="font-size:clamp(19px,1.8vw,30px);font-weight:900">' + esc(S.mg) + '</div><p style="color:#c5c5ce">' + esc(S.club) + ' · ' + esc(S.lg) + '</p></div>' +
      '<div class="fm26-pack-minirow">Statut : <b>' + (board >= 65 ? 'En confiance' : board >= 40 ? 'À surveiller' : 'Sous pression') + '</b></div></section></div></div></main>';
  }

  function competitionMarkup() {
    const table = typeof tbl === 'function' ? tbl() : [];
    const row = table.findIndex(t => t.c === S.club);
    return '<main class="fm26-pack-page"><h1 class="fm26-pack-title">Division du club · ' + esc(S.lg) + '</h1>' +
      '<section class="fm26-pack-section"><div class="fm26-pack-section-head">Classement de la division active</div><div class="fm26-pack-table-wrap"><table class="fm26-pack-table"><thead><tr><th>#</th><th>Club</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff.</th><th>Pts</th></tr></thead><tbody>' +
      table.map((t,i) => '<tr class="' + (t.c === S.club ? 'me' : '') + '"><td>' + (i+1) + '</td><td><b>' + esc(t.c) + '</b></td><td>' + esc(t.p) + '</td><td>' + esc(t.w) + '</td><td>' + esc(t.d) + '</td><td>' + esc(t.l) + '</td><td>' + esc(t.gf) + '</td><td>' + esc(t.ga) + '</td><td>' + (t.gd > 0 ? '+' : '') + esc(t.gd) + '</td><td><b>' + esc(t.pts) + '</b></td></tr>').join('') +
      '</tbody></table></div></section><p class="fm26-pack-note">Le classement ci-dessus correspond à la division active de ta carrière. Les autres pays et compétitions ne sont pas simulés automatiquement par cette sauvegarde.</p></main>';
  }

  function squadMarkup() {
    const list = (S.sq || []).slice().sort((a,b) => (Number(b.ovr) || 0) - (Number(a.ovr) || 0));
    return '<main class="fm26-pack-page"><h1 class="fm26-pack-title">Effectif &amp; recrutement</h1>' +
      '<input class="fm26-pack-search" id="fm26-pack-player-search" type="search" placeholder="Rechercher un joueur, un poste…" value="' + esc(playerFilter) + '">' +
      '<section class="fm26-pack-section"><div class="fm26-pack-section-head">Équipe première · ' + list.length + ' joueurs</div><div class="fm26-pack-table-wrap"><table class="fm26-pack-table"><thead><tr><th>N°</th><th>Joueur</th><th>Poste</th><th>Âge</th><th>Niveau</th><th>Note</th><th>Condition</th><th>Buts</th><th>Valeur</th></tr></thead><tbody id="fm26-pack-squad-body">' +
      list.map(p => '<tr data-pack-player="' + esc(p.id) + '"><td>' + esc(p.no) + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.pos) + '</td><td>' + esc(p.age) + '</td><td>' + esc(p.ovr) + '</td><td>' + esc(Number(p.form || 0).toFixed(1)) + '</td><td>' + esc(p.cond) + '%</td><td>' + esc(p.g || 0) + '</td><td>€' + esc(p.val || 0) + ' M</td></tr>').join('') +
      '</tbody></table></div></section></main>';
  }

  function financeMarkup() {
    const wage = (S.sq || []).reduce((sum,p) => sum + (Number(p.sal) || 0), 0);
    const value = (S.sq || []).reduce((sum,p) => sum + (Number(p.val) || 0), 0);
    return '<main class="fm26-pack-page"><h1 class="fm26-pack-title">Recrutement &amp; transferts</h1>' +
      '<div class="fm26-pack-cards"><div class="fm26-pack-kpi"><small>BUDGET TRANSFERTS</small><strong>€' + esc(S.bud) + ' M</strong></div>' +
      '<div class="fm26-pack-kpi"><small>MASSE SALARIALE / SEMAINE</small><strong>€' + esc(fmt(wage)) + '</strong></div>' +
      '<div class="fm26-pack-kpi"><small>VALEUR DE L’EFFECTIF</small><strong>€' + esc(value) + ' M</strong></div></div>' +
      '<section class="fm26-pack-section"><div class="fm26-pack-section-head">Effectif à observer</div><div class="fm26-pack-table-wrap"><table class="fm26-pack-table"><thead><tr><th>Joueur</th><th>Poste</th><th>Âge</th><th>Niveau</th><th>Valeur estimée</th><th>Salaire / semaine</th></tr></thead><tbody>' +
      (S.sq || []).slice().sort((a,b) => (Number(b.ovr) || 0) - (Number(a.ovr) || 0)).slice(0,15).map(p => '<tr><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.pos) + '</td><td>' + esc(p.age) + '</td><td>' + esc(p.ovr) + '</td><td>€' + esc(p.val) + ' M</td><td>€' + esc(fmt(p.sal)) + '</td></tr>').join('') +
      '</tbody></table></div></section><p class="fm26-pack-note">Les valeurs et salaires affichés proviennent des données de l’effectif de ta sauvegarde.</p></main>';
  }

  function lineupMarkup() {
    const f = typeof nxt === 'function' ? nxt() : null;
    if (!f) return '<main class="fm26-lineup-page"><header class="fm26-lineup-top"><strong>FM26 · COMPOSITIONS</strong><span>Aucun match programmé</span></header><section class="fm26-lineup-stage"></section><footer class="fm26-lineup-bottom"></footer></main>';
    const lineup = window.FM26MatchDay && typeof window.FM26MatchDay.getLineup === 'function' ? window.FM26MatchDay.getLineup() : (typeof xi === 'function' ? xi() : []);
    const ids = lineup.map(p => Number(p.id));
    const bench = (S.sq || []).filter(p => !ids.includes(Number(p.id)) && !(Number(p.inj) > 0) && !(Number(p.susp) > 0));
    const formation = (typeof FM === 'object' && FM[S.tc && S.tc.f]) || FM['4-3-3'];
    const pitchPlayers = lineup.slice(0,11).map((p,i) => {
      const pos = formation[i] || formation[formation.length - 1] || [50,50];
      const left = Math.max(5,Math.min(95,Number(pos[0]) || 50));
      const top = 100 - Math.max(8,Math.min(92,Number(pos[1]) || 50));
      const initials = String(p.name || 'J').split(/\s+/).slice(0,2).map(x => x[0] || '').join('').toUpperCase();
      const short = String(p.name || 'Joueur').split(' ').slice(-1)[0];
      const photo = portraitSrc(p,i);
      return '<button class="fm26-lineup-player ' + (preSelectedSlot === i ? 'selected' : '') + '" type="button" style="--x:' + left + '%;--y:' + top + '%" data-pack-lineup="slot" data-slot="' + i + '" title="Choisir ' + esc(p.name) + '"><span class="photo">' + (photo ? '<img src="' + esc(photo) + '" alt="Portrait de ' + esc(p.name) + '">' : esc(initials)) + '</span><b>' + esc(short) + '</b><small>' + esc(p.pos) + ' · ' + esc(p.no) + '</small></button>';
    }).join('');
    const benchRows = bench.map(p => '<button class="fm26-lineup-bench-row" type="button" data-pack-lineup="bench" data-player="' + esc(p.id) + '"><span class="num">' + esc(p.no) + '</span><span><strong>' + esc(p.name) + '</strong><small>' + esc(p.pos) + ' · ' + esc(p.ovr) + ' · ' + esc(p.cond) + '%</small></span><small>' + esc(Number(p.form || 0).toFixed(1)) + '</small></button>').join('');
    return '<main class="fm26-lineup-page"><header class="fm26-lineup-top"><div class="club home">' + (typeof crest === 'function' ? crest(f.home,44) : '') + '<span>' + esc(f.home) + '</span></div>' +
      '<div style="text-align:center"><b>COMPOSITION D’ÉQUIPE</b><small style="display:block;color:#c4d0dc">' + esc(f.comp || S.lg) + ' · ' + esc(dateOf(f.date)) + '</small></div>' +
      '<div class="club away"><span>' + esc(f.away) + '</span>' + (typeof crest === 'function' ? crest(f.away,44) : '') + '</div></header>' +
      '<section class="fm26-lineup-stage"><div class="fm26-lineup-stadium"></div><div class="fm26-lineup-field"><div class="fm26-lineup-circle"></div><div class="fm26-lineup-box top"></div><div class="fm26-lineup-box bottom"></div>' + pitchPlayers + '</div>' +
      '<div class="fm26-lineup-club-crest">' + (typeof crest === 'function' ? crest(S.club,150) : '') + '</div><aside class="fm26-lineup-bench"><h2>REMPLAÇANTS</h2>' + (benchRows || '<p>Aucun remplaçant disponible.</p>') + '</aside></section>' +
      '<footer class="fm26-lineup-bottom"><div><label for="fm26-pack-formation">Formation</label> <select id="fm26-pack-formation">' + Object.keys(FM).map(k => '<option value="' + esc(k) + '" ' + (S.tc.f === k ? 'selected' : '') + '>' + esc(k) + '</option>').join('') + '</select>' +
      '<span style="margin-left:10px;color:#c6d0db;font-size:12px">' + esc(preSelectedSlot == null ? 'Sélectionne un titulaire puis un remplaçant.' : 'Titulaire sélectionné : ' + (lineup[preSelectedSlot] ? lineup[preSelectedSlot].name : '')) + '</span></div>' +
      '<div class="actions"><button class="fm26-pack-button secondary" type="button" data-pack-lineup="clear">Réinitialiser</button><button class="fm26-pack-button" type="button" data-pack-lineup="start">ALLER AU MATCH →</button></div></footer></main>';
  }

  function messageMarkup() {
    const messages = S.ib || [];
    const idx = Math.max(0,Math.min(messages.length - 1,Number(S.mi) || 0));
    const m = messages[idx] || {s:'Direction du club',t:'Aucun message',b:'Ta boîte de réception est vide.',d:S.date,r:true};
    const allText = String(m.t || '') + ' ' + String(m.b || '');
    const player = (S.sq || []).find(p => p.name && allText.toLowerCase().includes(String(p.name).toLowerCase()));
    const role = player ? (player.pos || player.position || 'Joueur') : '';
    const manager = m.s || 'Staff du club';
    const date = dateOf(m.d || S.date);
    const playerPhoto = player ? portraitSrc(player,player.id) : '';
    const playerCard = player ?
      '<div class="fm26-inbox-player-area"><article class="fm26-inbox-player-card"><div class="fm26-inbox-card-art"><span class="fm26-inbox-number">' + esc(player.no || '—') + '</span><div class="fm26-inbox-avatar">' + (playerPhoto ? '<img src="' + esc(playerPhoto) + '" alt="Portrait de ' + esc(player.name) + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">' : esc(String(player.name).split(/\s+/).slice(0,2).map(x => x[0] || '').join('').toUpperCase())) + '</div></div><div class="fm26-inbox-player-name">' + esc(player.name) + '</div><div class="fm26-inbox-player-meta">' + esc(role) + '</div><div class="fm26-inbox-player-meta">' + esc(S.club) + '</div></article>' +
      '<div class="fm26-inbox-details"><div class="fm26-inbox-detail"><span>Capacité</span><b>' + esc(player.ovr || '—') + '/100</b></div><div class="fm26-inbox-detail"><span>Potentiel</span><b>' + esc(player.pot || '—') + '/100</b></div><div class="fm26-inbox-detail"><span>Âge</span><b>' + esc(player.age || '—') + ' ans</b></div><div class="fm26-inbox-detail"><span>Poste</span><b>' + esc(role) + '</b></div><div class="fm26-inbox-detail"><span>Nationalité</span><b>' + esc(player.nat || '—') + '</b></div></div>' +
      '<div class="fm26-inbox-traits"><div class="fm26-inbox-trait"><span class="fm26-inbox-check">✓</span><span>Profil présent dans l’effectif</span></div><div class="fm26-inbox-trait"><span class="fm26-inbox-check">✓</span><span>Évaluation issue des données de carrière</span></div><div class="fm26-inbox-trait"><span class="fm26-inbox-check">✓</span><span>Condition : ' + esc(player.cond == null ? '—' : player.cond + '%') + '</span></div></div></div>' :
      '<div class="fm26-inbox-player-area"><div class="fm26-inbox-empty">Aucun joueur de ton effectif n’est nommé dans ce message. Les données d’un joueur ne seront pas inventées.</div></div>';
    const footerStats = player ? '<div class="fm26-inbox-stats"><div><small>NOTE ACTUELLE</small><b>' + esc(Number(player.form || 0).toFixed(2)) + '</b></div><div><small>CONDITION</small><b>' + esc(player.cond == null ? '—' : player.cond + '%') + '</b></div><div><small>VALEUR ESTIMÉE</small><b>' + esc(player.val == null ? '—' : '€' + player.val + ' M') + '</b></div><div><small>SALAIRE</small><b>' + esc(player.sal == null ? '—' : '€' + fmt(player.sal) + '/sem.') + '</b></div></div>' : '';
    const list = messages.map((x,i) => '<button type="button" class="' + (i === idx ? 'active' : '') + '" data-pack-mail="select" data-index="' + i + '"><b>' + esc(x.t || 'Message') + '</b><small>' + esc(x.s || 'Staff') + ' · ' + esc(dateOf(x.d)) + ' · ' + (x.r ? 'Lu' : 'Non lu') + '</small></button>').join('');
    const leftContent = mailListMode ?
      '<div class="fm26-inbox-title">BOÎTE DE RÉCEPTION · ' + messages.length + ' message(s)</div><div class="fm26-inbox-list">' + (list || '<p class="fm26-inbox-empty">Aucun message reçu.</p>') + '</div>' :
      '<div class="fm26-inbox-title">' + esc(m.t || 'INFORMATIONS DU CLUB').toUpperCase() + '</div><div class="fm26-inbox-copy">' + esc(manager) + ' · ' + esc(date) + '<br><br>' + esc(m.b || 'Aucun détail complémentaire pour ce message.') + '</div>' + playerCard + footerStats;
    return '<main class="fm26-inbox-page"><div class="fm26-inbox-content"><section class="fm26-inbox-panel">' + leftContent + '</section>' +
      '<aside class="fm26-inbox-panel fm26-inbox-assignment"><h2>AFFECTATION / EXPÉDITEUR</h2><strong>' + esc(manager) + '</strong><div class="line"></div>' +
      '<h2>ÉTAT DU MESSAGE</h2><div class="value">' + (m.r ? 'Consulté' : 'À lire') + '</div><div class="line"></div>' +
      '<h2>DATE DU MESSAGE</h2><div class="value">' + esc(date) + '</div><div class="line"></div>' +
      '<h2>MESSAGES REÇUS</h2><div class="value">' + messages.length + '</div><div class="line"></div>' +
      '<button class="fm26-pack-button" type="button" data-pack-mail="toggle-read">' + (m.r ? 'Marquer non lu' : 'Marquer comme lu') + '</button></aside></div>' +
      '<footer class="fm26-inbox-actions"><button class="primary" type="button" data-pack-mail="report">Voir rapport</button><button type="button" data-pack-mail="list">Boîte de réception</button>' +
      '<button type="button" data-pack-mail="previous" ' + (idx <= 0 ? 'disabled' : '') + '>◀ Précédent</button><button type="button" data-pack-mail="next" ' + (idx >= messages.length - 1 ? 'disabled' : '') + '>Suivant ▶</button></footer></main>';
  }

  function renderPage() {
    if (S.view === 'home') return dashboardMarkup();
    if (S.view === 'mgr') return (typeof V !== 'undefined' && typeof V.mgr === 'function') ? V.mgr() : managerMarkup();
    if (S.view === 'comp') return competitionMarkup();
    if (S.view === 'squad') return squadMarkup();
    if (S.view === 'fin') return financeMarkup();
    if (S.view === 'inbox') return messageMarkup();
    if (S.view === 'pre') return lineupMarkup();
    return '';
  }

  function updateSectionForView() {
    if (S.view === 'home') section = 'coach';
    else if (S.view === 'mgr') section = 'coach';
    else if (S.view === 'comp') section = 'world';
    else if (S.view === 'squad') section = 'search';
    else if (S.view === 'fin' || S.view === 'jobs') section = 'search';
    else if (S.view === 'tactics' || S.view === 'sched') section = 'club';
  }

  function wirePage() {
    const input = $('fm26-pack-player-search');
    if (input) input.addEventListener('input',() => {
      playerFilter = input.value.toLowerCase();
      const body = $('fm26-pack-squad-body');
      if (body) body.querySelectorAll('tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(playerFilter) ? '' : 'none'; });
    });
    const body = $('fm26-pack-squad-body');
    if (body) body.onclick = e => {
      const row = e.target.closest('[data-pack-player]');
      if (!row) return;
      const idx = (S.sq || []).findIndex(p => Number(p.id) === Number(row.dataset.packPlayer));
      if (idx >= 0) { S.pid = idx; S.view = 'player'; try { sv(); } catch (_) {} render(); }
    };
  }

  function wireInbox() {
    const view = $('vw');
    if (!view) return;
    view.onclick = e => {
      const b = e.target.closest('[data-pack-mail]');
      if (!b) return;
      const action = b.dataset.packMail;
      const messages = S.ib || [];
      const idx = Math.max(0,Math.min(messages.length - 1,Number(S.mi) || 0));
      if (action === 'select') { S.mi = Number(b.dataset.index) || 0; mailListMode = false; render(); }
      else if (action === 'list') { mailListMode = true; render(); }
      else if (action === 'toggle-read') { if (messages[idx]) messages[idx].r = !messages[idx].r; try { sv(); } catch (_) {} render(); }
      else if (action === 'report') { if (messages[idx]) messages[idx].r = true; mailListMode = false; try { sv(); } catch (_) {} if (typeof toast === 'function') toast('Rapport consulté'); render(); }
      else if (action === 'previous') { S.mi = Math.max(0,idx - 1); mailListMode = false; render(); }
      else if (action === 'next') { S.mi = Math.min(Math.max(0,messages.length - 1),idx + 1); mailListMode = false; render(); }
    };
  }

  function wireLineup() {
    const view = $('vw');
    if (!view) return;
    view.onclick = e => {
      const b = e.target.closest('[data-pack-lineup]');
      if (!b) return;
      const action = b.dataset.packLineup;
      const lineup = window.FM26MatchDay && typeof window.FM26MatchDay.getLineup === 'function' ? window.FM26MatchDay.getLineup() : (typeof xi === 'function' ? xi() : []);
      if (action === 'slot') { preSelectedSlot = Number(b.dataset.slot); render(); }
      else if (action === 'bench') {
        const incoming = (S.sq || []).find(p => Number(p.id) === Number(b.dataset.player));
        if (preSelectedSlot == null || !incoming || !lineup[preSelectedSlot]) { if (typeof toast === 'function') toast('Sélectionne d’abord un titulaire sur le terrain.'); return; }
        const outgoing = lineup[preSelectedSlot];
        lineup[preSelectedSlot] = incoming;
        S.lineup = lineup.map(p => p.id);
        preSelectedSlot = null;
        try { sv(); } catch (_) {}
        if (typeof toast === 'function') toast(incoming.name + ' remplace ' + outgoing.name);
        render();
      } else if (action === 'clear') {
        S.lineup = [];
        preSelectedSlot = null;
        try { sv(); } catch (_) {}
        render();
      } else if (action === 'start') {
        const current = window.FM26MatchDay && typeof window.FM26MatchDay.getLineup === 'function' ? window.FM26MatchDay.getLineup() : (typeof xi === 'function' ? xi() : []);
        S.lineup = current.map(p => p.id);
        try { sv(); } catch (_) {}
        if (typeof startMatch === 'function') startMatch();
      }
    };
    view.onchange = e => {
      if (e.target && e.target.id === 'fm26-pack-formation') {
        S.tc.f = e.target.value;
        S.lineup = [];
        preSelectedSlot = null;
        try { sv(); } catch (_) {}
        render();
      }
    };
  }

  function renderFrame() {
    if (!S || !$('app') || $('app').classList.contains('hid')) {
      document.body.classList.remove('fm26-screenpack-active','fm26-inbox-active','fm26-lineup-active');
      return;
    }
    const isMatch = S.view === 'match';
    const isPre = S.view === 'pre';
    const isInbox = S.view === 'inbox';
    const active = !isMatch && ['home','mgr','comp','squad','fin','jobs','tactics','sched','player','news','post','inbox','pre'].includes(S.view);
    document.body.classList.toggle('fm26-screenpack-active',active && !isPre);
    document.body.classList.toggle('fm26-inbox-active',isInbox);
    document.body.classList.toggle('fm26-lineup-active',isPre);
    const pane = ensurePane();
    if (pane) pane.style.display = active && !isPre && !isInbox ? 'flex' : 'none';
    if (isMatch) return;

    if (isPre) {
      $('fm26-ref-menu')?.classList.remove('show');
      $('vw').innerHTML = lineupMarkup();
      wireLineup();
      return;
    }
    if (isInbox) {
      $('fm26-ref-menu')?.classList.remove('show');
      renderRail('inbox');
      $('vw').innerHTML = messageMarkup();
      wireInbox();
      return;
    }
    if (!active) return;

    updateSectionForView();
    $('fm26-ref-menu')?.classList.remove('show');
    renderRail(section);
    renderPane();
    if (['home','mgr','comp','squad','fin'].includes(S.view)) $('vw').innerHTML = renderPage();
    wirePage();
  }

  const previousRender = render;
  render = function () {
    const result = previousRender.apply(this,arguments);
    try { renderFrame(); }
    catch (error) { console.warn('[FM26] Screen Pack render:',error); }
    return result;
  };

  window.addEventListener('resize',() => {
    if (S && S.view === 'pre') document.body.classList.add('fm26-lineup-active');
  });
  window.FM26ScreenPack = {
    render:() => render(),
    setSection:key => {
      section = key;
      const map = {coach:'mgr',club:'squad',world:'comp',search:'squad',opt:'mgr'};
      S.view = map[key] || 'home';
      render();
    },
    get section() { return section; }
  };
  ensurePane();
})();