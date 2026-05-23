import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App, isAdminWorkspaceUrl } from './app';
import { AuthService } from './core/services/auth/auth.service';

@Component({
  standalone: true,
  template: '',
})
class StubPage {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'auth/login', component: StubPage },
          { path: 'products', component: StubPage },
          { path: 'admin', component: StubPage },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navigation brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled: unknown = fixture.nativeElement;
    expect(compiled).toBeInstanceOf(HTMLElement);
    if (!(compiled instanceof HTMLElement)) {
      return;
    }
    expect(compiled.querySelector('a')?.textContent).toContain('Vendra');
  });

  it('hides storefront chrome on admin routes', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/admin');
    fixture.detectChanges();

    const compiled: unknown = fixture.nativeElement;
    expect(compiled).toBeInstanceOf(HTMLElement);
    if (!(compiled instanceof HTMLElement)) {
      return;
    }
    expect(compiled.querySelector('app-global-nav')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });

  it('renders the session timeout modal outside auth pages', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const authService = TestBed.inject(AuthService);

    await router.navigateByUrl('/products');
    authService.markSessionExpiring(60, true);
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Your session is about to expire');
  });

  it('does not render the session timeout modal on auth pages', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const authService = TestBed.inject(AuthService);

    await router.navigateByUrl('/auth/login');
    authService.markSessionExpiring(60, true);
    fixture.detectChanges();

    const compiled: unknown = fixture.nativeElement;
    expect(compiled).toBeInstanceOf(HTMLElement);
    if (!(compiled instanceof HTMLElement)) {
      return;
    }
    expect(compiled.textContent).not.toContain('Your session is about to expire');
  });
});

describe('isAdminWorkspaceUrl', () => {
  it('matches admin workspace paths only', () => {
    expect(isAdminWorkspaceUrl('/admin')).toBe(true);
    expect(isAdminWorkspaceUrl('/admin/products?sort=newest')).toBe(true);
    expect(isAdminWorkspaceUrl('/products')).toBe(false);
    expect(isAdminWorkspaceUrl('/administrator')).toBe(false);
  });
});
