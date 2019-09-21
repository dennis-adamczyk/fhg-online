import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { message } from 'src/configs/messages';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { constant } from 'src/configs/constants';
import { EditLessonsDialog } from 'src/app/core/dialogs/edit-lessons/edit-lessons.component';
import { ColorPickerDialog } from 'src/app/core/dialogs/color-picker/color-picker.component';
import { Course } from 'src/app/modules/timetable/models/timetable.model';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.sass']
})
export class CourseComponent implements OnInit {
  isLoading: boolean = false;
  edited: boolean = false;

  course: string;
  courseForm: FormGroup;
  classes: string[] = [];

  constructor(
    private db: FirestoreService,
    private location: Location,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

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
    }
    this.init();
    this.loadData();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
    if (this.edited) {
      this.snackBar.open(
        `Änderungen am Kurs "${this.course}" wurden verworfen`,
        null,
        {
          duration: 4000
        }
      );
    }
  }

  init() {
    this.courseForm = this.fb.group({
      subject: ['', [Validators.required]],
      short: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s]+$/),
          Validators.maxLength(8)
        ]
      ],
      room: ['', [Validators.required, Validators.maxLength(5)]],
      class: [[], [Validators.required]],
      multi: [false],
      teacher: this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(10)]],
        last_name: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
            )
          ]
        ],
        short: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[^\s]+$/),
            Validators.maxLength(5)
          ]
        ]
      }),
      lessons: [{}],
      color: ['', [Validators.required]]
    });
    this.courseForm.valueChanges.subscribe((val: Course) => {
      if (val.multi) this.loadClasses();
      this.edited = true;
    });
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.isLoading = true;
    this.route.params.subscribe(params => {
      if (!params.course) return this.location.back();
      this.course = params.course;
      this.db
        .doc$(`years/${this.getYear()}/courses/${this.course}`)
        .pipe(take(1))
        .subscribe((result: Course) => {
          if (result == undefined) {
            this.snackBar
              .open('Kein Kurs mit diesem Namen gefunden', 'Zurück', {
                duration: 4000
              })
              .afterDismissed()
              .subscribe(() => this.location.back());
            return;
          }
          this.courseForm.patchValue({
            subject: result.subject,
            short: result.short,
            room: result.room,
            teacher: result.teacher,
            class: result.class,
            multi: result.multi,
            lessons: result.lessons,
            color: result.color
          });
          this.edited = false;
          this.isLoading = false;
        });
    });
  }

  loadClasses() {
    if (this.classes.length) return;
    this.db.doc$('years/--index--').subscribe(data => {
      let classArray = data['classes'] as string[];
      classArray.sort();
      this.classes = classArray;
    });
  }

  /* ##### TRIGGER ###### */

  onSave() {
    let update = () => {
      if (!this.validateClasses()) {
        this.dialog.open(AcceptCancelDialog, {
          data: {
            title: 'Fehlerhafte Klassen',
            content: `Ein Kurs kann nur Klassen aus demselben Jahrgang beinhalten. Bitte entferne Klassen aus anderen Jahrgängen.`,
            accept: 'Korrigieren',
            defaultCancel: false
          }
        });
        this.isLoading = false;
        return;
      }

      let val = this.courseForm.value as Course;
      for (var prop in val) {
        if (val[prop] === undefined) val[prop] = null;
        if (prop == 'class' && typeof val.class == 'string')
          val.class = [val.class as string];
      }
      return this.db
        .update(
          `years/${this.getYear()}/courses/${this.course}`,
          this.courseForm.value
        )
        .then(() => (this.edited = false));
    };

    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      this.dialog
        .open(AcceptCancelDialog, {
          data: {
            title: 'Änderungen am Kurs speichern?',
            content: `Das Formular ist fehlerhaft. Es können erhebliche Fehler für den Kurs entstehen.`,
            accept: 'Speichern',
            defaultCancel: true
          }
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe(result => {
          if (result) {
            return update();
          }
        });
    } else {
      return update();
    }
  }

  onUndo() {
    this.ngOnInit();
  }

  onDelete() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Kurs löschen?',
          content: `Der Kurs <b>${this.course}</b> wird unwiderruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können.`,
          accept: 'Unwiederruflich löschen',
          defaultCancel: true
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.db
            .delete(`years/${this.getYear()}/courses/${this.course}`)
            .then(() => {
              this.isLoading = true;
              this.edited = false;
              this.location.back();
            });
        }
      });
  }

  onEditLessons() {
    this.dialog
      .open(EditLessonsDialog, {
        data: {
          lessons: this.lessons.value
        },
        panelClass: 'full-screen-dialog'
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) this.lessons.setValue(result);
      });
  }

  onClickColor() {
    this.dialog
      .open(ColorPickerDialog, {
        data: {
          color: this.color.value
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.color.setValue(result);
        }
      });
  }

  onKeyColor(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  onShortBlur() {
    if (this.color.value == '' || this.color.value == undefined) {
      if (constant.standardColors[this.short.value]) {
        this.color.setValue(constant.standardColors[this.short.value]);
      }
    }
  }

  /* ##### HELPER ##### */

  getColor(color: string): string {
    if (!color || color == '' || color == undefined) color = 'Indigo 500';
    let code = color.split(' ');
    return constant.colors[code[0]][code[1]];
  }

  getContrastColor(color: string): string {
    if (!color || color == '' || color == undefined) color = 'Indigo 500';
    let code = color.split(' ');
    return constant.colorsContrast[code[0]][code[1]];
  }

  validateClasses() {
    if (this.multi.value) {
      var valid = true;
      var year: any;
      this.class.value.forEach(clazz => {
        if (year != undefined && year != this.getYear(clazz)) {
          valid = false;
        }
        year = this.getYear(clazz);
      });
      return valid;
    }
    return true;
  }

  getYear(clazz: string = undefined) {
    if (clazz == undefined) clazz = this.course;
    if (clazz.charAt(0).match(/\d/)) {
      return clazz.charAt(0);
    } else {
      return clazz.slice(0, 2);
    }
  }

  getLessonsStringArray(lessons: any[] = undefined): string[] {
    if (lessons == undefined) lessons = this.lessons.value;
    var output = [];
    for (const day in lessons) {
      if (lessons.hasOwnProperty(day)) {
        const lessonObj = lessons[day];
        for (const lesson in lessonObj) {
          if (lessonObj.hasOwnProperty(lesson)) {
            const data = lessonObj[lesson];
            output.push(
              constant.weekDay[day] +
                ', ' +
                lesson +
                '. Stunde' +
                (data.changed ? '*' : '')
            );
          }
        }
      }
    }
    return output;
  }

  /* ##### GETTER ###### */

  get subject() {
    return this.courseForm.get('subject');
  }

  get short() {
    return this.courseForm.get('short');
  }

  get room() {
    return this.courseForm.get('room');
  }

  get teacher_title() {
    return this.courseForm.get('teacher').get('title');
  }

  get teacher_last_name() {
    return this.courseForm.get('teacher').get('last_name');
  }

  get teacher_short() {
    return this.courseForm.get('teacher').get('short');
  }

  get class() {
    return this.courseForm.get('class');
  }

  get multi() {
    return this.courseForm.get('multi');
  }

  get lessons() {
    return this.courseForm.get('lessons');
  }

  get color() {
    return this.courseForm.get('color');
  }

  /* ##### ERROR MESSAGES ##### */

  getSubjectErrorMessage(): string {
    if (this.subject.hasError('required')) {
      return message.errors.admin.course.subject.required;
    }
  }

  getShortErrorMessage(): string {
    if (this.short.hasError('required')) {
      return message.errors.admin.course.short.required;
    }
    if (this.short.hasError('pattern')) {
      return message.errors.admin.course.short.pattern;
    }
    if (this.short.hasError('maxlength')) {
      return message.errors.admin.course.short.maxlength;
    }
  }

  getRoomErrorMessage(): string {
    if (this.room.hasError('required')) {
      return message.errors.admin.course.room.required;
    }
    if (this.room.hasError('maxlength')) {
      return message.errors.admin.course.room.maxlength;
    }
  }

  getTeacherTitleErrorMessage(): string {
    if (this.teacher_title.hasError('required')) {
      return message.errors.admin.course.teacher.title.required;
    }
    if (this.teacher_title.hasError('maxlength')) {
      return message.errors.admin.course.teacher.title.maxlength;
    }
  }

  getTeacherLastNameErrorMessage(): string {
    if (this.teacher_last_name.hasError('required')) {
      return message.errors.admin.course.teacher.last_name.required;
    }
    if (this.teacher_last_name.hasError('pattern')) {
      return message.errors.admin.course.teacher.last_name.pattern;
    }
  }

  getTeacherShortErrorMessage(): string {
    if (this.teacher_short.hasError('required')) {
      return message.errors.admin.course.teacher.short.required;
    }
    if (this.teacher_short.hasError('pattern')) {
      return message.errors.admin.course.teacher.short.pattern;
    }
    if (this.teacher_short.hasError('maxlength')) {
      return message.errors.admin.course.teacher.short.maxlength;
    }
  }

  getClassErrorMessage(): string {
    if (this.class.hasError('required')) {
      return message.errors.admin.course.class.required;
    }
  }

  getColorErrorMessage(): string {
    if (this.class.hasError('required')) {
      return message.errors.admin.course.color.required;
    }
  }

  upperCase(str: string) {
    let original = str.toLocaleLowerCase();
    let uppercased = str.toUpperCase();
    for (var i = 0; i < original.length; i++) {
      if (original.charAt(i) == 'ß')
        uppercased = uppercased.substr(0, i) + 'ß' + uppercased.substr(i + 2);
    }
    return uppercased;
  }
}
