# YSC POS — Design System

**Single source of truth for visual tokens and component patterns.**
Token values live in [`src/styles/theme.css`](../src/styles/theme.css) (`@theme inline` block). When the design changes, edit `theme.css` then this doc.

---

## 1. Brand identity

- **Aesthetic:** modern enterprise SaaS — minimal, premium, data-driven
- **Personality:** Professional, trustworthy, technical-but-approachable
- **Layout:** spacious, structured, accessible contrast
- **Avoid:** heavy gradients, decorative ornament, low-contrast type

---

## 2. Color tokens

All colors are exposed as Tailwind utilities (e.g. `bg-brand-navy`, `text-status-danger`). RGB values shown for reference.

### Primary

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| Navy | `#0B1E8A` | `bg-brand-navy` `text-brand-navy` | Primary action, headings, brand mark |
| Blue | `#0197FF` | `bg-brand-blue` `text-brand-blue` | Links, info, secondary accent |
| Yellow | `#FFC518` | `bg-brand-yellow` `text-brand-yellow` | CTAs (membership), tier-gold, highlights |

### Neutral

| Token | Hex | Tailwind |
|---|---|---|
| White | `#FFFFFF` | `bg-white` |
| BG | `#EAF2F8` | `bg-bg-page` |
| BG 2 | `#FBFCFD` | `bg-bg-page-2` |
| Gray-50 | `#F9FAFB` | `bg-gray-50` |
| Gray-100 | `#F3F4F6` | `bg-gray-100` |
| Gray-200 | `#E5E7EA` | `border-gray-200` |
| Gray-300 | `#D1D5DB` | `border-gray-300` |
| Gray-400 | `#9EA2AE` | `text-gray-400` (muted) |
| Gray-500 | `#6D717F` | `text-gray-500` |
| Gray-600 | `#4D5461` | `text-gray-600` (secondary) |
| Gray-700 | `#394050` | |
| Gray-800 | `#212936` | |
| Gray-900 | `#111827` | `text-gray-900` (primary) |

### Semantic / Status

| Token | Foreground | Background |
|---|---|---|
| Success | `#27AE60` (`text-status-success`) | `#E8F6EE` (`bg-status-success-bg`) |
| Warning | `#F2994A` (`text-status-warning`) | `#FDF1E6` (`bg-status-warning-bg`) |
| Danger / Error | `#FF0000` (`text-status-danger`) | `#FFE5E5` (`bg-status-danger-bg`) |
| Info | `#0197FF` (`text-status-info`) | `#EBF6FF` (`bg-status-info-bg`) |

### Extended Scale / Soft

| Token | Hex | Tailwind |
|---|---|---|
| Blue Light | `#56CCF2` | `bg-blue-light` |
| Yellow Hover | `#F4D76A` | `bg-yellow-hover` |
| Yellow Soft | `#FFF4CC` | `bg-yellow-soft` |

### Extended Scale / Blue

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| Blue-100 | `#EBF6FF` | `bg-blue-100` | F-key button bg |
| Blue-300 | `#56CCF2` | `bg-blue-300` | |
| Blue-500 | `#2D9CDB` | `bg-blue-500` | |
| Blue-700 | `#1D4ED8` | `bg-blue-700` | |
| Blue-900 | `#0B1E8A` | `bg-blue-900` | = Navy |

### Member tier

| Tier | Bg | Text |
|---|---|---|
| Prospect | Gray-100 | Gray-600 |
| Member | Blue `#0197FF` | white |
| Silver | Gray-300 | Gray-800 |
| Gold | Yellow `#FFC518` | Gray-800 |
| Platinum | Gray-700 | white |
| Diamond | Navy `#0B1E8A` | white |

### Semantic text colors

| Token | Use | Hex |
|---|---|---|
| `text-text-primary` | body main | `#111827` |
| `text-text-secondary` | body secondary | `#4D5461` |
| `text-text-muted` | hint / disabled | `#9EA2AE` |
| `text-text-link` | links | `#0197FF` |
| `text-text-on-dark` | inverse | `#FFFFFF` |

---

## 3. Typography

**Font family:** `Noto Sans Thai` (Google Fonts), fallback `system-ui`.

### Type scale

Each token encodes **size + line-height + font-weight** together. Use as Tailwind classes — `text-h1`, `text-c3`, etc.

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| **H1** `text-h1` | 56 / 64 | Bold (700) | Hero / display ("ยินดีต้อนรับกลับมา", "YSC POS") |
| **H2** `text-h2` | 44 / 52 | Bold | Page headline, big TOTAL amount |
| **H3** `text-h3` | 32 / 40 | Bold | Section title (`#POS-001`, dialog headers) |
| **H4** `text-h4` | 28 / 36 | Bold | Card title ("Walk-in Customer", "ไม่มีสินค้าที่เลือก") |
| **H5** `text-h5` | 24 / 30 | Bold | "F1" hotkey, form labels, button labels |
| **S1** `text-s1` | 22 / 28 | Bold | Subtitle (cashier name, totals amounts) |
| **S2** `text-s2` | 20 / 26 | Bold | Section header in sidebar ("ข้อมูลลูกค้า") |
| **B1** `text-b1` | 22 / 28 | Regular | Body large |
| **B2** `text-b2` | 22 / 28 | Medium | Body large emphasized (login inputs, promo cards) |
| **B3** `text-b3` | 20 / 26 | Regular | **Body default** (`<body>`, search bar, table cells) |
| **B4** `text-b4` | 20 / 26 | Medium | Body emphasized (F-key Thai labels) |
| **C1** `text-c1` | 18 / 26 | Regular | Caption / label (form labels, totals rows) |
| **C2** `text-c2` | 16 / 22 | Medium | Caption small |
| **C3** `text-c3` | 14 / 20 | Medium | Caption micro (date, IDs) |
| **Btn Giant** `text-btn-giant` | 20 / 26 | Bold | Giant CTA |
| **Btn Large** `text-btn-large` | 18 / 22 | Regular | Large button |
| **Btn Medium** `text-btn-medium` | 14 / 20 | Regular | Medium button |

**Native HTML defaults** (in `@layer base`):
- `<body>` → B3 (20/26 Regular)
- `<h1>` → H1, `<h2>` → H2, … `<h5>` → H5, `<h6>` → S1
- `<small>` → C2

---

## 4. Spacing

4-point scale. Tailwind's `p-N` / `m-N` / `gap-N` work out of the box (`p-1` = 4 → `p-16` = 64).

| Token | px |
|---|---|
| `1` | 4 |
| `2` | 8 |
| `3` | 12 |
| `4` | 16 |
| `5` | 20 |
| `6` | 24 |
| `8` | 32 |
| `10` | 40 |
| `12` | 48 |
| `16` | 64 |

**Note:** Tailwind 4 `space-y-*` utility doesn't always generate in this setup — prefer `flex flex-col gap-N` for vertical row spacing.

---

## 5. Radius

| Token | px | Tailwind |
|---|---|---|
| `radius-sm` | 4 | `rounded-sm` |
| `radius-md` | 8 | `rounded-md` |
| `radius-lg` | 16 | `rounded-lg` |
| `radius-xl` | 24 | `rounded-xl` |
| `radius-2xl` | 32 | `rounded-2xl` |
| `radius-full` | 9999 | `rounded-full` |

**Form / button standard: `rounded-[12px]`** — every `<button>` in the POS app uses this exact radius (no `rounded-md` / `rounded-full` except where intentional).

---

## 6. Shadow

| Token | Use | Value |
|---|---|---|
| `--shadow-card` | resting cards | `0 1px 2px rgba(11,30,138,.04), 0 1px 3px rgba(11,30,138,.06)` |
| `--shadow-elev` | elevated (modals, popovers) | `0 4px 12px rgba(11,30,138,.08)` |
| `--shadow-focus` | keyboard focus ring | `0 0 0 3px rgba(11,30,138,.18)` |

Apply with `shadow-[var(--shadow-card)]`.

---

## 7. Motion

| Token | Value |
|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--duration-fast` | 200ms |
| `--duration-base` | 250ms |
| `--duration-slow` | 300ms |

Principles: smooth, minimal motion. Subtle scale (≤ 1.02) on hover. Soft fade-in for section enter.

---

## 8. Component patterns

### Button — [`src/app/components/ui/button.tsx`](../src/app/components/ui/button.tsx)

| Variant | Style |
|---|---|
| `default` (Primary) | Navy bg + white text + shadow-card |
| `secondary` | White bg + Navy border + Navy text |
| `ghost` | Transparent bg + hover bg-bg-hover |
| `destructive` | Status-danger bg + white text |
| `outline` | Border-default + bg-background |
| `link` | Brand-blue text + underline on hover |

Sizes: `default` (h-9), `sm` (h-8), `lg` (h-11), `icon` (size-9). **All radius `rounded-[12px]`.**

### Form input

```
h-12 px-4  border border-gray-300  rounded-[12px]
text-b3    focus:border-brand-navy  focus:ring-2 focus:ring-brand-navy/15
bg-white  (or bg-bg-page-2 for search inputs)
```

Icon left (Mail/Lock/Search/etc.), 20×20, gray-400.
Optional toggle right (eye / clear).

### Card

White surface, `rounded-[12px]` to `rounded-[16px]`, `shadow-[var(--shadow-card)]`. Use Gray-200 border for non-elevated containers.

### F-key button (POS-specific)

```
min-w-[120px] h-20 rounded-[12px]
bg-blue-100  (#EBF6FF)
hover:brightness-95
```

| Slot | Token | Color |
|---|---|---|
| Hotkey ("F1") | `text-h5` | Navy `#0B1E8A` |
| Action label | `text-b4` | Black |
| Icon | w-5 h-5 | Black |

### Promo / tip card

Status-tinted bordered pill — `bg-{color}-50/70` + `border border-{color}-200`. Tag icon + caption text in matching `text-{color}-700`. Use `text-b2` for caption.

### Status badge

`bg-status-{name}-bg` + `text-status-{name}` + `rounded-md` + tag icon.

### Customer card (Walk-in / dark)

Black bg `#111827`, `rounded-[16px]`, padding 16. Avatar circle (white/10 bg), name in H4 white, subtitle B3 white/70. Yellow `rounded-[12px]` CTA pill below.

### Total block (POS bottom-right)

Black bg `#111827`. Label "ยอดชำระสุทธิ (TOTAL)" in C2 white/85 stacked **above** amount. Amount in H2 Bold Yellow (`#FFC518`).

### Bottom totals breakdown (POS bottom-left)

White bg. 4 rows, `flex flex-col gap-1`:
- ยอดรวม / ยอดรวมของแถม → C1 secondary label + S1 Bold primary amount
- ส่วนลดโปรโมชัน / ส่วนลดท้ายบิล → C1 + S1 in `text-status-danger`

### Dialog patterns

All dialogs share:
- Fixed overlay `bg-black/50 backdrop-blur-sm`
- Container `bg-white rounded-[12px] shadow-2xl mx-4`
- Body padding `px-6 py-5`
- Footer `px-6 py-4 bg-bg-page` with two equal-width buttons

**Navy header dialogs** (CustomerSearch, RegisterMember):
- Navy bg `#0B1E8A`, h-14
- H5 white title + optional `text-c2 text-white/70` subtitle
- X close button (white)

**Hero header dialogs** (HoldBill, SupervisorAuth, HeldBills):
- Full-bleed colored header (Navy / red / orange)
- Large icon in `rounded-full border-2 border-white`, 80×80
- H3 white title + B3 white subtitle, centered

**Destructive (red) dialogs**:
- `bg: #FF0000`
- Red confirm button matching header color

### Quantity stepper

3 separated buttons with `gap-2`:
- `-` / `+`: 44×44 `rounded-[12px]` **bg-blue-100** border-sky-200 text-sky-500
- Number input: 48×44 `rounded-[12px]` border-sky-200 text-c1 ExtraBold center, `type="text"` `inputMode="numeric"` (no native spinner)

### Settings menu dropdown

Absolutely-positioned, transparent container (no card / shadow). Single yellow pill button — `bg-brand-yellow` text-navy with Power icon, S2 ExtraBold.

### Login page

- Split layout 48% / 52%
- LEFT: BG-login image with `rounded-[28px] m-5`, navy fallback. On top: 68×68 white `rounded-[12px]` logo card + "YSC POS" H1 yellow + 62px headline white + H4 white subtitle
- RIGHT: max-w-[500px] form, H1 navy "ยินดีต้อนรับกลับมา" + B2 secondary subtitle + 2 inputs (h-56 border-2 `rounded-[12px]`) + yellow submit (h-56 `rounded-[12px]` text-h5)

---

## 9. Layout

- **Grid:** 12-column responsive
- **Desktop main width:** ~1280px
- **POS layout:**
  - LEFT main: `bg-bg-page-2`, contains header (#POS-001 + F-keys), cart card (rounded-[16px] white), bottom totals
  - RIGHT sidebar: 380px, `bg-white`, customer card + promo cards + F11 button
- Prefer whitespace over visible separators

---

## 10. Accessibility

- Minimum body size **20px (B3)** — POS is a touch / large-screen device
- Focus ring uses `--shadow-focus` (Navy/18%) — always visible
- Status semantics use both color **and** icon (don't rely on color alone)
- Min touch target 40×40 (most CTAs are ≥ 44/48)
- Dialog overlays trap focus + close on backdrop click + Escape

---

## 11. File map

| File | Role |
|---|---|
| [`src/styles/theme.css`](../src/styles/theme.css) | All tokens + base resets + custom utility classes (`@layer utilities`) |
| [`src/styles/fonts.css`](../src/styles/fonts.css) | `@import` Google Fonts (Noto Sans Thai) |
| [`src/styles/tailwind.css`](../src/styles/tailwind.css) | Tailwind v4 entry (`@import 'tailwindcss'` + source globs) |
| [`src/styles/index.css`](../src/styles/index.css) | Composes the three above; loaded by `main.tsx` |
| [`src/app/components/ui/button.tsx`](../src/app/components/ui/button.tsx) | shadcn-style button with brand variants |
| [`src/app/pages/pos/POSScreen.tsx`](../src/app/pages/pos/POSScreen.tsx) | Main POS layout, F-keys, cart, totals, sidebar |
| [`src/app/pages/pos/POSLogin.tsx`](../src/app/pages/pos/POSLogin.tsx) | Split-screen login |
| [`src/app/pages/pos/CustomerSearchDialog.tsx`](../src/app/pages/pos/CustomerSearchDialog.tsx) | Customer search + change ("เปลี่ยนลูกค้า") modes |
| [`src/app/pages/pos/RegisterMemberDialog.tsx`](../src/app/pages/pos/RegisterMemberDialog.tsx) | Tabbed register (บุคคล/นิติบุคคล) |
| [`src/app/pages/pos/HoldBillDialog.tsx`](../src/app/pages/pos/HoldBillDialog.tsx) | 2-step hold bill flow (confirm → success with next actions) |
| [`src/app/pages/pos/HeldBillsDialog.tsx`](../src/app/pages/pos/HeldBillsDialog.tsx) | Bill list selector ("ดึงบิลจากรายการพักบิล") |
| [`src/app/pages/pos/SupervisorAuthDialog.tsx`](../src/app/pages/pos/SupervisorAuthDialog.tsx) | Supervisor credential prompt for destructive actions |

---

## 12. Public assets

| File | Use |
|---|---|
| `public/logo-ysc.png` | YONG CHAROEN brand logo (header + login) |
| `public/bg-login.png` | Login hero panel background image |
| `public/empty-cart.png` | Empty state illustration |
| `public/favicon.svg` | Browser favicon |

---

## 13. Quick reference snippets

```tsx
// Primary button (Navy)
<button className="text-btn-medium font-bold bg-brand-navy text-white rounded-[12px] px-6 h-11 shadow-[var(--shadow-card)]">
  ดำเนินการ
</button>

// Yellow CTA (membership)
<button className="text-s2 !font-extrabold bg-brand-yellow text-brand-navy rounded-[12px] px-6 h-12">
  สมัครสมาชิก
</button>

// Section title
<h2 className="text-h5 text-brand-navy">รายการสินค้า</h2>

// Caption / meta
<span className="text-c3 text-text-muted">8 พ.ค. 2569</span>

// Status pill
<span className="text-c3 px-2 py-0.5 rounded-md bg-status-success-bg text-status-success">
  สำเร็จ
</span>

// F-key
<button className="bg-blue-100 rounded-[12px] h-20 min-w-[120px] flex flex-col items-center justify-center gap-1">
  <span className="text-h5 text-brand-navy">F1</span>
  <span className="text-b4 text-black flex items-center gap-1.5">
    <Icon className="w-5 h-5" /> ค้นหาสมาชิก
  </span>
</button>

// Input
<input
  className="w-full h-12 px-4 border border-gray-300 rounded-[12px]
             text-b3 placeholder:text-gray-400 outline-none
             focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15
             transition"
  placeholder="..." />
```
