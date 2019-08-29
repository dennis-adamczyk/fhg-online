import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2,
  ElementRef,
  ViewChild
} from '@angular/core';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { settings } from 'cluster';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import {
  Course,
  TimetableComponent,
  timetableKey
} from 'src/app/modules/timetable/pages/timetable/timetable.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as firebase from 'firebase/app';
import { constants } from 'os';
import { constant } from 'src/configs/constants';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  group
} from '@angular/animations';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  ActivatedRouteSnapshot
} from '@angular/router';

export interface Homework {
  id?: string;
  title: string;
  details?: string;
  until: {
    date: firebase.firestore.Timestamp | Date;
    lesson: number;
  };
  entered: {
    date: firebase.firestore.Timestamp | Date;
    lesson: number;
  };
  attachments?: object[];
  course?:
    | {
        id: string;
        subject: string;
        short: string;
        color: string;
      }
    | Course;
  personal?: boolean;
  done?: boolean;
}

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

  isLoading: boolean = true;

  storageKey = 'homework';
  courseNamesKey = 'course_names';
  timetableKey = timetableKey;

  homework: object;
  done: object;
  doneClosed: object = {};

  week = new Date();
  loadedWeeks: string[] = [];

  subs: Subscription[] = [];

  details: boolean = false;
  detailsId: string;
  detailsPersonal: boolean;
  detailsCourseName: string;
  detailsData: Homework;
  detailsAnimating: boolean;

  constructor(
    private db: FirestoreService,
    private auth: AuthService,
    private router: Router,
    private settings: SettingsService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
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
      homeworkRef = `years/${this.getYear(this.auth.user
        .class as string)}/courses/${this.detailsCourseName}/homework/${
        this.detailsId
      }`;
    this.db.docWithId$(homeworkRef).subscribe((homework: Homework) => {
      this.isLoading = false;
      if (!homework) {
        this.router.navigate(['/homework'], { replaceUrl: true });
        return this.snackbar.open(
          'Diese Hausaufgabe wurde nicht gefunden',
          null,
          { duration: 4000 }
        );
      }
      let courseDetails = JSON.parse(localStorage.getItem(timetableKey));
      if (!courseDetails) {
        return this.snackbar
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
        return this.snackbar.open(
          'Du bist kein Mitglied des Kurses der Hausaufgabe',
          null,
          { duration: 4000 }
        );
      }
      if (this.detailsPersonal) homework.personal = true;
      homework.course = courseDetails;
      homework.done = this.done && this.done[this.detailsId] === true;
      if (homework.done == undefined) {
        return this.db
          .doc$(`users/${this.auth.user.id}/singles/homework`)
          .subscribe((singleHomework: { done: { [key: string]: boolean } }) => {
            if (!singleHomework || !singleHomework.done)
              this.db.upsert(`users/${this.auth.user.id}/singles/homework`, {
                done: {}
              });

            this.done = singleHomework.done;
            localStorage.setItem(
              this.storageKey,
              JSON.stringify({
                ...JSON.parse(localStorage.getItem(this.storageKey)),
                done: singleHomework.done
              })
            );
            homework.done = this.done && this.done[this.detailsId] === true;
            this.detailsData = homework;
            this.details = true;
          });
      }
      this.detailsData = homework;
      this.details = true;
      if (this.sort_by == 'entered') {
        this.week = this.getDateOf(homework.entered.date);
        this.loadWeeksHomework();
        setTimeout(() =>
          !document.querySelector('mat-sidenav-content').scrollTop
            ? (document.querySelector('mat-sidenav-content').scrollTop =
                this.elem.nativeElement.querySelector('app-homework-details')
                  .offsetTop || undefined)
            : null
        );
      } else if (this.detailsOutsideSorting('after')) {
        setTimeout(() =>
          !document.querySelector('mat-sidenav-content').scrollTop
            ? (document.querySelector('mat-sidenav-content').scrollTop =
                this.elem.nativeElement.querySelector('app-homework-details')
                  .offsetTop || undefined)
            : null
        );
      }
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
        } else if (handset && this.sort_by == 'entered') {
          this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
        } else {
          this.renderer.removeStyle(this.toolbar, 'box-shadow');
        }
      });
    }
    this.loadData();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
      this.handsetSub.unsubscribe();
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (
        isPlatformBrowser(this.platformId) &&
        typeof localStorage == 'undefined'
      ) {
        throw 'not supported';
      }
    } catch (ex) {
      this.dialog.open(AcceptCancelDialog, {
        data: {
          title: 'Cookies aktivieren',
          content:
            'Um diese Seite nutzen zu können, musst du Cookies und das lokale Speichern aktivieren.',
          accept: 'OK'
        }
      });
      this.router.navigate(['/start']);
      return;
    }
    if (
      !localStorage.getItem(this.storageKey) ||
      !localStorage.getItem(this.storageKey).length
    ) {
      this.downloadHomework();
    } else {
      this.homework = this.convertToDateList(
        JSON.parse(localStorage.getItem(this.storageKey)).homework
      );
      this.done = JSON.parse(localStorage.getItem(this.storageKey)).done;
      this.isLoading = false;
      this.updateHomework();
    }
  }

  downloadHomework() {
    this.checkCourseNames().then(go => {
      if (!go) return;
      let clazz = this.auth.user.class as string;
      let year = this.getYear(clazz);
      let courses = JSON.parse(localStorage.getItem(this.courseNamesKey))
        .names as string[];
      let homeworkList = [];

      this.db
        .doc$(`users/${this.auth.user.id}/personalHomework/--index--`)
        .pipe(take(1))
        .subscribe((index: { homework: Homework[] }) => {
          if (index && index.homework && index.homework.length) {
            index.homework.forEach(homework => {
              let courseDetails = JSON.parse(
                localStorage.getItem(this.timetableKey)
              ).courses.filter(c => c.id == homework.course)[0] as Course;
              homework.course = {
                id: courseDetails.id,
                subject: courseDetails.subject,
                short: courseDetails.short,
                color: courseDetails.color
              };
              homework.personal = true;
              homeworkList.push(homework);
            });
          }
        });

      if (!courses.length) {
        this.homework = this.convertToDateList(homeworkList);
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({ homework: homeworkList, updated: Date.now() })
        );
        this.updateHomework();
        this.isLoading = false;
      }

      courses.forEach((course, i) => {
        let courseDetails = JSON.parse(
          localStorage.getItem(this.timetableKey)
        ).courses.filter(c => c.id == course)[0] as Course;
        this.db
          .doc$(`years/${year}/courses/${course}/homework/--index--`)
          .pipe(take(1))
          .subscribe((index: { homework: Homework[] }) => {
            if (index && index.homework && index.homework.length) {
              index.homework.forEach(homework => {
                homeworkList.push({
                  ...homework,
                  course: {
                    id: course,
                    subject: courseDetails.subject,
                    short: courseDetails.short,
                    color: courseDetails.color
                  }
                });
              });
            }
            if (i == courses.length - 1) {
              this.homework = this.convertToDateList(homeworkList);
              localStorage.setItem(
                this.storageKey,
                JSON.stringify({ homework: homeworkList, updated: Date.now() })
              );
              this.updateHomework();
              this.isLoading = false;
            }
          });
      });
    });
  }

  updateHomework() {
    this.checkCourseNames().then(go => {
      if (!go) return;
      this.db
        .doc$(`years/${this.getYear(this.auth.user.class as string)}`)
        .subscribe(
          (year: {
            classes: string[];
            homework_updated: { [key: string]: firebase.firestore.Timestamp };
          }) => {
            if (!year.homework_updated) return;
            let localyUpdated = JSON.parse(
              localStorage.getItem(this.storageKey)
            ).updated;
            JSON.parse(localStorage.getItem(this.courseNamesKey)).names.forEach(
              courseName => {
                if (!year.homework_updated[courseName]) return;
                if (
                  year.homework_updated[courseName].toMillis() > localyUpdated
                ) {
                  this.db
                    .doc$(
                      `years/${this.getYear(this.auth.user
                        .class as string)}/courses/${courseName}/homework/--index--`
                    )
                    .pipe(take(1))
                    .subscribe((index: { homework: Homework[] }) => {
                      let courseDetails = JSON.parse(
                        localStorage.getItem(this.timetableKey)
                      ).courses.filter(c => c.id == courseName)[0] as Course;
                      let newHomework = JSON.parse(
                        localStorage.getItem(this.storageKey)
                      ).homework.filter(
                        (h: Homework) => h.course['id'] !== courseName
                      );
                      index.homework.forEach(homework => {
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
                      localStorage.setItem(
                        this.storageKey,
                        JSON.stringify({
                          homework: newHomework,
                          updated: Date.now()
                        })
                      );
                      this.homework = this.convertToDateList(newHomework);
                      this.loadedWeeks.push(
                        this.getWeekNumber(this.week) +
                          '-' +
                          this.week.getFullYear()
                      );
                      let previousWeek = new Date(this.week);
                      previousWeek.setDate(previousWeek.getDate() - 7);
                      this.loadedWeeks.push(
                        this.getWeekNumber(previousWeek) +
                          '-' +
                          previousWeek.getFullYear()
                      );
                    });
                }
              }
            );
          }
        );
    });
    this.auth.user$.subscribe(user => {
      if (!user.homework_updated) return;
      let localyUpdated = JSON.parse(localStorage.getItem(this.storageKey))
        .updated;
      if (user.homework_updated.toMillis() > localyUpdated) {
        this.db
          .doc$(`users/${user.id}/personalHomework/--index--`)
          .pipe(take(1))
          .subscribe((index: { homework: Homework[] }) => {
            let newHomework = JSON.parse(
              localStorage.getItem(this.storageKey)
            ).homework.filter((h: Homework) => !h.personal);
            index.homework.forEach(homework => {
              let courseDetails = JSON.parse(
                localStorage.getItem(this.timetableKey)
              ).courses.filter(c => c.id == homework.course)[0] as Course;
              homework.course = {
                id: courseDetails.id,
                subject: courseDetails.subject,
                short: courseDetails.short,
                color: courseDetails.color
              };
              homework.personal = true;
              newHomework.push(homework);
            });
            localStorage.setItem(
              this.storageKey,
              JSON.stringify({
                homework: newHomework,
                updated: Date.now()
              })
            );
            this.homework = this.convertToDateList(newHomework);
          });
      }
    });
    this.db
      .doc$(`users/${this.auth.user.id}/singles/homework`)
      .subscribe((homework: { done: { [key: string]: boolean } }) => {
        if (!homework || !homework.done)
          return this.db.upsert(`users/${this.auth.user.id}/singles/homework`, {
            done: {}
          });

        this.done = homework.done;
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({
            ...JSON.parse(localStorage.getItem(this.storageKey)),
            done: homework.done
          })
        );
      });
  }

  loadWeeksHomework() {
    if (
      this.week.getFullYear() == new Date().getFullYear() &&
      this.getWeekNumber(this.week) > this.getWeekNumber(new Date()) - 2
    )
      return;
    if (
      !this.loadedWeeks.includes(
        this.getWeekNumber(this.week) + '-' + this.week.getFullYear()
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

    let newHomework = JSON.parse(localStorage.getItem(this.storageKey))
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
            localStorage.getItem(this.timetableKey)
          ).courses.filter(c => c.id == homework.course)[0] as Course;
          homework.course = {
            id: courseDetails.id,
            subject: courseDetails.subject,
            short: courseDetails.short,
            color: courseDetails.color
          };
          homework.personal = true;
          newHomework.push(homework);
        });
        this.homework = this.convertToDateList(newHomework);
      });

    this.checkCourseNames().then(() => {
      JSON.parse(localStorage.getItem(this.courseNamesKey)).names.forEach(
        (courseName, i) => {
          this.db
            .colWithIds$(
              `years/${this.getYear(this.auth.user
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
                JSON.parse(localStorage.getItem(this.courseNamesKey)).names
                  .length -
                  1
              ) {
                this.isLoading = false;
                this.loadedWeeks.push(
                  this.getWeekNumber(this.week) + '-' + this.week.getFullYear()
                );
              }

              if (!homeworkList.length) return;

              let courseDetails = JSON.parse(
                localStorage.getItem(this.timetableKey)
              ).courses.filter(c => c.id == courseName)[0] as Course;

              homeworkList.forEach(homework => {
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
              this.homework = this.convertToDateList(newHomework);
            });
        }
      );
    });
  }

  checkCourseNames() {
    let updateCourseNames = (resolve, reject) => {
      let clazz = this.auth.user.class as string;
      let singleCourses: Course[] = [],
        multiCourses: Course[] = [];
      let singles = false,
        multis = false;

      const setCourseNames = () => {
        let timetableInstance = new TimetableComponent(
          this.auth,
          this.dialog,
          this.settings,
          this.router,
          this.db,
          this.renderer,
          this.breakpointObserver,
          this.platformId
        );
        timetableInstance.timetable = timetableInstance.convertToTimetable([
          ...singleCourses,
          ...multiCourses
        ]);
        localStorage.setItem(
          timetableKey,
          JSON.stringify({
            updated: Date.now(),
            courses: [...singleCourses, ...multiCourses]
          })
        );
        localStorage.setItem(
          this.courseNamesKey,
          JSON.stringify({
            names: [...singleCourses, ...multiCourses].map(course => course.id)
          })
        );
        timetableInstance.updateTimetable();
        timetableInstance = null;
        this.downloadHomework();
        resolve(false);
      };

      if (this.isClass(clazz)) {
        this.db
          .colWithIds$(`years/${this.getYear(clazz)}/courses`, ref =>
            ref
              .where('multi', '==', false)
              .where('class', 'array-contains', clazz)
          )
          .pipe(take(1))
          .toPromise()
          .then((courses: Course[]) => {
            singleCourses = courses;
            singles = true;
            if (multis) {
              setCourseNames();
            }
          });
      }
      if (!this.auth.user.courses.length) multis = true;
      if (!this.auth.user.courses.length && !this.isClass(clazz))
        setCourseNames();
      this.auth.user.courses.forEach((courseName, index) => {
        this.db
          .docWithId$(`years/${this.getYear(clazz)}/courses/${courseName}`)
          .pipe(take(1))
          .toPromise()
          .then((course: Course) => {
            multiCourses.push(course);
            if (index == this.auth.user.courses.length - 1) {
              multis = true;
              if ((this.isClass(clazz) && singles) || !this.isClass(clazz)) {
                setCourseNames();
              }
            }
          });
      });
    };

    if (
      !localStorage.getItem(this.courseNamesKey) ||
      !localStorage.getItem(this.courseNamesKey).length
    ) {
      return new Promise(updateCourseNames);
    } else {
      if (
        JSON.stringify(
          JSON.parse(localStorage.getItem(this.courseNamesKey))
            .names.filter(course =>
              this.isClass(this.auth.user.class as string)
                ? course.charAt(1).match(/\-/)
                : course.charAt(2).match(/\-/)
            )
            .sort()
        ) !== JSON.stringify(this.auth.user.courses.sort())
      ) {
        return new Promise(updateCourseNames);
      }
    }
    return new Promise(resolve => resolve(true));
  }

  /* ##### TRIGGERS ###### */

  onChangeItemCheck(event, id: string) {
    this.db.update(`users/${this.auth.user.id}/singles/homework`, {
      [`done.${id}`]: event.checked
    });
    this.done[id] = event.checked;
  }

  onChangeWeek(add: number) {
    this.week.setDate(this.week.getDate() + 7 * add);
    this.loadWeeksHomework();
  }

  /* ##### HELPER ##### */

  convertToDateList(homework: Homework[]): object {
    let output = {};
    homework.forEach((homework: Homework) => {
      let date =
        this.sort_by == 'entered'
          ? this.getKeyDateFormat(this.getDateOf(homework.entered.date))
          : this.getKeyDateFormat(this.getDateOf(homework.until.date));
      let lesson =
        this.sort_by == 'entered'
          ? homework.entered.lesson
          : homework.until.lesson;
      if (!output[date]) output[date] = {};
      if (output[date][lesson]) {
        if (!Array.isArray(output[date][lesson]))
          output[date][lesson] = [output[date][lesson]];
        output[date][lesson] = [...output[date][lesson], homework];
      } else {
        output[date][lesson] = homework;
      }
    });
    return output;
  }

  getDisplayDates(): string[] {
    let output: string[] = [];
    if (this.sort_by == 'entered') {
      let monday = new Date(this.week);
      let day = monday.getDay() || 7;
      if (day !== 1) monday.setDate(monday.getDate() - (day - 1));
      for (let index = 0; index < 5; index++) {
        monday.setDate(monday.getDate() + (index ? 1 : 0));
        output.push(this.getKeyDateFormat(monday));
      }
    } else {
      let maxSchoolTime = (this.getMaxSchoolTime()
        ? this.getMaxSchoolTime()
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
        output.push(this.getKeyDateFormat(current));
      }
    }
    return output;
  }

  getWeekNumber(date: Date): number {
    var dayNum = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - dayNum);
    var yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  }

  getOptionalYear(date: Date): number {
    if (this.week.getFullYear() == new Date().getFullYear()) return;
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
    if (!this.details || !this.detailsData) return;
    if (this.sort_by !== 'due_day') return;

    let until = this.getDateOf(this.detailsData.until.date);

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

  getHomeworkContent(
    type: 'done' | 'pending',
    homework: { [key: number]: Homework }
  ): Homework[] {
    if (!homework) return;
    let output = [];
    let keys = Object.keys(homework).sort();
    for (const lesson of keys) {
      if (homework.hasOwnProperty(lesson)) {
        const assignment = homework[lesson];
        if (Array.isArray(assignment)) {
          assignment.forEach(subAssignment => {
            if (
              type == 'done' &&
              this.done &&
              this.done[subAssignment.id] === true
            )
              output.push(subAssignment);
            if (
              type == 'pending' &&
              (!this.done || !this.done[subAssignment.id])
            )
              output.push(subAssignment);
          });
        } else {
          if (type == 'done' && this.done && this.done[assignment.id] === true)
            output.push(assignment);
          if (type == 'pending' && (!this.done || !this.done[assignment.id]))
            output.push(assignment);
        }
      }
    }
    if (!output.length) return;
    return output;
  }

  getDateOf(date: Date | firebase.firestore.Timestamp): Date {
    if (date instanceof firebase.firestore.Timestamp) return date.toDate();
    if (typeof date == 'object')
      return firebase.firestore.Timestamp.fromMillis(
        date['seconds'] * 1000
      ).toDate();
    return date;
  }

  getKeyDateFormat(date: Date): string {
    if (!(date instanceof Date)) return;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  getMaxSchoolTime(weekday?: number): string {
    if (!weekday) weekday = new Date().getDay();
    if (weekday > 5 || weekday == 0) return;

    if (!localStorage.getItem(timetableKey)) return;
    let courses = JSON.parse(localStorage.getItem(timetableKey)).courses;
    let max = 0;
    courses.forEach((course: Course) => {
      if (course.lessons) {
        for (const day in course.lessons) {
          if (parseInt(day) !== weekday) continue;
          if (course.lessons.hasOwnProperty(day)) {
            const lessonData = course.lessons[day];
            for (const lesson in lessonData) {
              if (lessonData.hasOwnProperty(lesson)) {
                if (parseInt(lesson) > max) max = parseInt(lesson);
              }
            }
          }
        }
      }
    });
    if (max == 0) return;
    return constant.times[max].end;
  }

  isInFuture(date: string): boolean {
    let parts = date.split('-');
    let current = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    let maxTime: any = this.getMaxSchoolTime(current.getDay());
    if (maxTime) {
      maxTime = maxTime.split(':');
      current.setHours(maxTime[0]);
      current.setMinutes(maxTime[1]);
    }
    let today = new Date();
    if (current.getTime() > today.getTime()) return true;
    return false;
  }

  isThisWeek(): boolean {
    return (
      this.week.getFullYear() == new Date().getFullYear() &&
      this.getWeekNumber(this.week) >= this.getWeekNumber(new Date())
    );
  }

  getFlatArray(arr: any[]): any[] {
    let output = [];
    arr.forEach(item => {
      if (Array.isArray(item)) {
        item.forEach(subItem => {
          output.push(subItem);
        });
      } else {
        output.push(item);
      }
    });
    return output;
  }

  getColor(code: string): string {
    if (!code) return undefined;
    var color = code.split(' ');
    return constant.colors[color[0]][color[1]];
  }

  getContrastColor(code: string): string {
    if (!code) return undefined;
    var color = code.split(' ');
    return constant.colorsContrast[color[0]][color[1]];
  }

  isClass(clazz: string): boolean {
    return !!clazz.charAt(0).match(/\d/);
  }

  getYear(clazz: string = undefined): string {
    if (clazz.charAt(0).match(/\d/)) {
      return clazz.charAt(0);
    } else {
      return clazz;
    }
  }
}
