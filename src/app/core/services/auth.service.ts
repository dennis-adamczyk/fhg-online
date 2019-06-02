import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { of, Observable, forkJoin } from 'rxjs';
import { User } from '../models/user.model';
import { FirestoreService } from './firestore.service';
import { switchMap, startWith, tap } from 'rxjs/operators';
import { message } from '../../../messages/messages';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User>;

  constructor(
    private afAuth: AngularFireAuth,
    private db: FirestoreService,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db.docWithId$<User>(`users/${user.uid}`);
        } else {
          return of(null);
        }
      })
    );
  }

  async login(email: string, password: string, url?: string) {
    const credential = await this.afAuth.auth.signInWithEmailAndPassword(
      email,
      password
    );
    this.router.navigate([url || '/']);
    return credential;
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

/*

user$: Observable<User>;
  currentUser$: Observable<firebase.User>;

  constructor(
    private afAuth: AngularFireAuth,
    private db: FirestoreService,
    private router: Router
  ) {
    this.currentUser$ = this.afAuth.authState;
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db.docWithId$<User>(`users/${user.uid}`);
        } else {
          return of(null);
        }
      })
    );
  }

  // Current User functions

  get currentUser(): firebase.User {
    return this.afAuth.auth.currentUser;
  }

  getCurrentUserData(): Observable<User> {
    return this.getUserData(this.currentUser);
  }

  updateCurrentUserData(data: object): Promise<void> {
    return this.updateUserData(this.currentUser, data);
  }

  isLoggedIn(): boolean {
    return this.currentUser === null ? false : true;
  }

  // General User functions

  getUserData(user: firebase.User): Observable<User> {
    return this.db.docWithId$<User>(`users/${user.uid}`);
  }

  updateUserData(user: firebase.User, data: object): Promise<void> {
    return this.db.update(`users/${user.uid}`, data);
  }

  // Login

  login(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  logout(): Promise<void> {
    return this.afAuth.auth.signOut();
  }

  // Register

*/
