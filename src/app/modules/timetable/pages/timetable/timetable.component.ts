import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Observable } from 'rxjs';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.sass']
})
export class TimetableComponent implements OnInit {
  toolbar: Element;
  sidenavContent: Element;
  scrollListener: any;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.XSmall)
    .pipe(map(result => result.matches));

  constructor(
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.isHandset$.subscribe(handset => {
        if (!handset) {
          let scrollHandler = () => {
            if (this.sidenavContent.scrollTop > 64) {
              this.renderer.removeStyle(this.toolbar, 'box-shadow');
            } else {
              this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
            }
          };
          scrollHandler();
          this.scrollListener = this.renderer.listen(
            this.sidenavContent,
            'scroll',
            event => scrollHandler()
          );
        } else {
          this.renderer.removeStyle(this.toolbar, 'box-shadow');
        }
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof this.scrollListener == 'function') this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }
}
