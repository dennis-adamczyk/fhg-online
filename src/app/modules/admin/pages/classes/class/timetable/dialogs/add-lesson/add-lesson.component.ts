import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatTableDataSource,
  MatSort,
  MatPaginator
} from '@angular/material';
import { constant } from 'src/configs/constants';
import { CourseElement } from '../../../courses/courses.component';
import { SelectionModel } from '@angular/cdk/collections';
import { Course } from 'src/app/modules/timetable/models/timetable.model';

@Component({
  selector: 'app-add-lesson',
  templateUrl: './add-lesson.component.html',
  styleUrls: ['./add-lesson.component.sass']
})
export class AddLessonDialog implements OnInit {
  day = this.data.day;
  period = this.data.period;
  courses = this.data.courses;
  added: Course[] | Course = this.data.added;
  preselected = [];

  displayedColumns: string[] = ['select', 'name', 'subject', 'teacher'];
  dataSource = new MatTableDataSource<CourseElement>([]);
  selection = new SelectionModel<CourseElement>(true, []);
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    public dialogRef: MatDialogRef<AddLessonDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    var newData: CourseElement[] = this.courses.map((course: Course) => {
      return {
        name: course.id,
        subject: course.subject,
        teacher: course.teacher.title + ' ' + course.teacher.last_name
      };
    });
    if (Array.isArray(this.added))
      this.preselected = this.added.map((course: Course) => course.id);
    else this.preselected = [this.added.id];
    this.dataSource = new MatTableDataSource<CourseElement>(newData);
    this.selection = new SelectionModel<CourseElement>(
      true,
      newData.filter(course => this.preselected.includes(course.name))
    );
    this.dataSource.sort = this.sort;
  }

  /* ##### HELPER ##### */

  getWeekDay(day: number): string {
    return constant.weekDay[day];
  }

  getPeriodText(period: number): string {
    return period + '. Stunde';
  }

  getSelected(): string[] {
    return this.selection.selected
      .map(course => course.name)
      .filter(courseName => !this.preselected.includes(courseName));
  }

  /* ##### SELECT FUNCTIONS ##### */

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? (this.selection = new SelectionModel<CourseElement>(
          true,
          this.dataSource.data.filter(course =>
            this.preselected.includes(course.name)
          )
        ))
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }
}
