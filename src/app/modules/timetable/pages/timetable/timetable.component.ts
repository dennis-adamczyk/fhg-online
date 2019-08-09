import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Observable } from 'rxjs';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { constant } from 'src/configs/constants';
import { MatDialog } from '@angular/material';
import { SettingsService } from 'src/app/core/services/settings.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { AuthService } from 'src/app/core/services/auth.service';

interface Course {
  class: string[];
  lessons: object;
  multi: boolean;
  short: string;
  subject: string;
  room: string;
  teacher: {
    last_name: string;
    title: string;
    short: string;
  };
  color: string;
  id?: string;
}

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.sass']
})
export class TimetableComponent implements OnInit {
  constant = constant;

  isLoading: boolean = true;

  courses: Course[] = [];
  timetable: object;

  constructor(
    private auth: AuthService,
    private dialog: MatDialog,
    public settings: SettingsService,
    private db: FirestoreService,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### TOOLBAR EXTENTION ##### */

  toolbar: Element;
  sidenavContent: Element;
  scrollListener: any;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.XSmall)
    .pipe(map(result => result.matches));

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.isHandset$.subscribe(handset => {
        if (!handset) {
          let scrollHandler = () => {
            if (this.sidenavContent.scrollTop > 64) {
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
        } else {
          this.renderer.removeStyle(this.toolbar, 'box-shadow');
        }
      });
    }
    this.loadData();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof this.scrollListener == 'function') this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    let first = true;
    this.db
      .doc$(`users/${this.auth.user.id}/singles/timetable`)
      .subscribe((result: { outdated: boolean; timetable: object }) => {
        if (result) {
          if (first) {
            if (!result.outdated) {
              this.timetable = result.timetable;
              first = false;
              this.isLoading = false;
              return;
            } else {
              this.reloadTimetable();
            }
          } else if (result.outdated) {
            this.reloadTimetable();
          }
        }
      });
  }

  reloadTimetable() {
    let clazz = this.auth.user.class as string;
    let singleCourses = [],
      multiCourses = [];
    let singles = false,
      multis = false;

    this.isLoading = true;

    const setTimetable = () => {
      this.timetable = this.convertToTimetable([
        ...singleCourses,
        ...multiCourses
      ]);
      console.log(this.timetable);
      this.db.upsert(`users/${this.auth.user.id}/singles/timetable`, {
        outdated: false,
        timetable: this.timetable
      });
      this.isLoading = false;
    };

    if (this.isClass(clazz)) {
      this.db
        .colWithIds$(`years/${this.getYear(clazz)}/courses`, ref =>
          ref
            .where('multi', '==', false)
            .where('class', 'array-contains', clazz)
        )
        .pipe(take(1))
        .subscribe((courses: Course[]) => {
          singleCourses = courses;
          singles = true;
          if (multis) {
            setTimetable();
          }
        });
    }
    if (!this.auth.user.courses.length) multis = true;
    this.auth.user.courses.forEach((courseName, index) => {
      this.db
        .docWithId$(`years/${this.getYear(clazz)}/courses/${courseName}`)
        .pipe(take(1))
        .subscribe((course: Course) => {
          if (!this.isLoading) {
            multiCourses = multiCourses.filter(c => c.id != course.id);
          }
          multiCourses.push(course);
          if (index == this.auth.user.courses.length - 1) {
            multis = true;
            if ((this.isClass(clazz) && singles) || !this.isClass(clazz)) {
              setTimetable();
            }
          }
        });
    });
  }

  /* ##### TRIGGER ##### */

  onClickLesson(day, period) {}

  /* ##### HELPER ##### */

  convertToTimetable(courses: Course[]): object {
    var output = {};
    courses.forEach((course: Course) => {
      if (course.lessons) {
        for (const day in course.lessons) {
          if (course.lessons.hasOwnProperty(day)) {
            const lessonData = course.lessons[day];
            for (const lesson in lessonData) {
              if (lessonData.hasOwnProperty(lesson)) {
                const data = lessonData[lesson];

                if (output[day] == undefined) output[day] = {};
                if (
                  output[day][lesson] != undefined &&
                  !Array.isArray(output[day][lesson])
                )
                  output[day][lesson] = [output[day][lesson]];
                var courseOutput = {
                  subject: course.subject,
                  short: course.short,
                  room: course.room,
                  teacher: course.teacher,
                  class: course.class,
                  multi: course.multi,
                  color: course.color,
                  id: course.id
                };
                if (data.changed) {
                  if (data.room) courseOutput.room = data.room;
                  if (
                    data.teacher &&
                    (data.teacher.title ||
                      data.teacher.last_name ||
                      data.teacher.short)
                  )
                    courseOutput.teacher = data.teacher;
                }
                if (output[day][lesson] != undefined)
                  (output[day][lesson] as any[]).push(courseOutput);
                else output[day][lesson] = courseOutput;
              }
            }
          }
        }
      }
    });
    return output;
  }

  lessonExists(day: number, period: number): boolean {
    if (this.timetable[day]) {
      if (this.timetable[day][period]) {
        return true;
      }
    }
    return false;
  }

  isSingleLesson(day: number, period: number): boolean {
    return !Array.isArray(this.timetable[day][period]);
  }

  getRoomPrefix(day: number, period: number): string {
    if (this.timetable[day][period].room.charAt(0).match(/\d/)) return 'R';
    return '';
  }

  getColor(code: string): string {
    if (!code) return undefined;
    var color = code.split(' ');
    return constant.colors[color[0]][color[1]];
  }

  getContrastColor(code: string): string {
    if (!code) return undefined;
    var color = code.split(' ');
    return constant.colorsContrast[color[0]][color[1]];
  }

  keysOf(obj: object): string[] {
    return Object.keys(obj);
  }

  arrayOf(max: number): number[] {
    return Array.apply(null, Array(max)).map(function(x, i) {
      return i + 1;
    });
  }

  isClass(clazz: string): boolean {
    return !!clazz.charAt(0).match(/\d/);
  }

  getYear(clazz: string = undefined): string {
    if (clazz.charAt(0).match(/\d/)) {
      return clazz.charAt(0);
    } else {
      return clazz;
    }
  }
}
