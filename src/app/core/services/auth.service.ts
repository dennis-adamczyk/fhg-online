import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { of, Observable, forkJoin } from 'rxjs';
import { User } from '../models/user.model';
import { FirestoreService } from './firestore.service';
import { switchMap, startWith, tap } from 'rxjs/operators';
import { message } from '../../../configs/messages';
import { isPlatformBrowser } from '@angular/common';
import { AngularFireFunctions } from '@angular/fire/functions';

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
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.user = isPlatformBrowser(this.platformId)
      ? JSON.parse(localStorage.getItem('user'))
      : null;
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db.docWithId$<User>(`users/${user.uid}`);
        } else {
          return of(null);
        }
      })
    );
    this.user$.subscribe(user => {
      if (isPlatformBrowser(this.platformId))
        localStorage.setItem('user', JSON.stringify(user));
      this.user = user;
    });
  }

  async login(email: string, password: string, url?: string) {
    return this.afAuth.auth
      .signInWithEmailAndPassword(email, password)
      .then(credentials => {
        this.router.navigate([url || '/']);
        return credentials;
      });
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
        console.log(result);
        // this.afAuth.auth
        //   .signInWithCustomToken(result.data.token)
        //   .then(firebaseUser => {
        //     firebaseUser.user.sendEmailVerification().then(() => {
        //       this.afAuth.auth.signOut().then(() => console.log('successful'));
        //     });
        //   });
      })
      .catch(error => console.log(error));
  }

  logout() {
    return this.afAuth.auth
      .signOut()
      .then(_ => this.router.navigate(['/login']));
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
}
