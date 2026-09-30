# Layout, Grid Systems & Composition

Composition is the deliberate arrangement of visual elements to navigate the viewer's eye through information effortlessly.

---

## 1. The 8-Point Spacing Grid

All layout dimensions, paddings, margins, and component heights must be multiples of **8px** (with **4px** reserved for micro-spacers, icon gaps, and borders).

```text
4px  -> Micro gap (icon to label, inline tags)
8px  -> Compact padding (small buttons, pill badges)
16px -> Standard padding (card interiors, form field gaps)
24px -> Medium spacing (between related cards, header gap)
32px -> Large spacing (section margins, container gutters)
48px -> Macro spacing (page break between content blocks)
64px -> Hero spacing (top banner margins, marketing breaks)
```

### Why?
- Ensures mathematical visual rhythm.
- Eliminates guesswork for developers and designers alike.
- Matches standard screen display scaling (100%, 125%, 150%, 200%).

---

## 2. Reading Flow & Visual Scanning Patterns

Users do not read every word on a screen; they scan along predictable visual tracks:

1. **The Z-Pattern (Landing Pages & Marketing Banners)**:
   - Eye starts at Top-Left (Brand Logo).
   - Scans to Top-Right (Navigation / Action Button).
   - Sweeps down diagonally to Bottom-Left (Hero Value Proposition / Supporting Illustration).
   - Terminates at Bottom-Right (Primary Call-To-Action).
2. **The F-Pattern (Data-Dense Dashboards & POS Terminals)**:
   - Top horizontal bar (Search, Status, Notifications).
   - Second shorter horizontal bar (Metrics, Tabs, Quick Filters).
   - Vertical sweep down left column (Product tables, customer list, category drawer).

---

## 3. Gestalt Principles in Graphic Design

- **Proximity**: Elements placed close together are perceived as belonging to the same group (e.g., product title, dose, and SKU must be grouped closer together than to the price tag).
- **Similarity**: Visual elements sharing color, shape, or typographic weight are understood to perform the same function (e.g., all primary action buttons share the same gradient fill).
- **Continuity**: The eye naturally follows lines, arcs, or staggered cards across a canvas.
- **Figure-Ground**: The brain distinguishes between foreground subjects (sharp, high-contrast, illuminated) and background planes (soft blur, subtle dark tones, low contrast).

---

## 4. Multi-Layer Depth & Elevation (Shadows & Glassmorphism)

Never use harsh, single-layer black drop-shadows like `box-shadow: 0 4px 6px #000`.

### Modern Multi-Layer Ambient Elevation:

```css
/* Level 1: Subtle card hover */
.elevation-1 {
  box-shadow: 
    0 1px 2px 0 rgba(15, 23, 42, 0.05),
    0 1px 3px 1px rgba(15, 23, 42, 0.03);
}

/* Level 2: Floating dropdown / Modal */
.elevation-2 {
  box-shadow: 
    0 10px 25px -5px rgba(15, 23, 42, 0.08),
    0 8px 10px -6px rgba(15, 23, 42, 0.04);
}

/* Level 3: Glowing Brand Accent Element */
.elevation-glow {
  box-shadow: 
    0 12px 30px -4px rgba(13, 148, 136, 0.28),
    0 4px 10px -2px rgba(13, 148, 136, 0.12);
}

/* Frosted Glassmorphism Card */
.glass-panel {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
}

[data-theme="dark"] .glass-panel {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```
