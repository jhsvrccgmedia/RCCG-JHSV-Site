# Pending Action Items

Things parked for later so we can keep moving on bigger pieces.

## Logo

The site currently uses a small CSS-drawn arch mark in the header (`.brand .mark` in `site/partials/header.html`) plus the wordmark "Jesus House SV" alongside it. When the real logo file is ready:

- **Best:** drop an SVG at `site/assets/logo.svg` and we'll wire it up.
- **Acceptable:** a 2x PNG with transparent background — 200x200 if it's a square symbol, 600x200 if it's a horizontal lockup with the wordmark. Trim the canvas tight to the logo edges.
- **Header rendering size:** ~34px tall.
- If the logo is a horizontal lockup that already includes the words "Jesus House SV", we'll drop the standalone wordmark from the header so it doesn't compete.

Sizes worth keeping on hand for later:

| Use | Size | Format |
|---|---|---|
| Header / footer | as above | SVG > PNG |
| Favicon (browser tab) | 512x512 | PNG (we'll generate smaller derivatives) |
| Open Graph share preview | 1200x630 | JPG or PNG |

## Cinematic Modules to add

Two modules from `website-tools/cinematic-sites-agent-kit-master/cinematic-site-components/` that fit the brand and solve real gaps. Both are scoped for the About page (currently the lightest page on visual interest).

### 1. Odometer Counter (`odometer.html`)

- **Where:** About page, as a stats band somewhere in the Our Story / Mission flow.
- **Concept:** mechanical rolling-digit counters revealing four ground-truth facts. Example: *12 Years &middot; 48 Nations &middot; 600+ Sundays &middot; 1 Family*. Numbers to be confirmed.
- **Why:** mechanical numerals feel reverent and timeless, not gimmicky. Plays once on scroll-into-view, then silent.

### 2. SVG Draw (`svg-draw.html`)

- **Where:** as an arch divider that animates between major sections (About hero to story, Home pastors to upcoming events, I'm New hero to sticky stack).
- **Concept:** a single-stroke arch outline draws itself across the page width as the user scrolls past. Plum stroke, low contrast.
- **Why:** the brand principle says "the arch is the soul." Making the arch literally draw itself onto the page elevates a static motif into a quiet narrative element. Also gives section transitions a real beat instead of relying on background-color shifts.

### Alternative if we want something more functional later

**Accordion Slider** (`accordion-slider.html`) for the About page Departments section. The 16 director roles are currently a flat grid; an accordion lets each panel expand on hover/click to show the lead and assistants. Solves the wall-of-names problem and rewards exploration.

## Live Google Calendar feed (Events page "Upcoming" section)

The 4 highlighted upcoming events on `/events` are currently hand-curated placeholders. To make them update automatically from the church's public Google Calendar (`rccgjhsv2013@gmail.com`):

**Why we can't just fetch the ICS directly.** Google's ICS endpoint (`calendar.google.com/calendar/ical/.../public/basic.ics`) does not return CORS headers, so a browser fetch from the static site is blocked.

**The clean path:** use the Google Calendar Data API. It supports CORS so the browser can fetch events directly with an API key restricted by HTTP referrer.

**Setup steps:**

1. In Google Cloud Console, create a project (or reuse the one you'll use for YouTube live detection).
2. Enable the **Calendar API**.
3. Create an **API key**. Under restrictions:
   - **Application restrictions:** HTTP referrer. Add `https://rccgjhsv.org/*` and `https://*.vercel.app/*` (or whatever final domain).
   - **API restrictions:** restrict to Calendar API only.
4. Drop the key in `site/scripts.js` as a constant or pass via a script tag (`<script>window.JHSV_CAL_API_KEY = "..."</script>`).
5. Add a fetcher that runs on the `/events` page only, calls:

   ```
   GET https://www.googleapis.com/calendar/v3/calendars/rccgjhsv2013%40gmail.com/events
       ?key=API_KEY
       &timeMin=NOW
       &maxResults=4
       &singleEvents=true
       &orderBy=startTime
   ```

   parses the response, and replaces the contents of `#upcomingGrid` with rendered `.upcoming-event` cards.

6. The same call returns `summary`, `description`, `start.dateTime`, `end.dateTime`, `location`, and `htmlLink` for each event. The "Add to calendar" link uses `htmlLink` (Google's add-to-calendar URL).

**Cost:** Calendar API is free up to 1M queries/day. Cache the response in localStorage for ~10 min to be polite.

## Multi-app map picker (Get Directions)

When the "Get Directions" button is tapped on iPhone, we'd like a small picker offering Google Maps, Apple Maps, and Waze.

- **Does this need an external API?** No. Each map app has its own URL scheme (`maps.apple.com/...`, `https://waze.com/ul?...`, `https://maps.app.goo.gl/...`), so a small JS dropdown can deep-link to the right app without any server work.
- **Implementation sketch:** a small inline menu that opens on click of the directions CTA, with three links. Closes on outside click. About 30 lines of JS plus 30 of CSS. Feature-gated to mobile if we want, otherwise show on all viewports.

Build this when we want to upgrade the directions experience past the single-link version that's there today.
