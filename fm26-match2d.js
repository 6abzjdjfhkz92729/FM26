/* FM26 — amélioration du rendu 2D du match.
   S'appuie sur le terrain, le HUD et le moteur déjà présents dans index.html.
   Ne remplace pas leurs éléments : le score, l'horloge, les statistiques,
   les commentaires, les événements et les actions restent ceux du jeu. */
(function () {
  'use strict';
  if (window.FM26Match2D) return;
  if (typeof draw !== 'function') return;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, Number(value) || 0));

  const css = document.createElement('style');
  css.id = 'fm26-match2d-style';
  css.textContent = [
    '.arena #pt.pitch{position:relative;overflow:hidden;aspect-ratio:2/1}',
    '.arena #pt.pitch:before{inset:3%;border:1px solid #e8f4e4dd}',
    '.arena #pt.pitch.hz:after{left:50%;right:auto;top:3%;bottom:3%;border:0;border-left:1px solid #e8f4e4dd}',
    '.arena #pt .bx{top:24%;bottom:24%;width:13%;border-color:#e8f4e4dd}',
    '.arena #pt .bx.l{left:3%;border-left:0}',
    '.arena #pt .bx.r{right:3%;border-right:0}',
    '.arena #pt .cc{width:14%;border-color:#e8f4e4dd}',
    '.arena #pt .dt.hm{background:#2f75bd;color:#fff;border:2px solid #f7fbff;box-shadow:0 2px 6px #0009}',
    '.arena #pt .dt.aw{background:#e1b43e;color:#18130a;border:2px solid #fff6dc;box-shadow:0 2px 6px #0009}',
    '.arena #pt .dt.ref{background:#25252b;color:#fff;border:2px solid #e7e7e7}',
    '.arena #pt .dt.ass{background:#24242a;color:#fff;border:2px solid #f0d36b}',
    '.arena #pt .ball{width:19px;height:19px;background:transparent url(\'./fm26-ball.svg\') center/contain no-repeat;border:0;box-shadow:none;filter:drop-shadow(0 2px 3px #000b);z-index:5;animation:fm26-ball-spin .42s linear infinite}',
    '@keyframes fm26-ball-spin{to{filter:brightness(1.06);transform:translate(-50%,-50%) rotate(360deg)}}',
    '@media(max-width:700px){.arena #pt .dt{width:19px;height:19px;font-size:9px}.arena #pt .ball{width:9px;height:9px}}'
  ].join('');
  document.head.appendChild(css);

  function formationPositions(home) {
    const formation = (typeof FM === 'object' && S && S.tc && FM[S.tc.f]) || FM['4-3-3'];
    // Même conversion que V.match : le terrain tactique vertical est pivoté
    // en terrain horizontal, chaque équipe occupant sa propre moitié.
    return formation.map(position => {
      const depth = 4 + (100 - Number(position[1])) * 0.42;
      return {
        x: clamp(home ? depth : 100 - depth, 4, 96),
        y: clamp(position[0], 5, 95)
      };
    });
  }

  function dotPositions(home) {
    const base = formationPositions(home);
    const ballX = clamp(M && M.bx, 0, 100);
    const ballY = clamp(M && M.by, 0, 100);
    return base.map((position, index) => {
      const clock = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
      const phase = Math.sin((M.min || 0) * 0.25 + clock * 2.1 + index * 1.7) * 2.15;
      const lateral = Math.cos(clock * 1.35 + index * 1.1) * 1.05;
      const pullX = clamp((ballX - position.x) * 0.075, -5.5, 5.5);
      const pullY = clamp((ballY - position.y) * 0.065, -4.5, 4.5);
      return {
        x: clamp(position.x + pullX * 1.12 + phase * 0.26 + lateral, 3, 97),
        y: clamp(position.y + pullY * 1.08 + phase + lateral * 0.55, 5, 95),
        index
      };
    });
  }

  function renderTeamDots(pitch, home) {
    const selector = home ? '.dt.hm' : '.dt.aw';
    const elements = pitch.querySelectorAll(selector);
    const positions = dotPositions(home);
    elements.forEach((element, index) => {
      const position = positions[index];
      if (!position) return;
      element.textContent = String(index + 1);
      element.dataset.m2dId = (home ? 'home-' : 'away-') + index;
      element.style.left = position.x + '%';
      element.style.top = position.y + '%';
      element.style.right = 'auto';
      element.style.transition = 'left 160ms linear, top 160ms linear';
      element.style.zIndex = '3';
    });
  }

  function drawMatch2D() {
    const pitch = document.getElementById('pt');
    if (!pitch || typeof M === 'undefined' || !M || !M.f) return;
    renderTeamDots(pitch, true);
    renderTeamDots(pitch, false);

    // On conserve le ballon original (#bl) : il reste raccordé au HUD et au moteur.
    const ball = document.getElementById('bl');
    if (ball) {
      ball.style.left = clamp(M.bx, 2, 98) + '%';
      ball.style.top = clamp(M.by, 2, 98) + '%';
    }
  }

  // Le rendu d'origine est toujours exécuté en premier : il actualise
  // l'horloge, le score, les commentaires, les statistiques et les événements.
  const originalDraw = draw;
  draw = function () {
    try {
      originalDraw.apply(this, arguments);
    } catch (error) {
      console.warn('[FM26] Le rendu de base du match a rencontré une erreur.', error);
    }
    try {
      drawMatch2D();
    } catch (error) {
      // Le terrain d'origine reste intact : une erreur graphique n'arrête pas le match.
      console.warn('[FM26] Le complément de rendu 2D a été ignoré.', error);
    }
  };

  window.FM26Match2D = { drawMatch2D, dotPositions, formationPositions };
  if (typeof requestAnimationFrame === 'function' && !window.FM26Match2DAnimation) {
    const animate = function () {
      if (typeof S !== 'undefined' && S && S.view === 'match' && typeof M !== 'undefined' && M && !M.done) {
        try { drawMatch2D(); } catch (_) {}
      }
      window.FM26Match2DAnimation = requestAnimationFrame(animate);
    };
    window.FM26Match2DAnimation = requestAnimationFrame(animate);
  }
})();