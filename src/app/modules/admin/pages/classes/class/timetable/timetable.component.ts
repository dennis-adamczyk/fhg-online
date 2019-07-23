import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.sass']
})
export class TimetableComponent implements OnInit {
  class: string;
  title: string;
  isLoading: boolean = true;

  constructor() {}

  ngOnInit() {}
}
