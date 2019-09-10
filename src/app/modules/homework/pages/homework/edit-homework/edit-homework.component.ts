import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  HostListener,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { take, filter, map, startWith } from 'rxjs/operators';
import { MatSnackBar, MatDialog } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Observable, Subscription } from 'rxjs';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  ActivatedRouteSnapshot
} from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { HomeworkFormComponent } from '../../../components/homework-form/homework-form.component';
import { HelperService } from 'src/app/core/services/helper.service';
import { Homework } from '../../../models/homework.model';
import { Course } from 'src/app/modules/timetable/models/timetable.model';
import { timetableKey } from 'src/configs/constants';

@Component({
  selector: 'app-edit-homework',
  templateUrl: './edit-homework.component.html',
  styleUrls: ['./edit-homework.component.sass']
})
export class EditHomeworkComponent {
  @ViewChild(HomeworkFormComponent, { static: false })
  homeworkFormComponent: HomeworkFormComponent;
  loadedData: Homework;

  subs: Subscription[] = [];
  startRoute: ActivatedRouteSnapshot;

  constructor(
    private helper: HelperService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.route.snapshot),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        take(1)
      )
      .subscribe(route => (this.startRoute = route));
  }

  ngAfterViewInit(): void {
    this.subs[0] = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.route.snapshot),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        startWith(this.startRoute)
      )
      .subscribe((route: ActivatedRouteSnapshot) => {
        if (route.url.length) {
          this.loadHomeworkData(route);
        } else {
          this.snackBar.open('Diese Hausaufgabe wurde nicht gefunden', null, {
            duration: 4000
          });
          this.navigateBack();
        }
      });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  get homeworkForm(): FormGroup {
    return this.homeworkFormComponent.homeworkForm;
  }

  set isLoading(loading: boolean) {
    this.homeworkFormComponent.isLoading = loading;
  }

  /* ##### LOAD DATA ##### */

  loadHomeworkData(route: ActivatedRouteSnapshot) {
    let courseName = route.params['course'];
    let id = route.params['id'];
    let personal = route.url[0].path == 'p';

    this.homeworkFormComponent.onSubmit = () => this.onSubmit();
    this.homeworkFormComponent.navigateBack = () => this.navigateBack();
    this.isLoading = true;
    this.cd.detectChanges();

    let homeworkRef: string;
    if (personal)
      homeworkRef = `users/${this.auth.user.id}/personalHomework/${id}`;
    else
      homeworkRef = `years/${this.helper.getYear(this.auth.user
        .class as string)}/courses/${courseName}/homework/${id}`;
    this.db.docWithId$(homeworkRef).subscribe((homework: Homework) => {
      if (!homework) {
        this.navigateBack();
        return this.snackBar.open(
          'Diese Hausaufgabe wurde nicht gefunden',
          null,
          { duration: 4000 }
        );
      }
      let courseDetails = JSON.parse(localStorage.getItem(timetableKey));
      if (!courseDetails) {
        return this.snackBar
          .open('Ein Fehler ist aufgetreten', 'Erneut versuchen', {
            duration: 4000
          })
          .onAction()
          .pipe(take(1))
          .subscribe(() => {
            if (!isPlatformBrowser(this.platformId)) return;
            location.reload();
          });
      }
      courseDetails = courseDetails.courses.filter(
        c => c.id == (personal ? homework.course : courseName)
      )[0] as Course;
      if (!courseDetails) {
        this.navigateBack();
        return this.snackBar.open(
          'Du bist kein Mitglied des Kurses der Hausaufgabe',
          null,
          { duration: 4000 }
        );
      }
      if (personal) homework.personal = true;
      homework.course = courseDetails;
      let correctedHomework;
      if (homework.corrections)
        correctedHomework = Object.keys(homework.corrections).filter(
          co =>
            homework.corrections[co] &&
            homework.corrections[co].by.id == this.auth.user.id
        );
      if (correctedHomework && correctedHomework.length) {
        let corrData = homework.corrections[correctedHomework];
        this.homeworkForm.patchValue({
          title: corrData.title || '',
          course: homework.course.id,
          share: !personal,
          until: this.helper.getDateOf(homework.until.date),
          entered: this.helper.getDateOf(homework.entered.date),
          details: corrData.details || ''
        });
      } else {
        this.homeworkForm.patchValue({
          title: homework.title,
          course: homework.course.id,
          share: !personal,
          until: this.helper.getDateOf(homework.until.date),
          entered: this.helper.getDateOf(homework.entered.date),
          details: homework.details
        });
      }

      this.loadedData = homework;
      this.homeworkForm.get('course').disable();
      this.homeworkForm.get('share').disable();
      this.homeworkForm.get('until').disable();
      this.homeworkForm.get('entered').disable();
      this.isLoading = false;
    });
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean | object {
    return this.homeworkForm.dirty
      ? {
          title: 'Änderungen verwerfen?',
          content:
            'Bist du sicher, dass du die Änderungen an der Hausaufgabe verwerfen willst?',
          accept: 'Verwerfen'
        }
      : true;
  }

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.referrer.match(/\/homework(\/.*)*$/)) this.location.back();
    else
      this.router.navigate(
        [
          `/homework/${
            this.loadedData.personal ? 'p' : this.loadedData.course.id
          }/${this.loadedData.id}`
        ],
        { replaceUrl: true }
      );
  }

  onSubmit() {
    if (this.homeworkForm.invalid) return;

    let course = this.homeworkFormComponent.getCourse(
      this.homeworkForm.get('course').value
    );
    let title = this.homeworkForm.get('title').value as string;
    let details = this.homeworkForm.get('details').value as string;

    if (!course || !course.id) return;
    if (!title) return;

    this.isLoading = true;

    let updateHomework = (): Promise<void> => {
      let data = {
        title: title,
        details: details,
        attachments: []
      };

      let homeworkRef = '';
      if (!this.loadedData.personal)
        homeworkRef = `years/${this.helper.getYearOfCourse(
          this.loadedData.course.id
        )}/courses/${this.loadedData.course.id}/homework/${this.loadedData.id}`;
      else
        homeworkRef = `users/${this.auth.user.id}/personalHomework/${this.loadedData.id}`;

      return this.db.update(homeworkRef, data).then(() => {
        this.snackBar.open('Änderungen an der Hausaufgabe gespeichert', null, {
          duration: 4000
        });
      });
    };

    let addCorrection = () => {
      let correctedHomework;
      if (this.loadedData.corrections)
        correctedHomework = Object.keys(this.loadedData.corrections).filter(
          co => this.loadedData.corrections[co].by.id == this.auth.user.id
        );

      if (correctedHomework && correctedHomework.length) {
        let oldId = correctedHomework[0];

        let correctionId = this.helper.generateId();
        while (
          this.loadedData.corrections &&
          this.loadedData.corrections[correctionId]
        )
          correctionId = this.helper.generateId();

        let data = {
          title: title,
          details: details,
          by: {
            id: this.auth.user.id,
            name: this.auth.user.name,
            roles: this.auth.user.roles
          }
        };

        let homeworkRef = `years/${this.helper.getYearOfCourse(
          this.loadedData.course.id
        )}/courses/${this.loadedData.course.id}/homework/${this.loadedData.id}`;

        delete this.loadedData.corrections[oldId];
        this.loadedData.corrections[correctionId] = data;

        return this.db
          .update(homeworkRef, {
            corrections: this.loadedData.corrections
          })
          .then(() => {
            let corrData = {
              id: correctionId
            };
            if (data.title || data.details) {
              corrData['title'] = data.title;
              corrData['details'] = data.details;
            }
            this.db
              .update(`users/${this.auth.user.id}/singles/homework`, {
                [`correction.${this.loadedData.id}`]: corrData
              })
              .then(() => {
                this.snackBar.open(
                  'Bearbeitungsvorschlag zur Hausaufgabe bearbeitet',
                  null,
                  { duration: 4000 }
                );
              });
          });
      } else {
        let correctionId = this.helper.generateId();
        while (
          this.loadedData.corrections &&
          this.loadedData.corrections[correctionId]
        )
          correctionId = this.helper.generateId();

        let data = {
          title: title,
          details: details,
          by: {
            id: this.auth.user.id,
            name: this.auth.user.name,
            roles: this.auth.user.roles
          }
        };

        let homeworkRef = `years/${this.helper.getYearOfCourse(
          this.loadedData.course.id
        )}/courses/${this.loadedData.course.id}/homework/${this.loadedData.id}`;

        return this.db
          .update(homeworkRef, {
            [`corrections.${correctionId}`]: data
          })
          .then(() => {
            let corrData = {
              id: correctionId
            };
            if (data.title || data.details) {
              corrData['title'] = data.title;
              corrData['details'] = data.details;
            }
            this.db
              .update(`users/${this.auth.user.id}/singles/homework`, {
                [`correction.${this.loadedData.id}`]: corrData
              })
              .then(() => {
                console.log(corrData);
                this.snackBar.open(
                  'Bearbeitungsvorschlag zur Hausaufgabe hinzugefügt',
                  null,
                  { duration: 4000 }
                );
              });
          });
      }
    };

    let operation: Promise<void>;

    //TODO: if is teacher's course
    if (
      this.loadedData.personal ||
      this.loadedData.by.id == this.auth.user.id ||
      this.auth.user.roles.guard ||
      (this.auth.user.roles.admin &&
        this.helper.getClass(this.loadedData.course.id) ==
          this.auth.user.class.toLocaleLowerCase())
    ) {
      operation = updateHomework();
    } else {
      operation = addCorrection();
    }

    operation
      .then(() => {
        this.homeworkForm.markAsPristine();
        this.navigateBack();
        this.isLoading = false;
      })
      .catch(error => {
        this.isLoading = false;
        this.snackBar.open(
          `Fehler aufgetreten (${error.code}: ${error.message}). Bitte versuche es später erneut`,
          null,
          {
            duration: 4000
          }
        );
      });
  }
}
