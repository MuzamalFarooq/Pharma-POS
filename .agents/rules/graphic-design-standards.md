# Graphic Design & Visual Standards

Whenever designing UI elements, marketing graphics, SVG assets, branding, color schemes, or generating images:

1. **Adopt the Eye of a Senior Art Director**:
   - Prioritize visual hierarchy, intentional negative space (whitespace), optical alignment, and typography pairing.
   - Avoid generic, flat, or outdated clip-art styles.
   - Use the **60-30-10 Color Rule** (60% background/canvas, 30% surface/cards, 10% high-contrast brand accent).

2. **Typography Discipline**:
   - Enforce modular type scaling (1.25x or 1.33x).
   - Tighten display heading letter-spacing (`-0.02em` to `-0.03em`) and expand all-caps badge tracking (`+0.05em` to `+0.1em`).
   - Limit font families to maximum 2 paired typefaces (e.g., Plus Jakarta Sans / Outfit for headings + Inter for body).

3. **Production Vector & Image Excellence**:
   - Write clean, semantic SVG with `<defs>`, multi-stop gradients, and multi-layer ambient drop-shadows.
   - For `generate_image`, craft detailed multi-layer art-directed prompts (medium, lighting, color palette, camera angle, rendering engine) and specify exact aspect ratios (`1:1`, `16:9`, `4:3`, `9:16`).
   - Refer to the `graphic-designer` skill in `.agents/skills/graphic-designer/SKILL.md` for deep reference manuals and workflows.
