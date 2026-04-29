# RCCG Jesus House Silicon Valley — Website

The redesign blueprint, brand system, and content for [rccgjhsv.org](https://www.rccgjhsv.org), the website of RCCG Jesus House Silicon Valley — a multicultural church in San Jose, California.

This repository is the single source of truth for the website's information architecture, visual identity, content inventory, and implementation plan. It does not yet contain the production site code; today's site runs on Wix and is being rebuilt against the specs documented here.

---

## What this site is built to do

RCCG Jesus House Silicon Valley already has a working website, a custom domain, and an active congregation. What it doesn't have is a digital front door that matches the warmth of a Sunday morning visit.

The redesign exists to serve one specific person: **a first-time visitor in the parking lot, tapping the address into Maps, who needs to know in five seconds what time service starts, what to expect, and where to park.** Every choice in this repository, from the typography to the URL structure, is a decision in service of that visitor.

The current site gets in their way. It loads six font families, hides every navigation link behind a hamburger menu (even on a 1920px monitor), asks visitors to choose between "Watch Live" and "New Here?" before they've decided to care, and buries service times 1,500px deep in the footer. It carries 5–8 MB of page weight, much of it a background hero video, and it's invisible in "church near me" searches because there's no Church schema markup or claimed Google Business Profile.

The new site replaces all of that with a single conversion goal — **Plan Your Visit** — and a persistent **Watch Live** button for returning members and remote viewers. Everything else is in service of those two actions.

---

## Design choices

Six commitments, in priority order. Every design decision is checked against these.

1. **Warmth beats polish.** A SaaS site optimizes for conversion; a church site optimizes for welcome. Choices that make the page feel "human hands made this" are kept; choices that make it feel "a growth team A/B tested this" are cut.
2. **Bold, not loud.** Confident typography, a strong accent color, and one distinctive motif (the arch) give the site presence. Glow, drop shadows, and gradient-on-everything do not.
3. **One voice, not six.** The current site runs six font families. The new site runs two. Sentence case throughout — even on buttons.
4. **Every element earns its place.** Decorative buttons, tiled patterns, and ornamental headlines come out. White space is rest, not absence.
5. **Designed for a Sunday morning phone.** Mobile-first, 4G-friendly, touch targets ≥ 44px. Nothing important hides below a fold.
6. **The arch is the soul.** One repeating shape — the rounded archway — frames photography and section dividers as the church's "front door" motif. Used with restraint so it signals us, not overwhelms.

### Visual system

| Token | Value | Role |
|---|---|---|
| Display font | DM Serif Display | H1, H2, pull quotes — 32px and up only |
| Body font | Manrope | Everything else: subheads, body, navigation, buttons, forms |
| Brand color | Sanctuary Plum `#4A1942` | Primary CTA, dark surfaces, footer |
| Accent | Coral Flame `#E85D3C` | Eyebrow labels, occasional emphasis (≤ 10% of surface area) |
| Background | Warm Parchment `#FAF6F0` | Page background — never harsh white |
| Text | Near Ink `#1C1A23` | Body type, with a slight plum undertone |
| Color ratio | 60 / 25 / 10 / 5 | Parchment & ink / Plum / Coral / Gold + other |

The full system — extended palette, type scale, spacing tokens, motion specs, responsive breakpoints, performance budget, and SEO foundations — lives in [`brand-guidelines/RCCG_JHSV_Style_Guide_v3.html`](brand-guidelines/RCCG_JHSV_Style_Guide_v3.html).

---

## Functionality choices

### Information architecture

Eight active pages, down from twenty:

| Page | URL | Purpose |
|---|---|---|
| Home | `/` | Single hero CTA, service times, Next Steps cards, pre-footer CTA |
| I'm New | `/new` | Remove every unknown for a first-time visitor |
| About | `/about` | Story, beliefs, leadership (absorbs former Leaders page), gallery |
| Sermons | `/sermons` | Phased — v1 links to YouTube; v2 is a YouTube Data API hub |
| Events | `/events` | Aggregated list and calendar |
| Give | `/give` | Online giving, ways to give, tax info |
| Watch Live | `/live` | YouTube Data API auto-detects live, upcoming, or latest |
| Contact | `/contact` | Form, map, prayer request |

Plus three support pages reachable from the footer (Ministries, Media Hub, and a global support layer for legal and privacy).

### Key functional decisions

- **Visible desktop navigation.** Horizontal nav bar with five links plus a persistent Watch Live button. The hamburger menu is for mobile only.
- **One hero, one CTA.** "Come as you are." → Plan Your Visit. No competing buttons.
- **Service times above the fold.** Surfaced on the homepage second scroll, not hidden in the footer.
- **Sermons phased to v2.** At launch, the Sermons nav link points directly to the church's YouTube channel. The full `/sermons` page with YouTube Data API integration ships in v2 once the channel has 12+ weeks of consistent uploads.
- **Watch Live is API-driven.** The `/live` page calls the YouTube Data API to surface the current broadcast — live, upcoming countdown, or latest past video — so the button never lands on a dead stream.
- **Compact footer.** Reduced from 1,529px to ~300px. A three-column reference card (contact, services, social), not a second navigation.
- **Performance budget.** LCP < 2.5s, CLS < 0.1, page weight < 2 MB. No background video. Two fonts only. Images as WebP under 300 KB.
- **SEO foundations.** Church JSON-LD schema on every page, an active Google Business Profile, and a branded `info@rccgjhsv.org` email replacing the current Gmail address.

The full sitemap — page blueprints, navigation architecture, CTA inventory, and stakeholder review — lives in [`brand-guidelines/RCCG_JHSV_Sitemap_v2.html`](brand-guidelines/RCCG_JHSV_Sitemap_v2.html).

---

## Repository structure

```
rccgjhsvwebsite/
├── README.md                                 ← you are here
├── brand-guidelines/
│   ├── RCCG_JHSV_Sitemap_v2.html             ← IA, page blueprints, nav architecture, implementation timeline
│   └── RCCG_JHSV_Style_Guide_v3.html         ← visual system: type, color, arch, spacing, motion, responsive, perf, SEO
├── content/
│   └── content.md                            ← copy outline: leadership roster, ministries, events, contact
└── website-tools/
    └── cinematic-sites-agent-kit-master.zip  ← optional toolkit for future motion modules
```

## Viewing the documents

Both reference documents are self-contained HTML files. They render in any modern browser when opened locally:

```bash
git clone https://github.com/cornerstone2d/rccgjhsvwebsite.git
cd rccgjhsvwebsite
python3 -m http.server 8000
# open http://localhost:8000/brand-guidelines/RCCG_JHSV_Style_Guide_v3.html
```

GitHub does not render `.html` files in the web UI — it shows source code. View them locally, or via a service such as raw.githack.com.

---

## Implementation status

| Phase | Scope | Status |
|---|---|---|
| 1. Foundation | Type, color, hero, GBP claim, Church schema, branded email | Planned |
| 2. Navigation & layout | Desktop nav, mobile menu, service cards, Next Steps row, footer | Planned |
| 3. Content & pages | Sermons → YouTube link, `/new` page, merge Leaders into About | Planned |
| 4. Mobile & iPad polish | Wix mobile editor pass, device testing, Google PageSpeed | Planned |
| 5. Ongoing | Weekly sermon publishing, Google reviews, Instagram and YouTube cadence | Planned |

Detailed task lists with priority and effort estimates are in the sitemap, §6 Implementation Timeline.

## Platform note

Today's site runs on Wix. Wix is functional but limits responsive control — the mobile editor requires manual configuration per element rather than reflowing automatically. The plan validates the content strategy on Wix first; platform migration (Squarespace, Webflow, or Subsplash) is reserved for the case where Phase 4's mobile pass hits walls in Wix's editor that workarounds can't solve.

## v1 launch scope

Seven built pages — Home, I'm New, About, Events, Give, Live, Contact — plus a Sermons nav link redirecting to YouTube and a Watch Live button powered by the YouTube Data API. The `/sermons`, `/ministries`, and `/media` hubs are deferred to v2, triggered once the YouTube channel has 12 consecutive weeks of uploads with clean metadata and weekly content operations have stabilized.

---

## Contact

- **Service times:** Sundays 10:30 AM · Wednesdays 7:00 PM
- **Address:** 474 Piercy Road, San Jose, CA 95138
- **Phone:** (925) 759-8930
- **Email:** rccgjhsv2013@gmail.com (migrating to info@rccgjhsv.org)
- **Website:** [rccgjhsv.org](https://www.rccgjhsv.org)

---

*Come as you are.*
