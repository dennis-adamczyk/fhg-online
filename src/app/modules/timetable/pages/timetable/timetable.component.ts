import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map, take, filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { constant } from 'src/configs/constants';
import { MatDialog } from '@angular/material';
import { SettingsService } from 'src/app/core/services/settings.service';
import { LessonDetailsDialog } from './dialogs/lesson-details/lesson-details.component';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  ActivatedRouteSnapshot
} from '@angular/router';
import { TimetableService } from '../../services/timetable.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.sass']
})
export class TimetableComponent implements OnInit {
  constant = constant;

  loading: boolean = false;
  get isLoading(): boolean {
    return this.timetable.isLoading || this.loading;
  }
  set isLoading(loading: boolean) {
    this.loading = loading;
  }

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    public helper: HelperService,
    private timetable: TimetableService,
    private dialog: MatDialog,
    public settings: SettingsService,
    public router: Router,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Der digitale Stundenplan zeigt dir immer den aktuellen Stundenplan an, ohne dass du alles mühselig selbst eintragen musst.',
      keywords:
        'Stundenplan, Kurse, Plan, Organisation, Schulplaner, FHG Online, FHG'
    });
  }

  /* ##### TOOLBAR EXTENTION ##### */

  toolbar: Element;
  sidenavContent: Element;
  scrollListener: any;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.XSmall)
    .pipe(map(result => result.matches));
  handsetSub: Subscription;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.handsetSub = this.handsetSub = this.isHandset$.subscribe(handset => {
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
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
      this.handsetSub.unsubscribe();
    }
  }

  /* ##### TRIGGER ##### */

  onClickLesson(day, period) {
    var lesson = this.timetable.data[day][period];
    if (isPlatformBrowser(this.platformId))
      history.pushState({ dialog: true }, undefined);
    this.dialog
      .open(LessonDetailsDialog, {
        data: { day: day, period: period, lesson: lesson },
        panelClass: 'mobile-full-screen-dialog',
        closeOnNavigation: true
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(data => (data !== undefined ? history.back() : false));
  }

  /* ##### HELPER ##### */

  getRoomPrefix(day: number, period: number): string {
    if (this.timetable.data[day][period].room.charAt(0).match(/\d/)) return 'R';
    return '';
  }
}
