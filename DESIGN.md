# Vendra Design System

## Theme

Vendra uses a product UI register with a restrained neutral surface system and a teal primary accent taken from the site icon. Light and dark modes are supported by `client/src/styles/tokens.css` token layers. Components consume semantic Tailwind utilities mapped in `client/src/styles.css`.

## Token Contract

- Page background: `bg-surface-page`.
- Raised panels and cards: `surface-panel surface-depth-raised` or `bg-surface-raised border-border-default shadow-xs`.
- Floating menus and popovers: `surface-panel surface-depth-floating`.
- Primary action: `bg-surface-primary text-text-on-primary hover:bg-surface-primary-hover`.
- Secondary action: `border-border-default bg-surface-raised text-text-primary hover:bg-surface-subtle`.
- Form controls: `bg-surface-raised border-border-default text-text-primary placeholder:text-text-muted`.
- Focus: `focus-visible:focus-ring`.
- Error state: `border-border-error bg-surface-error text-text-error`.

Raw palette classes should remain inside token definitions or typed variant maps only.

## Typography

Use the shared type utilities:

- `type-display-lg` for rare storefront-level page heads.
- `type-heading-xl`, `type-heading-lg`, `type-heading-md`, and `type-heading-sm` for route and section hierarchy.
- `type-body-md` and `type-body-sm` for content.
- `type-label-md` and `type-label-sm` for controls, metadata, and compact labels.

Letter spacing is normal by default. Do not use negative tracking or gradient text.

## Components

- Use `app-button` for buttons and button-like links.
- Use `app-input`, `app-textarea`, `app-select`, and `app-combobox` for shared form controls.
- Use the shared `app-order-summary-card` for cart, checkout, and order confirmation.
- Custom select, combobox, and search suggestions use `aria-activedescendant` and ArrowUp, ArrowDown, Home, End, Enter, and Escape keyboard behavior.

## Sizing

Interactive controls use `--ui-size-touch-min` as the minimum hit target. Compact desktop layout may change padding, but not the minimum target.

## Banned Vocabulary

Do not add new `glass-*`, `aurora-*`, decorative blur, or gradient-text utilities. Use surface naming instead.
