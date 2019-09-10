import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { constant } from 'src/configs/constants';
import { MatDialog } from '@angular/material';
import { SettingsService } from 'src/app/core/services/settings.service';
import { LessonDetailsDialog } from './dialogs/lesson-details/lesson-details.component';
import { Router } from '@angular/router';
import { TimetableService } from '../../services/timetable.service';
import { HelperService } from 'src/app/core/services/helper.service';

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
    public helper: HelperService,
    private timetable: TimetableService,
    private dialog: MatDialog,
    public settings: SettingsService,
    public router: Router,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

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
