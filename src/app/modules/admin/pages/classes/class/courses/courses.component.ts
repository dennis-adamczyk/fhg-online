import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatSort, MatPaginator } from '@angular/material';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { take } from 'rxjs/operators';
import { HelperService } from 'src/app/core/services/helper.service';

export interface CourseElement {
  name: string;
  subject: string;
  teacher: string;
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.sass']
})
export class CoursesComponent implements OnInit {
  class: string;
  title: string;
  isLoading: boolean = true;

  singleCourses = [];
  multiCourses = [];

  displayedColumns: string[] = ['name', 'subject', 'teacher'];
  single = new MatTableDataSource<CourseElement>([]);
  multi = new MatTableDataSource<CourseElement>([]);
  @ViewChild('singleSort', { static: true }) singleSort: MatSort;
  @ViewChild('multiSort', { static: true }) multiSort: MatSort;
  @ViewChild('singlePaginator', { static: true }) singlePaginator: MatPaginator;
  @ViewChild('multiPaginator', { static: true }) multiPaginator: MatPaginator;

  offline = false;

  constructor(private helper: HelperService, private db: FirestoreService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadData();
    this.prepareView();
  }

  /* ##### LOAD DATA ###### */

  loadData() {
    this.isLoading = true;
    let loadSingle = this.db
      .colWithIds(`years/${this.getYear()}/courses`, ref =>
        ref
          .where('multi', '==', false)
          .where('class', 'array-contains', this.class)
      )
      .pipe(take(1))
      .toPromise()
      .then(result => {
        if (!result && !this.helper.onLine) {
          this.offline = true;
          return;
        }
        this.offline = false;
        this.singleCourses = result;
      });
    let loadMulti = this.db
      .colWithIds(`years/${this.getYear()}/courses`, ref =>
        ref
          .where('multi', '==', true)
          .where('class', 'array-contains', this.class)
      )
      .pipe(take(1))
      .toPromise()
      .then(result => {
        if (!result && !this.helper.onLine) {
          this.offline = true;
          return;
        }
        this.offline = false;
        this.multiCourses = result;
      });

    return Promise.all([loadSingle, loadMulti]).then(() => {
      const singleResult: CourseElement[] = this.singleCourses.map(course => {
        return {
          name: course.id,
          subject: course.subject,
          teacher: course.teacher.title + ' ' + course.teacher.last_name
        };
      });
      const multiResult: CourseElement[] = this.multiCourses.map(course => {
        return {
          name: course.id,
          subject: course.subject,
          teacher: course.teacher.title + ' ' + course.teacher.last_name
        };
      });
      this.single = new MatTableDataSource<CourseElement>(singleResult);
      this.single.sort = this.singleSort;
      this.single.paginator = this.singlePaginator;
      this.multi = new MatTableDataSource<CourseElement>(multiResult);
      this.multi.sort = this.multiSort;
      this.multi.paginator = this.multiPaginator;
      this.isLoading = false;
    });
  }

  /* ##### TRIGGER ###### */

  /* ##### HELPER ##### */

  getYear(): string {
    if (this.class.charAt(0).match(/\d/)) {
      return this.class.charAt(0);
    } else {
      return this.class;
    }
  }

  prepareView() {
    this.singlePaginator._intl.itemsPerPageLabel = 'Pro Seite:';
    this.singlePaginator._intl.getRangeLabel = (page, pageSize, length) => {
      if (length == 0 || pageSize == 0) {
        return `0 von ${length}`;
      }
      length = Math.max(length, 0);
      /** @type {?} */
      const startIndex = page * pageSize;
      // If the start index exceeds the list length, do not try and fix the end index to the end.
      /** @type {?} */
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} von ${length}`;
    };
    this.multiPaginator._intl.itemsPerPageLabel = 'Pro Seite:';
    this.multiPaginator._intl.getRangeLabel = (page, pageSize, length) => {
      if (length == 0 || pageSize == 0) {
        return `0 von ${length}`;
      }
      length = Math.max(length, 0);
      /** @type {?} */
      const startIndex = page * pageSize;
      // If the start index exceeds the list length, do not try and fix the end index to the end.
      /** @type {?} */
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} von ${length}`;
    };
  }
}
