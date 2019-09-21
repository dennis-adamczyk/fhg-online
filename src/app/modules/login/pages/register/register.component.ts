import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl
} from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { take, debounceTime, map, tap } from 'rxjs/operators';
import { message } from '../../../../../configs/messages';
import { constant } from 'src/configs/constants';
import { MatVerticalStepper, MatSnackBar } from '@angular/material';
import { of } from 'rxjs';
import { CdkStep } from '@angular/cdk/stepper';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.sass']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  showPassword1: boolean;
  showPassword2: boolean;
  classes: Array<string>;
  loading: boolean = false;
  registered: boolean = false;
  constant = constant;

  @ViewChild('emailStep', { static: false }) emailStep: CdkStep;

  constructor(
    private snackBar: MatSnackBar,
    public auth: AuthService,
    private fb: FormBuilder,
    private db: FirestoreService,
    private router: Router
  ) {}

  ngOnInit() {
    this.showPassword1 = false;
    this.showPassword2 = false;
    this.registerForm = this.fb.group({
      formArray: this.fb.array(
        [
          this.fb.group({
            role: [
              '',
              [Validators.required, Validators.pattern(/^student$|^teacher$/)]
            ]
          }),
          this.fb.group({
            email: [
              '',
              [
                Validators.required,
                Validators.minLength(3),
                Validators.pattern(/^([a-zA-Z-]+\.[a-zA-Z-]+)+$/)
              ]
            ]
          }),
          this.fb.group({
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
          this.fb.group({
            class: [
              '',
              [
                Validators.required,
                Validators.pattern(/^[5-9][a-f]|EF|Q1|Q2$/i)
              ]
            ]
          }),
          this.fb.group(
            {
              password1: ['', [Validators.required, Validators.minLength(6)]],
              password2: ['', [Validators.required]],
              terms: [false, [Validators.required, Validators.requiredTrue]]
            },
            { validator: RegisterValidator.passwordConfirmed }
          )
        ],
        {
          asyncValidators: RegisterValidator.teachersEmail(this.db)
        }
      )
    });
    this.db.doc$('years/--index--').subscribe(data => {
      if (this.role.value != 'teacher') {
        let classArray = data['classes'] as Array<string>;
        classArray.sort();
        this.classes = classArray;
      }
    });
  }

  get formArray(): AbstractControl {
    return this.registerForm.get('formArray');
  }

  get role() {
    return this.formArray.get([0]).get('role');
  }

  get email() {
    return this.formArray.get([1]).get('email');
  }

  get first_name() {
    return this.formArray.get([2]).get('first_name');
  }

  get last_name() {
    return this.formArray.get([2]).get('last_name');
  }

  get class() {
    return this.formArray.get([3]).get('class');
  }

  get password1() {
    return this.formArray.get([4]).get('password1');
  }

  get password2() {
    return this.formArray.get([4]).get('password2');
  }

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

  getPassword1ErrorMessage(): string {
    if (this.password1.hasError('required')) {
      return message.errors.register.password1.required;
    }
    if (this.password1.hasError('minlength')) {
      return message.errors.register.password1.minlength;
    }
  }

  getPassword2ErrorMessage(): string {
    if (this.password2.hasError('required')) {
      return message.errors.register.password2.required;
    }
    if (this.password2.hasError('notMatch')) {
      return message.errors.register.password2.notMatch;
    }
  }

  onStepChange(event: any) {
    this.emailStep.hasError = false;
    this.emailStep._showError = false;
    if (event.selectedIndex == 2) {
      if (this.first_name.untouched && this.last_name.untouched) {
        let splitedName = String(this.email.value).split(/\.(.+)/);

        this.first_name.setValue(this.capitalizeFirstLetter(splitedName[0]));
        this.last_name.setValue(this.capitalizeFirstLetter(splitedName[1]));
      }
    }
    if (event.previouslySelectedIndex == 0) {
      if (this.role.value == 'teacher') {
        this.class.disable();
      } else {
        this.class.enable();
      }
      this.email.updateValueAndValidity();
    }
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.auth
        .register(
          this.role.value,
          this.email.value + constant.emailSuffix,
          this.first_name.value,
          this.last_name.value,
          this.password1.value,
          this.class.value
        )
        .then(() => {
          this.loading = false;
          this.registered = true;
        })
        .catch(error => {
          this.loading = false;
          this.registered = false;
          if (error.code == 'already-exists') {
            this.emailStep.errorMessage = 'E-Mail wird bereits verwendet';
            this.emailStep.hasError = true;
            this.emailStep._showError = true;
            this.emailStep.select();
            this.email.setErrors({ alreadyExists: true });
            this.snackBar
              .open(
                'Benutze eine E-Mail, die noch nicht verwendet wird',
                'Schon registriert?',
                { duration: 4000 }
              )
              .onAction()
              .subscribe(() => this.router.navigate(['/login']));
            return;
          }
          this.snackBar.open(
            `Fehler aufgetreten (${error.code}: ${error.message}). Bitte versuche es später erneut`,
            null,
            { duration: 4000 }
          );
          console.error(error);
        });
    }
  }
}

export class RegisterValidator {
  static teachersEmail(db: FirestoreService) {
    return (control: AbstractControl) => {
      if (control.get([0]).get('role').value != 'teacher') return of(null);
      const email = String(control.get([1]).get('email').value).toLowerCase();
      return db.doc$('users/--index--').pipe(
        debounceTime(500),
        take(1),
        map((index: object) => {
          if ((index['teachers'] as string[]).includes(email)) {
            let arr = index['teachers'] as string[];
            if (!arr.length && control.get([1]).get('email').valid) {
              control
                .get([1])
                .get('email')
                .setErrors({ invalidTeacher: true });
            }
          }
          return null;
        })
      );
    };
  }

  static passwordConfirmed(control: AbstractControl) {
    if (
      control.get('password1').value !== control.get('password2').value &&
      control.get('password2').valid
    ) {
      control.get('password2').setErrors({ notMatch: true });
    }
    return null;
  }
}
