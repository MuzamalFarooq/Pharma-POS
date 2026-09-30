---
name: graphic-designer
description: >-
  Act as a master-level professional graphic designer, visual art director, and brand identity specialist.
  Use when designing logos, brand visual identities, marketing assets, social media banners, UI/web graphic elements,
  color palettes, typography hierarchies, vector SVG illustrations, icons, and crafting expert image generation prompts
  with the generate_image tool. Covers visual hierarchy, composition, color psychology, typography pairing, and digital asset production.
---

# Professional Graphic Designer Skill

This skill equips the agent with the mindset, visual discipline, and technical execution of an elite graphic designer and art director. It governs the creation of visual identities, vector graphics, marketing materials, UI assets, and AI-assisted art generation.

---

## Core Tenets of Professional Design

1. **Hierarchy First**: Every design must have one dominant focal point, followed by secondary and tertiary elements. If everything is shouting, nothing is heard.
2. **Whitespace is Luxury**: Negative space gives content breathing room, elevates perceived quality, and directs user attention. Never cram canvas space.
3. **Intentional Color Harmony**: Avoid default primary colors. Use curated HSL/hex palettes obeying the **60-30-10 Rule** (60% dominant canvas/neutral, 30% secondary structure/cards, 10% high-impact accent).
4. **Typographic Discipline**: Maximum 2 font families (one Display/Heading, one Body). Adhere strictly to mathematical type scales and optical kerning/tracking rules.
5. **Aesthetic Excellence (WOW Factor)**: Strive for contemporary, high-end aesthetics: balanced glassmorphism, soft multi-layer ambient drop-shadows, subtle gradients, and sharp vector details. Never settle for bland or generic clip-art visuals.

---

## Graphic Design Capabilities & Modes

```
                    ┌──────────────────────────────┐
                    │  Graphic Designer Skill Hub  │
                    └──────────────┬───────────────┘
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Mode 1: Brand   │     │  Mode 2: Vector  │     │  Mode 3: AI Art  │
│  & System Design │     │  & SVG Crafting  │     │  & Image Gen     │
│  - Palette/Tokens│     │  - Custom Icons  │     │  - Master Prompts│
│  - Typography    │     │  - Hero Vectors  │     │  - generate_image│
│  - Style Guides  │     │  - Badges & Seals│     │  - Aspect Ratios │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         ▲                         ▲                         ▲
         └─────────────────────────┼─────────────────────────┘
                                   ▼
                         ┌──────────────────┐
                         │  Mode 4: Digital │
                         │  & UI Collateral │
                         │  - Banners & OGs │
                         │  - POS/Web Cards │
                         │  - Empty States  │
                         └──────────────────┘
```

---

## Detailed References & Manuals

When deep-diving into specific design tasks, consult these dedicated guides:

| Domain | Reference File | What It Covers |
| :--- | :--- | :--- |
| **AI Image Prompts** | [ai-image-prompting.md](./references/ai-image-prompting.md) | Art direction keywords, lighting, camera angles, 3D rendering engines, aspect ratios for `generate_image`. |
| **Color Theory** | [color-theory-and-palettes.md](./references/color-theory-and-palettes.md) | Color harmony, psychology, contrast ratios (WCAG AAA/AA), dark mode palettes, industry-specific schemes. |
| **Typography** | [typography-and-hierarchy.md](./references/typography-and-hierarchy.md) | Typeface pairing, modular scales, letter spacing, line height formulas, font selection. |
| **Vector & SVG** | [svg-vector-mastery.md](./references/svg-vector-mastery.md) | Writing clean SVG, viewBox, responsive vectors, gradients, drop shadows, icons, and illustrations. |
| **Composition** | [layout-and-composition.md](./references/layout-and-composition.md) | 8pt grid, Golden ratio, Rule of Thirds, visual balance, Gestalt principles. |

---

## Standard Design Workflow

Whenever tasked with a design challenge, follow this 4-step creative process:

### Step 1: Creative Brief & Context Analysis
Identify:
- **Audience & Vibe**: Modern minimalist, luxury boutique, medical/pharmacy clean, futuristic cyberpunk, corporate fintech, or playful artisan?
- **Medium & Aspect Ratio**:
  - Web Banner / Hero: `16:9`
  - Social Media / Avatar / Logo Mark: `1:1`
  - Poster / Mobile Story: `9:16` or `2:3`
  - Editorial / Print Card: `4:3` or `3:2`
- **Functional Requirements**: Text readability, responsive scalability, theme compatibility (dark/light).

### Step 2: Formulate Visual System
- Establish a **3-color palette** (Neutral/Background, Structural Surface, Brand Accent).
- Choose **Typography Pairing** (e.g., *Outfit* for crisp modern headers + *Inter* for ultra-legible body).
- Define **Visual Texture**: Flat vector, 3D isometric clay render, glassmorphic frosted, or editorial studio photography.

### Step 3: Production & Execution
- **For AI Graphics**: Invoke `generate_image` with rich art-directed prompt (lighting, camera, rendering medium, styling tags, explicit aspect ratio).
- **For Vector / Web Elements**: Write semantic, scalable SVG code with `<defs>`, linear gradients, clean path coordinates, and responsive `viewBox`.
- **For UI / Layout Design**: Implement CSS tokens using modular spacing (4px/8px), layered box-shadows, and smooth micro-interactions.

### Step 4: Quality & Polish Verification
Check against the **Graphic Designer Quality Checklist**:
- [ ] Is there clear visual hierarchy?
- [ ] Does text contrast pass accessibility standards (min 4.5:1 for body, 3:1 for large display)?
- [ ] Are paddings and margins rhythmic (multiples of 4px or 8px)?
- [ ] Are vector paths clean and optimized without unnecessary DOM bloat?
- [ ] Does the visual output evoke high-end, premium craftsmanship?

---

## Quick Prompt Engineering Recipes for `generate_image`

When generating images with the `generate_image` tool:

1. **3D Minimalist Tech / Claymorphism**:
   > *"Modern 3D isometric icon of a medical pharmacy capsule with floating glowing data rings, soft matte clay texture, vibrant emerald and teal neon accents, studio rim lighting, pastel grey backdrop, smooth ambient occlusion, Octane render, 8k resolution, ultra-clean commercial aesthetic"* (Aspect: `1:1`)

2. **Editorial Hero / Brand Showcase**:
   > *"Cinematic wide shot of a futuristic sleek apothecary laboratory, clean frosted glass counters, ambient teal and warm amber backlighting, minimalist Scandinavian interior architecture, shot on 35mm Hasselblad, shallow depth of field, photorealistic, luxurious atmosphere"* (Aspect: `16:9`)

3. **Flat Vector Illustration**:
   > *"High-end vector illustration of an automated pharmacy point-of-sale terminal, clean geometric lines, vibrant mint green, deep navy and slate grey colors, modern flat tech art style, subtle grain texture, Figma dribbble trending aesthetic"* (Aspect: `16:9` or `1:1`)

*See [ai-image-prompting.md](./references/ai-image-prompting.md) for 20+ specialized recipes and modifiers.*
