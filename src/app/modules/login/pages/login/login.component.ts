import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { message } from '../../../../../messages/messages';
import * as firebase from 'firebase';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean;
  loading: boolean;
  recaptchaVerifier: firebase.auth.RecaptchaVerifier;

  constructor(
    public auth: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute
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

  getEmailErrorMessage(): string {
    if (this.email.hasError('required')) {
      return message.errors.login.email.required;
    }
    if (this.email.hasError('minlength')) {
      return message.errors.login.email.minlength;
    }
    if (this.email.hasError('pattern')) {
      return message.errors.login.email.pattern;
    }
    if (this.email.hasError('not-found')) {
      return message.errors.login.email.notFound;
    }
  }

  getPasswordErrorMessage(): string {
    if (this.password.hasError('required')) {
      return message.errors.login.password.required;
    }
    if (this.password.hasError('wrong-password')) {
      return message.errors.login.password.wrong;
    }
  }

  submit() {
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.loginForm.markAsPending;
    const values = this.loginForm.value;
    const email = values.email + '@franz-haniel-gymnasium.eu';
    const password = values.password;

    this.auth
      .login(email, password, this.route.snapshot.queryParamMap.get('url'))
      .then(x => (this.loading = false))
      .catch(error => {
        console.error(error);
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
            this.recaptchaVerifier.verify().then(_ => {
              this.secure.setValue(true);
              this.recaptchaVerifier.clear();
              this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
                'recaptcha-container'
              );
            });
            break;
        }
      });
  }
}
