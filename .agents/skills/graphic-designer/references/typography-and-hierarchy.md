# Typography, Hierarchy & Micro-Layout

Typography represents 90% of web and graphic design. Masterful typography transforms basic text into an authoritative visual voice.

---

## 1. Modular Type Scales

Never pick arbitrary font sizes. Use a mathematical geometric progression based on a base size (usually 16px / 1rem).

### Recommended Ratio: **Major Third (1.250)** or **Perfect Fourth (1.333)**

```text
Level           Multiplier (1.25x)       Pixel Equivalent   Usage
Display / H1    1.25^4                  38.15px -> 38-40px Big marketing banners, page titles
Heading 2       1.25^3                  30.52px -> 30-32px Section titles, major modal headers
Heading 3       1.25^2                  24.41px -> 24px    Card headers, widget titles
Heading 4       1.25^1                  19.53px -> 20px    Sub-section headers, list groups
Body / Base     1.25^0                  16.00px -> 16px    Standard readable body copy
Caption / Meta  1.25^-1                 12.80px -> 12-13px Timestamps, badges, legal fine print
Micro-badge     1.25^-2                 10.24px -> 10-11px Pill tags, status indicators
```

---

## 2. Tested Typeface Pairings

A design must have at most **two** type families: one for display/personality, one for workhorse legibility.

| Aesthetic Style | Heading Font | Body Copy Font | Character & Personality |
| :--- | :--- | :--- | :--- |
| **Clean Tech & Clinical** | **Plus Jakarta Sans** (Bold) | **Inter** (Regular/Medium) | Modern, trustworthy, ultra-readable, clean digital product look. |
| **High-End Modern Brand** | **Outfit** or **Cabinet Grotesk** | **Plus Jakarta Sans** | Geometric, friendly, contemporary, premium SaaS/eCommerce. |
| **Editorial & Boutique** | **Playfair Display** or **Fraunces** | **Inter** or **Lora** | Sophisticated, organic, classic authority. |
| **Data & Technical POS** | **Space Grotesk** (600) | **Geist Mono** / **Roboto Mono** | Precise, quantitative, POS registers, barcodes, invoices. |

---

## 3. Micro-Typography & Optical Laws

### 1. Letter Spacing (Tracking)
- **Display & Headings (> 24px)**: Tighten tracking slightly (`letter-spacing: -0.02em` to `-0.03em`). Large characters naturally drift apart visually; tightening makes headers punchy and cohesive.
- **Body Copy (14px–18px)**: Default or optical neutral (`letter-spacing: 0` or `-0.005em`).
- **All-Caps & Small Badges (< 12px)**: Expand tracking significantly (`letter-spacing: 0.05em` to `0.1em`). Without extra letter-spacing, small uppercase letters clot together and strain the eyes.

### 2. Line Height (Leading)
- **Headings (24px–48px)**: `line-height: 1.1` to `1.25`. Never use 1.5 on large headings, or multi-line titles will look like disconnected paragraphs.
- **Body Copy**: `line-height: 1.5` to `1.65`. Ample leading prevents the eye from skipping lines while reading paragraphs.

### 3. Measure (Line Length)
- Optimal line length for continuous reading is **45 to 75 characters per line** (approx. 500px to 680px container width). Text lines spanning 1200px across a full screen cause reader fatigue.

---

## 4. Visual Hierarchy Rules

1. **Size alone is not enough**: Combine size, weight (400 vs 600 vs 700), and color contrast (primary dark vs muted slate) to create unmistakable rank.
2. **The "Squint Test"**: Squint your eyes at the screen. Can you still tell what the primary headline is and where your eye should travel first? If the layout blurs into a uniform grey soup, hierarchy is broken.
3. **Avoid Pure Black Text**: Don't use `#000000` text on `#FFFFFF` backgrounds (causes optical vibration). Use rich dark tones like `#0F172A` (Slate 900) or `#18181B` (Zinc 900).
