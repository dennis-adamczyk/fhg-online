import { Component, OnInit } from '@angular/core';
import { HelperService } from 'src/app/core/services/helper.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { constant } from 'src/configs/constants';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { Course } from 'src/app/modules/timetable/models/timetable.model';
import { SettingsService } from 'src/app/core/services/settings.service';
import { introAnimations } from './intro.animations';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.sass'],
  animations: introAnimations
})
export class IntroComponent implements OnInit {
  private _section = 1;
  set section(section: number) {
    if (this.sectionChangeAnimation) return;
    this.loadSection(section, this._section);
    this._section = section;
  }
  get section(): number {
    return this._section;
  }
  maxSections = 4;
  sectionChangeAnimation: string;

  colors = {
    1: constant.colors.Indigo[500],
    2: constant.colors.Türkis[500],
    3: constant.colors.Lila[300],
    4: constant.colors.Hellblau[700]
  };

  courseGroups: Course[][] = [];
  selectedCourses = {};
  homeworkSorting = '';

  submitted = false;
  hide = false;

  constructor(
    public auth: AuthService,
    public helper: HelperService,
    private settings: SettingsService,
    private db: FirestoreService
  ) {}

  ngOnInit() {
    this.db
      .colWithIds$(`years/${this.helper.getYear()}/courses`, ref =>
        ref
          .where('class', 'array-contains', this.auth.user.class)
          .where('multi', '==', true)
      )
      .subscribe((courses: Course[]) => {
        if (!courses || !courses.length) return;
        this.courseGroups = [];

        let lessons = [];
        let coursesWithoutLessons = [];

        courses.forEach(course => {
          if (!course.lessons || course.lessons == {})
            coursesWithoutLessons.push(course);
          let lesson = [];

          for (const day in course.lessons) {
            if (course.lessons.hasOwnProperty(day)) {
              const dayData = course.lessons[day];
              for (const period in dayData) {
                if (dayData.hasOwnProperty(period)) {
                  lesson.push(day + '-' + period);
                }
              }
            }
          }

          let existed = false;
          lessons.forEach((lessonGroup, i) => {
            if (existed) return;
            if (JSON.stringify(lessonGroup) == JSON.stringify(lesson)) {
              this.courseGroups[i].push(course);
              existed = true;
            }
          });

          if (!existed) {
            lessons.push(lesson);
            this.courseGroups.push([course]);
          }
        });
        coursesWithoutLessons.forEach(course => this.courseGroups.push(course));
      });
  }

  loadSection(section: number, oldSection: number) {
    if (section > oldSection) this.sectionChangeAnimation = 'next';
    if (section < oldSection) this.sectionChangeAnimation = 'prev';
  }

  onSubmit() {
    this.submitted = true;
    setTimeout(() => {
      let courses = [];
      for (const group in this.selectedCourses) {
        if (this.selectedCourses.hasOwnProperty(group)) {
          const course = this.selectedCourses[group];
          courses.push(course);
        }
      }
      this.db.update(`users/${this.auth.user.id}`, {
        courses: courses,
        status: 2
      });
      if (this.homeworkSorting)
        this.settings.set('homework.sort_by', this.homeworkSorting);
    }, 100);
  }

  previousSection() {
    if (this.section == 1) return;
    this.section--;
  }

  nextSection() {
    if (this.section == this.maxSections) return;
    this.section++;
  }

  hasRoomPrefix(room: string): boolean {
    return !!room.charAt(0).match(/\d/);
  }

  getCourseNumber(id: string) {
    return id.match(/([\d]+)$/)[0];
  }

  indexOf(item: any, array: any[]) {
    let output;
    array.forEach((value, i) =>
      output == undefined && JSON.stringify(value) == JSON.stringify(item)
        ? (output = i)
        : null
    );
    return output;
  }

  toggleSelectedCourse(index: number, id: string) {
    if (this.selectedCourses[index] == id)
      return delete this.selectedCourses[index];
    this.selectedCourses[index] = id;
  }
}
