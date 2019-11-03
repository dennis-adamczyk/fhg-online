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
import { map, withLatestFrom, filter, tap, startWith } from 'rxjs/operators';
import { AppToolbarService, MenuItem } from '../services/app-toolbar.service';
import {
  Router,
  NavigationEnd,
  NavigationStart,
  NavigationCancel
} from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import * as Hammer from 'hammerjs';
import { AuthService } from '../services/auth.service';
import { Location, isPlatformBrowser } from '@angular/common';
import { HelperService } from '../services/helper.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent {
  @ViewChild('drawer', { static: false }) drawer: MatSidenav;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      startWith(
        isPlatformBrowser(this.platformId)
          ? window.matchMedia('(max-width: 599px)').matches
          : true
      )
    );
  activeMenuItem$: Observable<MenuItem> = this.toolbarService.activeMenuItem$;
  extended: boolean = false;
  loading = true;

  private offlineHelpArticleId = 'uHbNn2XxMhdBM38UxoLn';

  constructor(
    public helper: HelperService,
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    public toolbarService: AppToolbarService,
    private router: Router,
    private elementRef: ElementRef,
    public auth: AuthService,
    public location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    router.events
      .pipe(
        withLatestFrom(this.isHandset$),
        filter(([a, b]) => b && a instanceof NavigationEnd)
      )
      .subscribe(() => this.drawer.close());

    if (isPlatformBrowser(this.platformId)) {
      let oldOnline;
      this.helper.onlineStatus$.subscribe(online => {
        if (online != oldOnline && oldOnline !== undefined) {
          if (online == false) {
            this.snackBar
              .open('Du bist nun offline', 'Mehr Infos', {
                duration: 4000
              })
              .onAction()
              .subscribe(() =>
                this.router.navigate(['/help/' + this.offlineHelpArticleId])
              );
          }
          if (online == true) {
            this.snackBar.open('Du bist nun wieder online', null, {
              duration: 4000
            });
          }
        }
        oldOnline = online;
      });

      var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
      var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (!(isSafari || iOS)) {
        const hammertime = new Hammer(elementRef.nativeElement, {});
        hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        hammertime.on('panright', ev => {
          if (
            ev.pointerType !== 'mouse' &&
            ev.changedPointers[0].clientX - ev.deltaX >= 1 &&
            ev.changedPointers[0].clientX - ev.deltaX <= 50
          ) {
            this.drawer.open();
            ev.preventDefault();
          }
        });
        hammertime.on('panleft', ev => {
          if (ev.pointerType !== 'mouse') {
            this.drawer.close();
            ev.preventDefault();
          }
        });
        hammertime.on('panup', event => false);
        hammertime.on('pandown', event => false);
      }
    }
    this.updateHeight();
  }

  ngAfterViewInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel
      ) {
        this.loading = false;
      }
    });
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
