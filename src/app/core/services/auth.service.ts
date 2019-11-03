import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { of, Observable, forkJoin, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { FirestoreService } from './firestore.service';
import { switchMap, startWith, tap, map } from 'rxjs/operators';
import { message } from '../../../configs/messages';
import { isPlatformBrowser } from '@angular/common';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatSnackBar, MatDialog } from '@angular/material';
import * as firebase from 'firebase/app';
import { SanctionDialog } from '../dialogs/sanction/sanction.component';
import { AcceptCancelDialog } from '../dialogs/accept-cancel/accept-cancel.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User>;
  user: User;

  constructor(
    private afAuth: AngularFireAuth,
    private db: FirestoreService,
    private afFunc: AngularFireFunctions,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    try {
      if (
        isPlatformBrowser(this.platformId) &&
        typeof localStorage == 'undefined'
      ) {
        throw 'not supported';
      }
    } catch (ex) {
      this.dialog.open(AcceptCancelDialog, {
        data: {
          title: 'Cookies aktivieren',
          content:
            'Um diese Seite nutzen zu können, musst du Cookies und das lokale Speichern aktivieren.',
          accept: 'OK'
        }
      });
      this.router.navigate(['/start']);
      return;
    }

    this.user = isPlatformBrowser(this.platformId)
      ? JSON.parse(localStorage.getItem('user'))
      : null;
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user && user.uid) {
          return this.db.docWithId$<User>(`users/${user.uid}`);
        } else {
          return of(null);
        }
      })
    );
    this.user$.subscribe(user => {
      if (!user) {
        if (isPlatformBrowser(this.platformId)) localStorage.clear();
        this.user = user;
        return;
      }

      if (this.afAuth.auth.currentUser.emailVerified && user.status == 0) {
        this.db
          .update(`users/${user.id}`, { status: 1 })
          .catch(error =>
            this.snackBar.open(
              'Beim Verifizieren deines Kontos ist ein Fehler in der Datenbank aufgetreten.',
              null,
              { duration: 4000 }
            )
          );
        user.status = 1;
      }

      if (
        this.user &&
        this.user.class !== user.class &&
        isPlatformBrowser(this.platformId)
      )
        localStorage.clear();

      if (isPlatformBrowser(this.platformId))
        localStorage.setItem('user', JSON.stringify(user));
      this.user = user;

      if (user && (this.hasSanction('block') || this.hasSanction('ban'))) {
        this.logout().then(() => this.router.navigate(['/login']));
        this.user = null;
        this.dialog.open(SanctionDialog, {
          data: user.sanctions
        });
      }
    });
  }

  async login(
    email: string,
    password: string,
    url?: string | null,
    navExtras?: NavigationExtras | {}
  ) {
    return this.afAuth.auth
      .signInWithEmailAndPassword(email, password)
      .then(credentials => {
        // TODO: Send verification email if not verified
        if (credentials.user.emailVerified) {
          this.router.navigate([url || '/'], navExtras || {});
          return credentials;
        } else if (credentials.user) {
          this.snackBar.open(
            'Du musst deine E-Mail erst verifizieren, bevor du dich anmeldest.',
            null,
            { duration: 4000 }
          );
          this.logout();
        }
      });
  }

  rawLogin(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  async register(
    role: string,
    email: string,
    first_name: string,
    last_name: string,
    password: string,
    clazz?: string
  ) {
    let registerUser = this.afFunc.functions.httpsCallable('registerUser');
    return registerUser({
      role: role,
      email: email,
      name: {
        first_name: first_name,
        last_name: last_name
      },
      password: password,
      class: clazz
    })
      .then(result => {
        return this.afAuth.auth
          .signInWithCustomToken(result.data.token)
          .then(firebaseUser => {
            return firebaseUser.user.sendEmailVerification().then(() => {
              return this.afAuth.auth.signOut().then();
            });
          });
      })
      .catch(error => {
        throw error;
      });
  }

  logout(redirectLink?: string) {
    return this.afAuth.auth
      .signOut()
      .then(() =>
        this.router.navigate([redirectLink ? redirectLink : '/start'])
      );
  }

  delete(): Promise<void> {
    let id = this.user.id;
    return this.afAuth.auth.currentUser.delete().then(() => {
      return this.db.delete(`users/${id}`).then(() => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.clear();
          location.reload();
        }
      });
    });
  }

  setPassword(password: string) {
    return this.afAuth.auth.currentUser
      .updatePassword(password)
      .then(() => {
        this.snackBar.open('Dein Passwort wurde geändert', null, {
          duration: 4000
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  sendEmailVerification() {
    return this.afAuth.auth.currentUser.sendEmailVerification();
  }

  getDisplayName(user: User): string {
    return user ? user.name.first_name + ' ' + user.name.last_name : null;
  }

  getRoleName(user: User): string {
    if (user.roles.guard) {
      return message.roles.guard;
    }
    if (user.roles.admin) {
      return message.roles.admin;
    }
    if (user.roles.teacher) {
      return message.roles.teacher;
    }
    if (user.roles.student) {
      return message.roles.student;
    }
    return null;
  }

  hasSanction(sanction: 'interaction' | 'block' | 'ban'): boolean {
    if (
      sanction !== 'interaction' &&
      sanction !== 'block' &&
      sanction !== 'ban'
    )
      return false;

    if (sanction !== 'ban' && this.checkExpiredSanction(sanction)) {
      return false;
    }

    return !!this.user.sanctions && !!this.user.sanctions[sanction];
  }

  getSanction(
    sanction: 'interaction' | 'block' | 'ban'
  ): {
    since: firebase.firestore.Timestamp | Date;
    by: {
      id: string;
      name: string;
    };
    until?: firebase.firestore.Timestamp | Date;
    permanent?: boolean;
    reason: string;
  } {
    if (
      sanction !== 'interaction' &&
      sanction !== 'block' &&
      sanction !== 'ban'
    )
      return null;

    if (sanction !== 'ban' && this.checkExpiredSanction(sanction)) {
      return null;
    }

    return this.user.sanctions ? this.user.sanctions[sanction] : null;
  }

  private checkExpiredSanction(sanction: 'interaction' | 'block'): boolean {
    if (
      this.user &&
      this.user.sanctions &&
      this.user.sanctions[sanction] &&
      !this.user.sanctions[sanction].permanent &&
      this.getDateOf(this.user.sanctions[sanction].until).getTime() < Date.now()
    ) {
      this.db.update(`users/${this.user.id}`, {
        [`sanction.${sanction}`]: null
      });
      return true;
    }
    return false;
  }

  private getDateOf(date: Date | firebase.firestore.Timestamp): Date {
    if (date instanceof firebase.firestore.Timestamp) return date.toDate();
    return date;
  }
}
