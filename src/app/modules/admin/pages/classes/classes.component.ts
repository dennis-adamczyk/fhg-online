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
import { HelperService } from 'src/app/core/services/helper.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.sass']
})
export class ClassesComponent implements OnInit {
  classlist: string[];

  offline = false;

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    public helper: HelperService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Hab den Überblick über alle Klassen und passe sie gegebenenfalls an.',
      keywords: 'Administration, Klassen, Schulplaner, FHG Online, FHG',
      robots: 'noindex, nofollow'
    });
  }

  /* ##### Toolbar Extention ##### */

  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

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

      this.db
        .doc$('years/--index--')
        .pipe(
          tap(d => {
            if (!d && !this.helper.onLine) {
              this.offline = true;
              return;
            }
            this.offline = false;
            this.classlist = d['classes'].sort();
          })
        )
        .subscribe();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
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
                this.helper.isClass(result) ? 'Klasse' : 'Stufe'
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
                .doc(`years/${this.helper.getYear(result)}`)
                .get()
                .toPromise()
                .then(docSnapshot => {
                  if (this.helper.isClass(result)) {
                    this.db.upsert(`years/${this.helper.getYear(result)}`, {
                      classes:
                        docSnapshot.data() && docSnapshot.data().classes
                          ? [...docSnapshot.data().classes, result].sort()
                          : [result]
                    });
                  } else if (!docSnapshot.exists) {
                    this.db.set(`years/${this.helper.getYear(result)}`, {});
                  }
                  this.snackBar.open(
                    `${
                      this.helper.isClass(result) ? 'Klasse' : 'Stufe'
                    } ${result} erfolgreich erstellt`,
                    null,
                    { duration: 4000 }
                  );
                });
            });
        }
      });
  }
}
