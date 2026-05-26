/* ============================================================
   Ultrasound & NDT Toolkit — Shared JS
   ============================================================ */

/* Hamburger menu toggle */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav-hamburger');
  const links = document.querySelector('.nav-links');
  if (btn && links) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }

  /* Highlight active nav link */
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  /* Sidebar scroll-spy (theory page) */
  const sections = document.querySelectorAll('.theory-section[id]');
  const sideLinks = document.querySelectorAll('.topic-sidebar a[href^="#"]');
  if (sections.length && sideLinks.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          sideLinks.forEach(l => l.classList.remove('active'));
          const active = [...sideLinks].find(l => l.getAttribute('href') === '#' + e.target.id);
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => obs.observe(s));
  }
});

/* ============================================================
   CALCULATORS
   ============================================================ */

/* Helper: format significant figures */
function fmt(val, sig = 4) {
  if (!isFinite(val)) return '—';
  return parseFloat(val.toPrecision(sig)).toLocaleString('en-US', { maximumSignificantDigits: sig });
}

/* 1. Wavelength ↔ Frequency */
function calcWavelength() {
  const f = parseFloat(document.getElementById('wl-freq').value);
  const v = parseFloat(document.getElementById('wl-vel').value);
  const res = document.getElementById('wl-result');
  if (!f || !v) { res.querySelector('.result-value').textContent = '—'; return; }
  const lambda = v / (f * 1e6);          /* freq in MHz → Hz */
  const lambda_mm = lambda * 1000;
  res.querySelector('.result-value').textContent = fmt(lambda_mm);
  res.querySelector('.result-unit').textContent = 'mm';
}

/* 2. Near-field distance (Rayleigh / N) */
function calcNearField() {
  const D = parseFloat(document.getElementById('nf-diam').value);   /* mm */
  const f = parseFloat(document.getElementById('nf-freq').value);   /* MHz */
  const v = parseFloat(document.getElementById('nf-vel').value);    /* m/s */
  const res = document.getElementById('nf-result');
  if (!D || !f || !v) { res.querySelector('.result-value').textContent = '—'; return; }
  const lambda = v / (f * 1e6);          /* m */
  const lambda_mm = lambda * 1000;
  const N = (D * D) / (4 * lambda_mm);  /* mm */
  res.querySelector('.result-value').textContent = fmt(N);
  res.querySelector('.result-unit').textContent = 'mm';
}

/* 3. Time-of-flight → depth */
function calcDepth() {
  const tof = parseFloat(document.getElementById('tof-time').value);  /* µs */
  const v   = parseFloat(document.getElementById('tof-vel').value);   /* m/s */
  const res = document.getElementById('tof-result');
  if (!tof || !v) { res.querySelector('.result-value').textContent = '—'; return; }
  const depth_mm = (tof * 1e-6 * v * 1000) / 2;  /* one-way */
  res.querySelector('.result-value').textContent = fmt(depth_mm);
  res.querySelector('.result-unit').textContent = 'mm';
}

/* 4. Attenuation */
function calcAttenuation() {
  const alpha = parseFloat(document.getElementById('att-coeff').value);  /* dB/mm/MHz */
  const f     = parseFloat(document.getElementById('att-freq').value);   /* MHz */
  const d     = parseFloat(document.getElementById('att-dist').value);   /* mm */
  const res   = document.getElementById('att-result');
  if (!alpha || !f || !d) { res.querySelector('.result-value').textContent = '—'; return; }
  const total_dB = alpha * f * d;  /* round-trip included via user distance */
  res.querySelector('.result-value').textContent = fmt(total_dB);
  res.querySelector('.result-unit').textContent = 'dB';
}

/* 5. Snell's Law */
function calcSnell() {
  const theta1 = parseFloat(document.getElementById('sn-angle').value); /* deg */
  const v1     = parseFloat(document.getElementById('sn-v1').value);
  const v2     = parseFloat(document.getElementById('sn-v2').value);
  const res    = document.getElementById('sn-result');
  if (!theta1 || !v1 || !v2) { res.querySelector('.result-value').textContent = '—'; return; }
  const sinT2 = (v2 / v1) * Math.sin(theta1 * Math.PI / 180);
  if (Math.abs(sinT2) > 1) {
    res.querySelector('.result-value').textContent = 'TIR';
    res.querySelector('.result-unit').textContent = '(total internal reflection)';
    return;
  }
  const theta2 = Math.asin(sinT2) * 180 / Math.PI;
  res.querySelector('.result-value').textContent = fmt(theta2);
  res.querySelector('.result-unit').textContent = '°';
}

/* 6. Acoustic impedance & reflection coefficient */
function calcImpedance() {
  const rho1 = parseFloat(document.getElementById('z-rho1').value);
  const v1   = parseFloat(document.getElementById('z-v1').value);
  const rho2 = parseFloat(document.getElementById('z-rho2').value);
  const v2   = parseFloat(document.getElementById('z-v2').value);
  if (!rho1 || !v1 || !rho2 || !v2) return;
  const Z1 = rho1 * v1;
  const Z2 = rho2 * v2;
  const R  = ((Z2 - Z1) / (Z2 + Z1)) ** 2 * 100; /* % */
  const T  = 100 - R;
  document.getElementById('z-z1').textContent  = fmt(Z1 / 1e6) + ' MRayl';
  document.getElementById('z-z2').textContent  = fmt(Z2 / 1e6) + ' MRayl';
  document.getElementById('z-r').textContent   = fmt(R) + ' %';
  document.getElementById('z-t').textContent   = fmt(T) + ' %';
}

/* ============================================================
   7. WATER PATH CALCULATOR + CANVAS ANIMATION
   ============================================================ */

let _wpPhase  = 0;
let _wpAnimId = null;
let _wpP = { f:75, mp:15, cs:5900, cw:1495, WP:60.1, matThick:30, valid:true };

/* Calculate and store params, update result display */
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
  if (!res) return;
  if (WP <= 0) {
    res.querySelector('.result-value').textContent = 'N/A';
    res.querySelector('.result-unit').textContent  = '— increase f or reduce mp';
  } else if (mp > matThick) {
    res.querySelector('.result-value').textContent = 'N/A';
    res.querySelector('.result-unit').textContent  = '— mp > material thickness';
  } else {
    res.querySelector('.result-value').textContent = fmt(WP);
    res.querySelector('.result-unit').textContent  = 'mm';
  }

  /* Ensure animation is running */
  if (!_wpAnimId) _wpResume();
}

/* ---- Animation controls ---- */
function _wpResume() {
  if (_wpAnimId || !document.getElementById('wp-canvas')) return;
  (function loop() {
    _wpPhase += 1.35;
    _wpDraw();
    _wpAnimId = requestAnimationFrame(loop);
  })();
}
function _wpPause() {
  if (_wpAnimId) { cancelAnimationFrame(_wpAnimId); _wpAnimId = null; }
}

/* ---- Main draw function ---- */
function _wpDraw() {
  const canvas = document.getElementById('wp-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { f, mp, cs, cw, WP, matThick, valid } = _wpP;

  const CW = canvas.width;   /* 280 */
  const CH = canvas.height;  /* 430 */
  const cx = CW / 2;

  ctx.clearRect(0, 0, CW, CH);

  /* -------- error / invalid state -------- */
  if (!valid) {
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#ef4444';
    ctx.font = '12px Inter,sans-serif';
    ctx.textAlign = 'center';
    const lines = WP <= 0
      ? ['Water path ≤ 0', 'Increase focal length', 'or reduce focus depth.']
      : ['Focus depth > thickness', 'Reduce mp or increase', 'material thickness.'];
    lines.forEach((l, i) => ctx.fillText(l, cx, CH / 2 - 18 + i * 20));
    return;
  }

  /* -------- layout constants -------- */
  const PAD_T   = 18;
  const PAD_B   = 14;
  const TRANS_H = 26;
  const TRANS_W = 58;
  const BELOW   = matThick * 0.20;            /* visual space below material */
  const totalPh = WP + matThick + BELOW;
  const drawH   = CH - PAD_T - TRANS_H - PAD_B;
  const scale   = drawH / totalPh;            /* px / mm */

  const transY0  = PAD_T;
  const transY1  = PAD_T + TRANS_H;           /* transducer face */
  const matTopY  = transY1 + WP * scale;      /* water–material interface */
  const matBotY  = matTopY + matThick * scale;
  const focusY   = matTopY + mp * scale;      /* focal point */
  const bottomY  = CH - PAD_B;

  /* -------- background regions -------- */
  /* water */
  const wg = ctx.createLinearGradient(0, transY1, 0, matTopY);
  wg.addColorStop(0, 'rgba(224,242,254,.70)');
  wg.addColorStop(1, 'rgba(186,230,253,.60)');
  ctx.fillStyle = wg;
  ctx.fillRect(0, transY1, CW, matTopY - transY1);

  /* material */
  const mg = ctx.createLinearGradient(0, matTopY, 0, matBotY);
  mg.addColorStop(0, 'rgba(203,213,225,.75)');
  mg.addColorStop(1, 'rgba(148,163,184,.65)');
  ctx.fillStyle = mg;
  ctx.fillRect(0, matTopY, CW, matBotY - matTopY);

  /* below material */
  ctx.fillStyle = 'rgba(248,250,252,.50)';
  ctx.fillRect(0, matBotY, CW, bottomY - matBotY);

  /* -------- region text labels -------- */
  ctx.font = '10px Inter,sans-serif';
  ctx.textAlign = 'left';
  if (matTopY - transY1 > 22) {
    ctx.fillStyle = 'rgba(30,64,175,.70)';
    ctx.fillText('Water', 7, transY1 + 14);
  }
  if (matBotY - matTopY > 22) {
    ctx.fillStyle = 'rgba(51,65,85,.70)';
    ctx.fillText('Material', 7, matTopY + 14);
  }

  /* -------- interface lines -------- */
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = 'rgba(30,64,175,.50)';
  ctx.beginPath(); ctx.moveTo(0, matTopY);  ctx.lineTo(CW, matTopY);  ctx.stroke();
  ctx.strokeStyle = 'rgba(51,65,85,.50)';
  ctx.beginPath(); ctx.moveTo(0, matBotY);  ctx.lineTo(CW, matBotY);  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  /* -------- beam geometry helpers -------- */
  const BW0 = 50;   /* half-width at transducer face (px) */
  const BWF = 2.5;  /* half-width at focal point */

  /* divergence angle mirrors the convergence angle */
  const convRate = (BW0 - BWF) / (focusY - transY1);

  function beamHW(y) {
    if (y <= transY1) return BW0;
    if (y <= focusY)  return BW0 - convRate * (y - transY1);
    return BWF + convRate * (y - focusY);
  }

  /* -------- clip region = full beam envelope -------- */
  const bwBot = beamHW(bottomY);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - BW0,  transY1);
  ctx.lineTo(cx - BWF,  focusY);
  ctx.lineTo(cx - bwBot, bottomY);
  ctx.lineTo(cx + bwBot, bottomY);
  ctx.lineTo(cx + BWF,  focusY);
  ctx.lineTo(cx + BW0,  transY1);
  ctx.closePath();
  ctx.clip();

  /* beam tint background */
  const btg = ctx.createLinearGradient(cx, transY1, cx, focusY + 20);
  btg.addColorStop(0,    'rgba(8,145,178,.10)');
  btg.addColorStop(0.85, 'rgba(8,145,178,.20)');
  btg.addColorStop(1,    'rgba(8,145,178,.06)');
  ctx.fillStyle = btg;
  ctx.fillRect(0, transY1, CW, bottomY - transY1);

  /* -------- animated wavefronts -------- */
  /*
   * Strategy: fixed pixel spacing between wavefronts.
   * _wpPhase scrolls them downward. Even/odd → compression / rarefaction.
   * Each wavefront is a slight forward-curving arc (quadratic Bézier)
   * to mimic converging spherical wavefronts.
   */
  const SPACING = 22;   /* pixels between wavefronts */
  const totalLen = bottomY - transY1;
  const startOff = _wpPhase % SPACING;

  for (let k = 0; k * SPACING < totalLen + SPACING; k++) {
    const yRel = startOff + k * SPACING;
    const y    = transY1 + yRel;
    if (y < transY1 + 0.5 || y > bottomY - 0.5) continue;

    const hw = beamHW(y);
    if (hw < 0.5) continue;

    /* compression = even, rarefaction = odd */
    const isComp = k % 2 === 0;

    /* opacity: fade near edges, brighten near focus */
    const distF  = Math.abs(y - focusY);
    const maxD   = Math.max(focusY - transY1, bottomY - focusY, 1);
    const fade   = 0.55 + 0.45 * Math.pow(1 - distF / maxD, 2);

    /* sagitta: wavefront curves toward direction of travel (downward).
       In converging region the curvature increases → ∝ hw²/(focusY-y).
       In diverging region curvature decreases → ∝ hw²/(y-focusY). Capped. */
    let sag;
    if (y < focusY) {
      sag = Math.min(hw * hw / (2 * Math.max(focusY - y, 1)), 10);
    } else {
      sag = Math.min(hw * hw / (2 * Math.max(y - focusY, 1)), 10);
    }
    sag = Math.max(sag, 1.5);  /* minimum visible curve */

    ctx.beginPath();
    ctx.moveTo(cx - hw, y);
    ctx.quadraticCurveTo(cx, y + sag, cx + hw, y);

    if (isComp) {
      ctx.strokeStyle = `rgba(8,145,178,${(0.80 * fade).toFixed(2)})`;
      ctx.lineWidth   = 1.8;
    } else {
      ctx.strokeStyle = `rgba(224,242,254,${(0.55 * fade).toFixed(2)})`;
      ctx.lineWidth   = 1.0;
    }
    ctx.stroke();
  }
  ctx.restore(); /* end clip */

  /* -------- beam boundary dashed lines -------- */
  ctx.save();
  ctx.lineWidth = 1.3;

  /* converging */
  ctx.strokeStyle = 'rgba(8,145,178,.45)';
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(cx - BW0, transY1); ctx.lineTo(cx - BWF, focusY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + BW0, transY1); ctx.lineTo(cx + BWF, focusY); ctx.stroke();

  /* diverging (fainter) */
  ctx.strokeStyle = 'rgba(8,145,178,.22)';
  ctx.setLineDash([2, 5]);
  ctx.beginPath(); ctx.moveTo(cx - BWF, focusY); ctx.lineTo(cx - bwBot, bottomY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + BWF, focusY); ctx.lineTo(cx + bwBot, bottomY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  /* -------- focal glow (pulsing) -------- */
  const pulse = 0.82 + 0.18 * Math.sin(_wpPhase * 0.06);
  const glow  = ctx.createRadialGradient(cx, focusY, 0, cx, focusY, 16 * pulse);
  glow.addColorStop(0,    `rgba(250,204,21,${(0.95 * pulse).toFixed(2)})`);
  glow.addColorStop(0.40, `rgba(250,204,21,${(0.50 * pulse).toFixed(2)})`);
  glow.addColorStop(0.75, `rgba(250,204,21,${(0.15 * pulse).toFixed(2)})`);
  glow.addColorStop(1,    'rgba(250,204,21,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, focusY, 16 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath(); ctx.arc(cx, focusY, 2.8, 0, Math.PI * 2); ctx.fill();
  /* focus label */
  ctx.fillStyle = '#78350f';
  ctx.font = '10px Inter,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('focus', cx + 9, focusY + 4);

  /* -------- dimension annotations (right side) -------- */
  const AX = CW - 5;    /* annotation right edge */
  ctx.textAlign = 'right';
  ctx.font = '10px Inter,sans-serif';

  /* WP bracket */
  if (WP * scale > 24) {
    const midWP   = transY1 + WP * scale / 2;
    const label   = `WP = ${fmt(WP, 3)} mm`;
    const lw      = ctx.measureText(label).width + 6;
    ctx.fillStyle = '#1e40af';
    ctx.fillText(label, AX, midWP + 4);
    /* vertical bracket line */
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth   = 1;
    ctx.setLineDash([1, 2]);
    const bx = AX - lw;
    ctx.beginPath(); ctx.moveTo(bx, transY1); ctx.lineTo(bx, matTopY); ctx.stroke();
    /* ticks */
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(bx, transY1); ctx.lineTo(bx + 5, transY1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, matTopY); ctx.lineTo(bx + 5, matTopY); ctx.stroke();
  }

  /* mp label */
  if (mp * scale > 20) {
    const midMP = matTopY + mp * scale / 2;
    ctx.fillStyle = '#475569';
    ctx.fillText(`mp = ${fmt(mp, 3)} mm`, AX, midMP + 4);
  }

  /* -------- transducer body -------- */
  const tg = ctx.createLinearGradient(cx, transY0, cx, transY1);
  tg.addColorStop(0, '#233d6b');
  tg.addColorStop(1, '#0f2d5e');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.roundRect(cx - TRANS_W / 2, transY0, TRANS_W, TRANS_H - 4, [5, 5, 0, 0]);
  ctx.fill();

  /* piezo face strip (cyan) */
  ctx.fillStyle = '#0891b2';
  ctx.fillRect(cx - TRANS_W / 2, transY1 - 5, TRANS_W, 5);

  /* transducer label */
  ctx.fillStyle = '#bae6fd';
  ctx.font = 'bold 8px Inter,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRANSDUCER', cx, transY0 + 13);
}
