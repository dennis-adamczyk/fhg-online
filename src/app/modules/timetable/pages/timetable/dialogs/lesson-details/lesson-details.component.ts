import { Component, OnInit, Inject } from '@angular/core';
import { Course } from '../../timetable.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { constant } from 'src/configs/constants';

@Component({
  selector: 'app-lesson-details',
  templateUrl: './lesson-details.component.html',
  styleUrls: ['./lesson-details.component.sass']
})
export class LessonDetailsDialog implements OnInit {
  day = this.data.day;
  period = this.data.period;
  lesson: Course | Course[] = this.data.lesson;

  constructor(
    public dialogRef: MatDialogRef<LessonDetailsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {}

  /* ##### HELPER ##### */

  getContrastColor(color: string): string {
    if (!color) return undefined;
    var code = color.split(' ');
    return constant.colorsContrast[code[0]][code[1]];
  }

  getColor(color: string): string {
    if (!color) return undefined;
    var code = color.split(' ');
    return constant.colors[code[0]][code[1]];
  }

  getClassString(classes: string[]) {
    if (classes.length == 1 && !classes[0].charAt(0).match(/\d/)) {
      return 'Stufe ' + classes[0];
    } else {
      var output = '';
      classes.forEach(clazz => {
        output += clazz + ', ';
      });
      output = output.slice(0, -2);
      return 'Klasse ' + output;
    }
  }

  getRoomPrefix(room: string) {
    if (room.charAt(0).match(/\d/)) return 'Raum ';
    return '';
  }

  get isSingle(): boolean {
    return !Array.isArray(this.lesson);
  }

  get time(): { start: string; end: string } {
    return constant.times[this.period];
  }

  getWeekDay(day: number): string {
    return constant.weekDay[day];
  }

  getPeriodText(period: number): string {
    return period + '. Stunde';
  }
}
