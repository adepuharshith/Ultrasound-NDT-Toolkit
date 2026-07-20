/* ============================================================
   Manim-inspired canvas animation toolkit.
   Dependency-free helpers shared by calculators.html: easing,
   parameter tweening (glide instead of snap on input change),
   one-time "Create"-style entrance draw-on when a canvas first
   scrolls into view, and a light coordinate-axis convention.
   Load this before assets/js/main.js.
   ============================================================ */
(function (global) {
  /* Manim's default rate function: smootherstep-ish ease in/out. */
  function smooth(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }
  function linear(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpParams(a, b, t) {
    const out = {};
    for (const k in b) {
      out[k] = (typeof a[k] === 'number' && typeof b[k] === 'number') ? lerp(a[k], b[k], t) : b[k];
    }
    return out;
  }

  function sameParams(a, b) {
    if (!a || !b) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => a[k] === b[k]);
  }

  /* Fire `cb` once, the first time `el` scrolls into view. Falls back
     to firing immediately if IntersectionObserver is unavailable. */
  function onFirstView(el, cb) {
    if (!el || typeof IntersectionObserver === 'undefined') { cb(); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { obs.unobserve(e.target); cb(); }
      });
    }, { threshold: 0.15 });
    obs.observe(el);
  }

  const _controllers = Object.create(null);

  /* Drive a visualization's redraws under one `key` (unique per canvas):
       - Glides between parameter sets instead of snapping when inputs change.
       - Plays a one-time "Create"-style entrance the first time `opts.canvas`
         scrolls into view.
       - Treats a redraw with unchanged params (e.g. a window resize) as an
         instant re-render at the current interpolated values, not a new tween.
     `drawFn(params, state)` is called every frame; `state.progress` is the
     entrance progress (1 once entered) and `state.entering` flags it so the
     draw function can stagger curves/labels in during that window. */
  function animate(key, params, drawFn, opts) {
    opts = opts || {};
    let c = _controllers[key];

    if (!c) {
      c = _controllers[key] = { target: params, params, raf: null, entered: false };
      const start = () => { c.entered = true; _runEntrance(c, drawFn, opts.entranceDuration || 900); };
      if (opts.canvas) onFirstView(opts.canvas, start); else start();
      return;
    }

    c.target = params;
    if (!c.entered) return; /* hasn't scrolled into view yet; entrance will use the latest target */

    if (sameParams(c.params, params)) {
      drawFn(c.params, { progress: 1, entering: false });
      return;
    }

    if (c.raf) cancelAnimationFrame(c.raf);
    const from = c.params, to = params, duration = opts.duration || 480;
    const t0 = performance.now();
    (function frame(now) {
      const t = smooth(Math.min(1, (now - t0) / duration));
      c.params = lerpParams(from, to, t);
      drawFn(c.params, { progress: 1, entering: false });
      if (t < 1) c.raf = requestAnimationFrame(frame);
    })(t0);
  }

  function _runEntrance(c, drawFn, duration) {
    const t0 = performance.now();
    (function frame(now) {
      const p = smooth(Math.min(1, (now - t0) / duration));
      c.params = c.target;
      drawFn(c.target, { progress: p, entering: true });
      if (p < 1) c.raf = requestAnimationFrame(frame);
    })(t0);
  }

  /* For canvases that already run their own perpetual requestAnimationFrame
     loop (e.g. a flowing wave) rather than redrawing on demand: returns a
     { value } box that glides from 0→1 the first time `canvas` scrolls into
     view, so the loop's own draw call can fade/scale itself in by reading
     `.value` each frame without needing a second animation loop. */
  function createReveal(canvas, duration) {
    const state = { value: 0 };
    onFirstView(canvas, () => {
      const t0 = performance.now();
      (function frame(now) {
        state.value = smooth(Math.min(1, (now - t0) / (duration || 700)));
        if (state.value < 1) requestAnimationFrame(frame);
      })(t0);
    });
    return state;
  }

  /* Mutate `current`'s numeric properties toward `target`'s in place over
     `duration` ms, so a caller with its own redraw loop (reading `current`
     every frame) shows a glide instead of a snap. */
  function tweenValues(current, target, duration, easing) {
    easing = easing || smooth;
    const from = Object.assign({}, current);
    const t0 = performance.now();
    (function frame(now) {
      const t = easing(Math.min(1, (now - t0) / (duration || 480)));
      for (const k in target) {
        current[k] = (typeof target[k] === 'number' && typeof from[k] === 'number')
          ? lerp(from[k], target[k], t) : target[k];
      }
      if (t < 1) requestAnimationFrame(frame);
    })(t0);
  }

  /* Draw a polyline up to `progress` (0→1) of its cumulative length, with a
     small glowing dot at the leading tip — Manim's "Create" animation. */
  function tracePath(ctx, points, progress, opts) {
    opts = opts || {};
    if (points.length < 2 || progress <= 0) return;
    const lens = [0];
    for (let i = 1; i < points.length; i++) {
      lens.push(lens[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    }
    const total = lens[lens.length - 1];
    const target = total * Math.min(1, progress);

    ctx.save();
    ctx.strokeStyle = opts.color || '#1d4ed8';
    ctx.lineWidth = opts.width || 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (opts.dash) ctx.setLineDash(opts.dash);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    let tipX = points[0][0], tipY = points[0][1];
    for (let i = 1; i < points.length; i++) {
      if (lens[i] <= target) {
        ctx.lineTo(points[i][0], points[i][1]);
        tipX = points[i][0]; tipY = points[i][1];
      } else {
        const segLen = lens[i] - lens[i - 1];
        const segT = segLen > 0 ? (target - lens[i - 1]) / segLen : 0;
        tipX = lerp(points[i - 1][0], points[i][0], segT);
        tipY = lerp(points[i - 1][1], points[i][1], segT);
        ctx.lineTo(tipX, tipY);
        break;
      }
    }
    ctx.stroke();
    if (opts.dot !== false && progress < 0.999) {
      ctx.setLineDash([]);
      ctx.fillStyle = opts.dotColor || opts.color || '#1d4ed8';
      ctx.beginPath(); ctx.arc(tipX, tipY, opts.dotRadius || 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* Fade + scale a label/bracket/etc. into place. `drawFn(scale)` does the
     actual drawing (ctx.globalAlpha is already reduced by the caller). */
  function popIn(ctx, progress, drawFn) {
    const p = Math.max(0, Math.min(1, progress));
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha *= p;
    drawFn(0.85 + 0.15 * p);
    ctx.restore();
  }

  /* Remap a sub-range of overall progress to its own 0→1, for staggering
     entrance phases (e.g. shapes first, then rays, then labels). */
  function stagger(progress, from, to) {
    if (to <= from) return progress >= to ? 1 : 0;
    return Math.max(0, Math.min(1, (progress - from) / (to - from)));
  }

  function _arrowLine(ctx, x1, y1, x2, y2, hs) {
    hs = hs || 6;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x2 - hs * Math.cos(angle - 0.4), y2 - hs * Math.sin(angle - 0.4));
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - hs * Math.cos(angle + 0.4), y2 - hs * Math.sin(angle + 0.4));
    ctx.stroke();
  }

  /* Light gridlines + arrow-tipped axes + tick labels, Manim coordinate-
     plane style. (x0, y0) is the plot's bottom-left origin; w/h are the
     plot's pixel width/height, growing right/up from there. */
  function drawAxes(ctx, o) {
    const { x0, y0, w, h, xMax, yMax, xLabel, yLabel, xFmt, yFmt } = o;
    const xTicks = o.xTicks || 4, yTicks = o.yTicks || 4;
    const axisColor = o.color || 'rgba(100,116,139,.65)';
    const gridColor = o.gridColor || 'rgba(148,163,184,.16)';

    ctx.save();
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    for (let i = 1; i <= xTicks; i++) {
      const x = x0 + (w * i) / xTicks;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 - h); ctx.stroke();
    }
    for (let i = 1; i <= yTicks; i++) {
      const y = y0 - (h * i) / yTicks;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    }

    ctx.strokeStyle = axisColor; ctx.fillStyle = axisColor; ctx.lineWidth = 1.2;
    ctx.font = '9px Inter,sans-serif';
    _arrowLine(ctx, x0, y0, x0 + w + 8, y0);
    _arrowLine(ctx, x0, y0, x0, y0 - h - 8);

    ctx.textAlign = 'center';
    for (let i = 0; i <= xTicks; i++) {
      const x = x0 + (w * i) / xTicks;
      const val = (xMax * i) / xTicks;
      ctx.fillText(xFmt ? xFmt(val) : val.toFixed(0), x, y0 + 12);
    }
    ctx.textAlign = 'right';
    for (let i = 1; i <= yTicks; i++) {
      const y = y0 - (h * i) / yTicks;
      const val = (yMax * i) / yTicks;
      ctx.fillText(yFmt ? yFmt(val) : val.toFixed(0), x0 - 4, y + 3);
    }
    if (xLabel) { ctx.textAlign = 'right'; ctx.fillText(xLabel, x0 + w + 8, y0 + 24); }
    if (yLabel) { ctx.textAlign = 'left'; ctx.fillText(yLabel, x0 - 4, y0 - h - 12); }
    ctx.restore();
  }

  global.ManimViz = {
    smooth, linear, lerp, sameParams,
    animate, onFirstView, createReveal, tweenValues,
    tracePath, popIn, stagger, drawAxes
  };
})(window);
