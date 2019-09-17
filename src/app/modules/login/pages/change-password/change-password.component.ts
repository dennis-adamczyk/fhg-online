import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { message } from '../../../../../configs/messages';
import { constant } from '../../../../../configs/constants';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { ActionValidator } from '../action/action.component';
import { isPlatformBrowser, Location } from '@angular/common';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.sass']
})
export class ChangePasswordComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean;
  showPassword1: boolean;
  showPassword2: boolean;
  loading: boolean;
  recaptchaVerifier: firebase.auth.RecaptchaVerifier;
  constant = constant;

  passwordForm: FormGroup;

  relogged = false;

  constructor(
    public auth: AuthService,
    private fb: FormBuilder,
    private location: Location,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.showPassword = false;
    this.loading = false;
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^([\w-]+\.[\w-]+)+$/)
        ]
      ],
      password: ['', [Validators.required]],
      secure: [true, [Validators.requiredTrue]]
    });
    this.email.setValue(this.auth.user.email.split('@')[0]);
    this.email.disable();

    this.passwordForm = this.fb.group(
      {
        password1: ['', [Validators.required, Validators.minLength(6)]],
        password2: ['', [Validators.required]]
      },
      { validator: ActionValidator.passwordConfirmed }
    );
  }

  ngAfterViewInit() {
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
      'recaptcha-container'
    );
    window['recaptchaVerifier'] = this.recaptchaVerifier;
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get secure() {
    return this.loginForm.get('secure');
  }

  get password1() {
    return this.passwordForm.get('password1');
  }

  get password2() {
    return this.passwordForm.get('password2');
  }

  getPasswordErrorMessage(): string {
    if (this.password.hasError('required')) {
      return message.errors.login.password.required;
    }
    if (this.password.hasError('wrong-password')) {
      return message.errors.login.password.wrong;
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

  submitPassword() {
    if (this.passwordForm.invalid || this.loading) return;

    this.loading = true;
    this.passwordForm.markAsPending;
    const values = this.passwordForm.value;
    const password1 = values.password1;
    const password2 = values.password2;

    if (password1 !== password2) return this.password2.setErrors(['notMatch']);

    this.auth
      .setPassword(password1)
      .then(() => {
        this.loading = false;
        this.navigateBack();
      })
      .catch(error => {
        this.snackBar
          .open('Es ist ein Fehler aufgetreten', 'Erneut versuchen', {
            duration: 4000
          })
          .onAction()
          .subscribe(() => this.submitPassword());
        console.error(error);
      });
  }

  submit() {
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.loginForm.markAsPending;
    const values = this.loginForm.value;
    const email = this.auth.user.email;
    const password = values.password;

    this.auth
      .rawLogin(email, password)
      .then(credential => {
        this.loading = false;
        if (credential.user) {
          this.relogged = true;
        }
      })
      .catch(error => {
        this.loading = false;
        const code = error.code;
        switch (code) {
          case 'auth/user-not-found':
            this.email.setErrors({ 'not-found': true });
            break;
          case 'auth/wrong-password':
            this.password.setErrors({ 'wrong-password': true });
            break;
          case 'auth/too-many-requests':
            this.secure.setValue(false);
            this.recaptchaVerifier.render();
            this.recaptchaVerifier.verify().then(() => {
              this.secure.setValue(true);
              this.recaptchaVerifier.clear();
              this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
                'recaptcha-container'
              );
              this.submit();
            });
            break;
        }
      });
  }

  forgotPassword() {
    this.auth
      .logout()
      .then(() => this.router.navigate(['/login/forgotPassword']));
  }

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.referrer.indexOf(window.location.host) !== -1)
      this.location.back();
    else this.router.navigate(['/settings'], { replaceUrl: true });
  }
}
