import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { filter, map, startWith } from 'rxjs';

import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [FooterComponent, HeaderComponent, RouterOutlet, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService); // Initialize theme

  protected readonly isAdminRoute$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event: any) => event.urlAfterRedirects.startsWith('/admin')),
    startWith(this.router.url.startsWith('/admin'))
  );
}
