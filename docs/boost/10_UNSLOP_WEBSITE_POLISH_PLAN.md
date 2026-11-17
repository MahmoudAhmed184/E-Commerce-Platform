# Storefront Polish & Unslopping Plan (/unslop-website)

> **Document ID:** BOOST-10  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Framework:** Damir Sokolovsky's `/unslop-website` (CC-BY-4.0) & Craft Redline Process  
> **Target Scope:** Entire Storefront (Global Navigation, Homepage Hero, Catalog Grid, Product Detail, Cart Drawer, Checkout)

---

## 1. Audit of Current Storefront (Finding the Slop)

Applying Damir Sokolovsky's `/unslop-website` audit methodology to the existing `client/src/` application revealed several pervasive "vibecoded" AI slop tells:

1. **Color & Palette Drift:**
   - `client/src/styles.css` contains legacy violet, indigo, and purple declarations (`--color-violet-600`, `--color-indigo-50` through `900`).
   - Chrome elements (badges, category chips, navigation highlights) compete for visual attention with product imagery.
2. **Icons & Decorative Clutter:**
   - Decorative trust badges in the hero section ("Verified inventory", "Secure checkout", "Order tracking") create visual noise beneath the primary headline.
   - Inconsistent icon dimensions (`h-3.5 w-3.5` mixed with `h-4 w-4`) without a fixed 16px/18px stroke standard.
3. **Copy & Tone:**
   - Generic, shouting marketing headlines (*"Shop reliable products for everyday life. Compare clear product details, see current availability..."*) that sound like an AI template rather than an authentic merchant.
   - Verbose button copy and ungrounded marketing claims.
4. **Layout & Visual Hierarchy:**
   - Product cards float with artificial `shadow-sm` and template `scale-[1.03]` hover effects that cause visual jitter.
   - The hero section lacks one clear, authentic visual moment that anchors the user's attention.
5. **Spacing Inconsistencies:**
   - Mixed gutter definitions (`px-gutter-xs py-10 md:px-gutter-sm lg:px-gutter-lg`) causing horizontal rhythm shifts between viewport breakpoints.

---

## 2. The 5-Line Product Direction

Before editing code, we define the concrete, grounded character of the storefront:

- **Product:** A curated tech and everyday utility equipment catalog delivering verified items with transparent checkout.
- **Character:** Calm, exact, tactile, deliberate. *(Banned words: "clean", "modern", "sleek", "premium")*
- **World:** Precision industrial design, matte anodized aluminum, dark graphite slate, and archival paper.
- **Moments:**
  1. *The Hero Showcase:* A single, beautifully staged product shot rendered on quiet neutral space with natural physics-based light and real ground shadow.
  2. *The Order Receipt:* A crisp, ledger-style checkout summary card with mono-spaced numerals and subtle perforated borders.
- **Signature:** A micro hairline technical badge displaying the item's catalog batch code (`[LOT-2026-X]`) alongside a steady emerald status dot.

---

## 3. The 9-Pass Polish Execution Plan

### Pass 1: Spacing (Strict 4px Rhythm)
- Lock all page margins, section paddings, and card gaps to strict 4px multiples:
  - Page gutters: `px-4 sm:px-6 lg:px-8` (16px, 24px, 32px).
  - Section gaps: `py-12 lg:py-16` (48px, 64px).
  - Card internal padding: `p-5` (20px) or `p-6` (24px) uniformly.
  - Navigation rows: exactly 36px tall with 4px gap.
- Align all text, badges, and icon baselines to a continuous vertical grid.
- Remove one-off arbitrary values like `mt-[13px]` or `py-[11px]`.

### Pass 2: Color (Quiet Graphite Neutral Ramp)
- Eliminate all saturated indigo, violet, and purple backgrounds.
- Background surfaces:
  - Base page: `#fafafa` (light) / `#09090b` (dark).
  - Elevated cards & sheets: `#ffffff` (light) / `#121214` (dark).
- Text roles locked to three contrast tiers:
  - Primary text: `#121212` / `#fafafa` (14:1 contrast ratio).
  - Secondary text: `#52525b` / `#d4d4d8` (7:1 contrast ratio).
  - Muted text: `#71717a` / `#a1a1aa` (4.8:1 WCAG AA compliant).
- Single Accent: Deep obsidian black with pure white text in light mode; pure white with obsidian black text in dark mode.
- Remove hue gradients on surfaces, gradient text, colored glows, and radial color washes.

### Pass 3: Icons (Single Set, 16px, 1.5 Stroke)
- Use only `@lucide/angular`.
- Every icon normalized to exactly `16px` by `16px` (`h-4 w-4`) with `stroke-width="1.5"`.
- Icons strictly inherit parent text color (`currentColor`), never custom colored glows.
- Drop redundant decorative emojis and icons preceding text labels.

### Pass 4: Copy (Understated & Specific)
- Replace generic placeholder marketing text with crisp, product-first copy:
  - **Old:** *"Shop reliable products for everyday life. Compare clear product details, see current availability..."*
  - **New:** *"Equipment designed for daily utility. In stock and ready to ship."*
- Button copy: Change *"Shop products"* to *"Browse Catalog"*; change *"Submit Order"* to *"Confirm and Pay"*.
- No exclamation marks in interface text.
- Headlines and labels end without a period.

### Pass 5: Type (Typographic Scale & Legibility)
- Primary typeface: `Inter` with OpenType tabular figures (`tnum`) enabled for prices, SKU codes, and inventory counts.
- Hierarchy:
  - Display headline: `text-3xl lg:text-5xl font-semibold tracking-tight` (calm, uncompressed).
  - Section headers: `text-xl font-medium tracking-tight`.
  - Body copy: `text-sm leading-relaxed text-muted-foreground`.
  - Prices & SKU: `font-mono text-sm tracking-normal`.
- Sentence case everywhere: replace all-caps `NAVIGATION` with `Navigation`.

### Pass 6: Layout (Calm Whitespace & Natural Grouping)
- Rebalance the hero grid from `55% / 45%` to a golden-ratio `60% / 40%`.
- Give headlines generous breathing room by removing floating trust badges.
- Let featured items breathe on a dedicated stage with ample padding rather than being squished inside tight card borders.
- Keep apps and dashboards at full desktop viewport width (max-w-7xl, 1440px).

### Pass 7: Details (Hairlines & Subtle Elevation)
- Replace thick or dark borders with subtle hairlines:
  - `border border-neutral-200/80 dark:border-neutral-800`.
- Nested radius: inner radius equals outer radius minus padding (`rounded-lg` inside `rounded-xl`).
- Remove colored box-shadows. On dark mode, replace shadows entirely with a 1-step surface lift (`bg-neutral-900` over `bg-neutral-950`).

### Pass 8: Visuals (Authentic Hero Moment)
- The Hero image must feature realistic studio lighting with natural ground contact shadows.
- Remove artificial `hover:scale-[1.03]` zoom animations that cause visual jitter. Replace with an ultra-subtle 1px border highlight on hover.
- Dashboards and catalog grids feature real product photos or code-rendered cards with physical details (chips, numbers, textures).

### Pass 9: Motion & Transitions
- Micro-interactions capped at 150ms with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
- Remove looping or pulsing animations (`animate-pulse` or `animate-ping`) on non-live elements.
- Respect user accessibility preferences: wrap all transitions in `@media (prefers-reduced-motion: no-preference)`.

---

## 4. Concrete Code Redlines Across Key Storefront Surfaces

### 4.1 Surface 1: Global Navigation (`client/src/app/layout/global-nav/`)

```html
<!-- BEFORE: Slop Aesthetics (Lax Spacing, Saturated Glows) -->
<header class="sticky top-0 z-50 bg-indigo-900/80 backdrop-blur shadow-md">
  <div class="px-6 py-4 flex justify-between items-center">
    <span class="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">✨ ShopHub</span>
    <input class="rounded-full bg-indigo-950 px-4 py-2 text-white border border-indigo-700" placeholder="Search anything here..." />
    <button class="bg-purple-600 rounded-full px-5 py-2 font-bold animate-pulse">Cart 🛒</button>
  </div>
</header>

<!-- AFTER: Unslopped High-Craft Implementation -->
<header class="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
    <!-- Brand -->
    <a routerLink="/" class="flex items-center gap-2 text-foreground font-semibold tracking-tight text-sm">
      <span class="h-2 w-2 rounded-full bg-foreground"></span>
      EQUIPMENT &bull; CO
    </a>

    <!-- Quiet Search -->
    <div class="flex-1 max-w-md hidden sm:block">
      <div class="relative">
        <lucide-icon name="search" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"></lucide-icon>
        <input
          hlmInput
          type="search"
          placeholder="Search catalog by SKU or title..."
          class="w-full pl-9 h-9 text-xs bg-muted/50 border-border focus:bg-background"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <app-theme-toggle />
      <button hlmBtn variant="outline" size="sm" class="relative gap-2" (click)="cartService.setDrawerOpen(true)">
        <lucide-icon name="shopping-bag" class="h-4 w-4 text-muted-foreground"></lucide-icon>
        <span class="text-xs">Bag</span>
        @if (cartService.itemCount() > 0) {
          <span class="font-mono text-xs bg-foreground text-background px-1.5 py-0.2 rounded-full">
            {{ cartService.itemCount() }}
          </span>
        }
      </button>
    </div>
  </div>
</header>
```

### 4.2 Surface 2: Homepage Hero Section (`client/src/app/features/products/pages/home-page/`)

```html
<!-- BEFORE: Slop Aesthetics -->
<section class="min-h-[520px] bg-surface-raised border-b border-border-default">
  <div class="grid lg:grid-cols-[55%_45%] gap-8 py-10">
    <p class="type-label-sm text-text-info">Featured collection • Ready to shop</p>
    <h1 class="type-display-lg">Shop reliable products for <span>everyday life.</span></h1>
    <!-- Cluttered trust icons, bouncing hover scale, generic card -->
  </div>
</section>

<!-- AFTER: Unslopped High-Craft Implementation -->
<section class="border-b border-border bg-background">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
    <!-- Left Column: Quiet Typography & Actions -->
    <div class="lg:col-span-7 flex flex-col items-start gap-6">
      <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-card">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        <span class="font-mono text-xs text-muted-foreground tracking-wide">LOT-2026 &bull; NEW RELEASE</span>
      </div>

      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
        Equipment designed for daily utility.
      </h1>

      <p class="text-base text-muted-foreground max-w-lg leading-relaxed">
        Engineered for durability and precision. Tested in real work environments, backed by transparent inventory and same-day fulfillment.
      </p>

      <div class="flex items-center gap-3 pt-2">
        <button hlmBtn variant="default" size="lg" routerLink="/products">
          Browse Catalog
        </button>
        <button hlmBtn variant="outline" size="lg" [routerLink]="['/products', heroProduct().slug]">
          View Specifications
        </button>
      </div>
    </div>

    <!-- Right Column: The Staged Moment -->
    <div class="lg:col-span-5 relative flex items-center justify-center p-8 rounded-xl border border-border bg-card">
      <img
        [ngSrc]="heroProduct().imageUrl"
        [alt]="heroProduct().name"
        width="600"
        height="500"
        priority
        class="w-full max-h-80 object-contain drop-shadow-sm select-none"
      />
    </div>
  </div>
</section>
```

### 4.3 Surface 3: Product Card in Catalog Grid (`client/src/app/features/products/components/product-card/`)

```html
<!-- BEFORE: Vibecoded AI Card with Hover Scale & Purple Badge -->
<div class="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm hover:scale-[1.03] transition-all">
  <span class="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full text-xs">BESTSELLER ✨</span>
  <img [src]="product.imageUrl" class="h-48 w-full object-cover" />
  <h3 class="text-lg font-bold text-gray-900 mt-2">{{ product.name }}</h3>
  <p class="text-purple-600 font-extrabold text-xl">\${{ product.price }}</p>
  <button class="w-full bg-indigo-600 text-white py-2 rounded-lg mt-3">Add to cart</button>
</div>

<!-- AFTER: Unslopped High-Craft Product Card -->
<div class="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20">
  <div class="relative aspect-square w-full overflow-hidden rounded-md bg-muted/30 p-4">
    <img
      [ngSrc]="product.imageUrl"
      [alt]="product.name"
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
      class="object-contain transition-transform duration-200 group-hover:scale-[1.01]"
    />
  </div>

  <div class="mt-4 flex flex-col gap-1">
    <div class="flex items-center justify-between text-xs text-muted-foreground font-mono">
      <span>{{ product.categoryName }}</span>
      <span class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full" [class.bg-emerald-500]="product.stockQuantity > 0" [class.bg-amber-500]="product.stockQuantity === 0"></span>
        {{ product.stockQuantity > 0 ? 'IN STOCK' : 'PRE-ORDER' }}
      </span>
    </div>

    <h3 class="text-sm font-medium text-foreground tracking-tight group-hover:underline">
      {{ product.name }}
    </h3>

    <div class="mt-2 flex items-center justify-between">
      <span class="font-mono text-sm font-semibold text-foreground">\${{ product.price }}</span>
      <button hlmBtn variant="outline" size="sm" (click)="onAddToCart(product)">
        Add
      </button>
    </div>
  </div>
</div>
```

---

## 5. Story Video Script Protocol (`unslop-story/`)

Per `/unslop-website` specification, when presenting redesign passes to stakeholders, build a short 10-second transformation video where the screen unslops itself step by step:

1. **Standalone Story File:** `client/unslop-story/story.html`
2. **Steps:**
   - Step 1: `Spacing` (paddings open up to 4px multiples, tags count live).
   - Step 2: `Color and Icons` (purples drain to quiet graphite, emojis crossfade to 16px Lucide icons).
   - Step 3: `Type and Copy` (headlines blur and roll into understated sentences, prices adopt tabular numerals).
   - Step 4: `Details & Moments` (corners soften to nested radii, hero product card floats with authentic shadow).
3. **Execution Command:**
   ```bash
   node /home/mahmoud-ahmed/Downloads/skills/new/unslop-website/unslop/scripts/story.mjs client/unslop-story/story.html unslop-story.mp4 --wide
   ```
