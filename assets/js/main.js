/* ============================================================
   Ultrasound & NDT Toolkit — Shared JS
   ============================================================ */

/* Light/dark theme toggle — injected into every page's nav bar.
   The active theme is applied synchronously by an inline snippet in
   <head> (before first paint) so there's no flash; this only wires up
   the visible button + persistence + live system-preference syncing. */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  if (nav) {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle light / dark theme');
    toggle.innerHTML =
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"/>' +
      '</svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20.5 14.6A8.5 8.5 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1Z"/>' +
      '</svg>';

    const hamburger = nav.querySelector('.nav-hamburger');
    if (hamburger) nav.insertBefore(toggle, hamburger); else nav.appendChild(toggle);

    const root = document.documentElement;
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });

    /* If the user never explicitly chose a theme, keep following the OS setting live. */
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        let stored = null;
        try { stored = localStorage.getItem('theme'); } catch (err) {}
        if (!stored) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      });
    }
  }

  /* Nav gains a stronger shadow once the page scrolls under it */
  const navEl = document.querySelector('.nav');
  if (navEl) {
    const onScroll = () => navEl.classList.toggle('scrolled', window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Hamburger menu toggle */
  const btn   = document.querySelector('.nav-hamburger');
  const links = document.querySelector('.nav-links');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));

  /* Highlight active nav link */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* Group the growing Theory page into one site-wide hover/focus menu. */
  const theoryLink = document.querySelector('.nav-links > li > a[href="theory.html"]');
  if (theoryLink) {
    const item = theoryLink.parentElement;
    item.classList.add('theory-menu');
    const groups = [
      ['Wave Foundations', [
        ['Sound vs EM', 'wave-types'], ['Key Differences', 'speed-comparison'],
        ['Applications', 'applications'], ['Elastic Wave Types', 'elastic-wave-types']
      ]],
      ['Interfaces & Frequency', [
        ['Acoustic Impedance', 'acoustic-impedance'], ['Creating Elastic Waves', 'wave-generation'],
        ['Acoustic Spectrum', 'ultrasound-spectrum'], ['Generating Ultrasound', 'generating-ultrasound']
      ]],
      ['Inspection & Imaging', [
        ['UT Principle', 'ut-principle'], ['Material Properties', 'material-props'],
        ['A-scan', 'a-scan'], ['B-scan', 'b-scan'], ['C-scan', 'c-scan']
      ]],
      ['Advanced Topics', [
        ['Attenuation', 'attenuation'], ['Beam Physics', 'beam-physics'], ['Snell’s Law', 'snell'],
        ['Phased Arrays', 'phased-arrays'], ['Calibration & DAC', 'calibration'],
        ['Pulser–Receiver', 'pulser-receiver'], ['TOFD', 'tofd'], ['Weld Inspection', 'weld-inspection']
      ]]
    ];

    const toggle = document.createElement('button');
    toggle.className = 'theory-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Show Theory topics');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const menu = document.createElement('div');
    menu.className = 'theory-dropdown';
    menu.setAttribute('aria-label', 'Theory topics');
    groups.forEach(([title, links]) => {
      const group = document.createElement('div');
      group.className = 'theory-dropdown-group';
      const heading = document.createElement('span');
      heading.className = 'theory-dropdown-title';
      heading.textContent = title;
      group.appendChild(heading);
      links.forEach(([label, id]) => {
        const link = document.createElement('a');
        link.href = `theory.html#${id}`;
        link.textContent = label;
        group.appendChild(link);
      });
      menu.appendChild(group);
    });
    item.append(toggle, menu);

    const setOpen = open => {
      item.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      setOpen(!item.classList.contains('open'));
    });
    document.addEventListener('click', event => {
      if (!item.contains(event.target)) setOpen(false);
    });
    item.addEventListener('keydown', event => {
      if (event.key === 'Escape') { setOpen(false); theoryLink.focus(); }
    });
  }

  /* Sidebar scroll-spy (theory page) */
  const sections  = document.querySelectorAll('.theory-section[id]');
  const sideLinks = document.querySelectorAll('.topic-sidebar a[href^="#"]');
  if (sections.length && sideLinks.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          sideLinks.forEach(l => l.classList.remove('active'));
          const hit = [...sideLinks].find(l => l.getAttribute('href') === '#' + e.target.id);
          if (hit) hit.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => obs.observe(s));
  }
});

/* ============================================================
   HELPERS
   ============================================================ */
function fmt(val, sig = 4) {
  if (!isFinite(val)) return '—';
  return parseFloat(val.toPrecision(sig)).toLocaleString('en-US', { maximumSignificantDigits: sig });
}

/* Prepare a canvas at its actual rendered size and device pixel ratio while
   preserving the original width/height attributes as logical drawing units.
   This prevents canvas labels and thin lines from becoming blurry when a
   calculator visualization is wider than its native bitmap. */
function _setupHiDPICanvas(canvas) {
  if (!canvas.dataset.logicalWidth) {
    canvas.dataset.logicalWidth = canvas.getAttribute('width') || '600';
    canvas.dataset.logicalHeight = canvas.getAttribute('height') || '300';
  }
  const CW = Number(canvas.dataset.logicalWidth);
  const CH = Number(canvas.dataset.logicalHeight);
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || CW;
  const cssH = cssW * CH / CW;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const pixelW = Math.max(1, Math.round(cssW * dpr));
  const pixelH = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelW / CW, 0, 0, pixelH / CH, 0, 0);
  return { ctx, CW, CH };
}

/* Cross-browser rounded rect path (avoids ctx.roundRect compat issues) */
function _rRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x, y + h - r,     r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,          r);
  ctx.closePath();
}

/* Arrow helper: draw a line with an arrowhead at (x2,y2) */
function _arrow(ctx, x1, y1, x2, y2, hs = 7) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.moveTo(x2 - hs * Math.cos(angle - 0.4), y2 - hs * Math.sin(angle - 0.4));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(angle + 0.4), y2 - hs * Math.sin(angle + 0.4));
  ctx.stroke();
}

/* ============================================================
   1. WAVELENGTH  —  inputs: f, c1, c2
   ============================================================ */
let _wlPhase  = 0;
let _wlAnimId = null;
let _wlP = { f: 5, c1: 1480, c2: 5900 };

function calcWavelength() {
  const f  = parseFloat(document.getElementById('wl-freq').value) || 5;
  const c1 = parseFloat(document.getElementById('wl-c1').value)   || 1480;
  const c2 = parseFloat(document.getElementById('wl-c2').value)   || 5900;

  _wlP = { f, c1, c2 };

  const lam1_mm = c1 / (f * 1e6) * 1000;
  const lam2_mm = c2 / (f * 1e6) * 1000;

  const r1 = document.getElementById('wl-res1');
  const r2 = document.getElementById('wl-res2');
  if (r1) { r1.querySelector('.result-value').textContent = fmt(lam1_mm); }
  if (r2) { r2.querySelector('.result-value').textContent = fmt(lam2_mm); }

  if (!_wlAnimId) _wlStart();
}

function _wlStart() {
  if (_wlAnimId || !document.getElementById('wl-canvas')) return;
  (function loop() { _wlPhase += 1.4; _wlDraw(); _wlAnimId = requestAnimationFrame(loop); })();
}

function _wlDraw() {
  const canvas = document.getElementById('wl-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  const { f, c1, c2 } = _wlP;

  ctx.clearRect(0, 0, CW, CH);

  /* Physical wavelengths (mm) */
  const lam1 = c1 / (f * 1e6) * 1000;
  const lam2 = c2 / (f * 1e6) * 1000;

  /* Visual scale: always show 3 full cycles of the shorter-λ medium in its half.
     Both λ_px values stay proportional → ratio = c2/c1 always. */
  const half  = CW / 2;
  const lamMin = Math.min(lam1, lam2);
  const scale  = half / (3 * lamMin);   /* px per mm */
  const lPx1   = lam1 * scale;          /* visual wavelength of medium 1 */
  const lPx2   = lam2 * scale;          /* visual wavelength of medium 2 */

  /* Wave amplitude & center */
  const amp = CH * 0.21;
  const cy  = CH * 0.55;

  /* Temporal phase: same ω for both media → waves are phase-matched at interface */
  const PHI = 2 * Math.PI * 1.3 * _wlPhase / lPx1;

  /* ---- backgrounds ---- */
  const bg1 = ctx.createLinearGradient(0, 0, half, 0);
  bg1.addColorStop(0, 'rgba(219,234,254,.85)');
  bg1.addColorStop(1, 'rgba(186,230,253,.75)');
  ctx.fillStyle = bg1; ctx.fillRect(0, 0, half, CH);

  const bg2 = ctx.createLinearGradient(half, 0, CW, 0);
  bg2.addColorStop(0, 'rgba(203,213,225,.75)');
  bg2.addColorStop(1, 'rgba(148,163,184,.60)');
  ctx.fillStyle = bg2; ctx.fillRect(half, 0, half, CH);

  /* ---- medium labels ---- */
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px Inter,sans-serif';
  ctx.fillStyle = '#1e40af';
  ctx.fillText('Medium 1 (Water)', half / 2, 16);
  ctx.fillStyle = '#334155';
  ctx.fillText('Medium 2 (Solid)',  half + half / 2, 16);
  ctx.font = '10px Inter,sans-serif';
  ctx.fillStyle = '#2563eb'; ctx.fillText(`c = ${c1.toLocaleString()} m/s`, half / 2, 30);
  ctx.fillStyle = '#475569'; ctx.fillText(`c = ${c2.toLocaleString()} m/s`, half + half / 2, 30);

  /* ---- interface dashed line ---- */
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, CH); ctx.stroke();
  ctx.setLineDash([]);

  /* ---- sine wave medium 1 (x = 0..half) ---- */
  ctx.beginPath(); ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2.2;
  for (let x = 0; x <= half; x++) {
    const y = cy - amp * Math.sin(2 * Math.PI * x / lPx1 - PHI);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  /* ---- sine wave medium 2 (x = half..CW) ---- */
  ctx.beginPath(); ctx.strokeStyle = '#374151'; ctx.lineWidth = 2.2;
  for (let x = half; x <= CW; x++) {
    const y = cy - amp * Math.sin(2 * Math.PI * (x - half) / lPx2 - PHI);
    x === half ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  /* ---- wavelength brackets ---- */
  const BY = cy + amp + 16;   /* y position of bracket */

  /* Medium 1 bracket */
  const b1x1 = 8, b1x2 = b1x1 + Math.min(lPx1, half - 12);
  _wlBracket(ctx, b1x1, b1x2, BY, `λ₁ = ${fmt(lam1, 3)} mm`, '#1d4ed8');

  /* Medium 2 bracket */
  const b2x1 = half + 8, b2x2 = Math.min(b2x1 + lPx2, CW - 6);
  _wlBracket(ctx, b2x1, b2x2, BY, `λ₂ = ${fmt(lam2, 3)} mm`, '#374151');
}

function _wlBracket(ctx, x1, x2, y, label, color) {
  const hs = 5;
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth   = 1.3;
  ctx.beginPath();
  ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  /* left head */
  ctx.moveTo(x1 + hs, y - hs * 0.6); ctx.lineTo(x1, y); ctx.lineTo(x1 + hs, y + hs * 0.6);
  /* right head */
  ctx.moveTo(x2 - hs, y - hs * 0.6); ctx.lineTo(x2, y); ctx.lineTo(x2 - hs, y + hs * 0.6);
  ctx.stroke();
  ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, (x1 + x2) / 2, y - 5);
}

/* ============================================================
   2. NEAR-FIELD DISTANCE
   ============================================================ */
function calcNearField() {
  const D = parseFloat(document.getElementById('nf-diam').value) || 12.7;
  const f = parseFloat(document.getElementById('nf-freq').value) || 5;
  const v = parseFloat(document.getElementById('nf-vel').value)  || 5900;
  const res = document.getElementById('nf-result');
  if (!D || !f || !v) { if (res) res.querySelector('.result-value').textContent = '—'; return; }
  const lam = v / (f * 1e6);
  const N   = (D * D) / (4 * lam * 1000);   /* mm */
  if (res) {
    res.querySelector('.result-value').textContent = fmt(N);
    res.querySelector('.result-unit').textContent  = 'mm';
  }
  _drawNFViz(D, N);
}

function _drawNFViz(D_mm, N_mm) {
  const canvas = document.getElementById('nf-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);

  /* Beam propagates LEFT → RIGHT */
  const PAD = 18;
  const transX = PAD + 20;
  const totalLen = CW - transX - PAD;
  /* scale: near field N fills some fraction; show N + far-field divergence */
  const showMM = N_mm * 2.2;
  const sc = totalLen / showMM;   /* px/mm */
  const Npx = Math.min(N_mm * sc, totalLen * 0.65);

  const cy = CH / 2;
  const beamHalf = Math.min(D_mm * sc / 2, CH / 3);

  /* Near-field shaded region */
  const nfGrad = ctx.createLinearGradient(transX, 0, transX + Npx, 0);
  nfGrad.addColorStop(0, 'rgba(8,145,178,.40)');
  nfGrad.addColorStop(1, 'rgba(8,145,178,.14)');
  ctx.fillStyle = nfGrad;
  ctx.fillRect(transX, cy - beamHalf, Npx, beamHalf * 2);

  /* Transducer face */
  ctx.fillStyle = '#0f2d5e';
  ctx.fillRect(PAD, cy - beamHalf - 4, 20, beamHalf * 2 + 8);
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(PAD + 14, cy - beamHalf, 6, beamHalf * 2);

  /* Near-field top/bottom edges */
  ctx.strokeStyle = 'rgba(8,145,178,.78)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(transX, cy - beamHalf); ctx.lineTo(transX + Npx, cy - beamHalf);
  ctx.moveTo(transX, cy + beamHalf); ctx.lineTo(transX + Npx, cy + beamHalf);
  ctx.stroke(); ctx.setLineDash([]);

  /* Far-field diverging lines */
  const divAngle = 0.18;   /* rad, ~10° */
  const farEnd   = CW - PAD;
  const farLen   = farEnd - (transX + Npx);
  ctx.strokeStyle = 'rgba(8,145,178,.52)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(transX + Npx, cy - beamHalf);
  ctx.lineTo(farEnd, cy - beamHalf - farLen * Math.tan(divAngle));
  ctx.moveTo(transX + Npx, cy + beamHalf);
  ctx.lineTo(farEnd, cy + beamHalf + farLen * Math.tan(divAngle));
  ctx.stroke(); ctx.setLineDash([]);

  /* N marker (vertical dashed line + label) */
  ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(transX + Npx, cy - beamHalf - 10); ctx.lineTo(transX + Npx, cy + beamHalf + 10); ctx.stroke();
  ctx.setLineDash([]);

  /* Labels */
  ctx.textAlign = 'center'; ctx.font = '10px Inter,sans-serif';
  const nfMidX = transX + Npx / 2;
  ctx.fillStyle = '#0891b2'; ctx.fillText('Near Field', nfMidX, 14);
  ctx.fillStyle = 'rgba(8,145,178,.90)'; ctx.fillText('Far Field', transX + Npx + farLen / 2, 14);

  ctx.fillStyle = '#0891b2'; ctx.font = 'bold 11px Inter,sans-serif';
  ctx.fillText(`N = ${fmt(N_mm, 3)} mm`, transX + Npx, cy + beamHalf + 22);

  ctx.fillStyle = '#475569'; ctx.font = '10px Inter,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`D = ${document.getElementById('nf-diam').value} mm`, PAD + 2, 14);
}

/* ============================================================
   3. TIME-OF-FLIGHT → DEPTH
   ============================================================ */
function calcDepth() {
  const tof = parseFloat(document.getElementById('tof-time').value) || 2;
  const v   = parseFloat(document.getElementById('tof-vel').value)  || 5900;
  const res = document.getElementById('tof-result');
  if (!tof || !v) { if (res) res.querySelector('.result-value').textContent = '—'; return; }
  const depth_mm = (tof * 1e-6 * v * 1000) / 2;
  if (res) {
    res.querySelector('.result-value').textContent = fmt(depth_mm);
    res.querySelector('.result-unit').textContent  = 'mm';
  }
  _drawTOFViz(tof, v, depth_mm);
}

function _drawTOFViz(tof, v, depth_mm) {
  const canvas = document.getElementById('tof-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);

  const PAD = 18, transH = 22, cx = CW / 2;
  const drawH = CH - PAD - transH - 20;
  /* Show depth + 25% padding below */
  const totalMM = depth_mm * 1.3;
  const sc = drawH / totalMM;

  const transY1 = PAD + transH;
  const matTopY = transY1 + 10;
  const defectY = matTopY + depth_mm * sc;

  /* Material block */
  const mg = ctx.createLinearGradient(0, matTopY, 0, CH - 10);
  mg.addColorStop(0, 'rgba(203,213,225,.88)'); mg.addColorStop(1, 'rgba(148,163,184,.72)');
  ctx.fillStyle = mg; ctx.fillRect(20, matTopY, CW - 40, CH - matTopY - 10);

  /* Depth arrow (center, down to defect) */
  ctx.strokeStyle = '#e11d48'; ctx.fillStyle = '#e11d48'; ctx.lineWidth = 1.8;
  _arrow(ctx, cx, transY1 + 4, cx, defectY - 4);

  /* Defect marker */
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.arc(cx, defectY, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, defectY, 5, 0, Math.PI * 2); ctx.stroke();

  /* Return path (dashed, offset slightly right) */
  ctx.strokeStyle = 'rgba(225,29,72,.65)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(cx + 6, defectY); ctx.lineTo(cx + 6, transY1 + 4); ctx.stroke();
  ctx.setLineDash([]);

  /* Depth label */
  ctx.fillStyle = '#e11d48'; ctx.font = 'bold 10px Inter,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`d = ${fmt(depth_mm, 3)} mm`, cx + 12, matTopY + depth_mm * sc / 2 + 4);

  /* TOF label on side */
  ctx.fillStyle = '#475569'; ctx.font = '10px Inter,sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TOF = ${tof} µs`, CW - 22, matTopY + depth_mm * sc / 2);

  /* Transducer */
  const tg = ctx.createLinearGradient(cx, PAD, cx, transY1);
  tg.addColorStop(0, '#1e3a5f'); tg.addColorStop(1, '#0f2d5e');
  ctx.fillStyle = tg;
  _rRect(ctx, cx - 28, PAD, 56, transH - 3, 4); ctx.fill();
  ctx.fillStyle = '#0891b2'; ctx.fillRect(cx - 28, transY1 - 4, 56, 4);
  ctx.fillStyle = '#bae6fd'; ctx.font = 'bold 8px Inter,sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('TX/RX', cx, PAD + 13);

  /* Top surface line */
  ctx.strokeStyle = 'rgba(51,65,85,.82)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(20, matTopY); ctx.lineTo(CW - 20, matTopY); ctx.stroke();
}

/* ============================================================
   4. ATTENUATION
   ============================================================ */
function calcAttenuation() {
  const alpha = parseFloat(document.getElementById('att-coeff').value) || 0.5;
  const f     = parseFloat(document.getElementById('att-freq').value)  || 5;
  const d     = parseFloat(document.getElementById('att-dist').value)  || 50;
  const res   = document.getElementById('att-result');
  if (!alpha || !f || !d) { if (res) res.querySelector('.result-value').textContent = '—'; return; }
  const total_dB = alpha * f * d;
  if (res) {
    res.querySelector('.result-value').textContent = fmt(total_dB);
    res.querySelector('.result-unit').textContent  = 'dB';
  }
  _drawAttViz(alpha, f, d, total_dB);
}

function _drawAttViz(alpha, f, d, total_dB) {
  const canvas = document.getElementById('att-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);

  const PAD_L = 32, PAD_R = 20, PAD_T = 16, PAD_B = 28;
  const W = CW - PAD_L - PAD_R;
  const H = CH - PAD_T - PAD_B;

  /* Material background */
  const bg = ctx.createLinearGradient(PAD_L, 0, CW - PAD_R, 0);
  bg.addColorStop(0, 'rgba(203,213,225,.68)'); bg.addColorStop(1, 'rgba(148,163,184,.50)');
  ctx.fillStyle = bg; ctx.fillRect(PAD_L, PAD_T, W, H);

  /* Decaying sine wave */
  const cy  = PAD_T + H / 2;
  const A0  = H * 0.4;    /* starting amplitude (px) */
  const lam_px = W / 8;   /* visual wavelength (~8 cycles across) */
  const att_lin = Math.pow(10, -total_dB / 20); /* linear amplitude ratio */

  ctx.beginPath(); ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2.5;
  for (let px = 0; px <= W; px++) {
    const t    = px / W;   /* 0 → 1 across the beam path */
    const att  = Math.pow(att_lin, t);  /* attenuation at this point */
    const y    = cy - A0 * att * Math.sin(2 * Math.PI * px / lam_px);
    px === 0 ? ctx.moveTo(PAD_L + px, y) : ctx.lineTo(PAD_L + px, y);
  }
  ctx.stroke();

  /* Envelope curve (dashed) */
  ctx.beginPath(); ctx.strokeStyle = 'rgba(29,78,216,.62)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
  for (let px = 0; px <= W; px++) {
    const att = Math.pow(att_lin, px / W);
    const y   = cy - A0 * att;
    px === 0 ? ctx.moveTo(PAD_L + px, y) : ctx.lineTo(PAD_L + px, y);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let px = 0; px <= W; px++) {
    const att = Math.pow(att_lin, px / W);
    const y   = cy + A0 * att;
    px === 0 ? ctx.moveTo(PAD_L + px, y) : ctx.lineTo(PAD_L + px, y);
  }
  ctx.stroke(); ctx.setLineDash([]);

  /* Axis line */
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD_L, cy); ctx.lineTo(CW - PAD_R, cy); ctx.stroke();

  /* Labels */
  ctx.textAlign = 'center'; ctx.font = '10px Inter,sans-serif';
  ctx.fillStyle = '#1d4ed8'; ctx.fillText('0 dB', PAD_L + 12, PAD_T + H / 2 - A0 - 5);
  ctx.fillStyle = '#dc2626';
  ctx.fillText(`−${fmt(total_dB, 3)} dB`, CW - PAD_R - 18, PAD_T + H / 2 - A0 * att_lin - 6);

  /* distance axis */
  ctx.fillStyle = '#64748b'; ctx.textAlign = 'left';
  ctx.fillText('0', PAD_L - 2, CH - 6);
  ctx.textAlign = 'right';
  ctx.fillText(`${d} mm`, CW - PAD_R + 2, CH - 6);
  ctx.textAlign = 'center';
  ctx.fillText('propagation distance →', PAD_L + W / 2, CH - 3);
}

/* ============================================================
   5. SNELL'S LAW
   ============================================================ */
function calcSnell() {
  const theta1 = parseFloat(document.getElementById('sn-angle').value) || 20;
  const v1     = parseFloat(document.getElementById('sn-v1').value)    || 1480;
  const v2     = parseFloat(document.getElementById('sn-v2').value)    || 5900;
  const res    = document.getElementById('sn-result');
  const sinT2  = (v2 / v1) * Math.sin(theta1 * Math.PI / 180);
  if (Math.abs(sinT2) > 1) {
    if (res) { res.querySelector('.result-value').textContent = 'TIR'; res.querySelector('.result-unit').textContent = ''; }
  } else {
    const theta2 = Math.asin(sinT2) * 180 / Math.PI;
    if (res) { res.querySelector('.result-value').textContent = fmt(theta2); res.querySelector('.result-unit').textContent = '°'; }
  }
  _drawSnellViz(theta1, v1, v2, sinT2);
}

function _drawSnellViz(theta1, v1, v2, sinT2) {
  const canvas = document.getElementById('sn-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);

  const isTIR = Math.abs(sinT2) > 1;
  const theta2 = isTIR ? null : Math.asin(sinT2) * 180 / Math.PI;
  const iy = CH / 2, cx = CW / 2;
  const RAY = 80;   /* ray length in pixels */
  const PI  = Math.PI;

  /* Media */
  ctx.fillStyle = 'rgba(186,230,253,.88)'; ctx.fillRect(0, 0, CW, iy);
  ctx.fillStyle = 'rgba(148,163,184,.78)'; ctx.fillRect(0, iy, CW, iy);

  /* Interface */
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(CW, iy); ctx.stroke();
  /* Normal */
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, CH - 10); ctx.stroke();
  ctx.setLineDash([]);

  /* Rays */
  const t1r = theta1 * PI / 180;
  /* Incident: from upper-left toward center */
  const ix0 = cx - RAY * Math.sin(t1r), iy0 = iy - RAY * Math.cos(t1r);
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2;
  _arrow(ctx, ix0, iy0, cx, iy);

  if (isTIR) {
    /* Reflected ray: symmetric to incident */
    const rx = cx + RAY * Math.sin(t1r), ry = iy - RAY * Math.cos(t1r);
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2; _arrow(ctx, cx, iy, rx, ry);
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Total Internal Reflection', cx, iy + 24);
  } else {
    const t2r = theta2 * PI / 180;
    /* Refracted */
    const rx2 = cx + RAY * Math.sin(t2r), ry2 = iy + RAY * Math.cos(t2r);
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; _arrow(ctx, cx, iy, rx2, ry2);

    /* Angle arcs */
    ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, iy, 28, -PI / 2, -PI / 2 + t1r); ctx.stroke();
    ctx.strokeStyle = '#374151';
    ctx.beginPath(); ctx.arc(cx, iy, 28, PI / 2, PI / 2 + t2r); ctx.stroke();

    /* Angle labels */
    ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'left';
    ctx.fillStyle = '#1d4ed8'; ctx.fillText(`θ₁ = ${theta1}°`, cx + 8, iy - 22);
    ctx.fillStyle = '#374151'; ctx.fillText(`θ₂ = ${fmt(theta2, 3)}°`, cx + 8, iy + 32);
  }

  /* Speed labels */
  ctx.font = '10px Inter,sans-serif';
  ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'left'; ctx.fillText(`c₁ = ${v1} m/s`, 6, 16);
  ctx.fillStyle = '#475569';  ctx.fillText(`c₂ = ${v2} m/s`, 6, iy + 16);
}

/* ============================================================
   6. ACOUSTIC IMPEDANCE & REFLECTION
   ============================================================ */
function calcImpedance() {
  const rho1 = parseFloat(document.getElementById('z-rho1').value) || 1000;
  const v1   = parseFloat(document.getElementById('z-v1').value)   || 1480;
  const rho2 = parseFloat(document.getElementById('z-rho2').value) || 7800;
  const v2   = parseFloat(document.getElementById('z-v2').value)   || 5900;
  if (!rho1 || !v1 || !rho2 || !v2) return;
  const Z1 = rho1 * v1, Z2 = rho2 * v2;
  const R  = ((Z2 - Z1) / (Z2 + Z1)) ** 2 * 100;
  const T  = 100 - R;
  document.getElementById('z-z1').textContent = fmt(Z1 / 1e6) + ' MRayl';
  document.getElementById('z-z2').textContent = fmt(Z2 / 1e6) + ' MRayl';
  document.getElementById('z-r').textContent  = fmt(R) + ' %';
  document.getElementById('z-t').textContent  = fmt(T) + ' %';
  _drawZViz(Z1, Z2, R, T);
}

function _drawZViz(Z1, Z2, R, T) {
  const canvas = document.getElementById('z-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);

  const ix = CW / 2, cy = CH / 2;   /* interface x, center y */
  const RAY = 68;

  /* Media blocks */
  ctx.fillStyle = 'rgba(186,230,253,.88)'; ctx.fillRect(0, 0, ix, CH);
  ctx.fillStyle = 'rgba(148,163,184,.78)'; ctx.fillRect(ix, 0, ix, CH);

  /* Interface */
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ix, 0); ctx.lineTo(ix, CH); ctx.stroke();

  /* Incident arrow → */
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2;
  _arrow(ctx, ix - RAY, cy, ix - 4, cy);
  ctx.fillStyle = '#1d4ed8'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Incident', ix - RAY / 2 - 4, cy - 10);
  ctx.fillText('(100%)', ix - RAY / 2 - 4, cy + 18);

  /* Transmitted arrow → */
  const tFrac = T / 100;
  ctx.strokeStyle = '#374151'; ctx.lineWidth = Math.max(1, 2.5 * tFrac);
  _arrow(ctx, ix + 4, cy, ix + RAY, cy);
  ctx.fillStyle = '#374151'; ctx.textAlign = 'center';
  ctx.fillText('Transmitted', ix + RAY / 2 + 4, cy - 10);
  ctx.fillText(`T = ${fmt(T, 3)}%`, ix + RAY / 2 + 4, cy + 18);

  /* Reflected arrow ← (above center, going left) */
  const rFrac = R / 100;
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = Math.max(0.5, 2.5 * rFrac);
  _arrow(ctx, ix - 4, cy - 26, ix - RAY, cy - 26);
  ctx.fillStyle = '#dc2626'; ctx.textAlign = 'center';
  ctx.fillText(`R = ${fmt(R, 3)}%`, ix - RAY / 2 - 4, cy - 36);

  /* Z labels */
  ctx.font = '10px Inter,sans-serif';
  ctx.fillStyle = '#1e40af'; ctx.textAlign = 'center';
  ctx.fillText(`Z₁ = ${fmt(Z1 / 1e6, 3)} MRayl`, ix / 2, CH - 8);
  ctx.fillStyle = '#374151';
  ctx.fillText(`Z₂ = ${fmt(Z2 / 1e6, 3)} MRayl`, ix + ix / 2, CH - 8);
}

/* ============================================================
   7. BEAM DIVERGENCE  —  inputs: D (mm), f (MHz), v (m/s)
   ============================================================ */
function calcBeamDiv() {
  const D = parseFloat(document.getElementById('bd-diam').value) || 12.7;
  const f = parseFloat(document.getElementById('bd-freq').value) || 5;
  const v = parseFloat(document.getElementById('bd-vel').value)  || 5900;

  const lam_mm = v / (f * 1e6) * 1000;
  const N_mm   = (D * D) / (4 * lam_mm);

  const sinHalf = 0.514 * lam_mm / D;
  const r1 = document.getElementById('bd-res1');
  const r2 = document.getElementById('bd-res2');

  if (sinHalf >= 1) {
    if (r1) { r1.querySelector('.result-value').textContent = '>90'; r1.querySelector('.result-unit').textContent = '°'; }
    if (r2) { r2.querySelector('.result-value').textContent = '>90'; r2.querySelector('.result-unit').textContent = '°'; }
  } else {
    const halfDeg = Math.asin(sinHalf) * 180 / Math.PI;
    const fullDeg = 2 * halfDeg;
    if (r1) { r1.querySelector('.result-value').textContent = fmt(halfDeg); r1.querySelector('.result-unit').textContent = '°'; }
    if (r2) { r2.querySelector('.result-value').textContent = fmt(fullDeg);  r2.querySelector('.result-unit').textContent = '°'; }
  }

  _drawBeamDivViz(D, lam_mm, N_mm, sinHalf);
}

function _drawBeamDivViz(D_mm, lam_mm, N_mm, sinHalf) {
  const canvas = document.getElementById('bd-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);

  const PAD = 18;
  const transX = PAD + 22;
  const totalLen = CW - transX - PAD;

  const showMM  = Math.max(N_mm * 2.6, 25);
  const sc      = totalLen / showMM;
  const Npx     = Math.min(N_mm * sc, totalLen * 0.55);
  const cy      = CH / 2;
  const beamHPx = Math.min(D_mm * sc / 2, CH * 0.34);

  /* Near-field tinted region */
  const nfGrad = ctx.createLinearGradient(transX, 0, transX + Npx, 0);
  nfGrad.addColorStop(0, 'rgba(8,145,178,.40)');
  nfGrad.addColorStop(1, 'rgba(8,145,178,.12)');
  ctx.fillStyle = nfGrad;
  ctx.fillRect(transX, cy - beamHPx, Npx, beamHPx * 2);

  /* Transducer */
  ctx.fillStyle = '#0f2d5e';
  ctx.fillRect(PAD, cy - beamHPx - 5, 22, beamHPx * 2 + 10);
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(PAD + 16, cy - beamHPx, 6, beamHPx * 2);

  /* Near-field parallel edges */
  ctx.strokeStyle = 'rgba(8,145,178,.82)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(transX, cy - beamHPx); ctx.lineTo(transX + Npx, cy - beamHPx);
  ctx.moveTo(transX, cy + beamHPx); ctx.lineTo(transX + Npx, cy + beamHPx);
  ctx.stroke(); ctx.setLineDash([]);

  /* Far-field diverging lines at −6 dB half-angle */
  const farEnd  = CW - PAD;
  const farLen  = farEnd - (transX + Npx);
  const halfAng = Math.asin(Math.min(sinHalf, 0.9999));

  ctx.strokeStyle = 'rgba(8,145,178,.75)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(transX + Npx, cy - beamHPx);
  ctx.lineTo(farEnd, cy - beamHPx - farLen * Math.tan(halfAng));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(transX + Npx, cy + beamHPx);
  ctx.lineTo(farEnd, cy + beamHPx + farLen * Math.tan(halfAng));
  ctx.stroke();

  /* Axis centreline */
  ctx.strokeStyle = 'rgba(8,145,178,.38)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(transX, cy); ctx.lineTo(farEnd, cy); ctx.stroke();
  ctx.setLineDash([]);

  /* N marker */
  ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(transX + Npx, cy - beamHPx - 10);
  ctx.lineTo(transX + Npx, cy + beamHPx + 10);
  ctx.stroke(); ctx.setLineDash([]);

  /* Angle arc at the N boundary */
  const arcR = Math.min(farLen * 0.28, 38);
  ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(transX + Npx, cy + beamHPx, arcR, Math.PI / 2, Math.PI / 2 + halfAng);
  ctx.stroke();

  /* Labels */
  ctx.textAlign = 'center'; ctx.font = '10px Inter,sans-serif';
  ctx.fillStyle = '#0891b2';
  ctx.fillText('Near Field', transX + Npx / 2, 13);
  ctx.fillStyle = 'rgba(8,145,178,.90)';
  ctx.fillText('Far Field', transX + Npx + farLen / 2, 13);

  /* N value */
  ctx.fillStyle = '#0891b2'; ctx.font = 'bold 10px Inter,sans-serif';
  ctx.fillText(`N = ${fmt(N_mm, 3)} mm`, transX + Npx, cy + beamHPx + 22);

  /* θ½ label beside arc */
  const halfDeg = halfAng * 180 / Math.PI;
  ctx.fillStyle = '#0891b2'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`θ½ = ${fmt(halfDeg, 3)}°`, transX + Npx + arcR + 4, cy + beamHPx + arcR / 2 + 4);

  /* D label */
  ctx.fillStyle = '#475569'; ctx.textAlign = 'left';
  ctx.fillText(`D = ${D_mm} mm`, PAD + 2, 13);

  /* λ label */
  ctx.fillStyle = '#64748b'; ctx.textAlign = 'right';
  ctx.fillText(`λ = ${fmt(lam_mm, 3)} mm`, CW - PAD, CH - 4);
}

/* ============================================================
   8. WATER PATH CALCULATOR + ANIMATION
   ============================================================ */
let _wpP = { f: 75, mp: 15, cs: 5900, cw: 1495, WP: 15.81, matThick: 30, valid: true };

function calcWaterPath() {
  const f        = parseFloat(document.getElementById('wp-focal').value)  || 75;
  const mp       = parseFloat(document.getElementById('wp-focus').value)  || 15;
  const cs       = parseFloat(document.getElementById('wp-cs').value)     || 5900;
  const cw       = parseFloat(document.getElementById('wp-cw').value)     || 1495;
  const matThick = parseFloat(document.getElementById('wp-thick').value)  || 30;

  const WP    = f - mp * (cs / cw);
  const valid = (WP > 0) && (mp > 0) && (mp <= matThick);

  _wpP = { f, mp, cs, cw, WP, matThick, valid };

  const res = document.getElementById('wp-result');
  if (res) {
    if (WP <= 0) {
      res.querySelector('.result-value').textContent = 'N/A';
      res.querySelector('.result-unit').textContent  = '— increase f or reduce mp';
    } else if (mp > matThick) {
      res.querySelector('.result-value').textContent = 'N/A';
      res.querySelector('.result-unit').textContent  = '— mp > thickness';
    } else {
      res.querySelector('.result-value').textContent = fmt(WP);
      res.querySelector('.result-unit').textContent  = 'mm';
    }
  }

  _wpDraw();
}

function _wpDraw() {
  const canvas = document.getElementById('wp-canvas');
  if (!canvas) return;
  const prepared = _setupHiDPICanvas(canvas);
  const ctx = prepared.ctx;
  const { f, mp, cs, cw, WP, matThick, valid } = _wpP;

  const CW = prepared.CW, CH = prepared.CH;
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, CW, CH);

  if (!valid) {
    ctx.fillStyle = '#ef4444'; ctx.font = '12px Inter,sans-serif'; ctx.textAlign = 'center';
    const msgs = WP <= 0
      ? ['Water path ≤ 0', 'Increase focal length or reduce focus depth.']
      : ['Focus depth > thickness', 'Reduce mp or increase material thickness.'];
    msgs.forEach((m, i) => ctx.fillText(m, CW / 2, CH / 2 - 10 + i * 22));
    return;
  }

  /* ── Horizontal layout: transducer | water | material | tail ── */
  const PAD_L = 12, PAD_R = 16, PAD_T = 26, PAD_B = 38;
  const TRANS_W = 16;
  const x0    = PAD_L + TRANS_W;       // left edge of beam region
  const xEnd  = CW - PAD_R;            // right edge
  const drawW = xEnd - x0;
  const BEAM_H = CH - PAD_T - PAD_B;
  const cy    = PAD_T + BEAM_H / 2;

  const TAIL     = matThick * 0.15;
  const totalLen = WP + matThick + TAIL;
  const scale    = drawW / totalLen;

  const xIF    = x0 + WP * scale;      // water/material interface
  const xFocus = xIF + mp * scale;     // focal point
  const dimY   = CH - PAD_B + 12;     // y for dimension line
  const textY  = dimY - 6;            // y for dimension labels

  /* ── Beam geometry (piecewise linear, two-stage convergence) ── */
  const BH0    = BEAM_H * 0.72;        // full beam height at transducer face
  const BHF    = 5;                    // full beam height at focus
  const BH_IF  = BH0 * 0.70;          // at interface (slow taper in water)
  const BH_END = BH0 * 0.40;          // diverged beam at right edge past focus

  /* ── Backgrounds ── */
  const wg = ctx.createLinearGradient(x0, 0, xIF, 0);
  wg.addColorStop(0, 'rgba(186,230,253,.90)'); wg.addColorStop(1, 'rgba(147,210,246,.80)');
  ctx.fillStyle = wg; ctx.fillRect(x0, PAD_T, xIF - x0, BEAM_H);

  const mg = ctx.createLinearGradient(xIF, 0, xEnd, 0);
  mg.addColorStop(0, 'rgba(203,213,225,.90)'); mg.addColorStop(1, 'rgba(148,163,184,.70)');
  ctx.fillStyle = mg; ctx.fillRect(xIF, PAD_T, xEnd - xIF, BEAM_H);

  /* ── Interface line ── */
  ctx.save(); ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  ctx.strokeStyle = 'rgba(30,64,175,.75)';
  ctx.beginPath(); ctx.moveTo(xIF, PAD_T); ctx.lineTo(xIF, PAD_T + BEAM_H); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();

  /* ── Region labels ── */
  ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#1e40af'; ctx.fillText('Water', x0 + (xIF - x0) / 2, PAD_T + 14);
  ctx.fillStyle = '#334155'; ctx.fillText('Material', xIF + (xEnd - xIF) / 2, PAD_T + 14);

  /* ── Beam fill (clipped to beam shape) ── */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, cy - BH0 / 2);
  ctx.lineTo(xIF, cy - BH_IF / 2);
  ctx.lineTo(xFocus, cy - BHF / 2);
  ctx.lineTo(xEnd, cy - BH_END / 2);
  ctx.lineTo(xEnd, cy + BH_END / 2);
  ctx.lineTo(xFocus, cy + BHF / 2);
  ctx.lineTo(xIF, cy + BH_IF / 2);
  ctx.lineTo(x0, cy + BH0 / 2);
  ctx.closePath(); ctx.clip();
  const btg = ctx.createLinearGradient(x0, 0, xFocus, 0);
  btg.addColorStop(0, 'rgba(8,145,178,.14)'); btg.addColorStop(0.85, 'rgba(8,145,178,.30)'); btg.addColorStop(1, 'rgba(8,145,178,.10)');
  ctx.fillStyle = btg; ctx.fillRect(x0, PAD_T, xEnd - x0, BEAM_H);
  ctx.restore();

  /* ── Beam boundary dashes — kink at interface shows refraction ── */
  ctx.save(); ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
  ctx.strokeStyle = 'rgba(8,145,178,.75)';
  ctx.beginPath(); ctx.moveTo(x0, cy - BH0 / 2); ctx.lineTo(xIF, cy - BH_IF / 2); ctx.lineTo(xFocus, cy - BHF / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, cy + BH0 / 2); ctx.lineTo(xIF, cy + BH_IF / 2); ctx.lineTo(xFocus, cy + BHF / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(8,145,178,.40)'; ctx.setLineDash([2, 5]);
  ctx.beginPath(); ctx.moveTo(xFocus, cy - BHF / 2); ctx.lineTo(xEnd, cy - BH_END / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xFocus, cy + BHF / 2); ctx.lineTo(xEnd, cy + BH_END / 2); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();

  /* ── Focus glow (static) ── */
  const glow = ctx.createRadialGradient(xFocus, cy, 0, xFocus, cy, 13);
  glow.addColorStop(0, 'rgba(250,204,21,.95)'); glow.addColorStop(0.4, 'rgba(250,204,21,.50)'); glow.addColorStop(1, 'rgba(250,204,21,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(xFocus, cy, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(xFocus, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#78350f'; ctx.font = '9.5px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('focus', xFocus, cy + 15);

  /* ── Transducer block (left side) ── */
  const tg = ctx.createLinearGradient(PAD_L, 0, PAD_L + TRANS_W, 0);
  tg.addColorStop(0, '#233d6b'); tg.addColorStop(1, '#0f2d5e');
  ctx.fillStyle = tg; _rRect(ctx, PAD_L, cy - BH0 / 2, TRANS_W - 4, BH0, 4); ctx.fill();
  ctx.fillStyle = '#0891b2'; ctx.fillRect(PAD_L + TRANS_W - 5, cy - BH0 / 2, 5, BH0);
  ctx.save(); ctx.translate(PAD_L + 5, cy); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#bae6fd'; ctx.font = 'bold 7px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('TX', 0, 3); ctx.restore();

  /* ── Dimension annotations ── */
  ctx.lineWidth = 1;
  if (xIF - x0 > 24) {
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(x0, dimY); ctx.lineTo(xIF, dimY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0,  dimY - 4); ctx.lineTo(x0,  dimY + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xIF, dimY - 4); ctx.lineTo(xIF, dimY + 4); ctx.stroke();
    ctx.fillStyle = '#1e40af'; ctx.font = '9.5px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`WP = ${fmt(WP, 3)} mm`, x0 + (xIF - x0) / 2, textY);
  }
  if (xFocus - xIF > 24) {
    ctx.strokeStyle = '#64748b';
    ctx.beginPath(); ctx.moveTo(xIF, dimY); ctx.lineTo(xFocus, dimY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xIF,    dimY - 4); ctx.lineTo(xIF,    dimY + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xFocus, dimY - 4); ctx.lineTo(xFocus, dimY + 4); ctx.stroke();
    ctx.fillStyle = '#475569'; ctx.font = '9.5px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`mp = ${fmt(mp, 3)} mm`, xIF + (xFocus - xIF) / 2, textY);
  }
}

/* ─────────────────────────────────────────────────────────────
   WAVE VELOCITY FROM MATERIAL PROPERTIES  —  calculators.html
   c_L = sqrt( E(1-nu) / [rho(1+nu)(1-2nu)] )
   c_S = sqrt( E / [2*rho*(1+nu)] )
   ───────────────────────────────────────────────────────────── */
function calcWaveVel() {
  const E_GPa = parseFloat(document.getElementById('wv-E').value)   || 0;
  const nu    = parseFloat(document.getElementById('wv-nu').value)   || 0;
  const rho   = parseFloat(document.getElementById('wv-rho').value)  || 0;

  const resL  = document.getElementById('wv-cL');
  const resS  = document.getElementById('wv-cS');
  const resR  = document.getElementById('wv-ratio');

  if (!E_GPa || !rho || nu <= 0 || nu >= 0.5) {
    resL.innerHTML = resS.innerHTML = '—';
    resR.innerHTML = 'Enter valid E, &nu;, &rho;';
    return;
  }

  const E = E_GPa * 1e9;  /* Pa */
  const cL = Math.sqrt(E * (1 - nu) / (rho * (1 + nu) * (1 - 2 * nu)));
  const cS = Math.sqrt(E / (2 * rho * (1 + nu)));
  const ratio = cS / cL;

  resL.innerHTML = `<span style="font-size:.78rem;color:var(--text-muted);">c<sub>L</sub></span><br><strong>${cL.toFixed(0)} m/s</strong>`;
  resS.innerHTML = `<span style="font-size:.78rem;color:var(--text-muted);">c<sub>S</sub></span><br><strong>${cS.toFixed(0)} m/s</strong>`;
  resR.innerHTML = `c<sub>S</sub>/c<sub>L</sub> = <strong>${ratio.toFixed(3)}</strong> &nbsp;|&nbsp; &lambda;<sub>L</sub> at 5 MHz = <strong>${(cL/5e6*1e3).toFixed(2)} mm</strong>`;

  /* ── Canvas bar chart ── */
  const canvas = document.getElementById('wv-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, CW, CH);

  const maxVal = Math.max(cL, cS, 1000);
  const barData = [
    { label: `c_L = ${cL.toFixed(0)} m/s`, val: cL, color: '#0891b2' },
    { label: `c_S = ${cS.toFixed(0)} m/s`, val: cS, color: '#7c3aed' }
  ];
  const BAR_H = 38, GAP = 18, LEFT = 130, TOP = 40;
  ctx.font = '11px Inter,sans-serif';

  barData.forEach((d, i) => {
    const y = TOP + i * (BAR_H + GAP);
    const w = Math.max(4, (d.val / maxVal) * (CW - LEFT - 20));
    ctx.fillStyle = d.color + '22';
    ctx.fillRect(LEFT, y, CW - LEFT - 20, BAR_H);
    ctx.fillStyle = d.color;
    ctx.fillRect(LEFT, y, w, BAR_H);
    ctx.fillStyle = '#1e293b'; ctx.textAlign = 'right';
    ctx.fillText(d.label.split('=')[0].trim(), LEFT - 8, y + BAR_H / 2 + 4);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    if (w > 60) ctx.fillText(d.label.split('=')[1].trim(), LEFT + w - 70, y + BAR_H / 2 + 4);
    else { ctx.fillStyle = d.color; ctx.textAlign = 'left'; ctx.fillText(d.label.split('=')[1].trim(), LEFT + w + 4, y + BAR_H / 2 + 4); }
  });

  /* Ratio bar */
  const ry = TOP + 2 * (BAR_H + GAP) + 8;
  ctx.fillStyle = '#475569'; ctx.textAlign = 'left';
  ctx.font = '10px Inter,sans-serif';
  ctx.fillText(`c_S/c_L = ${ratio.toFixed(3)}  (Poisson ratio ${nu.toFixed(2)})`, LEFT, ry);
}
calcWaveVel();

/* ─────────────────────────────────────────────────────────────
   TOFD CRACK SIZING  —  calculators.html
   a = cos(theta) * (dt * v) / 2
   ───────────────────────────────────────────────────────────── */
function calcTOFD() {
  const theta_deg = parseFloat(document.getElementById('tofd-angle').value) || 0;
  const dt_us     = parseFloat(document.getElementById('tofd-dt').value)    || 0;
  const v         = parseFloat(document.getElementById('tofd-vel').value)   || 0;
  const res       = document.getElementById('tofd-result');

  if (!theta_deg || !dt_us || !v) { res.innerHTML = '—'; return; }

  const theta = theta_deg * Math.PI / 180;
  const a_m   = Math.cos(theta) * (dt_us * 1e-6 * v) / 2;
  const a_mm  = a_m * 1000;

  res.innerHTML = `Crack height <em>a</em> = <strong style="font-size:1.2rem;">${a_mm.toFixed(2)} mm</strong>`;

  /* ── Canvas: TOFD geometry diagram ── */
  const canvas = document.getElementById('tofd-canvas');
  if (!canvas) return;
  const { ctx, CW, CH } = _setupHiDPICanvas(canvas);
  ctx.clearRect(0, 0, CW, CH); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, CW, CH);

  const MAT_TOP = 60, MAT_H = 110, CX = CW / 2;
  /* Material */
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(20, MAT_TOP, CW - 40, MAT_H);
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  ctx.strokeRect(20, MAT_TOP, CW - 40, MAT_H);

  /* Crack (vertical red line at center) */
  const crackTop = MAT_TOP + 10;
  const crackBot = crackTop + Math.max(8, Math.min(MAT_H - 20, a_mm * 2.5));
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(CX, crackTop); ctx.lineTo(CX, crackBot); ctx.stroke();
  /* 'a' annotation */
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(CX + 8, crackTop); ctx.lineTo(CX + 8, crackBot); ctx.stroke();
  ctx.fillStyle = '#dc2626'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`a=${a_mm.toFixed(1)}mm`, CX + 12, (crackTop + crackBot) / 2 + 4);

  /* TX and RX blocks */
  const TX_X = 40, RX_X = CW - 40;
  [[TX_X, 'TX', '#0f2d5e'], [RX_X, 'RX', '#0e7490']].forEach(([bx, lbl, col]) => {
    ctx.fillStyle = col; ctx.fillRect(bx - 18, MAT_TOP - 26, 36, 22);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(lbl, bx, MAT_TOP - 11);
  });

  /* Tip path (solid cyan) */
  ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 1.8; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(TX_X, MAT_TOP); ctx.lineTo(CX, crackTop); ctx.lineTo(RX_X, MAT_TOP); ctx.stroke();
  /* Base path (dashed purple) */
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(TX_X, MAT_TOP); ctx.lineTo(CX, crackBot); ctx.lineTo(RX_X, MAT_TOP); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64748b'; ctx.font = '8.5px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`θ=${theta_deg}°  Δt=${dt_us}μs  v=${v}m/s`, CW / 2, CH - 8);
}
calcTOFD();
