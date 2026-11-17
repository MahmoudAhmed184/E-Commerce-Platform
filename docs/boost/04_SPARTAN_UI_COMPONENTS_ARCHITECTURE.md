# Spartan UI Component Architecture (spartan.ng)

> **Document ID:** BOOST-04  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Target Library:** Spartan UI (`spartan.ng`) with Tailwind CSS v4 CSS-First Architecture  
> **Core Philosophy:** "shadcn/ui for Angular" — Decoupled Brain & Helm Primitives

---

## 1. Philosophy & Why Spartan UI?

In modern web development, component libraries traditionally fall into two problematic extremes:
1. **Opinionated Component Monoliths (Angular Material, PrimeNG):** Heavy abstractions with rigidly encapsulated shadow DOMs or deep styling rules that require brittle `::ng-deep` overrides, impose unwanted aesthetic baggage, and bloat bundle sizes.
2. **From-Scratch Reinvention:** Building every dialog, dropdown, sheet, and focus trap manually, which almost inevitably introduces accessibility (WAI-ARIA) flaws, keyboard navigation bugs, and design inconsistencies.

**Spartan UI (`https://spartan.ng/`)** provides the definitive solution for Angular in 2026—widely celebrated as **"shadcn/ui for Angular"**. It provides the best of both worlds through a decoupled two-tier architecture:
- **Brain (`@spartan-ng/brain`):** Headless, completely unstyled logic, state management, and keyboard navigation primitives built atop the robust Angular CDK (`@angular/cdk`).
- **Helm (`@spartan-ng/helm`):** Directives and styled components built using Tailwind CSS and `class-variance-authority` (CVA). Instead of hiding behind an immutable npm dependency, Helm code is copied directly into your repository (`src/app/shared/components/spartan/helm/`).

### Core Advantages for This Project:
- **100% Code Ownership:** Every class, attribute, and element can be modified directly in the repository to match our exact design system.
- **Tailwind Native:** Works hand-in-hand with our Tailwind v4 theme tokens without CSS specificity wars.
- **Signals & Zoneless Native:** Engineered from the ground up for Angular Signals, OnPush change detection, and zoneless operation (`provideZonelessChangeDetection`).
- **Certified Accessible (WCAG 2.2 / WAI-ARIA Compliant):** Screen reader labels, focus trapping, and keyboard controls (ESC, Arrow navigation, Tab) are guaranteed by the Brain layer.

---

## 2. CLI Installation & Scaffolding Workflow

### 2.1 Installing the Spartan CLI

Add the official Spartan CLI schematic plugin to the client workspace:

```bash
cd client
npm install -D @spartan-ng/cli
```

### 2.2 Initializing Spartan

Run the init schematic to set up theme variables, dependencies, and Tailwind utility presets:

```bash
npx ng g @spartan-ng/cli:init
```

This creates the Spartan folder structure under `client/src/app/shared/components/spartan/`:
```
client/src/app/shared/components/spartan/
├── brain/     # Custom brain extensions or CDK adapters
└── helm/      # Directives and UI components owned by our application
    ├── button/
    ├── input/
    ├── label/
    ├── badge/
    ├── sheet/
    ├── dialog/
    ├── dropdown-menu/
    ├── sonner/
    ├── tabs/
    ├── table/
    └── card/
```

### 2.3 Generating Primitives via CLI

Generate the primitives required across our e-commerce features:

```bash
# Core inputs and controls
npx ng g @spartan-ng/cli:ui button
npx ng g @spartan-ng/cli:ui input
npx ng g @spartan-ng/cli:ui label
npx ng g @spartan-ng/cli:ui badge
npx ng g @spartan-ng/cli:ui skeleton

# Overlays and interactive panels
npx ng g @spartan-ng/cli:ui sheet
npx ng g @spartan-ng/cli:ui dialog
npx ng g @spartan-ng/cli:ui dropdown-menu
npx ng g @spartan-ng/cli:ui sonner

# Layout and presentation
npx ng g @spartan-ng/cli:ui tabs
npx ng g @spartan-ng/cli:ui table
npx ng g @spartan-ng/cli:ui card
```

---

## 3. Tailwind v4 CSS Integration & Variable Mapping

Spartan UI Helm primitives rely on standard CSS variables (`--primary`, `--muted`, `--accent`, `--border`, `--input`, etc.). In **Tailwind CSS v4**, these are declared inside `@theme` in `client/src/styles.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);

  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);

  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);

  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

This guarantees that Spartan utilities (`bg-primary`, `text-primary-foreground`, `border-input`, `ring-ring`) compile into native Tailwind v4 classes with instant sub-millisecond hot-reloading.

---

## 4. Key E-Commerce Spartan Components & Concrete Implementations

### 4.1 Button Primitive Directive (`hlmBtn`)

The Spartan button is implemented as an attribute directive rather than a restrictive wrapper component, allowing standard HTML `<button>` and `<a>` elements to inherit full native accessibility, form submission, and routing behavior:

```typescript
// client/src/app/shared/components/spartan/helm/button/hlm-button.directive.ts
import { Directive, input, computed } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { hlm } from '@spartan-ng/brain/core';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: '[hlmBtn]',
  standalone: true,
  host: {
    '[class]': '_computedClass()',
  },
})
export class HlmButtonDirective {
  readonly variant = input<ButtonVariants['variant']>('default');
  readonly size = input<ButtonVariants['size']>('default');
  readonly userClass = input<string>('', { alias: 'class' });

  protected readonly _computedClass = computed(() =>
    hlm(buttonVariants({ variant: this.variant(), size: this.size() }), this.userClass())
  );
}
```

### 4.2 Slide-Over Cart Drawer (`HlmSheet`)

A high-converting e-commerce storefront requires a responsive slide-over cart drawer that slides in from the right when an item is added, maintaining screen reader accessibility, scroll lock, and focus trapping:

```typescript
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HlmSheetComponent,
  HlmSheetContentComponent,
  HlmSheetHeaderComponent,
  HlmSheetFooterComponent,
  HlmSheetTitleDirective,
  HlmSheetDescriptionDirective,
} from '@spartan-ng/helm/sheet';
import { BrnSheetContentDirective } from '@spartan-ng/brain/sheet';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  imports: [
    RouterLink,
    HlmSheetComponent,
    HlmSheetContentComponent,
    HlmSheetHeaderComponent,
    HlmSheetFooterComponent,
    HlmSheetTitleDirective,
    HlmSheetDescriptionDirective,
    BrnSheetContentDirective,
    HlmButtonDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-sheet [state]="cartService.isDrawerOpen() ? 'open' : 'closed'" (stateChange)="cartService.setDrawerOpen($event === 'open')">
      <hlm-sheet-content *brnSheetContent="let ctx" side="right" class="w-full sm:max-w-md flex flex-col justify-between h-full bg-background border-l border-border">
        <hlm-sheet-header class="text-left pb-4 border-b border-border">
          <h2 hlmSheetTitle class="text-lg font-semibold text-foreground">Your Bag ({{ cartService.itemCount() }})</h2>
          <p hlmSheetDescription class="text-sm text-muted-foreground">Review your selected items and proceed to checkout.</p>
        </hlm-sheet-header>

        <div class="flex-1 overflow-y-auto py-4 divide-y divide-border">
          @for (item of cartService.items(); track item.productId) {
            <div class="flex items-center justify-between py-3">
              <div class="flex items-center gap-3">
                <img [src]="item.imageUrl" [alt]="item.name" class="h-12 w-12 rounded object-contain border border-border" />
                <div>
                  <p class="text-sm font-medium text-foreground">{{ item.name }}</p>
                  <p class="font-mono text-xs text-muted-foreground">\${{ item.price }} &times; {{ item.quantity }}</p>
                </div>
              </div>
              <button hlmBtn variant="ghost" size="sm" (click)="cartService.removeItem(item.productId)">
                Remove
              </button>
            </div>
          } @empty {
            <div class="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p class="text-sm">Your bag is currently empty.</p>
            </div>
          }
        </div>

        <hlm-sheet-footer class="border-t border-border pt-4 flex-col gap-3">
          <div class="flex justify-between text-base font-medium text-foreground">
            <span>Subtotal</span>
            <span class="font-mono">\${{ cartService.subtotal() }}</span>
          </div>
          <button
            hlmBtn
            variant="default"
            class="w-full"
            [disabled]="cartService.itemCount() === 0"
            routerLink="/checkout"
            (click)="cartService.setDrawerOpen(false)"
          >
            Proceed to Checkout
          </button>
        </hlm-sheet-footer>
      </hlm-sheet-content>
    </hlm-sheet>
  `
})
export class CartDrawerComponent {
  readonly cartService = inject(CartService);
}
```

### 4.3 Toast Feedback (`hlm-sonner` & `ngx-sonner`)

For non-blocking e-commerce notifications (stock updates, cart confirmations, order status changes):

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { toast } from 'ngx-sonner';
import { HlmButtonDirective } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-add-to-cart-action',
  imports: [HlmButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button hlmBtn variant="default" (click)="onAdd()">
      Add to Bag
    </button>
  `
})
export class AddToCartActionComponent {
  onAdd(): void {
    toast.success('Added to Bag', {
      description: 'Studio Precision Headphones reserved for 15 minutes.',
      action: {
        label: 'View Bag',
        onClick: () => {
          // Open cart drawer
        },
      },
    });
  }
}
```

---

## 5. Migration Strategy: Replacing Custom Wrappers with Spartan Primitives

The current repository contains custom components under `client/src/app/shared/components/` (`button.component.ts`, `input-control.component.ts`, `sonner.component.ts`).

The refactoring plan replaces these wrapper components with Spartan Helm directives:

| Current Custom Component | Spartan UI Replacement | Architectural Benefit |
|---|---|---|
| `<app-button>` component wrapper | `<button hlmBtn variant="..." size="...">` | Native DOM element access, standard button form validation, no `contents` CSS host bugs |
| `<app-input-control>` component | `<input hlmInput />` | Direct Signal and Reactive Form binding, standard focus-visible rings |
| Custom `<app-sonner>` | `ngx-sonner` + `HlmToasterComponent` | Certified multi-toast stacking, swipe-to-dismiss, accessible ARIA live regions |
| Custom Dialog / Modal | `hlm-dialog` (`BrnDialog`) | Certified WAI-ARIA modal dialog, ESC key dismissal, focus trap |
| Custom Cart Drawer | `hlm-sheet` (`BrnSheet`) | Off-canvas sliding drawer with fluid gestures and keyboard dismiss |
