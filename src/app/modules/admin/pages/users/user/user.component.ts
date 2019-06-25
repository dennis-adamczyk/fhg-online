import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { tap, take } from 'rxjs/operators';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.sass']
})
export class UserComponent {
  data: User;
  name: string;
  isLoading: boolean = true;

  constructor(
    private db: FirestoreService,
    private route: ActivatedRoute,
    private location: Location,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### GET DATA ##### */

  ngAfterViewInit() {
    this.route.params.subscribe(params => {
      if (!params.uid) return this.location.back();
      this.getData(params.uid);
    });
  }

  getData(uid: string) {
    this.isLoading = true;
    this.db.docWithId$<User>(`users/${uid}`).subscribe(result => {
      this.data = result;
      this.isLoading = false;
    });
  }
}
