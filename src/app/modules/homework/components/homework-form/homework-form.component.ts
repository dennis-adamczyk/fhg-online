import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  HostListener,
  NgZone,
  ViewChild,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { take, map } from 'rxjs/operators';
import { Course } from 'src/app/modules/timetable/pages/timetable/timetable.component';
import { constant } from 'src/configs/constants';
import { MatSnackBar, MatDialog, MatInput } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Homework } from '../../pages/homework/homework.component';

@Component({
  selector: 'app-homework-form',
  templateUrl: './homework-form.component.html',
  styleUrls: ['./homework-form.component.sass']
})
export class HomeworkFormComponent implements OnInit {
  homeworkForm: FormGroup;
  isNewTab = isPlatformBrowser(this.platformId)
    ? window.history.length <= 2
    : true;

  courses: Course[] = [];

  isLoading: boolean = false;

  @ViewChild('titleInput', { static: true }) titleInput: MatInput;
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
    private snackBar: MatSnackBar,
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
    if (!this.homeworkForm) {
      this.homeworkForm = this.fb.group({
        title: ['', [Validators.required]],
        course: [null, [Validators.required]],
        share: [false, [Validators.required]],
        until: [undefined, [Validators.required]],
        entered: [undefined, [Validators.required]],
        details: ['']
      });
    }
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
    this.titleInput.focus();
  }

  /* ##### FILTER ##### */

  lessonFilter = (d: Date): boolean => {
    if (!this.getCourse(this.homeworkForm.get('course').value)) {
      const day = d.getDay();
      return day !== 0 && day !== 6;
    } else {
      let course = this.getCourse(this.homeworkForm.get('course').value);
      let allowedDays = Object.keys(course.lessons).filter(
        day => !!course.lessons[day]
      );
      const day = d.getDay() || 7;
      return allowedDays.includes(day.toString());
    }
  };

  /* ##### TRIGGERS ##### */

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.referrer.match(/\/homework(\/\w*)*$/)) this.location.back();
    else this.router.navigate(['/homework'], { replaceUrl: true });
  }

  onCourseChange(event) {
    if (!event.value) return;
    let course = event.value as Course;
    this.setRelativeDate('until', 1);
    this.setRelativeDate('entered', -1);
  }

  onSubmit() {}

  /* ##### HELPER ##### */

  getCourse(id: string): Course {
    return (this.courses.filter(c => c.id == id)[0] as Course) || null;
  }

  getCourseName(id: string): string {
    let course = this.getCourse(id);
    if (!course) return;
    if (
      this.courses.filter(c => c.short == course.short).length > 1 &&
      course.multi
    ) {
      let courseNum = course.id.match(/\d+\-[\D]+(\d+)/)[1];
      return `${course.subject} ${courseNum}`;
    }
    return course.subject;
  }

  showSnackbar(message: string) {
    return this.snackBar.open(message, null, { duration: 4000 });
  }

  getLesson(d: Date): number {
    if (!this.getCourse(this.homeworkForm.get('course').value)) return;
    if (!d || !(d instanceof Date)) return;
    let course = this.getCourse(this.homeworkForm.get('course').value);
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
    let course = this.getCourse(
      this.homeworkForm.get('course').value
    ) as Course;
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
    if (formControl.disabled) return;
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
    if (!this.getCourse(this.homeworkForm.get('course').value)) return true;
    let course = this.getCourse(this.homeworkForm.get('course').value);
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
