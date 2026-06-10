# UI Inconsistencies Report

Date: 2026-05-24  
Scope: static audit of the Angular client under `client/src/app`, global styles in `client/src/styles.css`, and design tokens in `client/src/styles/tokens.css`.

This report focuses on implementation-level UI inconsistencies: token drift, visual vocabulary conflicts, accessibility inconsistencies, route/navigation mismatches, and duplicated patterns. I did not run a live browser visual pass, so issues that require rendered screenshots should be confirmed in a follow-up polish pass.

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|---:|---:|---|
| 1 | Accessibility | 2/4 | Custom combobox/listbox controls lack a complete keyboard model, and several controls are below the app's own touch target token. |
| 2 | Performance | 3/4 | No major rendering issue found statically, but blur/glass utilities and external showcase images add avoidable cost. |
| 3 | Responsive Design | 3/4 | Most feature layouts are responsive, but header/search/button target sizing is inconsistent on touch devices. |
| 4 | Theming | 1/4 | Dark mode is exposed to users but no dark token layer exists. Raw color utilities block theme consistency. |
| 5 | Anti-patterns / Consistency | 1/4 | The UI mixes semantic tokens, raw Tailwind colors, glass-era aliases, marketing hero styling, and duplicated components. |
| **Total** |  | **10/20** | **Acceptable, but significant design-system cleanup is needed.** |

## Anti-pattern Verdict

Fail for consistency. The app does not read as one visual system yet. Admin, checkout, and profile screens generally use semantic tokens. Home, login, product cards, global navigation, and several shared primitives still use raw `zinc`, `indigo`, `white`, fixed Tailwind sizes, and older glass vocabulary. The result is a credible set of screens individually, but with visible seams between product UI, marketing UI, and older component passes.

The strongest tells are:

- A dark-mode toggle exists, but the stylesheet remains light-only.
- Primary buttons are sometimes `app-button`, sometimes hand-authored anchors with different radius, height, focus, and color classes.
- There are three visually similar `app-order-summary-card` implementations with the same selector name.
- Home and login use a separate marketing composition, including gradient text and raw Tailwind typography, while most operational routes use the tokenized product system.
- Legacy `glass-*` and `aurora-*` names remain after the theme was reduced to flat light surfaces.

## Executive Summary

Issues found: 4 P1, 7 P2, 3 P3.

Top fixes:

1. Decide whether the product supports dark mode now. If yes, add `[data-theme="dark"]` tokens and convert raw color utilities. If no, remove the toggle and dark first-paint script.
2. Make semantic tokens and shared components the only allowed UI vocabulary for buttons, forms, cards, surfaces, and focus states.
3. Consolidate duplicated order summary and form-control components before adding more checkout/order/admin UI.
4. Bring custom select, combobox, and search suggestion controls up to a complete keyboard interaction model.
5. Normalize touch target sizing to `--ui-size-touch-min` for header, search, icon, and button controls.

## Detailed Findings

### P1: Dark Mode Is Advertised But Not Implemented

Location:

- `client/src/index.html:8` declares `light dark`, and `client/src/index.html:20` to `client/src/index.html:39` sets `data-theme`.
- `client/src/app/core/services/theme/theme.service.ts:81` to `client/src/app/core/services/theme/theme.service.ts:85` applies `data-theme` and `colorScheme`.
- `client/src/app/layout/theme-toggle/theme-toggle.component.ts:12` to `client/src/app/layout/theme-toggle/theme-toggle.component.ts:24` exposes a user-facing theme toggle.
- `client/src/styles/tokens.css:4` sets `color-scheme: light`, with no matching `[data-theme="dark"]` token layer found.
- `client/src/app/layout/global-nav/global-nav.component.ts:53` uses hard-coded light styling (`bg-white/80`, `border-zinc-200`, `backdrop-blur-md`).

Category: Theming / Accessibility  
Impact: Users can switch to dark mode, but the app's colors do not actually become dark. Native controls may switch because `colorScheme` changes, while app surfaces remain light. This can create mixed contrast and a broken state that looks user-controlled but is not supported.  
Recommendation: Either remove the toggle and first-paint dark script for now, or add a real `[data-theme="dark"]` token layer and replace hard-coded light classes with semantic tokens.

### P1: Design Tokens Are Not The Authoritative Styling System

Location:

- `client/src/styles.css:4` to `client/src/styles.css:240` defines a broad Tailwind theme backed by semantic variables.
- `client/src/app/shared/components/button/button.component.ts:65` to `client/src/app/shared/components/button/button.component.ts:131` still uses raw `indigo`, `zinc`, `white`, `red`, `h-8`, `h-9`, and `h-10`.
- `client/src/app/shared/components/input-control/input-control.component.ts:13` to `client/src/app/shared/components/input-control/input-control.component.ts:14` uses raw light form styling.
- `client/src/app/shared/components/select/select.component.ts:17` to `client/src/app/shared/components/select/select.component.ts:18` uses the newer token/glass vocabulary.
- `client/src/app/features/auth/pages/register/register.page.ts:64` to `client/src/app/features/auth/pages/register/register.page.ts:67` hand-authors tokenized inputs rather than using `app-input`.
- `client/src/app/features/auth/pages/login/login.page.ts:39` to `client/src/app/features/auth/pages/login/login.page.ts:93` uses a separate raw Tailwind visual system.

Category: Theming / Design System  
Impact: The app cannot be reliably restyled or themed because components do not agree on whether colors, type, radius, and spacing come from semantic tokens or raw utilities.  
Recommendation: Pick one contract: semantic tokens plus component variant maps. Convert shared primitives first, then feature screens. Block raw palette utilities in feature components except when mapping tokens in `styles.css`.

### P1: Interactive Targets Are Smaller Than The App's Own Touch Target Token

Location:

- `client/src/styles/tokens.css:275` defines `--ui-size-touch-min: 2.75rem` (44px).
- `client/src/app/shared/components/button/button.component.ts:85` to `client/src/app/shared/components/button/button.component.ts:87` defines button sizes as 32px, 36px, and 40px.
- `client/src/app/shared/components/search-bar/search-bar.component.ts:20`, `client/src/app/shared/components/search-bar/search-bar.component.ts:41`, and `client/src/app/shared/components/search-bar/search-bar.component.ts:46` use 32px search controls.
- `client/src/app/layout/theme-toggle/theme-toggle.component.ts:13` and `client/src/app/layout/global-nav/global-nav.component.ts:90` use 36px icon buttons.
- `client/src/app/layout/global-nav/global-nav.component.ts:116` uses a 32px create-account link in desktop navigation.

Category: Accessibility / Responsive  
Impact: Touch and motor-impaired users get inconsistent tap targets, especially in the global header and search flow. The project already defines the correct minimum but does not apply it consistently.  
Recommendation: Make `tap-target` or `min-h-touch-min min-w-touch-min` the default for icon buttons and mobile/header actions. If compact desktop controls are intentional, use breakpoint-specific sizing that returns to 44px on coarse pointers.

### P1: Custom Select, Combobox, And Search Suggestion Controls Have Incomplete Keyboard Behavior

Location:

- `client/src/app/shared/components/select/select.component.ts:17` to `client/src/app/shared/components/select/select.component.ts:31` opens the listbox but only handles Escape and ArrowDown.
- `client/src/app/shared/components/select/select.component.ts:54` to `client/src/app/shared/components/select/select.component.ts:60` renders options as nested buttons with `role="option"`.
- `client/src/app/shared/components/combobox/combobox.component.ts:17` to `client/src/app/shared/components/combobox/combobox.component.ts:33` exposes combobox state but lacks active option management.
- `client/src/app/shared/components/search-bar/search-bar.component.ts:20` to `client/src/app/shared/components/search-bar/search-bar.component.ts:35` exposes `role="combobox"` but no active descendant or arrow selection model.
- `client/src/app/shared/components/search-bar/search-bar.component.ts:53` to `client/src/app/shared/components/search-bar/search-bar.component.ts:58` renders suggestion options as buttons, with every option set to `aria-selected="false"`.

Category: Accessibility / Component Consistency  
Impact: These controls look like standard searchable/selectable controls but do not behave like them for keyboard and assistive technology users. This is especially risky because they are shared across catalog filters, global search, and admin forms.  
Recommendation: Implement the ARIA combobox/listbox pattern completely: active option state, `aria-activedescendant`, ArrowUp/ArrowDown, Home/End, Enter selection, Escape close, focus management, and consistent option semantics. Avoid nesting interactive `button` elements inside listbox options unless the pattern is deliberately changed.

### P2: Three Order Summary Components Share The Same Selector But Drift Visually

Location:

- `client/src/app/features/cart/components/order-summary-card/order-summary-card.component.ts:8` to `client/src/app/features/cart/components/order-summary-card/order-summary-card.component.ts:15`.
- `client/src/app/features/checkout/components/order-summary-card/order-summary-card.component.ts:8` to `client/src/app/features/checkout/components/order-summary-card/order-summary-card.component.ts:15`.
- `client/src/app/features/orders/components/order-summary-card/order-summary-card.component.ts:8` to `client/src/app/features/orders/components/order-summary-card/order-summary-card.component.ts:14`.
- Cart version uses `glass-panel`, `glass-depth-floating`, and `rounded-lg` at `client/src/app/features/cart/components/order-summary-card/order-summary-card.component.ts:74` to `client/src/app/features/cart/components/order-summary-card/order-summary-card.component.ts:82`.
- Checkout/orders versions use `border-hairline`, `bg-surface-raised`, `shadow-xs`, and `rounded-md` at `client/src/app/features/checkout/components/order-summary-card/order-summary-card.component.ts:74` to `client/src/app/features/checkout/components/order-summary-card/order-summary-card.component.ts:84`.

Category: Design System / Maintainability  
Impact: Cart, checkout, and orders show the same commerce concept with different surface treatment. Because all three are named `app-order-summary-card`, future imports are easy to confuse and visual drift will continue.  
Recommendation: Move a single order summary component to `shared/components` or `features/orders/components` with explicit variants for `cart`, `checkout`, and `order-detail` only if the visual differences are intentional.

### P2: Primary Actions Bypass The Shared Button Component

Location:

- Shared button variants live at `client/src/app/shared/components/button/button.component.ts:89` to `client/src/app/shared/components/button/button.component.ts:131`.
- `client/src/app/features/cart/pages/cart-page/cart-page.ts:87` to `client/src/app/features/cart/pages/cart-page/cart-page.ts:92` hand-authors "Continue to checkout".
- `client/src/app/features/checkout/pages/review-page/review-page.ts:80` to `client/src/app/features/checkout/pages/review-page/review-page.ts:85` hand-authors "Continue to delivery" with a different radius and token set.
- `client/src/app/features/products/pages/product-detail-page/product-detail-page.ts:271` to `client/src/app/features/products/pages/product-detail-page/product-detail-page.ts:276` hand-authors "View cart".
- `client/src/app/features/products/pages/home-page/home-page.ts:98` to `client/src/app/features/products/pages/home-page/home-page.ts:109` hand-authors both hero actions.

Category: Design System / Accessibility  
Impact: Primary actions differ in height, radius, focus ring, hover behavior, token usage, and loading/disabled support depending on route. Users see the same action importance expressed in multiple ways.  
Recommendation: Create a link-capable button primitive or standard action-link component so router links can use the same variant map as `app-button`.

### P2: Form Controls Use Multiple Visual Recipes

Location:

- `app-input` delegates to `app-ui-input` and `app-textarea` at `client/src/app/shared/components/input/input.component.ts:17` to `client/src/app/shared/components/input/input.component.ts:62`.
- `app-ui-input` uses `rounded-lg`, raw white/zinc/indigo styling at `client/src/app/shared/components/input-control/input-control.component.ts:13` to `client/src/app/shared/components/input-control/input-control.component.ts:14`.
- `app-textarea` uses matching raw styling at `client/src/app/shared/components/textarea/textarea.component.ts:11` to `client/src/app/shared/components/textarea/textarea.component.ts:12`.
- Register page fields are hand-authored with tokenized `rounded-sm border border-border bg-card` classes at `client/src/app/features/auth/pages/register/register.page.ts:64` to `client/src/app/features/auth/pages/register/register.page.ts:67`.
- Checkout address fields are hand-authored with `rounded-sm border-hairline bg-surface-raised` at `client/src/app/features/checkout/components/address-form/address-form.component.ts:34`.
- `app-select` uses glass/tokens at `client/src/app/shared/components/select/select.component.ts:18`.

Category: Design System / Forms  
Impact: Inputs, textareas, and selects do not appear to come from the same form system. Error borders, focus rings, radius, background, and shadow differ by route.  
Recommendation: Normalize shared field primitives first, then convert feature forms to them. If a native form control is preferred in dense admin screens, create an explicit `density` variant instead of copying classes.

### P2: Home And Login Use A Different Visual Register Than The Product App

Location:

- Home page uses a standalone marketing-style surface at `client/src/app/features/products/pages/home-page/home-page.ts:81` to `client/src/app/features/products/pages/home-page/home-page.ts:150`.
- Home hero includes gradient text at `client/src/app/features/products/pages/home-page/home-page.ts:88` to `client/src/app/features/products/pages/home-page/home-page.ts:90`.
- Category cards use repeated rounded card styling and custom hover shadows at `client/src/app/features/products/pages/home-page/home-page.ts:218` to `client/src/app/features/products/pages/home-page/home-page.ts:223`.
- Login page uses a separate split composition, dark aside, raw typography, and remote showcase images at `client/src/app/features/auth/pages/login/login.page.ts:39` to `client/src/app/features/auth/pages/login/login.page.ts:88`.
- Register page uses the newer tokenized card system at `client/src/app/features/auth/pages/register/register.page.ts:28` to `client/src/app/features/auth/pages/register/register.page.ts:55`.

Category: Anti-pattern / Visual Consistency  
Impact: The app changes personality between home, login, register, and operational screens. That may be acceptable if intentionally split into marketing and product registers, but no `PRODUCT.md` or `DESIGN.md` exists to define that split.  
Recommendation: Decide whether home/login are brand surfaces. If yes, document the register split and keep the visual language deliberate. If not, pull them back into the same product UI vocabulary as catalog, checkout, and profile.

### P2: Page Shell Backgrounds Are Inconsistent Across Routes

Location:

- App shell uses `bg-background text-foreground` at `client/src/app/app.ts:18`.
- Product listing uses `bg-transparent` at `client/src/app/features/products/pages/product-listing-page/product-listing-page.ts:50`.
- Product detail uses `bg-transparent` at `client/src/app/features/products/pages/product-detail-page/product-detail-page.ts:56`.
- Cart uses `bg-transparent` at `client/src/app/features/cart/pages/cart-page/cart-page.ts:27`.
- Checkout review uses `bg-surface-page` at `client/src/app/features/checkout/pages/review-page/review-page.ts:30`.
- Home uses `bg-zinc-50` at `client/src/app/features/products/pages/home-page/home-page.ts:56`.
- Login uses `bg-zinc-50` and `bg-white` at `client/src/app/features/auth/pages/login/login.page.ts:39` and `client/src/app/features/auth/pages/login/login.page.ts:88`.

Category: Layout / Theming  
Impact: Route transitions can feel like jumping between separate apps. It also makes theme changes harder because some pages inherit the app shell while others force local backgrounds.  
Recommendation: Define one page background rule for product routes, one optional brand/marketing exception, and use semantic `bg-surface-page` or `bg-background` consistently.

### P2: Tooltip Start/End Placement Uses An Undefined Position Token

Location:

- `client/src/app/shared/components/tooltip/tooltip.component.ts:43` to `client/src/app/shared/components/tooltip/tooltip.component.ts:44` use `--ui-position-half`.
- No `--ui-position-half` definition was found under `client/src`.

Category: Component Bug / Layout  
Impact: Start/end tooltip placement relies on an undefined CSS variable. Browsers will drop those arbitrary-position values, so side placements can render incorrectly or inconsistently.  
Recommendation: Define `--ui-position-half: 50%` in `tokens.css`, or replace with Tailwind's static `top-1/2 -translate-y-1/2` utilities.

### P2: Footer Policy Links Navigate To Missing Routes

Location:

- `client/src/app/layout/footer/footer.component.ts:57` to `client/src/app/layout/footer/footer.component.ts:62` links to `/returns`, `/privacy`, and `/terms`.
- `client/src/app/app.routes.ts:6` to `client/src/app/app.routes.ts:53` has no routes for these paths, so the wildcard 404 handles them.

Category: Navigation / UX  
Impact: The footer advertises policies as first-class navigation, but every policy link leads to a 404. Because these are plain `href` links, they can also force a full page navigation instead of Angular router navigation.  
Recommendation: Add real policy routes/pages or remove the links until content exists. Use `routerLink` for internal routes.

### P3: Brand Metadata Uses A Different Accent Than The App UI

Location:

- `client/src/index.html:11` uses `theme-color` `#00a99d`.
- The app accent token is indigo at `client/src/styles/tokens.css:13` and `client/src/styles/tokens.css:33`.

Category: Brand / Theming  
Impact: Browser UI, install surfaces, and app chrome can show a teal brand color while the product UI uses indigo. This is subtle but visible on mobile and PWA surfaces.  
Recommendation: Align `theme-color`, tile color, favicon assets, and accent tokens.

### P3: Legacy Glass And Aurora Vocabulary Remains In A Flat Light Theme

Location:

- Glass color aliases are defined at `client/src/styles/tokens.css:189` to `client/src/styles/tokens.css:191`.
- Glass implementation tokens are defined at `client/src/styles/tokens.css:321` to `client/src/styles/tokens.css:335`.
- Aurora tokens remain at `client/src/styles/tokens.css:350` to `client/src/styles/tokens.css:361`.
- `glass-panel`, `glass-depth-*`, and no-op `aurora-layer` utilities live at `client/src/styles.css:296` to `client/src/styles.css:334`.
- Components still use `backdrop-blur-md` and `glass-*` vocabulary in places such as `client/src/app/shared/components/select/select.component.ts:18` and `client/src/app/layout/global-nav/global-nav.component.ts:53`.

Category: Anti-pattern / Design System  
Impact: The naming suggests translucent/glass surfaces, but the token values mostly resolve to flat light surfaces. This makes the design system harder to understand and encourages more glass styling even though the current theme is not glass-based.  
Recommendation: Rename the surviving utilities to product-surface names (`surface-panel`, `surface-raised`, `surface-floating`) and delete no-op legacy tokens after migration.

### P3: Typography Contract Is Internally Contradictory

Location:

- `client/src/styles/tokens.css:213` to `client/src/styles/tokens.css:215` defines normal and tight letter spacing as `0`.
- `client/src/styles.css:416` to `client/src/styles.css:433` sets negative letter spacing in display and heading utilities.
- Home and login bypass type utilities with raw `text-4xl`, `text-3xl`, `tracking-tight`, and `tracking-widest`, for example `client/src/app/features/products/pages/home-page/home-page.ts:84` to `client/src/app/features/products/pages/home-page/home-page.ts:93` and `client/src/app/features/auth/pages/login/login.page.ts:90` to `client/src/app/features/auth/pages/login/login.page.ts:93`.

Category: Typography  
Impact: Text hierarchy is inconsistent between tokenized pages and raw Tailwind pages. Heading tracking also contradicts the token layer, so typography decisions are split between tokens and utility definitions.  
Recommendation: Define the intended heading tracking once in tokens, then remove raw typography from feature templates unless it is a documented brand-surface exception.

## Patterns And Systemic Issues

- There is no `PRODUCT.md` or `DESIGN.md` at the repo root. The code contains enough tokens to imply a design system, but there is no written source of truth for register, brand, theme, components, or exceptions.
- Shared components are not consistently used. Feature pages often copy button, input, and link styles directly.
- The token system contains both semantic names (`surface-raised`, `text-primary`) and palette names (`zinc`, `indigo`), and feature templates freely use both.
- Legacy visual vocabulary remained after theme simplification, especially `glass-*`, `aurora-*`, raw blur classes, and no-op utility comments.
- Checkout/cart/order patterns are close enough to consolidate, but duplicated components are already diverging.

## Positive Findings

- The project has a substantial token layer in `client/src/styles/tokens.css` and Tailwind v4 CSS-first mapping in `client/src/styles.css`.
- Global skip navigation exists at `client/src/app/layout/skip-navigation/skip-navigation.component.ts:8` to `client/src/app/layout/skip-navigation/skip-navigation.component.ts:13`.
- Global focus-visible fallback exists at `client/src/styles.css:687` to `client/src/styles.css:690`.
- Reduced-motion handling exists at `client/src/styles.css:697` to `client/src/styles.css:705`.
- Many feature pages use semantic type and color classes consistently, especially checkout, orders, profile, and admin screens.
- Loading, empty, error, dialog, sheet, badge, skeleton, and alert components already exist, so the cleanup can mostly consolidate existing pieces rather than inventing new ones.

## Recommended Action Plan

1. P1: Establish the design source of truth. Add `PRODUCT.md` and `DESIGN.md`, or document the same decisions in an existing repo doc. Decide if home/login are brand surfaces or product surfaces.
2. P1: Resolve dark mode. Either implement dark tokens and convert raw light classes, or remove dark mode UI until it is supported.
3. P1: Normalize core primitives: `ButtonComponent`, `InputControlComponent`, `TextareaComponent`, `SelectComponent`, `ComboboxComponent`, and `SearchBarComponent`.
4. P1: Fix combobox/listbox keyboard behavior and touch target sizing.
5. P2: Consolidate duplicate order summary components and standardize primary action links.
6. P2: Migrate route-level backgrounds, form controls, product cards, global nav, home, and login to the chosen token/component contract.
7. P2: Add or remove footer policy routes.
8. P3: Rename or remove legacy glass/aurora tokens and align app metadata color.

Suggested follow-up commands:

- `npx impeccable document`: generate a DESIGN.md from the current token/component system.
- `npx impeccable audit client/src/app`: re-run a technical UI audit after fixes.
- `npx impeccable extract shared components`: consolidate repeated buttons, forms, and order summary patterns.
- `npx impeccable adapt global nav and shared controls`: normalize responsive and touch behavior.
- `npx impeccable polish`: final visual consistency pass after structural fixes.
