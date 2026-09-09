# Idaho MOS Pathfinder — Enlistment UX, Language & Study-Guidance Report

**Prepared:** September 8, 2026
**Scope:** A review of the app's purpose, followed by researched recommendations to (1) make it something you can hand directly to applicants, (2) let them enter their own scores with confidence, (3) assume PULHES is all "1"s, (4) tell them *exactly* what to study when they aren't eligible yet, and (5) make the GUI feel native to 17–25-year-olds in Idaho.

---

## 1. Executive summary

The app is already a strong, unusually careful tool. It's a **mobile-first, privacy-first, static web app** that compares an applicant's ten Army line scores (and a few screening answers) against the **152 MOS records** in `data/mos.json` (sourced from the *DA PAM 611-21 Table 10-6 MOS and Line Score Wizard, April 2025*), and explains *why* each result came out the way it did. That "explain the result" behavior is rare and genuinely valuable.

To hit your four goals, the highest-leverage changes are:

1. **Study guidance (your biggest gap).** Today, when someone misses a line-score requirement, the app says only *"Focus study on the listed line-score area."* That's not actionable. It needs a **line-score → ASVAB subtest → study-topic map** so it can say, e.g., *"GT is built from Word Knowledge, Paragraph Comprehension, and Arithmetic Reasoning — study vocabulary, reading comprehension, and math word problems."*
2. **Applicant-facing language.** Several labels ("PULHES profile," "Split Training Option," "Potentially clearance eligible," "waiver scenario") are recruiter jargon a 17-year-old won't know. These need plain-language rewrites and inline "what does this mean?" helpers.
3. **PULHES = all 1s assumption.** Right now PULHES is six separate dropdowns. If you're going to assume all applicants are 1s, hide/collapse it behind a single "my PULHES is all 1s" confirmation rather than making them fill in six cryptic letters.
4. **GUI appeal.** The foundation (mobile-first, dark mode, no account, Idaho mountain palette) is right. Add social proof, education-benefit messaging, and a slightly more energetic, video-forward presentation — specifics in §8.

There is also **one factual correction to your brief** (described in §7): GT is English + Math, **not** Science. Getting this right matters because it changes what you tell applicants to study.

---

## 2. What the app actually does (purpose)

The app's purpose is to be a **private "which jobs could I get?" counselor** for people considering the **Idaho Army National Guard**. It answers four questions at once:

| Question | How it's answered |
|---|---|
| *Am I qualified for this MOS?* | Compares entered line scores, PULHES, color vision, citizenship, driver's license, clearance, and Split-Training-Option answers against per-MOS workbook rules. |
| *Is this job available in Idaho?* | Shows a time-stamped "availability" badge (Posting seen / Idaho catalog / Unverified) separate from qualification. |
| *Why am I not eligible yet?* | Each "not eligible yet" card names the exact failing requirement, the entered vs. required value, the point gap, and a next step. |
| *What should I do next?* | Points to the recruiter contact and lets them save a shortlist locally. |

**Inputs** (from `app.js` → `LINE_SCORES` and the form): the ten Army line scores **GT, GM, EL, CL, MM, SC, CO, FA, OF, ST**; six PULHES factors (P, U, L, H, E, S); color vision; U.S. citizenship; driver's license; clearance eligibility; Split Training Option; and a line-score waiver toggle.

**Outputs** (four result bands, in `resultSort`): **Eligible · Waiver scenario · Needs review · Not eligible yet**, each grouped by MOS category with a detail dialog.

**Architecture worth noting:** there is no backend. Everything runs in the browser, catalog is fetched from `./data/mos.json`, and the only persistence is `localStorage` (saved MOSs). This is exactly right for a tool you hand to applicants — nothing is transmitted, which you should keep prominent because it builds trust with this audience.

---

## 3. Where the app currently falls short of your four goals

### Goal A — "Send it to applicants and have them enter their own scores"

**Working in your favor:** the form already asks for the ten codes *exactly as they appear on a score report*, and the field help already warns *"these are composite line scores — not ASVAB percentile or raw subtest scores."*

**Friction points:**
- The ten inputs are **bare two-letter codes** with no plain-language name. An applicant staring at "GT," "GM," "EL," "CL," "MM," "SC," "CO," "FA," "OF," "ST" has no idea what they mean or which line on their sheet matches.
- There's no **"where do I find this on my score report?"** visual. A tiny annotated mock-up of a score sheet would remove ~90% of entry errors.
- The **PULHES section is six cryptic dropdowns** — an applicant who hasn't been through MEPS yet has no idea what "P — Physical capacity" means, and you've already decided to treat them all as 1s (see Goal C).
- Inputs are **not persisted** across a reload (see §9, minor bug).

### Goal B — "Assume all PULHES are already 1s"

Currently PULHES is a required, six-field section with options 1–4 and "Not yet rated." If your working assumption is that every applicant is all 1s, this section is **pure friction**: it adds six mandatory decisions that add no information and can only introduce error. Recommendation: collapse it to a single confirmation (see §9, item 2).

### Goal C — "Tell them exactly what to study"

This is the app's **single biggest functional gap.** The current copy in `nextStepFor()` (`app.js`) is:

> *"Focus study on the listed line-score area, then ask about retesting and score-improvement options."*

It names *no subtest, no subject, no resource, and no priority*. A 17-year-old reading "focus study on the listed line-score area" for a `GT` requirement learns nothing actionable. §7 provides the mapping you need to fix this.

### Goal D — GUI appeal to 17–25 in Idaho

The visual foundation is already unusually good for this audience: mobile-first, bottom nav on phones, dark mode via `prefers-color-scheme`, a mountain graphic, and an Idaho-inspired forest/sage/sand palette. What's missing is **energy and proof**: no real people, no short video moments, no education-benefit hook, and a fairly "government-brochure" tone in places. §8 covers this.

---

## 4. Research — plain-language best practices

The U.S. federal government maintains the reference standard for this: [plainlanguage.gov](https://www.plainlanguage.gov/) and the [18F Content Guide](https://guides.18f.gov/content-guide/), both cited throughout the DOL's plain-language guidance [1](https://www.dol.gov/agencies/eta/ui-modernization/use-plain-language/our-approach) and California's statewide standard [2](https://www.calhr.ca.gov/about-calhr/divisions-programs/deia-toolkit/templates-guides/plain-language-guide/). The consensus rules that apply directly to this app:

1. **Target grade 8 (or lower) reading level.** California law (Gov. Code §6219) and the DOL both specify grade 8 as the ceiling [2](https://www.calhr.ca.gov/about-calhr/divisions-programs/deia-toolkit/templates-guides/plain-language-guide/). A widely used, testable target is **Flesch-Kincaid grade 7–9** [5](https://contented.com/blogs/news/15346053-plain-language-on-government-web-sites-wcag-2-0-reading-level-sc).
2. **Sentences ≤ 20 words; paragraphs ≤ 50 words.** [4](https://www2.gov.bc.ca/gov/content/governments/services-for-government/service-experience-digital-delivery/web-content-development-guides/web-style-guide/writing-guide/writing-web-content), and the Smashing Magazine Gen-Z guidance independently arrives at the same 20/50 numbers [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/).
3. **Use "you," active voice, and everyday words.** "Assist" → "help," "discontinue" → "stop," "approximately" → "about" [4](https://www2.gov.bc.ca/gov/content/governments/services-for-government/service-experience-digital-delivery/web-content-development-guides/web-style-guide/writing-guide/writing-web-content).
4. **Define every acronym the first time it appears** — and prefer spelling it out every time in user-facing copy [2](https://www.calhr.ca.gov/about-calhr/divisions-programs/deia-toolkit/templates-guides/plain-language-guide/).
5. **Be actionable.** After reading, the user should know *what to do and in what order* [1](https://www.dol.gov/agencies/eta/ui-modernization/use-plain-language/our-approach).
6. **Inverted pyramid.** Most important information first; details and legalese below or behind a link [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/).

**What this means for the app:** the app's *methodology* content is appropriately technical (it's a source/audit page for people who care). But the *screening form, result cards, and study guidance* — the parts an applicant actually reads — should be rewritten to grade 6–8, second person, short sentences. A useful rule of thumb: **if a 17-year-old with a high-school reading level can't act on the sentence immediately, it's not plain yet.**

---

## 5. Research — design for 17–25-year-olds (Gen Z / Gen Alpha-adjacent)

Several consistent findings across sources [1](https://lucidrhino.design/blog/designing-genz/) [2](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/) [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/) [4](https://www.sprakdesign.com/generational-design-strategies/):

1. **Mobile-only, not just mobile-first.** This cohort is frequently on phones *exclusively*. Smashing Magazine specifically recommends **presenting every design mock-up mobile-view-first** [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/). The app already does mobile-first well; the test is "does it feel complete on a phone?" — review the results detail dialog and the 10-score grid at 360px.
2. **Speed and zero friction.** Slow load or clutter = immediate drop-off [5](https://medium.com/design-bootcamp/ux-for-gen-z-and-beyond-designing-for-emerging-behaviours-0d53cf2aa739). This app is a single static page with one JSON fetch — excellent. Keep it that way; avoid adding heavy frameworks or trackers.
3. **Visual-first, video-forward, authentic.** Gen Z responds to images, video, and real people over walls of text; and they distrust "polished marketing fluff" while trusting **authenticity and social proof** [1](https://lucidrhino.design/blog/designing-genz/) [2](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/). The app already links per-MOS videos — surface them more prominently (thumbnails, not just a "Watch MOS video" button).
4. **Progressive disclosure + micro-rewards.** Bite-sized interactions, progress indicators, and subtle gamification (progress bars, "X of 10 scores entered") work; "information overload" does not [2](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/) [5](https://medium.com/design-bootcamp/ux-for-gen-z-and-beyond-designing-for-emerging-behaviours-0d53cf2aa739).
5. **Accessibility and inclusivity are non-negotiable and expected.** Screen-reader compatibility, contrast, keyboard nav, dark mode, reduced motion [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/) [2](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/). The app already does a lot of this (skip link, `aria-live`, `prefers-reduced-motion`, dark mode). Protect and extend it.
6. **YouTube is a primary search/reference engine** for this group [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/) — another reason to lean into the video links.
7. **Authenticity > polish.** "No account, nothing sent to us, this is just a calculator" is *exactly* the kind of transparent, trust-building copy that lands with this audience. Keep it prominent.

---

## 6. The Idaho context — what resonates with this audience

Tailoring the tone and content to Idaho specifically is low-cost and high-impact:

- **Outdoor identity.** The existing forest/sage/sand palette and mountain graphic already nod to Idaho. Lean harder: reference rivers, public lands, hunting/fishing, and "the work we do here." Avoid generic Army-green camouflage default; keep the distinctive Northwest palette.
- **Education benefits are the single strongest hook for 17–25 in Idaho.** Idaho has one of the lower college-going rates in the country, and the Guard's tuition assistance (and programs at Boise State, Idaho State, CWI, Lewis-Clark State, College of Southern Idaho) is often the deciding factor. The app currently mentions *nothing* about education benefits. Adding one short, honest section ("What's in it for you: college paid, job skills, one weekend a month") would materially raise engagement. *Keep it accurate and point to the official source* ([serveinidaho.com](https://www.serveinidaho.com/)).
- **Community / family values.** This demographic in Idaho responds to belonging, not bravado. "Serve where you live" beats "become a warrior."
- **Real Idaho units & the reorganization.** The data already tracks the state's transition from an armored brigade to a **mobile infantry brigade** (source in `data/mos.json`). Mentioning current, real Idaho unit changes signals authenticity — this is "local and true," not canned marketing.
- **Jobs that actually exist in Idaho.** Combat arms (11B/11C infantry, 19D cavalry scout, 13B artillery), 12-series engineers, 68W medic, 88M/91B/92-series support — these are the Idaho Army National Guard's bread-and-butter. A small "popular in Idaho right now" strip (recruiter-confirmed, time-stamped like the existing availability badges) would make the catalog feel concrete.

---

## 7. The "what to study" engine — the core new feature

### 7.1 Correcting the brief (important)

You wrote: *"GT is a mix of math, science, and English skills."* **GT is English + Math, not Science.** Across every source the Army line-score formulas are consistent [1](https://uniontestprep.com/asvab/resources/a-beginner-s-guide-to-understanding-asvab-scoring) [2](https://asvabadvantage.com/asvab-line-scores-explained-and-what-military-jobs-you-qualify-for/) [3](https://asvabhero.com/army-asvab-score) [4](https://asvabdrill.com/posts/army-asvab-score):

- **GT (General Technical) = VE + AR**, where **VE (Verbal Expression) = Word Knowledge + Paragraph Comprehension**.
  - So GT = **English** (vocabulary + reading comprehension) + **Math** (Arithmetic Reasoning word problems).
  - **General Science (GS) is *not* in GT.** Science feeds **ST, EL, and GM** instead.

This matters because your "study these portions" message must be built from the *correct* subtests or you'll send an applicant to study science for a GT gap and waste their time.

### 7.2 The full line-score → subtest → study-topic map

Source for all formulas: uniontestprep and ASVABAdvantage (cross-checked against asvabhero, asvabdrill, battalionduty, LegalClarity) [1](https://uniontestprep.com/asvab/resources/a-beginner-s-guide-to-understanding-asvab-scoring) [2](https://asvabadvantage.com/asvab-line-scores-explained-and-what-military-jobs-you-qualify-for/) [3](https://asvabhero.com/army-asvab-score) [4](https://asvabdrill.com/posts/army-asvab-score) [6](https://battalionduty.com/blog/asvab-line-scores-explained/) [10](https://legalclarity.org/asvab-line-scores-explained-by-branch-and-subtest/).

| Line score | Name | Formula | Subtests you can actually study | Study topics (plain language) |
|---|---|---|---|---|
| **GT** | General Technical | VE + AR | Word Knowledge, Paragraph Comprehension, Arithmetic Reasoning | Vocabulary & synonyms, reading comprehension, math word problems |
| **GM** | General Maintenance | GS + AS + MK + EI | General Science, Auto & Shop, Math Knowledge, Electronics | Basic science, tools/auto, algebra & geometry, electricity/circuits |
| **EL** | Electronics | GS + AR + MK + EI | General Science, Arithmetic Reasoning, Math Knowledge, Electronics | Basic science, math word problems, algebra & geometry, electricity/circuits |
| **CL** | Clerical | VE + AR + MK | Word Knowledge, Paragraph Comprehension, Arithmetic Reasoning, Math Knowledge | Vocabulary, reading comprehension, math word problems, algebra & geometry |
| **MM** | Mechanical Maintenance | NO + AS + MC + EI | Auto & Shop, Mechanical Comprehension, Electronics (*NO is legacy — see note*) | Tools/auto, pulleys/gears/levers, electricity/circuits |
| **SC** | Surveillance & Comm | VE + AR + AS + MC | Word Knowledge, Paragraph Comprehension, Arithmetic Reasoning, Auto & Shop, Mechanical | Vocabulary, reading, math word problems, tools, mechanics |
| **CO** | Combat | AR + CS + AS + MC | Arithmetic Reasoning, Auto & Shop, Mechanical (*CS is legacy*) | Math word problems, tools/auto, pulleys/gears/levers |
| **FA** | Field Artillery | AR + CS + MK + MC | Arithmetic Reasoning, Math Knowledge, Mechanical (*CS is legacy*) | Math word problems, algebra & geometry, pulleys/gears/levers |
| **OF** | Operators & Food | VE + NO + AS + MC | Word Knowledge, Paragraph Comprehension, Auto & Shop, Mechanical (*NO is legacy*) | Vocabulary, reading, tools/auto, mechanics |
| **ST** | Skilled Technical | GS + VE + MK + MC | General Science, Word Knowledge, Paragraph Comprehension, Math Knowledge, Mechanical | Basic science, vocabulary, reading, algebra & geometry, mechanics |

**Legacy-subtest caveat (important for accuracy):** `NO` (Numerical Operations) and `CS` (Coding Speed) are **retired subtests** not administered on the current CAT-ASVAB; the Army substitutes a population-average "dummy" score for them [7](https://asvabhero.com/army-mos-list). So for **MM, OF (NO)** and **CO, FA (CS)**, the applicant can only move the needle on the *real* subtests listed. The study guidance should say so — e.g., for MM, "study Auto & Shop, Mechanical Comprehension, and Electronics" rather than pointing them at a test that no longer exists.

### 7.3 The subtest → subject dictionary (for generating study copy)

| Subtest | What it measures | Plain-language study guidance |
|---|---|---|
| WK — Word Knowledge | Vocabulary, synonyms | Flashcards, read daily, learn roots/prefixes |
| PC — Paragraph Comprehension | Reading & inference | Read short articles, practice main-idea questions |
| AR — Arithmetic Reasoning | Math **word problems** | Practice story problems, percents, ratios, rates |
| MK — Mathematics Knowledge | Algebra, geometry, HS math | Khan Academy algebra/geometry review |
| GS — General Science | Life/physical/earth science | Review basic bio, chem, physics, earth science |
| EI — Electronics Information | Circuits, current, voltage | Basic electricity & circuits intro |
| AS — Auto & Shop | Engines, tools, shop | Auto & shop basics, tool identification |
| MC — Mechanical Comprehension | Pulleys, gears, levers, fluids | Simple machines & mechanical principles |
| AO — Assembling Objects | Spatial reasoning | (Not in the 10 line scores but on the test) |
| NO / CS | Retired subtests | N/A — Army uses a dummy score |

Subtest definitions from the Air Force and study guides [1](https://www.airforce.com/asvab) [3](https://www.studyguidezone.com/asvabtest.htm) [5](https://militarytestprep.com/what-is-on-the-asvab/).

### 7.4 How this plugs into the code

The hook is already built and waiting. In `app.js`:

- `explainCriterion()` already computes the **point gap** and the failing key (e.g., "GT is 104; 110 is required (6 points short)").
- `nextStepFor()` currently returns the generic sentence for `Line score` failures.

Implementation: add a `STUDY_MAP` object (line score → list of `{subtest, topic}`), then have `nextStepFor()` (and the detail dialog's "Your path forward" section) emit, for each failing line score, something like:

> **How to raise your GT:** GT is built from Word Knowledge, Paragraph Comprehension, and Arithmetic Reasoning. Study vocabulary and reading comprehension, and practice math word problems. Ask your recruiter about retesting once you've prepared.

And for multi-score requirements (e.g., `ST>=100,GT>=110`), list the study areas per failing score, prioritizing the line with the **largest gap** first (the app already sorts by gap in `evaluateLineRule`).

**Free study resources to link (verify licensing/appropriateness before publishing):** Khan Academy (math/science), March2Success (official, free, from the Army/U.S. Army Recruiting Command), ASVAB practice via the official [TodaysMilitary](https://www.todaysmilitary.com/) materials. **March2Success is the strongest recommendation** because it's official, free, and directly aimed at ASVAB improvement — a trustworthy, non-scam link for exactly this audience.

---

## 8. GUI recommendations for 17–25-year-old Idahoans

**Keep (already excellent):** mobile-first layout, bottom nav on phones, dark mode, reduced-motion support, no-account/privacy-first copy, time-stamped availability badges, the Idaho forest/sage/sand palette.

**Add or change:**

1. **Surface the per-MOS videos.** Replace the tucked-away "Watch MOS video" button with **thumbnail cards** in the careers catalog and results. Video is this audience's native medium [1](https://lucidrhino.design/blog/designing-genz/) [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/).
2. **Add social proof — real Idaho guardsmen.** One short, authentic photo/video testimonial section ("Meet people serving in Idaho") will outperform any amount of copy. Ensure diverse, real representation [2](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/).
3. **Add an education-benefits strip.** A concise "What's in it for you" card: tuition assistance, job skills, one weekend a month — linking to the official source. This is the #1 hook for this Idaho demographic (§6).
4. **Add a progress indicator to the form.** "3 of 10 scores entered" + a completion bar. Tiny gamification, big perceived momentum [5](https://medium.com/design-bootcamp/ux-for-gen-z-and-beyond-designing-for-emerging-behaviours-0d53cf2aa739).
5. **Make results celebratory and scannable.** Show the big "X jobs you qualify for" count up top in a prominent, energetic way (the app already announces it — visualize it). Green "you qualify" cards should feel like a win, not a compliance report.
6. **Add a "popular in Idaho right now" strip** (time-stamped like existing availability data), showing the MOSs actually open locally.
7. **Tone check.** Replace brochure voice ("Explore potential paths," "counseling aid") with direct, plain, slightly more energetic copy where it faces the applicant. Keep the honest "not an official decision" caveats — authenticity is a feature, not a flaw [2](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/).
8. **Test at 360px.** Present every screen mobile-first; the 10-score grid and the detail dialog are the most likely to feel cramped [3](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/).

---

## 9. Concrete, prioritized code-level recommendations

Ordered by impact-to-effort. File/function references are exact.

### Priority 1 — Study guidance (Goal C)

- **`app.js`**: add `STUDY_MAP` (from §7.2) and a `studyCopyFor(lineScore)` helper.
- **`app.js` → `nextStepFor()`**: for `Line score` failures/waivers, return specific subtest+subject guidance per failing score, largest gap first.
- **`app.js` → `openDetail()` "Your path forward"**: append the study guidance.
- Link to **March2Success** and Khan Academy where relevant.

### Priority 2 — PULHES "all 1s" assumption (Goal B)

- **`index.html`**: replace the six-select PULHES fieldset with a single confirmation — e.g., a checkbox/label: *"My medical profile (PULHES) is all 1s — I have no known medical restrictions."*
- **`app.js` → `buildFormFields()` / `handleEvaluation()`**: when that confirmation is true, set `pulhes = {P:1,U:1,L:1,H:1,E:1,S:1}` and skip PULHES as a "fail" source. Keep an escape hatch ("I'm not sure / I have a profile") that reveals the six fields for edge cases, defaulting to the 1s assumption.

### Priority 3 — Applicant-facing language (Goal A + plain language)

- **`app.js` → `buildFormFields()`**: add the full name under each two-letter code (GT → "General Technical", etc.) and a `small` helper like "these codes match your score sheet."
- **`index.html` screening fieldset** — rewrite labels in plain language:

| Current (jargon) | Suggested (plain) |
|---|---|
| "Potentially clearance eligible" | "Can you pass a background/security check? (Yes / No / Not sure)" |
| "Split Training Option applicant" | "Are you still in high school and want the 'split' option (train one summer, finish school, then train again)?" |
| "Show line-score waiver scenarios" | "Show jobs where I'm close enough that a recruiter might request a score waiver" |
| "Color vision" | "Do you have normal color vision? (Normal / Red-green colorblind / No color vision / Not sure)" |

- **`app.js` → `eligibilityBadge()` / result copy**: "Waiver scenario" → "Close — may qualify with a waiver"; "Needs review" → "A recruiter needs to check this." Keep the official terms in the *detail* dialog for accuracy, but make the *labels* plain.
- Add an inline **"Where do I find my scores?"** expandable helper with a small annotated mock score-sheet graphic.

### Priority 4 — Small fixes & trust

- **`app.js`**: fix the dead `idahoMosInputs` reference — either persist form inputs (`localStorage.setItem` on submit) so applicants can come back without retyping, or remove the removeItem call (line 193).
- **`index.html` hero**: add a one-line **education-benefit hook** + keep the privacy callout front and center.
- Add **"popular in Idaho right now"** (recruiter-confirmed, time-stamped) strip if a reliable data source is available.

### Priority 5 — Visual energy (Goal D)

- Video thumbnails, progress bar, celebratory result count, real-person testimonials, and a mobile-first pass at 360px (§8).

---

## 10. Accuracy, risk, and disclaimer notes

1. **The line-score formulas must be documented and kept current.** The map in §7.2 is correct as of this report, but the app already wisely treats the April 2025 workbook as authoritative for *requirements*. Add a note on the methodology page stating the subtest formulas and their source, so the study guidance is auditable like everything else.
2. **Legacy subtests (NO/CS).** Do not tell applicants to "study Numerical Operations" or "Coding Speed" — those subtests are retired; the Army substitutes dummy scores [7](https://asvabhero.com/army-mos-list). Point them at the real subtests (§7.2 note).
3. **GT correction.** Reiterate internally: GT = English + Math (no science). If any team member or copy still says "math, science, and English" for GT, fix it — it will misdirect applicants.
4. **Waivers are never guaranteed.** The app already handles this carefully (non-GT waiver modeling, "approval is not guaranteed"). Preserve that tone when adding study copy — studying is *advice*, retesting is *their choice*, and only a recruiter can submit a waiver.
5. **Keep the "counseling aid, not a determination" disclaimer** — it's a legal and trust shield, and (per §5.7) transparency is a selling point with this audience.
6. **Verify external links** (March2Success, Khan Academy, benefit specifics) before publishing, and prefer official `.gov`/`.mil`/official-recruiting sources.

---

## 11. Suggested next steps

1. Approve the §7.2 study map and the PULHES "all 1s" collapse (both are self-contained and low-risk).
2. I implement **Priority 1–3** (study guidance, PULHES simplification, plain-language labels + "where to find my scores" helper) — these directly deliver your four goals.
3. A second pass does **Priority 4–5** (visual energy, social proof, education-benefit strip, persistence fix).
4. Run `node tests.mjs` after changes (the suite already validates explained-result behavior and will need a couple of new assertions for the study copy).

**Sources cited in this report:** plain language ([DOL](https://www.dol.gov/agencies/eta/ui-modernization/use-plain-language/our-approach), [CalHR](https://www.calhr.ca.gov/about-calhr/divisions-programs/deia-toolkit/templates-guides/plain-language-guide/), [BC Gov](https://www2.gov.bc.ca/gov/content/governments/services-for-government/service-experience-digital-delivery/web-content-development-guides/web-style-guide/writing-guide/writing-web-content), [Contented/WCAG reading level](https://contented.com/blogs/news/15346053-plain-language-on-government-web-sites-wcag-2-0-reading-level-sc)); Gen Z design ([Lucid Rhino](https://lucidrhino.design/blog/designing-genz/), [Aufait UX](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/), [Smashing Magazine](https://www.smashingmagazine.com/2024/10/designing-for-gen-z/), [Sprak](https://www.sprakdesign.com/generational-design-strategies/), [Medium/Bootcamp](https://medium.com/design-bootcamp/ux-for-gen-z-and-beyond-designing-for-emerging-behaviours-0d53cf2aa739)); ASVAB line scores & subtests ([Union Test Prep](https://uniontestprep.com/asvab/resources/a-beginner-s-guide-to-understanding-asvab-scoring), [ASVAB Advantage](https://asvabadvantage.com/asvab-line-scores-explained-and-what-military-jobs-you-qualify-for/), [asvabhero](https://asvabhero.com/army-asvab-score), [asvabdrill](https://asvabdrill.com/posts/army-asvab-score), [battalionduty](https://battalionduty.com/blog/asvab-line-scores-explained/), [LegalClarity](https://legalclarity.org/asvab-line-scores-explained-by-branch-and-subtest/), [Air Force](https://www.airforce.com/asvab), [Study Guide Zone](https://www.studyguidezone.com/asvabtest.htm), [Military Test Prep](https://militarytestprep.com/what-is-on-the-asvab/)).
