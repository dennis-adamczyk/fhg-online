import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { constant } from 'src/configs/constants';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { message } from 'src/configs/messages';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.sass']
})
export class AddUserComponent implements OnInit {
  userForm: FormGroup;
  classes: string[] = [];
  isLoading: boolean = false;

  showPassword: boolean = false;

  constant = constant;

  constructor(
    private db: FirestoreService,
    private afFunc: AngularFireFunctions,
    private router: Router,
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
              /^([a-zA-ZÄäÖöÜüÉÈéèÇç]+-?[a-zA-ZÄäÖöÜüÉÈéèÇç]+\s?)+$/
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
      role: [
        'student',
        [Validators.required, Validators.pattern(/^student$|^teacher$/)]
      ],
      class: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.db.doc$('years/--index--').subscribe(data => {
      let classArray = data['classes'] as string[];
      classArray.sort();
      this.classes = classArray;
    });
  }

  ngOnDestroy() {
    if (this.isLoading) return;
    this.snackBar.open('Neuer Benutzer wurde verworfen', null, {
      duration: 4000
    });
  }

  /* ##### TRIGGER ###### */

  onTeacherChange(event) {
    this.class.setValue('');
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.dialog
        .open(AcceptCancelDialog, {
          data: {
            title: 'Benutzer erstellen?',
            content: `Das Formular ist fehlerhaft. Es können erhebliche Fehler für den Benutzer entstehen.`,
            accept: 'Erstellen',
            defaultCancel: true
          }
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe(result => {
          if (result) {
            this.submitForm();
          }
        });
    } else {
      this.submitForm();
    }
  }

  /* ###### HELPER ###### */

  submitForm() {
    this.isLoading = true;
    let registerUser = this.afFunc.functions.httpsCallable('registerUser');
    registerUser({
      name: {
        first_name: (this.first_name.value as string).trim(),
        last_name: (this.last_name.value as string).trim()
      },
      email: (this.email.value as string).trim() + constant.emailSuffix,
      role: (this.role.value as string).trim(),
      class: (this.class.value as string).trim(),
      password: this.password.value,
      skipVerification: true
    })
      .then(result => {
        if (result) {
          this.snackBar.open('Benutzer erfolgreich erstellt', null, {
            duration: 4000
          });
          this.router.navigate(['/admin/users'], {
            queryParams: { refresh: true }
          });
        } else {
          this.isLoading = false;
          this.snackBar.open(
            'Fehler aufgetreten. Bitte versuche es später erneut',
            null,
            {
              duration: 4000
            }
          );
          console.error(result);
        }
      })
      .catch(error => {
        this.isLoading = false;
        this.snackBar.open(
          `Fehler aufgetreten (${error.code}: ${
            error.message
          }). Bitte versuche es später erneut`,
          null,
          {
            duration: 4000
          }
        );
        console.error(error);
      });
  }

  /* ##### GETTER ##### */

  get first_name() {
    return this.userForm.get('name').get('first_name');
  }

  get last_name() {
    return this.userForm.get('name').get('last_name');
  }

  get email() {
    return this.userForm.get('email');
  }

  get role() {
    return this.userForm.get('role');
  }

  get class() {
    return this.userForm.get('class');
  }

  get password() {
    return this.userForm.get('password');
  }

  /* ##### ERRORS ##### */

  getRoleErrorMessage(): string {
    if (this.role.hasError('required')) {
      return message.errors.register.role.required;
    }
    if (this.role.hasError('pattern')) {
      return message.errors.register.role.pattern;
    }
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

  getClassErrorMessage(): string {
    if (this.class.hasError('required')) {
      return message.errors.register.class.required;
    }
    if (this.class.hasError('pattern')) {
      return message.errors.register.class.pattern;
    }
  }

  getPasswordErrorMessage(): string {
    if (this.password.hasError('required')) {
      return message.errors.register.password1.required;
    }
    if (this.password.hasError('minlength')) {
      return message.errors.register.password1.minlength;
    }
  }
}
