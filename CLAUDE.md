# Admin — Project Context

## Purpose

A blank admin frontend scaffold built on the Camp Design System (CDS). Business
logic, mock data, and PRDs from the original PSP project have been stripped out.
What remains is a runnable layout shell + the full CDS UI kit, ready for new
pages to be built on top.

Anchor references already in the tree:
- `/assets` — a **static** reference page (style anchor; copy its patterns)
- `/cds-guideline` — the living CDS showcase (every component, token, type scale)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript (strict) — CDS layer strict, pages may use `@ts-nocheck` until typed |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` in globals.css) |
| Accessible primitives | Headless UI v2 (Listbox, Dialog, Menu, Popover, Switch) |
| Routing | React Router v6 |
| Icons | lucide-react |
| Charts | Recharts |
| Font | HarmonyOS Sans (self-hosted TTF in public/fonts/) |

No i18n, no data layer, no mocks — these were removed. Add them back per-feature
if needed.

---

## Architecture Overview

```
src/
  components/
    cds/          ← Camp Design System — THE ONLY source for UI primitives
    layout/       ← AppLayout, Topbar, Sidebar, Footer, Logo
  hooks/          ← useTheme
  pages/          ← Page-level components, one folder per route
    Assets/       ← static reference page
    CDSGuideline/ ← CDS showcase
    Placeholder/  ← blank-page stub
  styles/         ← globals.css (tokens, type scale, animations)
  App.tsx         ← routes
  main.tsx        ← entry (CdsToastProvider + App)
```

### Layout Structure
- `Topbar`: `position: fixed`, `z-100`, frosted glass (`bg-(--surface-glass) backdrop-blur-md`)
- `Sidebar`: `position: fixed`, `z-90`, `top: var(--header-h)`
- `AppLayout`: `padding-top: var(--header-h)` to compensate for fixed topbar
- `AppLayout` content padding: unified `px-4 pt-3 pb-8 md:px-10` (16px mobile / 40px desktop)
- Pages must NOT define their own outer padding — it's controlled by AppLayout
- `Sidebar` profile menu uses a custom `createPortal` dropdown (not Headless UI Menu)

---

## CDS Rules — STRICTLY ENFORCE

### Typography — never use raw Tailwind text-* for font size
Always use `.type-*` utility classes defined in globals.css:

| Class | Size/LH | Use |
|---|---|---|
| `type-display-1` | 64/80 | Landing page hero |
| `type-display-2` | 56/74 | Landing page secondary |
| `type-display-3` | 40/58 | Landing page tertiary |
| `type-h1` | 34/48 | Page titles |
| `type-h2` | 28/40 | Card/section headers |
| `type-h3` | 24/32 | Sub-section headers |
| `type-h4` | 22/32 | Minor headers |
| `type-h5` | 18/28 | Small headers, emphasized body |
| `type-body-lg` | 16/24 | Intro / lead text |
| `type-body` | 14/20 | Default body |
| `type-body-sm` | 12/16 | Helper / secondary text |
| `type-caption` | 12/16 | Labels, meta, annotations |

Display classes are for landing pages only — never use in app UI.

Type classes define **size + line-height only**. Font weight and color are always
set separately via Tailwind utilities (`font-bold`, `text-(--text)`, etc.).

### Tokens — always use CSS custom properties
```
Colors:    text-(--text)  bg-(--surface)  border-(--border)
Accent:    text-(--accent)  bg-(--accent-subtle)  bg-(--accent-muted)
Status:    text-(--success)  bg-(--danger-bg)  border-(--warning-border)
           text-(--success-text)  text-(--danger-text)  — darker variants for soft badges/labels
Surfaces:  bg-(--bg)  bg-(--fill)  bg-(--surface-glass)
Disabled:  bg-(--disabled-surface)  text-(--disabled-text)
Shadows:   shadow-(--shadow-sm)  shadow-(--shadow-lg)  shadow-(--shadow-overlay)
Layout:    w-(--sidebar-w)  h-(--header-h)  px-(--sidebar-px)
Shape:     rounded-md (cds-radius 8px)  rounded-lg (cds-radius-lg 12px)  rounded-full
```
**Never** use: `text-sm`, `text-xs`, `text-base`, `text-gray-*`, hardcoded hex
colors in className, or raw rgba() values that have a token equivalent.

**Primitive palette is theme-agnostic** — single scale, 0=lightest, 1000=darkest.
Never reference palette stops (`--neutral-*`, `--purple-*`, etc.) directly in
components. Always use semantic tokens, which are defined per-theme (light/dark).

**Rounded scale is aligned with CDS tokens** via `@theme` overrides in globals.css:
`--radius-md` = `var(--cds-radius)` (8px), `--radius-lg` = `var(--cds-radius-lg)` (12px),
`--radius-full` = `var(--cds-radius-full)`. Use `rounded-md` / `rounded-lg` / `rounded-full`.

### CDS Components (src/components/cds/)
All exports via `index.ts`. All components export TypeScript interfaces (e.g.
`CdsButtonProps`, `CdsAvatarProps`, `BreadcrumbItem`, `ListboxOption`).

**基础控件**: `CdsButton` `CdsInput` `CdsCheckbox` `CdsRadio` `CdsSwitch` `CdsStackedListbox` `CdsSearchInput` `CdsSearchBox` `CdsEntityPicker`
**数据展示**: `CdsBadge` `CdsAvatar` `CdsSpinner` `CdsTable` `CdsTableSkeleton` `CdsTableState` `CdsMetricCard` `CdsTabs` `CdsPillTabs`
**导航**: `CdsBreadcrumb` `CdsPageHeader` `CdsMenuItem`
**叠层容器**: `CdsDropdownPanel` `CdsSubDropdownPanel` `CdsSubMenu`
**信息面板**: `CdsContextPanel` `CdsDetailList` `CdsDetailRow`

The full, live catalog is the `/cds-guideline` page (`src/pages/CDSGuideline/sections/`).

Notable patterns:
- `CdsTableState`: declarative state machine for table pages — wraps `isLoading/isFetching/isError` → skeleton/error/children
- `CdsTable`: `width: '1%'` shrinks column to content; frozen left columns need fixed px width; frozen right can use `'1%'` safely
- `CdsButton`: rounded-sm (4px), font-bold; loading spinner preserves width
- `CdsBadge`: 6 tones (neutral/primary/success/warning/danger/info), icon prop, pill shape
- `CdsStackedListbox`: 3 sizes × 3 itemStyles (compact/simple/rich)

### Styling approach
- **No CSS Modules.** All styling via Tailwind utilities.
- **No inline `style={{}}` for colors** — only for dynamic positioning (e.g. createPortal panels).
- Shared row class patterns: define as `const ROW = '...'` at module level, not repeated inline.

---

## Portal / Event System Notes

**Critical**: when nesting interactive elements inside `createPortal` panels:
- `document.addEventListener('mousedown', handler)` sees portals as "outside"
  because portals render to `document.body`, not inside the React root
- Fix: attach a native `mousedown` stopPropagation listener to the portal panel element
  via `useEffect` to prevent parent close handlers from firing prematurely
- **Never use** `e.nativeEvent.stopImmediatePropagation()` to stop Headless UI

Headless UI v2 uses `window.addEventListener('pointerdown', handler, true)` (capture
phase) for outside-click detection. Avoid nesting custom portals inside Headless UI
Menu/MenuItems — use custom portal dropdowns instead (see ProfileMenu in Sidebar.tsx).

Extra CDS pattern notes are preserved under `team/knowledge/cds/`.

---

## TypeScript Strategy

- **CDS / infrastructure layer** (`src/components/cds/`, `src/components/layout/`,
  `src/hooks/`, `App.tsx`, `main.tsx`): strict TypeScript, no `any`, exported
  interfaces for all component props.
- **Pages** (`src/pages/`): may use `// @ts-nocheck` until properly typed.

`tsconfig.json` has `strict: true`. `src/vite-env.d.ts` provides Vite client types.

### CDS Guideline page must stay in sync
Any CDS-related change — new component, component modification, color palette update,
token change, typography change — **must** be reflected in the CDSGuideline page
(`src/pages/CDSGuideline/sections/`). This is the living documentation.

---

## What NOT to do
- Do not add new CSS Module files
- Do not use raw Tailwind text size utilities (`text-sm`, `text-xs`, etc.)
- Do not reference palette stops directly — use semantic tokens
- Do not import icons that aren't used
- Do not create new files without checking if an existing CDS component covers the need
