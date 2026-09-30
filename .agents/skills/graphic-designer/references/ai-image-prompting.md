# AI Image Generation & Art Direction Guide

This guide details how to formulate master-level prompts for the `generate_image` tool to achieve gallery-grade, commercially viable imagery.

---

## Anatomy of a Master Prompt

A high-converting graphic design prompt is structured into 6 deliberate layers:

```
[Subject & Core Action] + [Style & Medium] + [Lighting & Atmosphere] + [Color Palette] + [Composition & Camera] + [Render Engine / Production Finish]
```

### Layer Breakdown

1. **Subject & Core Action**: The central focal element described with precision.
   - *Weak*: "A pharmacy counter"
   - *Master*: "A sleek, minimalist automated prescription dispensary counter with glowing digital status strip"

2. **Style & Medium**: Defines the artistic universe.
   - *3D / CGI*: "3D isometric render", "soft matte clay render", "hard surface industrial design", "frosted translucent acrylic glassmorphism"
   - *Photography*: "Editorial studio product photography", "cinematic film still", "35mm architectural photography"
   - *Illustration*: "Precision vector graphic", "modern flat tech illustration", "fine-line geometric art", "editorial risograph print"

3. **Lighting & Atmosphere**: Dictates drama, mood, and depth.
   - *Studio*: "Volumetric softbox lighting", "subtle rim light highlighting edge contours", "diffuse ambient lighting"
   - *Atmosphere*: "Clean high-key commercial lighting", "moody cinematic chiaroscuro with soft teal fill", "golden hour warm sunlight ray"

4. **Color Palette**: Guides the engine away from noisy, rainbow defaults.
   - Specify 2 to 3 deliberate colors: "monochrome graphite with vibrant emerald accents", "warm sand, deep navy, and frosted brass", "pastel slate blue and mint green"

5. **Composition & Camera**: Directs framing, focal distance, and perspective.
   - *Angles*: "Eye-level orthographic perspective", "macro close-up with shallow depth of field (f/1.8)", "dynamic 45-degree isometric angle", "centered symmetrical composition"
   - *Framing*: Leave breathing room for copy/UI if intended as a banner or background: "ample negative space on the left third for typography overlay"

6. **Render Engine & Polish**: Signals micro-detail fidelity.
   - Keywords: "Octane Render", "Unreal Engine 5 architectural visualization", "8k hyper-detailed", "clean edges", "award-winning Behance feature", "Dribbble trending aesthetic"

---

## Aspect Ratio Strategy for `generate_image`

| Aspect Ratio | Best Used For | Design Application |
| :--- | :--- | :--- |
| `1:1` *(Default)* | App icons, logos, badges, avatars, product packaging mockups, square social tiles. | Ideal for centered focal points, medallions, and iconography. |
| `16:9` | Hero banners, web headers, desktop wallpapers, YouTube / blog feature banners. | Allows horizontal breathing room; place focal point on the right or left third. |
| `9:16` | Mobile splash screens, Instagram/TikTok stories, vertical phone UI backdrops. | Vertical flow; keep primary subject in middle 60% safe zone. |
| `4:3` / `3:2` | Editorial articles, portfolio showcases, tablet display frames, brochure cards. | Classic photographic balance. |
| `2:3` / `3:4` | Poster designs, book covers, flyer prints, vertical card components. | Strong vertical hierarchy for headline + image + caption. |

---

## Negative Prompts & Pitfalls to Avoid

When generating assets for professional UI/Web and branding:
- **No Device Frames**: Never let the model generate laptops, monitors, or phones around the design unless the user explicitly asks for a device mockup.
- **No Hallucinated Gibberish Text**: Diffusion models often generate distorted fake typography. Ask for "clean visual without typography" or "blank clean label ready for typography", then add text using code, SVG, or HTML/CSS.
- **Avoid Over-saturation**: Avoid "rainbow", "hyper-colorful", or "psychedelic" unless specifically requested. Modern design values restrained, intentional palettes.
- **Avoid Clutter**: Avoid overly busy scenes with 20 tiny competing objects. Focus on 1–3 primary elements with negative space.

---

## Curated Prompt Recipes by Genre

### 1. Modern Healthcare / Pharmacy POS Asset
```text
Sleek, futuristic medical cross and pill capsule sculpted from frosted translucent glass and brushed anodized aluminum, subtle inner cyan glow, floating in pristine zero gravity, clean minimalist white and pale grey studio background, diffuse softbox lighting, Octane 3D render, ultra-high detail, professional pharmaceutical technology aesthetic
Aspect: 1:1
```

### 2. High-Tech Dashboard Hero Graphic
```text
Wide abstract technological landscape visualizing encrypted medical data streams and inventory networks, luminous teal and violet geometric pathways, sleek 3D isometric structures, dark mode aesthetic, dark slate background, volumetric fog, cinematic lighting, 8k resolution, elegant corporate tech
Aspect: 16:9
```

### 3. Minimalist Brand Logo / Mascot Mark
```text
Minimalist geometric logo emblem of an apothecary mortar and pestle fused with a modern leaf, pure vector silhouette style, monochromatic dark navy on seamless clean white background, golden ratio proportions, crisp vector edges, iconic and timeless trademark design
Aspect: 1:1
```

### 4. Empty State / Feature Illustration
```text
Charming 3D clay-style illustration of a smiling medicine bottle and clipboard with a checkmark, soft pastel color palette of sage green, blush, and ivory, clean soft lighting, smooth claymorphism texture, isolated on transparent white background, inviting friendly UI graphic
Aspect: 1:1 or 4:3
```
