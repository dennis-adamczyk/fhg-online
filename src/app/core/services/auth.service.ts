import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { of, Observable, forkJoin } from 'rxjs';
import { User } from '../models/user.model';
import { FirestoreService } from './firestore.service';
import { switchMap, startWith, tap } from 'rxjs/operators';
import { message } from '../../../configs/messages';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User>;
  user: User;

  constructor(
    private afAuth: AngularFireAuth,
    private db: FirestoreService,
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
    fist_name: string,
    last_name: string,
    password: string,
    clazz?: string
  ) {
    return this.afAuth.auth
      .createUserWithEmailAndPassword(email, password)
      .then(credentials => {
        return this.db.set(`users/${credentials.user.uid}`, {
          roles: {
            admin: false,
            guard: false,
            student: role == 'student' ? true : false,
            teacher: role == 'teacher' ? true : false
          },
          email: email,
          name: {
            first_name: fist_name,
            last_name: last_name
          },
          class: clazz,
          status: 0
        });
      });
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
