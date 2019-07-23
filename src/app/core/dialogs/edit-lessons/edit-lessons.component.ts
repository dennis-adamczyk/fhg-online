import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { constant } from 'src/configs/constants';

@Component({
  selector: 'app-edit-lessons',
  templateUrl: './edit-lessons.component.html',
  styleUrls: ['./edit-lessons.component.sass']
})
export class EditLessonsDialog implements OnInit {
  lessons = this.data.lessons;
  lessonsForm: FormArray;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditLessonsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.lessonsForm = this.fb.array([]);
    this.loadData();
  }

  loadData() {
    for (const day in this.lessons) {
      if (this.lessons.hasOwnProperty(day)) {
        const lessonObj = this.lessons[day];
        for (const lesson in lessonObj) {
          if (lessonObj.hasOwnProperty(lesson)) {
            const data = lessonObj[lesson];
            this.addLesson(
              parseInt(day),
              parseInt(lesson),
              data.changed ? data : undefined
            );
          }
        }
      }
    }
  }

  deleteLesson(index: number) {
    this.lessonsForm.removeAt(index);
  }

  addLesson(
    day: number,
    lesson: number,
    changes: {
      room?: string;
      teacher?: { title: string; last_name: string; short: string };
    } = undefined
  ): void {
    this.lessonsForm.push(
      this.fb.group({
        day: [day, [Validators.required]],
        lesson: [lesson, [Validators.required]],
        individual: [changes != undefined ? true : false],
        changes: this.fb.group({
          room: [
            changes && changes.room ? changes.room : '',
            [Validators.maxLength(5)]
          ],
          teacher: this.fb.group({
            title: [
              changes && changes.teacher ? changes.teacher.title : '',
              [Validators.maxLength(10)]
            ],
            last_name: [
              changes && changes.teacher ? changes.teacher.last_name : '',
              [
                Validators.pattern(
                  /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
                )
              ]
            ],
            short: [
              changes && changes.teacher ? changes.teacher.short : '',
              [Validators.pattern(/^[^\s]+$/), Validators.maxLength(5)]
            ]
          })
        })
      })
    );
  }

  get lessonsValue(): object {
    var output = {};
    (this.lessonsForm.value as object[]).forEach(
      (val: {
        day: number;
        lesson: number;
        individual: boolean;
        changes: {
          room?: string;
          teacher?: { title: string; last_name: string; short: string };
        };
      }) => {
        if (output[val.day] == undefined) output[val.day] = {};
        output[val.day][val.lesson] = val.individual
          ? {
              changed: true,
              room: val.changes.room ? val.changes.room : null,
              teacher: val.changes.teacher ? val.changes.teacher : null
            }
          : { changed: false };
      }
    );
    return output;
  }

  get dayArray(): string[] {
    return Object.values(constant.weekDay);
  }

  get lessonArray(): string[] {
    var output = [];
    var i;
    for (i = 1; i <= constant.maxLessons; i++) {
      output.push(i + '. Stunde');
    }
    return output;
  }
}
