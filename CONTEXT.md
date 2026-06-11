# Ultrasound & NDT Toolkit — Developer Context
> Read this first. Updated after every significant change.

## Project location
`/Users/harshithmac/Library/CloudStorage/OneDrive-purdue.edu/00_Purdue/Ph.D. Research/99_Misc/Ultrasound_ToolKit/`

## Remote
`https://github.com/adepuharshith/ultrasound-ndt-toolkit`  
GitHub Pages: `https://adepuharshith.github.io/ultrasound-ndt-toolkit/`

---

## File map
```
index.html          Landing page — hero, pathway strip, 3 section cards
theory.html         Full theory guide — 9-step student flow + 10 advanced topics
transducers.html    Transducer types page — piezo, anatomy, 7 transducer types
calculators.html    10 live calculators — single-column, input-left + canvas-right
resources.html      Filterable resource library (type buttons + search input)
assets/css/style.css  Global tokens, nav, hero, cards, calc components
assets/js/main.js     All calculator logic + canvas animations
CONTEXT.md          ← this file
```

---

## CSS design tokens (style.css)
| Token | Value | Use |
|---|---|---|
| `--brand-navy` | `#0f2d5e` | Nav, transducer, headings |
| `--brand-cyan` | `#0891b2` | Accent, section labels, result borders |
| `--brand-blue` | `#1e40af` | Links, active states |
| `--bg` | `#f8fafc` | Page background |
| `--border` | `#e2e8f0` | Card borders |
| `--radius` | `10px` | Card corners |

---

## Navigation (all pages)
All 5 pages share the same nav: Home → Theory → Transducers → Calculators → Resources

---

## calculators.html — layout rules
- `.calc-grid` — `grid-template-columns: 1fr` (one card per row, full width)
- `.calc-inner` — **flex row**: `.calc-inputs` gets `width: min(360px, 42%)`, `.calc-viz` gets `flex:1 1 auto`
- `.calc-viz canvas` — `width:100%; height:auto` (fills viz column, scales proportionally)
- Water path uses `.calc-inputs-wide` → `width: min(400px, 44%)`
- Stacks to single column at `max-width: 720px`
- **Init**: calculators are called DIRECTLY at bottom of `<body>` (no load event listener)

---

## Calculator ↔ canvas ID map
| Calculator | Inputs | Result ID | Canvas ID | JS function |
|---|---|---|---|---|
| Wavelength | `wl-freq`, `wl-c1`, `wl-c2` | `wl-res1`, `wl-res2` | `wl-canvas` 600×190 | `calcWavelength()` + `_wlDraw()` |
| Water Path | `wp-focal`, `wp-thick`, `wp-cs`, `wp-cw`, `wp-focus` | `wp-result` | `wp-canvas` 300×480 | `calcWaterPath()` + `_wpDraw()` |
| Near-Field | `nf-diam`, `nf-freq`, `nf-vel` | `nf-result` | `nf-canvas` 520×180 | `calcNearField()` + `_drawNFViz()` |
| TOF→Depth | `tof-time`, `tof-vel` | `tof-result` | `tof-canvas` 320×220 | `calcDepth()` + `_drawTOFViz()` |
| Attenuation | `att-coeff`, `att-freq`, `att-dist` | `att-result` | `att-canvas` 560×160 | `calcAttenuation()` + `_drawAttViz()` |
| Snell's Law | `sn-angle`, `sn-v1`, `sn-v2` | `sn-result` | `sn-canvas` 420×220 | `calcSnell()` + `_drawSnellViz()` |
| Impedance | `z-rho1`, `z-v1`, `z-rho2`, `z-v2` | `z-z1/z2/r/t` | `z-canvas` 440×200 | `calcImpedance()` + `_drawZViz()` |
| Beam Divergence | `bd-diam`, `bd-freq`, `bd-vel` | `bd-res1`, `bd-res2` | `bd-canvas` 500×200 | `calcBeamDiv()` + `_drawBeamDivViz()` |
| Wave Velocity | `wv-E`, `wv-nu`, `wv-rho` | `wv-cL`, `wv-cS`, `wv-ratio` | `wv-canvas` 380×200 | `calcWaveVel()` |
| TOFD Sizing | `tofd-angle`, `tofd-dt`, `tofd-vel` | `tofd-result` | `tofd-canvas` 320×200 | `calcTOFD()` |

---

## main.js — key globals & helpers
```javascript
fmt(val, sig=4)         // format number to sig figs; returns '—' for non-finite
_rRect(ctx,x,y,w,h,r)  // compat rounded rect (avoids ctx.roundRect browser issues)
_arrow(ctx,x1,y1,x2,y2,hs=7) // arrow with head at (x2,y2)

// Wavelength animation
let _wlPhase, _wlAnimId, _wlP = {f,c1,c2}
_wlStart()  // starts rAF loop; safe to call multiple times

// Water path animation
let _wpPhase, _wpAnimId, _wpP = {f,mp,cs,cw,WP,matThick,valid}
_wpResume() / _wpPause()  // used with visibilitychange event
```

---

## theory.html — structure

### 9-step student flow (sidebar "Student Path")
1. Sound Waves vs EM Waves (`#wave-types`) — light canvas animations + EM 3D wave
2. Speed in Media (`#speed-comparison`)
3. Energy Loss / Attenuation (`#energy-loss`)
4. Why Longitudinal? (`#why-longitudinal`)
5. Ultrasound Spectrum (`#ultrasound-spectrum`)
6. Generating Ultrasound / Piezoelectric (`#generating-ultrasound`)
7. A-scan (`#a-scan`)
8. B-scan (`#b-scan`)
9. C-scan (`#c-scan`)

### Advanced topics (sidebar "Advanced Topics")
- Acoustic Impedance (`#acoustic-impedance`) — Z = ρc, R and T formulas, interface SVG, Z table for 7 NDE materials, immersion-Al worked example, phase-inversion diagnostic callout
- Attenuation — Detailed (`#attenuation`) — frequency dependence, Rayleigh/stochastic
- Beam Physics (`#beam-physics`) — wave velocity from material props (V_L, V_S), near field, divergence, focus
- Snell's Law & Mode Conversion (`#snell`) — critical angle table, SVG mode-conversion diagram
- Signal Processing (`#signal-processing`) — Hilbert, TGC, pulse compression, SNR table
- Phased Arrays (`#phased-arrays`) — steering, S-scan, FMC/TFM
- Calibration & DAC (`#calibration`) — dB scale, DAC curve, IIW blocks
- Pulser-Receiver (`#pulser-receiver`) — pulser settings, receiver settings, rectification modes canvas
- TOFD (`#tofd`) — crack tip diffraction, geometry SVG, a = cosθ·Δt·v/2
- Weld Inspection (`#weld-inspection`) — 2-stage approach, defect table, stainless note

### Canvas animations in theory.html (inline `<script>` at bottom)
- `#long-canvas` — longitudinal wave, light background
- `#em-canvas` — 3D EM wave (E/B fields, pseudo-3D oblique projection)
- `#rect-canvas` 680×260 — 4-panel rectification modes (RF, +HW, -HW, Full wave)

### KaTeX
All 13 `eq-box` elements use `$$...$$` KaTeX syntax. CDN loaded in `<head>` with auto-render.

---

## Water path formula
`WP = f − mp × (cs / cw)`
- f = focal length (mm), mp = desired focus depth in material (mm)
- cs = wave speed in material (m/s), cw = wave speed in water (m/s, default 1495)

---

## resources.html — filter logic
JS `setFilter(type, btn)` + `applyFilters()` — filters `.resource-item` by `data-type`
attribute (`textbook | paper | software | standard | online`) and search query against
`data-text` + `innerText`.

---

## Git log (recent — as of 2026-06-05)
```
Expand Acoustic Impedance section: interface SVG, Z table for 7 NDE materials, immersion-Al worked example, phase-inversion callout
1525046  Expand Phased Arrays section: delay-law SVG, FMC/TFM math, AM inspection example, key params table
5d3ee12  Overhaul theory: KaTeX equations, 3D EM wave, light animations, Transducers nav
b8c35c1  Expand Signal Processing section
7d5fbb9  Expand Snell's Law section: SVG mode-conversion diagram
5be75da  Restructure theory page with 9-step student flow; add transducers page
```

---

## Known issues / next steps
- GitHub push requires PAT token (HTTPS remote); SSH not yet configured
- Add calculators: focal spot size, SNR estimator, dispersion curves
- GitHub Pages: Settings → Pages → main branch (not yet enabled)
- Content sourced from NDE-ED (nde-ed.org) + Purdue lab experience
