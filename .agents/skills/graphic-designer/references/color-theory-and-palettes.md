# Color Theory, Accessibility & Palette Architectures

Color is the fastest emotional communicator in graphic design. A professional graphic designer does not pick random colors; every shade is mathematically calculated for harmony, emotional resonance, and accessibility.

---

## 1. The 60-30-10 Distribution Rule

A proven visual balance rule used in interior design, cinema, and UI/graphic design:

- **60% Dominant Base**: Canvas, page background, large surface cards (neutral white, deep obsidian, or soft slate). Sets the overall room temperature.
- **30% Secondary Structure**: Headers, borders, navigation panels, cards, secondary buttons, structural dividers.
- **10% High-Impact Accent**: Primary call-to-action buttons, key data highlights, focal illustrations, badges. Never let the accent exceed 15% or the eye won't know where to rest.

---

## 2. Color Harmonies & How to Build Them

Using the HSL color model `hsl(hue, saturation%, lightness%)`:

1. **Analogous Harmony** (Calm, unified, cohesive):
   - Adjacent hues within 30° on the color wheel.
   - Example (Medical/Wellness): Teal `hsl(175, 70%, 45%)` + Emerald `hsl(155, 65%, 45%)` + Mint `hsl(165, 80%, 90%)`.
2. **Complementary Harmony** (High energy, stark contrast):
   - Opposite hues (180° apart).
   - Tip: Keep one color desaturated or as an accent; never use both at 100% saturation.
   - Example (Fintech/Action): Deep Indigo `hsl(225, 60%, 25%)` + Electric Tangerine `hsl(25, 95%, 55%)`.
3. **Split-Complementary** (Sophisticated, nuanced):
   - One base color plus the two colors adjacent to its complement (150° and 210°).
4. **Monochromatic with Tone Modulation** (Ultra-premium, elegant):
   - A single hue varying only in Saturation and Lightness (from 98% lightness down to 8% darkness).

---

## 3. Accessibility & Contrast Ratios (WCAG 2.1)

Graphic designs must remain readable across all lighting conditions, screen types, and visual abilities:

| Standard | Target | Minimum Contrast Ratio |
| :--- | :--- | :--- |
| **WCAG AA** | Normal Body Text (< 18pt regular) | **4.5:1** |
| **WCAG AA** | Large Text (>= 18pt or >= 14pt bold) | **3.0:1** |
| **WCAG AA** | UI Components, Borders & Icons | **3.0:1** |
| **WCAG AAA** | Enhanced Normal Text | **7.0:1** |
| **WCAG AAA** | Enhanced Large Text | **4.5:1** |

*Never place light green or yellow text on a white background, or dark navy text on a black background.*

---

## 4. Curated Production Color Palettes

### Palette A: Modern Clinical & Pharmacy Tech (Clean, Trustworthy, Precision)
- **Canvas / Base (60%)**: `#F8FAFC` (Slate 50) / Dark: `#0B1120` (Midnight Navy)
- **Surface / Card (30%)**: `#FFFFFF` / Dark: `#1E293B` (Slate 800)
- **Primary Brand Accent (10%)**: `#0D9488` (Teal 600) / Neon Teal `#14B8A6`
- **Secondary Accent**: `#0284C7` (Sky 600)
- **Alert / Prescription Warning**: `#E11D48` (Rose 600)
- **Success / Stock Available**: `#16A34A` (Emerald 600)

### Palette B: Modern Dark Luxury / Sleek FinTech
- **Canvas / Base (60%)**: `#09090B` (Zinc 950 deep obsidian)
- **Surface / Card (30%)**: `#18181B` (Zinc 900) with `#27272A` (1px subtle border)
- **Primary Brand Accent (10%)**: `#6366F1` (Electric Indigo) or `#F59E0B` (Warm Amber Gold)
- **Muted Text**: `#A1A1AA` (Zinc 400)
- **High-Contrast Text**: `#FAFAFA` (Zinc 50)

### Palette C: Fresh Organic & Wellness
- **Canvas / Base (60%)**: `#FBFBFA` (Warm Alabaster)
- **Surface / Card (30%)**: `#F3F4EE` (Sage Mist)
- **Primary Brand Accent (10%)**: `#2D5A27` (Forest Green) or `#4D7C0F` (Olive Green)
- **Warm Counterpoint**: `#D97706` (Amber Ochre)

---

## 5. CSS Variable Implementation Pattern

```css
:root {
  /* HSL Base Tokens */
  --color-canvas: hsl(210, 40%, 98%);
  --color-surface: hsl(0, 0%, 100%);
  --color-surface-hover: hsl(210, 40%, 95%);
  --color-border: hsl(215, 20%, 88%);
  
  /* Typography Tokens */
  --color-text-primary: hsl(215, 25%, 15%);
  --color-text-secondary: hsl(215, 16%, 45%);
  --color-text-muted: hsl(215, 14%, 65%);

  /* Brand Accents */
  --color-brand-primary: hsl(173, 80%, 36%);
  --color-brand-primary-hover: hsl(173, 80%, 30%);
  --color-brand-glow: hsla(173, 80%, 36%, 0.15);

  /* Semantic Feedback */
  --color-success: hsl(142, 71%, 45%);
  --color-warning: hsl(38, 92%, 50%);
  --color-danger: hsl(350, 89%, 60%);
}

[data-theme="dark"] {
  --color-canvas: hsl(222, 47%, 7%);
  --color-surface: hsl(222, 40%, 12%);
  --color-surface-hover: hsl(222, 35%, 16%);
  --color-border: hsl(217, 28%, 20%);
  --color-text-primary: hsl(210, 40%, 98%);
  --color-text-secondary: hsl(215, 20%, 65%);
  --color-brand-primary: hsl(173, 75%, 45%);
}
```
