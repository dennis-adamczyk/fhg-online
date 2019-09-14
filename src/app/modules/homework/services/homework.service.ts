import { FirestoreService } from 'src/app/core/services/firestore.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { Injectable, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { Router } from '@angular/router';
import { Homework } from '../models/homework.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { TimetableService } from '../../timetable/services/timetable.service';
import { take } from 'rxjs/operators';
import { Course } from '../../timetable/models/timetable.model';
import {
  constant,
  homeworkKey,
  courseNamesKey,
  timetableKey
} from 'src/configs/constants';

@Injectable({
  providedIn: 'root'
})
export class HomeworkService {
  sort_by: 'due_day' | 'entered' = this.settings.get('homework.sort_by');
  max_days = parseInt(this.settings.get('homework.max_days')) | 0;

  data: object;

  done: object;
  correction: object;

  isLoading: boolean = true;

  constructor(
    private timetable: TimetableService,
    private db: FirestoreService,
    private auth: AuthService,
    private helper: HelperService,
    private router: Router,
    private dialog: MatDialog,
    private settings: SettingsService,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    this.loadData();
  }

  private loadData() {
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
      !localStorage.getItem(homeworkKey) ||
      !localStorage.getItem(homeworkKey).length ||
      !JSON.parse(localStorage.getItem(homeworkKey)).homework
    ) {
      this.downloadHomework();
    } else {
      this.data = this.convertToDateList(
        JSON.parse(localStorage.getItem(homeworkKey)).homework
      );
      this.done = JSON.parse(localStorage.getItem(homeworkKey)).done;
      this.correction = JSON.parse(
        localStorage.getItem(homeworkKey)
      ).correction;
      this.isLoading = false;
      this.updateHomework();
    }
    this.settings.onChange().subscribe(() => {
      if (this.settings.get('homework.sort_by') !== this.sort_by) {
        this.sort_by = this.settings.get('homework.sort_by');
        this.max_days = parseInt(this.settings.get('homework.max_days')) | 0;

        if (
          localStorage.getItem(homeworkKey) &&
          localStorage.getItem(homeworkKey).length &&
          JSON.parse(localStorage.getItem(homeworkKey)).homework
        ) {
          this.data = this.convertToDateList(
            JSON.parse(localStorage.getItem(homeworkKey)).homework
          );
          this.done = JSON.parse(localStorage.getItem(homeworkKey)).done;
          this.correction = JSON.parse(
            localStorage.getItem(homeworkKey)
          ).correction;
          this.isLoading = false;
        }
      }
    });
  }

  updateHomework() {
    this.checkCourseNames().then(go => {
      if (!go) return;
      this.db
        .doc$(`years/${this.helper.getYear(this.auth.user.class as string)}`)
        .subscribe(
          (year: {
            classes: string[];
            homework_updated: { [key: string]: firebase.firestore.Timestamp };
          }) => {
            if (!year || !year.homework_updated) return;
            let localyUpdated = JSON.parse(localStorage.getItem(homeworkKey))
              ? JSON.parse(localStorage.getItem(homeworkKey)).updated
              : 0;
            JSON.parse(localStorage.getItem(courseNamesKey)).names.forEach(
              courseName => {
                if (!year.homework_updated[courseName]) return;
                if (
                  year.homework_updated[courseName].toMillis() > localyUpdated
                ) {
                  this.db
                    .doc$(
                      `years/${this.helper.getYear(this.auth.user
                        .class as string)}/courses/${courseName}/homework/--index--`
                    )
                    .pipe(take(1))
                    .subscribe((index: { homework: Homework[] }) => {
                      let courseDetails = JSON.parse(
                        localStorage.getItem(timetableKey)
                      ).courses.filter(c => c.id == courseName)[0] as Course;

                      let newHomework = JSON.parse(
                        localStorage.getItem(homeworkKey)
                      ).homework.filter(
                        (h: Homework) =>
                          h.course.id !== courseName || h.personal
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
                        if (
                          this.correction &&
                          this.correction[homework.id] &&
                          !homework.corrected.includes(
                            this.correction[homework.id].id
                          )
                        )
                          this.db.update(
                            `users/${this.auth.user.id}/singles/homework`,
                            {
                              [`correction.${homework.id}`]: null
                            }
                          );
                      });
                      localStorage.setItem(
                        homeworkKey,
                        JSON.stringify({
                          homework: newHomework,
                          updated: Date.now()
                        })
                      );
                      this.data = this.convertToDateList(newHomework);
                    });
                }
              }
            );
          }
        );
    });
    this.auth.user$.subscribe(user => {
      if (!user.homework_updated) return;
      let localyUpdated = JSON.parse(localStorage.getItem(homeworkKey)).updated;
      if (user.homework_updated.toMillis() > localyUpdated) {
        this.db
          .doc$(`users/${user.id}/personalHomework/--index--`)
          .pipe(take(1))
          .subscribe((index: { homework: Homework[] }) => {
            let newHomework = JSON.parse(
              localStorage.getItem(homeworkKey)
            ).homework.filter((h: Homework) => !h.personal);
            index.homework.forEach(homework => {
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
              newHomework.push(homework);
            });
            localStorage.setItem(
              homeworkKey,
              JSON.stringify({
                homework: newHomework,
                updated: Date.now()
              })
            );
            this.data = this.convertToDateList(newHomework);
          });
      }
    });
    this.db
      .doc$(`users/${this.auth.user.id}/singles/homework`)
      .subscribe(
        (homework: {
          done: { [key: string]: boolean };
          correction: { [key: string]: object };
        }) => {
          if (!homework || (!homework.done && !homework.correction))
            return this.db.upsert(
              `users/${this.auth.user.id}/singles/homework`,
              {
                done: {},
                correction: {}
              }
            );

          this.done = homework.done;
          this.correction = homework.correction;
          localStorage.setItem(
            homeworkKey,
            JSON.stringify({
              ...JSON.parse(localStorage.getItem(homeworkKey)),
              done: homework.done,
              correction: homework.correction
            })
          );
        }
      );
  }

  downloadHomework() {
    this.checkCourseNames().then(go => {
      if (!go) return;
      let clazz = this.auth.user.class as string;
      let year = this.helper.getYear(clazz);
      let courses = JSON.parse(localStorage.getItem(courseNamesKey))
        .names as string[];
      let homeworkList = [];

      this.db
        .doc$(`users/${this.auth.user.id}/personalHomework/--index--`)
        .pipe(take(1))
        .subscribe((index: { homework: Homework[] }) => {
          if (index && index.homework && index.homework.length) {
            index.homework.forEach(homework => {
              let courseDetails = JSON.parse(
                localStorage.getItem(timetableKey)
              ).courses.filter(c => c.id == homework.course)[0] as Course;
              if (courseDetails.id)
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
        this.data = this.convertToDateList(homeworkList);
        localStorage.setItem(
          homeworkKey,
          JSON.stringify({ homework: homeworkList, updated: Date.now() })
        );
        this.updateHomework();
        this.isLoading = false;
      }

      courses.forEach((course, i) => {
        let courseDetails = JSON.parse(
          localStorage.getItem(timetableKey)
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
              this.data = this.convertToDateList(homeworkList);
              localStorage.setItem(
                homeworkKey,
                JSON.stringify({ homework: homeworkList, updated: Date.now() })
              );
              this.updateHomework();
              this.isLoading = false;
            }
          });
      });
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
        this.timetable.data = this.timetable.convertToTimetable([
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
          courseNamesKey,
          JSON.stringify({
            names: [...singleCourses, ...multiCourses].map(course => course.id)
          })
        );
        this.timetable.updateTimetable();
        this.downloadHomework();
        resolve(false);
      };

      if (this.helper.isClass(clazz)) {
        this.db
          .colWithIds$(`years/${this.helper.getYear(clazz)}/courses`, ref =>
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
      if (!this.auth.user.courses || !this.auth.user.courses.length)
        multis = true;
      if (
        (!this.auth.user.courses || !this.auth.user.courses.length) &&
        !this.helper.isClass(clazz)
      )
        setCourseNames();

      this.auth.user.courses ||
        [].forEach((courseName, index) => {
          this.db
            .docWithId$(
              `years/${this.helper.getYear(clazz)}/courses/${courseName}`
            )
            .pipe(take(1))
            .toPromise()
            .then((course: Course) => {
              multiCourses.push(course);
              if (index == this.auth.user.courses.length - 1) {
                multis = true;
                if (
                  (this.helper.isClass(clazz) && singles) ||
                  !this.helper.isClass(clazz)
                ) {
                  setCourseNames();
                }
              }
            });
        });
    };

    if (
      !localStorage.getItem(courseNamesKey) ||
      !localStorage.getItem(courseNamesKey).length
    ) {
      return new Promise(updateCourseNames);
    } else {
      if (
        this.auth.user.courses &&
        this.auth.user.courses.length &&
        JSON.stringify(
          JSON.parse(localStorage.getItem(courseNamesKey))
            .names.filter(course =>
              this.helper.isClass(this.auth.user.class as string)
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

  /**
   * Returns the homework list in a structured way sortet by date and lesson.
   *
   * @param {Homework[]} homework
   * @returns {object}
   * @memberof HomeworkService
   */
  convertToDateList(homework: Homework[]): object {
    let output = {};
    homework.forEach((homework: Homework) => {
      let date =
        this.sort_by == 'entered'
          ? this.getKeyDateFormat(this.helper.getDateOf(homework.entered.date))
          : this.getKeyDateFormat(this.helper.getDateOf(homework.until.date));
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

  /**
   * Returns the string format of a date
   *
   * @param {Date} date
   * @returns {string}
   * @memberof HomeworkService
   */
  getKeyDateFormat(date: Date): string {
    if (!(date instanceof Date)) return;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  /**
   * Returns the date of string format
   *
   * @param {string} date
   * @returns {Date}
   * @memberof HomeworkService
   */
  getDateOfKeyFormat(date: string): Date {
    let parts = date.split('-');
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
  }

  /**
   * Returns true if the homework has corrections.
   * Deletes deleted corrections saved in the users document in the background.
   *
   * @param {Homework} homework
   * @returns {boolean}
   * @memberof HomeworkService
   */
  isCorrected(homework: Homework): boolean {
    if (
      ((homework.corrected && homework.corrected.length) ||
        (homework.corrections && Object.keys(homework.corrections).length)) &&
      (!this.correction || !this.correction[homework.id])
    ) {
      return true;
    } else {
      if (
        this.correction &&
        this.correction[homework.id] &&
        this.correction[homework.id].id &&
        !homework.corrected.includes(this.correction[homework.id].id)
      ) {
        let corr = this.correction[homework.id];
        this.db
          .docWithId$(
            `years/${this.helper.getYear(
              this.helper.getClass(homework.course.id)
            )}/courses/${homework.course.id}/homework/${homework.id}`
          )
          .pipe(take(1))
          .subscribe((h: Homework) => {
            if (!h.corrections || !h.corrections[corr.id]) {
              this.db.update(`users/${this.auth.user.id}/singles/homework`, {
                [`correction.${homework.id}`]: null
              });
            }
          });
        this.correction[homework.id] = null;
      }
      return false;
    }
  }

  /**
   * Returns a string in format hh:mm (h = hours, m = minutes) when the school regularly ends on this weekday
   *
   * @param {number} [weekday]
   * @returns {string}
   * @memberof HomeworkService
   */
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

  /**
   * Returns true if the date is in the future
   * (when today: returns true if the time of the date is smaller than the school end time)
   *
   * @param {(string | Date)} date
   * @returns {boolean}
   * @memberof HomeworkService
   */
  isInFuture(date: string | Date): boolean {
    if (typeof date == 'string') date = this.getDateOfKeyFormat(date);
    let maxTime: any = this.getMaxSchoolTime(date.getDay());
    if (maxTime) {
      maxTime = maxTime.split(':');
      date.setHours(maxTime[0]);
      date.setMinutes(maxTime[1]);
    }
    let today = new Date();
    if (date.getTime() > today.getTime()) return true;
    return false;
  }

  /**
   * Returns true if the date is in this week or the future
   *
   * @param {Date} week
   * @returns {boolean}
   * @memberof HomeworkService
   */
  isThisWeek(week: Date): boolean {
    return (
      week.getFullYear() == new Date().getFullYear() &&
      this.getWeekNumber(week) >= this.getWeekNumber(new Date())
    );
  }

  /**
   * Returns the calender week number (within one year) of a date
   *
   * @param {Date} date
   * @returns {number}
   * @memberof HomeworkService
   */
  getWeekNumber(date: Date): number {
    var dayNum = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - dayNum);
    var yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  }
}
