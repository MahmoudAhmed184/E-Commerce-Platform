import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../core/services/auth/auth.service';
import { CartService } from '../../core/services/cart/cart.service';
import { GlobalNavComponent } from './global-nav.component';

@Component({
  standalone: true,
  template: '',
})
class StubPage {}

describe('global-nav.component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalNavComponent],
      providers: [
        provideRouter([
          { path: 'products', component: StubPage },
          { path: 'orders', component: StubPage },
          { path: 'cart', component: StubPage },
          { path: 'auth/login', component: StubPage },
          { path: 'auth/register', component: StubPage },
        ]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null).asReadonly(),
            logout: () => of(undefined),
            clearSession: () => undefined,
          },
        },
        {
          provide: CartService,
          useValue: {
            itemCount: signal(0).asReadonly(),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('turns typed navbar text into the primary search suggestion', async () => {
    const fixture = TestBed.createComponent(GlobalNavComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    const root: unknown = fixture.nativeElement;
    expect(root).toBeInstanceOf(HTMLElement);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const input = queryFirstSearchInput(root);
    input.value = 'women';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const listbox = root.querySelector('[role="listbox"]');
    expect(listbox?.textContent).toContain('Search "women"');
    expect(listbox?.textContent).not.toContain('Order support');

    const firstOption = root.querySelector('[role="option"]');
    expect(firstOption).toBeInstanceOf(HTMLElement);
    if (!(firstOption instanceof HTMLElement)) {
      return;
    }

    firstOption.click();
    await fixture.whenStable();

    expect(router.url).toBe('/products?search=women');
  });
});

function queryFirstSearchInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input[type="search"]');
  expect(input).toBeInstanceOf(HTMLInputElement);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected global nav to render a search input.');
  }

  return input;
}
