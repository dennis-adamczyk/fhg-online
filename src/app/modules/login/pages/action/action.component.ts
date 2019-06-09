import {
  Component,
  OnInit,
  Renderer2,
  HostListener,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirebaseAuth } from '@angular/fire';
import { AppToolbarService } from '../../../../core/services/app-toolbar.service';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl
} from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { message } from '../../../../../configs/messages';
import { constant } from '../../../../../configs/constants';
import { Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, tap, take } from 'rxjs/operators';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { User } from 'src/app/core/models/user.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.sass']
})
export class ActionComponent implements OnInit {
  toolbar: Element;
  sidenavContent: Element;
  scrollListener: any;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.XSmall)
    .pipe(map(result => result.matches));

  mode: string;
  actionCode: string;
  continueUrl: string;

  actionForm: FormGroup;
  loading: boolean = false;
  submitted: boolean = false;
  error: string = null;
  showPassword1: boolean;
  showPassword2: boolean;
  restoredEmail: string;
  status: number = 0;

  constant = constant;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private afAuth: AngularFireAuth,
    public auth: AuthService,
    private fb: FormBuilder,
    private toolbarService: AppToolbarService,
    private db: FirestoreService,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    const mode: string = this.route.snapshot.queryParams['mode'];
    const actionCode: string = this.route.snapshot.queryParams['oobCode'];
    const continueUrl: string | null =
      this.route.snapshot.queryParams['continueUrl'] || null;
    this.mode = mode;

    if (!isPlatformBrowser(platformId)) return;

    switch (mode) {
      case 'resetPassword':
        toolbarService.title$.subscribe(title => {
          if (title == 'Anmeldung')
            toolbarService.setTitle('Passwort zurücksetzen');
        });

        if (this.auth.user) this.router.navigate(['/']);
        this.actionForm = this.fb.group(
          {
            email: '',
            password1: ['', [Validators.required, Validators.minLength(6)]],
            password2: ['', [Validators.required]]
          },
          { validator: ActionValidator.passwordConfirmed }
        );

        this.handleResetPassword(afAuth.auth, actionCode, continueUrl);
        break;
      case 'recoverEmail':
        toolbarService.title$.subscribe(title => {
          if (title == 'Anmeldung')
            toolbarService.setTitle('E-Mail wiederherstellen');
        });
        this.handleRecoverEmail(afAuth.auth, actionCode);
        break;
      case 'verifyEmail':
        toolbarService.title$.subscribe(title => {
          if (title == 'Anmeldung') toolbarService.setTitle('Verifizieren');
        });

        this.handleVerifyEmail(afAuth.auth, actionCode, continueUrl);
        break;
      case 'forgotPassword':
        toolbarService.title$.subscribe(title => {
          if (title == 'Anmeldung')
            toolbarService.setTitle('Passwort zurücksetzen');
        });

        if (this.auth.user) this.router.navigate(['/']);
        this.actionForm = this.fb.group({
          email: [
            '',
            [
              Validators.required,
              Validators.minLength(3),
              Validators.pattern(/^([\w-]+\.[\w-]+)+$/)
            ]
          ]
        });
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.isHandset$.subscribe(handset => {
        if (!handset) {
          let scrollHandler = () => {
            if (this.sidenavContent.scrollTop > 64) {
              this.renderer.removeStyle(this.toolbar, 'box-shadow');
            } else {
              this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
            }
          };
          scrollHandler();
          this.scrollListener = this.renderer.listen(
            this.sidenavContent,
            'scroll',
            event => scrollHandler()
          );
        } else {
          this.renderer.removeStyle(this.toolbar, 'box-shadow');
        }
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof this.scrollListener == 'function') this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  // FORM

  get email() {
    return this.actionForm.get('email');
  }

  getEmailErrorMessage() {
    if (this.email.hasError('required')) {
      return message.errors.login_action.email.required;
    }
    if (this.email.hasError('minlength')) {
      return message.errors.login_action.email.minlength;
    }
    if (this.email.hasError('pattern')) {
      return message.errors.login_action.email.pattern;
    }
    if (this.email.hasError('not-found')) {
      return message.errors.login_action.email.notFound;
    }
  }

  get password1() {
    return this.actionForm.get('password1');
  }

  getPassword1ErrorMessage(): string {
    if (this.password1.hasError('required')) {
      return message.errors.login_action.password1.required;
    }
    if (this.password1.hasError('minlength')) {
      return message.errors.login_action.password1.minlength;
    }
  }

  get password2() {
    return this.actionForm.get('password2');
  }

  getPassword2ErrorMessage(): string {
    if (this.password2.hasError('required')) {
      return message.errors.login_action.password2.required;
    }
    if (this.password2.hasError('notMatch')) {
      return message.errors.login_action.password2.notMatch;
    }
  }

  // SUBMITS

  submitForgotPassword() {
    if (this.actionForm.valid) {
      this.loading = true;
      this.afAuth.auth
        .sendPasswordResetEmail(this.email.value + constant.emailSuffix)
        .then(() => {
          this.loading = false;
          this.submitted = true;
        })
        .catch(error => {
          console.error(error);
          this.loading = false;
          const code = error.code;
          switch (code) {
            case 'auth/user-not-found':
              this.email.setErrors({ 'not-found': true });
              break;
          }
        });
    }
  }

  submitResetPassword() {
    if (this.actionForm.valid) {
      this.loading = true;
      this.afAuth.auth
        .confirmPasswordReset(this.actionCode, this.password1.value)
        .then(res => {
          this.loading = false;
          this.submitted = true;
        })
        .catch(error => {
          this.error =
            'Bei der Bestätigung ist ein Fehler aufgetreten. Der Code ist möglicherweise abgelaufen.';
        });
    }
  }

  // Handler

  handleResetPassword(
    auth: FirebaseAuth,
    actionCode: string,
    continueUrl: string | null
  ) {
    if (typeof actionCode != 'string' || actionCode.length == 0)
      return (this.error =
        'Ungültiger oder abgelaufener Aktionscode. Bitte versuche, das Passwort erneut zurückzusetzen.');

    let $this = this;
    auth
      .verifyPasswordResetCode(actionCode)
      .then(email => {
        this.email.setValue(email);
        this.actionCode = actionCode;
        if (continueUrl) this.continueUrl = continueUrl;
      })
      .catch(error => {
        $this.error =
          'Ungültiger oder abgelaufener Aktionscode. Bitte versuche, das Passwort erneut zurückzusetzen.';
      });
  }

  handleRecoverEmail(auth: FirebaseAuth, actionCode: string) {
    if (typeof actionCode != 'string' || actionCode.length == 0)
      return (this.error =
        'Ungültiger oder abgelaufener Wiederherstellunscode. Bitte versuche deine E-Mail erneut wiederherzustellen.');

    let $this = this;
    this.loading = true;
    auth
      .checkActionCode(actionCode)
      .then(info => {
        this.restoredEmail = info.data.email;

        return auth.applyActionCode(actionCode);
      })
      .then(() => {
        this.loading = false;
        this.submitted = true;
      })
      .catch(function(error) {
        $this.error =
          'Ungültiger oder abgelaufener Wiederherstellunscode. Bitte versuche deine E-Mail erneut wiederherzustellen.';
      });
  }

  onRecoverEmailPasswordReset() {
    let $this = this;
    this.status = 1;
    this.loading = true;
    this.afAuth.auth
      .sendPasswordResetEmail(this.restoredEmail)
      .then(() => {
        this.loading = false;
        this.submitted = true;
      })
      .catch(error => {
        $this.error =
          'Beim Zurücksetzen deines Passworts ist ein Fehler aufgetreten. Bitte versuche es später erneut.';
      });
  }

  handleVerifyEmail(
    auth: FirebaseAuth,
    actionCode: string,
    continueUrl: string | null
  ) {
    let $this = this;
    this.loading = true;
    if (typeof actionCode != 'string' || actionCode.length == 0)
      return (this.error =
        'Ungültiger oder abgelaufener Verifizierzungscode. Bitte versuche deine E-Mail erneut zu verifizieren, indem du versucht dich anzumelden.');

    auth
      .checkActionCode(actionCode)
      .then(resp => {
        auth
          .applyActionCode(actionCode)
          .then(() => {
            this.db
              .colWithIds$<User>('users', ref =>
                ref.where('email', '==', resp.data.email)
              )
              .pipe(
                take(1),
                tap(data => {
                  if (data.length == 0) {
                    return ($this.error =
                      'Das Konto, das du verifizieren möchtest, wurde gelöscht. Bitte registriere dich erneut.');
                  }

                  this.db
                    .update(`users/${data[0].id}`, { status: 1 })
                    .then(() => {
                      if (continueUrl) this.continueUrl = continueUrl;
                      this.loading = false;
                      this.submitted = true;
                    })
                    .catch(error => {
                      $this.error =
                        'Beim Verifizieren deines Kontos ist ein Fehler in der Datenbank aufgetreten.';
                    });
                })
              )
              .subscribe();
          })
          .catch(error => {
            $this.error =
              'Ungültiger oder abgelaufener Verifizierzungscode. Bitte versuche deine E-Mail erneut zu verifizieren, indem du versucht dich anzumelden.';
          });
      })
      .catch(error => {
        console.error(error);
        $this.error =
          'Ungültiger oder abgelaufener Verifizierzungscode. Bitte versuche, deine E-Mail erneut zu verifizieren, indem du versucht dich anzumelden.';
      });
  }
}

export class ActionValidator {
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
