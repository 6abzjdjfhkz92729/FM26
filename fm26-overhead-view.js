/* FM26 — vue de match aérienne inspirée de la capture fournie.
   Canvas 2D + interpolation continue, relié à S / M / FM du jeu. */
(() => {
  'use strict';
  if (typeof V === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
  const state = {
    raf: 0, last: 0, speed: 1, interval: 170, panel: '',
    ball: { x: 50, y: 50 }, ballTrail: [], players: new Map(),
    ballImage: null, imageReady: false, lastComment: '', lastEvent: ''
  };
  const speedIntervals = { 1: 170, 2: 85, 4: 42 };
  const mentalityOptions = ['Cautious', 'Balanced', 'Positive', 'Attacking'];

  const style = document.createElement('style');
  style.textContent = `
    body.fm26-overhead-live{margin:0!important;overflow:hidden!important;background:#070a0d!important}
    body.fm26-overhead-live #side,body.fm26-overhead-live #fm26-manager-sidebar,
    body.fm26-overhead-live #hd,body.fm26-overhead-live #fm26-ref-menu,
    body.fm26-overhead-live #fm26-rails-reopen{display:none!important}
    body.fm26-overhead-live #app:not(.hid){display:block!important;width:100vw!important;height:100dvh!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
    body.fm26-overhead-live #main{display:block!important;width:100%!important;height:100%!important;min-width:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
    body.fm26-overhead-live #vw{display:block!important;position:relative!important;width:100vw!important;height:100dvh!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#080b0e!important}
    .oh-match{position:relative;display:grid;grid-template-rows:58px minmax(0,1fr) 72px;width:100%;height:100%;min-height:0;background:#080a0d;color:#f7f9fc;font-family:Inter,Segoe UI,Arial,sans-serif;overflow:hidden}
    .oh-top{z-index:5;display:grid;grid-template-columns:56px minmax(0,1fr) auto;align-items:stretch;min-width:0;background:#050607;border-bottom:2px solid #202a30;box-shadow:0 3px 15px #0008}
    .oh-iconbtn{display:grid;place-items:center;min-width:0;border:0;border-radius:0;background:#06080a;color:#fff;font-size:23px;font-weight:900;cursor:pointer}
    .oh-iconbtn:hover,.oh-action:hover{filter:brightness(1.18)}
    .oh-scorebar{display:flex;min-width:0;align-items:stretch;justify-content:center;gap:0}
    .oh-clock{display:flex;align-items:center;justify-content:center;min-width:76px;padding:0 12px;background:#400b48;color:#fff;font-size:clamp(17px,1.65vw,26px);font-weight:850;font-variant-numeric:tabular-nums}
    .oh-team{display:flex;align-items:center;justify-content:center;gap:9px;min-width:0;padding:0 clamp(9px,1.8vw,27px);font-size:clamp(15px,1.55vw,25px);font-weight:950;letter-spacing:.035em;white-space:nowrap}
    .oh-team.home{background:#e9b63e;color:#18130a}
    .oh-team.away{background:#6d9fca;color:#101d2a}
    .oh-score{display:flex;align-items:center;justify-content:center;gap:8px;padding:0 12px;background:#171322;color:#fff;font-size:clamp(23px,2.4vw,39px);font-weight:950;font-variant-numeric:tabular-nums}
    .oh-league{align-self:center;margin:0 10px;color:#aeb7c4;font-size:10px;font-weight:850;letter-spacing:.12em;white-space:nowrap}
    .oh-topright{display:flex;align-items:stretch}
    .oh-topright .oh-iconbtn{width:58px}
    .oh-pause{min-width:132px;padding:0 22px;background:#9834e7;font-size:clamp(16px,1.7vw,24px)}
    .oh-stage{position:relative;min-width:0;min-height:0;overflow:hidden;background:#d3d6d5}
    #oh-canvas{display:block;width:100%;height:100%;touch-action:manipulation}
    .oh-bottom{z-index:5;display:grid;grid-template-columns:64px minmax(0,1fr) auto;min-width:0;background:#06080a;border-top:2px solid #252c31}
    .oh-bottom-icon{display:grid;place-items:center;background:#06080a;color:#fff;border:0;border-right:1px solid #27313a;font-size:23px;cursor:pointer}
    .oh-comment{display:flex;align-items:center;min-width:0;padding:8px clamp(12px,2vw,28px);background:#6c9fc9;color:#f8fbff;font-size:clamp(14px,1.55vw,23px);font-weight:650;line-height:1.2;overflow:hidden}
    .oh-controls{display:flex;align-items:center;gap:clamp(5px,1vw,14px);padding:0 15px;background:#07090b;white-space:nowrap}
    .oh-action{min-height:39px;padding:7px 11px;border:1px solid #36424e;border-radius:7px;background:#17212b;color:#f1f5fa;font-size:13px;font-weight:850;cursor:pointer}
    .oh-action.active{background:#2d5a7c;border-color:#8cc9f4}
    .oh-action.mentality{min-width:100px}
    .oh-pill{color:#cad3de;font-size:12px;font-weight:800}
    .oh-overlay{position:absolute;z-index:8;top:72px;right:16px;width:min(360px,calc(100vw - 32px));max-height:calc(100% - 150px);overflow:auto;padding:17px;background:#101a26f5;border:1px solid #60768d;border-radius:12px;box-shadow:0 18px 50px #0009;backdrop-filter:blur(14px)}
    .oh-overlay h3{margin:0 0 13px;font-size:17px}
    .oh-overlay .oh-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid #ffffff17;font-size:12px}
    .oh-overlay .oh-row b{font-variant-numeric:tabular-nums}
    .oh-overlay select{max-width:150px;padding:8px 10px;border-radius:7px;border:1px solid #526980;background:#0c1420;color:#fff}
    .oh-overlay .oh-close{float:right;border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer}
    .oh-paused{position:absolute;z-index:7;inset:0;display:grid;place-items:center;background:#02060a80;backdrop-filter:blur(3px);pointer-events:none}
    .oh-paused span{padding:17px 30px;border:1px solid #c7d7e8;border-radius:10px;background:#111d2bdc;font-size:clamp(25px,4vw,54px);font-weight:950;letter-spacing:.1em}
    .oh-goalflash{position:absolute;z-index:6;left:50%;top:13%;transform:translateX(-50%);padding:12px 28px;border:1px solid #d9e9f7;border-radius:8px;background:#0c2035eF;color:#fff;font-size:clamp(16px,2vw,27px);font-weight:950;box-shadow:0 10px 30px #0008;pointer-events:none}
    @media(max-width:760px){
      .oh-match{grid-template-rows:54px minmax(0,1fr) 78px}
      .oh-top{grid-template-columns:42px minmax(0,1fr) auto}
      .oh-clock{min-width:49px;padding:0 5px;font-size:15px}
      .oh-team{padding:0 6px;gap:4px;font-size:13px}
      .oh-score{gap:4px;padding:0 6px;font-size:23px}
      .oh-league{display:none}
      .oh-topright .oh-iconbtn{width:40px}
      .oh-pause{min-width:66px;padding:0 8px;font-size:15px}
      .oh-bottom{grid-template-columns:43px minmax(0,1fr)}
      .oh-controls{grid-column:1/-1;justify-content:center;padding:4px 6px}
      .oh-comment{grid-column:2;grid-row:1;min-height:38px;font-size:14px}
      .oh-bottom-icon{grid-column:1;grid-row:1}
      .oh-action{min-height:29px;padding:4px 8px;font-size:11px}
    }
  `;
  document.head.appendChild(style);

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function abbreviate(name) {
    const known = {
      'Wolverhampton Wanderers':'WOL','Wolves':'WOL','Manchester City':'MCI','Man City':'MCI',
      'Manchester United':'MUN','Man United':'MUN','Arsenal':'ARS','Leeds United':'LEE',
      'Liverpool':'LIV','Chelsea':'CHE','Tottenham':'TOT','Brighton':'BHA',
      'Nottingham Forest':'NFO','Aston Villa':'AVL','Newcastle':'NEW','West Ham':'WHU',
      'Crystal Palace':'CRY','Everton':'EVE','Brentford':'BRE','Fulham':'FUL'
    };
    if (known[name]) return known[name];
    return String(name || 'CLB').replace(/[^A-Za-zÀ-ÿ]/g,'').slice(0,3).toUpperCase() || 'CLB';
  }
  function currentXI(side) {
    const fixture = M && M.f;
    if (!fixture) return [];
    const team = side === 0 ? fixture.home : fixture.away;
    if (team === S.club) {
      if (window.FM26MatchDay && typeof window.FM26MatchDay.getLineup === 'function') {
        const selected = window.FM26MatchDay.getLineup();
        if (selected && selected.length) return selected.slice(0,11);
      }
      return typeof xi === 'function' ? xi().slice(0,11) : [];
    }
    return typeof oppXI === 'function' ? oppXI(team).slice(0,11) : [];
  }
  function formationFor(side) {
    const team = side === 0 ? M.f.home : M.f.away;
    const selected = team === S.club ? (S.tc && S.tc.f) : '4-3-3';
    return (typeof FM !== 'undefined' && (FM[selected] || FM['4-3-3'])) || [];
  }
  function targetPosition(side,index,spot) {
    const team = side === 0 ? M.f.home : M.f.away;
    const baseX = 4 + (100 - Number(spot && spot[1] || 50)) * .42;
    const baseY = Number(spot && spot[0] || 50);
    const possession = Number(M.possessionSide) === side;
    const zone = M.zone && Number(M.zone[side]) || 2;
    const direction = side === 0 ? 1 : -1;
    const advance = (zone - 2) * 4.3 * direction * (possession ? 1 : .48);
    const ballX = clamp(M.bx == null ? 50 : M.bx,2,98);
    const ballY = clamp(M.by == null ? 50 : M.by,2,98);
    const pull = possession ? .115 : .065;
    const phase = Math.sin((Number(M.min)||0)*.25 + index*1.37 + side*2.1) * .8;
    const x = side === 0 ? baseX + advance + (ballX-baseX)*pull : 100-baseX + advance + (ballX-(100-baseX))*pull;
    const y = baseY + (ballY-baseY)*pull*.82 + phase;
    return {x:clamp(x,3,97),y:clamp(y,4,96),team};
  }
  function ease(current,target,dt,rate) {
    return current + (target-current) * (1-Math.exp(-Math.max(0,dt)/rate));
  }
  function roundedRect(ctx,x,y,w,h,r) {
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function drawPitch(ctx,w,h) {
    const x=w*.087,y=h*.025,pw=w*.826,ph=h*.95;
    ctx.fillStyle='#d0d3d2';ctx.fillRect(0,0,w,h);
    // Tribune bands and tunnel-side rails.
    for(let side=0;side<2;side++){
      const sx=side===0?0:x+pw;
      const sw=x;
      const g=ctx.createLinearGradient(sx,0,sx+sw,0);
      g.addColorStop(0,'#aeb3b3');g.addColorStop(.52,'#eceeed');g.addColorStop(1,'#b9bdbd');
      ctx.fillStyle=g;ctx.fillRect(sx,0,sw,h);
      ctx.strokeStyle='rgba(255,255,255,.34)';ctx.lineWidth=2;
      for(let yy=18;yy<h;yy+=Math.max(38,h*.075)){ctx.beginPath();ctx.moveTo(sx+5,yy);ctx.lineTo(sx+sw-5,yy);ctx.stroke();}
      ctx.fillStyle='#111820';ctx.fillRect(side===0?x*.11:x+pw*.965,h*.075,Math.max(5,w*.006),h*.85);
    }
    ctx.save();
    ctx.shadowColor='#06150d99';ctx.shadowBlur=24;ctx.shadowOffsetY=7;
    const field=ctx.createLinearGradient(x,y,x+pw,y+ph);
    field.addColorStop(0,'#79aa68');field.addColorStop(.45,'#6f9f60');field.addColorStop(1,'#5d9155');
    ctx.fillStyle=field;ctx.fillRect(x,y,pw,ph);ctx.restore();
    // Alternating mowing bands, soft enough to keep players readable.
    for(let i=0;i<12;i++){
      ctx.fillStyle=i%2===0?'rgba(225,255,214,.055)':'rgba(10,45,20,.055)';
      ctx.fillRect(x+i*pw/12,y,pw/12,ph);
    }
    const glow=ctx.createRadialGradient(x+pw*.44,y+ph*.45,ph*.03,x+pw*.5,y+ph*.5,pw*.57);
    glow.addColorStop(0,'rgba(218,255,194,.12)');glow.addColorStop(1,'rgba(0,0,0,.13)');
    ctx.fillStyle=glow;ctx.fillRect(x,y,pw,ph);
    // Pitch lines.
    ctx.strokeStyle='rgba(238,250,231,.67)';ctx.lineWidth=Math.max(1.4,h*.0023);
    ctx.strokeRect(x+pw*.025,y+ph*.025,pw*.95,ph*.95);
    ctx.beginPath();ctx.moveTo(x+pw*.5,y+ph*.025);ctx.lineTo(x+pw*.5,y+ph*.975);ctx.stroke();
    ctx.beginPath();ctx.arc(x+pw*.5,y+ph*.5,ph*.125,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(245,255,239,.7)';ctx.beginPath();ctx.arc(x+pw*.5,y+ph*.5,2.5,0,Math.PI*2);ctx.fill();
    const boxW=pw*.145,boxH=ph*.39,sixW=pw*.055,sixH=ph*.19;
    for(const side of [0,1]){
      const bx=side===0?x+pw*.025:x+pw*.975-boxW;
      ctx.strokeRect(bx,y+(ph-boxH)/2,boxW,boxH);
      const sx=side===0?x+pw*.025:x+pw*.975-sixW;
      ctx.strokeRect(sx,y+(ph-sixH)/2,sixW,sixH);
      const goalX=side===0?x-pw*.008:x+pw;
      ctx.fillStyle='rgba(237,245,232,.55)';ctx.fillRect(goalX,y+ph*.44,pw*.012,ph*.12);
      ctx.fillStyle='rgba(245,255,241,.72)';ctx.beginPath();ctx.arc(side===0?x+pw*.105:x+pw*.895,y+ph*.5,2.4,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(side===0?x+pw*.105:x+pw*.895,y+ph*.5,ph*.092,side===0?-.85:.85,side===0?.85:Math.PI*2-.85);ctx.stroke();
    }
    ctx.restore();
    return {x,y,w:pw,h:ph};
  }
  function drawPlayer(ctx,p,x,y,r,side,index,selected) {
    const isKeeper=index===0;
    const fill=isKeeper?(side===0?'#d6403d':'#f0d82f'):(side===0?'#e9b94c':'#6fa8d5');
    const stroke=isKeeper?'#2a2223':(side===0?'#966b22':'#355d83');
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.shadowColor='transparent';ctx.lineWidth=1.8;ctx.strokeStyle=stroke;ctx.stroke();
    if(selected){ctx.beginPath();ctx.arc(x,y,r+3.8,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.stroke();}
    ctx.fillStyle=side===0?'#312610':'#f1f7fc';
    ctx.font='800 '+Math.max(9,r*.9)+'px Inter,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(p.no||index+1),x,y+.3);
    ctx.restore();
  }
  function drawBall(ctx,x,y,r,img) {
    ctx.save();ctx.globalAlpha=.25;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x+2,y+r*.8,r*1.05,r*.42,0,0,Math.PI*2);ctx.fill();ctx.restore();
    if(img && img.complete && img.naturalWidth){
      ctx.drawImage(img,x-r,y-r,r*2,r*2);
    }else{
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#15202a';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#172330';
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*.42,y+Math.sin(a)*r*.42,r*.17,0,Math.PI*2);ctx.fill();}
    }
  }
  function readPair(key) {
    const v=M && M.stats && M.stats[key];
    return Array.isArray(v)?v:[0,0];
  }
  function panelMarkup() {
    if(!state.panel)return '';
    const isStats=state.panel==='stats';
    const fixture=M&&M.f||{};
    const stats=[
      ['Possession',String(Number(M.ps)||50)+'% – '+(100-(Number(M.ps)||50))+'%'],
      ['Tirs',String((M.sh||[0,0])[0])+' – '+String((M.sh||[0,0])[1])],
      ['Tirs cadrés',readPair('shotsOnTarget').join(' – ')],
      ['Buts attendus · xG',readPair('xg').map(n=>(Number(n)||0).toFixed(2)).join(' – ')],
      ['Passes réussies',readPair('completed').map((n,i)=>n+'/'+readPair('passes')[i]).join(' – ')],
      ['Fautes',readPair('fouls').join(' – ')],
      ['Corners',readPair('corners').join(' – ')],
      ['Cartons jaunes',readPair('yellow').join(' – ')],
      ['Cartons rouges',readPair('red').join(' – ')]
    ];
    if(isStats){
      return '<aside class="oh-overlay"><button class="oh-close" data-oh-action="close">×</button><h3>Statistiques du match</h3>'+
        stats.map(r=>'<div class="oh-row"><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>').join('')+
        '<h3 style="margin-top:17px">Derniers événements</h3>'+
        (M.ev||[]).slice(0,6).map(e=>'<div class="oh-row"><span>'+esc(e.m)+"' · "+esc(e.t)+'</span></div>').join('')+'</aside>';
    }
    return '<aside class="oh-overlay"><button class="oh-close" data-oh-action="close">×</button><h3>Commandes du match</h3>'+
      '<div class="oh-row"><span>Vitesse de simulation</span><span>'+[1,2,4].map(n=>'<button class="oh-action '+(state.speed===n?'active':'')+'" data-oh-action="speed" data-speed="'+n+'">'+n+'×</button>').join(' ')+'</span></div>'+
      '<div class="oh-row"><span>Mentalité</span><select id="oh-mentality">'+mentalityOptions.map(v=>'<option '+((S.tc&&S.tc.m||'Balanced')===v?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
      '<div class="oh-row"><span>Style de jeu</span><select id="oh-style">'+['Control Possession','Tiki-Taka','Gegenpress','Wing Play','Counter-Attack','Low Block'].map(v=>'<option '+((S.tc&&S.tc.s||'Control Possession')===v?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
      '<div class="oh-row"><span>Formation</span><b>'+esc(S.tc&&S.tc.f||'4-3-3')+'</b></div></aside>';
  }
  function markup() {
    const f=M&&M.f||{};
    const home=esc(f.home||'Équipe domicile'),away=esc(f.away||'Équipe extérieure');
    const homeShort=esc(abbreviate(f.home)),awayShort=esc(abbreviate(f.away));
    const league=esc(f.comp||S.lg||'Championnat');
    return '<main class="oh-match">'+
      '<header class="oh-top"><button class="oh-iconbtn" data-oh-action="stats" aria-label="Statistiques">☰</button>'+
      '<div class="oh-scorebar"><div class="oh-clock" id="oh-clock">00\'</div>'+
      '<div class="oh-team home"><span>'+homeShort+'</span></div><div class="oh-score"><b id="oh-home-score">'+Number(M.h||0)+'</b><span>–</span><b id="oh-away-score">'+Number(M.a||0)+'</b></div>'+
      '<div class="oh-team away"><span>'+awayShort+'</span></div><div class="oh-league">'+league+'</div></div>'+
      '<div class="oh-topright"><button class="oh-iconbtn" data-oh-action="settings" title="Commandes">⚙</button><button class="oh-iconbtn oh-pause" id="oh-pause" data-oh-action="pause">'+(M.p?'Reprendre':'Pause')+'</button></div></header>'+
      '<section class="oh-stage"><canvas id="oh-canvas" aria-label="Terrain de football vu du dessus"></canvas><div id="oh-panel-root">'+panelMarkup()+'</div><div id="oh-paused" class="oh-paused" style="display:'+(M.p?'grid':'none')+'"><span>MATCH EN PAUSE</span></div><div id="oh-goalflash" class="oh-goalflash" style="display:none">⚽ BUT !</div></section>'+
      '<footer class="oh-bottom"><button class="oh-bottom-icon" data-oh-action="stats" title="Statistiques">▣</button>'+
      '<div class="oh-comment" id="oh-comment">'+esc(M.cm||'Coup d’envoi. Les équipes se mettent en place.')+'</div>'+
      '<div class="oh-controls"><span class="oh-pill" id="oh-subs">↔ '+Math.max(0,5-(M.subsUsed||0))+'/5</span>'+
      '<button class="oh-action" data-oh-action="subs">Changements</button><button class="oh-action mentality" data-oh-action="settings">'+esc(S.tc&&S.tc.m||'Balanced')+'</button>'+
      '<button class="oh-action" data-oh-action="speed" data-speed="2">2×</button></div></footer></main>';
  }
  function paint(ctx,canvas,dt) {
    const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
    if(!w||!h)return;
    const bw=Math.round(w*dpr),bh=Math.round(h*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const field=drawPitch(ctx,w,h);
    const teams=[currentXI(0),currentXI(1)];
    let nearest=null,nearestD=Infinity;
    teams.forEach((players,side)=>{
      const formation=formationFor(side);
      players.slice(0,11).forEach((p,i)=>{
        const target=targetPosition(side,i,formation[i]||[50,50]);
        const key=side+':'+i+':'+String(p.id==null?p.name:p.id);
        let pos=state.players.get(key);
        if(!pos){pos={x:target.x,y:target.y};state.players.set(key,pos);}
        pos.x=ease(pos.x,target.x,dt,340);pos.y=ease(pos.y,target.y,dt,340);
        const x=field.x+field.w*pos.x/100,y=field.y+field.h*pos.y/100;
        const bx=field.x+field.w*state.ball.x/100,by=field.y+field.h*state.ball.y/100;
        const d=(x-bx)*(x-bx)+(y-by)*(y-by);
        if(d<nearestD){nearestD=d;nearest={p,x,y,side,index:i};}
        drawPlayer(ctx,p,x,y,clamp(h*.018,10,18),side,i,false);
      });
    });
    const targetX=clamp(M.bx==null?50:M.bx,2,98),targetY=clamp(M.by==null?50:M.by,2,98);
    state.ball.x=ease(state.ball.x,targetX,dt,270);
    state.ball.y=ease(state.ball.y,targetY,dt,270);
    if(nearest){
      // Repaint the closest marker with a bright selection ring.
      drawPlayer(ctx,nearest.p,nearest.x,nearest.y,clamp(h*.018,10,18),nearest.side,nearest.index,true);
    }
    const bx=field.x+field.w*state.ball.x/100,by=field.y+field.h*state.ball.y/100;
    state.ballTrail.push({x:bx,y:by});if(state.ballTrail.length>9)state.ballTrail.shift();
    state.ballTrail.forEach((pt,i)=>{
      const alpha=(i/state.ballTrail.length)*.18;
      ctx.fillStyle='rgba(255,255,255,'+alpha+')';ctx.beginPath();ctx.arc(pt.x,pt.y,2+i*.18,0,Math.PI*2);ctx.fill();
    });
    drawBall(ctx,bx,by,clamp(h*.013,7,12),state.ballImage);
    if(nearest && nearestD < Math.pow(h*.19,2)){
      const label=String(nearest.p.name||'Joueur').split(' ').slice(-1)[0];
      ctx.save();ctx.font='700 12px Inter,Arial,sans-serif';const tw=ctx.measureText(label).width;
      const lx=clamp(nearest.x+17,field.x+5,field.x+field.w-tw-18);
      const ly=clamp(nearest.y-15,field.y+16,field.y+field.h-8);
      roundedRect(ctx,lx-5,ly-13,tw+10,19,5);ctx.fillStyle='rgba(11,20,28,.65)';ctx.fill();
      ctx.fillStyle='#f7fafc';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,lx,ly-3);ctx.restore();
    }
  }
  function updateHud() {
    if(!M)return;
    const clock=$('oh-clock'),hs=$('oh-home-score'),as=$('oh-away-score'),comment=$('oh-comment');
    if(clock)clock.textContent=String(M.min||0).padStart(2,'0')+"'";
    if(hs)hs.textContent=String(M.h||0);
    if(as)as.textContent=String(M.a||0);
    if(comment && M.cm && M.cm!==state.lastComment){comment.textContent=M.cm;state.lastComment=M.cm;}
    const pause=$('oh-pause');if(pause)pause.textContent=M.p?'Reprendre':'Pause';
    const overlay=$('oh-paused');if(overlay)overlay.style.display=M.p?'grid':'none';
    const subs=$('oh-subs');if(subs)subs.textContent='↔ '+Math.max(0,5-(M.subsUsed||0))+'/5';
    const tactic=document.querySelector('.oh-action.mentality');if(tactic&&S.tc)tactic.textContent=S.tc.m||'Balanced';
    const goal=$('oh-goalflash');
    if(goal){const visible=Number(M.gt)>0;goal.style.display=visible?'block':'none';if(visible)goal.textContent='⚽ '+(M.gc||'BUT !');}
  }
  function loop(ts) {
    if(!S || S.view!=='match'){cancelAnimationFrame(state.raf);document.body.classList.remove('fm26-overhead-live');state.raf=0;return;}
    const dt=state.last?Math.min(50,ts-state.last):16;state.last=ts;
    const canvas=$('oh-canvas');
    if(canvas){const ctx=canvas.getContext('2d');paint(ctx,canvas,dt);}
    updateHud();
    state.raf=requestAnimationFrame(loop);
  }
  function beginLoop() {
    cancelAnimationFrame(state.raf);state.last=0;
    if(!state.ballImage){
      state.ballImage=new Image();state.ballImage.src='./fm26-ball.svg';
      state.ballImage.onload=()=>{state.imageReady=true;};
    }
    state.raf=requestAnimationFrame(loop);
  }
  function pauseMatch() {
    if(!M)return;
    M.p=!M.p;
    if(M.p){try{clearInterval(T);}catch(_){}}
    else{try{clearInterval(T);M.sp=state.interval;T=setInterval(tick,state.interval);}catch(_){}}
    try{if(typeof sv==='function')sv();}catch(_){}
    updateHud();
  }
  function setSpeed(speed) {
    state.speed=speed;state.interval=speedIntervals[speed]||170;
    if(M && !M.p && !M.done){
      try{clearInterval(T);M.sp=state.interval;T=setInterval(tick,state.interval);}catch(_){}
    }
    const root=$('oh-panel-root');if(root)root.innerHTML=panelMarkup();
    updateHud();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-oh-action]');
    if(!button || !document.body.classList.contains('fm26-overhead-live'))return;
    const action=button.dataset.ohAction;
    if(action==='pause'){pauseMatch();return;}
    if(action==='speed'){setSpeed(Number(button.dataset.speed)||2);return;}
    if(action==='stats'){state.panel=state.panel==='stats'?'':'stats';const root=$('oh-panel-root');if(root)root.innerHTML=panelMarkup();return;}
    if(action==='settings'){state.panel=state.panel==='settings'?'':'settings';const root=$('oh-panel-root');if(root)root.innerHTML=panelMarkup();return;}
    if(action==='close'){state.panel='';const root=$('oh-panel-root');if(root)root.innerHTML='';return;}
    if(action==='subs'){
      if(window.FM26MatchDay && typeof window.FM26MatchDay.openSubstitutions==='function')window.FM26MatchDay.openSubstitutions();
      return;
    }
  });
  document.addEventListener('change',event=>{
    if(!document.body.classList.contains('fm26-overhead-live'))return;
    if(event.target.id==='oh-mentality' && S.tc){
      S.tc.m=event.target.value;if(typeof sv==='function')sv();
      if(M){M.cm='Consigne tactique modifiée : '+S.tc.m+'.';M.ev.unshift({m:M.min,k:'⚙',t:M.cm});}
      const root=$('oh-panel-root');if(root)root.innerHTML=panelMarkup();updateHud();
    }
    if(event.target.id==='oh-style' && S.tc){
      S.tc.s=event.target.value;if(typeof sv==='function')sv();
      if(M){M.cm='Style de jeu : '+S.tc.s+'.';M.ev.unshift({m:M.min,k:'⚙',t:M.cm});}
      const root=$('oh-panel-root');if(root)root.innerHTML=panelMarkup();updateHud();
    }
  });
  V.match=function(){
    document.body.classList.add('fm26-overhead-live');
    state.panel='';
    const html=markup();
    requestAnimationFrame(beginLoop);
    return html;
  };
  window.FM26OverheadMatch={setSpeed,refresh:()=>{if(S&&S.view==='match')render();},get state(){return state;}};
})();