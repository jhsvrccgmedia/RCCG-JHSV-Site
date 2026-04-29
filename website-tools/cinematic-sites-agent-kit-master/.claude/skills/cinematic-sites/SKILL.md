---
name: cinematic-sites
description: Transform any website into a cinematic experience — brand analysis, AI-generated 3D hero animations (Nano Banana Pro + Kling 3.0 Pro), cinematic modules from the library, and free Vercel deployment. Four steps, one command. Triggers on "cinematic site", "cinematic-sites", "cinematic website", "transform this site", "make this site cinematic".
---

# Cinematic Sites

Transform any website into a cinematic experience with AI-generated 3D animations, scroll-driven effects, and premium design — then deploy live.

**Four steps. One command. Any business.**

```
/cinematic-sites https://example.com
```

---

## HARD RULES (ENFORCE EVERY BUILD)

These override any defaults. No exceptions.

### 1. No dark vignettes — no wrapper containers — backdrop pills on INDIVIDUAL small elements only
Never add gradient overlays that darken the edges of hero sections. No radial gradients that dim the video. No `linear-gradient(to bottom, var(--bg), transparent)` masks on hero media. **Never wrap all hero content in a single backdrop container** (no background, border, border-radius, or backdrop-filter on `.hero-content`).

**For big headlines (h1):** Strong text-shadow ONLY, no background:
```css
text-shadow: 0 4px 30px rgba(0,0,0,.9), 0 2px 10px rgba(0,0,0,.7), 0 0 60px rgba(0,0,0,.5);
```

**For smaller text over video (subtitles, taglines, labels, scroll hints, CTAs):** Individual solid background pills on EACH element — not a shared wrapper:
```css
.hero .subtitle,
.hero .tagline,
.hero .cta,
.hero .scroll-hint {
  background: rgba(12,10,8,0.7);
  padding: 4px 14px;
  display: inline-block;
  backdrop-filter: blur(4px);
}
```
Apply this to EACH individual small text element. Never group them inside a single rounded rectangle container.

### 2. Hero is scroll-driven via canvas frame sequence (NEVER video.currentTime)
The hero MUST scrub with scroll position. Never autoplay loop. **Never use `<video>` + `video.currentTime`** — browsers can only seek to keyframes in compressed MP4s, causing visible lag/stutter on every build. This has failed twice. Canvas + JPEG frames is the only approach.

The `<video>` element and `hero-loop.mp4` are NOT used in the final site. Only `assets/frames/` matters. Keep the MP4 as a source artifact but the website renders frames on canvas.

```html
<section class="hero" style="height:300vh">
  <div class="hero-sticky" style="position:sticky;top:0;height:100vh;overflow:hidden">
    <canvas id="heroCanvas" style="position:absolute;top:0;left:0;display:block;z-index:1"></canvas>
    <!-- content overlaid here, z-index:2 -->
  </div>
</section>
```
```javascript
var canvas = document.getElementById('heroCanvas');
var ctx = canvas.getContext('2d');
var frames = [];
// IMPORTANT: set this to the actual frame count from ffmpeg extraction
// After running ffmpeg, count with: ls assets/frames/ | wc -l
var totalFrames = FRAME_COUNT; // e.g. 121 for 5s@24fps, 241 for 10s@24fps
var loaded = 0;

// Preload all frames
for (var i = 1; i <= totalFrames; i++) {
  var img = new Image();
  img.src = 'assets/frames/frame-' + String(i).padStart(4, '0') + '.jpg';
  img.onload = function() {
    loaded++;
    if (loaded === 1) drawFrame(0); // draw first frame immediately
    if (loaded === totalFrames) {
      var loader = document.getElementById('loader');
      if (loader) { loader.style.opacity = '0'; setTimeout(function() { loader.style.display = 'none'; }, 600); }
    }
  };
  frames.push(img);
}

// Size canvas to viewport (call on resize too)
function resize() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();

// Draw a frame with cover-fit
function drawFrame(idx) {
  if (!frames[idx] || !frames[idx].complete) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var r = Math.max(canvas.width / frames[idx].width, canvas.height / frames[idx].height);
  var w = frames[idx].width * r, h = frames[idx].height * r;
  ctx.drawImage(frames[idx], (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}

// GSAP tween with snap for smooth frame stepping
gsap.to({ frame: 0 }, {
  frame: totalFrames - 1,
  snap: 'frame',
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 0.3
  },
  onUpdate: function() {
    drawFrame(Math.round(this.targets()[0].frame));
  }
});
```

**Why `gsap.to` with `snap: 'frame'`** instead of `ScrollTrigger.create` with `onUpdate`: The snap ensures we always land on whole frame indices (no sub-frame interpolation), and the tween approach gives GSAP more control over the animation timing, resulting in smoother scrub.

Extract frames: `ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg`

### 3. Always inline SVGs, never emojis
Every icon, illustration, and visual placeholder must be an inline SVG. Never use emoji characters. For standard UI icons, use Lucide via CDN. For custom visuals in mockups/cards, draw inline SVGs:
```html
<!-- Good -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
</svg>

<!-- Bad -->
&#x1f4d0;
```

### 4. Font contrast minimums
Body/paragraph text must meet these minimums:
- **Light themes:** body text minimum `#555`, labels minimum `#444`
- **Dark themes:** body text minimum `#999`, labels minimum `#888`
- `--muted` is for captions, metadata, and timestamps only — never for primary paragraph text
- Section labels (uppercase, letter-spaced) must be `font-weight: 600` minimum
- **Buttons:** text on colored backgrounds must always be explicitly high-contrast. White text (`#fff`) on dark/accent backgrounds, dark text (`#111`) on light/yellow backgrounds. Never inherit or assume — always set `color` explicitly on every button class. Test: if the background is darker than `#666`, text must be white.

### 5. Cinematic Modules is the library name
The interactive effects library is called **Cinematic Modules**. It is a separate package the user installs independently. On first run, ask the user: "Do you have Cinematic Modules installed? If so, what localhost port is it running on?" Store the answer and use it for all module fetches. If the user doesn't have it, the site can still be built — just skip the module integration step and use standard GSAP scroll animations instead.

---

## Setup (First Time Only)

### Prerequisites
- **ffmpeg** — required for extracting JPEG frames from video (the core of scroll animation). Install: `brew install ffmpeg` (Mac), `choco install ffmpeg` (Windows), or `apt install ffmpeg` (Linux).

### 1. Google AI Studio (for Nano Banana Pro image generation)
- Go to: https://aistudio.google.com/apikey
- Sign in with your Google account
- Click "Create API key" → select any Google Cloud project (or create one)
- Copy the key (starts with `AIza...`)
- Set as environment variable: `export GOOGLE_AI_STUDIO_KEY="AIza...your-key"`
- Free tier: generous daily quota, no credit card required

### 2. WaveSpeed (for Kling video generation)
- Go to: https://wavespeed.ai and sign up
- Add credits: https://wavespeed.ai/billing — $5 gets you ~10 videos
- Get your API key: https://wavespeed.ai/settings → API Keys → Create
- Set as environment variable: `export WAVESPEED_API_KEY="your-key"`
- Cost: ~$0.42-0.56 per 5s video depending on model

### 3. Vercel (for free deployment — optional)
- Install: `npm i -g vercel`
- Run: `vercel login` (creates a free Hobby account if you don't have one)
- Free tier: unlimited static sites, custom domains, SSL included
- No API key needed — the CLI handles auth via browser login

### 4. Cinematic Modules (optional, enhances output)
- Clone: `git clone https://github.com/robonuggets/cinematic-site-components.git`
- Serve locally: `cd cinematic-site-components && npx serve -p 3457` (or any port)
- The skill will ask for the port on first run
- Without this, sites still work — they just use standard GSAP scroll animations instead of the premium module effects

### Already have a hero video?
If you already have a video (from Kling, Veo, or anything else), skip Steps 1-2 entirely. Just place the MP4 in your project folder and jump to frame extraction:
```bash
ffmpeg -i your-video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg
```
Then go straight to Step 3 (Website Build).

---

## Step 1: Brand Analysis

Fetch the target website and extract brand identity.

### What to Extract
- Business name and category
- Color palette (primary, secondary, accent, background, text — hex codes)
- Typography (heading and body fonts)
- Key copy (headline, tagline, services, CTA, contact info)
- Logo URL
- Screenshots (if JS-rendered, try fetching with a browser user-agent or use WebFetch)

### How
```bash
curl -sL -o site_raw.html "<URL>" -A "Mozilla/5.0"
```

### Output: Visual Brand Card
Generate `brand-card.html` showing color swatches, font samples, extracted copy, logo preview, suggested theme. Open in browser for review.

### Pause Point
Show the brand card. Ask: "Does this look right? Any corrections?"

---

## Step 2: Scene Generation

### 2a. Suggest 3 Concepts
Present a visual table — each with ONE hero object, distinct visual style, clear animation description with motion words.

### Scene Design Rules
- **One subject, one action.** Single hero item, 2-3 supporting elements max.
- **Cinematic, not catalog.** Close-ups, shallow depth of field, dramatic angles. Contextual environments.
- **NO default white backgrounds.** Match environment to industry.
- **Only generate the FIRST FRAME.** Kling animates better from a single image + descriptive prompt.

### Cost Check (ALWAYS show before proceeding)
Before generating anything, tell the user the expected cost:
- **Image generation (Nano Banana Pro):** Free — no cost
- **Video generation (Kling via WaveSpeed):** ~$0.42-0.56 per 5s video depending on model. 10s video costs double.
- **Deployment (Vercel):** Free
- **Total per site:** Typically ~$0.50-1.50

Ask: "Ready to proceed? This will cost approximately $X on WaveSpeed." Wait for confirmation before making any paid API call.

### 2b. Generate Image (Nano Banana Pro)
```javascript
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  }
);
```

### 2c. Animate (Kling via WaveSpeed)

**Model options (ask the user which to use):**
| Model | Endpoint slug | Cost/5s | Notes |
|-------|--------------|---------|-------|
| **Kling O3 Pro** (latest) | `kwaivgi/kling-video-o3-pro/image-to-video` | $0.56 | Best quality, latest model |
| Kling v3.0 Pro | `kwaivgi/kling-v3.0-pro/image-to-video` | $0.56 | Previous gen, proven reliable |
| Kling O3 Standard | `kwaivgi/kling-video-o3-std/image-to-video` | $0.42 | Budget option, still good |
| Kling v3.0 Standard | `kwaivgi/kling-v3.0-std/image-to-video` | $0.42 | Budget previous gen |

**Default: Kling O3 Pro** unless the user specifies otherwise.

**Resolution control (720p vs 1080p):**
WaveSpeed has NO resolution parameter — output resolution matches the INPUT IMAGE dimensions. To control output resolution:
- **1080p (default):** Generate or resize the source image to **1920x1080** before uploading
- **720p:** Resize source image to **1280x720** before uploading

Always default to 1080p. Resize with:
```bash
ffmpeg -i input.jpg -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -q:v 2 input_1080p.jpg
```

Upload to litterbox (NOT catbox):
```bash
curl -s -F "reqtype=fileupload" -F "time=24h" -F "fileToUpload=@image.jpg" https://litterbox.catbox.moe/resources/internals/api.php
```

Submit:
```javascript
await fetch('https://api.wavespeed.ai/api/v3/kwaivgi/kling-video-o3-pro/image-to-video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: litterboxUrl, prompt, duration: 5, cfg_scale: 0.7, sound: false })
});
```

**Available params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `image` | string (URL) | required | Source image (litterbox URL) |
| `prompt` | string | optional | Motion description |
| `negative_prompt` | string | optional | What to exclude |
| `end_image` | string (URL) | optional | End frame (only for specific transitions) |
| `duration` | int | 5 | 3-15 seconds |
| `cfg_scale` | float | 0.5 | 0-1, higher = stricter prompt adherence |
| `sound` | bool | false | Generate audio (adds ~25-50% cost) |
| `shot_type` | string | "customize" | "customize" or "intelligent" |
| `multi_prompt` | array | optional | Multiple shots with per-shot prompts |
| `element_list` | array | optional | Visual element consistency (max 3) |

Poll `https://api.wavespeed.ai/api/v3/predictions/{id}/result` every 15s. Download to the project's `assets/` folder.

### Error Handling
- **Nano Banana Pro fails:** Tell the user the image generation failed and suggest retrying with a simpler prompt. If it fails 3 times, ask if they have their own image to use instead.
- **WaveSpeed/Kling fails:** Tell the user the video generation failed. Common causes: image URL expired (litterbox has 24hr expiry), image too small (<300px), or rate limit. Suggest re-uploading the image and retrying. If it fails 3 times, ask if they have their own video.
- **Never silently skip a failed step.** Always inform the user what happened and what the options are.

### Extract Frames
```bash
# For 1080p source video — extract at full res
ffmpeg -i video.mp4 -vf "fps=24" -q:v 3 assets/frames/frame-%04d.jpg

# For scroll animation (lighter files) — downscale to 720p
ffmpeg -i video.mp4 -vf "fps=24,scale=1280:720" -q:v 4 assets/frames/frame-%04d.jpg
```

---

## Step 3: Website Build

### Architecture Rules
- **One file** — all CSS in `<style>`, all JS in `<script>`
- **Assets external** — video and frames by relative path
- **No build step** — no React, Vue, npm, Tailwind
- **CDN only** — Google Fonts, GSAP + ScrollTrigger, Lucide Icons

### Required CDN
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
```

### Design System Foundation

Every site uses this CSS variable structure. Map brand colors to it:
```css
:root {
  --bg: [from brand];
  --card: [slightly off from bg];
  --text: [high contrast against bg];
  --muted: [for captions only, NOT body text];
  --accent: [brand primary];
  --accent-light: [accent at 8% opacity];
  --border: [subtle divider];
}
```

### Standard Easing
The entire cinematic modules library uses one easing curve for interactive transitions. Use it everywhere:
```css
transition: all 0.4s cubic-bezier(.16, 1, .3, 1);
```

### Site Structure
```
1. HERO — Scroll-driven canvas (300vh, sticky inner, JPEG frame sequence via gsap.to + snap)
2. CINEMATIC MODULES — 2-4 modules from the library woven into content sections
3. SERVICES / FEATURES — Business offerings
4. ABOUT / STORY — Business copy
5. CONTACT / CTA — Phone, email, address
6. FOOTER — Minimal
```

### Hero Content Layout
Hero text must be a tight vertical stack centered over the canvas. The `.hero-content` wrapper is a positioning container ONLY — no background, no border, no border-radius, no backdrop-filter. Never wrap all hero content in a single rounded rectangle.
```css
/* Wrapper: positioning ONLY, no visual styling */
.hero-content {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 0;
  /* NO background, NO border, NO border-radius, NO backdrop-filter */
}
/* Big headline: strong text-shadow only, no background */
.hero h1 {
  margin-bottom: 4px;
  text-shadow: 0 4px 30px rgba(0,0,0,.9), 0 2px 10px rgba(0,0,0,.7), 0 0 60px rgba(0,0,0,.5);
}
/* Each small text element gets its own individual backdrop pill */
.hero .subtitle { margin-bottom: 6px; background: rgba(12,10,8,0.7); padding: 4px 14px; display: inline-block; backdrop-filter: blur(4px); }
.hero .cta { margin-top: 16px; background: rgba(12,10,8,0.7); padding: 4px 14px; display: inline-block; backdrop-filter: blur(4px); }
.hero .scroll-hint { background: rgba(12,10,8,0.7); padding: 4px 14px; display: inline-block; backdrop-filter: blur(4px); }
```
Keep elements CLOSE together — 4-6px between subtitle elements, 16px before CTA. Never let hero text spread apart.

**Hero text fade-out on scroll (STANDARD — always include):**
Hero text fades out as the user scrolls, revealing the full video animation underneath:
```javascript
gsap.to('.hero-content', {
  opacity: 0,
  y: -60,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: '10% top',
    end: '35% top',
    scrub: true
  }
});
```

### Stock Photos
Search Unsplash: `https://unsplash.com/s/photos/{search-term}`
Use format: `https://images.unsplash.com/photo-{ID}?w={width}&h={height}&fit=crop&q=80`
Verify each loads (200 status) before using.

### Quality Standards
- GSAP scroll-triggered fade-up on all content sections
- Noise texture overlay (opacity 0.02 light / 0.04 dark)
- Magnetic button hover on primary CTAs (pull toward cursor, snap back)
- Navbar with scroll transition (transparent → solid)
- Clickable `tel:` and `mailto:` links
- Loading spinner while frames pre-load
- Responsive 375px to 1440px+

---

### Cinematic Modules Integration

### Source
The Cinematic Modules library is a separate package (`cinematic-site-components`) that the user installs and runs locally. It contains 30 standalone HTML modules organized into 4 categories. The port varies per user — ask on first run if not already known.

### How to Use Modules
1. **Pick 2-4 modules** that match the brand's industry and vibe
2. **Fetch the module HTML**: `curl -sL http://localhost:{PORT}/{module-name}` (no .html extension — it redirects). Use the port the user provided.
3. **Read the CSS and JS** from the fetched HTML
4. **Adapt** the styles and scripts into the site, remapping colors to the brand's `--accent`, `--bg`, etc.

### Module Selection Guide by Industry

| Industry | Recommended Modules |
|----------|-------------------|
| Luxury (jewelry, watches, perfume) | Text Mask Reveal, Curtain Reveal, Spotlight Border Cards, Zoom Parallax |
| Food (pizza, bakery, sushi, chocolate) | Color Shift, Zoom Parallax, Kinetic Marquee, Accordion Slider |
| Tech (keyboard, camera, laptop, SaaS) | Glitch Effect, Text Scramble, Magnetic Grid, 3D Tilt Cards |
| Creative (florist, architecture, music) | SVG Draw, Image Trail, Mesh Gradient, Curtain Reveal |
| Service (cleaning, moving, consulting) | Odometer Counter, Sticky Stack, Particle Button, Kinetic Marquee |
| Furniture / Interior (IKEA, décor) | Text Mask Reveal, Odometer Counter, Sticky Stack, Spotlight Border Cards, Kinetic Marquee |
| Portfolio / Agency | Accordion Slider, Cursor-Reactive Environment, Zoom Parallax, Horizontal Scroll |

### Full Module Reference (30 modules)

**Scroll-Driven (9):**
| Module | Slug | Best For |
|--------|------|----------|
| Text Mask Reveal | `text-mask` | Brand name reveal, hero headlines |
| Sticky Stack | `sticky-stack` | How-it-works, feature sections with pinned visual |
| Zoom Parallax | `zoom-parallax` | Cinematic depth, product reveal after scroll-through |
| Horizontal Scroll Hijack | `horizontal-scroll` | Portfolio galleries, case study showcases |
| Sticky Cards | `sticky-cards` | Step-by-step processes, stacking narratives |
| SVG Draw | `svg-draw` | Logo reveals, architectural line art |
| Curtain Reveal | `curtain-reveal` | Before/after, dramatic brand reveals |
| Split Screen | `split-scroll` | Two-column scrolling content (images vs text) |
| Color Shift | `color-shift` | Background mood transitions between sections |

**Cursor & Hover (8):**
| Module | Slug | Best For |
|--------|------|----------|
| Cursor-Reactive Environment | `cursor-reactive` | Full-page cursor glow + 3D tilt cards + magnetic buttons + click ripples |
| Accordion Slider | `accordion-slider` | Service showcases, portfolio panels (horiz + vertical) |
| Cursor Reveal | `cursor-reveal` | Before/after image comparison |
| Image Trail | `image-trail` | Portfolio hover, cursor following image ghosts |
| 3D Flip Cards | `flip-cards` | Feature cards with front/back content |
| Magnetic Grid | `magnetic-grid` | Dot grid that reacts to cursor proximity |
| Spotlight Border Cards | `spotlight-border` | Service/feature grids with cursor-tracking border glow |
| Drag-to-Pan | `drag-pan` | Mood boards, gallery exploration |

**Click & Tap (6):**
| Module | Slug | Best For |
|--------|------|----------|
| View Transition Morphing | `view-transitions` | Page transitions, card-to-detail expansion |
| Particle Button | `particle-button` | CTA buttons with burst effect on click |
| Odometer Counter | `odometer` | Stats sections, rolling mechanical number counters |
| 3D Coverflow Carousel | `coverflow` | Testimonial or portfolio carousels |
| Dynamic Island | `dynamic-island` | Notification bars, status indicators |
| macOS Dock | `dock-nav` | Navigation bars with magnification effect |

**Ambient & Auto (7):**
| Module | Slug | Best For |
|--------|------|----------|
| Text Scramble | `text-scramble` | Headlines that decode character-by-character (Matrix-style) |
| Kinetic Marquee | `kinetic-marquee` | Brand strips, tech stacks, service lists — scroll-reactive speed |
| Mesh Gradient | `mesh-gradient` | Animated background blobs, ambient atmosphere |
| Circular Text | `circular-text` | Spinning badge/stamp elements |
| Glitch Effect | `glitch-effect` | Tech/hacker aesthetic headlines |
| Typewriter | `typewriter` | Sequential text reveal with blinking cursor |
| Gradient Stroke Text | `gradient-stroke` | Outlined text with animated gradient fill |

### Key Implementation Patterns (from the modules)

**3D Tilt Cards (from cursor-reactive):**
```javascript
card.addEventListener('mousemove', function(e) {
  var rect = card.getBoundingClientRect();
  var x = (e.clientX - rect.left) / rect.width - 0.5;
  var y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = 'perspective(600px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg) scale(1.02)';
  // Spotlight gradient follows cursor
  spot.style.background = 'radial-gradient(circle at ' + (e.clientX - rect.left) + 'px ' + (e.clientY - rect.top) + 'px, rgba(COLOR,0.06) 0%, transparent 60%)';
});
```

**Magnetic Button (from cursor-reactive):**
```javascript
btn.addEventListener('mousemove', function(e) {
  var rect = btn.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  btn.style.transform = 'translate(' + ((e.clientX - cx) * 0.3) + 'px,' + ((e.clientY - cy) * 0.3) + 'px)';
});
btn.addEventListener('mouseleave', function() { btn.style.transform = 'translate(0,0)'; });
```

**Cursor Glow (from cursor-reactive):**
```javascript
var glow = document.getElementById('glow');
var mx = 0, my = 0, gx = 0, gy = 0;
document.addEventListener('mousemove', function(e) { mx = e.clientX; my = e.clientY; });
function moveGlow() {
  gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
  glow.style.transform = 'translate(' + (gx - 250) + 'px,' + (gy - 250) + 'px)';
  requestAnimationFrame(moveGlow);
}
moveGlow();
```

**Spotlight Border Cards (from spotlight-border):**
```javascript
grid.addEventListener('mousemove', function(e) {
  grid.querySelectorAll('.spot-card').forEach(function(c) {
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});
```
```css
.spot-card::before {
  content: ''; position: absolute; inset: -1px;
  background: radial-gradient(circle 180px at var(--mx,50%) var(--my,50%), rgba(COLOR,.06), transparent);
  opacity: 0; transition: opacity .3s; pointer-events: none;
}
.spot-card:hover::before { opacity: 1; }
```

**Text Mask Reveal (from text-mask):**
```javascript
gsap.to('.mask-reveal', {
  clipPath: 'inset(0% 0 0 0)',
  ease: 'none',
  scrollTrigger: { trigger: section, start: 'top top', end: '60% bottom', scrub: 0.3 }
});
```

**Odometer Counter (from odometer):**
```javascript
// Build digit strips with 0-9, use ScrollTrigger once: true to trigger
// translateY to the target digit * strip height, with staggered transitionDelay per digit
strip.style.transform = 'translateY(-' + (target * h) + 'px)';
strip.style.transitionDelay = (i * 0.12) + 's';
```

**Kinetic Marquee (from kinetic-marquee):**
```javascript
// Clone .marquee-content for seamless loop
// Track ScrollTrigger velocity, add to base speed
// requestAnimationFrame loop: x -= (baseSpeed + scrollVelocity * 0.15) * speedMult / 60
```

**Zoom Parallax (from zoom-parallax):**
```javascript
// 3 depth layers: bg (scale 1→1.15), mid (scale 1→1.6, y -100), fg (scale 1→6, opacity→0)
// Product card fades in at 40-60% scroll, fades out at 75-90%
```

**Accordion Slider (from accordion-slider):**
```css
.accordion-panel { flex: 1; transition: flex 0.6s cubic-bezier(.16, 1, .3, 1); }
.accordion-panel:hover, .accordion-panel.active { flex: 5; }
/* Content inside: opacity 0 + translateY(10px) → revealed on hover with staggered delays */
```

**Text Scramble (from text-scramble):**
```javascript
// For each character: cycle through random chars (A-Z, 0-9, symbols) at intervals
// Resolve characters left-to-right with staggered timing
// Use JetBrains Mono for the mechanical/terminal feel
```

---

## Step 4: Deploy to Vercel

```bash
cd {project-folder}
npx vercel --yes --prod
```

Output: `https://{slug}.vercel.app`

---

## Output Structure

```
cinematic-sites/{business-slug}/
├── index.html              # Complete website
├── brand-card.html         # Visual brand analysis
├── extract.json            # Structured brand data
└── assets/
    ├── hero.jpg            # Generated scene image (source)
    ├── hero-loop.mp4       # Animation video (source only — NOT used by the site)
    └── frames/             # Extracted JPEG frames (THIS is what the site uses)
        ├── frame-0001.jpg
        ├── frame-0002.jpg
        └── ... (~121 frames at 24fps)
```

**The site only loads `assets/frames/`.** The MP4 is kept as source material but the `<canvas>` draws individual JPEGs. No `<video>` element in the final HTML.

Working directory: the current project directory, or a `cinematic-sites/` subfolder within it.

---

## Pause Points

| After | Action |
|-------|--------|
| **Step 1** | Show brand card. Confirm colors/copy. |
| **Step 2** | Show the user the generated image and video. Wait for approval. |
| **Step 3** | Open site in browser for review. |

---

## Example Output: IKEA RoomCraft

A cinematic microsite for a fictional IKEA room design service. Built with this skill.

**What it includes:**
- **Text Mask Reveal** as the opening section — "ROOM CRAFT" outlined text fills with IKEA yellow on scroll, with the flat-pack explosion video playing frame-by-frame behind it via canvas
- **Kinetic Marquee** — dark band scrolling room types (LIVING ROOMS, BEDROOMS, HOME OFFICES...) that speeds up with scroll velocity
- **Odometer Counter** — stats section with mechanical rolling digits (2,400K+ rooms, 96% satisfaction, 48hr delivery, $0 consultation)
- **Sticky Stack** — how-it-works section with a pinned mockup on the left that updates as 3 step cards scroll past on the right
- **Spotlight Border Cards** with 3D tilt — service cards (Single Room $1,499, Whole Home $5,999, Room Refresh $499, Commercial) where borders illuminate and cards tilt under the cursor
- **Cursor glow** — subtle blue radial gradient following the mouse across the entire page
- **Magnetic CTA buttons** — pull toward cursor and snap back

**Theme:** Light (IKEA brand). Outfit + JetBrains Mono fonts. IKEA blue (#0058A3) accent, IKEA yellow (#FFDB00) CTAs.

This is the quality bar. Every cinematic site should feel this polished.

---

## Lessons Learned

1. **No vignettes, no wrapper containers.** Never darken hero edges with gradients. Never wrap all hero content in a single backdrop container. Use strong text-shadow on big headlines (h1), individual backdrop pills on each smaller text element (subtitles, taglines, CTAs, scroll hints).
2. **Canvas frames, not video.currentTime.** The video.currentTime approach stutters because browsers only seek to keyframes. Always extract JPEG frames with ffmpeg and draw on canvas via ScrollTrigger. This is buttery smooth.
3. **Individual backdrop pills on each small text element.** Taglines, subtitles, labels, scroll hints, CTAs each get their own `background: rgba(12,10,8,0.7); backdrop-filter: blur(4px); padding: 4px 14px; display: inline-block;`. Big headlines (h1) get strong text-shadow only, no background. Never wrap all hero content in a single backdrop container.
4. **Hero content wrapper is positioning only.** `.hero-content` uses `display: flex; flex-direction: column; align-items: center;` with minimal gaps (4-6px between subtitle elements, 16px before CTA). No background, no border, no border-radius, no backdrop-filter on the wrapper. Never let hero text elements spread apart.
5. **Cultural adaptation.** When a business has cultural identity (Japanese, Italian, French, etc.), lean into it: native language text, cultural fonts (Noto Serif JP, etc.), vertical text for Japanese (writing-mode: vertical-rl), cultural motifs as SVG dividers, native script in marquees, cultural farewell in footer.
6. **SVGs only.** Inline SVGs for all icons and visuals. Never emojis.
7. **Font contrast matters.** Body text #999 minimum on dark, #555 on light. --muted is for captions only. Small text over video gets backdrop pills.
8. **Fetch modules, don't guess.** `curl -sL http://localhost:{PORT}/{slug}` to get actual implementation code. Ask the user for the port on first run.
9. **One easing curve.** `cubic-bezier(.16, 1, .3, 1)` for all interactive transitions.
10. **Outfit + JetBrains Mono base.** Add brand-appropriate fonts as needed.
11. **Each module is self-contained.** Read its HTML, extract the CSS + JS, adapt colors to brand.
12. **Show a loader while frames pre-load.** Brand-relevant loading text, hide once enough frames are loaded (~40%).
13. **Unsplash verification.** Always fetch-check each Unsplash URL returns 200 before including. Broken images kill the premium feel.
14. **Canvas sizing: never use CSS width:100%/height:100% on the canvas element** — it causes scaling mismatch. Set pixel dimensions AND style dimensions explicitly in JS. The resize function must set `canvas.width`, `canvas.height`, `canvas.style.width`, and `canvas.style.height` to `window.innerWidth`/`window.innerHeight`. Never use `canvas.offsetWidth`, `devicePixelRatio` scaling, or `object-fit` on canvas.
15. **Hero text fades out on scroll.** Always add a GSAP ScrollTrigger that fades `.hero-content` to `opacity:0` and `y:-60` between 10-35% of hero scroll. This lets the user see the full video animation after the text clears.
