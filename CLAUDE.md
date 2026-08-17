# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A static, no-build educational website (Purdue NDT Lab) teaching ultrasonic/NDT (non-destructive testing)
theory: wave physics, signal processing, and interactive calculators. Pure HTML/CSS/vanilla JS — no
framework, no bundler, no package manager.

Remote: `https://github.com/adepuharshith/ultrasound-ndt-toolkit`, GitHub Pages at
`https://adepuharshith.github.io/ultrasound-ndt-toolkit/` (not yet enabled in repo settings — Settings →
Pages → main branch). Pushing over HTTPS works via credentials already cached in the macOS Keychain
(`osxkeychain` credential helper) — `git push origin main` from the CLI just works, no PAT/SSH setup
needed. Offer to commit + push after finishing a change, but only do it once the user confirms — they
don't want automatic pushes on every change.

## Commands

There is no build, lint, or test tooling in this repo (no `package.json`, no Node installed on this
machine). To view changes, serve the directory and open a page in a browser:

```bash
python3 -m http.server 8000   # then open http://localhost:8000/theory.html etc.
```

Before/after editing any inline `<script>` in an `.html` file, sanity-check syntax (no Node available) via:

```bash
osascript -l JavaScript -e "
ObjC.import('Foundation');
var content = \$.NSString.stringWithContentsOfFileEncodingError('/path/to/extracted.js', \$.NSUTF8StringEncoding, null).js;
try { new Function(content); console.log('SYNTAX OK'); } catch(e) { console.log('SYNTAX ERROR: ' + e); }
"
```

For visual verification (especially canvas animations, light/dark theme, responsive layout), drive a
headless browser rather than trusting the code alone — `pip3 install playwright && python3 -m playwright
install chromium`, then screenshot both themes and a mobile viewport (~390px). Toggle dark theme in a
Playwright script via `page.locator(".theme-toggle").click()`. Check
`document.documentElement.scrollWidth - document.documentElement.clientWidth` for introduced horizontal
overflow — note there is a pre-existing, unrelated mobile overflow from wide KaTeX-rendered formulas that
predates any theming work, and a pre-existing console error (`Cannot read properties of null (reading
'value')`) when navigating client-side into `calculators.html` from another page (calculator init code at
the bottom of `<body>` queries an element without a guard; harmless, calculators still work).

There are no automated tests. Manual verification (headless-browser screenshots + console-error checks) is
the only check.

## Pages

| Page | Contents |
|---|---|
| `index.html` | Landing page — hero, pathway strip, section cards |
| `theory.html` | The bulk of the content — ~9-topic student flow + ~10 advanced topics (by far the largest file) |
| `calculators.html` | 10 live calculators — single column, input-left + canvas-right |
| `signal-processing.html` | Cross-correlation, wavelet transform, A-scan signal processing deep-dives |
| `resources.html` | Filterable resource library (type buttons + search input) |
| `about.html` | About page |
| `transducers.html` | Intentionally empty "Experiments" placeholder, linked only from a card inside `theory.html` — removed from the main nav, the file just wasn't deleted |

`assets/css/style.css` — shared design tokens, nav, hero, cards, calculator component CSS.
`assets/js/main.js` — theme toggle injection, nav mega-menu injection, all 10 calculators' logic + canvas
draw routines.
`assets/js/manim-viz.js` — small dependency-free easing/tweening helper library (smooth parameter
interpolation instead of snapping on input change, "draw on first scroll into view" via
`IntersectionObserver`), loaded before `main.js`, used by `calculators.html`.

Every page's `<head>` has a duplicated inline theme-detection `<script>` (reads `localStorage.theme` /
`prefers-color-scheme`, sets `data-theme` on `<html>`) that must run before the stylesheet link, so it
can't be centralized into `main.js` — keep it duplicated when adding a new page.

## Design tokens (`assets/css/style.css`)

Theme is toggled via `document.documentElement.setAttribute('data-theme', 'dark'|'light')`; dark values
live under `:root[data-theme="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand-navy` / `--brand-cyan` / `--brand-blue` | fixed | (same) | Nav/footer/hero chrome + accents — don't invert |
| `--bg` / `--bg-card` | `#f8fafc` / `#ffffff` | `#0a1120` / `#131d31` | Page background / card surfaces |
| `--text` / `--text-muted` | `#0f172a` / `#64748b` | `#e7edf6` / `#94a3b8` | Body text |
| `--border` | `#e2e8f0` | `#223049` | Card/table borders |
| `--heading-accent` | `var(--brand-navy)` | `#7dd3fc` | Headings/result values on `--bg-card` (navy is unreadable on a dark card) |
| `--surface-canvas` / `--surface-screen` | `#ffffff` / `#edf6ff` | `#eef2f7` / `#dbe8f7` | Backing for `<canvas>`/inline-SVG diagrams — **stays light in both themes**, see below |
| `--pastel-{blue,green,purple,orange}-{bg,border,text}` | light pastel | translucent-on-dark + light text | Callouts, tags, chips, tinted cells — inverts with theme |

**Rule of thumb for new colored UI**: if the text on a background already uses a themed
`var(--text*)`/`var(--brand-*)` token, the background should invert too (`--bg`, `--bg-card`, or a
`--pastel-*` token). If the element hosts fixed-color canvas/SVG/KaTeX content, keep the background on
`--surface-canvas`/`--surface-screen` and never give it a themed text color — those draw hardcoded
dark-on-light colors (JS `ctx.fillStyle`, inline SVG `fill=`/`stroke=`, KaTeX `currentColor`), so only the
*container* needs to stay a safe paper tone; trying to invert the drawn pixels isn't worth it.

## Theme toggle & navigation

- The toggle button (`.theme-toggle`, sun/moon SVG) and the Theory nav item's four-group mega-menu (Wave
  Foundations / Interfaces & Frequency / Inspection & Imaging / Advanced Topics, opens on hover/focus,
  chevron toggle on mobile) are both injected into every page's `.nav` at runtime by `main.js` — not
  hand-authored per page.
- Persistence: the toggle click handler sets `localStorage.theme` and flips `data-theme`; if the user has
  never toggled, the site follows `prefers-color-scheme` live via a media-query listener.
- On mobile (≤768px), `.nav` padding/gap tighten and `.nav-brand .sub` ("Purdue NDT Lab") hides to keep
  brand + toggle + hamburger from overflowing 375–390px viewports.

## Section design pattern: blended, alternating-tone bands (no boxed cards)

Every major page section (`theory.html`'s `.theory-section`, `signal-processing.html`'s `.sp-block`,
`calculators.html`'s `.calc-box`) intentionally does **not** look like a bordered/shadowed white card. Each
uses the same full-bleed technique, scoped in that page's own `<style>` block:

```css
.theory-section {
  padding: 3rem 2rem;
  background: var(--bg);
  box-shadow: 0 0 0 100vmax var(--bg);   /* paints out to the viewport edges */
  clip-path: inset(0 -100vmax);          /* ...without bleeding into the next section vertically */
}
.theory-section.theory-section-b { background: var(--bg-card); box-shadow: 0 0 0 100vmax var(--bg-card); }
```

Adjacent sections alternate the `-b` modifier class so neighboring topics stay visually distinct through a
tone shift alone — no border, no shadow, no gap between them. This is preferred over the classic
`width:100vw; margin-left:-50vw` breakout because it doesn't fight scrollbar-width/`vw` mismatches.

**The alternation must follow actual DOM/render order, not just source order.** `theory.html` has a script
that relocates a couple of sections at runtime — `#acoustic-impedance` moves to sit right after
`#elastic-wave-types`, and `#ultrasound-spectrum` moves to sit right after `#wave-generation` (both moved so
the detailed section stays a single DOM node instead of being duplicated for two different topic flows) —
which shifts which sections end up adjacent on the page. When adding/reordering `.theory-section` elements,
verify the live alternation in a browser (`document.querySelectorAll('.theory-content > *')` and check each
element's rendered `top`), not just by reading the HTML source top-to-bottom.

Within a section, a further layer of this same pattern nests smaller alternating-tint sub-bands (see
`.wave-band-list` / `.wave-band` / `.wave-band-tag-*` in `theory.html`, reused for both `#elastic-wave-types`
and `#wave-generation`) using the `--pastel-{blue,purple,green}-{bg,text}` tokens — a `margin: … -2rem …`
bleed that must match its parent `.theory-section`'s own horizontal padding (`2rem`) or it clips at narrow
viewports.

Nested functional components (calculator result chips, data tables, callouts, canvas/SVG diagram frames)
intentionally keep their own bounded box styling — the "no boxed cards" rule applies to the top-level
content-section wrapper, not to every UI element.

## Canvas animation conventions

Nearly every `<canvas>` on the site is hand-drawn via `requestAnimationFrame` loops (no charting library).
Recurring patterns worth reusing rather than reinventing:

- **HiDPI setup**: multiply both canvas `width`/`height` attributes by `Math.min(devicePixelRatio, 2)`,
  then `ctx.scale(dpr, dpr)` — CSS `width:100%; height:auto` still scales it responsively since only the
  aspect ratio (not the absolute attribute values) drives that. `main.js`'s calculator canvases use an
  equivalent `_setupHiDPICanvas()` helper.
- **Theme-aware canvas palettes**: canvases that sit directly on a themed/tinted background (not a fixed
  "paper" surface) read their colors from CSS custom properties via `getComputedStyle`, cached and
  refreshed through a `MutationObserver` on `document.documentElement`'s `data-theme` attribute — see the
  `refreshPalette()` pattern repeated across `theory.html`'s inline scripts.
- **Fixed-light "paper" surfaces**: diagrams whose JS/SVG hardcodes dark-on-light drawing colors (most of
  `signal-processing.html`'s and `calculators.html`'s canvases, most static SVGs) instead keep a constant
  light backing via `--surface-canvas`/`--surface-screen`. Don't try to theme these; only their container
  background should ever change.
- **Isometric particle-lattice rendering** (`theory.html`'s `#elastic-wave-types` canvases): a small
  reusable projection `project(ox, oy, tile, x, y, z) = { x: ox + (x - z)*tile*cos30, y: oy + (x + z)*tile*sin30 + y*tile*0.85 }`
  plus a `bbox()` auto-fit/centering helper, used to draw a translucent 3-box "sample" (top/right/front
  faces) with an animated particle grid inside it. This 3D treatment was **deliberately reverted** for the
  `#wave-generation` section after feedback that isometric ray diagrams were confusing — that section now
  uses plain 2D pixel-space rays (see its own inline script) even though it sits right below the 3D
  `#elastic-wave-types` section. Don't unify these two back into one 3D style without being asked.
- **Canonical ultrasound pulse shape** (`drawPulse(cx, h, col)`, repeated in several `theory.html` IIFEs — a
  3-cycle Gaussian-windowed `|cos|` burst):
  ```javascript
  function drawPulse(cx, h, col) {
    var sig = 10, period = 7;   // sig = envelope width (px); period ⇒ ~3 cycles across ±35px
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
    for (var x = cx - 35; x <= cx + 35; x++) {
      var d = x - cx;
      var env = Math.exp(-(d*d) / (2*sig*sig));
      var y = BL - h * env * Math.abs(Math.cos(2*Math.PI*d / period));
      if (x === cx - 35) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ```
- `signal-processing.html`'s spectrogram uses a custom `heatColor(v)` colormap (white background version:
  `v=0` → white, `v=0.2` → light yellow, `v=0.45` → orange, `v=0.7` → red, `v=1` → dark maroon) rather than
  a library colormap — extend its four `if (v < …)` bands rather than introducing a dependency.
- All 13 `eq-box` equation elements in `theory.html` use KaTeX (`$$...$$` syntax, CDN-loaded with
  auto-render in `<head>`).

## Calculators

All 10 calculators in `calculators.html` are initialized by direct function calls at the bottom of
`<body>` (not a `DOMContentLoaded` listener) and each pairs an input form (`.calc-inputs`, `width: min(360px, 42%)`,
`.calc-inputs-wide` variant uses 44% for Water Path's extra field) with a live canvas visualization at a
fixed aspect ratio (`.calc-viz`/`.calc-visual`, `aspect-ratio: 2/1`, `object-fit: contain` so the drawing's
logical coordinates aren't distorted). Both stack to a single column at `max-width: 720px`.

| Calculator | Inputs | Result ID | Canvas ID (size) | JS function |
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

Shared `main.js` helpers: `fmt(val, sig=4)` (format to significant figures, returns `'—'` for non-finite),
`_rRect(ctx,x,y,w,h,r)` (compat rounded rect), `_arrow(ctx,x1,y1,x2,y2,hs=7)`.

Water path formula: `WP = f − mp × (cs / cw)` where `f` = focal length (mm), `mp` = desired focus depth in
material (mm), `cs` = wave speed in material (m/s), `cw` = wave speed in water (m/s, default 1495).

## `theory.html` section map

Anchored IDs, in rendered order (after the runtime relocation noted above). Use these to jump directly to
a section with `grep -n 'id="…"' theory.html` rather than scrolling a 5000-line file:

Student flow: `#wave-types` → `#speed-comparison` → `#applications` → `#elastic-wave-types` →
`#acoustic-impedance` → `#wave-generation` → `#ultrasound-spectrum` → `#ut-principle` → `#material-props` →
`#generating-ultrasound` → `#a-scan` → `#b-scan` → `#c-scan`.

Advanced topics (after an `#advanced-topics` divider): `#attenuation` → `#beam-physics` → `#snell` →
`#phased-arrays` → `#calibration` → `#pulser-receiver` → `#tofd` → `#weld-inspection`.

## `resources.html` filter logic

`setFilter(type, btn)` + `applyFilters()` filter `.resource-item` elements by `data-type` attribute
(`textbook | paper | software | standard | online`) combined with a search query matched against each
item's `data-text` attribute and `innerText`.
