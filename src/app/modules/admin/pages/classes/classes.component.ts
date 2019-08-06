import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { map, switchMap, tap, take } from 'rxjs/operators';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddClassDialog } from './dialogs/add-class/add-class.component';

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.sass']
})
export class ClassesComponent implements OnInit {
  classlist: string[];

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### Toolbar Extention ##### */

  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

  ngOnInit() {
    this.db
      .doc$('years/--index--')
      .pipe(tap(d => (this.classlist = d['classes'].sort())))
      .subscribe();

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

  /* ##### TRIGGER ##### */

  onAddClass() {
    this.dialog
      .open(AddClassDialog)
      .afterClosed()
      .pipe(take(1))
      .subscribe((result: string) => {
        if (result) {
          if (this.classlist.includes(result)) {
            this.snackBar.open(
              `Die ${
                this.isClass(result) ? 'Klasse' : 'Stufe'
              } ${result} existiert bereits`,
              null,
              { duration: 4000 }
            );
            return;
          }

          this.db
            .update('years/--index--', {
              classes: [...this.classlist, result].sort()
            })
            .then(() => {
              this.db
                .doc(`years/${this.getYear(result)}`)
                .get()
                .toPromise()
                .then(docSnapshot => {
                  if (this.isClass(result)) {
                    this.db.upsert(`years/${this.getYear(result)}`, {
                      classes:
                        docSnapshot.data() && docSnapshot.data().classes
                          ? [...docSnapshot.data().classes, result].sort()
                          : [result]
                    });
                  } else if (!docSnapshot.exists) {
                    this.db.set(`years/${this.getYear(result)}`, {});
                  }
                  this.snackBar.open(
                    `${
                      this.isClass(result) ? 'Klasse' : 'Stufe'
                    } ${result} erfolgreich erstellt`,
                    null,
                    { duration: 4000 }
                  );
                });
            });
        }
      });
  }

  /* ##### HELPER ##### */

  isClass(clazz: string): boolean {
    return !!clazz.match(/^\d/);
  }

  getYear(clazz: string): string {
    if (this.isClass(clazz)) return clazz.charAt(0);
    else return clazz;
  }
}
