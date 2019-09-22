import { Component } from '@angular/core';
import { UpdateService } from './core/services/update.service';
import { AuthService } from './core/services/auth.service';
import { AnalyticsService } from './core/services/analytics.service';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel
} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  theme: string = 'light-theme';

  constructor(
    private updater: UpdateService,
    public auth: AuthService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit() {
    this.analytics.init();
  }
}
