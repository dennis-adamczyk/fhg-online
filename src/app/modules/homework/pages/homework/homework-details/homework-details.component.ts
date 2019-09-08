import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
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
import { MatDialog, MatSnackBar, MatBottomSheet } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { ShareSheet } from 'src/app/core/bottomsheets/share/share.component';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

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
    private snackBar: MatSnackBar,
    private title: Title,
    private bottomSheet: MatBottomSheet,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (this.done !== undefined) this.data.done = this.done;
    if (
      this.data.selectedCorrection &&
      this.data.selectedCorrection['id'] &&
      this.data.corrections &&
      !this.data.corrections[this.data.selectedCorrection['id']]
    )
      this.db.update(`users/${this.auth.user.id}/singles/homework`, {
        [`correction.${this.data.id}`]: null
      });
  }

  /* ##### TRIGGERS ##### */

  onShare() {
    if (!isPlatformBrowser(this.platformId)) return;
    let title = this.title.getTitle();
    let url = window.location.href;
    if (navigator['share']) {
      navigator['share']({
        title: title,
        url: url
      });
    } else {
      this.bottomSheet.open(ShareSheet, {
        data: { url: url },
        panelClass: 'fullWithSheet'
      });
    }
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
            let oldId = existingCorrection[0];

            let correctionId = this.generateId();
            while (this.data.corrections && this.data.corrections[correctionId])
              correctionId = this.generateId();

            delete this.data.corrections[oldId];
            this.data.corrections[correctionId] = {
              delete: true,
              by: {
                id: this.auth.user.id,
                name: this.auth.user.name,
                roles: this.auth.user.roles
              }
            };

            return this.db
              .update(homeworkRef, {
                corrections: this.data.corrections
              })
              .then(() => {
                this.db
                  .update(`users/${this.auth.user.id}/singles/homework`, {
                    [`correction.${this.data.id}`]: this.data.corrections[
                      correctionId
                    ]
                  })
                  .then(() => {
                    this.snackBar.open(
                      'Vorige Korrekturvorschläge entfernt und Löschungsvorschlag hinzugefügt',
                      null,
                      { duration: 4000 }
                    );
                  });
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
                this.db
                  .update(`users/${this.auth.user.id}/singles/homework`, {
                    [`correction.${this.data.id}`]: this.data.corrections[
                      correctionId
                    ]
                  })
                  .then(() => {
                    this.snackBar.open(
                      'Löschungsvorschlag zur Hausaufgabe hinzugefügt',
                      null,
                      { duration: 4000 }
                    );
                  });
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

  deleteCorrection(id: string) {
    if (
      this.data.corrections[id].by.id !== this.auth.user.id &&
      !this.isAdmin()
    )
      return;
    if (this.data.personal) return;
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Korrektur löschen',
          content: `Sicher, dass du die Korrektur #${id} unwiederruflich löschen möchtest?`,
          defaultCancel: true,
          accept: 'Unwiederruflich löschen'
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(accept => {
        if (!accept) return;
        delete this.data.corrections[id];
        this.db
          .update(
            `years/${this.getYearOfCourse(this.data.course.id)}/courses/${
              this.data.course.id
            }/homework/${this.data.id}`,
            {
              corrections: this.data.corrections
            }
          )
          .then(() => {
            if (
              this.data.selectedCorrection &&
              this.data.selectedCorrection['id'] == id
            ) {
              this.db.update(`users/${this.auth.user.id}/singles/homework`, {
                [`correction.${this.data.id}`]: null
              });
            }
            this.snackBar.open('Korrektur gelöscht', null, { duration: 4000 });
          });
      });
  }

  selectCorrection(id: string) {
    if (
      !this.data.selectedCorrection ||
      this.data.selectedCorrection['id'] !== id
    ) {
      let addPersomalSelect = () => {
        let data = {
          id: id
        };
        if (this.data.corrections[id].delete === true) data['delete'] = true;
        if (
          this.data.corrections[id].title ||
          this.data.corrections[id].details
        ) {
          data['title'] = this.data.corrections[id].title;
          data['details'] = this.data.corrections[id].details;
        }
        this.db.update(`users/${this.auth.user.id}/singles/homework`, {
          [`correction.${this.data.id}`]: data
        });
      };
      if (this.isAdmin()) {
        this.dialog
          .open(AcceptCancelDialog, {
            data: {
              title: 'Hausaufgabe überschreiben?',
              content:
                'Soll die Hausaufgabe entsprechend der Korrektur für alle bearbeitet werden?',
              accept: 'Ja'
            }
          })
          .afterClosed()
          .pipe(take(1))
          .subscribe(accept => {
            if (!accept) return addPersomalSelect();

            if (this.data.corrections[id].delete === true) {
              return this.onDelete();
            }

            let data = {};
            if (
              this.data.corrections[id].title ||
              this.data.corrections[id].details
            ) {
              data['title'] = this.data.corrections[id].title;
              data['details'] = this.data.corrections[id].details;
            }
            this.db
              .update(
                `years/${this.getYear(
                  this.getClass(this.data.course.id)
                )}/courses/${this.data.course.id}/homework/${this.data.id}`,
                data
              )
              .then(() => {
                this.snackBar.open(
                  'Hausaufgabe entsprechend der Korrektur bearbeitet',
                  null,
                  { duration: 4000 }
                );
              });
          });
      } else {
        addPersomalSelect();
      }
    } else if (
      this.data.selectedCorrection &&
      this.data.selectedCorrection['id'] == id
    ) {
      this.db.update(`users/${this.auth.user.id}/singles/homework`, {
        [`correction.${this.data.id}`]: null
      });
    }
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

  isSelectedCorrection(id: string): boolean {
    return (
      this.data.selectedCorrection && this.data.selectedCorrection['id'] == id
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

  notEmptyObj(obj: object): boolean {
    return !!obj && !!Object.keys(obj).length;
  }

  correctionsOf(obj: object): object[] {
    let output = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const element = obj[key];
        element.id = key;
        if (element.title || element.details) {
          if (
            element.title == this.data.title &&
            element.details == this.data.details
          )
            continue;
        }
        if (element.delete === false) continue;
        output.push(element);
      }
    }
    return output;
  }
}
