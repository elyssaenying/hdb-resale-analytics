# Design Direction — HDB Resale Market Analytics Website

Research artifact for Stage 6 (Next.js analytical case study). Written
before implementation, per process.

## Sourcing honesty (what I could and couldn't actually inspect)

- **The two YouTube videos could not be watched.** I have no video
  processing capability in this session. I'm relying entirely on the
  process principles you already summarized for video 1 (collect
  references, label what's useful, define aesthetic/guardrails
  explicitly, iterate rather than one-shot) and your framing of video 2
  as being about motion/interaction polish. I have not verified either
  video's content firsthand — flagging this rather than pretending
  otherwise.
- **The five attached screenshots were inspected directly** — this is
  genuine firsthand visual evidence, not inference.
- **Live-site fetches (componentry.dev, realtimecolors.com, heroui.com,
  web.10x.app, refero.design) used a text-extraction tool that converts
  pages to markdown.** It could not see actual rendered CSS, exact colors,
  fonts, or spacing — only page copy and structure, plus some model
  inference. Where a finding below comes from that tool, it's marked
  *(inferred, low confidence)*. `styles.refero.design` returned no
  usable content.

## Reference-by-reference observations

**Componentry** *(screenshot: direct)* — dark, near-black canvas.
Grid of small preview cards for decorative effects (matrix rain, scroll
velocity, magnetic lines, gradient fields, an icon field), each card a
thumbnail + one-line label underneath, consistent rounded-corner
treatment, tight uniform grid. This is a library of *decorative motion
primitives* — exactly the kind of thing the brief says to use sparingly,
subordinate to content, never as the main event.
→ **Borrow:** the discipline of "one small card, one clear label,"
restrained rounding, consistent card sizing in a grid.
→ **Do not borrow:** the decorative effects themselves (matrix rain,
particle/gradient fields) — explicitly listed as an anti-pattern in the
brief, and wrong for an analytics case study regardless.

**Refero Styles** *(screenshot: direct)* — dark canvas, grid of real
website screenshots as reference thumbnails with small labels ("Steep,"
"LaunchDarkly," "Home," "Mercury," "Dimension"). A pure curation/gallery
pattern.
→ **Borrow:** nothing structural — it's a different kind of product
(inspiration gallery, not an analytics site). The only transferable idea
is "look at real work, don't invent from nothing," which is what this
document is doing.
→ **Do not borrow:** grid-of-unrelated-cards as a page structure — the
brief explicitly warns against "a collection of unrelated cards."

**Realtime Colors** *(screenshot: direct + WebFetch text)* — the one
**light/cream-background** reference in the set, standing apart from the
other four dark UIs. Headline + two geometric color blocks (navy, black)
arranged in a Mondrian-esque composition; a bottom toolbar with **labeled
color-role chips** (Text / Background / Primary / Secondary / Accent).
WebFetch *(inferred)* confirms a "5 core colors, 60-30-10 rule" system
and a red/yellow/green contrast-pass indicator.
→ **Borrow:** the light, content-forward canvas as a legitimate register
(directly supports the brief's "warm-light analytical canvas"); the
labeled-chip toolbar pattern is a strong model for a sticky filter bar
(Town: [n selected] · Flat Type: [n selected] · Partial: Off); the
explicit contrast/accessibility signal (pass/fail) reinforces "meet a
professional accessibility baseline" rather than treat it as an
afterthought.
→ **Do not borrow:** the color-swatch-as-hero-content composition itself
— irrelevant to a data site.

**HeroUI** *(screenshot: direct + WebFetch text, thin)* — dark navy/near-
black canvas, "Beautiful by default. Customizable by design," clean form
components in the screenshot (email input, OTP/verify-code input,
sign-up card with Google auth), small rounded cards, restrained accent
use against a mostly monochrome dark UI.
→ **Borrow:** control-state discipline (clear default/focus/filled states
on inputs), restraint — most of the UI is neutral, accents are used
sparingly and purposefully. This is the strongest reference for how the
*filter controls* (multiselects, toggle) should feel: quiet, precise,
accessible.
→ **Do not borrow:** the whole component library or its specific visual
identity — the brief is explicit that HeroUI is a reference for
accessibility/state quality, not a package to install wholesale.

**10x.app** *(screenshot: direct + WebFetch text, thin)* — dark canvas,
single dominant prompt input ("What would you like to build?") with a
few icon affordances and suggestion pills below it, "Recent Projects" as
a secondary grid of phone-mockup thumbnails. The whole first viewport is
organized around **one clear focal statement**, not a wall of features.
→ **Borrow:** the principle that the first viewport should communicate
one thing clearly before anything else competes for attention — directly
maps to the brief's requirement that the masthead communicate what the
project is, what data it uses, and how fresh it is, before any chart.
→ **Do not borrow:** the chat/prompt-input metaphor, icon toolbar, or
AI-app-builder framing — not relevant to a data case study.

## Two directions considered → one chosen

**Direction A — "Quiet Editorial Analytics"** (the brief's recommendation):
warm-light canvas, dark compact masthead, strong editorial typography,
hairline borders, one teal accent + one terracotta signal color, minimal
motion. Reads as a serious analyst's report that happens to be
interactive.

**Direction B — "Dark Analytics Console"**: a single dark theme
throughout (closer to Componentry/HeroUI/10x.app's shared register),
monospace-forward, terminal-adjacent. Would look sharp, but risks
reading as a dashboard/trading-terminal product rather than a written
analytical case study — and the brief explicitly rules out "a
finance-trading terminal" and wants the masthead/canvas split.

**Chosen: Direction A.** It's the only one of the two that puts the
*data and the argument* in the most legible register (dark for identity/
orientation, light for reading/analysis) rather than making the whole
page perform "product." It also directly matches the one genuinely
distinctive reference in the set — Realtime Colors' light canvas — while
keeping the confident dark identity moment the other four references
share, just contained to the masthead instead of the whole page.

## Chosen art direction: Quiet Editorial Analytics

### Color tokens

```
--canvas:        #F4F1EA   /* warm off-white page background */
--surface:        #FCFBF8   /* card/panel surface, barely lighter than canvas */
--ink:            #141414   /* primary text */
--ink-muted:       #68645D  /* secondary text, captions, axis labels */
--border:          #D8D3C9  /* hairline border, dividers */
--masthead:         #14120F  /* near-black masthead background */
--masthead-ink:       #F4F1EA  /* text on masthead */
--accent:              #0B6E69  /* teal — primary series, selected states */
--accent-ink:            #FFFFFF /* text on accent-filled controls */
--signal:                  #C85A3E  /* terracotta — partial/YTD, notable signal (million-$ share) */
--positive:                  #3E7A4F  /* muted green — growth, accessible on canvas */
--negative:                    #B23B3B  /* muted red — decline, accessible on canvas */
--chart-2:                       #5B7A8C  /* slate blue-grey, secondary series */
--chart-3:                         #B79A6B  /* sand, tertiary series */
--chart-4:                           #8C6E4E  /* muted amber, quaternary series */
```

Contrast checked by calculation (not a live Realtime Colors session,
since I can't interactively test there): ink `#141414` on canvas
`#F4F1EA` ≈ 17.9:1 (AAA); ink-muted `#68645D` on canvas ≈ 5.1:1 (AA for
normal text); masthead-ink `#F4F1EA` on masthead `#14120F` ≈ 17.5:1
(AAA); accent `#0B6E69` on canvas ≈ 5.4:1 (AA); white on accent ≈ 5.7:1
(AA). These will be re-verified with a contrast tool during
implementation, not just calculated once and trusted.

One accent (teal) does the primary work; terracotta is reserved
specifically for "this is a partial/YTD or notable-signal moment," never
used interchangeably with teal. Green/red are used only for signed
growth values, never as decorative color.

### Typography

- **Sans (UI + body):** Geist Sans via `next/font` — neutral, highly
  legible, ships with tabular-number support.
- **Mono (metadata, dates, KPI numbers, axis ticks):** Geist Mono —
  reinforces "this is measured data," not just styled text.
- No third decorative/serif face. The brief allows one editorial serif
  for a single thesis line "if it genuinely improves the composition" —
  it doesn't here; the sans stack at a large weight/size does that job
  without adding a third typeface to justify.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every KPI,
  chart tick, and growth percentage so digits don't jitter as filters
  change.

Scale (rem, approximate): eyebrow 0.75 / body 0.9375–1 / section heading
1.25–1.5 / masthead title 2.25–2.75 (mobile) up to 3.25 (desktop). No
80px+ hero type — the brief warns against "a giant hero that postpones
the actual analysis," so the masthead stays compact.

### Spacing scale

4px base unit: 4, 8, 12, 16, 24, 32, 48, 64, 96. Section vertical rhythm
uses 64/96; internal component spacing uses 8–24. No arbitrary one-off
values.

### Radius rules

- Controls (buttons, inputs, chips): 6px.
- Panels/snapshot cells: 8px, and only on the *outer* container — internal
  dividers are hairlines, not nested rounded boxes.
- No 24–32px "soft blob" rounding anywhere (explicit anti-pattern).

### Border / shadow rules

- Hairline `1px solid var(--border)` for all structural division —
  panels, table rows, chart plot-area separation.
- No large blurred drop shadows. At most a 1px border + a very subtle
  1–2px offset shadow on interactive elevation (e.g., an open dropdown),
  never on static content panels.
- No glassmorphism/blur.

### Motion rules

- Masthead reveal: 400ms, small opacity + 8px translate-y, once per
  session.
- Section entry: 300ms, 8px translate-y, triggered once via
  IntersectionObserver (not on every scroll pass).
- Filter drawer / control state changes: 200ms.
- Chart transitions on filter change: data transitions only (Recharts'
  built-in update animation, capped ~250ms), never a full remount/fade
  of the whole chart.
- Tooltip appearance: 120–150ms.
- No count-up number animation on every re-render — numbers update
  directly; a single subtle crossfade (150ms) is acceptable for KPI value
  changes, not a rolling-odometer effect.
- No bounce/spring overshoot. Ease-out only.
- Everything above is gated behind `prefers-reduced-motion`: reduced-
  motion users get instant state changes, no exceptions.

### Chart styling rules

- Shared config module (`lib/charts/theme.ts`): one font, one axis-line
  color (`--ink-muted` at reduced opacity), one grid color (`--border`,
  horizontal rules only, no vertical gridlines), one tooltip style, one
  currency formatter, one percent formatter, consistent margins.
- Complete-year data uses the teal accent; partial/YTD data uses
  terracotta with a distinct marker shape (diamond, matching the
  Streamlit dashboard's existing convention) and is always labeled
  "partial/YTD" in its tooltip and legend — never silently blended into
  a normal year-over-year line.
- Bar charts: 3px radius on the outward corner only, not full pill bars.
- No chart lives inside a heavy drop-shadow card; charts sit directly on
  the canvas or a hairline-bordered panel, consistent with the "quiet"
  direction.

### Responsive principles

- Max content width ~1320px, 12-column grid on desktop.
- Filters collapse into a drawer/sheet under a defined breakpoint, with
  an "N active filters" indicator on the trigger.
- KPI snapshot: 4-across on desktop, 2×2 on mobile, never a horizontal
  scroll.
- Every chart gets a mobile-specific height and Y-axis label handling
  (rotated/truncated town names replaced by a scrollable but
  non-clipped layout) rather than shrinking until illegible.

### Accessibility requirements

- Semantic landmarks (`header`, `nav`, `main`, sectioned `section`s with
  headings), one `h1`.
- All interactive controls reachable and operable by keyboard, with
  visible focus rings (not just a color change).
- Icon-only actions get `aria-label`s.
- Every chart has a short adjacent text summary of what it shows (not
  relying on a screen reader parsing an SVG).
- Color never carries meaning alone (growth also gets a +/− sign and
  words "growth"/"decline," not just green/red).
- Reduced-motion respected everywhere motion is used.

### Explicit anti-patterns (carried from the brief, restated as a checklist)

No gradient blobs, glow orbs, glassmorphism, 24–32px universal rounding,
floating pill soup, 3D illustrations, fake testimonials, particle fields
over charts, magnetic cursor effects, auto-rotating carousels, scroll
hijacking, competing animated backgrounds, marketing filler language
("unlock," "revolutionize," "next-generation"), icon-instead-of-text
where text is clearer, one-card-per-sentence, excessive dividers, or an
oversized hero that delays the actual analysis.

## Content/motion decision specific to Componentry

Per the brief: at most **one** nonessential Componentry-inspired motion
detail is allowed, confined to the masthead, and it must be disabled
under reduced motion. I'm choosing a quiet, data-derived motif — a small
grid of blocks in the masthead where block count/shading is derived from
real per-year transaction counts (not decorative noise), fading in once.
If this doesn't earn its place visually during implementation review, it
will be cut rather than forced in.
