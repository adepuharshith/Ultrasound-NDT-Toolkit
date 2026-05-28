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
theory.html         11 theory sections — sticky sidebar scroll-spy
calculators.html    8 live calculators — single-column, input-left + canvas-right
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

## Water path formula
`WP = f − mp × (cs / cw)`
- f = focal length (mm), mp = desired focus depth in material (mm)
- cs = wave speed in material (m/s), cw = wave speed in water (m/s, default 1495)
- Result: distance transducer face should be from material surface

---

## theory.html — sections (IDs for sidebar links)
`wave-propagation`, `acoustic-impedance`, `attenuation`, `transducers`,
`beam-physics`, `snell`, `imaging`, `signal-processing`, `phased-arrays`, `calibration`, `advanced`

### Particle animation (wave-propagation section)
- Canvas: `#particle-canvas` 720×270, inline `<script>` at bottom of theory.html
- Self-contained IIFE — no dependency on main.js
- Physics: longitudinal wave u = A·sin(kx − ωt), NX=22 cols, NY=6 rows
- Highlights one particle (#4,2) with orange particle-velocity arrow
- Dynamic compression/rarefaction labels follow wave crests
- Cyan wave-velocity arrow at bottom; pause/play via `#particle-playpause`
- All animation state is local (`frame`, `running`, `arrowAt()` helper)

---

## resources.html — filter logic
JS `setFilter(type, btn)` + `applyFilters()` — filters `.resource-item` by `data-type`
attribute (`textbook | paper | software | standard | online`) and search query against
`data-text` + `innerText`. All items start `.visible`; toggled via classList.

---

## Git log (recent)
```
9dcce90  Add NDE-ED content: beam divergence calc + theory expansions
97b1dfb  Fix calc-box width: remove 540px max-width cap
b66ae4a  Fix calc layout width; add particle wave animation to theory
746699b  Fix layout width + calc init; add CONTEXT.md
```

---

## Known issues / next steps
- Add more theory content (user's own PhD material)
- Add calculators: focal spot size, SNR estimator, dispersion curves
- Add Lab Techniques page
- GitHub Pages not yet enabled (push → Settings → Pages → main branch)
