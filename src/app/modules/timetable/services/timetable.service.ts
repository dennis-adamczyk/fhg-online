import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { Course, TimetableLocalStorage } from '../models/timetable.model';
import { HelperService } from 'src/app/core/services/helper.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { take } from 'rxjs/operators';
import {
  homeworkKey,
  timetableKey,
  courseNamesKey
} from 'src/configs/constants';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimetableService {
  data: object;

  isLoading: boolean = true;
  subs: Subscription[] = [];

  constructor(
    private db: FirestoreService,
    private helper: HelperService,
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
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
      !localStorage.getItem(timetableKey) ||
      !localStorage.getItem(timetableKey).length
    ) {
      this.downloadTimetable();
    } else {
      this.data = this.convertToTimetable(
        this.getTimetableLocalStorage().courses
      );
      this.isLoading = false;
      this.updateTimetable();
    }
  }

  downloadTimetable() {
    let clazz = this.auth.user.class as string;
    let singleCourses: Course[] = [],
      multiCourses: Course[] = [];
    let singles = false,
      multis = false;

    this.subs.forEach(sub => sub.unsubscribe());

    this.isLoading = true;

    const setTimetable = () => {
      this.data = this.convertToTimetable([...singleCourses, ...multiCourses]);
      localStorage.setItem(
        timetableKey,
        JSON.stringify({
          updated: Date.now(),
          courses: [...singleCourses, ...multiCourses]
        } as TimetableLocalStorage)
      );
      localStorage.setItem(
        courseNamesKey,
        JSON.stringify({
          names: [...singleCourses, ...multiCourses].map(course => course.id)
        })
      );
      this.updateTimetable();
      localStorage.removeItem(homeworkKey);
      this.isLoading = false;
    };

    if (this.helper.isClass(clazz)) {
      this.db
        .colWithIds$(`years/${this.helper.getYear(clazz)}/courses`, ref =>
          ref
            .where('multi', '==', false)
            .where('class', 'array-contains', clazz)
        )
        .pipe(take(1))
        .subscribe((courses: Course[]) => {
          singleCourses = courses;
          singles = true;
          if (multis) {
            setTimetable();
          }
        });
    }
    if (!this.auth.user.courses || !this.auth.user.courses.length)
      multis = true;
    if (
      !this.auth.user.courses ||
      (!this.auth.user.courses.length && !this.helper.isClass(clazz))
    )
      setTimetable();
    if (this.auth.user.courses && this.auth.user.courses.length)
      this.auth.user.courses.forEach((courseName, index) => {
        this.db
          .docWithId$(
            `years/${this.helper.getYear(clazz)}/courses/${courseName}`
          )
          .pipe(take(1))
          .subscribe((course: Course) => {
            if (!this.isLoading) {
              multiCourses = multiCourses.filter(c => c.id != course.id);
            }
            multiCourses.push(course);
            if (index == this.auth.user.courses.length - 1) {
              multis = true;
              if (
                (this.helper.isClass(clazz) && singles) ||
                !this.helper.isClass(clazz)
              ) {
                setTimetable();
              }
            }
          });
      });
  }

  updateTimetable() {
    this.subs.forEach(sub => sub.unsubscribe());
    this.subs.push(
      this.auth.user$.subscribe(user => {
        if (
          user &&
          user.courses &&
          localStorage.getItem(courseNamesKey) &&
          JSON.stringify(
            JSON.parse(localStorage.getItem(courseNamesKey))
              .names.filter(course =>
                this.helper.isClass(user.class)
                  ? course.charAt(1).match(/\-/)
                  : course.charAt(2).match(/\-/)
              )
              .sort()
          ) !== JSON.stringify(user.courses.sort())
        ) {
          return this.downloadTimetable();
        }
      })
    );
    this.subs.push(
      this.db
        .doc$(`years/${this.helper.getYear(this.auth.user.class as string)}`)
        .subscribe(
          (year: {
            classes: string[];
            updated: { [key: string]: firebase.firestore.Timestamp };
          }) => {
            if (!year || !year.updated) return;
            let localyUpdated = this.getTimetableLocalStorage().updated;

            for (const courseName in year.updated) {
              if (
                year.updated.hasOwnProperty(courseName) &&
                year.updated[courseName]
              ) {
                if (
                  this.helper.isClass(this.auth.user.id) &&
                  courseName.match(`^${this.auth.user.class}-`) &&
                  !(JSON.parse(localStorage.getItem(courseNamesKey))
                    .names as string[]).includes(courseName)
                ) {
                  return this.downloadTimetable();
                }
              }
            }

            JSON.parse(localStorage.getItem(courseNamesKey)).names.forEach(
              courseName => {
                if (
                  year.updated[courseName].toMillis() > localyUpdated ||
                  year.updated[courseName] == null
                ) {
                  this.db
                    .docWithId$(
                      `years/${this.helper.getYear(this.auth.user
                        .class as string)}/courses/${courseName}`
                    )
                    .pipe(take(1))
                    .subscribe((course: Course) => {
                      let newCourses = this.getTimetableLocalStorage().courses.filter(
                        c => c.id !== courseName
                      );
                      if (course) newCourses.push(course);
                      localStorage.setItem(
                        timetableKey,
                        JSON.stringify({
                          updated: Date.now(),
                          courses: newCourses,
                          names: JSON.parse(
                            localStorage.getItem(courseNamesKey)
                          ).names
                        })
                      );
                      this.data = this.convertToTimetable(newCourses);
                    });
                }
              }
            );
          }
        )
    );
  }

  convertToTimetable(courses: Course[]): object {
    var output = {};
    courses.forEach((course: Course) => {
      if (course.lessons) {
        for (const day in course.lessons) {
          if (course.lessons.hasOwnProperty(day)) {
            const lessonData = course.lessons[day];
            for (const lesson in lessonData) {
              if (lessonData.hasOwnProperty(lesson)) {
                const data = lessonData[lesson];

                if (output[day] == undefined) output[day] = {};
                if (
                  output[day][lesson] != undefined &&
                  !Array.isArray(output[day][lesson])
                )
                  output[day][lesson] = [output[day][lesson]];
                var courseOutput = {
                  subject: course.subject,
                  short: course.short,
                  room: course.room,
                  teacher: course.teacher,
                  class: course.class,
                  multi: course.multi,
                  color: course.color,
                  id: course.id
                };
                if (data.changed) {
                  if (data.room) courseOutput.room = data.room;
                  if (
                    data.teacher &&
                    (data.teacher.title ||
                      data.teacher.last_name ||
                      data.teacher.short)
                  )
                    courseOutput.teacher = data.teacher;
                }
                if (output[day][lesson] != undefined)
                  (output[day][lesson] as any[]).push(courseOutput);
                else output[day][lesson] = courseOutput;
              }
            }
          }
        }
      }
    });
    return output;
  }

  getTimetableLocalStorage(): TimetableLocalStorage {
    return localStorage.getItem(timetableKey)
      ? (JSON.parse(
          localStorage.getItem(timetableKey)
        ) as TimetableLocalStorage)
      : null;
  }

  lessonExists(day: number, period: number): boolean {
    if (this.data[day]) {
      if (this.data[day][period]) {
        return true;
      }
    }
    return false;
  }

  isSingleLesson(day: number, period: number): boolean {
    return !Array.isArray(this.data[day][period]);
  }
}
