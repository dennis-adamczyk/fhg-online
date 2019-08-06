import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { map, startWith, combineLatest, take, filter } from 'rxjs/operators';
import { Observable, forkJoin, merge, Subject, BehaviorSubject } from 'rxjs';
import { MembersComponent } from './members/members.component';
import { AdminsComponent } from './admins/admins.component';
import { CoursesComponent } from './courses/courses.component';
import { TimetableComponent } from './timetable/timetable.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-class',
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.sass']
})
export class ClassComponent implements OnInit {
  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

  isLoading: boolean = true;
  class: string;
  members: any[] = [];
  admins: any[] = [];

  sub: boolean = !!this.route.children.length;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private db: FirestoreService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### Toolbar Extention ##### */

  ngOnInit() {
    this.loadData();

    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.toolbarExtention = document.querySelector('.toolbar-extention');
      let scrollHandler = () => {
        if (
          this.sidenavContent.scrollTop >
          this.toolbarExtention.clientHeight - this.toolbar.clientHeight
        ) {
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
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof this.scrollListener == 'function') this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(url => {
        this.sub = !!this.route.children.length;
        if (this.isLoading) {
          this.members = [];
          this.admins = [];
          this.loadData();
        }
      });
    this.route.params.subscribe(params => {
      this.isLoading = true;
      if (!params.class) return this.location.back();
      this.class = params.class;

      if (params.class.charAt(0).match(/\d/)) {
        this.db
          .doc$(`years/${this.getYear()}`)
          .pipe(take(1))
          .subscribe((result: { classes: string[] }) => {
            if (!result || !result.classes.includes(this.class)) {
              this.snackBar.open(
                `Die ${this.isClass() ? 'Klasse' : 'Stufe'} ${
                  this.class
                } existiert nicht`,
                null,
                { duration: 4000 }
              );
              this.router.navigate(['/admin/classes']);
            }
          });
      } else {
        this.db
          .doc(`years/${this.class}`)
          .get()
          .pipe(take(1))
          .subscribe(docSnapshot => {
            if (!docSnapshot.exists) {
              this.snackBar.open(
                `Die ${this.isClass() ? 'Klasse' : 'Stufe'} ${
                  this.class
                } existiert nicht`,
                null,
                { duration: 4000 }
              );
              this.router.navigate(['/admin/classes']);
            }
          });
      }

      if (this.sub) return;

      let students$ = this.db.colWithIds('users', ref =>
        ref.where('class', '==', this.class)
      );
      let teachers$ = this.db.colWithIds('users', ref =>
        ref.where('class', 'array-contains', this.class)
      );

      let admins$ = this.db.colWithIds('users', ref =>
        ref
          .where('roles.admin', '==', true)
          .where('class', 'array-contains', this.class)
      );
      let guardsStudent$ = this.db.colWithIds('users', ref =>
        ref.where('roles.guard', '==', true).where('class', '==', this.class)
      );

      let guardsTeacher$ = this.db.colWithIds('users', ref =>
        ref
          .where('roles.guard', '==', true)
          .where('class', 'array-contains', this.class)
      );

      merge(students$, teachers$).subscribe((res: any[]) => {
        this.isLoading = false;
        if (res.length == 0) return;
        res.forEach(res => {
          if (!this.members.includes(res)) this.members.push(res);
        });
      });
      merge(admins$, guardsStudent$, guardsTeacher$).subscribe((res: any[]) => {
        this.isLoading = false;
        if (res.length == 0) return;
        res.forEach(res => {
          if (!this.admins.includes(res)) this.admins.push(res);
        });
      });
    });
  }

  isClass(): boolean {
    return !!this.class.charAt(0).match(/\d/);
  }

  getYear(): string {
    if (this.isClass()) return this.class.charAt(0);
    else this.class;
  }

  private flatten(array: any[]): any[] {
    return array.reduce((acc, val) => acc.concat(val), []);
  }

  onActivate(componentReference) {
    if (componentReference instanceof MembersComponent) {
      componentReference.members = this.members;
      componentReference.class = this.class;
      componentReference.title =
        (this.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
    if (componentReference instanceof AdminsComponent) {
      componentReference.admins = this.admins;
      componentReference.class = this.class;
      componentReference.title =
        (this.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
    if (componentReference instanceof CoursesComponent) {
      componentReference.class = this.class;
      componentReference.title =
        (this.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
    if (componentReference instanceof TimetableComponent) {
      componentReference.class = this.class;
      componentReference.title =
        (this.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
  }

  /* ##### TRIGGER ##### */

  onDelete() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: `${this.isClass() ? 'Klasse' : 'Stufe'} ${
            this.class
          } löschen?`,
          content: `Die ${
            this.isClass() ? 'Klasse' : 'Stufe'
          } wird mitsamt allen Mitgliedern, Administratoren und Kursen unwiederruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können. Wirklich sicher, dass diese Aktion ausgeführt werden soll?`,
          defaultCancel: true,
          accept: 'Unwiederruflich löschen'
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.deleteClass();
        }
      });
  }

  /* ##### HELPER ##### */

  deleteClass() {
    this.db
      .doc$(`years/--index--`)
      .pipe(take(1))
      .subscribe((index: { classes: string[]; index: true }) => {
        this.db
          .update(`years/--index--`, {
            classes: [...index.classes].filter(clazz => clazz !== this.class)
          })
          .then(() => {
            if (!this.isClass()) {
              this.db.delete(`years/${this.getYear()}`);
            } else {
              this.db
                .doc$(`years/${this.getYear()}`)
                .pipe(take(1))
                .subscribe((year: { classes: string[] }) => {
                  this.db
                    .update(`years/${this.getYear()}`, {
                      classes: [...year.classes].filter(
                        clazz => clazz !== this.class
                      )
                    })
                    .then(() => {
                      this.db
                        .colWithIds$(`years/${this.getYear()}/courses`, ref =>
                          ref.where('class', 'array-contains', this.class)
                        )
                        .pipe(take(1))
                        .subscribe((courses: { id: string }[]) => {
                          const batch = firebase.firestore().batch();
                          courses.forEach(course => {
                            batch.delete(
                              firebase
                                .firestore()
                                .doc(
                                  `years/${this.getYear()}/courses/${course.id}`
                                )
                            );
                          });
                          batch.commit();
                        });
                    });
                });
            }

            this.db
              .colWithIds$(`users`, ref => ref.where('class', '==', this.class))
              .pipe(take(1))
              .subscribe((users: { id: string }[]) => {
                const batch = firebase.firestore().batch();
                users.forEach(user => {
                  batch.update(firebase.firestore().doc(`users/${user.id}`), {
                    class: null
                  });
                });
                batch.commit();
              });
            this.db
              .colWithIds$(`users`, ref =>
                ref.where('class', 'array-contains', this.class)
              )
              .pipe(take(1))
              .subscribe((users: { id: string; class: string[] }[]) => {
                const batch = firebase.firestore().batch();
                users.forEach(user => {
                  batch.update(firebase.firestore().doc(`users/${user.id}`), {
                    class: [...user.class].filter(clazz => clazz !== this.class)
                  });
                });
                batch.commit();
              });

            this.snackBar.open(
              `Die ${this.isClass() ? 'Klasse' : 'Stufe'} ${
                this.class
              } wurde unwiederruflich gelöscht`,
              null,
              { duration: 4000 }
            );
            this.router.navigate(['/admin/classes']);
          });
      });
  }
}
