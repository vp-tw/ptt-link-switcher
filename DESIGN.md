# PTT Link Switcher Design System

## Direction

The creative north star is **Taiwan Routing Label**. Each conversion behaves like a physical dispatch manifest: one PTT reference resolves into a canonical route, then fans out into reader tickets. The interface combines a deep navy operations field, thermal-paper surfaces, clipped edges, routing rules, mono data, and acid chartreuse signals.

The product remains dense and editorial on desktop, explicit and touch-safe on mobile, and visibly deterministic rather than network-driven.

## Palette

| Token           | Value     | Use                                          |
| --------------- | --------- | -------------------------------------------- |
| Dispatch navy   | `#12213a` | Page field and dark actions                  |
| Routing ink     | `#17243b` | Paper text, rules, and borders               |
| Thermal paper   | `#f5f0df` | Manifest, canonical strip, and tickets       |
| Paper deep      | `#e7dfc8` | Reserved paper depth                         |
| Acid chartreuse | `#d8ff39` | Primary action, focus, default, verification |
| Acid hover      | `#e4ff72` | Interactive hover state                      |
| Signal red      | `#df493c` | Errors and route stamp                       |
| Muted navy      | `#49556a` | Supporting labels and route metadata         |

Acid chartreuse is an operational signal. Reserve it for actions, focus, selection, defaults, and verified states.

## Typography

- **Chinese display and body:** Noto Sans TC Variable. Use weight 800–900 for Chinese statements and section hierarchy, and regular/medium weights for interface copy and instructions. The bundled face keeps Traditional Chinese typography consistent across platforms.
- **English display:** Barlow Condensed, weights 700–800. Reserve it for the wordmark, provider names, stamps, and short routing labels.
- **Data:** IBM Plex Mono. Use for URLs, board names, article IDs, AIDs, and routing captions.

Never use display type for URLs or identifiers. Keep display tracking above `-0.04em` and body copy comfortably readable.

## Layout

The content container is `min(1480px, calc(100% - 48px))`, reduced to `14px` side gutters on narrow screens.

1. Compact identity header.
2. Large editorial introduction.
3. Full-width live-conversion manifest.
4. Canonical route strip after parsing.
5. Reader tickets ordered by preference.

Reader tickets use up to four equal columns on wide screens, two columns below `940px`, and one complete vertical list below `720px`. The default reader is visibly marked, while the saved order remains authoritative. Do not replace the list with a carousel, horizontal scroller, or hidden overflow.

Input changes update the canonical route and reader URLs after a short trailing debounce. The status panel communicates waiting, parsing, missing-board, error, and ready states without requiring form submission. Desktop tickets use a dedicated drag handle; narrow layouts expose explicit move controls instead of relying on touch drag gestures.

## Component grammar

- Use clipped or perforated ticket edges. Do not introduce generic rounded cards.
- Use predominantly `2px` navy routing rules and restrained dashed separators.
- Express depth through paper overlap and soft offset shadows. Do not use glass surfaces.
- Keep Copy and Open as equal, explicit actions within every provider ticket.
- Keep the direct GitHub repository link visible in the footer.
- Use native form controls, buttons, links, and disclosure behavior.

Paper surfaces use the bundled `/paper-texture.webp`. Provider marks and routing glyphs are authored SVG geometry bundled with the app. Do not add remote visual dependencies.

## Motion

Successful parsing stamps the canonical route. The route stamp uses a short scale-and-blur entrance. Reader tickets reserve transform for drag-and-drop positioning: the lifted ticket follows the pointer, the open position remains visible, and surrounding tickets move with a short FLIP transition.

Under `prefers-reduced-motion: reduce`, remove meaningful duration and delay while keeping the final parsed state visible.

## Accessibility

- Preserve semantic headings, landmarks, labels, and native controls.
- Keep visible acid focus outlines and at least `44px` interactive targets.
- Announce parse errors with `role="alert"` and copy results with a polite live status.
- Do not rely on color alone for error, selected, or default states.
- Recheck contrast whenever palette tokens change.
