import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { message } from 'src/configs/messages';
import { constant } from 'src/configs/constants';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { EditLessonsDialog } from 'src/app/core/dialogs/edit-lessons/edit-lessons.component';
import { take } from 'rxjs/operators';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { Router } from '@angular/router';
import { ColorPickerDialog } from 'src/app/core/dialogs/color-picker/color-picker.component';
import { Course } from 'src/app/modules/timetable/models/timetable.model';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.sass']
})
export class AddCourseComponent implements OnInit {
  courseForm: FormGroup;
  isLoading: boolean = false;

  classes: string[] = [];

  constructor(
    private location: Location,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    private fb: FormBuilder,
    private renderer: Renderer2,
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
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  init() {
    this.courseForm = this.fb.group({
      subject: ['', [Validators.required]],
      short: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s]+$/),
          Validators.maxLength(5)
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
    this.loadClasses();
  }

  /* ##### LOAD DATA ##### */

  loadClasses() {
    if (this.classes.length) return;
    this.db.doc$('years/--index--').subscribe(data => {
      let classArray = data['classes'] as string[];
      classArray.sort();
      this.classes = classArray;
    });
  }

  /* ##### TRIGGER ###### */

  onChangeMulti(event) {
    if (event.checked) {
      this.class.setValue([]);
    } else {
      this.class.setValue('');
    }
  }

  onSubmit() {
    if (this.courseForm.invalid) {
      this.dialog
        .open(AcceptCancelDialog, {
          data: {
            title: 'Kurs erstellen?',
            content: `Das Formular ist fehlerhaft. Es können erhebliche Fehler für den Kurs entstehen.`,
            accept: 'Erstellen',
            defaultCancel: true
          }
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe(result => {
          if (result) {
            this.submitForm();
          }
        });
    } else {
      this.submitForm();
    }
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

  onClickColor(event) {
    event.preventDefault();
    event.stopPropagation();
    setTimeout(() => {
      this.color.markAsUntouched();
      this.color.setErrors([]);
    }, 0);

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

  submitForm() {
    this.isLoading = true;
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
    if (
      this.class.value == {} ||
      this.class.value == '' ||
      this.class.value == undefined ||
      this.short.value.trim() == '' ||
      this.short.value == undefined
    ) {
      this.dialog.open(AcceptCancelDialog, {
        data: {
          title: 'Fehlende Angaben',
          content: `Bitte gib mindestens die Klasse(n) und das Fächerkürzel an, um den Kurs erstellen zu können.`,
          accept: 'Korrigieren',
          defaultCancel: false
        }
      });
      this.isLoading = false;
      return;
    }

    let year = this.multi.value
      ? this.getYear(this.class.value[0])
      : this.getYear(this.class.value);
    let name = this.multi.value
      ? year + '-' + this.short.value.trim()
      : this.class.value + '-' + this.short.value.trim();

    let val = this.courseForm.value as Course;
    for (var prop in val) {
      if (val[prop] === undefined) val[prop] = null;
      if (prop == 'class' && typeof val.class == 'string')
        val.class = [val.class as string];
    }

    if (this.multi.value) {
      this.db
        .colWithIds$(`years/${year}/courses`, ref =>
          ref.where('short', '==', val.short.trim()).where('multi', '==', true)
        )
        .pipe(take(1))
        .subscribe((result: object[]) => {
          var max = 0;
          result.forEach(val => {
            if (val['id'].slice(-1).match(/\d/)) {
              if (parseInt(val['id'].slice(-1)) > max)
                max = parseInt(val['id'].slice(-1));
            }
          });

          name += max + 1;
          this.db
            .set(`years/${year}/courses/${name}`, val)
            .then(() => {
              this.snackBar.open('Kurs erfolgreich erstellt', null, {
                duration: 4000
              });
              this.location.back();
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
              console.error(error);
            });
        });
    } else {
      this.db
        .colWithIds$(`years/${year}/courses`, ref =>
          ref
            .where('short', '==', val.short.trim())
            .where('multi', '==', false)
            .where('class', '==', val.class)
        )
        .pipe(take(1))
        .subscribe((result: Course[]) => {
          if (result.length) {
            this.dialog.open(AcceptCancelDialog, {
              data: {
                title: 'Kurs bereits vorhanden',
                content: `Es ist bereits ein ${val.subject}-Kurs mit dem Namen "${result[0]['id']}" für die Klasse ${val.class[0]} vorhanden.`,
                accept: 'Klasse ändern',
                defaultCancel: false
              }
            });
            this.isLoading = false;
            return;
          } else {
            this.db
              .set(`years/${year}/courses/${name}`, val)
              .then(() => {
                this.snackBar.open('Kurs erfolgreich erstellt', null, {
                  duration: 4000
                });
                this.location.back();
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
                console.error(error);
              });
          }
        });
    }
  }

  getYear(clazz: string): string {
    if (clazz.charAt(0).match(/\d/)) {
      return clazz.charAt(0);
    } else {
      return clazz.slice(0, 2);
    }
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

  isObjectEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
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
}
