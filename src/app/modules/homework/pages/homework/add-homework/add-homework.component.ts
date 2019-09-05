import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  HostListener,
  NgZone,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { take, map } from 'rxjs/operators';
import { Course } from 'src/app/modules/timetable/pages/timetable/timetable.component';
import { constant } from 'src/configs/constants';
import { MatSnackBar, MatDialog, MatInput } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Homework } from '../homework.component';
import { HomeworkFormComponent } from '../../../components/homework-form/homework-form.component';

@Component({
  selector: 'app-add-homework',
  templateUrl: './add-homework.component.html',
  styleUrls: ['./add-homework.component.sass']
})
export class AddHomeworkComponent {
  @ViewChild(HomeworkFormComponent, { static: false })
  homeworkFormComponent: HomeworkFormComponent;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    private auth: AuthService,
    private router: Router,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  ngAfterViewInit() {
    this.homeworkFormComponent.onSubmit = () => this.onSubmit();
  }

  get homeworkForm(): FormGroup {
    return this.homeworkFormComponent.homeworkForm;
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean | object {
    return this.homeworkForm.dirty
      ? {
          title: 'Hausaufgabe verwerfen?',
          content:
            'Bist du sicher, dass du diese Hausaufgabe verwerfen willst?',
          accept: 'Verwerfen'
        }
      : true;
  }

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.referrer.match(/\/homework(\/\w*)*$/)) this.location.back();
    else this.router.navigate(['/homework'], { replaceUrl: true });
  }

  onSubmit() {
    if (this.homeworkForm.invalid) return;

    let course = this.homeworkFormComponent.getCourse(
      this.homeworkForm.get('course').value
    ) as Course;
    let title = this.homeworkForm.get('title').value as string;
    let until = this.homeworkForm.get('until').value as Date;
    let entered = this.homeworkForm.get('entered').value as Date;
    let details = this.homeworkForm.get('details').value as string;
    let share = this.homeworkForm.get('share').value as boolean;

    if (!course || !course.id) return;
    if (!title) return;
    if (!until || !(until instanceof Date)) return;
    if (!entered || !(entered instanceof Date)) return;
    if (share == undefined || share == null) return;

    if (until.getTime() < entered.getTime())
      return this.snackBar.open(
        'Das Fälligkeitsdatum muss nach dem Aufgabedatum liegen',
        null,
        { duration: 4000 }
      );

    if (!this.getLesson(until))
      return this.homeworkForm.get('until').setErrors(['required']);
    if (!this.getLesson(entered))
      return this.homeworkForm.get('entered').setErrors(['required']);

    until = new Date(until.getFullYear(), until.getMonth(), until.getDate());
    entered = new Date(
      entered.getFullYear(),
      entered.getMonth(),
      entered.getDate()
    );

    let untilMax = new Date(
      until.getFullYear(),
      until.getMonth(),
      until.getDate(),
      23,
      59,
      59,
      999
    );
    let enteredMax = new Date(
      entered.getFullYear(),
      entered.getMonth(),
      entered.getDate(),
      23,
      59,
      59,
      999
    );

    let existing = {
      until: {
        shared: [],
        personal: []
      },
      entered: {
        shared: [],
        personal: []
      }
    };

    let getExistingUntilShared = this.db
      .colWithIds$(
        `years/${this.getYear()}/courses/${
          this.homeworkForm.get('course').value
        }/homework`,
        ref =>
          ref
            .where('until.date', '>=', until)
            .where('until.date', '<=', untilMax)
      )
      .pipe(take(1))
      .toPromise()
      .then(existingHomework => {
        if (!existingHomework) return;
        existing.until.shared = [...existing.until.shared, ...existingHomework];
      });
    let getExistingEnteredShared = this.db
      .colWithIds$(
        `years/${this.getYear()}/courses/${
          this.homeworkForm.get('course').value
        }/homework`,
        ref =>
          ref
            .where('entered.date', '>=', entered)
            .where('entered.date', '<=', enteredMax)
      )
      .pipe(take(1))
      .toPromise()
      .then(existingHomework => {
        if (!existingHomework) return;
        existing.entered.shared = [
          ...existing.entered.shared,
          ...existingHomework
        ];
      });
    let getExistingUntilPersonal = this.db
      .colWithIds$(`users/${this.auth.user.id}/personalHomework`, ref =>
        ref
          .where('until.date', '>=', until)
          .where('until.date', '<=', untilMax)
          .where('course', '==', course.id)
      )
      .pipe(take(1))
      .toPromise()
      .then(existingHomework => {
        if (!existingHomework) return;
        existing.until.personal = [
          ...existing.until.personal,
          ...existingHomework
        ];
      });
    let getExistingEnteredPersonal = this.db
      .colWithIds$(`users/${this.auth.user.id}/personalHomework`, ref =>
        ref
          .where('entered.date', '>=', entered)
          .where('entered.date', '<=', enteredMax)
          .where('course', '==', course.id)
      )
      .pipe(take(1))
      .toPromise()
      .then(existingHomework => {
        if (!existingHomework) return;
        existing.entered.personal = [
          ...existing.entered.personal,
          ...existingHomework
        ];
      });

    this.homeworkFormComponent.isLoading = true;
    Promise.all([
      getExistingUntilShared,
      getExistingEnteredShared,
      getExistingUntilPersonal,
      getExistingEnteredPersonal
    ]).then(() => {
      let addHomework = () => {
        let data = {
          title: title,
          until: {
            date: until,
            lesson: this.getLesson(until)
          },
          entered: {
            date: entered,
            lesson: this.getLesson(entered)
          },
          details: details,
          attachments: [],
          by: {
            id: this.auth.user.id,
            name: this.auth.user.name,
            roles: this.auth.user.roles
          }
        };
        let operation: Promise<any>;
        if (share) {
          operation = this.db.add(
            `years/${this.getYear()}/courses/${
              this.homeworkForm.get('course').value
            }/homework`,
            data
          );
        } else {
          data['course'] = course.id;
          delete data.by;
          operation = this.db.add(
            `users/${this.auth.user.id}/personalHomework`,
            data
          );
        }
        operation
          .then(() => {
            this.homeworkForm.markAsPristine();
            this.homeworkFormComponent.isLoading = false;
            this.navigateBack();
          })
          .catch(error => {
            this.homeworkFormComponent.isLoading = false;
            this.snackBar.open(
              `Fehler aufgetreten (${error.code}: ${error.message}). Bitte versuche es später erneut`,
              null,
              {
                duration: 4000
              }
            );
          });
      };

      let arrayUnique = array => {
        var a = array.concat();
        for (var i = 0; i < a.length; ++i) {
          for (var j = i + 1; j < a.length; ++j) {
            if (a[i].id === a[j].id) a.splice(j--, 1);
          }
        }

        return a;
      };

      let dialogContent = '';
      if (existing.until.shared.length || existing.entered.shared.length) {
        let shared = arrayUnique([
          ...existing.until.shared,
          ...existing.entered.shared
        ]);
        let both = existing.until.shared.filter(
          value =>
            existing.entered.shared.filter(value2 => value.id == value2.id)
              .length
        );
        dialogContent +=
          'Folgende geteilte Hausaufgaben im gleichen Zeitraum wurden gefunden:\n';
        shared.forEach((h: Homework) => {
          dialogContent += `${
            both.filter(value => h.id == value.id).length
              ? '<span class="warn">'
              : ''
          }<a href="/homework/${h.id}">${h.title}</a>\nAufgabedatum: ${
            existing.entered.shared.filter(s => s.id == h.id).length
              ? '<b>'
              : ''
          }${
            h.entered.date instanceof Date
              ? h.entered.date.toLocaleDateString()
              : h.entered.date.toDate().toLocaleDateString()
          }${
            existing.entered.shared.filter(s => s.id == h.id).length
              ? '</b>'
              : ''
          }\nFälligkeitsdatum: ${
            existing.until.shared.filter(s => s.id == h.id).length ? '<b>' : ''
          }${
            h.until.date instanceof Date
              ? h.until.date.toLocaleDateString()
              : h.until.date.toDate().toLocaleDateString()
          }${
            existing.until.shared.filter(s => s.id == h.id).length ? '</b>' : ''
          }${
            both.filter(value => h.id == value.id).length ? '</span>' : ''
          }\n\n`;
        });
      }
      if (existing.until.personal.length || existing.entered.personal.length) {
        let personal = arrayUnique([
          ...existing.until.personal,
          ...existing.entered.personal
        ]);
        let both = existing.until.personal.filter(
          value =>
            existing.entered.personal.filter(value2 => value.id == value2.id)
              .length
        );
        dialogContent +=
          'Folgende persönliche Hausaufgaben im gleichen Zeitraum wurden gefunden:\n';
        personal.forEach((h: Homework) => {
          dialogContent += `${
            both.filter(value => h.id == value.id).length
              ? '<span class="warn">'
              : ''
          }<a href="/homework/p/${h.id}">${h.title}</a>\nAufgabedatum: ${
            existing.entered.personal.filter(s => s.id == h.id).length
              ? '<b>'
              : ''
          }${
            h.entered.date instanceof Date
              ? h.entered.date.toLocaleDateString()
              : h.entered.date.toDate().toLocaleDateString()
          }${
            existing.entered.personal.filter(s => s.id == h.id).length
              ? '</b>'
              : ''
          }\nFälligkeitsdatum: ${
            existing.until.personal.filter(s => s.id == h.id).length
              ? '<b>'
              : ''
          }${
            h.until.date instanceof Date
              ? h.until.date.toLocaleDateString()
              : h.until.date.toDate().toLocaleDateString()
          }${
            existing.until.personal.filter(s => s.id == h.id).length
              ? '</b>'
              : ''
          }${
            both.filter(value => h.id == value.id).length ? '</span>' : ''
          }\n\n`;
        });
      }
      if (dialogContent.length) {
        this.homeworkFormComponent.isLoading = false;
        let bothPersonal = existing.until.personal.filter(
          value =>
            existing.entered.personal.filter(value2 => value.id == value2.id)
              .length
        );
        let bothShared = existing.until.shared.filter(
          value =>
            existing.entered.shared.filter(value2 => value.id == value2.id)
              .length
        );
        if ((share && bothShared.length) || (!share && bothPersonal.length)) {
          dialogContent +=
            'Bitte ändere das Aufgabe- oder Fälligkeitsdatum der neuen Hausaufgabe.';
          return this.dialog.open(AcceptCancelDialog, {
            data: {
              title: 'Existierende Hausaufgaben gefunden',
              content: dialogContent,
              accept: 'OK'
            }
          });
        } else {
          dialogContent += `Soll die ${
            share ? 'geteilte' : 'persönliche'
          } Hausaufgabe trotzdem erstellt werden?`;
          return this.dialog
            .open(AcceptCancelDialog, {
              data: {
                title: 'Existierende Hausaufgaben gefunden',
                content: dialogContent,
                accept: 'Ja',
                defaultChancel: true
              }
            })
            .afterClosed()
            .pipe(take(1))
            .subscribe(accepted => {
              if (accepted) addHomework();
            });
        }
      }
      return addHomework();
    });
  }

  getLesson(d: Date): number {
    if (
      !this.homeworkFormComponent.getCourse(
        this.homeworkForm.get('course').value
      )
    )
      return;
    if (!d || !(d instanceof Date)) return;
    let course = this.homeworkFormComponent.getCourse(
      this.homeworkForm.get('course').value
    );
    const day = d.getDay() || 7;
    if (!course.lessons || !course.lessons[day]) return;
    const lesson = parseInt(
      Object.keys(course.lessons[day]).filter(
        lesson => !!course.lessons[day][lesson]
      )[0]
    );
    return lesson;
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
}
