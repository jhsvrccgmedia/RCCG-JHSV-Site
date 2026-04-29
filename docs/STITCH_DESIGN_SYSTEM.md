# Stitch Design System: The Modern Sanctuary

> Pulled from the user's Google Stitch project (id `17983048888069511979`) via MCP.
> Mirror copy kept in the repo for reference.

---

# Design System Specification: The Modern Sanctuary

## 1. Overview & Creative North Star
**Creative North Star: "The Sacred Gallery"**
This design system moves away from the sterile, corporate "Blue/Grey" church templates of the past. Instead, it adopts a high-end editorial aesthetic that balances the ancient reverence of a sanctuary with the vibrant energy of a multicultural community. 

We achieve this through **The Sacred Gallery** approach: treating every screen like a curated exhibition. We utilize intentional white space, dramatic typographic scales, and the "Archway" motif to frame content. By breaking the rigid 12-column grid with overlapping elements and asymmetrical layouts, we create a digital experience that feels organic, human, and premium.

---

## 2. Color Strategy
Our palette is rooted in the warmth of tradition (Parchment and Plum) but ignited by the energy of the future (Coral Flame).

### The Foundation
- **Primary (Sanctuary Plum):** `#31032C` (Primary) to `#4A1942` (Container). Use this to ground the experience. It represents depth and history.
- **Secondary (Coral Flame):** `#AD3315` (Secondary) to `#E85D3C` (Accent). This is our "Life Force." Use it for action, motion, and highlighting growth.
- **Background (Parchment):** `#FDF9F3` (Surface) and `#F1EDE7` (Surface-Container). Never use pure white (#FFFFFF) for backgrounds; it feels clinical. Parchment provides a tactile, "paper-like" warmth.

### The "No-Line" Rule
To achieve a high-end feel, **prohibit the use of 1px solid borders for sectioning.** Boundaries must be defined through background color shifts. For example, a `surface-container-low` section should sit directly against a `surface` background. The change in tone is the divider.

### Signature Textures & Glassmorphism
- **Tonal Gradients:** For primary CTAs or Hero backgrounds, use a subtle radial gradient from `primary` (#31032C) to `primary_container` (#4A1942). This adds "soul" and prevents the design from looking flat.
- **Glassmorphism:** For floating navigation bars or over-image modals, use `surface` at 80% opacity with a `20px` backdrop-blur. This allows the vibrant colors of our photography to bleed through, creating an integrated, modern feel.

---

## 3. Typography: Editorial Authority
We pair a high-contrast serif with a functional neo-grotesque to create a "New Tradition" hierarchy.

- **Display & Headlines (DM Serif Display, 400):** Use for all `display-lg` through `headline-sm`. This font is our "Voice." It should be used sparingly but with high impact. Headlines should often be "Tightened" (letter-spacing: -0.02em) to feel like a premium magazine title.
- **UI & Body (Manrope, 400-600):** This is our "Utility." Manrope's geometric nature provides a modern counter-balance to the serif. 
    - **Body-LG:** 1rem / 1.6 line-height for readability.
    - **Title-SM:** 1rem / 500 weight for UI labels and sub-navigation.

---

## 4. Elevation & Depth
Depth is not created with "boxes," but through **Tonal Layering.**

- **The Layering Principle:** Instead of shadows, stack your surface tokens.
    - *Base:* `surface` (#FDF9F3)
    - *Content Block:* `surface_container_low` (#F7F3ED)
    - *Interactive Card:* `surface_container_highest` (#E6E2DC)
- **Ambient Shadows:** Shadows should be used only for elements that physically "float" (like a Pill Button or a Modal). Use the `on_surface` color at 6% opacity with a 32px blur and 8px Y-offset. This mimics natural light.
- **The "Ghost Border":** If a container requires definition against a similar background, use the `outline_variant` token at **15% opacity**. This creates a "suggestion" of a border rather than a hard cage.

---

## 5. Components

### The Archway (Signature Motif)
The archway is not just a crop; it is a structural pillar.
- **Usage:** Apply a `border-radius: 50% 50% 0 0 / 30% 30% 0 0` to hero images, image galleries, and decorative shapes. 
- **Creative Tip:** Let an image in an Archway shape overlap a text block. This "breaking of the box" is what makes the design feel custom.

### Buttons (The Energy Pill)
- **Primary:** Pill-shaped (999px radius), 48px height. Use a subtle gradient of `secondary` to `secondary_container`. 
- **States:** On hover, increase the shadow spread and scale the button by 2% (1.02) to create a "pulsing" energetic effect.
- **Tertiary:** No background. Use `Manrope 600` in `Sanctuary Plum` with a 1px `Ghost Border` that only appears on hover.

### Cards & Content Lists
- **Rule:** No divider lines. 
- **Execution:** Use 32px of vertical white space to separate list items. For cards, use the `surface_container_low` background with the 20px border radius specified. 
- **Shadows:** Cards should use the "Ambient Shadow" (low opacity, high blur) to feel like they are resting on the page, not stuck to it.

### Inputs & Interaction
- **Input Fields:** Use a `surface_container_high` fill rather than a white background. This makes the text "Ink" pop. Use a `2px` bottom border in `secondary` only when the field is focused.

---

## 6. Do’s and Don’ts

### Do:
- **Asymmetry:** Place headlines off-center to create a sense of movement.
- **Whitespace:** Treat whitespace as a "color." If a section feels crowded, double the padding.
- **Scale:** Use the `display-lg` (3.5rem) size for short, punchy statements of faith.

### Don’t:
- **No Hard Borders:** Never use #000000 or high-contrast 1px lines to separate content.
- **No Corporate Blue:** Avoid any cool-toned blues or greys. Stick to the warmth of the Parchment and Plum.
- **No Center-Align Overload:** While some sections can be centered for reverence, overusing center-alignment makes the site look like a basic template. Use left-aligned editorial layouts for body content.

### Accessibility Note:
Always ensure `secondary` (Coral Flame) text on a `surface` (Parchment) background meets WCAG AA contrast ratios (4.5:1). If it falls short, darken the Coral to `secondary_fixed_variant` for small text.