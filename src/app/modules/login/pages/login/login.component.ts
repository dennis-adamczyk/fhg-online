import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { message } from '../../../../../configs/messages';
import { constant } from '../../../../../configs/constants';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { SeoService } from 'src/app/core/services/seo.service';

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
  constant = constant;

  constructor(
    private seo: SeoService,
    public auth: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Melde dich einfach auf all deinen Geräten mit deinem Konto an, um den digitalen Schulplaner des Franz-Haniel-Gymnasiums nutzen zu können.',
      keywords:
        'Login, Anmelden, Konto, Start, Franz-Haniel-Gymnasium, Schulplaner, FHG Online, FHG'
    });
  }

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
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId))
      setTimeout(() => {
        this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
          'recaptcha-container',
          { size: 'normal' }
        );
        window['recaptchaVerifier'] = this.recaptchaVerifier;
      }, 0);
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
    const email = values.email + constant.emailSuffix;
    const password = values.password;

    const url = this.route.snapshot.queryParamMap.get('url')
      ? decodeURIComponent(this.route.snapshot.queryParamMap.get('url'))
      : null;
    const path = url ? url.split('?')[0] : null;
    const paramsArray = url ? this.getUrlParams(url) : null;
    const fragment = url ? url.split('#')[1] : null;
    const extras: NavigationExtras =
      paramsArray || fragment
        ? {
            queryParams: paramsArray,
            fragment: fragment
          }
        : null;

    this.auth
      .login(email, password, path, extras)
      .then(x => (this.loading = false))
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
            this.recaptchaVerifier.verify().then(_ => {
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

  private getUrlParams(url): object {
    var queryString = url.split('?')[1];

    var obj = null;

    if (queryString) {
      obj = {};
      queryString = queryString.split('#')[0];
      var arr = queryString.split('&');

      for (var i = 0; i < arr.length; i++) {
        var a = arr[i].split('=');

        var paramName = a[0];
        var paramValue = typeof a[1] === 'undefined' ? true : a[1];

        paramName = paramName.toLowerCase();
        if (typeof paramValue === 'string')
          paramValue = paramValue.toLowerCase();

        if (paramName.match(/\[(\d+)?\]$/)) {
          var key = paramName.replace(/\[(\d+)?\]/, '');
          if (!obj[key]) obj[key] = [];

          if (paramName.match(/\[\d+\]$/)) {
            var index = /\[(\d+)\]/.exec(paramName)[1];
            obj[key][index] = paramValue;
          } else {
            obj[key].push(paramValue);
          }
        } else {
          if (!obj[paramName]) {
            obj[paramName] = paramValue;
          } else if (obj[paramName] && typeof obj[paramName] === 'string') {
            obj[paramName] = [obj[paramName]];
            obj[paramName].push(paramValue);
          } else {
            obj[paramName].push(paramValue);
          }
        }
      }
    }

    return obj;
  }
}
