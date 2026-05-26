# chatbotlite — Design System v1.0

> **Lock these values.** Tokens live in `src/styles/tokens.css`, scoped to `:where(.chatbotlite-root)` so host CSS can't bleed in. Every component reads from tokens — zero hard-coded hex anywhere else.

---

## 1. Visual identity

**Positioning:** Calm, competent, modern messenger. Not "playful AI". Not "enterprise SaaS". Think of a clean front-desk concierge at a nice hotel — confident, quiet, gets out of the way. Visitors should not notice the widget, they should notice the answer.

**Primary inspiration: Telegram.** Not WhatsApp (too saturated green, too consumer-hospitality). Not Linear (too cold, too devtool grey). Telegram nails the sweet spot: clean neutral chrome, tail-bubbles, single-pill composer, tints brand color sparingly without drowning the UI. Secondary inspiration: Vercel chatbot template for the streaming AI feel.

**Visitor feeling:** "I can ask this and get a real answer, fast." Quiet trust. Not "wow", not "cute". The widget should feel like it belongs on the host site, not bolted on.

---

## 2. Color system

```css
/* Neutral chrome (independent of brand primary) */
--cbl-bg:           #FFFFFF;
--cbl-bg-elevated:  #F7F8FA;   /* incoming bubble, tool cards */
--cbl-bg-sunken:    #EFF1F4;   /* composer pill background */
--cbl-border:       #E5E7EB;   /* 1px hairlines */
--cbl-border-strong:#D1D5DB;   /* focused composer */
--cbl-divider:      #F0F1F4;   /* day separators */

/* Text — neutral, never tinted with brand */
--cbl-text:         #0F172A;   /* body */
--cbl-text-muted:   #64748B;   /* timestamps, subtitle */
--cbl-text-faint:   #94A3B8;   /* "Powered by", placeholder */

/* Semantic */
--cbl-success:      #10B981;   /* online dot */
--cbl-danger:       #EF4444;
--cbl-warning:      #F59E0B;

/* Brand-driven (computed from theme.primary) */
--cbl-primary:        <hex>;
--cbl-primary-hover:  <hex shifted -8% L>;
--cbl-on-primary:     auto;   /* see below */
--cbl-primary-soft:   color-mix(in oklab, var(--cbl-primary) 12%, white);
```

**Light primary handling:** Compute WCAG relative luminance of `primary`. If `L > 0.65` (yellow, lime, cyan, pale pink) → `--cbl-on-primary: #0F172A` AND outline the user bubble with `1px solid rgba(0,0,0,0.08)` so it doesn't melt into white background. Otherwise `--cbl-on-primary: #FFFFFF`.

**Dark mode:** Auto via `prefers-color-scheme: dark`, opt-out via `theme.colorScheme: 'light'`. Dark palette:
```
--cbl-bg: #0B0D10; --cbl-bg-elevated: #16181D; --cbl-bg-sunken: #1F2228;
--cbl-border: #24272E; --cbl-text: #ECEDEE; --cbl-text-muted: #9BA1A6; --cbl-text-faint: #6B7177;
```

**Brand restraint rule:** Brand primary appears in exactly 4 places: launcher button, user bubble fill, send button, focus ring. Nowhere else. Not the header (header is neutral white/dark). This is what lets the widget tolerate neon-pink primaries.

---

## 3. Typography

**Font stack:** System stack. Zero network cost, instant render, blends with host site.

```css
--cbl-font: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto,
            "Helvetica Neue", Arial, "Noto Sans", system-ui, sans-serif;
```

**Sizes** (fixed px so host `html { font-size }` can't break us):

| Element | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|
| Header title | 15px | 600 | 20px | -0.01em |
| Header subtitle ("online") | 12px | 500 | 16px | 0 |
| Bubble body | 14.5px | 400 | 21px | -0.005em |
| Composer input | 14.5px | 400 | 20px | -0.005em |
| Button text (tool card CTAs) | 13px | 600 | 16px | -0.005em |
| Tool card title | 13.5px | 600 | 18px | -0.005em |
| Footer "Powered by" | 10.5px | 500 | 14px | 0.02em |
| Timestamp / micro | 11px | 500 | 14px | 0 |

**Weights used:** 400 / 500 / 600 only. **Never 700+** (too heavy for messenger context). **Never italic.**

---

## 4. Spacing scale (4px base)

```
--cbl-space-1: 4px;  --cbl-space-2: 8px;  --cbl-space-3: 12px;
--cbl-space-4: 16px; --cbl-space-5: 20px; --cbl-space-6: 24px;
--cbl-space-7: 32px; --cbl-space-8: 40px;
```

**Bubble vertical gap:** 4px same-sender, 12px sender-change. Message group → divider: 20px.

---

## 5. Radius scale

```
--cbl-r-xs:   6px;    /* chips, inline badges */
--cbl-r-sm:   10px;   /* small icons bg */
--cbl-r-md:   14px;   /* tool cards */
--cbl-r-lg:   18px;   /* chat bubbles main corners */
--cbl-r-xl:   20px;   /* widget panel corners */
--cbl-r-pill: 22px;   /* composer pill */
--cbl-r-full: 9999px; /* launcher, avatar, send button */
```

**Bubble tail:** KEEP. User `border-radius: 18px 18px 4px 18px`, bot mirror `18px 18px 18px 4px`. Apply only to the LAST bubble in a same-sender group; consecutive bubbles get full 18px round — Telegram's exact rule.

---

## 6. Shadows (4 tiers)

```css
--cbl-shadow-1: 0 1px 2px rgba(15, 23, 42, 0.04);
  /* hairline lift — tool cards in light mode */
--cbl-shadow-2: 0 4px 12px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15,23,42,0.04);
  /* composer when focused, launcher resting */
--cbl-shadow-3: 0 10px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15,23,42,0.04);
  /* panel open (the whole chat window) */
--cbl-shadow-4: 0 20px 48px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15,23,42,0.08);
  /* launcher hover, modal-style tool cards */
```

**Bubbles have NO shadow — flat.** Shadows are for surfaces that float, not for content.

---

## 7. Motion

**Easings (only these three):**
```
--cbl-ease-out:    cubic-bezier(0.16, 1, 0.3, 1);     /* entrances */
--cbl-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);      /* hovers, color */
--cbl-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* launcher pop, send press */
```

**Durations:** 80ms (hover tints) · 160ms (button press) · 220ms (bubble enter) · 320ms (panel open) · 480ms (launcher first appear).

**Animates:**
- Bubble enter: `translateY(8px → 0) + opacity(0 → 1)`, 220ms ease-out
- Panel open: `scale(0.96 → 1) + opacity`, 320ms ease-out, `transform-origin: bottom-right`
- Send button press: `scale(1 → 0.92 → 1)`, 160ms spring
- Launcher hover: `scale(1.06)`

**Does NOT animate:** text content, avatars, header, scroll position (use instant scroll-to-bottom — smooth scroll feels laggy during streaming).

**Streaming cursor:** `▍` (U+258D, left half block), 1ch wide, `color: var(--cbl-primary)`, opacity blink 1 → 0.2 → 1 at 1.0s ease-in-out infinite. **NOT** `|`, **NOT** `█`, **NOT** ellipsis. The half-block is our signature (see §10).

---

## 8. Component rules

- **Avatar** — 32px circle in header; 28px next to bubbles (bot side only, last bubble of group). Fallback: first letter of `business.name`, 600 weight, white on `--cbl-primary-soft`. Border `1px solid var(--cbl-border)` to prevent disappearing on tinted backgrounds.

- **Bubble** — `max-width: 78%` (Telegram's exact value). Padding `8px 12px`. User: `--cbl-primary` bg, `--cbl-on-primary` text. Bot: `--cbl-bg-elevated` bg, `--cbl-text` text. Enter from below 8px.

- **Composer pill** — Height 44px, radius 22px, bg `--cbl-bg-sunken`, no border at rest. On focus-within: `1px solid var(--cbl-border-strong)` + `--cbl-shadow-2`. Icons 20px. Send button 36px circle, `--cbl-primary` fill, white `↑` (U+2191) at 16px. Disabled: `--cbl-bg-sunken` bg + `--cbl-text-faint` arrow.

- **Tool card** — Radius 14px, padding 16px, bg `--cbl-bg`, border `1px solid var(--cbl-border)`, `--cbl-shadow-1`. CTA inside uses `--cbl-primary`. Never put brand color on the card background — keeps readability when primary is loud.

- **Footer** — Height 28px, centered, font 10.5px/500, color `--cbl-text-faint`, copy: `Powered by chatbotlite ⚡`. The bolt is part of the wordmark — **never strip it**.

- **Launcher button** — 56px circle, `--cbl-shadow-2` rest / `--cbl-shadow-4` hover, `--cbl-primary` bg, white chat icon 24px. Entrance: `scale(0.7 → 1) + opacity`, 480ms ease-spring, 200ms delay after page load. Default position `bottom: 20px; right: 20px;`.

---

## 9. Voice + tone (UX copy)

- **Default greeting:** `Hi 👋 I'm {business.name}'s assistant. What can I help with?`
  - Single sentence. One emoji max. Customer-configurable but this is the default.
  - **Never** "How may I assist you today" (corporate), **never** "Hey there!" (cringe).

- **Typing indicator:** Three animated dots in a bot bubble. 8px circles, `--cbl-text-faint`, stagger 0/150/300ms, 1.2s loop. **No text label** — universal across languages.

- **Stream error:** `Sorry — I lost the connection. Tap to retry.` Tappable bubble retries the last user message. **Never** "An error occurred" (sterile), **never** "Oops!" (childish).

- **Tool acknowledgement pattern:** `Got it. {Action verb}-ing your {object} now…` → on complete → `Done. {Result in one line}.`
  - "Got it. Booking your appointment now…" → "Done. You're confirmed for Tue 3pm."
  - Verb-first, present-continuous → past-tense done. Predictable cadence builds trust.

---

## 10. The signature detail

**The half-block streaming cursor `▍`.**

When the bot is generating, the last character is followed by a solid 1ch-wide left-half-block in `--cbl-primary` color, blinking 1.0s.

- **Not** `|` (pipe — generic chat AI standard)
- **Not** `_` (typewriter underscore)
- **Not** ellipsis dots

Why this:
1. Visible in every screenshot taken of the widget mid-stream
2. Inherits customer's brand color → looks bespoke per site
3. Trivially cheap (one CSS keyframe)
4. Telegram/WhatsApp/Intercom/Crisp don't do it — they're not AI-native
5. Says "this is a streaming AI widget" without a label

On a screenshot, the colored `▍` next to half-rendered text → **"oh that's chatbotlite."**

---

## Implementation status

| Layer | Current | Target |
|-------|---------|--------|
| Tokens in CSS custom properties | ❌ hard-coded hex | ✅ `:where(.chatbotlite-root)` scope |
| Brand color restraint (4 places only) | ⚠ partial | full |
| Light-primary auto-contrast | ❌ | needed |
| Dark mode | ❌ | `prefers-color-scheme` |
| Telegram-style tail-on-last-bubble | ⚠ always on last only TBD | per-group |
| ▍ streaming cursor | ❌ current uses thin bar | switch to U+258D |
| Composer focus-within shadow | ❌ | add |
| Three-dot typing animation | ✅ existing | keep |
| Tool acknowledgement copy pattern | ❌ ad-hoc | enforce in prompts |

**This is the lock-down spec. Future PRs that touch UI must reference this doc.**
