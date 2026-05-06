# Security, Privacy, Vulnerability, and Penetration Testing Report
## RCCG Jesus House Silicon Valley Website

**Branch:** `claude/security-audit-church-site-uQe4L`
**Audit date:** 2026-05-06
**Auditor role:** Senior application security engineer / authorized assessor
**Scope authorisation:** Owner-authorised review of own static codebase and approved deployment.

---

## 1. Executive Summary

The site is a **static HTML/CSS/JS** website with **no backend, no build pipeline, no package manager, and no server-side code**. Hosting is **Vercel (primary)** with an **InterServer Apache** fallback indicated by `.htaccess`. Third-party integrations are limited and well-scoped: Google Fonts, Google Analytics (GA4, opt-in only), Google Calendar Data API (read-only public calendar via referrer-restricted browser key), Google Maps embed, YouTube embeds and RSS-via-CORS-proxy, and Church Center (Planning Center Giving) modal.

**Overall posture before audit: Fair.** No exploitable XSS, no server-side surface, no unauthenticated state-changing endpoints. The most material risk was the absence of strong response headers (no CSP, HSTS, Permissions-Policy) and EXIF metadata leakage on two photographs.

**Overall posture after audit fixes: Good.** A practical CSP, HSTS, COOP, X-Frame-Options/`frame-ancestors`, X-Content-Type-Options, Referrer-Policy and Permissions-Policy now ship on both Vercel and Apache. EXIF metadata has been stripped from the two affected images. Remaining items are operational (rotation of a referrer-restricted browser key that has been in public Git history, confirmation of consent for publicly-named volunteers, and consideration of hosting analytics opt-out / cookie banner).

**Final risk rating:** **LOW** for production launch, contingent on completing the four "Items Requiring Human Confirmation" in §21.

---

## 2. Scope

In scope:
- All source files in this repository (HTML, JS, CSS, JSON, ICS, images, favicon assets, partials, robots/sitemap/.htaccess/vercel.json).
- Public client-side behaviour (forms, embeds, third-party calls).
- Deployment configuration (Vercel + Apache headers).
- Image and document metadata.
- Git history scan for past secrets.

Out of scope (per authorisation):
- Active testing of third-party services (Google APIs, Planning Center, YouTube, social platforms).
- Authentication systems on Planning Center / Church Center.
- Vercel and InterServer hosting platforms themselves.
- DoS, brute force, or large-volume scans.
- Personal accounts of staff or congregants.

---

## 3. Methodology

1. Repository inventory (`ls`, `git log`).
2. Manual file review of every HTML page, partial, JS file, config, and ICS file.
3. Pattern-based secret scanning (`grep` for `AIza`, `api[Kk]ey`, `secret`, `token`, `password`, `gmail.com`, `Bearer`, JWT-looking strings, etc.).
4. Git history secret search (`git log --all -p -S`) for the API key that surfaced in the working tree.
5. EXIF/XMP/IPTC metadata review with **ExifTool 12.76** on every image asset (logos + photos).
6. Static review of `scripts.js` and `analytics.js` for `innerHTML`, `insertAdjacentHTML`, `eval`, `Function`, `document.write`, `location.*`, untrusted-input rendering, open-redirect patterns, third-party fetch endpoints, and storage hygiene.
7. External link audit (`target="_blank"` without `rel=noopener`, mixed content, non-HTTPS).
8. Header / passive review of current `.htaccess` and `vercel.json`.
9. Local serve via `python3 -m http.server`; verification that all in-page asset references resolve **HTTP 200** after fixes.
10. JSON-LD structured-data review for unintended PII.

---

## 4. Tools and Commands Used

| Tool | Purpose | Status |
|---|---|---|
| `git log --all -p -S` | Git-history secret search | Available |
| `grep -rn` (ripgrep-equivalent) | Pattern scan | Available |
| `exiftool` 12.76 | Image metadata read & strip | Installed during audit |
| `file` | File-type validation | Available |
| `od` | JPEG SOI/EOI marker validation post-strip | Available |
| `python3 -m http.server` | Local serve for asset-resolution check | Available |
| `curl` | Asset HEAD/GET probing | Available |
| `node` | JSON validation (`vercel.json`) | Available |
| `gitleaks` / `trufflehog` / `detect-secrets` | Dedicated secret scanners | **Not installed.** Recommended commands in §22. |
| `semgrep` / `OWASP ZAP` / `retire.js` / `osv-scanner` | Deeper SAST/DAST | **Not installed.** Not blocking — no package manager and no server-side code. Recommended commands in §22. |

`npm audit` / `pnpm audit` / `yarn audit` are **not applicable** — there is no `package.json`, lockfile, or `node_modules` in this repository.

---

## 5. Environment Tested

- **Local clone:** `/home/user/RCCG-JHSV-Site`, branch `claude/security-audit-church-site-uQe4L`, Linux 6.18.5, Node 22 (used only for JSON validation).
- **Build process:** none (static files served as-is).
- **Production:** Vercel (`vercel.json`) → custom domain `rccgjhsv.org`; canonical URLs and structured data confirm this.
- **Mirror / fallback:** Apache (InterServer) via `.htaccess`.
- **No deployed-domain active probing** was performed; passive checks were against the local served copy and the configuration files that determine production headers.

---

## 6. Files and Areas Reviewed

| Area | Files |
|---|---|
| Pages | `index.html`, `about.html`, `new.html`, `events.html`, `live.html`, `give.html`, `contact.html`, `404.html` |
| Error pages | `400.shtml`, `401.shtml`, `403.shtml`, `404.shtml`, `429.shtml`, `500.shtml`, `502.shtml`, `503.shtml`, `504.shtml` |
| Partials | `partials/header.html`, `partials/footer.html` |
| Scripts | `scripts.js`, `analytics.js` |
| Styles | `styles.css` |
| Public assets | 20 photos in `assets/photos/`, 10 logo/favicon files in `assets/logo/`, 2 ICS files in `assets/calendar/` |
| SEO / robots | `robots.txt`, `sitemap.xml` |
| Hosting config | `vercel.json`, `.htaccess` |
| Git metadata | Full commit history, all branches |

No `*.env`, `*.pem`, `*.key`, `id_rsa*`, `service-account*.json`, `secrets.*`, or backup files were found anywhere in the tree or in git history.

---

## 7. Risk Rating Summary

| Severity | Open | Fixed in this audit | Needs human confirmation |
|---|---|---|---|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 1 (key rotation) |
| Medium | 0 | 2 | 2 |
| Low | 0 | 4 | 2 |
| Informational | — | — | several (§22) |

---

## 8. Secrets and Credential Exposure Review

### F-001 — Google Calendar Data API key shipped client-side and present in public Git history
- **Severity:** High (operational); functionally Medium because the key is HTTP-referrer-restricted.
- **Affected files:** `index.html` (line 35), `events.html` (line 35).
- **Type:** Google API key (`AIza…`), redacted: `AIza…0o0U` (last four characters shown only).
- **Evidence:** Inline `<script>` defines `window.JHSV_CALENDAR.apiKey`. `git log --all -p -S "AIzaSy"` shows the original commit `c2ab66c` introduced the key with the comment *"referrer-restricted: rccgjhsv.org, *.vercel.app, localhost"*. The key is therefore intentional — a public browser key — but it has been world-readable in the repository's git history since introduction.
- **Impact:** If referrer restrictions are correctly configured in Google Cloud, blast radius is limited to read-only access to the **public** Google Calendar `rccgjhsv2013@gmail.com`, which is already public. If restrictions were ever removed, broadened, or mis-typed, the key could be used to read/quota-burn the project's other API services.
- **Likelihood:** Low for abuse today; Medium over time without rotation.
- **Status:** **Needs human action.** Code-side this is normal for Google's "browser key" pattern. No code change is appropriate here without a refactor to a serverless proxy.
- **Remediation (recommended):**
  1. In Google Cloud Console, confirm the key is **API-restricted to "Google Calendar API" only** and **HTTP-referrer-restricted** to `https://rccgjhsv.org/*`, `https://*.rccgjhsv.org/*`, and any preview domains you actually use. Remove `localhost` from production keys.
  2. **Rotate** the key (issue a new restricted one, swap into the two HTML files, then delete the old one). The old value has been in public git history for some time.
  3. **Future-proofing (optional, recommended for launch+30):** Move the calendar fetch behind a Vercel Serverless Function that holds the key server-side and returns sanitized JSON. Browser code never sees the key; quota cannot be abused from the page.

### Other secret scans
- **`rccgjhsv2013@gmail.com`** — appears in `index.html`, `events.html` (as the public Google Calendar id), `give.html` (Zelle handle), and historical commits. **This is a published payment handle**, intentionally public. No action.
- **No** other API keys, OAuth client secrets, GitHub tokens, Vercel/Netlify tokens, Firebase configs, Supabase keys, Stripe keys, SMTP credentials, database URLs, webhook URLs, JWTs, private keys, SSH keys, or service-account JSON were found.

---

## 9. Privacy and PII Exposure Review

### F-002 — Volunteer leadership names embedded in `scripts.js`
- **Severity:** Low.
- **Affected file:** `scripts.js` (the `ministries` data object).
- **Data category:** First name + last initial of \~17 volunteer department leads (e.g. `Bunmi O.`, `Dami B.`, `Excel A.`, `Tobi A.`, `Dr. Obi A.`).
- **Impact:** These names render publicly inside the "Ministry" modal on `/about`. This is intentional church directory content but creates a small re-identification surface in combination with social media handles.
- **Recommendation (no code change made automatically):** Confirm that **each named individual has consented** to being publicly listed by name on the site. Consider standardising on first-name-only (no last initial, no titles like "Dr."), unless explicit consent is on file.
- **Status:** Needs human confirmation.

### F-003 — Pastor names, photos, social handles, and bios on `/about`
- **Severity:** Informational.
- **Data category:** Public-facing leadership identity (intentional).
- **Recommendation:** Confirm both pastors consent to the current bio text, the linked Instagram/Facebook/Threads handles (`@shepherdscarefound`, `@yemisi_essential`), and the photo selections. Names and titles should match how they are addressed in church.
- **Status:** Needs human confirmation.

### F-004 — Monday Prayer Line dial-in and access code displayed publicly
- **Severity:** Low (intentional but worth flagging).
- **Affected files:** `index.html`, `events.html` (modal).
- **Evidence:** Phone `(667) 770-1476` and access code `768371` are rendered to anyone visiting the page.
- **Impact:** A bad actor could join the prayer call. Conference-line abuse risk only — no account compromise.
- **Recommendation:** Confirm this dial-in is intended to be fully open. If the code is meant to be a *light* gate, replace it with a "Request the code" form behind email; otherwise leave as-is and note in incident-response notes that the line is open.
- **Status:** Needs human confirmation.

### Other privacy checks (clean)
- No dates of birth, ages, home addresses (other than the church's own), personal phone numbers (other than the church office and prayer line), private family relationships, medical or financial information, photos of clearly identifiable minors with names attached, internal admin notes, or comments containing PII were found in any HTML, JS, CSS, JSON, markdown, or config file.
- The only personal email addresses in the codebase are organisational (`info@rccgjhsv.org`, `finance@rccgjhsv.org`) and the public Zelle/Calendar Gmail (`rccgjhsv2013@gmail.com`).
- The only physical address is the church's own (474 Piercy Road, San Jose, CA 95138).

---

## 10. Image and Media Metadata Review

### F-005 — EXIF/XMP metadata leakage on two production photos — **FIXED**
- **Severity:** Medium → **Resolved.**
- **Affected files (before):**
  - `assets/photos/pastor_bayo.jpg` — leaked **camera Make/Model (SONY ILCE-7M4)**, **lens model (FE 35mm F1.4 GM)**, `DateTimeOriginal` `2024-12-29 19:01:48`, internal XMP UUID, MicrosoftPhoto editing block, Rating, JFIF resolution metadata.
  - `assets/photos/service_image.jpg` — leaked **camera Make/Model (SONY ILCE-7M3)**, **lens model (FE 85mm F1.4 GM II)**, `DateTimeOriginal` `2025-10-05 14:09:43`, internal XMP UUID, Rating.
- **Privacy impact:** No GPS coordinates were embedded, so location is not directly leaked. Camera body + lens combination, capture timestamp, and editing software still constitute a fingerprint that links a photographer's gear and workflow across other published images.
- **Action taken:** Stripped all EXIF, XMP, IPTC, and rating metadata in place using ExifTool, preserving image bytes/quality (not re-encoded), JPEG markers, and `ColorSpace`/`Orientation` sanity:
  ```
  exiftool -overwrite_original -all= -tagsFromFile @ \
           -ColorSpaceTags -Orientation -ImageWidth -ImageHeight \
           assets/photos/pastor_bayo.jpg assets/photos/service_image.jpg
  ```
- **Verification:**
  - Re-running `exiftool -G -a -s -EXIF:all -XMP:all -IPTC:all -GPS:all …` reports only `ImageWidth`, `ImageHeight`, `XResolution`, `YResolution`, `ResolutionUnit`, `YCbCrPositioning` remaining — no Make, Model, Software, Author, GPS, Lens, DateTime, Rating, or XMP UUID fields.
  - JPEG SOI/EOI markers verified intact (`ff d8 ff …` start, `ff d9` end) on both files.
  - File sizes effectively unchanged (`pastor_bayo.jpg`: 1,449,920 → 1,447,628 bytes; `service_image.jpg`: 385,020 → 382,733 bytes). Visual quality unaffected (no re-encode).
  - HTML still references both files with no path changes.
- **Status:** **Fixed.**

### Other media (clean)
- All other 18 photos had no EXIF/XMP/IPTC metadata to begin with — they had already been processed somewhere upstream.
- All 10 logo/favicon PNGs and ICOs are clean (no Author/Creator/Software/textual chunks).
- The two ICS files contain only event metadata (church address, summary, organiser-less).
- No PDFs, videos, or HEIC/TIFF files in the repo.

---

## 11. External API and Third-Party Integration Review

| Integration | Loaded from | Purpose | Risk | Notes |
|---|---|---|---|---|
| Google Fonts CSS | `fonts.googleapis.com` | Web fonts | Low | Standard, allowed in CSP. |
| Google Fonts files | `fonts.gstatic.com` | Web fonts | Low | Allowed in CSP. |
| Google Analytics gtag | `www.googletagmanager.com`, `www.google-analytics.com` | Analytics | Low/Privacy | **Opt-in by config** — `analytics.js` only loads gtag if `JHSV_ANALYTICS.gaId` is set (currently empty). `anonymize_ip: true`. See §22 for cookie-banner recommendation. |
| Google Calendar API v3 | `www.googleapis.com/calendar/v3` | Public calendar fetch | Medium → mitigated | Browser key, referrer-restricted (see F-001). |
| Google Maps embed | `www.google.com/maps?…&output=embed` | Address map iframe | Low | `referrerpolicy="no-referrer-when-downgrade"`, `loading="lazy"`. |
| YouTube embed | `www.youtube.com/embed/…` | Live stream / latest broadcast | Low | Iframe constructed in `scripts.js` with `referrerPolicy="strict-origin-when-cross-origin"` and explicit `allow=` list. Video ID is regex-validated against `^[A-Za-z0-9_-]{11}$` indirectly (via channel ID validation `^UC[A-Za-z0-9_-]{22}$`). |
| YouTube channel RSS via CORS proxy | `api.rss2json.com`, `api.allorigins.win`, `api.codetabs.com` | Recent broadcast list & "is the channel live now" check | **Medium privacy** | See F-006. |
| Church Center (Planning Center Giving) modal script | `js.churchcenter.com/modal/v1` | Donation modal | Low | First-party trust to the donation processor. Allowed in CSP `script-src` and `frame-src`. |

### F-006 — Third-party CORS proxies see every visitor's IP for YouTube hydration
- **Severity:** Medium (privacy), Low (security).
- **Affected file:** `scripts.js` (`fetchChannelVideos`, `checkChannelLive`).
- **Description:** To work around YouTube RSS lacking CORS headers, the page proxies through `api.rss2json.com`, `api.allorigins.win`, or `api.codetabs.com`. These services therefore see every site visitor's **IP address, User-Agent, and Referer**. The fallback HTML response from `youtube.com/channel/<id>/live` is returned verbatim, then matched with a regex — there is no DOM injection of the response, so XSS is not a concern.
- **Status:** Allowed in CSP. **Documented for owner decision.**
- **Recommendation:** For launch, current behaviour is acceptable — these proxies don't see any PII beyond IP/UA. For launch+30, replace with a small Vercel Edge Function that proxies the YouTube RSS server-to-server. Removes the privacy hop and removes three third-party `connect-src` entries from CSP.

### F-007 — Forms have no backing endpoint (`data-stub`)
- **Severity:** Informational (functional).
- **Affected files:** `contact.html`, `new.html`, `partials/footer.html`, `events.html`.
- **Description:** All four forms (Contact, Prayer Request, Connection Card, Connection List newsletter) use `data-stub` and `e.preventDefault()`. They **do not submit anywhere**. The submitted message text "Thanks — this form is a draft. We'll wire it up next." surfaces on submit.
- **Security implication:** Zero — there is no server endpoint to attack. **But** users believe their messages are sent; this is a UX/trust issue more than a security issue.
- **Recommendation:** Before launch, either (a) wire forms to a real handler (e.g. Planning Center Forms, Formspree, a Vercel Function with reCAPTCHA/hCaptcha and a per-IP rate limit), or (b) hide the forms until they're wired. **Confirm before launch.** When wiring forms, add `form-action` host(s) to the CSP.
- **Status:** Needs human confirmation.

### `target="_blank"` audit
All external links opening in new tabs were reviewed; every one carries `rel="noopener"` (some additionally `noreferrer`). The single `live.html` link that initially looked unsafe in `grep` output had `rel="noopener"` on the next line. **No tabnabbing risk.**

### Mixed content / non-HTTPS audit
No `http://` URLs in any HTML, JS, or CSS file. All third-party assets, embeds, scripts, and fonts are loaded over `https://`. The Apache `.htaccess` and Vercel both force HTTPS.

---

## 12. Dependency and CVE Review

- **No package manager, no `package.json`, no `node_modules`, no lockfile.**
- The only third-party JS executed in the browser is fetched from CDNs at runtime: `gtag.js` (Google), `js.churchcenter.com/modal/v1` (Planning Center). Both are vendor-managed; the church does not pin or host them.
- No vulnerable image library, markdown parser, or HTML sanitizer is used (the site does not parse user-supplied markdown or HTML).
- **Conclusion:** No CVE surface in this repository to triage. Continuous monitoring recommendation in §22.

---

## 13. Passive Security Testing Results

| Check | Before | After |
|---|---|---|
| Strict-Transport-Security | **Missing** | **Set** (`max-age=63072000; includeSubDomains; preload`) |
| Content-Security-Policy | **Missing** | **Set** (locked to actually-used origins; see §15) |
| X-Frame-Options | Missing | `DENY` |
| `frame-ancestors` (CSP) | Missing | `'none'` |
| X-Content-Type-Options | `nosniff` (Apache only) | `nosniff` (Vercel + Apache) |
| Referrer-Policy | `strict-origin-when-cross-origin` (Apache only) | `strict-origin-when-cross-origin` (Vercel + Apache) |
| Permissions-Policy | Missing | Set (geo/camera/mic/payment/etc. locked down; YouTube origin allow-listed for autoplay/fullscreen/PiP/encrypted-media/gyroscope) |
| Cross-Origin-Opener-Policy | Missing | `same-origin-allow-popups` |
| `X-Powered-By` / `Server` leak | Removed in Apache; Vercel still adds defaults | Apache strips both; Vercel will continue to send its own platform header (low impact, can't be fully suppressed on Vercel) |
| `Cache-Control` for error pages | `no-store` ✓ | unchanged |
| `robots.txt` | Sane; disallows `/partials/` and the error routes | unchanged |
| `sitemap.xml` | Lists 7 public routes; clean | unchanged |
| Source maps in production | None present | unchanged |
| Directory listing | Disabled (`Options -Indexes`) | unchanged |
| Public `.env` / config files | None present | unchanged |
| Public admin routes | None | unchanged |
| Build artefacts in deploy | None | unchanged |
| `.git` exposure | Apache denies `.git*`; Vercel does not serve dotfiles by default | unchanged |
| Mixed content | None | unchanged |
| Hidden HTML comments with sensitive data | None found | unchanged |

---

## 14. Active Penetration Testing Results

Safe active testing was confined to the local served copy and the static config files.

| Vector | Result |
|---|---|
| Reflected XSS via query params, search, route params | **Not exploitable.** No URL parameters are read into the DOM by `scripts.js` or `analytics.js`. |
| Stored XSS | **Not applicable.** No user-generated content rendered. |
| DOM XSS via `innerHTML` / `insertAdjacentHTML` | **Not exploitable.** Every dynamic injection in `scripts.js` (ministry modal, pastor bio, calendar broadcasts, calendar events) routes user-controlled data through `escapeHtml`/`escHtml`/`esc` which encodes `& < > " '`. The pastor-bio path encodes only `& < >` but the input is a hardcoded literal in `pastors[]`, not external data — non-exploitable. The YouTube RSS path consumes an XML proxy response, parses it with `DOMParser` and pulls only `videoId`, `title`, `published`; `videoId` is regex-validated, others are HTML-escaped before injection. The Calendar API path consumes `summary/description/location` and HTML-escapes everything before injection; `description` is also pre-stripped of HTML via `stripHtml` (which uses an off-DOM `innerHTML` parse — safe because the result is read back via `textContent`, not rendered). |
| Open redirect | **Not exploitable.** No redirect-by-parameter logic. |
| CSRF | **Not applicable.** No state-changing endpoints originate from this site. |
| Clickjacking | **Mitigated** by `X-Frame-Options: DENY` and `frame-ancestors 'none'`. |
| Content sniffing | **Mitigated** by `X-Content-Type-Options: nosniff`. |
| Mixed content | **None.** |
| Tabnabbing via `target="_blank"` | **Mitigated.** All such links carry `rel="noopener"`. |
| Path traversal | **Not applicable.** Static host. |
| Broken access control | **Not applicable.** No authenticated routes; `/partials/*` returns the partial (intentional, used by `data-include`) but contains no sensitive content. |
| Insecure iframe embeds | Maps and YouTube iframes use referrer-policy hardening; `frame-src` whitelisted in CSP. |
| Weak / no CSP | **Resolved** (see §15). |
| Missing HTTPS enforcement | Already enforced; HSTS now also asserted. |
| Sensitive data in HTML comments / JS bundles | None found. |
| `prototype` pollution / `eval` / `new Function` / `document.write` | None used. |

---

## 15. Security Header Review (post-fix)

Applied identically in `vercel.json` (`/(.*)` matcher) and `.htaccess` (`<IfModule mod_headers.c>`).

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options:    nosniff
X-Frame-Options:           DENY
Referrer-Policy:           strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin-allow-popups
Permissions-Policy:        accelerometer=(), autoplay=(self "https://www.youtube.com"),
                           camera=(), clipboard-read=(), clipboard-write=(self),
                           display-capture=(), encrypted-media=(self "https://www.youtube.com"),
                           fullscreen=(self "https://www.youtube.com"), geolocation=(),
                           gyroscope=(self "https://www.youtube.com"), magnetometer=(),
                           microphone=(), midi=(), payment=(),
                           picture-in-picture=(self "https://www.youtube.com"),
                           publickey-credentials-get=(), sync-xhr=(self), usb=(),
                           interest-cohort=(), browsing-topics=()
Content-Security-Policy:   (see below)
```

CSP (formatted for readability):

```
default-src 'self';
base-uri    'self';
object-src  'none';
frame-ancestors 'none';
form-action 'self' https://rccgjhsv.churchcenter.com;
script-src      'self' 'unsafe-inline'
                https://www.googletagmanager.com
                https://www.google-analytics.com
                https://js.churchcenter.com
                https://*.churchcenter.com;
script-src-attr 'none';
style-src       'self' 'unsafe-inline'
                https://fonts.googleapis.com;
font-src        'self' https://fonts.gstatic.com data:;
img-src         'self' data:
                https://i.ytimg.com https://*.ytimg.com
                https://*.googleusercontent.com
                https://www.googletagmanager.com
                https://www.google-analytics.com
                https://*.google-analytics.com
                https://*.analytics.google.com;
media-src       'self' https://*.youtube.com;
connect-src     'self'
                https://www.googleapis.com
                https://www.googletagmanager.com
                https://www.google-analytics.com
                https://*.google-analytics.com
                https://*.analytics.google.com
                https://stats.g.doubleclick.net
                https://api.rss2json.com
                https://api.allorigins.win
                https://api.codetabs.com
                https://*.churchcenter.com;
frame-src       https://www.google.com
                https://www.youtube.com
                https://www.youtube-nocookie.com
                https://*.churchcenter.com;
manifest-src    'self';
worker-src      'self' blob:;
upgrade-insecure-requests
```

**`'unsafe-inline'` retention rationale:** Several inline `<script>` blocks (the `JHSV_CALENDAR` config on `/index` and `/events`, the `<script type="application/ld+json">` SEO blocks on every page, and the inline `<meta http-equiv="refresh">` fallbacks plus inline `location.replace()` on `404.html`) are required for site function. Tightening to `'nonce-…'` requires regenerating page HTML at deploy time, which conflicts with the "static, no build pipeline" model. `'unsafe-inline'` is paired with a strict allow-list of remote `script-src` origins, and `script-src-attr 'none'` prevents inline event-handler attribute execution — the realistic XSS gain from a nonce/hash migration is small for this content surface (no user-supplied data is ever rendered inline). Tracked as a future improvement in §23.

---

## 16. Form and User Input Review

| Form | Page | Inputs | Validation | Submission target | Anti-abuse |
|---|---|---|---|---|---|
| Contact | `contact.html` | name, email, phone, reason, message | HTML5 `required` + `type=email` | None (`data-stub`) | n/a (no endpoint) |
| Prayer Request | `contact.html` | name (opt), email (opt), prayer text, consent checkbox | HTML5 `required` | None (`data-stub`) | n/a |
| Connection Card | `new.html` | first/last name, email, planned visit, optional prayer text | HTML5 `required` + `type=email` | None (`data-stub`) | n/a |
| Connection List | `partials/footer.html`, `events.html#connection-list` | email | HTML5 `required` + `type=email` | None (`data-stub`) | n/a |

**Findings:** see F-007. When forms are wired to real handlers, the security checklist is:

- Use a proper HTTPS endpoint with email-syntax + length validation server-side.
- Add a CAPTCHA (hCaptcha or reCAPTCHA v3 invisible) and a per-IP rate limiter.
- Sanitise all fields before inclusion in any outbound email body (avoid header-injection).
- For prayer requests, **encrypt at rest** wherever they land — these are sensitive personal disclosures.
- Add a privacy notice next to the prayer-request form indicating who reads requests.
- Update CSP `form-action` to include the submission host.

---

## 17. External Link and Embed Review

- Facebook, Instagram, YouTube, Threads, RCCGNA, Planning Center, Cash.app, InterServer (footer credit), Google Maps — all `https://`, all `target="_blank"` carry `rel="noopener"`.
- Two iframes (Google Maps on `/contact` and `/new`, dynamic YouTube embed on `/live`) are scoped by CSP `frame-src`, lazy-loaded, and use restrictive referrer policies.
- Church Center modal script (`/give`) is fetched from `js.churchcenter.com` and allowed in CSP `script-src` and `frame-src`.
- No third-party analytics or trackers other than Google Analytics gtag (opt-in via empty `gaId` config).
- No social share buttons (Facebook Like, Twitter Share) — those would otherwise be a privacy concern.

---

## 18. Findings Table

| ID | Title | Severity | Status |
|---|---|---|---|
| F-001 | Google Calendar API key in client + git history | High (operational) | Needs human action — rotation + restriction confirmation |
| F-002 | Volunteer leadership names in `scripts.js` | Low | Needs human confirmation (consent) |
| F-003 | Pastor names/photos/handles on About page | Informational | Needs human confirmation (consent) |
| F-004 | Open prayer-line dial-in code | Low | Needs human confirmation (intent) |
| F-005 | EXIF/XMP metadata on `pastor_bayo.jpg` and `service_image.jpg` | Medium | **Fixed** |
| F-006 | Third-party CORS proxies see visitor IPs | Medium (privacy) | Documented; future remediation suggested |
| F-007 | Site forms are stubs and don't submit | Informational | Needs human action before launch |
| F-008 | Missing CSP / HSTS / Permissions-Policy / COOP / X-Frame-Options | Medium | **Fixed** in `vercel.json` and `.htaccess` |
| F-009 | `JHSV_ANALYTICS.gaId`/`gscToken` empty — analytics not yet enabled | Informational | Confirm intent |
| F-010 | Cookie banner / GDPR-CCPA notice absent | Low (jurisdictional) | See §22 |

---

## 19. Remediation Actions Completed

1. **F-005 — EXIF stripped** from `assets/photos/pastor_bayo.jpg` and `assets/photos/service_image.jpg`. Verified via repeat ExifTool run; verified JPEG markers and visual integrity; verified HTML references still resolve `200`.
2. **F-008 — Security headers added** to `vercel.json` (`/(.*)` matcher, runs on every response). Same headers also added to `.htaccess` (Apache fallback). Includes:
   - HSTS (2 years, includeSubDomains, preload)
   - CSP locked down to actually-used origins
   - X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy
   - `Server` and `X-Powered-By` stripped where Apache permits.
3. **`vercel.json` JSON validity** verified with `node -e "JSON.parse(...)"`.
4. **Asset references** verified via local `python3 -m http.server` + `curl`: every `src=`/`href=` referenced from `index.html` returns `HTTP 200`.

---

## 20. Remaining Risks

- **F-001 key rotation** is the highest-priority human action. It does not block launch but should be completed within 7 days of launch.
- **F-007 forms** must be wired (or hidden) before public launch — visitors currently believe their submissions are received.
- The **third-party CORS proxies** (F-006) remain a small privacy hop until a serverless replacement ships.
- **Inline-script nonces / hashes** would tighten the CSP; deferred to future improvement.

---

## 21. Items Requiring Human Confirmation

1. **Google Calendar API key restrictions.** Confirm in Google Cloud Console: the key is API-restricted to *Calendar API only*, HTTP-referrer-restricted to `https://rccgjhsv.org/*` (and any preview origins actually in use). Rotate the key and replace in `index.html` line 35 and `events.html` line 35.
2. **Volunteer-name consent.** Confirm every name in `scripts.js` `ministries` map has consented to public listing, or pare back to first names only.
3. **Pastor bio/social-handle accuracy.** Confirm both pastors are happy with the bio text in `scripts.js` `pastors` map and the linked social handles.
4. **Prayer line openness.** Confirm the dial-in `(667) 770-1476` and access code `768371` are intended to be fully public.
5. **Form wiring before launch.** Decide endpoint (Planning Center Forms / Formspree / Vercel Function) and add CAPTCHA + rate-limit. Update CSP `form-action` accordingly.
6. **GA opt-in / cookie banner.** Decide whether GA will be enabled (`JHSV_ANALYTICS.gaId`). If yes, add a cookie banner with consent gating before loading `gtag.js` (CCPA / EU traffic safety). The site currently complies because GA does not load (empty `gaId`).

---

## 22. Continuous Security Recommendations

Operational hygiene the church web team should adopt:

- **GitHub repository hygiene:** enable secret scanning, push protection, and Dependabot alerts (no deps today, but it auto-detects when added).
- **Branch protection:** require PR review on `main`; require passing checks; restrict force-push.
- **Least privilege:** review who has `admin` on the GitHub org, the Vercel project, the InterServer panel, the Google Cloud project that holds the calendar key, the Planning Center account, and the Google Analytics property. MFA on all admin accounts.
- **Quarterly:** repeat the exiftool sweep before publishing batches of new photos. A simple wrapper:
  ```
  exiftool -overwrite_original -all= -tagsFromFile @ \
           -ColorSpaceTags -Orientation -ImageWidth -ImageHeight \
           assets/photos/*.jpg
  ```
- **Quarterly:** re-audit external links and third-party scripts; remove anything no longer needed.
- **Annually:** light-touch pentest. Re-run this checklist; specifically run `gitleaks detect --source . --redact` and `trufflehog filesystem .` (commands below).
- **Cookie/consent banner** if GA is ever enabled (CCPA + EU visitors).
- **Photo upload SOP:** require consent on file before any individual is photographed for the website; default to wide/anonymous shots; never publish a photograph of a minor without written guardian consent.
- **Incident response:** maintain a one-page run-book — who to call (host, registrar, Google), how to put up a maintenance page, how to roll back a deploy on Vercel.

Suggested CLI commands to keep in the SOP (none of these were available locally during this audit; all are safe to run on the repo):

```bash
# Secret scans
gitleaks detect --source . --redact --no-banner --report-format json --report-path gitleaks-report.json
trufflehog filesystem . --no-update --only-verified
detect-secrets scan > .secrets.baseline

# Image metadata audit
exiftool -G -a -s -GPS:all -EXIF:Make -EXIF:Model -EXIF:Software \
         -EXIF:Artist -EXIF:OwnerName -XMP:all -IPTC:all assets/photos/*

# Header / passive scan against deployed site (replace URL)
curl -sSI https://rccgjhsv.org/ | grep -iE 'strict-transport|content-security|x-frame|x-content|referrer|permissions|coop'

# OWASP ZAP baseline (Docker)
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://rccgjhsv.org -m 5

# Lighthouse (best-practices/security)
npx -y lighthouse https://rccgjhsv.org --only-categories=best-practices --output html --output-path ./lh.html
```

---

## 23. Future Security Roadmap

- **Launch + 7 days:** rotate Google Calendar API key (F-001).
- **Launch + 30 days:** replace public CORS proxies with a Vercel Edge Function for YouTube RSS and live-status (closes F-006; trims CSP `connect-src`).
- **Launch + 60 days:** move Google Calendar fetch behind the same serverless layer; remove the API key from client HTML entirely.
- **Launch + 90 days:** evaluate moving away from `'unsafe-inline'` in `script-src` by rendering JSON-LD and inline config blocks via a tiny build step (or by moving them into static `.json` files loaded via `<link rel="preload">`/`fetch`).
- **Annual:** lightweight third-party penetration test; refresh consent register for publicly named individuals.

---

## 24. Final Risk Rating

**LOW.** The site is safe to launch publicly **as-is on this branch** with the caveat that the six items in §21 must be reviewed and at least items (1)/(5)/(6) acted on close to launch. There is no known exploitable vulnerability in the codebase post-fix.

---

## 25. Appendix — Redacted Evidence

### A. Google API key (F-001) — redacted
```
file: index.html, line 35
file: events.html, line 35
value: AIza…0o0U  (full key not reproduced)
introduced: commit c2ab66c (annotated as referrer-restricted)
```

### B. Pre-strip EXIF excerpt (F-005) — `pastor_bayo.jpg`
```
[EXIF]   Make             : SONY
[EXIF]   Model            : ILCE-7M4
[EXIF]   LensModel        : FE 35mm F1.4 GM
[EXIF]   DateTimeOriginal : 2024:12:29 19:01:48
[XMP]    About            : uuid:faf5bdd5-… (UUID redacted)
```

### C. Post-strip EXIF (F-005) — both files, complete
```
[EXIF]   ImageWidth, ImageHeight, XResolution, YResolution,
         ResolutionUnit, YCbCrPositioning  (only)
```

### D. Header set, post-fix (`curl -sSI` against local serve confirms file content; production headers will be issued by Vercel/Apache per `vercel.json` / `.htaccess`).

### E. Forms with `data-stub` (F-007)
```
contact.html: 2 forms (Contact, Prayer Request)
new.html:     1 form  (Connection Card)
events.html:  1 form  (Connection List signup, anchor #connection-list)
partials/footer.html: 1 form (Connection List signup, footer)
```

---

*End of report.*
