import { Component, OnInit, Input, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { constant, homeworkKey } from 'src/configs/constants';
import { Observable } from 'rxjs';
import { MatDialog, MatSnackBar, MatBottomSheet } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { ShareSheet } from 'src/app/core/bottomsheets/share/share.component';
import { Title } from '@angular/platform-browser';
import { isPlatformBrowser, Location } from '@angular/common';
import { HelperService } from 'src/app/core/services/helper.service';
import { Homework } from '../../../models/homework.model';
import { HomeworkService } from '../../../services/homework.service';

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
    private homework: HomeworkService,
    public helper: HelperService,
    private router: Router,
    private db: FirestoreService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private title: Title,
    private location: Location,
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
    if (this.data.personal) return;
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Hausaufgabe melden?',
          content: `Möchtest du diese Hausaufgabe aufgrund eines Verstoßes gegen die <a href="/info#terms">Nutzungsbedingungen</a> melden?
          Das falsche Melden von Hausaufgaben kann ebenfalls sanktioniert werden.<br/>
          Bitte reiche einen Korrekturvorschlag ein, wenn die Hausaufgabe lediglich fehlerhaft ist, indem du auf das Bearbeiten- oder Löschen-Symbol klickst.`,
          defaultCancel: true,
          accept: 'Melden'
        }
      })
      .afterClosed()
      .subscribe(accept => {
        if (!accept) return;
        let homeworkRef = `years/${this.helper.getYearOfCourse(
          this.data.course.id
        )}/courses/${this.data.course.id}/homework/${this.data.id}`;
        let success: boolean;
        this.db
          .runTransaction(homeworkRef, value => {
            let reporter = (value.data() as Homework).reporter;
            if (!reporter || !reporter.length) reporter = [];
            if (reporter.includes(this.auth.user.id)) {
              success = false;
              this.snackBar.open(
                'Du hast diese Hausaufgabe bereits gemeldet',
                null,
                { duration: 4000 }
              );
              return;
            }

            reporter.push(this.auth.user.id);
            success = true;
            return {
              reporter: reporter
            };
          })
          .then(() =>
            success
              ? this.snackBar.open('Hausaufgabe erfolgreich gemeldet', null, {
                  duration: 4000
                })
              : null
          );
      });
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
        this.helper.getClass(this.data.course.id) ==
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
        'Bist du sicher, dass du die Hausaufgabe unwiderruflich löschen möchtest?',
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
            homeworkRef = `years/${this.helper.getYearOfCourse(
              this.data.course.id
            )}/courses/${this.data.course.id}/homework/${this.data.id}`;
          else
            homeworkRef = `users/${this.auth.user.id}/personalHomework/${this.data.id}`;

          this.db.delete(homeworkRef).then(() => {
            this.snackBar.open(
              'Hausaufgabe wird unwiderruflich gelöscht',
              null,
              {
                duration: 4000
              }
            );
          });

          let newHomework = JSON.parse(localStorage.getItem(homeworkKey))
            .homework as Homework[];
          let current = newHomework.find(h => h.id == this.data.id);
          current.unsynced = true;
          current.deleted = true;
          newHomework = newHomework.filter(h => h.id !== this.data.id);
          newHomework.push(current);
          localStorage.setItem(
            homeworkKey,
            JSON.stringify({
              homework: newHomework,
              updated: JSON.parse(localStorage.getItem(homeworkKey)).updated
            })
          );
          this.homework.updateData(newHomework);
          return;
        } else {
          let homeworkRef = `years/${this.helper.getYearOfCourse(
            this.data.course.id
          )}/courses/${this.data.course.id}/homework/${this.data.id}`;

          if (existingCorrection.length) {
            let oldId = existingCorrection[0];

            let correctionId = this.helper.generateId();
            while (this.data.corrections && this.data.corrections[correctionId])
              correctionId = this.helper.generateId();

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
            let correctionId = this.helper.generateId();
            while (this.data.corrections && this.data.corrections[correctionId])
              correctionId = this.helper.generateId();

            let homeworkRef = `years/${this.helper.getYearOfCourse(
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
          content: `Sicher, dass du die Korrektur #${id} unwiderruflich löschen möchtest?`,
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
            `years/${this.helper.getYearOfCourse(
              this.data.course.id
            )}/courses/${this.data.course.id}/homework/${this.data.id}`,
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
                `years/${this.helper.getYear(
                  this.helper.getClass(this.data.course.id)
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
        this.helper.getClass(this.data.course.id) ==
          this.auth.user.class.toLocaleLowerCase())
    );
  }

  isSelectedCorrection(id: string): boolean {
    return (
      this.data.selectedCorrection && this.data.selectedCorrection['id'] == id
    );
  }

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (
      document.referrer.indexOf(window.location.host) !== -1 &&
      document.referrer != window.location.href
    )
      this.location.back();
    else this.router.navigate(['/homework'], { replaceUrl: true });
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
    let date = formatter.format(this.helper.getDateOf(lesson.date));
    let period = `${lesson.lesson}. Stunde (${constant.times[lesson.lesson].start} - ${constant.times[lesson.lesson].end})`;
    return date + '\n' + period;
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
