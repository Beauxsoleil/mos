# Apple-Style Redesign — Research Report & Mockups

**Prepared:** September 8, 2026
**Scope:** Research Apple's design language (Human Interface Guidelines) and map it onto the current Idaho MOS Pathfinder interface. No code has been changed — this report is design-only, and the accompanying **`apple-mockup.html`** is a standalone, viewable mockup of every screen in the proposed style.

---

## 1. Summary

Apple's design language can make this app feel **faster, calmer, and more trustworthy** — all of which matter for 17–25-year-olds deciding whether to talk to a recruiter. The plan below keeps the app's Idaho identity and its privacy-first honesty, but rebuilds the *chrome* (navigation, forms, cards, buttons, typography) on Apple's three principles: **Clarity, Deference, Depth**. The result is a design that reads as "premium, native, and effortless" rather than "government form."

The single biggest visual shifts:

1. **System typography** — San Francisco (SF Pro) with a strict Dynamic Type-style scale, instead of the current mixed-size headings.
2. **Layered, translucent surfaces** — frosted-glass navigation and sheets (vibrancy materials) with **no heavy borders or drop shadows on cards**.
3. **Semantic, adaptive color** — light/dark variants of the same tokens, with one accent tint used sparingly.
4. **iOS navigation patterns** — a translucent **tab bar** (bottom) and **grouped "Settings-style" inset lists** for the form, replacing the current boxy fieldset cards.
5. **Consistent 44pt touch targets** and an 8pt spacing grid.

---

## 2. Research — what Apple's design language actually is

Apple's system is defined by the **Human Interface Guidelines (HIG)** (developer.apple.com/design), built on three long-standing principles, with **Consistency** as the connective tissue [1](https://superdesign.dev/blog/apple-design-system) [2](https://www.nadcab.com/blog/apple-human-interface-guidelines-explained):

| Principle | Meaning | What it forces us to do |
|---|---|---|
| **Clarity** | Legible at all sizes, icons precise, no ornament that obscures function | Cut decorative clutter; let text size/weight carry hierarchy |
| **Deference** | UI serves content, never competes with it | Thin chrome, minimal borders, content fills the screen |
| **Depth** | Layers, translucency, and motion convey hierarchy | Sheets float over content; nav bar blurs what scrolls under it |

### 2.1 Typography

- **San Francisco (SF Pro)** is the only system family. Use **SF Pro Text** ≤ 19pt and **SF Pro Display** ≥ 20pt; keep optical sizing on [2](https://www.nadcab.com/blog/apple-human-interface-guidelines-explained).
- Reference **Dynamic Type** scale (iOS Large, in pt): Large Title 34, Title1 28, Title2 22, Title3 20, Headline 17, Body 17, Callout 16, Subhead 15, Footnote 13, Caption1 12, Caption2 11 [1](https://superdesign.dev/blog/apple-design-system).
- Hierarchy comes from **weight, not extra fonts** — never add a second display face [3](https://github.com/rohitg00/awesome-claude-design/blob/main/design-md/glass/apple.md).
- On the web this is `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui` with `font-optical-sizing: auto`.

### 2.2 Color — semantic and adaptive

Apple does **not** ship fixed hex values; it ships **named, adaptive tokens** (`label`, `secondaryLabel`, `systemBackground`, `systemBlue`, etc.) that shift for light/dark and increased contrast [1](https://superdesign.dev/blog/apple-design-system) [5](https://openclaw-skills.org/skills/apple-hig). Community-measured approximations:

| Token (role) | Light | Dark |
|---|---|---|
| `label` (primary text) | `#000` | `#fff` |
| `secondaryLabel` | `rgba(60,60,67,.6)` | `rgba(235,235,245,.6)` |
| `tertiaryLabel` | `rgba(60,60,67,.3)` | `rgba(235,235,245,.3)` |
| `systemBackground` | `#fff` | `#000` |
| `secondarySystemBackground` | `#f2f2f7` | `#1c1c1e` |
| `separator` | `rgba(60,60,67,.29)` | `rgba(84,84,88,.6)` |
| `systemBlue` (accent) | `#007aff` | `#0a84ff` |
| `systemGreen` | `#34c759` | `#30d158` |
| `systemOrange` | `#ff9500` | `#ff9f0a` |
| `systemRed` | `#ff3b30` | `#ff453a` |

Sources: [3](https://github.com/rohitg00/awesome-claude-design/blob/main/design-md/glass/apple.md) [4](https://gist.github.com/eonist/7b5abce6979ce4a272c5de57eb0fb550/).

### 2.3 Materials (vibrancy / Liquid Glass)

Translucent layers that blur the content behind them — Apple's signature "frosted glass." Reference alpha over `backdrop-filter: blur()` [3](https://github.com/rohitg00/awesome-claude-design/blob/main/design-md/glass/apple.md):

- **Thin** ~ `rgba(255,255,255,.6)`, **Regular** ~ `.78`, **Thick** ~ `.92` (invert for dark).
- CSS equivalent: `backdrop-filter: saturate(180%) blur(20px)`.

### 2.4 Layout & components

- **8pt spacing grid** (4pt subdivisions); **44pt minimum tap target** [1](https://superdesign.dev/blog/apple-design-system) [3](https://github.com/rohitg00/awesome-claude-design/blob/main/design-md/glass/apple.md).
- **Grouped inset lists** ("Settings-style") for forms; **segmented controls**; **tab bars** for primary nav; **sheets** for detail views.
- **Do / Don't** from the reference style guide [3](https://github.com/rohitg00/awesome-claude-design/blob/main/design-md/glass/apple.md):
  - ✅ One system tint per surface; SF Pro everywhere; radius + material (not borders).
  - ❌ Drop-shadow cards; hard 1px card borders; multi-tint surfaces; substituting Inter.

### 2.5 Motion, writing & accessibility

- **Motion:** physics-based, subtle; respect **Reduce Motion** [6](https://agentskills.so/skills/raintree-technology-apple-hig-skills-hig-foundations).
- **Writing:** concise, action-first button labels, sentence case; the app's new plain-language copy already aligns with this [6](https://agentskills.so/skills/raintree-technology-apple-hig-skills-hig-foundations).
- **Accessibility:** VoiceOver labels, Dynamic Type scaling, WCAG AA contrast (4.5:1), dark mode, increased-contrast modes — all built from the start [4](https://www.nadcab.com/blog/apple-human-interface-guidelines-explained) [6](https://agentskills.so/skills/raintree-technology-apple-hig-skills-hig-foundations).

---

## 3. Keeping the Idaho identity inside an Apple frame

A pure Apple look is *generic*. HIG has a **branding** section that explicitly allows a subtle custom tint and brand touches as long as they don't fight the system [6](https://agentskills.so/skills/raintree-technology-apple-hig-skills-hig-foundations). Recommendation:

- **Structure & chrome:** 100% Apple — SF Pro, tab bar, grouped lists, sheets, materials.
- **Accent tint:** replace `systemBlue` with a single **"Idaho green"** tint (derived from the current forest `#365044`, lightened for contrast: ~`#2f6b4f` light / `#4fd68a` dark) used *only* for primary actions, links, and selection states. Everything else stays neutral/system.
- **Imagery:** keep the Northwest palette and mountain motif as *content* (a hero illustration), never as chrome — that's the "deference" principle in action.

---

## 4. Screen-by-screen redesign

Each section states what changes and points to the corresponding screen in `apple-mockup.html`.

### Screen 1 — Home
- **Now:** centered hero copy + two buttons + a forest-panel with stats.
- **Apple-style:** translucent large-title nav bar ("Pathfinder"); content-first hero card; a single **full-width primary button** ("Check my eligibility") with a **bordered secondary** ("Browse all jobs"); a tinted **"What's in it for you"** card; a **privacy** card with a lock icon; a "Popular in Idaho" horizontal strip. Stats panel removed (deference — content over chrome).

### Screen 2 — Check eligibility (the form)
- **Now:** three boxy `fieldset` cards with bordered inputs in a 5-column grid.
- **Apple-style:** a **grouped inset list** on a `#f2f2f7` background. Section 1 "Line scores" = one rounded card with 10 rows (code + name on the left, numeric field on the right). Section 2 "Medical profile" = one row with an **iOS switch** ("All 1s — no restrictions"). Section 3 "Quick questions" = picker rows (label left, value + chevron right). A full-width primary button "Show my jobs" pinned at the bottom.

### Screen 3 — Your jobs (results)
- **Now:** cards with colored badges and a small explanation block.
- **Apple-style:** large title "Your jobs"; a headline summary ("12 jobs you qualify for · …"); a **green-tinted "Study these" card**; job **cards** (rounded `surface`, no borders) with a MOS code capsule, title, a **tinted status capsule**, and a "what to study" hint.

### Screen 4 — Job detail
- **Now:** a centered `<dialog>`.
- **Apple-style:** a **bottom sheet** with a grabber handle, large title (MOS + name), tinted badges, and grouped sections for "Why this result," "What to study," and "Next step" with primary/secondary buttons.

### Screen 5 — All jobs (careers)
- **Now:** filter cards + 3-column card grid.
- **Apple-style:** a **search field** (rounded gray fill + magnifier), a **segmented control** for categories, and a 2-column card grid of tinted job cards.

### Screen 6 — Dark mode
- Apple dark mode: pure-black background, `#1c1c1e` surfaces, brightened tints, `#0a84ff`-style accents, and the same layout. Shown as a dark variant of Home + Your jobs.

---

## 5. Proposed design tokens (web CSS)

Mapping the current `styles.css` variables to Apple-style tokens:

| Current (`:root`) | Apple-style token | Notes |
|---|---|---|
| `--ink #1d2822` | `--label` (semantic) | adaptive, not fixed green-black |
| `--forest #24362d` | accent tint (Idaho green) | used sparingly for actions |
| `--forest-2` | hover/tap state of accent | |
| `--sage`, `--sand`, `--cream` | replaced by system neutrals + one hero illustration | keeps Idaho via imagery, not chrome |
| `--paper #fffefa` | `--systemBackground` | pure white / pure black |
| `--line #cbd3cc` (borders) | `--separator` (hairlines only in lists) | cards lose their borders |
| `--danger/-warning/-success` | `systemRed/Orange/Green` | tinted capsules, not fills |
| `--shadow` (card drop shadows) | **removed** | depth via materials & elevation color, not shadows |
| `--radius 18px` | 12px lists / 20px cards / 14px buttons | concentric radii |

**Font stack:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif` with `font-optical-sizing: auto`.
**Scale:** Large Title 34 · Title1 28 · Title2 22 · Headline 17 · Body 17 · Subhead 15 · Footnote 13 · Caption 11 (px on web, mapped from pt).
**Spacing:** 8pt grid; **touch targets ≥ 44px** (already true in the current app — keep it).

---

## 6. The mockups

Open **`apple-mockup.html`** (served alongside the app) to see six phone-framed screens in the proposed style: Home, Eligibility form, Your jobs, Job detail sheet, All jobs, and dark-mode variants. Each is built with the exact tokens above (SF-style system stack, translucent nav/tab bars, grouped lists, tinted badges, no card borders or drop shadows). It is a static concept page — it doesn't touch `app.js`, `index.html`, or `styles.css`.

---

## 7. Risks & considerations

1. **Don't trade Idaho for Cupertino.** The recruiter-facing value of this app is "local and real," not "polished." Keep the Northwest imagery and honest caveats; use Apple's *structure*, not Apple's *sterility*.
2. **Accessibility is the real win.** Apple-style forces VoiceOver labels, Dynamic Type, dark mode, and AA contrast — all of which the current app already partially has. This redesign is an opportunity to finish that job, not to layer glass effects on top of inaccessible markup.
3. **Liquid Glass / heavy blur can hurt low-end Android.** Use blur as progressive enhancement; provide a solid fallback (`@supports` guard) so non-Safari/older browsers get opaque bars.
4. **Brand tint contrast.** The existing forest green is too dark for a primary button against white in light mode; lighten it (~`#2f6b4f`) and verify 4.5:1 for any text on it.
5. **Consistency with the report's plain-language work.** Apple's writing guidance (action-first, sentence case, concise) reinforces — not replaces — the earlier layman-language changes.

---

## 8. Suggested implementation order (for when you say "go")

1. **Token refactor** in `styles.css` — replace fixed palette with semantic light/dark tokens (§5).
2. **Layout chrome** — translucent large-title nav bar + iOS tab bar (mobile), keep desktop nav.
3. **Form → grouped inset list** with the iOS switch for PULHES.
4. **Cards & badges** — radius+material, tinted status capsules, remove borders/shadows.
5. **Detail → bottom sheet.**
6. **Motion & accessibility pass** — `prefers-reduced-motion`, focus rings, Dynamic Type-safe spacing.

**Sources:** [superdesign.dev Apple design system](https://superdesign.dev/blog/apple-design-system) · [nadcab HIG guide](https://www.nadcab.com/blog/apple-human-interface-guidelines-explained) · [rohitg00 Apple glass reference DESIGN.md](https://github.com/rohitg00/awesome-claude-design/blob/main/design-md/glass/apple.md) · [eonist HIG color in Figma gist](https://gist.github.com/eonist/7b5abce6979ce4a272c5de57eb0fb550/) · [openclaw-skills HIG skill](https://openclaw-skills.org/skills/apple-hig) · [raintree HIG foundations skill](https://agentskills.so/skills/raintree-technology-apple-hig-skills-hig-foundations) · [Apple HIG (official)](https://developer.apple.com/design/human-interface-guidelines/)
