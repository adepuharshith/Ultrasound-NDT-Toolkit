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
