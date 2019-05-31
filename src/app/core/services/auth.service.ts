import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { of, Observable, forkJoin } from 'rxjs';
import { User } from '../models/user.model';
import { FirestoreService } from './firestore.service';
import { switchMap, map, tap } from 'rxjs/operators';
import { AngularFirestoreDocument } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User>;
  authUser$: Observable<firebase.User>;
  constructor(
    private afAuth: AngularFireAuth,
    private db: FirestoreService,
    private router: Router
  ) {
    this.authUser$ = this.afAuth.authState;
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        console.log(user);
        if (user) {
          return this.db.docWithId$<User>(`users/${user.uid}`);
        } else {
          return of(null);
        }
      })
    );
  }

  login(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  logout() {
    return this.afAuth.auth.signOut();
  }

  isLoggedIn(): Observable<boolean> {
    return this.authUser$.pipe(
      switchMap(user => {
        if (user) {
          return of(true);
        } else {
          return of(false);
        }
      })
    );
  }

  get displayName(): Observable<string> {
    return this.user$.pipe(
      switchMap(user => {
        if (user) {
          return of(user.name.first_name + ' ' + user.name.last_name);
        }
      })
    );
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
