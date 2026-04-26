# Site draft — RCCG Jesus House Silicon Valley

Vanilla static site. No build step.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, who we are, service times, next steps, events strip, pastors, pre-footer CTA |
| `new.html` | I'm New — sticky-stack "What to Expect", families, getting here, connection card, FAQ |
| `about.html` | About — vision/mission, beliefs, leadership, department leads (16) |
| `events.html` | Events — weekly rhythms, yearly program, quarterly, upcoming placeholder |
| `give.html` | Give — online giving stub form, other ways, FAQ |
| `live.html` | Watch Live — stream embed slot, schedule, during-service actions |
| `contact.html` | Contact — form, contact card, map, prayer request |

## Cinematic modules used

Lifted from `website-tools/cinematic-sites-agent-kit-master.zip → cinematic-site-components/`:

1. **Spotlight Border Cards** (`spotlight-border`) — adapted in `styles.css` (`.spot-grid` / `.spot-card`) and wired in `scripts.js`. Used on Home (Next Steps), Events (Yearly Program), Give (Other Ways).
2. **Sticky Stack Narrative** (`sticky-stack`) — adapted in `styles.css` (`.stack` / `.stack-card` / `.stack-state`) and wired in `scripts.js`. Used on `/new` for "What to Expect".

Plus globally applied micro-interactions (from `cursor-reactive`):
- **Magnetic buttons** — any element with `data-magnetic` (primary CTAs).
- **Hover lift on cards** — style guide motion 250ms / 300ms.
- **Scroll reveal** — `.reveal` class via IntersectionObserver, respects `prefers-reduced-motion`.

## Photo manifest

Drop real JPEGs into `site/assets/photos/` with these filenames and the existing arch placeholders will render them automatically (a follow-up commit will swap the placeholder boxes for `<img>` tags once the photos arrive — current state is styled placeholder slots that show the expected filename).

| Filename | Where it appears | Style guide treatment |
|----------|------------------|------------------------|
| `pastors_portrait.jpg` | Home → "Led by a faithful team" | Arch frame (portrait) |
| `senior_pastors.jpg` | About → Leadership | Arch frame (portrait) |
| `sanctuary_sunday.jpg` | New → Sticky stack state 1 | Arch frame |
| `congregation_candid.jpg` | New → Sticky stack state 2 | Arch frame |
| `worship_band.jpg` | New → Sticky stack state 3 | Arch frame |
| `pastor_teaching.jpg` | New → Sticky stack state 4 | Arch frame |
| `kids_ministry.jpg` | New → For your kids | Arch frame |

Per the style guide: portrait photography goes in arch frames; landscape photography stays as rounded rectangles. No stock photos.

## Style guide compliance

- Two fonts only: DM Serif Display (32px+) + Manrope (everything else)
- DM Serif Display kept to display sizes only
- Sentence case throughout (eyebrows are uppercase per the spec)
- Pill buttons (`border-radius: 999px`), 48px min height
- `cubic-bezier(0.22, 1, 0.36, 1)` easing everywhere
- `prefers-reduced-motion` honored — durations drop to 0.01s
- WCAG AA contrast on every text-on-background pairing
- Color ratio holds at roughly 60% parchment / 25% plum / 10% coral / 5% other

## Known stubs / TODO

- All forms (`data-stub`) prevent default and just show a draft message — wire to real backends next.
- `/live` shows a YouTube channel link rather than a true live-status player. Production needs a YouTube Data API key and a server-side proxy (see sitemap section 7 for the spec).
- `/give` has a placeholder form — Tithe.ly / Pushpay / Stripe embed goes inline once chosen.
- Newsletter signup → not wired to any list yet.
- Photos are styled placeholder slots — swap to `<img>` tags once the assets land.

## Preview locally

Open any page in a browser. No server needed.

```bash
open site/index.html        # macOS
xdg-open site/index.html    # Linux
start site/index.html       # Windows
```

Or with any static server:

```bash
npx serve site
python3 -m http.server -d site 8080
```
