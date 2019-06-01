import { Component, ViewChild, ElementRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, of } from 'rxjs';
import { map, withLatestFrom, filter, tap } from 'rxjs/operators';
import { AppToolbarService, MenuItem } from '../services/app-toolbar.service';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material';
import * as Hammer from 'hammerjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent {
  @ViewChild('drawer') drawer: MatSidenav;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));
  activeMenuItem$: Observable<MenuItem>;
  extended: boolean = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private toolbarService: AppToolbarService,
    private router: Router,
    private elementRef: ElementRef,
    public auth: AuthService
  ) {
    this.activeMenuItem$ = this.toolbarService.activeMenuItem$;
    router.events
      .pipe(
        withLatestFrom(this.isHandset$),
        filter(([a, b]) => b && a instanceof NavigationEnd)
      )
      .subscribe(_ => this.drawer.close());

    const hammertime = new Hammer(elementRef.nativeElement, {});
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammertime.on('panright', ev => {
      if (ev.pointerType !== 'mouse' && ev.center.x >= 1 && ev.center.x <= 50)
        this.drawer.open();
    });
    hammertime.on('panleft', ev => {
      if (ev.pointerType !== 'mouse') this.drawer.close();
    });
    hammertime.on('panup', event => false);
    hammertime.on('pandown', event => false);
  }

  onExtendNavigation() {
    this.extended = !this.extended;
  }

  onChange() {
    if (!this.drawer.opened) this.extended = false;
  }
}
