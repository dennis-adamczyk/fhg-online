import {
  Component,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, of } from 'rxjs';
import { map, withLatestFrom, filter, tap } from 'rxjs/operators';
import { AppToolbarService, MenuItem } from '../services/app-toolbar.service';
import { Router, NavigationEnd } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import * as Hammer from 'hammerjs';
import { AuthService } from '../services/auth.service';
import { Location, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent {
  @ViewChild('drawer', { static: false }) drawer: MatSidenav;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));
  activeMenuItem$: Observable<MenuItem> = this.toolbarService.activeMenuItem$;
  extended: boolean = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public toolbarService: AppToolbarService,
    private router: Router,
    private elementRef: ElementRef,
    public auth: AuthService,
    public location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // this.activeMenuItem$.subscribe(x => console.log(x));
    router.events
      .pipe(
        withLatestFrom(this.isHandset$),
        filter(([a, b]) => b && a instanceof NavigationEnd)
      )
      .subscribe(_ => this.drawer.close());

    if (isPlatformBrowser(this.platformId)) {
      var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
      var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (!(isSafari || iOS)) {
        const hammertime = new Hammer(elementRef.nativeElement, {});
        hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        hammertime.on('panright', ev => {
          if (
            ev.pointerType !== 'mouse' &&
            ev.center.x >= 1 &&
            ev.center.x <= 50
          )
            this.drawer.open();
        });
        hammertime.on('panleft', ev => {
          if (ev.pointerType !== 'mouse') this.drawer.close();
        });
        hammertime.on('panup', event => false);
        hammertime.on('pandown', event => false);
      }
    }
    this.updateHeight();
  }

  onExtendNavigation() {
    this.extended = !this.extended;
  }

  onChange() {
    if (!this.drawer.opened) this.extended = false;
  }

  isLinkActive(url: string) {
    let charPos = this.router.url.indexOf('?');
    let cleanUrl =
      charPos !== -1 ? this.router.url.slice(0, charPos) : this.router.url;
    return cleanUrl === url;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateHeight();
  }

  updateHeight() {
    if (isPlatformBrowser(this.platformId)) {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
  }
}
