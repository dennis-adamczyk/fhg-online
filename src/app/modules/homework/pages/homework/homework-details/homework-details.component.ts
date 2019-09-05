import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { Homework } from '../homework.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { timetableKey } from 'src/app/modules/timetable/pages/timetable/timetable.component';
import { Course } from 'src/app/modules/admin/pages/classes/course/course.component';
import { constant } from 'src/configs/constants';
import { Observable } from 'rxjs';
import {
  state,
  trigger,
  style,
  transition,
  animate,
  query,
  group
} from '@angular/animations';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-homework-details',
  templateUrl: './homework-details.component.html',
  styleUrls: ['./homework-details.component.sass']
})
export class HomeworkDetailsComponent implements OnInit {
  @Input() data: Homework;
  @Input() handset$: Observable<boolean>;
  @Input() done?: boolean;

  constructor(
    private router: Router,
    private db: FirestoreService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (this.done !== undefined) this.data.done = this.done;
  }

  /* ##### TRIGGERS ##### */

  onShare() {
    // TODO:
  }

  onReport() {
    // TODO:
  }

  onEdit() {
    if (this.data.personal)
      return this.router.navigate([`/homework/edit/p/${this.data.id}`]);
    return this.router.navigate([
      `/homework/edit/${this.data.course.id}/${this.data.id}`
    ]);
  }

  onDelete() {
    // TODO: Teacher's course
    let canModify =
      this.data.personal ||
      this.data.by.id == this.auth.user.id ||
      this.auth.user.roles.guard ||
      (this.auth.user.roles.admin &&
        this.getClass(this.data.course.id) ==
          this.auth.user.class.toLocaleLowerCase());

    let existingCorrection: string[] = this.data.corrections
      ? Object.keys(this.data.corrections).filter(
          co =>
            this.data.corrections[co] &&
            this.data.corrections[co].by.id == this.auth.user.id
        )
      : [];

    let dialogData = {
      title: 'Hausaufgabe löschen?',
      content:
        'Bist du sicher, dass du die Hausaufgabe unwiederruflich löschen möchtest?',
      defaultCancel: true,
      accept: 'Unwiederruflich löschen'
    };
    if (!canModify && !existingCorrection.length)
      dialogData = {
        title: 'Hausaufgabenlöschung vorschlagen?',
        content:
          'Bist du sicher, dass du die Löschung dieser Hausaufgabe beantragen möchtest?',
        defaultCancel: true,
        accept: 'Löschen'
      };
    if (!canModify && existingCorrection.length)
      dialogData = {
        title: 'Hausaufgabenlöschung vorschlagen?',
        content:
          'Bist du sicher, dass du deine vorigen Korrekturvorschläge entfernen und stattdessen die Löschung dieser Hausaufgabe beantragen möchtest?',
        defaultCancel: true,
        accept: 'Löschen'
      };

    this.dialog
      .open(AcceptCancelDialog, {
        data: dialogData
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(accept => {
        if (!accept) return;
        if (canModify) {
          let homeworkRef = '';
          if (!this.data.personal)
            homeworkRef = `years/${this.getYearOfCourse(
              this.data.course.id
            )}/courses/${this.data.course.id}/homework/${this.data.id}`;
          else
            homeworkRef = `users/${this.auth.user.id}/personalHomework/${this.data.id}`;

          return this.db.delete(homeworkRef).then(() => {
            this.snackBar.open('Hausaufgabe unwiederruflich gelöscht', null, {
              duration: 4000
            });
          });
        } else {
          let homeworkRef = `years/${this.getYearOfCourse(
            this.data.course.id
          )}/courses/${this.data.course.id}/homework/${this.data.id}`;

          if (existingCorrection.length) {
            let correctionId = existingCorrection[0];

            return this.db
              .update(homeworkRef, {
                [`corrections.${correctionId}`]: {
                  delete: true,
                  by: {
                    id: this.auth.user.id,
                    name: this.auth.user.name,
                    roles: this.auth.user.roles
                  }
                }
              })
              .then(() => {
                this.snackBar.open(
                  'Vorige Korrekturvorschläge entfernt und Löschungsvorschlag hinzugefügt',
                  null,
                  { duration: 4000 }
                );
              });
          } else {
            let correctionId = this.generateId();
            while (this.data.corrections && this.data.corrections[correctionId])
              correctionId = this.generateId();

            let homeworkRef = `years/${this.getYearOfCourse(
              this.data.course.id
            )}/courses/${this.data.course.id}/homework/${this.data.id}`;

            return this.db
              .update(homeworkRef, {
                [`corrections.${correctionId}`]: {
                  delete: true,
                  by: {
                    id: this.auth.user.id,
                    name: this.auth.user.name,
                    roles: this.auth.user.roles
                  }
                }
              })
              .then(() => {
                this.snackBar.open(
                  'Löschungsvorschlag zur Hausaufgabe hinzugefügt',
                  null,
                  { duration: 4000 }
                );
              });
          }
        }
      });
  }

  onChangeDone(event) {
    return this.db.upsert(`users/${this.auth.user.id}/singles/homework`, {
      [`done.${this.data.id}`]: event.checked
    });
  }

  /* ##### HELPER ##### */

  isAdmin(): boolean {
    let user = this.auth.user;
    return (
      user.roles.guard ||
      (user.roles.admin &&
        this.getClass(this.data.course.id) ==
          this.auth.user.class.toLocaleLowerCase())
    );
  }

  navigateBack() {
    this.router.navigate(['/homework']);
  }

  getDisplayClass(classes: string[]): string {
    if (!classes || !classes.length) return;
    let output = 'Klasse ';
    classes.forEach(clazz => {
      output += clazz + ', ';
    });
    return output.slice(0, -2);
  }

  getDisplayLesson(lesson: {
    date: firebase.firestore.Timestamp | Date;
    lesson: number;
  }): string {
    if (!lesson) return;
    const formatter = new Intl.DateTimeFormat('de', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    let date = formatter.format(
      lesson.date instanceof Date ? lesson.date : lesson.date.toDate()
    );
    let period = `${lesson.lesson}. Stunde (${constant.times[lesson.lesson].start} - ${constant.times[lesson.lesson].end})`;
    return date + '\n' + period;
  }

  getColor(color: string): string {
    if (!color) return;
    var code = color.split(' ');
    return constant.colors[code[0]][code[1]];
  }

  getContrastColor(color: string): string {
    if (!color) return undefined;
    var code = color.split(' ');
    return constant.colorsContrast[code[0]][code[1]];
  }

  getClass(course: string): string {
    let clazz = course.match(/(\w\w)\-[\w]+/)[0];
    if (!clazz || !clazz.length) return;
    if (!this.isClass(clazz)) return;
    return clazz.toLowerCase();
  }

  isClass(clazz?: string): boolean {
    if (!clazz) clazz = this.auth.user.class as string;
    return !!clazz.match(/^\d/);
  }

  getYear(clazz?: string): string {
    if (!clazz) clazz = this.auth.user.class as string;
    if (this.isClass(clazz)) return clazz.charAt(0);
    else return clazz;
  }

  getYearOfCourse(course: string): string {
    let clazz = course.match(/(\w+)\-[\w]+/)[0];
    if (!clazz) return;
    return this.isClass(clazz) ? this.getYear(clazz) : clazz;
  }

  generateId() {
    let result = '';
    let characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (var i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
