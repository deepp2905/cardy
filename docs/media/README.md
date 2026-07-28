# media

Screen recordings and stills for the case study drafts. See the shot list in
`../index.html` for framing, duration and zoom notes on each one.

Expected files:

| File | Shot | Length |
|---|---|---|
| `01-hero.mp4` / `.webm` | finished card → ship sequence, loops | 8–10s |
| `02-ship.mp4` / `.webm` | full wrap → seal → flip → drag-to-post | 12–14s |
| `03-deck.mp4` / `.webm` | deck drag, both sliders, slider retarget | 10–12s |
| `04-name.mp4` / `.webm` | type a name into the URL, card is engraved | 6–8s |
| `carousel-range.png` | seven explore mechanics, 7-up grid | — |
| `card-explorations.png` | playground card variants that didn't ship | — |

To wire one in, replace the placeholder block in the draft:

```html
<div class="media">
  <div class="media-empty">…</div>
</div>
```

with:

```html
<div class="media">
  <video autoplay muted loop playsinline poster="media/01-hero.jpg">
    <source src="media/01-hero.webm" type="video/webm">
    <source src="media/01-hero.mp4" type="video/mp4">
  </video>
</div>
```

Keep `muted` and `playsinline` — without both, mobile Safari refuses to
autoplay. `.media` already handles `object-fit` and the aspect ratio; add
`.tall` for the 4:5 crop that shot 04 uses.
