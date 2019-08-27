import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { Homework } from '../homework.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { timetableKey } from 'src/app/modules/timetable/pages/timetable/timetable.component';
import { Course } from 'src/app/modules/admin/pages/classes/course/course.component';
import { constant } from 'src/configs/constants';

@Component({
  selector: 'app-homework-details',
  templateUrl: './homework-details.component.html',
  styleUrls: ['./homework-details.component.sass']
})
export class HomeworkDetailsComponent implements OnInit {
  @Input() data: Homework;

  constructor(
    private router: Router,
    private db: FirestoreService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    console.log(this.data);
  }

  /* ##### TRIGGERS ##### */

  onShare() {
    // TODO:
  }

  onReport() {
    // TODO:
  }

  onEdit() {
    // TODO:
  }

  onDelete() {
    // TODO:
  }

  onChangeDone(event) {
    return this.db.upsert(`users/${this.auth.user.id}/singles/homework`, {
      [`done.${this.data.id}`]: event.checked
    });
  }

  /* ##### HELPER ##### */

  navigateBack() {
    this.router.navigate(['/homework']);
  }

  getDisplayClass(classes: string[]): string {
    if (!classes || !classes.length) return;
    let output = 'Klasse ';
    classes.forEach(clazz => {
      output += clazz + ', ';
    });
    return output.slice(0, -2);
  }

  getDisplayLesson(lesson: {
    date: firebase.firestore.Timestamp;
    lesson: number;
  }): string {
    if (!lesson) return;
    const formatter = new Intl.DateTimeFormat('de', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    let date = formatter.format(lesson.date.toDate());
    let period = `${lesson.lesson}. Stunde (${constant.times[lesson.lesson].start} - ${constant.times[lesson.lesson].end})`;
    return date + '\n' + period;
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
}
