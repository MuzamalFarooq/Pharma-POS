# Scalable Vector Graphics (SVG) Design & Crafting

SVGs are the lifeblood of crisp, scalable digital graphics. Unlike raster images, SVGs render flawlessly at any pixel density, can be animated via CSS, and boast negligible file sizes.

---

## 1. Golden Rules for Production SVG

1. **Always define a square or ratio-preserving `viewBox`**:
   - `viewBox="0 0 24 24"` for standard UI icons.
   - `viewBox="0 0 100 100"` or `0 0 200 200` for badges, logos, and emblems.
   - `viewBox="0 0 800 400"` for wide responsive illustrations and banners.
   - Omit explicit `width` and `height` in CSS or use `width="100%" height="100%"` with CSS control.
2. **Organize with Semantic `<g>` Groups**:
   - Separate `<g id="background">`, `<g id="shadows">`, `<g id="main-subject">`, and `<g id="accents">`.
3. **Master Gradients & Glows with `<defs>`**:
   - Use `<linearGradient>` with multiple color stops to avoid flat plastic looks.
   - Set `x1="0%" y1="0%" x2="100%" y2="100%"` for subtle 45-degree diagonal light flow.
4. **Use `<feDropShadow>` or CSS `filter: drop-shadow()`**:
   - SVG filters create soft dimensional depth without rasterizing the vector.

---

## 2. Reusable SVG Component Templates

### A. Modern Tech Badge / Seal with Gradient Ring

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="glassFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#F0FDFA" stop-opacity="0.7" />
    </linearGradient>
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0D9488" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Glowing Ambient Ring -->
  <circle cx="60" cy="60" r="50" fill="url(#glassFill)" stroke="url(#badgeGrad)" stroke-width="3" filter="url(#badgeShadow)" />
  
  <!-- Inner Decorative Cross / Plus (Pharmacy & Health Emblem) -->
  <path d="M52 38h16v14h14v16H68v14H52V68H38V52h14V38z" fill="url(#badgeGrad)" rx="3" />
  
  <!-- Subtle Specular Reflection Arc -->
  <path d="M30 42 A 40 40 0 0 1 80 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
</svg>
```

### B. Prescription Pill / Capsule Vector Illustration

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="pillTop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14B8A6" />
      <stop offset="100%" stop-color="#0D9488" />
    </linearGradient>
    <linearGradient id="pillBottom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="pillGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#0F766E" flood-opacity="0.2" />
    </filter>
  </defs>

  <g transform="rotate(-45 80 80)" filter="url(#pillGlow)">
    <!-- Top Half of Capsule -->
    <path d="M60 40 C60 25, 100 25, 100 40 L100 80 L60 80 Z" fill="url(#pillTop)" />
    <!-- Bottom Half of Capsule -->
    <path d="M60 80 L100 80 L100 120 C100 135, 60 135, 60 120 Z" fill="url(#pillBottom)" />
    <!-- Center Dividing Line -->
    <line x1="58" y1="80" x2="102" y2="80" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8" />
    <!-- Specular Highlight Sheen -->
    <path d="M68 35 L68 115" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.45" />
  </g>
</svg>
```

---

## 3. Designing Icons: The 24x24 Optical Grid

When crafting icons:
- Always use a standard `24x24` viewBox with a `2px` stroke weight (`stroke-width="2"`), `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Use a **2px inner padding padding safe-zone** (live area is 20x20).
- Align points to whole or half pixels (`.5`) to eliminate fuzzy anti-aliasing artifacts on low-DPI displays.
