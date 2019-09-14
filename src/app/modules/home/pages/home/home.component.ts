import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2,
  ChangeDetectionStrategy,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { HomeworkService } from 'src/app/modules/homework/services/homework.service';
import { TimetableService } from 'src/app/modules/timetable/services/timetable.service';
import { HelperService } from 'src/app/core/services/helper.service';
import {
  constant,
  homeworkKey,
  timetableKey,
  courseNamesKey
} from 'src/configs/constants';
import { MatDialog } from '@angular/material';
import { LessonDetailsDialog } from 'src/app/modules/timetable/pages/timetable/dialogs/lesson-details/lesson-details.component';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { until } from 'protractor';
import { Homework } from 'src/app/modules/homework/models/homework.model';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Course } from 'src/app/modules/timetable/models/timetable.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  day: Date = new Date();

  fabButtons = [
    {
      label: 'Hausaufgabe',
      icon: 'list',
      click: () => this.router.navigate(['/homework/add'])
    }
  ];

  constructor(
    public homework: HomeworkService,
    public timetable: TimetableService,
    public helper: HelperService,
    private db: FirestoreService,
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### TOOLBAR EXTENTION ##### */

  toolbar: Element;
  sidenavContent: Element;
  scrollListener: any;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
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
    }
    this.loadData();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.setNextDay();
  }

  loadDayHomework() {
    let current = new Date(this.day);
    if (
      current.getFullYear() == new Date().getFullYear() &&
      this.homework.getWeekNumber(current) >
        this.homework.getWeekNumber(new Date()) - 2
    )
      return;

    // if (!this.loadedDays.includes(this.homework.getKeyDateFormat(current)))
    //   this.homeworkLoading = true;

    let min = new Date(this.day);
    min.setHours(0);
    min.setMinutes(0);
    min.setSeconds(0);
    min.setMilliseconds(0);

    let max = new Date(this.day);
    max.setHours(23);
    max.setMinutes(59);
    max.setSeconds(59);
    max.setMilliseconds(999);

    let newHomework = JSON.parse(localStorage.getItem(homeworkKey))
      .homework as Homework[];

    this.db
      .colWithIds$(`users/${this.auth.user.id}/personalHomework`, ref =>
        ref.where('until.date', '>=', min).where('until.date', '<=', max)
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
                  .where('until.date', '>=', min)
                  .where('until.date', '<=', max)
            )
            .pipe(take(1))
            .subscribe((homeworkList: Homework[]) => {
              if (
                i ==
                JSON.parse(localStorage.getItem(courseNamesKey)).names.length -
                  1
              ) {
                // this.homeworkLoading = false;
                // this.loadedDays.push(this.homework.getKeyDateFormat(this.day));
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
                if (
                  this.homework.correction &&
                  this.homework.correction[homework.id] &&
                  homework.corrections &&
                  !homework.corrections[
                    this.homework.correction[homework.id].id
                  ]
                )
                  this.db.update(
                    `users/${this.auth.user.id}/singles/homework`,
                    {
                      [`correction.${homework.id}`]: null
                    }
                  );
              });
              this.homework.data = this.homework.convertToDateList(newHomework);
            });
        }
      );
    });
  }

  /* ##### TRIGGERS ##### */

  onCourseDetails(period: number) {
    let day = this.helper.getWeekDay(this.day);
    let lesson = this.timetable.data[day][period];
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

  onChangeDone(event, id: string) {
    this.db.update(`users/${this.auth.user.id}/singles/homework`, {
      [`done.${id}`]: event.checked
    });
    this.homework.done[id] = event.checked;
  }

  /* ##### HELPER ##### */

  getDisplayWeekDay(): string {
    let weekDay = this.day.getDay() || 7;
    return constant.weekDay[weekDay];
  }

  getDisplayFormattedDate(): string {
    const formatter = new Intl.DateTimeFormat('de', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(this.day);
  }

  addDay(add: number) {
    this.day.setDate(this.day.getDate() + add);
    let weekDay = this.day.getDay() || 7;
    if (weekDay >= 6)
      this.day.setDate(
        this.day.getDate() + (add < 0 ? -(weekDay - 5) : 8 - weekDay)
      );
    this.loadDayHomework();
  }

  private timetableData: Course[];

  getTimetable(): Course[] {
    let weekDay = this.day.getDay() || 7;
    if (!this.timetable.data) return;
    let timetable = this.timetable.data[weekDay];
    if (!timetable) return;

    let sorted = {};
    Object.keys(timetable)
      .sort()
      .map(l => (sorted[l] = timetable[l]));
    timetable = sorted;

    let output = [];
    for (const lesson in timetable) {
      if (timetable.hasOwnProperty(lesson)) {
        const course = Object.assign({}, timetable[lesson]);

        let addCourse = course => {
          course.lesson = parseInt(lesson);
          output.push(course);
        };

        if (!this.timetable.isSingleLesson(weekDay, parseInt(lesson)))
          course.forEach(c => addCourse(c));
        else addCourse(course);
      }
    }
    if (JSON.stringify(output) !== JSON.stringify(this.timetableData)) {
      this.timetableData = output;
      return output;
    } else return this.timetableData;
  }

  getJSON(str: string) {
    return JSON.parse(str);
  }

  hasRoomPrefix(room: string): boolean {
    return !!room.charAt(0).match(/\d/);
  }

  getTime(type: 'start' | 'end', period): string {
    return constant.times[period][type];
  }

  isNextDay(): boolean {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let weekDay = tomorrow.getDay() || 7;
    if (weekDay >= 6) tomorrow.setDate(tomorrow.getDate() + 8 - weekDay);
    if (this.homework.isInFuture(new Date())) return this.isToday(this.day);
    else
      return (
        this.day.getFullYear() == tomorrow.getFullYear() &&
        this.day.getMonth() == tomorrow.getMonth() &&
        this.day.getDate() == tomorrow.getDate()
      );
  }

  setNextDay() {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let weekDay = tomorrow.getDay() || 7;
    if (weekDay >= 6) tomorrow.setDate(tomorrow.getDate() + 8 - weekDay);
    if (!this.homework.isInFuture(new Date())) this.day = tomorrow;
  }

  private isToday(d: Date) {
    let today = new Date();
    return (
      d.getFullYear() == today.getFullYear() &&
      d.getMonth() == today.getMonth() &&
      d.getDate() == today.getDate()
    );
  }

  private homeworkData;

  getHomework(): Homework[] {
    if (!this.homework.data) return;
    let output = [];
    if (this.homework.sort_by == 'due_day') {
      let homework = this.homework.data[
        this.homework.getKeyDateFormat(this.day)
      ];
      if (!homework) return;

      let sorted = {};
      Object.keys(homework)
        .sort()
        .map(l => (sorted[l] = homework[l]));
      homework = sorted;

      for (const lesson in homework) {
        if (homework.hasOwnProperty(lesson)) {
          const assignment = Object.assign({}, homework[lesson]);

          let addHomework = assignment => {
            assignment.lesson = parseInt(lesson);
            if (assignment.blocked || this.isDisplayCorrDeleted(assignment))
              return;
            output.push(assignment);
          };

          if (Array.isArray(assignment))
            assignment.forEach(sub => addHomework(sub));
          else if (!assignment.id) {
            for (const sub in assignment) {
              if (assignment.hasOwnProperty(sub)) {
                const subAssignment = assignment[sub];
                addHomework(subAssignment);
              }
            }
          } else addHomework(assignment);
        }
      }
    } else {
      let homework = this.homework.data;
      for (const date in homework) {
        if (homework.hasOwnProperty(date)) {
          let day = homework[date];

          let sorted = {};
          Object.keys(day)
            .sort()
            .map(l => (sorted[l] = day[l]));
          day = sorted;

          for (const period in day) {
            if (day.hasOwnProperty(period)) {
              const assignment = day[period];

              let addHomework = assignment => {
                if (assignment.until && assignment.until.date) {
                  let until = this.helper.getDateOf(assignment.until.date);
                  if (
                    until.getFullYear() == this.day.getFullYear() &&
                    until.getMonth() == this.day.getMonth() &&
                    until.getDate() == this.day.getDate()
                  ) {
                    assignment.lesson = parseInt(period);
                    if (
                      assignment.blocked ||
                      this.isDisplayCorrDeleted(assignment)
                    )
                      return;
                    output.push(assignment);
                  }
                }
              };

              if (Array.isArray(assignment))
                assignment.forEach(sub => addHomework(sub));
              else if (!assignment.id) {
                for (const sub in assignment) {
                  if (assignment.hasOwnProperty(sub)) {
                    const subAssignment = assignment[sub];
                    addHomework(subAssignment);
                  }
                }
              } else addHomework(assignment);
            }
          }
        }
      }
    }
    if (JSON.stringify(output) !== JSON.stringify(this.homeworkData)) {
      this.homeworkData = output;
      return output;
    } else return this.homeworkData;
  }

  getHomeworkArray() {
    if (!this.homeworkData || !Array.isArray(this.homeworkData)) return;
    return this.helper.arrayOf(this.homeworkData.length - 1, 0);
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

  getHomeworkDetailsURL(homework: Homework): string {
    if (!homework || !homework.course || !homework.course.id || !homework.id)
      return;
    let output = '/homework/';
    output += (homework.personal ? 'p' : homework.course.id) + '/';
    output += homework.id;
    return output;
  }

  hasCourseHomework(courseId: string): boolean {
    if (!this.getHomework() || !Array.isArray(this.getHomework())) return;
    return !!this.getHomework().filter(
      h =>
        h.course.id == courseId &&
        (!this.homework || !this.homework.done || !this.homework.done[h.id])
    ).length;
  }
}
