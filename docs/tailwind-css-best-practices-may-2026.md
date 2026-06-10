# Tailwind CSS Best Practices - May 2026

Research date: 2026-05-17  
Repository context: this project has an Angular 21 client under `client/` that currently uses Tailwind CSS v4 through PostCSS.

This guide is based on the current Tailwind CSS v4.3 documentation and release notes, the Angular v21 Tailwind guide, and local package registry checks on 2026-05-17. It focuses on what to do and what not to do for production Tailwind CSS work in May 2026.

## Current Version Snapshot

| Area | Current status on 2026-05-17 | What it means |
| --- | --- | --- |
| Tailwind CSS latest stable | `tailwindcss@4.3.0` is the npm `latest` tag. | New projects should start on v4.3.x unless they must support old browsers. |
| Tailwind CSS v3 LTS tag | npm exposes `v3-lts` as `3.4.19`. | Use v3.4 only when the browser support target cannot satisfy Tailwind v4 requirements. |
| Tailwind docs version | Tailwind docs show `v 4.3`. | Treat v4.3 docs as the current source of truth. |
| Latest release date | Tailwind CSS v4.3.0 was released on 2026-05-08. | This is the current May 2026 release line. |
| Main new v4.3 features | Scrollbar utilities, `@container-size`, `zoom-*`, `tab-*`, better `@variant`, and functional utility defaults. | Adopt only when the feature improves the UI; do not rewrite working code just to use new classes. |
| Main v4.2 features included in the v4.3 post | New neutral palettes, `@tailwindcss/webpack`, more logical property utilities, and `font-features-*`. | Useful for Next.js/webpack builds, RTL/layout work, and typography edge cases. |
| Browser target | Tailwind v4 targets modern browsers: Chrome 111+, Safari 16.4+, Firefox 128+. | If support for older browsers is contractual, stay on Tailwind v3.4 or test v4 fallbacks carefully. |
| This repo | `client/package.json` uses `tailwindcss@^4.2.4` and `@tailwindcss/postcss@^4.2.4`. | A patch/minor update to `4.3.0` is recommended when dependency updates are in scope. |
| This repo integration | `client/.postcssrc.json` uses `@tailwindcss/postcss`, and `client/src/styles.css` imports Tailwind with `@import 'tailwindcss';`. | The integration shape is correct for Angular 21 and Tailwind v4. |

Verified locally with:

```bash
npm view tailwindcss version dist-tags --json
npm view @tailwindcss/postcss version --json
npm view @tailwindcss/vite version --json
npm view @tailwindcss/cli version --json
```

## Executive Rules

Do:

- Use Tailwind CSS `4.3.x` for new modern-browser projects.
- Keep `tailwindcss` and first-party integration packages on the same minor/patch family, for example `tailwindcss@4.3.0` with `@tailwindcss/postcss@4.3.0`.
- Use CSS-first configuration with `@theme`, `@utility`, `@variant`, `@custom-variant`, and `@source`.
- Put most styling directly in component templates as utilities.
- Use complete, statically detectable class names.
- Use `@source` only when automatic source detection needs help.
- Prefer theme tokens and normal utility classes over repeated arbitrary values.
- Use Prettier with the official Tailwind plugin for consistent class order.
- Test production builds, visual states, responsive layouts, dark mode, and browser targets after upgrades.

Do not:

- Do not create a new `tailwind.config.js` for v4 unless you are migrating legacy config and explicitly load it with `@config`.
- Do not use old `@tailwind base`, `@tailwind components`, or `@tailwind utilities` directives in v4.
- Do not add `postcss-import` or `autoprefixer` just because older v3 guides mention them. Tailwind v4 handles imports and vendor prefixing.
- Do not build classes dynamically with string concatenation such as `bg-${color}-600`.
- Do not rely on hover-only behavior for core touch-device workflows.
- Do not overuse `@apply` to recreate Bootstrap-style component classes.
- Do not use Sass/Less/Stylus as the Tailwind pipeline.
- Do not assume v4 works perfectly in browsers older than Chrome 111, Safari 16.4, and Firefox 128.

## Installation And Build Integration

### Angular 21

This repo already follows the correct Angular shape:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

```css
@import 'tailwindcss';

@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
}
```

Do:

- Keep Tailwind imported from the global stylesheet listed in `angular.json`, currently `client/src/styles.css`.
- Keep `.postcssrc.json` in the Angular project root when using Angular's PostCSS pipeline.
- Use Angular templates for Tailwind utility classes.
- Consider Angular's `ng add tailwindcss` for fresh Angular projects, because Angular v21 documents it as the streamlined setup.
- For this repo, update Tailwind with:

```bash
cd client
npm install -D tailwindcss@4.3.0 @tailwindcss/postcss@4.3.0
npm run build
```

Do not:

- Do not add a `tailwind.config.js` just to list Angular template paths. Tailwind v4 has automatic source detection.
- Do not move Tailwind import into many component stylesheets.
- Do not use the v3 setup commands that install `autoprefixer` and run `npx tailwindcss init`.
- Do not switch this Angular project to `@tailwindcss/vite` unless the Angular build pipeline explicitly exposes and supports that integration. Angular's documented setup uses PostCSS.

### Vite Projects

Do:

- Prefer `@tailwindcss/vite` for first-party Vite integration.
- Keep setup minimal:

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

```css
@import "tailwindcss";
```

Do not:

- Do not route Vite projects through PostCSS unless another tool in the project requires PostCSS.
- Do not keep old `content` arrays when v4 automatic detection is enough.

### PostCSS Projects

Do:

- Use the dedicated v4 PostCSS package:

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Do not:

- Do not configure `tailwindcss` itself as a PostCSS plugin in v4.
- Do not keep `postcss-import` or `autoprefixer` unless a separate non-Tailwind workflow truly needs them.

### CLI Projects

Do:

- Use the dedicated CLI package:

```bash
npm install tailwindcss @tailwindcss/cli
npx @tailwindcss/cli -i ./src/input.css -o ./dist/output.css --watch
```

Do not:

- Do not rely on the old v3 `npx tailwindcss` CLI package shape for new v4 projects.

### Webpack And Next.js/Turbopack Projects

Do:

- Consider `@tailwindcss/webpack` for webpack-based builds, including frameworks using webpack-loader compatibility layers, when build time matters.
- Benchmark before and after in the actual app.

Do not:

- Do not migrate a working Vite or Angular integration to webpack only because the v4.3 release added a webpack package.

## CSS-First Configuration

Tailwind v4's main architectural change is that configuration lives in CSS. Use the global Tailwind entry stylesheet as the source of design-system truth.

Do:

- Define design tokens with `@theme`:

```css
@import "tailwindcss";

@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --color-brand-50: oklch(0.98 0.02 250);
  --color-brand-500: oklch(0.62 0.18 250);
  --color-brand-700: oklch(0.45 0.16 250);
  --radius-card: 0.5rem;
}
```

- Use `@theme` when a token should create Tailwind utilities such as `bg-brand-500`, `text-brand-700`, or `rounded-card`.
- Use `:root` for CSS variables that are runtime state or implementation details and should not generate utilities.
- Use `@theme inline` when defining a theme variable that references another variable and should resolve inline.
- Use `@theme static` only when you need all theme variables emitted whether or not utilities use them.
- Share design tokens across apps by importing a shared CSS theme file.

Do not:

- Do not keep design tokens split between stale JS config and CSS unless you are actively migrating.
- Do not redefine the entire default theme with `--*: initial` unless the design system is mature and you are ready to lose default utility families.
- Do not add one-off values to `@theme` before proving they repeat enough to become design tokens.
- Do not use deprecated `theme()` in new CSS; use CSS variables such as `var(--color-brand-500)` and Tailwind's `--spacing()` / `--alpha()` functions.

## Source Detection And Safelisting

Tailwind v4 scans source files as text and generates CSS for tokens that look like valid utility classes.

Do:

- Use complete class names in templates and source files.
- Map component props or Angular inputs to static class strings:

```ts
const toneClasses = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  neutral: 'bg-white text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50',
} as const;
```

- In Angular templates, expose the class map from the component class and bind to full class strings or object keys:

```html
<button [class]="toneClasses[tone] + ' rounded-md px-4 py-2 text-sm font-medium'">
  Save
</button>
```

- Register external Tailwind-based UI packages with `@source`:

```css
@import "tailwindcss";
@source "../node_modules/@acmecorp/ui";
```

- Use `@source not` for large legacy folders that do not use Tailwind.
- Use `@source inline()` for classes that truly cannot appear statically, such as CMS-driven or database-driven variants.
- For multiple stylesheets, use `source(none)` and explicit `@source` paths when each stylesheet should include only its own class set.

Do not:

- Do not concatenate partial utility names:

```html
<!-- Bad: Tailwind cannot see text-red-600 or text-green-600 as complete tokens. -->
<p class="text-{{ error ? 'red' : 'green' }}-600"></p>
```

- Do not write dynamic JavaScript such as `` `bg-${color}-600` `` for production utility classes.
- Do not safelist broad ranges unless there is a real runtime source, because broad safelists grow CSS output.
- Do not scan `node_modules` globally. Add only the packages that need scanning.

## Utility-Class Usage

Tailwind works best when templates describe structure, state, and presentation together through small utilities.

Do:

- Build components from utilities first.
- Prefer constrained design tokens: `p-4`, `gap-3`, `text-sm`, `rounded-md`, `bg-gray-50`.
- Use arbitrary values when the value is truly one-off:

```html
<div class="top-[117px] lg:top-[344px]"></div>
```

- Use CSS-variable arbitrary shorthand for runtime values:

```html
<div class="bg-(--product-accent)"></div>
```

- Use arbitrary properties for missing CSS features before creating a custom utility:

```html
<div class="[scrollbar-gutter:stable]"></div>
```

- Use `clsx`, `class-variance-authority`, `tailwind-variants`, or a small local class map when component variants become hard to read.
- Use official class sorting via Prettier for stable diffs.

Do not:

- Do not convert every repeated utility list into custom CSS. Prefer framework components or class maps first.
- Do not use arbitrary values as a private design system.
- Do not use Tailwind utilities to hide poor semantic HTML. Use correct elements, labels, landmarks, roles, and form attributes.
- Do not remove visible focus styles.
- Do not make long class strings unreadable by mixing conditional logic inline. Move variant decisions into named maps.

## Responsive Design

Tailwind breakpoints are mobile-first.

Do:

- Write the mobile layout with unprefixed utilities.
- Add larger-screen changes with `sm:`, `md:`, `lg:`, `xl:`, and `2xl:`.
- Use `max-*` variants for ranges when a style must apply only below a breakpoint.
- Use `md:max-xl:*` style range targeting when a design has tablet-only behavior.
- Define custom breakpoints in `@theme` only when the product design system uses them repeatedly.

Do not:

- Do not use `sm:` to mean "mobile". `sm:` means at the small breakpoint and above.
- Do not add one-off arbitrary breakpoints for every component.
- Do not rely on viewport breakpoints for components that are reused in sidebars, modals, grids, and narrow containers.

## Container Queries

Container queries are first-class in Tailwind v4 and are usually better for reusable components than viewport breakpoints.

Do:

- Add `@container` to the parent whose width should control the child layout.
- Use variants such as `@sm:`, `@md:`, and `@lg:` on children.
- Name containers when nested components need to target a specific parent:

```html
<section class="@container/product-grid">
  <article class="grid gap-4 @md/product-grid:grid-cols-[12rem_1fr]"></article>
</section>
```

- Use `@container-size` when the child uses block-size container units such as `cqb` or `cqh`.
- Use `@min-[...]` and `@max-[...]` for rare one-off container thresholds.

Do not:

- Do not use `@container-size` everywhere. It is for cases that need both dimensions.
- Do not name every container. Name only when ambiguity exists.
- Do not replace simple global page layout breakpoints with container queries when viewport logic is clearer.

## State, Interaction, And Accessibility

Tailwind variants cover pseudo-classes, pseudo-elements, media queries, attributes, child selectors, dark mode, motion preferences, print, RTL/LTR, and more.

Do:

- Use state variants directly in templates:

```html
<button class="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
  Save
</button>
```

- Use `focus-visible:` for keyboard focus indicators.
- Use `disabled:`, `invalid:`, `required:`, `checked:`, `aria-*`, and `data-*` variants instead of adding extra template conditionals when the browser already knows the state.
- Use `pointer-coarse:` and `pointer-fine:` to adjust touch targets and density for different input devices.
- Treat `hover:` as an enhancement because v4 scopes it to devices that support hover.
- Use `motion-safe:` and `motion-reduce:` for non-essential motion.
- Use `rtl:` and logical properties for bidirectional UI.
- Use `forced-colors:` or `forced-color-adjust-*` when high-contrast accessibility needs explicit handling.

Do not:

- Do not make important functionality available only on hover.
- Do not remove `outline` without replacing it with a visible focus style.
- Do not manually mirror left/right spacing for RTL if logical utilities can express it.
- Do not use JavaScript for visual states that CSS variants can handle reliably.

## Dark Mode And Themes

Tailwind's `dark:` variant uses `prefers-color-scheme` by default, but you can override it with a selector.

Do:

- Use the default media-query behavior if the product should simply follow the OS preference.
- Use `@custom-variant dark` when the product has a manual theme toggle:

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

```html
<html data-theme="dark">
  <body>
    <main class="bg-white text-gray-950 dark:bg-gray-950 dark:text-white"></main>
  </body>
</html>
```

- Set theme state before first paint when using a manual toggle to avoid flash of the wrong theme.
- Use `color-scheme` utilities or CSS where native controls and scrollbars need to match the theme.

Do not:

- Do not scatter separate dark-mode stylesheets through the app.
- Do not implement dark mode by duplicating components.
- Do not choose low-contrast dark palette pairs without checking accessible contrast.

## Custom CSS, @apply, And Local Stylesheets

Tailwind v4 supports custom CSS, but the default should be utilities in markup.

Do:

- Use `@layer base` for global element defaults:

```css
@layer base {
  body {
    color: var(--color-gray-950);
    background: var(--color-white);
  }
}
```

- Use `@layer components` for complex reusable classes that should remain overrideable by utilities.
- Use `@utility` for custom utilities that should work with variants:

```css
@utility content-auto {
  content-visibility: auto;
}
```

- Use `@variant` when custom CSS needs Tailwind variants:

```css
.admin-panel {
  background: var(--color-white);

  @variant dark {
    background: var(--color-gray-950);
  }
}
```

- Use `@apply` mainly for third-party library overrides or small compatibility layers.
- If using `@apply` or `@variant` in isolated component stylesheets, import the global stylesheet with `@reference` so theme variables and custom utilities are visible without duplicating CSS.

Do not:

- Do not use `@apply` to create a parallel component framework such as `.btn-primary`, `.card`, `.form-input` for everything.
- Do not put Tailwind `@theme` declarations in many component-local stylesheets.
- Do not assume component-scoped stylesheets automatically know about global `@theme`, custom variants, or custom utilities.
- Do not use Sass, Less, or Stylus as the Tailwind v4 processing path. Tailwind v4 is designed to be the CSS build tool.

## Preflight And Global Base Styles

Preflight is included when you import `tailwindcss`. It normalizes browser defaults and adds opinionated base rules.

Do:

- Expect margins to be reset on headings, paragraphs, lists, and other elements.
- Style headings intentionally with utilities or base layer rules.
- Add `role="list"` to semantic lists that should remain unstyled but still be announced correctly by assistive technology.
- Use `list-disc`, `list-decimal`, and `list-inside` / `list-outside` when a list should visibly look like a list.
- Audit third-party widgets that rely on default borders, margins, or inline images.
- Override Preflight in `@layer base` for third-party integration edge cases.

Do not:

- Do not assume browser default heading sizes, list bullets, or margins exist.
- Do not disable Preflight casually. Most Tailwind examples and utilities assume it is present.
- Do not patch third-party library layout issues with random utility overrides when a small scoped base override is clearer.

## v4.3 And v4.2 Feature Guidance

### Scrollbars

Do:

- Use `scrollbar-thin`, `scrollbar-none`, `scrollbar-thumb-*`, `scrollbar-track-*`, and `scrollbar-gutter-*` when a scroll container is part of the designed interface.
- Use `scrollbar-gutter-stable` when scrollbar appearance causes layout shift.

Do not:

- Do not hide scrollbars on content that users need to discover.
- Do not style every page scrollbar unless the product design requires it.

### Logical Properties

Do:

- Prefer logical utilities for internationalized UI: `pbs-*`, `pbe-*`, `mbs-*`, `mbe-*`, `inline-*`, `block-*`, `inset-s-*`, and `inset-e-*`.
- Prefer `inset-s-*` and `inset-e-*` over older `start-*` and `end-*` positioning utilities for new code.

Do not:

- Do not use physical `left-*`, `right-*`, `ml-*`, and `mr-*` everywhere in components that may need RTL support.

### Text, Wrapping, And Typography

Do:

- Use `wrap-anywhere` for long product names, emails, SKUs, URLs, and other strings inside flex layouts.
- Use `text-shadow-*` and colored `drop-shadow-*` only when they improve readability or visual hierarchy.
- Use high-level OpenType utilities such as `tabular-nums` before lower-level `font-features-*`.
- Use `tab-*` utilities for code blocks or preformatted text that contains real tab characters.

Do not:

- Do not use text shadows as a substitute for accessible contrast.
- Do not use low-level font feature tags when a named Tailwind utility exists.

### Masks, Zoom, And Arbitrary Features

Do:

- Use new mask utilities for image fades, reveals, and polished visual effects where the browser target supports them.
- Use `zoom-*` only for deliberate UI scaling cases after testing layout, pointer behavior, and accessibility.

Do not:

- Do not use `zoom-*` as a replacement for responsive design.
- Do not use masks for critical content without testing fallback behavior.

### Safe Alignment

Do:

- Use safe alignment utilities such as `justify-center-safe` when centered overflow could hide the start of content.

Do not:

- Do not rely on centered overflow for navigations, chips, filters, or tab lists that can exceed the container width.

## Migration Guidance

### From Tailwind v3 To v4

Do:

- Run the official upgrade tool first when migrating a v3 app.
- Replace `@tailwind` directives with `@import "tailwindcss";`.
- Move design tokens from `tailwind.config.js` to `@theme`.
- Replace removed opacity utilities with slash opacity syntax, such as `bg-black/50`.
- Replace removed aliases: `flex-shrink-*` to `shrink-*`, `flex-grow-*` to `grow-*`, `overflow-ellipsis` to `text-ellipsis`.
- Review renamed scales such as shadow, blur, radius, drop-shadow, outline, and ring utilities.
- Specify border and divide colors explicitly where v3 assumed gray defaults.
- Move important modifiers to the end of the class, for example `bg-red-500!`.
- Reverse order-sensitive stacked variants if behavior changed during migration.
- Replace old CSS-variable arbitrary shorthand such as `bg-[--brand-color]` with `bg-(--brand-color)`.
- Reset individual transform properties such as `scale-none`, `rotate-none`, or `translate-none` instead of assuming `transform-none` resets all v4 transform utilities.
- Use `@source inline()` instead of old JS-config `safelist`.

Do not:

- Do not migrate manually before trying the upgrade tool.
- Do not assume visual parity for default `ring`, `border`, placeholder, shadow, blur, radius, and outline behavior.
- Do not leave `corePlugins`, `safelist`, or `separator` in JS config and expect v4 to honor them.
- Do not keep using `resolveConfig` in app JavaScript. Use CSS variables or `getComputedStyle`.

### From Tailwind v4.2 To v4.3 In This Repo

Do:

- Update `tailwindcss` and `@tailwindcss/postcss` together.
- Run `npm run build` from `client/`.
- Smoke test pages that use scroll containers, product grids, forms, dropdowns, modals, and responsive navigation.
- Check generated CSS for unexpected growth if you add `@source inline()` or scan external packages.

Do not:

- Do not change app code just to use v4.3 utilities.
- Do not update only one of the Tailwind first-party packages.

## Project-Specific Recommendations

For this repository:

Do:

- Keep `client/src/styles.css` as the central Tailwind entry and design-token file.
- Keep `client/.postcssrc.json` with `@tailwindcss/postcss`.
- Upgrade to Tailwind `4.3.0` in a normal dependency-update change.
- Add project color, spacing, radius, and typography tokens to `@theme` before broad UI implementation.
- Use Angular templates for most utility classes.
- Use typed class maps in TypeScript for repeated button, badge, alert, and status variants.
- Prefer container queries for product cards, admin panels, cart rows, and checkout summary components that can appear in different layout widths.
- Use `wrap-anywhere` for product names, emails, order IDs, payment references, and URLs.
- Use explicit border colors such as `border-gray-200` or `border-gray-800` instead of assuming default border color.
- Keep component CSS files small. Use them for structural host styles, complex selectors, or third-party overrides, not routine Tailwind composition.

Do not:

- Do not introduce a legacy Tailwind config unless a plugin or migration requires it.
- Do not use Angular `[ngClass]` to concatenate utility fragments.
- Do not place large copied utility groups in many templates without extracting an Angular component or a typed variant map.
- Do not use hover-only controls for cart actions, product quick actions, admin table controls, or checkout flows.
- Do not rely on unstyled lists for navigation or product feature lists without checking accessibility.

## Recommended Baseline For This Angular Client

`client/.postcssrc.json`:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

`client/src/styles.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;

  --color-brand-50: oklch(0.98 0.02 250);
  --color-brand-100: oklch(0.94 0.05 250);
  --color-brand-500: oklch(0.62 0.18 250);
  --color-brand-600: oklch(0.55 0.2 250);
  --color-brand-700: oklch(0.45 0.16 250);

  --radius-card: 0.5rem;
  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.08), 0 8px 24px rgb(15 23 42 / 0.08);
}

html {
  font-family: var(--font-sans);
}
```

Example Angular variant map:

```ts
export const buttonToneClasses = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary: 'bg-white text-gray-950 ring-1 ring-gray-300 hover:bg-gray-50 focus-visible:outline-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
} as const;

export const buttonSizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
} as const;

export class ButtonComponent {
  protected readonly buttonToneClasses = buttonToneClasses;
  protected readonly buttonSizeClasses = buttonSizeClasses;
}
```

Example template:

```html
<button
  type="button"
  [class]="buttonToneClasses[tone] + ' ' + buttonSizeClasses[size] + ' inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'"
>
  Save changes
</button>
```

## Review Checklist For Pull Requests

Use this checklist for Tailwind-related reviews:

- Version alignment: `tailwindcss` and first-party Tailwind packages are compatible and ideally same version.
- Build integration: v4 uses `@import "tailwindcss"` and the correct integration package.
- Source detection: no dynamic class concatenation; external sources are registered explicitly.
- Design tokens: repeated values are in `@theme`; one-offs stay as arbitrary values.
- Component structure: repeated UI patterns are components or typed class maps, not scattered copy/paste.
- Accessibility: focus states, disabled states, semantic elements, labels, contrast, and touch targets are handled.
- Responsiveness: mobile-first utilities are correct; reusable components use container queries where appropriate.
- Browser support: modern CSS utilities are acceptable for the supported browsers.
- Dark mode: selector or media-query strategy is consistent.
- CSS output: no broad safelist or accidental scanning of generated files/dependencies.
- Preflight: third-party widgets and semantic list behavior are checked.

## Sources

- Tailwind CSS v4.3 release blog, 2026-05-08: https://tailwindcss.com/blog/tailwindcss-v4-3
- Tailwind CSS v4.3.0 GitHub release, 2026-05-08: https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.0
- Tailwind CSS v4.0 release blog: https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind CSS v4.1 release blog: https://tailwindcss.com/blog/tailwindcss-v4-1
- Tailwind CSS installation with Vite: https://tailwindcss.com/docs/installation/using-vite
- Tailwind CSS Angular guide: https://tailwindcss.com/docs/installation/framework-guides/angular
- Angular v21 Tailwind guide: https://angular.dev/guide/tailwind
- Tailwind CSS compatibility docs: https://tailwindcss.com/docs/compatibility
- Tailwind CSS upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Tailwind CSS theme variables docs: https://tailwindcss.com/docs/theme
- Tailwind CSS detecting classes docs: https://tailwindcss.com/docs/detecting-classes-in-source-files
- Tailwind CSS adding custom styles docs: https://tailwindcss.com/docs/adding-custom-styles
- Tailwind CSS functions and directives docs: https://tailwindcss.com/docs/functions-and-directives
- Tailwind CSS responsive design and container query docs: https://tailwindcss.com/docs/responsive-design
- Tailwind CSS dark mode docs: https://tailwindcss.com/docs/dark-mode
- Tailwind CSS editor setup docs: https://tailwindcss.com/docs/editor-setup
- Tailwind CSS Preflight docs: https://tailwindcss.com/docs/preflight
