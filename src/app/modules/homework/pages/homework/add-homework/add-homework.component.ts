import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  HostListener,
  NgZone,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { take, map } from 'rxjs/operators';
import { Course } from 'src/app/modules/timetable/pages/timetable/timetable.component';
import { constant } from 'src/configs/constants';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  selector: 'app-add-homework',
  templateUrl: './add-homework.component.html',
  styleUrls: ['./add-homework.component.sass']
})
export class AddHomeworkComponent implements OnInit {
  isNewTab = isPlatformBrowser(this.platformId)
    ? window.history.length <= 2
    : true;

  homeworkForm: FormGroup;
  courses: Course[] = [];

  isLoading: boolean = false;

  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  triggerResize() {
    this._ngZone.onStable
      .pipe(take(1))
      .subscribe(() => this.autosize.resizeToFitContent(true));
  }

  constructor(
    private db: FirestoreService,
    private fb: FormBuilder,
    private auth: AuthService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private location: Location,
    private router: Router,
    private _ngZone: NgZone,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  ngOnInit() {
    this.triggerResize();
    this.homeworkForm = this.fb.group({
      title: ['', [Validators.required]],
      course: [null, [Validators.required]],
      share: [false, [Validators.required]],
      until: [undefined, [Validators.required]],
      entered: [undefined, [Validators.required]],
      details: ['']
    });
    this.db
      .colWithIds(`years/${this.getYear()}/courses`, ref =>
        ref.where('class', 'array-contains', this.auth.user.class)
      )
      .subscribe((result: Course[]) => {
        if (!result) return;
        this.courses = result.filter(
          c => !c.multi || this.auth.user.courses.includes(c.id)
        );
      });
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean | object {
    return this.homeworkForm.dirty
      ? {
          title: 'Hausaufgabe verwerfen?',
          content:
            'Bist du sicher, dass du diese Hausaufgabe verwerfen willst?',
          accept: 'Verwerfen'
        }
      : true;
  }

  /* ##### FILTER ##### */

  lessonFilter = (d: Date): boolean => {
    if (!this.homeworkForm.get('course').value) {
      const day = d.getDay();
      return day !== 0 && day !== 6;
    } else {
      let course = this.homeworkForm.get('course').value as Course;
      let allowedDays = Object.keys(course.lessons).filter(
        day => !!course.lessons[day]
      );
      const day = d.getDay() || 7;
      return allowedDays.includes(day.toString());
    }
  };

  /* ##### TRIGGERS ##### */

  navigateBack() {
    if (this.isNewTab) this.router.navigate(['/homework']);
    else this.location.back();
  }

  onSubmit() {
    if (this.homeworkForm.invalid) return;

    let course = this.homeworkForm.get('course').value as Course;
    let title = this.homeworkForm.get('title').value as string;
    let until = this.homeworkForm.get('until').value as Date;
    let entered = this.homeworkForm.get('entered').value as Date;
    let details = this.homeworkForm.get('details').value as string;
    let share = this.homeworkForm.get('share').value as boolean;

    if (!course || !course.id) return;
    if (!title) return;
    if (!until || !(until instanceof Date)) return;
    if (!entered || !(entered instanceof Date)) return;
    if (share == undefined || share == null) return;

    if (until.getTime() < entered.getTime())
      return this.snackbar.open(
        'Das Fälligkeitsdatum muss nach dem Aufgabedatum liegen',
        null,
        { duration: 4000 }
      );

    if (!this.getLesson(until))
      return this.homeworkForm.get('until').setErrors(['required']);
    if (!this.getLesson(entered))
      return this.homeworkForm.get('entered').setErrors(['required']);

    until = new Date(until.getFullYear(), until.getMonth(), until.getDate());
    entered = new Date(
      entered.getFullYear(),
      entered.getMonth(),
      entered.getDate()
    );

    this.isLoading = true;
    let data = {
      title: title,
      until: {
        date: until,
        lesson: this.getLesson(until)
      },
      entered: {
        date: entered,
        lesson: this.getLesson(entered)
      },
      details: details,
      attachments: [],
      by: {
        id: this.auth.user.id,
        name: this.auth.user.name,
        roles: this.auth.user.roles
      }
    };
    let operation: Promise<any>;
    if (share) {
      operation = this.db.add(
        `years/${this.getYear()}/courses/${
          this.homeworkForm.get('course').value.id
        }/homework`,
        data
      );
    } else {
      data['course'] = course.id;
      delete data.by;
      operation = this.db.add(
        `users/${this.auth.user.id}/personalHomework`,
        data
      );
    }
    operation.then(() => {
      this.homeworkForm.markAsPristine();
      this.isLoading = false;
      this.navigateBack();
    });
  }

  onCourseChange(event) {
    if (!event.value) return;
    let course = event.value as Course;
    this.setRelativeDate('until', 1);
    this.setRelativeDate('entered', -1);
  }

  /* ##### HELPER ##### */

  getCourseName(course: Course): string {
    if (!course) return;
    if (this.courses.filter(c => c.short == course.short).length > 1) {
      if (course.multi) {
        let courseNum = course.id.match(/\d+\-[\D]+(\d+)/)[1];
        return `${course.subject} ${courseNum}`;
      }
    }
    return course.subject;
  }

  showSnackbar(message: string) {
    return this.snackbar.open(message, null, { duration: 4000 });
  }

  getLesson(d: Date): number {
    if (!this.homeworkForm.get('course').value) return;
    if (!d || !(d instanceof Date)) return;
    let course = this.homeworkForm.get('course').value as Course;
    const day = d.getDay() || 7;
    if (!course.lessons || !course.lessons[day]) return;
    const lesson = parseInt(
      Object.keys(course.lessons[day]).filter(
        lesson => !!course.lessons[day][lesson]
      )[0]
    );
    return lesson;
  }

  getDisplayLesson(d: Date): string {
    let lesson = this.getLesson(d);
    if (!lesson) return;
    return `${lesson}. Stunde`;
  }

  getRelativeDate(add: number): Date {
    let course = this.homeworkForm.get('course').value as Course;
    const today = new Date().getDay() || 7;
    let lessons = course
      ? Object.keys(course.lessons).filter(day => !!course.lessons[day])
      : [];

    if (add == 0) return new Date();

    let output = new Date();
    let futureLessons = lessons
      .filter(day => (add > 0 ? parseInt(day) > today : parseInt(day) <= today))
      .sort();
    let weeksLessons = lessons.sort();

    if (futureLessons.length < add * (add > 0 ? 1 : -1)) {
      let addWeeks = Math.ceil(
        ((add > 0 ? 1 : -1) * add - futureLessons.length) / weeksLessons.length
      );
      let lessonDay = parseInt(
        weeksLessons[
          ((add > 0 ? add - 1 : weeksLessons.length + add) -
            futureLessons.length) %
            weeksLessons.length
        ]
      );
      output.setDate(
        output.getDate() +
          (lessonDay - today) +
          7 * addWeeks * (add > 0 ? 1 : -1)
      );
    } else {
      output.setDate(
        output.getDate() +
          (parseInt(
            futureLessons[add > 0 ? add - 1 : futureLessons.length + add]
          ) -
            today)
      );
    }
    return output;
  }

  setRelativeDate(path: string, add: number) {
    let formControl = this.homeworkForm.get(path);
    return formControl.setValue(this.getRelativeDate(add));
  }

  isRelativeDate(path: string, add: number): boolean {
    let formControl = this.homeworkForm.get(path);
    if (!formControl.value) return false;
    let current = formControl.value as Date;

    if (add == 0) {
      let today = new Date();
      if (
        today.getDate() == current.getDate() &&
        today.getMonth() == current.getMonth() &&
        today.getFullYear() == current.getFullYear()
      )
        return true;
    }
    let relativeDate = this.getRelativeDate(add);
    if (
      relativeDate.getDate() == current.getDate() &&
      relativeDate.getMonth() == current.getMonth() &&
      relativeDate.getFullYear() == current.getFullYear()
    )
      return true;

    return false;
  }

  isLessonToday(): boolean {
    if (!this.homeworkForm.get('course').value) return true;
    let course = this.homeworkForm.get('course').value as Course;
    const today = new Date().getDay() || 7;
    if (!course.lessons || !course.lessons[today]) return false;
    return true;
  }

  getColor(color: string): string {
    if (!color) return;
    var code = color.split(' ');
    return constant.colors[code[0]][code[1]];
  }

  getContrastColor(color: string): string {
    if (!color) return undefined;
    var code = color.split(' ');
    return constant.colorsContrast[code[0]][code[1]];
  }

  isClass(clazz?: string): boolean {
    if (!clazz) clazz = this.auth.user.class as string;
    return !!clazz.match(/^\d/);
  }

  getYear(clazz?: string): string {
    if (!clazz) clazz = this.auth.user.class as string;
    if (this.isClass(clazz)) return clazz.charAt(0);
    else return clazz;
  }
}
