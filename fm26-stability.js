/* FM26 Stability & Ergonomics — targeted data repair without replacing the game UI. */
(function () {
  'use strict';
  if (window.FM26Stability) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const finite = (value, min, max, fallback, integer) => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return fallback;
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const bounded = clamp(n, min, max);
    return integer ? Math.round(bounded) : Number(bounded.toFixed(3));
  };

  function setNumber(object, key, min, max, fallback, integer) {
    if (!object || typeof object !== 'object') return false;
    const normalized = finite(object[key], min, max, fallback, integer);
    if (object[key] !== normalized) {
      object[key] = normalized;
      return true;
    }
    return false;
  }

  function normalizeCareer() {
    if (typeof S === 'undefined' || !S || typeof S !== 'object') return false;
    let changed = false;

    ['mor', 'board', 'fans'].forEach(key => {
      if (S[key] !== undefined || ['mor', 'board', 'fans'].includes(key)) {
        const fallback = key === 'mor' ? 75 : 70;
        changed = setNumber(S, key, 0, 100, fallback, true) || changed;
      }
    });
    if (S.bud !== undefined) changed = setNumber(S, 'bud', 0, 100000000, 0, false) || changed;

    if (!S.tc || typeof S.tc !== 'object' || Array.isArray(S.tc)) {
      S.tc = {};
      changed = true;
    }
    if (Array.isArray(S.sq)) {
      S.sq.forEach(player => {
        if (!player || typeof player !== 'object') return;
        changed = setNumber(player, 'ovr', 0, 100, 60, true) || changed;
        changed = setNumber(player, 'pot', 0, 100, Number(player.ovr) || 60, true) || changed;
        changed = setNumber(player, 'age', 15, 55, 24, true) || changed;
        changed = setNumber(player, 'cond', 0, 100, 80, true) || changed;
        changed = setNumber(player, 'form', 1, 10, 6.7, false) || changed;
        ['g', 'ap', 'apps', 'yellow', 'red', 'inj', 'susp', 'ratingCount', 'trainingGains'].forEach(key => {
          if (player[key] !== undefined || ['g', 'ap'].includes(key)) {
            changed = setNumber(player, key, 0, 1000000, 0, true) || changed;
          }
        });
        if (player.ast === undefined && player.assists !== undefined) {
          player.ast = finite(player.assists, 0, 1000000, 0, true);
          changed = true;
        } else {
          changed = setNumber(player, 'ast', 0, 1000000, 0, true) || changed;
        }
        if (player.assists !== undefined || player.ast !== undefined) {
          const assists = finite(player.ast, 0, 1000000, 0, true);
          if (player.assists !== assists) {
            player.assists = assists;
            changed = true;
          }
        }
        ['val', 'sal', 'ratingTotal', 'averageRating', 'lastRating'].forEach(key => {
          if (player[key] !== undefined && player[key] !== null) {
            const max = key === 'averageRating' || key === 'lastRating' ? 10 : 1000000000;
            const min = key === 'averageRating' || key === 'lastRating' ? 0 : 0;
            changed = setNumber(player, key, min, max, 0, false) || changed;
          }
        });
        if (player.a !== undefined && (!player.a || typeof player.a !== 'object' || Array.isArray(player.a))) {
          player.a = {};
          changed = true;
        }
        if (player.a && typeof player.a === 'object') {
          Object.keys(player.a).forEach(key => {
            changed = setNumber(player.a, key, 0, 20, 10, true) || changed;
          });
        }
      });
    }

    if (Array.isArray(S.lineup) && Array.isArray(S.sq)) {
      const validIds = new Set(S.sq.filter(Boolean).map(player => String(player.id)));
      const seen = new Set();
      const lineup = S.lineup.filter(id => {
        const key = String(id);
        if (!validIds.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (lineup.length !== S.lineup.length) {
        S.lineup = lineup;
        changed = true;
      }
    }

    if (changed && typeof sv === 'function') {
      try { sv(); } catch (e) { /* Storage may be disabled; keep the repaired in-memory state. */ }
    }
    return changed;
  }

  function normalizeMatch() {
    if (typeof M === 'undefined' || !M || typeof M !== 'object') return false;
    let changed = false;
    changed = setNumber(M, 'min', 0, 130, 0, true) || changed;
    changed = setNumber(M, 'h', 0, 40, 0, true) || changed;
    changed = setNumber(M, 'a', 0, 40, 0, true) || changed;
    changed = setNumber(M, 'ps', 0, 100, 50, true) || changed;
    changed = setNumber(M, 'bx', 0, 100, 50, false) || changed;
    changed = setNumber(M, 'by', 0, 100, 50, false) || changed;
    changed = setNumber(M, 'gt', 0, 30, 0, true) || changed;

    ['sh', 'xg', 'sot'].forEach(key => {
      if (M[key] !== undefined && !Array.isArray(M[key])) {
        M[key] = [0, 0];
        changed = true;
      }
      if (Array.isArray(M[key])) {
        for (let i = 0; i < 2; i++) {
          changed = setNumber(M[key], i, 0, 100000, 0, key !== 'xg') || changed;
        }
        if (M[key].length > 2) {
          M[key] = M[key].slice(0, 2);
          changed = true;
        }
      }
    });
    if (M.ev !== undefined && !Array.isArray(M.ev)) {
      M.ev = [];
      changed = true;
    }
    if (Array.isArray(M.ev)) {
      M.ev.forEach(event => {
        if (!event || typeof event !== 'object') return;
        changed = setNumber(event, 'm', 0, 130, 0, true) || changed;
        if (typeof event.k !== 'string') { event.k = String(event.k == null ? '•' : event.k); changed = true; }
        if (typeof event.t !== 'string') { event.t = String(event.t == null ? 'Événement de match' : event.t); changed = true; }
      });
    }
    return changed;
  }

  const baseFocusCSS = [
    '#vw button:focus-visible,#vw a:focus-visible,#vw select:focus-visible,#vw input:focus-visible{outline:2px solid #c6afff!important;outline-offset:2px!important}',
    '.fm26-dnd-root button:focus-visible,.fm26-dnd-root [draggable="true"]:focus-visible{outline:2px solid #c6afff;outline-offset:2px}',
    '.fm26-pro-role-card select,.fm26-pro-training-card select{max-width:100%;min-width:0}',
    '.fm26-player-advanced,.fm26-live-match-center{overflow-wrap:anywhere}',
    '@media(prefers-reduced-motion:reduce){#vw *,#side *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}'
  ].join('\n');

  if (!document.getElementById('fm26-stability-style')) {
    const style = document.createElement('style');
    style.id = 'fm26-stability-style';
    style.textContent = baseFocusCSS;
    document.head.appendChild(style);
  }

  if (typeof render === 'function' && !render.__fm26StabilityWrapped) {
    const previousRender = render;
    const stableRender = function () {
      normalizeCareer();
      normalizeMatch();
      return previousRender.apply(this, arguments);
    };
    stableRender.__fm26StabilityWrapped = true;
    render = stableRender;
  }

  if (typeof startMatch === 'function' && !startMatch.__fm26StabilityWrapped) {
    const previousStartMatch = startMatch;
    const stableStartMatch = function () {
      normalizeCareer();
      normalizeMatch();
      return previousStartMatch.apply(this, arguments);
    };
    stableStartMatch.__fm26StabilityWrapped = true;
    startMatch = stableStartMatch;
  }

  if (typeof tick === 'function' && !tick.__fm26StabilityWrapped) {
    const previousTick = tick;
    const stableTick = function () {
      normalizeMatch();
      const result = previousTick.apply(this, arguments);
      normalizeMatch();
      return result;
    };
    stableTick.__fm26StabilityWrapped = true;
    tick = stableTick;
  }

  if (typeof draw === 'function' && !draw.__fm26StabilityWrapped) {
    const previousDraw = draw;
    const stableDraw = function () {
      normalizeMatch();
      return previousDraw.apply(this, arguments);
    };
    stableDraw.__fm26StabilityWrapped = true;
    draw = stableDraw;
  }

  // Repair once on load, then again immediately before each major render/match update.
  normalizeCareer();
  normalizeMatch();
  window.FM26Stability = {
    version: '1.0.0',
    normalizeCareer,
    normalizeMatch
  };
})();