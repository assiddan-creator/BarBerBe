---
name: frontend-design
description: >-
  Bold, premium, futuristic UI design for web apps. Apply when styling components,
  layouts, typography, motion, or visual hierarchy. Inspired by anthropics/frontend-design
  principles: clarity, depth, and intentional restraint.
---

# Frontend design — premium & futuristic UI

Use this skill whenever you touch CSS, Tailwind, layout, or visual polish.

## Core principles

1. **Hierarchy first** — One primary focal point per screen; secondary actions recede (opacity, size, weight). Never compete with the hero.

2. **Depth without clutter** — Layer with subtle gradients, soft shadows, and glass/backdrop blur. Avoid flat gray boxes; prefer near-black surfaces (`#020203`–`#0a0a0f`) with cyan or accent glows.

3. **Motion with purpose** — Micro-interactions (hover glow, scan lines, pulse on loading). Keep durations 200–400ms; avoid gratuitous bounce.

4. **Typography** — Headings: wide tracking (`tracking-widest` / `0.1em+`), often uppercase for “system” labels. Body: readable contrast; pair monospace for telemetry / IDs.

5. **Color discipline** — One primary accent (e.g. neon cyan `#00FFD1`) and one secondary (electric blue). Use glow (`box-shadow` with rgba accent) instead of heavy outlines.

6. **Futuristic / biometric cues** — Corner brackets, scanning grids, “SYSTEM / MODULE / VECTOR” copy, data readout panels that float (shadow + blur), not boxed forms.

7. **Accessibility** — Maintain contrast for text; `aria-label` on decorative overlays; don’t rely on color alone for state.

## Anti-patterns

- Generic Bootstrap-gray cards on white.
- Uniform borders on every element; prefer glow or inset shadow.
- Emoji overload in professional HUD UIs (use sparingly).

## Checklist before shipping UI

- [ ] Primary CTA or hero is obvious in < 2 seconds.
- [ ] Hover/focus states on interactive elements.
- [ ] Loading states feel intentional (pulse, scan, not only spinner).
- [ ] RTL/LTR layout still aligns (logical properties where needed).
