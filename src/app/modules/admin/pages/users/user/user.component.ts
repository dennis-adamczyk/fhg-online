import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject,
  HostListener
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { fbind } from 'q';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { constant } from 'src/configs/constants';
import { message } from 'src/configs/messages';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { FirebaseFunctions } from '@angular/fire';
import { AngularFireFunctions } from '@angular/fire/functions';

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

  infoForm: FormGroup;

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
        `Änderungen am Benutzer "${this.data.name.first_name} ${
          this.data.name.last_name
        }" wurden verworfen`,
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
    this.db.docWithId$<User>(`users/${uid}`).subscribe(result => {
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
      this.edited = false;
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
            ? ref => ref.where('class', 'array-contains', clazz)
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
              ? ref => ref.where('class', 'array-contains', el)
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
