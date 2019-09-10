import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2,
  ElementRef
} from '@angular/core';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatSnackBar } from '@angular/material';
import * as firebase from 'firebase/app';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  group
} from '@angular/animations';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  ActivatedRouteSnapshot
} from '@angular/router';
import { HelperService } from 'src/app/core/services/helper.service';
import { Homework } from '../../models/homework.model';
import { TimetableService } from 'src/app/modules/timetable/services/timetable.service';
import { HomeworkService } from '../../services/homework.service';
import { Course } from 'src/app/modules/timetable/models/timetable.model';
import {
  timetableKey,
  homeworkKey,
  courseNamesKey
} from 'src/configs/constants';

@Component({
  selector: 'app-homework',
  templateUrl: './homework.component.html',
  styleUrls: ['./homework.component.sass'],
  animations: [
    trigger('expandCollapse', [
      state(
        'open',
        style({
          height: '*'
        })
      ),
      state(
        'close',
        style({
          height: '0px'
        })
      ),
      transition(
        'open <=> close',
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      )
    ]),
    trigger('detailsAnimation', [
      transition(':enter', [
        query('.homework-details', [
          style({
            margin: 0,
            boxShadow: 'none',
            backgroundColor: 'transparent',
            height: '48px'
          })
        ]),
        query('mat-toolbar', [style({ height: 0, opacity: 0 })]),
        query('.container .title h2', [style({ fontSize: '14px' })]),
        query('.container .details', [style({ opacity: 0 })]),
        query(':self, *', [animate(200, style('*'))])
      ]),
      transition(':leave', [
        group([
          query('.homework-details', [
            animate(
              200,
              style({
                margin: 0,
                boxShadow: 'none',
                height: '48px'
              })
            )
          ]),
          query('mat-toolbar', [
            animate(200, style({ height: 0, opacity: 0 }))
          ]),
          query('.container .title h2', [
            animate(200, style({ fontSize: '14px' }))
          ]),
          query('.container .details', [animate(200, style({ opacity: 0 }))])
        ])
      ])
    ])
  ]
})
export class HomeworkComponent implements OnInit {
  sort_by: 'due_day' | 'entered' = this.settings.get('homework.sort_by');
  max_days = parseInt(this.settings.get('homework.max_days')) | 0;

  loading: boolean = false;
  get isLoading(): boolean {
    return this.loading || this.homework.isLoading;
  }
  set isLoading(loading: boolean) {
    this.loading = loading;
  }

  week = new Date();

  loadedWeeks: string[] = [
    this.homework.getWeekNumber(this.week) + '-' + this.week.getFullYear(),
    this.homework.getWeekNumber(
      new Date(
        this.week.getFullYear(),
        this.week.getMonth(),
        this.week.getDate() - 7
      )
    ) +
      '-' +
      this.week.getFullYear()
  ];

  doneClosed: object = {};

  subs: Subscription[] = [];

  details: boolean = false;
  detailsId: string;
  detailsPersonal: boolean;
  detailsCourseName: string;
  detailsData: Homework;
  detailsAnimating: boolean;
  detailsChanges: Subscription[] = [];

  constructor(
    public homework: HomeworkService,
    private helper: HelperService,
    private db: FirestoreService,
    private auth: AuthService,
    private router: Router,
    private settings: SettingsService,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private elem: ElementRef,
    private route: ActivatedRoute,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    this.subs[0] = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.route.snapshot),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        })
      )
      .subscribe((route: ActivatedRouteSnapshot) => {
        if (route.url.length) {
          this.loadHomeworkDetails(route);
        } else {
          if (this.detailsChanges.length)
            this.detailsChanges.forEach(sub => sub.unsubscribe());
          this.details = false;
          this.detailsData = undefined;
        }
      });
  }

  loadHomeworkDetails(route: ActivatedRouteSnapshot) {
    this.detailsCourseName = route.params['course'];
    this.detailsId = route.params['id'];
    this.detailsPersonal = route.url[0].path == 'p';

    this.isLoading = true;

    let homeworkRef: string;
    if (this.detailsPersonal)
      homeworkRef = `users/${this.auth.user.id}/personalHomework/${this.detailsId}`;
    else
      homeworkRef = `years/${this.helper.getYear(this.auth.user
        .class as string)}/courses/${this.detailsCourseName}/homework/${
        this.detailsId
      }`;
    this.detailsChanges.push(
      this.db.docWithId$(homeworkRef).subscribe((homework: Homework) => {
        this.isLoading = false;
        if (!homework || Object.keys(homework).length <= 1) {
          this.router.navigate(['/homework'], { replaceUrl: true });
          return this.snackBar.open(
            'Diese Hausaufgabe wurde nicht gefunden',
            null,
            { duration: 4000 }
          );
        }
        if (homework.blocked) {
          this.router.navigate(['/homework'], { replaceUrl: true });
          return this.snackBar.open('Diese Hausaufgabe wurde entfernt', null, {
            duration: 4000
          });
        }
        let courseDetails = JSON.parse(localStorage.getItem(timetableKey));
        if (!courseDetails) {
          return this.snackBar
            .open('Ein Fehler ist aufgetreten', 'Erneut versuchen', {
              duration: 4000
            })
            .onAction()
            .pipe(take(1))
            .subscribe(() => {
              if (!isPlatformBrowser(this.platformId)) return;
              location.reload();
            });
        }
        courseDetails = courseDetails.courses.filter(
          c =>
            c.id ==
            (this.detailsPersonal ? homework.course : this.detailsCourseName)
        )[0] as Course;
        if (!courseDetails) {
          this.router.navigate(['/homework'], { replaceUrl: true });
          return this.snackBar.open(
            'Du bist kein Mitglied des Kurses der Hausaufgabe',
            null,
            { duration: 4000 }
          );
        }
        if (this.detailsPersonal) homework.personal = true;
        homework.course = courseDetails;
        homework.done =
          this.homework.done && this.homework.done[this.detailsId] === true;
        homework['selectedCorrection'] =
          this.homework.correction && this.homework.correction[this.detailsId];

        this.detailsChanges.push(
          this.db
            .doc$(`users/${this.auth.user.id}/singles/homework`)
            .subscribe(
              (singleHomework: {
                done: { [key: string]: boolean };
                correction: { [key: string]: { id: string } };
              }) => {
                if (!singleHomework || !singleHomework.done)
                  this.db.upsert(
                    `users/${this.auth.user.id}/singles/homework`,
                    {
                      done: {},
                      correction: {}
                    }
                  );

                this.homework.done = singleHomework.done;
                this.homework.correction = singleHomework.correction;
                localStorage.setItem(
                  homeworkKey,
                  JSON.stringify({
                    ...JSON.parse(localStorage.getItem(homeworkKey)),
                    done: singleHomework.done,
                    correction: singleHomework.correction
                  })
                );
                homework.done =
                  this.homework.done &&
                  this.homework.done[this.detailsId] === true;
                homework.selectedCorrection =
                  this.homework.correction &&
                  this.homework.correction[this.detailsId];
                this.detailsData = homework;
                this.details = true;
                if (this.sort_by == 'entered') {
                  this.week = this.helper.getDateOf(homework.entered.date);
                  this.loadWeeksHomework();
                  try {
                    setTimeout(() =>
                      !document.querySelector('mat-sidenav-content').scrollTop
                        ? (document.querySelector(
                            'mat-sidenav-content'
                          ).scrollTop = this.elem.nativeElement.querySelector(
                            'app-homework-details'
                          )
                            ? this.elem.nativeElement.querySelector(
                                'app-homework-details'
                              ) || undefined
                            : undefined)
                        : null
                    );
                  } catch (error) {}
                } else if (this.detailsOutsideSorting('after')) {
                  setTimeout(() =>
                    !document.querySelector('mat-sidenav-content').scrollTop
                      ? (document.querySelector(
                          'mat-sidenav-content'
                        ).scrollTop =
                          this.elem.nativeElement.querySelector(
                            'app-homework-details'
                          ).offsetTop || undefined)
                      : null
                  );
                }
              }
            )
        );
      })
    );
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
        } else if (handset && this.sort_by == 'entered') {
          this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
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

  /* ##### LOAD DATA ##### */

  loadWeeksHomework() {
    if (
      this.week.getFullYear() == new Date().getFullYear() &&
      this.homework.getWeekNumber(this.week) >
        this.homework.getWeekNumber(new Date()) - 2
    )
      return;
    if (
      !this.loadedWeeks.includes(
        this.homework.getWeekNumber(this.week) + '-' + this.week.getFullYear()
      )
    )
      this.isLoading = true;

    let monday = new Date(this.week);
    let day = monday.getDay() || 7;
    if (day !== 1) monday.setDate(monday.getDate() - (day - 1));
    monday.setHours(0);
    monday.setMinutes(0);
    monday.setSeconds(0);
    monday.setMilliseconds(0);

    let sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23);
    sunday.setMinutes(59);
    sunday.setSeconds(59);
    sunday.setMilliseconds(999);

    let newHomework = JSON.parse(localStorage.getItem(homeworkKey))
      .homework as Homework[];

    this.db
      .colWithIds$(`users/${this.auth.user.id}/personalHomework`, ref =>
        ref
          .where('entered.date', '>=', monday)
          .where('entered.date', '<=', sunday)
      )
      .pipe(take(1))
      .subscribe((homeworkList: Homework[]) => {
        if (!homeworkList.length) return;
        homeworkList.forEach(homework => {
          let courseDetails = JSON.parse(
            localStorage.getItem(timetableKey)
          ).courses.filter(c => c.id == homework.course)[0] as Course;
          homework.course = {
            id: courseDetails.id,
            subject: courseDetails.subject,
            short: courseDetails.short,
            color: courseDetails.color
          };
          homework.personal = true;
          newHomework = newHomework.filter(
            h => h.id !== homework.id || !h.personal
          );
          newHomework.push(homework);
        });
        this.homework.data = this.homework.convertToDateList(newHomework);
      });

    this.homework.checkCourseNames().then(() => {
      JSON.parse(localStorage.getItem(courseNamesKey)).names.forEach(
        (courseName, i) => {
          this.db
            .colWithIds$(
              `years/${this.helper.getYear(this.auth.user
                .class as string)}/courses/${courseName}/homework`,
              ref =>
                ref
                  .where('entered.date', '>=', monday)
                  .where('entered.date', '<=', sunday)
            )
            .pipe(take(1))
            .subscribe((homeworkList: Homework[]) => {
              if (
                i ==
                JSON.parse(localStorage.getItem(courseNamesKey)).names.length -
                  1
              ) {
                this.isLoading = false;
                this.loadedWeeks.push(
                  this.homework.getWeekNumber(this.week) +
                    '-' +
                    this.week.getFullYear()
                );
              }

              if (!homeworkList.length) return;

              let courseDetails = JSON.parse(
                localStorage.getItem(timetableKey)
              ).courses.filter(c => c.id == courseName)[0] as Course;

              homeworkList.forEach(homework => {
                newHomework = newHomework.filter(
                  h => h.id !== homework.id || h.personal
                );
                newHomework.push({
                  ...homework,
                  course: {
                    id: courseName,
                    subject: courseDetails.subject,
                    short: courseDetails.short,
                    color: courseDetails.color
                  }
                });
              });
              this.homework.data = this.homework.convertToDateList(newHomework);
            });
        }
      );
    });
  }

  /* ##### TRIGGERS ###### */

  onChangeItemCheck(event, id: string) {
    this.db.update(`users/${this.auth.user.id}/singles/homework`, {
      [`done.${id}`]: event.checked
    });
    this.homework.done[id] = event.checked;
  }

  onChangeWeek(add: number) {
    this.week.setDate(this.week.getDate() + 7 * add);
    this.loadWeeksHomework();
  }

  /* ##### HELPER ##### */

  getDisplayDates(): string[] {
    let output: string[] = [];
    if (this.sort_by == 'entered') {
      let monday = new Date(this.week);
      let day = monday.getDay() || 7;
      if (day !== 1) monday.setDate(monday.getDate() - (day - 1));
      for (let index = 0; index < 5; index++) {
        monday.setDate(monday.getDate() + (index ? 1 : 0));
        output.push(this.homework.getKeyDateFormat(monday));
      }
    } else {
      let maxSchoolTime = (this.homework.getMaxSchoolTime()
        ? this.homework.getMaxSchoolTime()
        : '0:0'
      ).split(':');
      var maxSchoolTimeDate = new Date();
      maxSchoolTimeDate.setHours(parseInt(maxSchoolTime[0]));
      maxSchoolTimeDate.setMinutes(parseInt(maxSchoolTime[1]));
      maxSchoolTimeDate.setSeconds(0);
      maxSchoolTimeDate.setMilliseconds(0);
      let skipToday = maxSchoolTimeDate.getTime() <= Date.now();
      let current = new Date();
      for (let index = 0; index < this.max_days; index++) {
        current.setDate(current.getDate() + (index ? 1 : skipToday ? 1 : 0));
        if (current.getDay() > 5 || current.getDay() == 0) {
          index--;
          continue;
        }
        output.push(this.homework.getKeyDateFormat(current));
      }
    }
    return output;
  }

  getOptionalYear(date: Date): number {
    if (date.getFullYear() == new Date().getFullYear()) return;
    return this.week.getFullYear();
  }

  getDisplayWeekDay(
    date: string | Date | firebase.firestore.Timestamp
  ): string {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let current;
    if (date instanceof Date) current = date;
    if (date instanceof firebase.firestore.Timestamp) current = date.toDate();
    if (!current) {
      let parts = (date as string).split('-');
      current = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
    }

    const formatter = new Intl.DateTimeFormat('de', { weekday: 'long' });
    let output = formatter.format(current);
    if (this.sort_by == 'due_day') {
      if (current.toDateString() == new Date().toDateString()) output = 'Heute';
      if (current.toDateString() == tomorrow.toDateString()) output = 'Morgen';
    }
    return output;
  }

  getDisplayDay(date: string | Date | firebase.firestore.Timestamp): string {
    if (date instanceof Date) return date.getDate().toString();
    if (date instanceof firebase.firestore.Timestamp)
      return date
        .toDate()
        .getDate()
        .toString();
    let parts = date.split('-');
    let current = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    return current.getDate().toString();
  }

  getDisplayMonth(date: string | Date | firebase.firestore.Timestamp): string {
    let current;
    if (date instanceof Date) current = date;
    if (date instanceof firebase.firestore.Timestamp) current = date.toDate();
    if (!current) {
      let parts = (date as string).split('-');
      current = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      );
    }

    const formatter = new Intl.DateTimeFormat('de', { month: 'short' });
    return formatter.format(current);
  }

  detailsOutsideSorting(where: 'before' | 'after') {
    if (
      !this.details ||
      !this.detailsData ||
      !Object.keys(this.detailsData).length
    )
      return;
    if (this.sort_by !== 'due_day') return;

    let until = this.helper.getDateOf(this.detailsData.until.date);

    if (where == 'before') {
      let minParts = this.getDisplayDates()[0]
        .split('-')
        .map(s => parseInt(s));
      let min = new Date(minParts[0], minParts[1] - 1, minParts[2]);

      if (until.getTime() >= min.getTime()) return;

      return this.detailsData;
    } else {
      let maxParts = this.getDisplayDates()
        [this.getDisplayDates().length - 1].split('-')
        .map(s => parseInt(s));
      let max = new Date(maxParts[0], maxParts[1] - 1, maxParts[2]);

      if (until.getTime() <= max.getTime()) return;

      return this.detailsData;
    }
  }

  getHomeworkFilteredByType(
    type: 'done' | 'pending',
    homework: { [key: number]: Homework }
  ): Homework[] {
    if (!homework) return;
    let output = [];
    let newHomework = Object.assign({}, homework);
    let keys = Object.keys(homework).sort();
    for (const lesson of keys) {
      if (homework.hasOwnProperty(lesson)) {
        const assignment = newHomework[lesson];
        if (Array.isArray(assignment)) {
          assignment.forEach(subAssignment => {
            if (subAssignment.blocked) return;
            if (
              type == 'done' &&
              this.homework.done &&
              this.homework.done[subAssignment.id] === true
            )
              output.push(subAssignment);
            if (
              type == 'pending' &&
              (!this.homework.done || !this.homework.done[subAssignment.id])
            )
              output.push(subAssignment);
          });
        } else {
          if (assignment.blocked) return;
          if (
            type == 'done' &&
            this.homework.done &&
            this.homework.done[assignment.id] === true
          )
            output.push(assignment);
          if (
            type == 'pending' &&
            (!this.homework.done || !this.homework.done[assignment.id])
          )
            output.push(assignment);
        }
      }
    }
    if (!output.length) return;
    return output;
  }

  getDisplayCorrTitle(item: Homework): string {
    if (
      this.homework.correction &&
      this.homework.correction[item.id] &&
      this.homework.correction[item.id].id
    ) {
      if (this.homework.correction[item.id].title)
        return this.homework.correction[item.id].title;
    }
    return item.title;
  }

  isDisplayCorrDeleted(item): boolean {
    if (
      this.homework.correction &&
      this.homework.correction[item.id] &&
      this.homework.correction[item.id].id
    ) {
      if (this.homework.correction[item.id].delete) return true;
    }
    return false;
  }
}
