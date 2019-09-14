import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { fbind } from 'q';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { constant } from 'src/configs/constants';
import { message } from 'src/configs/messages';
import { MatDialog, MatSnackBar, MatExpansionPanel } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { FirebaseFunctions } from '@angular/fire';
import { AngularFireFunctions } from '@angular/fire/functions';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.sass'],
  providers: []
})
export class UserComponent {
  data: User;
  name: string;
  isLoading: boolean = true;

  userForm: FormGroup;
  classes: string[] = [];
  courses: string[] = [];

  edited: boolean = false;

  sanctionsForm: FormGroup;
  sanctionLoading: boolean = false;
  infoForm: FormGroup;

  currentDate = new Date();

  constant = constant;

  constructor(
    private db: FirestoreService,
    private afFunc: AngularFireFunctions,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  ngOnInit() {
    this.userForm = this.fb.group({
      name: this.fb.group({
        first_name: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
            )
          ]
        ],
        last_name: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
            )
          ]
        ]
      }),
      email: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^([a-zA-Z-]+\.[a-zA-Z-]+)+$/)
        ]
      ],
      roles: this.fb.group({
        guard: [false],
        admin: [false],
        teacher: [false],
        student: [false]
      }),
      class: [null],
      courses: [[]],
      status: [null, [Validators.required]]
    });
    this.onChanges();

    this.sanctionsForm = this.fb.group({
      interaction: this.fb.group({
        permanent: [true],
        until: [new Date()],
        reason: ['']
      }),
      block: this.fb.group({
        permanent: [true],
        until: [new Date()],
        reason: ['']
      }),
      ban: this.fb.group({
        reason: ['']
      })
    });

    this.infoForm = this.fb.group({
      id: '',
      settings_changed: '',
      created_at: '',
      updated_at: ''
    });
    this.infoForm.disable();
  }

  ngOnDestroy() {
    if (this.edited) {
      this.snackBar.open(
        `Änderungen am Benutzer "${this.data.name.first_name} ${this.data.name.last_name}" wurden verworfen`,
        null,
        {
          duration: 4000
        }
      );
    }
  }

  /* ##### GET DATA ##### */

  ngAfterViewInit() {
    this.route.params.subscribe(params => {
      if (!params.uid) return this.location.back();
      this.getData(params.uid);
    });
  }

  getData(uid: string) {
    this.isLoading = true;
    this.db.docWithId$<User>(`users/${uid}`).subscribe((result: User) => {
      if (result.email == undefined) {
        this.snackBar
          .open('Kein Benutzer mit dieser ID gefunden', 'Zurück', {
            duration: 4000
          })
          .afterDismissed()
          .subscribe(() => this.location.back());
        return;
      }
      this.data = result;
      this.isLoading = false;
      this.userForm.patchValue({
        name: result.name,
        email: this.splitEmail(result.email),
        roles: result.roles,
        class: result.class,
        courses: result.courses,
        status: result.status
      });
      if (!this.auth.user.roles.guard) {
        this.userForm.get('name').disable();
        this.userForm.get('email').disable();
        this.userForm.get('roles').disable();
        this.userForm.get('status').disable();
      }
      this.edited = false;
      if (result.sanctions) {
        if (result.sanctions.interaction) {
          this.sanctionsForm.get('interaction').patchValue({
            permanent: result.sanctions.interaction.permanent,
            until:
              result.sanctions.interaction.until instanceof
              firebase.firestore.Timestamp
                ? result.sanctions.interaction.until.toDate()
                : this.currentDate,
            reason: result.sanctions.interaction.reason
          });
        }
        if (result.sanctions.block) {
          this.sanctionsForm.get('block').patchValue({
            permanent: result.sanctions.block.permanent,
            until:
              result.sanctions.block.until instanceof
              firebase.firestore.Timestamp
                ? result.sanctions.block.until.toDate()
                : this.currentDate,
            reason: result.sanctions.block.reason
          });
        }
        if (result.sanctions.ban) {
          this.sanctionsForm.get('ban').patchValue({
            reason: result.sanctions.ban.reason
          });
        }
        this.checkExpiredSanctions();
      }
      if (!result.class || !result.class.length) this.loadClasses();
      if (!result.courses || !result.courses.length) this.loadCourses();
      this.infoForm.patchValue({
        id: result.id,
        settings_changed: result.settings_changed
          ? result.settings_changed.toDate().toLocaleString()
          : null,
        created_at: result.created_at
          ? result.created_at.toDate().toLocaleString()
          : null,
        updated_at: result.updated_at
          ? result.updated_at.toDate().toLocaleString()
          : null
      });
    });
  }

  loadClasses() {
    if (this.classes.length) return;
    this.db.doc$('years/--index--').subscribe(data => {
      let classArray = data['classes'] as string[];
      classArray.sort();
      this.classes = classArray;
    });
  }

  loadCourses() {
    let clazz = this.userForm.get('class').value;
    if (this.isSingleClass) {
      if (clazz.length < 2) return;
      let year = (clazz as string).charAt(0).match(/\d/)
        ? (clazz as string).charAt(0)
        : (clazz as string);
      this.db
        .colWithIds$(
          `years/${year}/courses`,
          clazz != year
            ? ref =>
                ref
                  .where('class', 'array-contains', clazz)
                  .where('multi', '==', true)
            : undefined
        )
        .subscribe(data => {
          let courseArray = data.map(obj => obj.id) as string[];
          courseArray.sort();
          this.courses = courseArray;
        });
    } else {
      this.courses = [];
      clazz.forEach(el => {
        let year = (el as string).charAt(0).match(/\d/)
          ? (el as string).slice(0, 1)
          : (el as string);
        this.db
          .colWithIds$(
            `years/${year}/courses`,
            el != year
              ? ref =>
                  ref
                    .where('class', 'array-contains', el)
                    .where('mutli', '==', true)
              : undefined
          )
          .subscribe(data => {
            let courseArray = data.map(obj => obj.id) as string[];
            courseArray.sort();
            this.courses = [...this.courses, ...courseArray];
          });
      });
    }
  }

  /* ##### TRIGGER ###### */

  onChanges(): void {
    this.userForm.valueChanges.subscribe(val => {
      this.edited = true;
    });
  }

  onTeacherChange(event) {
    if (event.checked) {
      this.userForm
        .get('roles')
        .get('student')
        .setValue(false);
    }
  }

  onStudentChange(event) {
    if (event.checked) {
      this.userForm
        .get('roles')
        .get('teacher')
        .setValue(false);
      let clazz: any = this.userForm.get('class').value;
      if (Array.isArray(clazz) && clazz.length == 1) {
        this.userForm.get('class').setValue(clazz[0]);
      }
    }
  }

  onClassChange(event) {
    this.userForm.get('courses').setValue([]);
    this.loadCourses();
  }

  onSave() {
    let update = () => {
      let val = this.userForm.value as object;
      for (var prop in val) {
        if (val[prop] === undefined) val[prop] = null;
        if (prop == 'email') val[prop] += constant.emailSuffix;
      }
      return this.db
        .update(`users/${this.data.id}`, this.userForm.value)
        .then(() => (this.edited = false));
    };

    if (this.userForm.invalid) {
      this.dialog
        .open(AcceptCancelDialog, {
          data: {
            title: 'Änderungen am Benutzer speichern?',
            content: `Das Formular ist fehlerhaft. Es können erhebliche Fehler für den Benutzer entstehen.`,
            accept: 'Speichern',
            defaultCancel: true
          }
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe(result => {
          if (result) {
            return update();
          }
        });
    } else {
      return update();
    }
  }

  onUndo() {
    this.ngOnInit();
    this.getData(this.data.id);
  }

  onDelete() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Konto löschen?',
          content: `Das Konto von <b>${this.first_name.value +
            ' ' +
            this.last_name
              .value}</b> wird unwiederruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können.`,
          accept: 'Unwiederruflich löschen',
          defaultCancel: true
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          let deleteUser = this.afFunc.functions.httpsCallable('deleteUser');
          deleteUser({ uid: this.data.id }).then(() => {
            this.isLoading = true;
            this.data = null;
            this.router.navigate(['/admin/users'], {
              queryParams: { refresh: true }
            });
          });
        }
      });
  }

  onTimeChange(section: string, event) {
    if (!(this.sanctionsForm.get(section).get('until').value instanceof Date))
      return;
    let current = this.sanctionsForm.get(section).get('until').value as Date;
    current.setHours(0);
    current.setMinutes(0);
    current.setSeconds(0);
    current.setMilliseconds(event.target.valueAsNumber);
    this.sanctionsForm
      .get(section)
      .get('until')
      .setValue(current);
  }

  onDateInput(section: string, event) {
    let newValue = (event.target.value as string)
      .split('.')
      .map(str => parseInt(str));
    let newDate = new Date(`${newValue[2]}-${newValue[1]}-${newValue[0]}`);
    this.sanctionsForm
      .get(section)
      .get('until')
      .setValue(newDate);
  }

  onDurationDaysChange(section: string, event) {
    if (!(this.sanctionsForm.get(section).get('until').value instanceof Date))
      return;
    let days = parseInt(event.target.value);
    let hours = parseInt(
      ((event.target as Element)
        .closest('.duration')
        .querySelector('.hours input') as any).value
    );
    let newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    newDate.setHours(newDate.getHours() + hours);
    this.sanctionsForm
      .get(section)
      .get('until')
      .setValue(newDate);
  }

  onDurationHourChange(section: string, event) {
    if (!(this.sanctionsForm.get(section).get('until').value instanceof Date))
      return;
    let days = parseInt(
      ((event.target as Element)
        .closest('.duration')
        .querySelector('.days input') as any).value
    );
    let hours = parseInt(event.target.value);
    let newDate = new Date();
    newDate.setHours(newDate.getHours() + hours);
    newDate.setDate(newDate.getDate() + days);
    this.sanctionsForm
      .get(section)
      .get('until')
      .setValue(newDate);
  }

  onSanctionSubmit(sanction: string) {
    let data = this.sanctionsForm.get(sanction).value;
    if (this.sanctionsForm.get(sanction).invalid) return;
    if (
      sanction != 'ban' &&
      !data.permanent &&
      (!data.until || !(data.until instanceof Date))
    )
      return;

    if (
      sanction != 'ban' &&
      !data.permanent &&
      data.until.getTime() - this.currentDate.getTime() < 36e5
    )
      return this.dialog.open(AcceptCancelDialog, {
        data: {
          title: 'Dauer verlängern',
          content: `Die Dauer einer temporären Sanktion muss mehr als eine Stunde betragen.`,
          accept: 'Korrigieren',
          defaultCancel: false
        }
      });

    let formatted;

    switch (sanction) {
      case 'interaction':
      case 'block':
        formatted = {
          since: this.currentDate as Date,
          by: {
            id: this.auth.user.id as string,
            name: (this.auth.user.name.first_name +
              ' ' +
              this.auth.user.name.last_name) as string
          },
          until: data.permanent ? null : (data.until as Date),
          permanent: data.permanent as boolean,
          reason: data.reason as string
        };
        break;

      case 'ban':
        formatted = {
          since: this.currentDate as Date,
          by: {
            id: this.auth.user.id as string,
            name: (this.auth.user.name.first_name +
              ' ' +
              this.auth.user.name.last_name) as string
          },
          reason: data.reason as string
        };
        break;
    }

    this.sanctionLoading = true;
    this.db
      .update(`users/${this.data.id}`, {
        [`sanctions.${sanction}`]: formatted
      })
      .then(() => {
        this.data.sanctions.interaction = formatted;
        this.sanctionLoading = false;
      });
  }

  onSanctionDelete(sanction: string) {
    this.sanctionLoading = true;
    this.db
      .update(`users/${this.data.id}`, {
        [`sanctions.${sanction}`]: null
      })
      .then(() => {
        this.data.sanctions[sanction] = null;
        this.sanctionLoading = false;
      });
  }

  /* ##### HELPER ##### */

  get isSingleClass(): boolean {
    return this.userForm.get('roles').get('student').value;
  }

  max(num: number): number[] {
    return Array(num + 1)
      .fill(0)
      .map(Number.call, Number);
  }

  splitEmail(email: string): string {
    return email.split('@')[0];
  }

  getRoleName(role: string): string {
    return message.roles[role];
  }

  isMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return window.innerWidth < 600;
  }

  getTimeFrom(date: Date): string {
    if (!date || !(date instanceof Date)) return '00:00';
    return (
      (date.getHours().toString().length == 2
        ? date.getHours().toString()
        : '0' + date.getHours().toString()) +
      ':' +
      (date.getMinutes().toString().length == 2
        ? date.getMinutes().toString()
        : '0' + date.getMinutes().toString())
    );
  }

  getDurationDays(date: Date, start?: Date): number {
    if (!date || !(date instanceof Date)) return 0;
    if (!start || !(start instanceof Date)) start = this.now;
    date.setSeconds(0);
    date.setMilliseconds(0);
    return Math.max(
      Math.floor((date.getTime() - start.getTime()) / 86400000),
      0
    );
  }

  getDurationHours(date: Date, start?: Date): number {
    if (!date || !(date instanceof Date)) return 0;
    if (!start || !(start instanceof Date)) start = this.now;
    date.setSeconds(0);
    date.setMilliseconds(0);
    return Math.max(
      Math.floor(((date.getTime() - start.getTime()) % 86400000) / 3600000),
      0
    );
  }

  getDurationMinutes(date: Date, start?: Date): number {
    if (!date || !(date instanceof Date)) return 0;
    if (!start || !(start instanceof Date)) start = this.now;
    date.setSeconds(0);
    date.setMilliseconds(0);
    return Math.max(
      Math.floor(
        (((date.getTime() - start.getTime()) % 86400000) % 3600000) / 60000
      ),
      0
    );
  }

  getSanctionCountdown(sanction: string): string {
    let date = this.getDateOf(this.data.sanctions[sanction].until);

    let output = '';
    if (this.getDurationDays(date)) output += `${this.getDurationDays(date)}T `;
    if (this.getDurationHours(date) || output.length)
      output += `${this.getDurationHours(date)}h `;
    if (this.getDurationMinutes(date) || output.length)
      output += `${this.getDurationMinutes(date)}min `;

    return output.slice(0, -1);
  }

  getDateOf(date: Date | firebase.firestore.Timestamp): Date {
    if (date instanceof firebase.firestore.Timestamp) return date.toDate();
    return date;
  }

  checkExpiredSanctions() {
    if (this.data && this.data.sanctions) {
      if (this.data.sanctions.interaction || this.data.sanctions.block) {
        let sanctions = Object.keys(this.data.sanctions).filter(
          key =>
            this.data.sanctions[key] &&
            !this.data.sanctions[key].permanent &&
            key !== 'ban'
        );
        sanctions.forEach(sanction => {
          if (
            this.getDateOf(this.data.sanctions[sanction].until).getTime() <=
            Date.now()
          ) {
            this.onSanctionDelete(sanction);
          }
        });
      }
    }
  }

  get now(): Date {
    let date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }

  /* ##### GETTER ##### */

  get email() {
    return this.userForm.get('email');
  }

  get first_name() {
    return this.userForm.get('name').get('first_name');
  }

  get last_name() {
    return this.userForm.get('name').get('last_name');
  }

  get status() {
    return this.userForm.get('status');
  }

  /* ##### ERRORS ##### */

  getEmailErrorMessage(): string {
    if (this.email.hasError('required')) {
      return message.errors.register.email.required;
    }
    if (this.email.hasError('minlength')) {
      return message.errors.register.email.minlength;
    }
    if (this.email.hasError('pattern')) {
      return message.errors.register.email.pattern;
    }
    if (this.email.hasError('alreadyExists')) {
      return message.errors.register.email.alreadyExists;
    }
    if (this.email.hasError('invalidTeacher')) {
      return message.errors.register.email.invalidTeacher;
    }
  }

  getFirstNameErrorMessage(): string {
    if (this.first_name.hasError('required')) {
      return message.errors.register.first_name.required;
    }
    if (this.first_name.hasError('pattern')) {
      return message.errors.register.first_name.pattern;
    }
  }

  getLastNameErrorMessage(): string {
    if (this.last_name.hasError('required')) {
      return message.errors.register.last_name.required;
    }
    if (this.last_name.hasError('pattern')) {
      return message.errors.register.last_name.pattern;
    }
  }

  getStatusErrorMessage(): string {
    if (this.status.hasError('required')) {
      return message.errors.admin.user.status.required;
    }
  }
}
