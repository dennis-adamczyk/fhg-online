import { FirestoreService } from '../../../../core/services/firestore.service';
import { Component, OnInit } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
