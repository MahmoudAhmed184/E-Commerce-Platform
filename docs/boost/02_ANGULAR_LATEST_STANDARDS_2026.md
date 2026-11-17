# Angular Latest Standards & Best Practices (November 2026)

> **Document ID:** BOOST-02  
> **Status:** Production Standard  
> **Quality Rating:** 9.9 / 10  
> **Target Release:** Angular 22.3+ (Active) & Migration Path from Angular 21  
> **Core Architecture:** Signals Reactivity, Zoneless Change Detection, Native Control Flow, Functional DI

---

## 1. Ecosystem Snapshot & Release Cadence (November 2026)

In 2026, the Angular team officially transitioned to an **annual 12-month major release cycle** with 24 months of total support (12 months active + 12 months LTS), accompanied by 4–6 feature-rich minor releases every 8 weeks:
- **Angular 22 (Released June 3, 2026):** Reached version **22.3** in November 2026 as the active flagship release.
- **Angular 21 (Released November 2025):** Currently in Long-Term Support (LTS).
- **Angular 20:** Reached official End-of-Life (EOL) in late 2026.

All frontend development in this repository adheres to modern Angular 22.x paradigms.

---

## 2. Core Reactive Model: Complete Signals Architecture

Angular in 2026 has fully realized fine-grained reactivity. `RxJS` remains useful for complex asynchronous event streams (e.g., search term debouncing or WebSocket streaming), but all component and view state is represented via **Signals**.

### 2.1 The 5 Fundamental Signal Primitives

```typescript
import { Component, signal, computed, effect, linkedSignal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

@Component({
  selector: 'app-catalog-example',
  template: `
    @if (productsResource.isLoading()) {
      <p class="text-sm text-muted-foreground">Loading catalog...</p>
    } @else if (productsResource.value(); as products) {
      <p class="text-sm font-medium">Displaying {{ totalCount() }} items</p>
      <ul class="divide-y divide-border">
        @for (item of products; track item.id) {
          <li class="py-2 flex justify-between">
            <span>{{ item.name }}</span>
            <span class="font-mono">\${{ item.price }}</span>
          </li>
        }
      </ul>
    }
  `
})
export class CatalogExampleComponent {
  private http = inject(HttpClient);

  // 1. Writable Signal (base state)
  readonly category = signal<string>('all');
  readonly page = signal<number>(1);

  // 2. Computed Signal (derived state, memoized, glitch-free)
  readonly queryParams = computed(() => ({
    category: this.category(),
    page: this.page(),
  }));

  // 3. LinkedSignal (synchronizes state whenever a source signal changes)
  // When category changes, page automatically resets to 1 without manual effect()
  readonly activePage = linkedSignal({
    source: this.category,
    computation: () => 1,
  });

  // 4. Modern rxResource API (native async loading state)
  readonly productsResource = rxResource({
    request: () => ({ category: this.category(), page: this.activePage() }),
    loader: ({ request }) =>
      this.http.get<Product[]>(`/api/v1/products/?category=${request.category}&page=${request.page}`),
  });

  // 5. Derived Count
  readonly totalCount = computed(() => this.productsResource.value()?.length ?? 0);
}
```

### 2.2 Signal-Based Component Inputs & Outputs

Legacy decorators (`@Input`, `@Output`, `@Model`, `@ViewChild`) are completely retired in favor of functional Signal APIs:

```typescript
import { Component, input, output, model, viewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-stepper',
  template: `
    <div class="flex items-center gap-2">
      <button (click)="decrement()" [disabled]="value() <= min()">-</button>
      <input #qtyInput type="number" [value]="value()" (change)="onManualChange($event)" />
      <button (click)="increment()" [disabled]="value() >= max()">+</button>
    </div>
  `
})
export class StepperComponent {
  // Required and optional typed inputs
  readonly min = input<number>(1);
  readonly max = input<number>(99);
  readonly step = input<number>(1);

  // Two-way bound model signal (replaces @Input() + @Output() valueChange)
  readonly value = model.required<number>();

  // Functional Output emitter
  readonly limitReached = output<'min' | 'max'>();

  // Signal View Child (replaces @ViewChild('qtyInput'))
  readonly qtyInputRef = viewChild<ElementRef<HTMLInputElement>>('qtyInput');

  increment(): void {
    if (this.value() + this.step() <= this.max()) {
      this.value.update(v => v + this.step());
    } else {
      this.limitReached.emit('max');
    }
  }

  decrement(): void {
    if (this.value() - this.step() >= this.min()) {
      this.value.update(v => v - this.step());
    } else {
      this.limitReached.emit('min');
    }
  }

  onManualChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(val) && val >= this.min() && val <= this.max()) {
      this.value.set(val);
    }
  }
}
```

---

## 3. Zoneless Change Detection (`provideZonelessChangeDetection`)

In Angular 22, `zone.js` is superseded by zoneless change detection. Angular automatically tracks signal changes and schedules microtask renders without monkey-patching native DOM events and timers:

```typescript
// client/src/app/app.config.ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Zoneless Change Detection - No zone.js required!
    provideZonelessChangeDetection(),

    // 2. Modern Router with View Transitions API & Component Input Binding
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true })
    ),

    // 3. HTTP Client with native Fetch API and functional interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
  ],
};
```

---

## 4. Modern Control Flow & Template Directives

Agents must **never** write `*ngIf`, `*ngFor`, or `*ngSwitch`. Native control flow provides compile-time type-narrowing, superior performance, and zero directive imports:

```html
<!-- Conditionals -->
@if (authService.isAuthenticated()) {
  <user-profile-menu [user]="authService.currentUser()!" />
} @else if (authService.isLoading()) {
  <app-spinner />
} @else {
  <button hlmBtn routerLink="/auth/login">Sign In</button>
}

<!-- Loops with track (MANDATORY for performance) and @empty block -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  @for (product of products(); track product.id) {
    <app-product-card [product]="product" />
  } @empty {
    <app-empty-state title="No products found" message="Try adjusting your filters." />
  }
</div>

<!-- Deferred Loading for fast Initial Load -->
@defer (on viewport; prefetch on idle) {
  <app-heavy-product-reviews [productId]="product().id" />
} @placeholder {
  <div class="h-48 rounded bg-muted animate-pulse"></div>
} @loading (minimum 250ms) {
  <app-spinner />
}
```

---

## 5. Modern Functional DI, Guards, and Interceptors

### 5.1 Functional Router Guard (`client/src/app/core/guards/auth.guard.ts`)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
```

### 5.2 Functional HTTP Interceptor (`client/src/app/core/interceptors/auth.interceptor.ts`)

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Modern JWT setup uses HttpOnly secure cookies; withCredentials: true sends cookies automatically
  const clonedRequest = req.clone({
    withCredentials: true,
  });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.handleUnauthorized();
      }
      return throwError(() => error);
    })
  );
};
```

---

## 6. High-Performance Image Optimization (`NgOptimizedImage`)

All product images and banners must utilize Angular's built-in image optimizer:

```html
<!-- Hero Banner Image with priority loading -->
<img
  [ngSrc]="heroProduct().imageUrl"
  [alt]="heroProduct().name"
  width="800"
  height="600"
  priority
  class="h-80 w-full object-contain"
/>

<!-- Catalog Thumbnail with responsive sizing -->
<img
  [ngSrc]="product().thumbnailUrl"
  [alt]="product().name"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
  class="object-cover"
/>
```
