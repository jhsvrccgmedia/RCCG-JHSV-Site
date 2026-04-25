# Cinematic Sites Agent Kit

Transform any website into a cinematic experience with AI-generated 3D animations, scroll-driven effects, and one-click deployment.

> Give it a URL. It scrapes the brand, generates a cinematic hero animation, picks interactive effects, builds a premium single-file website, and deploys it live.

## What's Inside

```
.claude/skills/cinematic-sites/SKILL.md   ← The skill that builds the sites
cinematic-site-components/                 ← 30 interactive cinematic modules
examples/ikea-roomcraft/                   ← Working example site (open index.html)
```

## What It Does

1. **Brand Analysis** — Scrapes any business website for colors, fonts, copy, and identity
2. **Scene Generation** — Creates a cinematic 3D hero image (Nano Banana Pro) and animates it into video (Kling via WaveSpeed)
3. **Website Build** — Extracts video frames, picks 2-4 cinematic modules, and assembles a scroll-driven single-file HTML site
4. **Deploy** — Pushes to Vercel for free (optional)

## Quick Start

**Step 1:** Clone this repo

```bash
git clone https://github.com/robonuggets/cinematic-sites-agent-kit.git
```

**Step 2:** Add to Claude Code

```bash
claude --add-dir ./cinematic-sites-agent-kit
```

**Step 4:** Use it

Tell Claude Code to transform a website:

```
Transform this site into a cinematic experience: https://www.example.com
```

Or describe a business directly:

```
Build me a cinematic site for a luxury watch brand called Aurum
```

Or skip generation if you already have a video:

```
I already have a hero video at ./my-video.mp4 — build a cinematic site for a bakery called Sweet Dreams
```

## Setup — API Keys

### Google AI Studio (image generation — free)
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google, click "Create API key"
3. Set: `export GOOGLE_AI_STUDIO_KEY="AIza...your-key"`

### WaveSpeed (video generation — ~$0.50 per video)
1. Sign up at https://wavespeed.ai
2. Add credits at https://wavespeed.ai/billing ($5 gets ~10 videos)
3. Get key at https://wavespeed.ai/settings → API Keys → Create
4. Set: `export WAVESPEED_API_KEY="your-key"`

### Vercel (deployment — free, optional)
1. Install: `npm i -g vercel`
2. Run: `vercel login`
3. Free Hobby tier — unlimited static sites, SSL, custom domains

### ffmpeg (frame extraction — required)
```bash
# Mac
brew install ffmpeg

# Windows
choco install ffmpeg

# Linux
sudo apt install ffmpeg
```

## Example Output

Open `examples/ikea-roomcraft/index.html` in a browser to see a working cinematic site.

**IKEA RoomCraft** — a cinematic microsite for a fictional IKEA room design service:

- **Text Mask Reveal** — "ROOM CRAFT" fills with IKEA yellow on scroll, with a flat-pack explosion video playing frame-by-frame behind it
- **Kinetic Marquee** — dark band scrolling room types that speeds up with scroll velocity
- **Odometer Counter** — mechanical rolling digits for stats
- **Sticky Stack** — pinned mockup with step cards scrolling past
- **Spotlight Border Cards** with 3D tilt — service cards that illuminate and tilt under cursor
- **Cursor glow** — subtle radial gradient following the mouse
- **Magnetic CTA buttons** — pull toward cursor and snap back

This is the quality bar every generated site should hit.

## How It Works

| Step | What Happens | Cost |
|------|-------------|------|
| 1. Brand Analysis | Scrapes URL, extracts colors/fonts/copy, generates brand card | Free |
| 2. Scene Generation | AI generates hero image + animates into video | ~$0.50 |
| 3. Website Build | Extracts frames, picks modules, builds single-file HTML | Free |
| 4. Deploy | Pushes to Vercel | Free |

The agent confirms the cost before making any paid API call.

## Attribution

Created by Jay from RoboLabs. Learn more at [RoboNuggets](https://robonuggets.com)
