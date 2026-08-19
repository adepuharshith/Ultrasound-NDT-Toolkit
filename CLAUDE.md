# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A static, no-build educational website (Purdue NDT Lab) teaching ultrasonic/NDT (non-destructive testing)
theory: wave physics, signal processing, and interactive calculators. Pure HTML/CSS/vanilla JS — no
framework, no bundler, no package manager.

Remote: `https://github.com/adepuharshith/Ultrasound-NDT-Toolkit` (the repo was renamed from lowercase at
some point; GitHub redirects the old URL, but the local `origin` remote was repointed to the canonical one),
GitHub Pages at `https://adepuharshith.github.io/ultrasound-ndt-toolkit/` (not yet enabled in repo settings — Settings →
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

## Apple-derived design refinements

A few structural metrics were pulled from `apple.com`'s live computed styles (via headless Chrome, not
copied CSS files — see below) and folded into the shared token system where they fit the existing navy/cyan
brand rather than replacing it. Reference metrics pulled from Apple, for future comparison:

| Aspect | Apple's value | Applied here as |
|---|---|---|
| Motion easing | `cubic-bezier(0.4, 0, 0.6, 1)` (252 uses, their dominant curve) | `--ease` token in `style.css`, used in every hover/theme `transition` touched below |
| CTA button shape | `border-radius: 980px` (fully pill, ~34 uses) | `--radius` stays for cards; buttons/pills use `999px` (already the site's convention for chips/tags) |
| CTA button padding | `padding: 11px 21px` | left as the site's existing `.btn`/`.ctrl-btn`/etc. padding — close enough, not worth churning |
| Nav bar | `rgba(255,255,255,.8)` + `backdrop-filter: saturate(1.8) blur(20px)` | same `backdrop-filter: saturate(1.8) blur(20px)` value, tinted with the brand navy instead of white (see below) |
| Heading tracking | `letter-spacing: -0.374px` on 34px text (≈ ‑0.011em) | `h1 { letter-spacing: -.02em }`, `h2 { -.015em }` — proportionally similar tightening on Inter |
| Text color | `#1d1d1f` (neutral near-black) | **not adopted for the hue** — `--text: #0f172a` (slate-tinted) stays the brand color, not Apple's neutral gray. But most body copy was actually rendering in `--text-muted` (`#64748b`), not `--text`, sitewide — see below. |
| Font family | `"SF Pro Text"/"SF Pro Display"` | **adopted via system-font stack**: `--font` now leads with `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text'` before falling back to `'Inter', system-ui, sans-serif`. Apple/Safari/Chrome-on-macOS/iOS visitors get real San Francisco (no webfont hosting/licensing needed — it resolves to the OS's installed system font); everyone else falls back to Inter, which is visually close enough that the fallback doesn't read as a downgrade. Reverses the earlier "not adopted" call in this table. |

**Body-text contrast fix (post-Apple-pass correction):** a global `p { color: var(--text-muted); }` rule in
`style.css`, plus per-component copies of the same pattern (`.theory-section p`, `.compare-table td`,
`.wave-band-info p`, `.mp-info p`, `.app-card li`, `.about-section p`, `.research-item p`, `.ack-item p`,
`.sp-block p`, `.step-text`, `.mat-table td`, `.calc-desc`, and a couple of inline-styled intro `<p>`s in
calculators.html), had every primary reading paragraph/list/table-cell sitewide rendering in the muted gray
token (`#64748b` light / `#94a3b8` dark) instead of the near-black/near-white `--text` token — making the
whole site read as washed-out. All of those were repointed to `var(--text)`; `.callout` (theory.html's "NDE
example" asides) got the same fix since its content is substantive worked examples, not decoration. Genuine
secondary chrome was deliberately left on `--text-muted` — unit suffixes, formula-box notes, nav/filter pill
labels, section-divider eyebrow text, sidebar headers, `.svg-caption` diagram captions, and small one-line
hints under a single input — since flattening literally everything to `--text` would erase the hierarchy
between primary content and UI micro-copy. The one place `--text-muted`/a light literal color is *required*
for contrast (`.hero`, `.pathways`, `.page-header`, `.footer`, `.transducer-link-card` — all dark/navy
backgrounds) was left alone; `.footer p` needed an explicit `color: #94a3b8` added because the new global `p`
rule would otherwise have overridden its inherited light color and put near-black text on the navy footer.
**Any new component with a bare `<p>` on a dark/colored background must set its own `p` color explicitly** —
the global default is now dark-on-light, not inherited-light.

Where it was applied:
- **`.nav`** (main nav, `style.css`) and **`.sec-nav`** (theory.html's/signal-processing.html's sticky
  quick-jump bar) use frosted glass instead of a flat fill: translucent background + `backdrop-filter:
  saturate(1.8) blur(20px)` (with a `-webkit-backdrop-filter` fallback for Safari). `.nav` tints
  `rgba(var(--brand-navy-rgb), .95)` to keep the brand color; `.sec-nav` tints `rgba(var(--bg-card-rgb),
  .72)`. The `--bg-card-rgb`/`--brand-navy-rgb` tokens exist specifically so `rgba(var(--x-rgb), alpha)`
  works — a hex custom property can't be split into components for that. `.nav`'s tint opacity was
  originally `.82`, tuned up to `.95` after feedback that it rendered as a pale, desaturated blue-gray —
  at low opacity over a near-neutral light page background, `saturate(1.8)` has little colored backdrop
  content to boost, so the blend read as washed-out rather than a confident navy. `.95` reads as
  essentially solid brand navy (matching the hero/page-header gradient's own starting color) while still
  keeping a sliver of blur-through for scrolled content.
- **Pill buttons**: `.btn`/`.btn-primary`/`.btn-outline` (hero CTAs, `style.css`), `.ctrl-btn`
  (signal-processing.html's Animate/Reset controls), `.wave-demo-btn` (theory.html's canvas play/pause
  overlays), and `.profile-link` (about.html's contact links) all moved from small rounded-rect radii
  (5–8px) to `999px`. `.sec-nav-btn`/`.filter-btn`/`.theme-toggle`/`.pastel-*` chips were already pill —
  this just made the CTA buttons match the site's own existing chip convention, not a new idea imported
  wholesale from Apple.
- **`--ease`** replaces the implicit default `ease` in `--transition-theme` and in every transition touched
  above.

**Gotcha hit and fixed while applying this**: putting `backdrop-filter` directly on `.nav` broke the Theory
mega-menu (`.theory-dropdown`, `position: fixed`) — `backdrop-filter` (like `transform`/`filter`) makes its
element the *containing block* for `position: fixed`/`absolute` descendants, so the dropdown's
viewport-relative `top`/`left` math silently became wrong (invisible when closed, since `opacity:0`, but its
layout box now stuck out past the viewport and inflated `document.documentElement.scrollWidth`). Fixed by
moving the frosted background onto a `.nav::before` pseudo-element (`position:absolute; inset:0; z-index:-1`)
instead of styling `.nav` itself — `.nav` stays filter-free, so its `position: fixed` descendants keep using
the viewport as their containing block. **If you add `backdrop-filter`/`filter`/`transform` to any element
that has (or could gain) a `position: fixed` descendant, use this pseudo-element pattern rather than putting
it on the element directly.**

## Theme toggle & navigation

- The toggle button (`.theme-toggle`, sun/moon SVG) and the Theory nav item's four-group mega-menu (Wave
  Foundations / Interfaces & Frequency / Inspection & Imaging / Advanced Topics, opens on hover/focus,
  chevron toggle on mobile) are both injected into every page's `.nav` at runtime by `main.js` — not
  hand-authored per page.
- Persistence: the toggle click handler sets `localStorage.theme` and flips `data-theme`; if the user has
  never toggled, the site follows `prefers-color-scheme` live via a media-query listener.
- On mobile (≤768px), `.nav` padding/gap tighten to keep brand + toggle + hamburger from overflowing
  375–390px viewports.
- **`.nav-brand`** is hand-authored per page (`<a class="nav-brand">`, duplicated across all 7 HTML files
  the same way the theme-detection `<script>` is) and reads just **"Ultrasound NDT Toolkit"** — it used to
  be "US & NDT Toolkit" plus a `<span class="sub">Purdue NDT Lab</span>` subtitle; both the abbreviation
  and the subtitle were dropped per feedback, and the now-dead `.nav-brand span.sub` CSS (including its
  mobile `display:none` override) was removed along with it. Keep all 7 copies in sync if it changes again.
- **Gotcha**: `.nav-links` items are `<li><a>…</a></li>`, except the Theory item, which is
  `<li class="theory-menu"><a>…</a><button class="theory-menu-toggle">…</button><div class="theory-dropdown">…</div></li>`
  (built by `main.js`). Because `.theory-menu` is itself `display:flex`, its child `<a>` gets block-ified
  and its vertical padding counts toward line-box height; every other `<li>`'s `<a>` stays `display:inline`,
  where padding paints outside the line box without adding to it. That made the Theory `<li>`'s natural
  content height taller than its siblings, so `.nav-links`'s stretch made the *plain* `<a>`s sit higher
  within their (now-taller) row than the fully-padded Theory `<a>`, and it rendered visibly lower than
  "Home"/"Calculators"/etc. Fixed with `.nav-links { align-items: center }` plus `.nav-links li { display:
  flex; align-items: center }`, so every item centers its own content regardless of what else shares its
  `<li>`. **If a future nav item needs an inline sibling next to its link (icon, badge, chevron), give that
  `<li>` the same `display:flex; align-items:center` treatment** — it's already covered by the generic
  `.nav-links li` rule, so no special-casing needed, but keep this in mind if that generic rule ever gets
  narrowed to target only specific `<li>`s.

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

**The alternation must follow actual DOM/render order, not just source order.** `theory.html` used to have
a script that relocated a couple of sections at runtime to avoid duplicating content across two topic flows
— that script was removed when the content was reorganized (see the section map below), so render order and
source order are now identical. If you ever reintroduce any kind of runtime reordering, re-verify the live
alternation in a browser (`document.querySelectorAll('.theory-content > *')` and check each element's
rendered `top`) rather than trusting source order — that's the mistake this note originally existed to
prevent.

Within a section, a further layer of this same pattern nests smaller alternating-tint sub-bands (see
`.wave-band-list` / `.wave-band` / `.wave-band-tag-*` in `theory.html`, reused for both `#elastic-wave-types`
and `#wave-generation`) using the `--pastel-{blue,purple,green}-{bg,text}` tokens — a `margin: … -2rem …`
bleed that must match its parent `.theory-section`'s own horizontal padding (`2rem`) or it clips at narrow
viewports.

Nested functional components (calculator result chips, data tables, callouts, canvas/SVG diagram frames)
intentionally keep their own bounded box styling — the "no boxed cards" rule applies to the top-level
content-section wrapper, not to every UI element.

**Sub-headings** (`<h3>` inside a section) use `color: var(--heading-accent)`, matching `theory.html`'s
`.theory-section h3` rule exactly — `signal-processing.html`'s `.sp-block h3` was previously plain
`var(--text)` set per-instance via inline `style=""` (six separate copies) and has been consolidated into
one class rule. **Sub-sections are separated by whitespace alone** (the `h3`'s own top margin), not a
visible `<hr>` divider — `signal-processing.html` used to sprinkle `<hr class="sp-divider">` between every
named sub-topic; removed to match `theory.html`, which has never used inline dividers between its own `h3`
subsections within a `.theory-section`.

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
- **Canvas aspect ratio via CSS, not a hardcoded pixel height**: `signal-processing.html`'s `.canvas-box`
  sets `aspect-ratio` (default `2.35/1`; `.wide-box` for `2/1`; `.spectro-box` for `2.6/1`) and its
  `canvas { width:100%; height:100% }` — matching `calculators.html`'s `.calc-viz { aspect-ratio: 2/1 }`
  convention — instead of a `height="…"` canvas attribute paired with a magic-number `cssH` argument to
  the sizing helper. `initCanvas(el)` reads `el.offsetWidth`/`el.offsetHeight` (already resolved by the
  CSS aspect-ratio at layout time) rather than taking a height parameter. Keeps every plot a consistent,
  intentional shape instead of whatever a fixed pixel height happens to produce at the container's actual
  rendered width. In-canvas corner text (axis labels like "Amp"/"v(t)") was removed where it duplicated
  the HTML `.canvas-label` badge in the same top-left corner — dynamic/data-dependent labels (peak
  markers, per-pulse tags) that can land in that same corner depending on the data must actively avoid it
  (see the corner-detection clamp in `xcorr`'s `drawCorr`/`drawSignal`), since the label and the badge
  have no backing box and become mutually illegible if they overlap.
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
- `signal-processing.html`'s CWT spectrogram uses a custom `heatColor(v)` colormap — an **inferno**
  approximation (7 hand-picked anchor stops interpolated linearly: near-black at v=0, through deep
  purple/magenta/red-orange, to pale yellow at v=1), not a library colormap — extend the `INFERNO_STOPS`
  array rather than introducing a dependency. Unlike every other canvas on the site, this one paints a
  **black** background (`#000004`) instead of the usual light "paper" surface — inferno only reads
  correctly on dark ground — so its `.canvas-box` gets the `spectro-box` modifier class and its
  `.canvas-label` gets the `on-dark` modifier (light text) rather than the default dark-on-light label
  color. When filling a 2-D `ImageData` grid like this, compute each cell's start/end pixel with
  consecutive `Math.floor()`s (`px0=floor(t*W/N)`, `px1=floor((t+1)*W/N)`), not a fixed `round()`ed
  width per cell — the latter leaves 1px alpha=0 gaps between cells on non-integer `W/N` ratios, which
  render as a grid of thin stripes showing the container's background through the gaps.
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

Anchored IDs, in rendered order — this now **is** source order (the runtime section-relocation script was
removed when the content was reorganized into 4 logical groups; render order and HTML order match exactly).
Use these to jump directly to a section with `grep -n 'id="…"' theory.html` rather than scrolling a
5000-line file. The mega-menu groups in `main.js` and the `.sec-nav` quick-jump pills in `theory.html` both
mirror this same 4-group-plus-advanced structure — keep all three in sync if you reorder again.

1. **Wave Fundamentals**: `#wave-types` → `#speed-comparison` → `#applications`
2. **Elastic Waves & Interfaces**: `#elastic-wave-types` → `#wave-generation` → `#snell` →
   `#acoustic-impedance` (Snell's law lives here now, not in Advanced Topics — it was moved up to sit next
   to the other interface/refraction content instead of being a redundant, more-detailed repeat far down
   the page)
3. **Ultrasound NDT Fundamentals**: `#what-is-ultrasound` → `#ultrasound-spectrum` → `#ut-principle` →
   `#generating-ultrasound`
4. **Scanning & Material Evaluation**: `#a-scan` → `#b-scan` → `#c-scan` → `#material-props`

Advanced topics (after an `#advanced-topics` divider, minus Snell's law which moved up into group 2):
`#attenuation` → `#beam-physics` → `#phased-arrays` → `#calibration` → `#pulser-receiver` → `#tofd` →
`#weld-inspection`.

## `resources.html` filter logic

`setFilter(type, btn)` + `applyFilters()` filter `.resource-item` elements by `data-type` attribute
(`textbook | paper | software | standard | online`) combined with a search query matched against each
item's `data-text` attribute and `innerText`.
