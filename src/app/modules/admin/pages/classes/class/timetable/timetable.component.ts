import { Component, OnInit } from '@angular/core';
import { constant } from 'src/configs/constants';
import { SettingsService } from 'src/app/core/services/settings.service';
import { Course } from '../../course/course.component';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { take } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { LessonDetailsDialog } from './dialogs/lesson-details/lesson-details.component';
import { AddLessonDialog } from './dialogs/add-lesson/add-lesson.component';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.sass']
})
export class TimetableComponent implements OnInit {
  constant = constant;

  class: string;
  title: string;
  isLoading: boolean = true;
  intermediate: boolean = false;

  courses: Course[] = [];
  timetable: object;

  constructor(
    private dialog: MatDialog,
    public settings: SettingsService,
    private db: FirestoreService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.isLoading = true;
    this.db
      .colWithIds(`years/${this.getYear()}/courses`, ref =>
        ref.where('class', 'array-contains', this.class)
      )
      .pipe(take(1))
      .subscribe((result: Course[]) => {
        this.courses = result;
        this.timetable = this.convertToTimetable(result);
        this.isLoading = false;
      });
  }

  /* ##### TRIGGER ##### */

  onClickLesson(day: number, period: number) {
    var lesson = this.timetable[day][period];
    this.dialog
      .open(LessonDetailsDialog, {
        data: { day: day, period: period, lesson: lesson },
        panelClass: 'mobile-full-screen-dialog'
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result: string) => {
        if (result == 'add') {
          this.onAddLesson(day, period);
        }
        if (result == 'deleteAllCourses') {
          this.intermediate = true;
          let ids = this.singleLesson(day, period)
            ? this.timetable[day][period].id
            : this.timetable[day][period].map(course => course.id);
          let courses = this.courses.filter(course => ids.includes(course.id));
          const batch = firebase.firestore().batch();
          courses.forEach(course => {
            let lessons = {};
            for (const xDay in course.lessons) {
              if (course.lessons.hasOwnProperty(xDay)) {
                const lessonData = course.lessons[xDay];
                for (const lesson in lessonData) {
                  if (lessonData.hasOwnProperty(lesson)) {
                    const data = lessonData[lesson];
                    if (xDay == day.toString() && lesson == period.toString())
                      continue;
                    if (lessons[xDay] == undefined) lessons[xDay] = {};
                    lessons[xDay][lesson] = data;
                  }
                }
              }
            }
            batch.update(
              firebase
                .firestore()
                .doc(
                  `years/${this.getYear(course.class[0])}/courses/${course.id}`
                ),
              {
                lessons: lessons
              }
            );
          });
          batch.commit().then(() => {
            delete this.timetable[day][period];
            this.intermediate = false;
          });
        }
        if (result && result.startsWith('deleteCourse:')) {
          this.intermediate = true;
          let id = result.split(':')[1];
          let course = this.courses.find(course => course['id'] == id);
          let lessons = {};
          for (const xDay in course.lessons) {
            if (course.lessons.hasOwnProperty(xDay)) {
              const lessonData = course.lessons[xDay];
              for (const lesson in lessonData) {
                if (lessonData.hasOwnProperty(lesson)) {
                  const data = lessonData[lesson];
                  if (xDay == day.toString() && lesson == period.toString())
                    continue;
                  if (lessons[xDay] == undefined) lessons[xDay] = {};
                  lessons[xDay][lesson] = data;
                }
              }
            }
          }
          this.db
            .update(`years/${this.getYear(course.class[0])}/courses/${id}`, {
              lessons: lessons
            })
            .then(() => {
              if (this.singleLesson(day, period)) {
                delete this.timetable[day][period];
              } else if (this.timetable[day][period].length == 2) {
                this.timetable[day][period] = this.timetable[day][
                  period
                ].filter(course => course['id'] !== id)[0];
              } else {
                this.timetable[day][period] = this.timetable[day][
                  period
                ].filter(course => course['id'] !== id);
              }
              this.intermediate = false;
            });
        }
      });
  }

  onAddLesson(day: number, period: number) {
    this.dialog
      .open(AddLessonDialog, {
        data: {
          day: day,
          period: period,
          courses: this.courses,
          added: this.lessonExists(day, period)
            ? this.timetable[day][period]
            : []
        },
        panelClass: 'full-screen-dialog'
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result: string[]) => {
        if (result) {
          this.intermediate = true;
          let courses = this.courses.filter(course =>
            result.includes(course.id)
          );
          const batch = firebase.firestore().batch();
          courses.forEach(course => {
            var lessons = course.lessons;
            if (!lessons) lessons = {};
            if (lessons[day] == undefined) lessons[day] = {};
            lessons[day][period] = { changed: false };
            batch.update(
              firebase
                .firestore()
                .doc(
                  `years/${this.getYear(course.class[0])}/courses/${course.id}`
                ),
              {
                lessons: lessons
              }
            );
          });
          batch.commit().then(() => {
            let formatted: any = courses.map(course => {
              return {
                subject: course.subject,
                short: course.short,
                room: course.room,
                teacher: course.teacher,
                class: course.class,
                multi: course.multi,
                color: course.color,
                id: course.id
              };
            });
            if (!this.lessonExists(day, period)) {
              if (this.timetable[day] == undefined) this.timetable[day] = {};
              if (formatted.length == 1) formatted = formatted[0];
              this.timetable[day][period] = formatted;
            } else if (this.singleLesson(day, period)) {
              this.timetable[day][period] = [
                this.timetable[day][period],
                ...formatted
              ];
            } else {
              this.timetable[day][period] = [
                ...this.timetable[day][period],
                ...formatted
              ];
            }
            this.intermediate = false;
          });
        }
      });
  }

  /* ##### HELPER ##### */

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
                  id: course['id']
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

  lessonExists(day: number, period: number): boolean {
    if (this.timetable[day]) {
      if (this.timetable[day][period]) {
        return true;
      }
    }
    return false;
  }

  singleLesson(day: number, period: number): boolean {
    return !Array.isArray(this.timetable[day][period]);
  }

  getRoomPrefix(day: number, period: number): string {
    if (this.timetable[day][period].room.charAt(0).match(/\d/)) return 'R';
    return '';
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

  keysOf(obj: object): string[] {
    return Object.keys(obj);
  }

  arrayOf(max: number): number[] {
    return Array.apply(null, Array(max)).map(function(x, i) {
      return i + 1;
    });
  }

  getYear(clazz: string = undefined): string {
    if (clazz == undefined) clazz = this.class;
    if (clazz.charAt(0).match(/\d/)) {
      return clazz.charAt(0);
    } else {
      return clazz;
    }
  }
}
