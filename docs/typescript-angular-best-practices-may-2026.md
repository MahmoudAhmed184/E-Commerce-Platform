# TypeScript and Angular Best Practices - May 2026

Research date: 2026-05-17  
Repository context: this project has an Angular 21 frontend under `client/`.

This guide separates general TypeScript best practices from Angular-specific guidance because the latest standalone TypeScript release and the latest stable Angular release do not currently use the same TypeScript version range.

## Current Version Snapshot

| Area | Current status on 2026-05-17 | What it means |
| --- | --- | --- |
| TypeScript stable | `6.0.3` is the latest GitHub/npm stable release. TypeScript 6.0 was released on 2026-03-23, and 6.0.3 was released on 2026-04-16. | Use TypeScript 6.0.x for standalone TypeScript apps, Node apps, libraries, and non-Angular frontend stacks that support it. |
| TypeScript prerelease | TypeScript 7.0 Beta is available through the native preview package and `tsgo`. | Treat it as evaluation tooling unless the project explicitly accepts beta compiler risk. Do not make it the default production compiler yet. |
| Angular stable | `@angular/core` latest is `21.2.13`, released 2026-05-13. | Use Angular 21.2.x for production Angular apps as of this research date. |
| Angular prerelease | Angular `22.0.0-rc.0` exists as a release candidate. | Do not use it for production unless the team has a release-candidate validation plan. |
| Angular 21 compatibility | Angular 21 requires Node.js `^20.19.0 || ^22.12.0 || ^24.0.0`, TypeScript `>=5.9.0 <6.0.0`, and RxJS `^6.5.3 || ^7.4.0`. | Angular 21 projects must not upgrade to TypeScript 6.0.x yet. Keep TypeScript on `5.9.x` until Angular officially supports 6.x. |
| Angular support window | Angular 21 is active until 2026-05-19 and LTS until 2027-05-19. Angular 22 is scheduled for the week of 2026-06-01. | Patch Angular 21 now; plan the Angular 22 upgrade after stable release and ecosystem validation. |

Verified locally with:

```bash
npm view typescript version dist-tags --json
npm view @angular/core version dist-tags --json
```

This repository currently uses Angular 21 dependencies and `typescript: ~5.9.2`, which is correct for Angular 21. The repository should not be changed to TypeScript 6 until Angular's compatibility table allows it.

## Recommended Version Policy

Do:

- Use TypeScript `6.0.3` for non-Angular TypeScript packages that can satisfy the TypeScript 6 migration requirements.
- Use TypeScript `5.9.x` for Angular 21 projects.
- Keep all Angular framework packages on the same major and preferably the same minor/patch family.
- Use `ng update @angular/cli@^21 @angular/core@^21` for Angular 21 patch/minor alignment and major migrations.
- Keep `@angular/core` and `@angular/cli` aligned by major version.
- Treat `next`, `rc`, and TypeScript native preview builds as evaluation environments, not silent production upgrades.

Do not:

- Do not install TypeScript 6 into an Angular 21 project just because `typescript@latest` points to 6.0.3.
- Do not mix Angular 21 runtime packages with Angular 20/22 CLI or compiler packages.
- Do not rely on old Angular versions for security. Angular v2 through v18 are no longer supported.
- Do not use Angular 22 RC in production without explicit sign-off, regression tests, and rollback planning.

## TypeScript Best Practices

### Compiler Configuration

For standalone TypeScript 6 projects, start from strict, modern defaults:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2025",
    "module": "preserve",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUncheckedSideEffectImports": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "types": []
  },
  "include": ["src"]
}
```

For Angular 21 projects, keep Angular's generated shape and TypeScript 5.9 compatibility:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

Do:

- Keep `strict: true` explicit even though TypeScript 6 defaults it to true. Explicit config avoids surprises when tooling changes defaults.
- Use `types: []` for browser app configs and explicit `types` entries for Node/test configs, such as `["node"]` or `["vitest/globals"]`.
- Use `rootDir` explicitly in TypeScript 6 projects where emitted output structure matters.
- Use `moduleResolution: "bundler"` for bundled browser apps and `"nodenext"` for code executed directly by Node.js.
- Use `module: "preserve"` or `"esnext"` for modern bundlers.
- Enable `noUncheckedIndexedAccess` when the project can tolerate stricter indexing. It adds `undefined` to undeclared indexed reads and catches many missing-key bugs.
- Enable `exactOptionalPropertyTypes` when API models distinguish between an omitted property and an explicit `undefined`.
- Prefer `skipLibCheck: false` for libraries when possible. For apps, `skipLibCheck: true` is acceptable when third-party declaration noise would slow delivery, but it should not hide first-party type errors.
- Use project references or separate `tsconfig` files when the project grows into independent packages.

Do not:

- Do not use `target: "es5"` in TypeScript 6 projects. TypeScript 6 deprecates ES5 output.
- Do not use `downlevelIteration`; it only mattered for ES5 output.
- Do not use `moduleResolution: "node"` / `"node10"` for new work. Use `bundler` or `nodenext`.
- Do not use `moduleResolution: "classic"`.
- Do not use `module: "amd"`, `"umd"`, `"system"`, or `"none"` for new work.
- Do not use `baseUrl` as a module lookup root. Prefer explicit `paths` values relative to the project root.
- Do not set `esModuleInterop` or `allowSyntheticDefaultImports` to `false` in TypeScript 6 projects.
- Do not use the legacy `module Foo {}` namespace syntax. Use `namespace Foo {}` only when a namespace is truly needed.
- Do not use `import ... assert { type: "json" }`; use import attributes with `with`.
- Do not run `tsc some-file.ts` inside a directory that has a `tsconfig.json`. In TypeScript 6 this is an error unless `--ignoreConfig` is intentional.

### Type Modeling

Do:

- Prefer precise domain types over loose objects. For this e-commerce project, model IDs, money, order status, payment status, stock state, and user roles explicitly.
- Prefer `unknown` at external boundaries, then validate or narrow before use.
- Use discriminated unions for finite states:

```ts
type CheckoutState =
  | { kind: "empty" }
  | { kind: "editing"; cartId: string }
  | { kind: "submitting"; cartId: string }
  | { kind: "failed"; cartId: string; message: string }
  | { kind: "complete"; orderId: string };
```

- Exhaustively handle unions:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled state: ${JSON.stringify(value)}`);
}
```

- Use `satisfies` for config objects where you want validation without losing literal types.
- Use `readonly` for data that should not be reassigned or mutated.
- Validate API responses, local storage data, environment values, and feature flags at runtime. TypeScript types are erased at runtime.
- Use explicit return types for public functions, exported functions, service methods, and complex callbacks.
- Use type guards and equality checks for narrowing. Prefer explicit `value !== null` / `value !== undefined` over broad truthiness when empty strings or zero are valid values.

Do not:

- Do not use `any` for convenience. If a type is genuinely unknown, use `unknown` and narrow.
- Do not use blanket type assertions like `as SomeType` to bypass incomplete modeling.
- Do not use non-null assertions (`!`) as a substitute for handling loading, optional, or invalid states.
- Do not model domain workflows with many optional fields when a discriminated union would make invalid states impossible.
- Do not assume TypeScript validates JSON payloads from the server.
- Do not expose mutable arrays or objects from shared services unless mutation is intentional and controlled.
- Do not overuse clever conditional/mapped types where a simple interface is clearer.

### Imports, Modules, and Runtime Boundaries

Do:

- Keep type-only imports as type-only imports when they are not used at runtime.
- Keep code compatible with the runtime and bundler actually used.
- Keep path aliases explicit and mirrored in bundler/test configuration.
- Prefer standard ESM for new code.
- Use a dedicated bundler for bundling. TypeScript should primarily type-check, transpile, and emit declarations when needed.
- Use `RegExp.escape`, Temporal types, and newer lib APIs only when the runtime or polyfill story is confirmed.

Do not:

- Do not depend on TypeScript-only constructs for runtime behavior.
- Do not assume Node.js, browser, test, and SSR globals are all available in the same compilation target.
- Do not publish libraries with private path aliases that consumers cannot resolve.
- Do not rely on `const enum` in published libraries unless the library toolchain fully controls compilation for consumers.

### Linting and Formatting

Do:

- Use ESLint with `typescript-eslint` recommended type-checked rules for application and library code.
- Use `parserOptions.projectService: true` for typed linting in modern flat configs.
- Keep formatting delegated to Prettier.
- Use `@ts-expect-error` only with a short explanation and a follow-up issue when appropriate.
- Fail CI on TypeScript, ESLint, tests, and production build.

Do not:

- Do not use `@ts-ignore` without a reason.
- Do not disable strict lint rules globally to unblock one file.
- Do not use lint rules as a replacement for compiler strictness.
- Do not make type-aware linting the only type check. Keep `tsc --noEmit` or framework build checks in CI.

### TypeScript 6 and 7 Migration Guidance

Do:

- Upgrade non-Angular projects to TypeScript 6.0.x in a branch.
- Fix TypeScript 6 deprecations before trying TypeScript 7 native preview.
- Add explicit `types` arrays and `rootDir` entries where TypeScript 6 exposes missing assumptions.
- Run the existing test suite, lint, type check, and declaration emit after the upgrade.
- Try TypeScript 7 beta side-by-side with TypeScript 6 only when evaluating compiler performance or upcoming compatibility.

Do not:

- Do not add `"ignoreDeprecations": "6.0"` as a permanent solution. It hides work that TypeScript 7 will force later.
- Do not rely on TypeScript 7 beta programmatic APIs. The TypeScript team says a stable programmatic API is not expected until at least TypeScript 7.1.
- Do not replace `tsc` with `tsgo` in CI until the project deliberately adopts TypeScript 7 and confirms behavior.

## Angular Best Practices

### Project Structure

Do:

- Keep application UI code under `src`.
- Bootstrap from `src/main.ts`.
- Organize by feature area, not by technical type.
- Keep this repository's intended structure:

```text
client/src/app/
|-- core/
|   |-- guards/
|   |-- interceptors/
|   |-- models/
|   `-- services/
|-- shared/
|   |-- components/
|   |-- directives/
|   `-- pipes/
|-- layout/
`-- features/
    |-- auth/
    |-- products/
    |-- cart/
    |-- checkout/
    |-- orders/
    |-- profile/
    |-- admin/
    `-- reviews/
```

- Keep each component's `.ts`, `.html`, `.css`, and `.spec.ts` files together and named consistently.
- Use hyphenated file names such as `product-card.ts` and `checkout-summary.html`.
- Use one Angular concept per file unless multiple small declarations truly belong to the same concept.

Do not:

- Do not create broad `components`, `services`, or `directives` folders inside every feature by default.
- Do not let `shared` become a dumping ground for feature-specific code.
- Do not put API clients, auth state, global interceptors, or route guards in feature folders if they are app-wide.
- Do not place all tests in a separate global `tests` folder.

### Components, Directives, and DI

Do:

- Use standalone components for new code.
- Add dependencies to the component `imports` array explicitly.
- Prefer the `inject()` function over constructor parameter injection.
- Use `providedIn: "root"` for app-wide services and component/route providers for intentionally scoped services.
- Group Angular-specific fields near the top of a component: injected services, inputs, outputs, models, queries, then other fields, then methods.
- Use `readonly` for `input()`, `output()`, `model()`, and query fields that Angular initializes.
- Use `protected` for component members that are only used by the template.
- Keep components focused on presentation and orchestration. Move business workflows, API calls, validation helpers, and transformations into services or pure functions.
- Name event handlers by the action they perform, such as `saveAddress()` or `removeCartItem()`.
- Keep lifecycle hooks short and delegate to named methods.
- Implement lifecycle interfaces, such as `OnInit`, when adding lifecycle hooks.

Do not:

- Do not inject every dependency through constructors in new code unless there is a specific reason.
- Do not put long business workflows inside components.
- Do not make template-only members public by habit.
- Do not mutate `input()`, `output()`, `model()`, or query properties after Angular initializes them.
- Do not name handlers `handleClick()` when the template can say what the click does.
- Do not put complex setup directly inside `ngOnInit`.

### Signals and State

Do:

- Use signals for local UI state, selected filters, derived labels, component state, and state consumed directly by templates.
- Use `computed()` for synchronous derived state.
- Prefer a private writable signal plus a public readonly signal when exposing service state.
- Use `set()` or `update()` and return a new object/array when changing reference data.
- Use `effect()` for side effects that synchronize with non-reactive APIs, logging, analytics, or imperative browser APIs.
- Use `untracked()` for incidental reads inside effects when changes to that signal should not rerun the effect.
- Read signals before an `await` inside reactive functions if the read must be tracked.
- Keep RxJS for event streams, cancellation, websockets, retry/backoff, complex async pipelines, and Angular APIs that are observable-first.
- Use Angular RxJS interop helpers instead of manual subscription management where possible.

Do not:

- Do not use `effect()` to push state into other signals when `computed()` can derive it.
- Do not deep-mutate signal values and return the same reference.
- Do not convert every observable to a signal blindly.
- Do not read signals after an async boundary and assume Angular tracked the dependency.
- Do not store global app state in many unrelated component-level signals when a service should own it.

### Templates

Do:

- Use built-in control flow: `@if`, `@else`, `@for`, `@empty`, and `@switch`.
- Always provide a stable `track` expression in `@for`; use IDs such as `product.id`, `cartItem.id`, or `order.id`.
- Use `@empty` for empty list states.
- Use `@switch` for union-like template state and `@default never;` where exhaustive checking is useful.
- Use `[class.foo]`, `[class]`, `[style.foo]`, and `[style]` over `NgClass` and `NgStyle` for new code.
- Keep template expressions small. Move expensive or complex logic to `computed()` or component methods with cached data.
- Use key event modifiers for keyboard shortcuts where appropriate.

Do not:

- Do not use `track item` unless there is no stable ID. It can make list updates slower.
- Do not call expensive functions from templates, especially inside loops.
- Do not put business logic in templates.
- Do not use `NgClass` or `NgStyle` by default for simple class/style binding.
- Do not use `@switch` expecting JavaScript fallthrough. Angular `@switch` has no fallthrough.

### Forms

Do:

- Use strictly typed reactive forms for production forms with validation, nested groups, dynamic controls, or tests.
- Use template-driven forms only for very simple forms where scalability and explicit testing are not concerns.
- Keep form models explicit and close to their feature.
- Put reusable validators in separate functions.
- Show validation errors after meaningful interaction, such as touched or dirty state.
- In zoneless apps, notify Angular after structural reactive-form mutations if the template depends on that structure. Use `markForCheck()` or reflect the form state through signals.
- Evaluate Signal Forms in prototypes or low-risk features only while they are experimental in Angular 21.

Do not:

- Do not use Signal Forms in production-critical Angular 21 workflows unless the team accepts experimental API risk.
- Do not mix reactive and template-driven patterns in the same form.
- Do not trust client-side validation for security, stock, payment amount, role, or authorization decisions.
- Do not subscribe to form observables without cleanup.
- Do not keep large validation rules inline in component lifecycle hooks.

### Routing

Do:

- Lazy-load feature pages and admin sections with `loadComponent` and `loadChildren`.
- Eager-load only primary landing routes and routes required immediately after startup.
- Use route-level providers when a service should be scoped to a route tree.
- Keep guards focused on navigation decisions and UX.
- Use resolvers only when blocking navigation is better than showing a loading state.

Do not:

- Do not put all route components into the initial bundle.
- Do not create deeply nested lazy boundaries without measuring the extra requests.
- Do not treat route guards as security. The backend must enforce permissions.
- Do not fetch every feature's data from the root route.

### HTTP and API Integration

Do:

- Configure `HttpClient` once at application bootstrap.
- Use functional interceptors for authentication headers, retry/backoff, timeouts, request IDs, global error mapping, and loading indicators.
- Use `withInterceptors([...])` and keep interceptor order intentional.
- Clone immutable requests/responses before changing headers, params, or other request metadata.
- Use `HttpContextToken` for per-request interceptor behavior, such as disabling caching.
- Keep API clients in `core/services` or feature-owned data services depending on ownership.
- Type request and response DTOs and map them to UI models when useful.
- Centralize auth token handling and error normalization.

Do not:

- Do not deep-mutate request or response bodies inside interceptors unless you handle repeated execution safely.
- Do not scatter raw `HttpClient` calls throughout components.
- Do not log secrets, tokens, card data, or personal data from interceptors.
- Do not rely on frontend checks for object-level or role-level authorization.
- Do not silently swallow HTTP errors. Normalize them and surface user-appropriate messages.

### Performance

Do:

- Keep Angular 21 apps zoneless unless there is a specific compatibility blocker.
- Remove `zone.js` from builds and tests in zoneless apps.
- Verify that `provideZoneChangeDetection` is not overriding Angular 21's zoneless default.
- Make components compatible with zoneless change detection by using signals, `AsyncPipe`, event bindings, and `ChangeDetectorRef.markForCheck()` where needed.
- Prefer `ChangeDetectionStrategy.OnPush` for components that can support it, especially shared and large subtrees.
- Use `@defer` for below-the-fold, heavy, or rarely used UI.
- Use lazy routes to keep the initial bundle small.
- Use image optimization for product images and LCP images.
- Consider SSR, hydration, and incremental hydration for content-heavy or SEO-sensitive pages.
- Profile first with Chrome DevTools Angular profiling and Angular DevTools before optimizing.

Do not:

- Do not reintroduce ZoneJS in Angular 21 apps without a measured reason.
- Do not use `NgZone.onStable`, `NgZone.onUnstable`, or `NgZone.onMicrotaskEmpty` in zoneless code. Prefer render hooks or direct browser APIs.
- Do not optimize blindly before profiling.
- Do not put heavy sorting, filtering, or formatting directly in templates.
- Do not preload every lazy route by default.
- Do not ship large admin or checkout dependencies in the anonymous product-listing bundle.

### Security

Do:

- Keep Angular patched to the latest supported patch release.
- Use production AOT compilation.
- Treat all template-bound values as untrusted unless explicitly and safely trusted.
- Prefer Angular templates and bindings over direct DOM manipulation.
- Use `DomSanitizer.sanitize()` with the correct `SecurityContext` when direct sanitization is unavoidable.
- Keep `bypassSecurityTrust...` calls close to the data construction point and review them carefully.
- Use CSP and Trusted Types in production serving infrastructure.
- Generate CSP nonces per request or at the edge when CDN caching is involved.
- Keep XSRF/CSRF protection enabled for cookie-based auth and configure the backend to set and verify tokens.
- For SSR, configure explicit `allowedHosts` and proxy header trust.

Do not:

- Do not concatenate user input into Angular templates.
- Do not use JIT compilation in production.
- Do not call `bypassSecurityTrust...` on user-controlled values without strict validation and review.
- Do not directly use `document`, `ElementRef.nativeElement`, or third-party DOM APIs for untrusted content.
- Do not set SSR `allowedHosts` to `*` unless another trusted layer performs host validation.
- Do not store raw card data, auth secrets, refresh tokens, or sensitive payment details in frontend state.

### Testing

Do:

- Use the Angular CLI's current unit test setup. New Angular CLI projects use Vitest and `jsdom` by default.
- Keep `.spec.ts` next to the code under test.
- Test services and pure functions without DOM when possible.
- Test components with DOM when template behavior, inputs, outputs, accessibility, or user interaction matters.
- Use global test providers for common setup such as HTTP testing providers.
- Run browser-mode tests for behavior that depends on real browser APIs.
- Add tests for guards, interceptors, form validation, checkout state, cart state, payment edge cases, and admin authorization UX.

Do not:

- Do not rely only on snapshot tests for Angular components.
- Do not test private implementation details when public behavior is enough.
- Do not skip tests around auth, checkout, payments, and admin flows.
- Do not leave async subscriptions unmanaged in tests.

### Accessibility and UX

Do:

- Use semantic HTML before ARIA.
- Connect labels to form controls.
- Preserve keyboard navigation and visible focus states.
- Use buttons for actions and anchors for navigation.
- Make loading, error, empty, and disabled states explicit.
- Keep color contrast readable for product, cart, checkout, and admin screens.
- Test critical flows with keyboard-only navigation.

Do not:

- Do not replace native controls with custom controls unless there is a real product need.
- Do not hide focus outlines without providing an accessible replacement.
- Do not use color alone to communicate errors, stock state, or payment status.
- Do not block checkout submission without explaining why.

## Repository-Specific Recommendations

Do now:

- Keep `client/package.json` on `typescript: ~5.9.2` while Angular 21 is in use.
- Patch Angular packages to `21.2.13` when doing dependency maintenance.
- Keep `types: []` in `tsconfig.app.json` and test globals in `tsconfig.spec.json`.
- Consider adding `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noUncheckedSideEffectImports` to `client/tsconfig.json` after a focused frontend type-fix pass.
- Keep strict Angular compiler options enabled.
- Keep using standalone components and feature-based structure as already documented in `docs/CONVENTIONS.md`.

Do not do now:

- Do not run `npm install -D typescript@latest` in `client/`.
- Do not migrate to Angular 22 until stable release and Angular ecosystem packages used by this project support it.
- Do not add ZoneJS unless a specific third-party package requires it and the team accepts the tradeoff.
- Do not weaken `strictTemplates`, `strictInjectionParameters`, or `strictInputAccessModifiers` to bypass template errors.

Suggested frontend verification commands:

```bash
cd client
npm run lint
npm run build
npm test
```

## Upgrade Checklist

### Non-Angular TypeScript 5.x to 6.x

- Check Node/runtime support.
- Upgrade TypeScript in a branch.
- Add explicit `types` entries.
- Add explicit `rootDir`.
- Replace `moduleResolution: "node"` with `bundler` or `nodenext`.
- Remove `baseUrl` and make `paths` explicit.
- Remove ES5 output assumptions.
- Replace import assertions with import attributes.
- Fix strictness errors without `any`.
- Run type check, lint, tests, build, and declaration emit.

### Angular 21 Maintenance

- Keep TypeScript in `>=5.9.0 <6.0.0`.
- Align Angular packages to the same stable patch family.
- Run `ng update` instead of manual major edits.
- Verify third-party Angular packages support Angular 21.
- Run lint, build, and tests.
- Review SSR `allowedHosts` if SSR is introduced.
- Review CSP and Trusted Types before production deployment.

### Angular 22 Planning

- Wait for Angular 22 stable unless this is a test branch.
- Read Angular 22 release notes and update guide.
- Verify TypeScript compatibility table after stable release.
- Validate Angular Material/CDK and all Angular ecosystem packages.
- Run schematic migrations.
- Run full frontend regression tests.
- Confirm build budgets and SSR/security settings.

## Sources

- TypeScript GitHub releases: https://github.com/microsoft/TypeScript/releases
- TypeScript 6.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- TypeScript 7.0 Beta announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/
- TypeScript `noUncheckedIndexedAccess`: https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html
- TypeScript `exactOptionalPropertyTypes`: https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html
- TypeScript narrowing handbook: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- typescript-eslint typed linting: https://typescript-eslint.io/getting-started/typed-linting/
- Angular GitHub releases: https://github.com/angular/angular/releases
- Angular version compatibility: https://angular.dev/reference/versions
- Angular versioning and releases: https://angular.dev/reference/releases
- Angular style guide: https://angular.dev/style-guide
- Angular zoneless guide: https://angular.dev/guide/zoneless
- Angular performance guide: https://angular.dev/best-practices/performance
- Angular signals guide: https://angular.dev/guide/signals
- Angular template control flow: https://angular.dev/guide/templates/control-flow
- Angular forms overview: https://angular.dev/guide/forms
- Angular Signal Forms: https://angular.dev/essentials/signal-forms
- Angular route loading strategies: https://angular.dev/guide/routing/loading-strategies
- Angular HTTP interceptors: https://angular.dev/guide/http/interceptors
- Angular security best practices: https://angular.dev/best-practices/security
- Angular testing overview: https://angular.dev/guide/testing
