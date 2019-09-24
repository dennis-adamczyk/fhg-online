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
import { HelperService } from 'src/app/core/services/helper.service';
import { SeoService } from 'src/app/core/services/seo.service';

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
    private seo: SeoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private db: FirestoreService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    public helper: HelperService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Hab den Überblick über alle die Aktivität deiner Klasse, ihrem Stundenplan und ihren Kursen.',
      keywords: 'Administration, Klasse, Schulplaner, FHG Online, FHG',
      robots: 'noindex, nofollow'
    });
  }

  /* ##### Toolbar Extention ##### */

  ngOnInit() {
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

      this.loadData();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
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

      if (this.helper.isClass(params.class)) {
        this.db
          .doc$(`years/${this.helper.getYear(this.class)}`)
          .pipe(take(1))
          .subscribe((result: { classes: string[] }) => {
            if (!result || !result.classes.includes(this.class)) {
              this.snackBar.open(
                `Die ${this.helper.isClass() ? 'Klasse' : 'Stufe'} ${
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
                `Die ${this.helper.isClass() ? 'Klasse' : 'Stufe'} ${
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

      let members$ = this.db.colWithIds('users', ref =>
        ref.where('class', '==', this.class)
      );

      let admins$ = this.db.colWithIds('users', ref =>
        ref.where('roles.admin', '==', true).where('class', '==', this.class)
      );
      let guards$ = this.db.colWithIds('users', ref =>
        ref.where('roles.guard', '==', true).where('class', '==', this.class)
      );

      members$.subscribe((res: any[]) => {
        this.isLoading = false;
        if (res.length == 0) return;
        res.forEach(res => {
          if (!this.members.includes(res)) this.members.push(res);
        });
      });
      merge(admins$, guards$).subscribe((res: any[]) => {
        this.isLoading = false;
        if (res.length == 0) return;
        res.forEach(res => {
          if (!this.admins.includes(res)) this.admins.push(res);
        });
      });
    });
  }

  private flatten(array: any[]): any[] {
    return array.reduce((acc, val) => acc.concat(val), []);
  }

  onActivate(componentReference) {
    if (componentReference instanceof MembersComponent) {
      componentReference.members = this.members;
      componentReference.class = this.class;
      componentReference.title =
        (this.helper.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
    if (componentReference instanceof AdminsComponent) {
      componentReference.admins = this.admins;
      componentReference.class = this.class;
      componentReference.title =
        (this.helper.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
    if (componentReference instanceof CoursesComponent) {
      componentReference.class = this.class;
      componentReference.title =
        (this.helper.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
    if (componentReference instanceof TimetableComponent) {
      componentReference.class = this.class;
      componentReference.title =
        (this.helper.isClass() ? 'Klasse ' : 'Stufe ') + this.class;
    }
  }

  /* ##### TRIGGER ##### */

  onDelete() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: `${this.helper.isClass() ? 'Klasse' : 'Stufe'} ${
            this.class
          } löschen?`,
          content: `Die ${
            this.helper.isClass() ? 'Klasse' : 'Stufe'
          } wird mitsamt allen Mitgliedern, Administratoren und Kursen unwiderruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können. Wirklich sicher, dass diese Aktion ausgeführt werden soll?`,
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
            if (!this.helper.isClass()) {
              this.db.delete(`years/${this.helper.getYear()}`);
            } else {
              this.db
                .doc$(`years/${this.helper.getYear()}`)
                .pipe(take(1))
                .subscribe((year: { classes: string[] }) => {
                  this.db
                    .update(`years/${this.helper.getYear()}`, {
                      classes: [...year.classes].filter(
                        clazz => clazz !== this.class
                      )
                    })
                    .then(() => {
                      this.db
                        .colWithIds$(
                          `years/${this.helper.getYear()}/courses`,
                          ref =>
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
                                  `years/${this.helper.getYear()}/courses/${
                                    course.id
                                  }`
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
              `Die ${this.helper.isClass() ? 'Klasse' : 'Stufe'} ${
                this.class
              } wurde unwiderruflich gelöscht`,
              null,
              { duration: 4000 }
            );
            this.router.navigate(['/admin/classes']);
          });
      });
  }
}
