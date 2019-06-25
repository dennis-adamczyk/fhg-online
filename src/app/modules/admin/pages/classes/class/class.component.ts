import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { map, startWith, combineLatest, take, filter } from 'rxjs/operators';
import { Observable, forkJoin, merge, Subject, BehaviorSubject } from 'rxjs';
import { MembersComponent } from './members/members.component';
import { AdminsComponent } from './admins/admins.component';

@Component({
  selector: 'app-class',
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.sass']
})
export class ClassComponent implements OnInit {
  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

  isLoading: boolean = true;
  class: string;
  members: any[] = [];
  admins: any[] = [];

  sub: boolean = !!this.route.children.length;

  constructor(
    private db: FirestoreService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### Toolbar Extention ##### */

  ngOnInit() {
    this.loadData();

    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.toolbarExtention = document.querySelector('.toolbar-extention');
      let scrollHandler = () => {
        if (
          this.sidenavContent.scrollTop >
          this.toolbarExtention.clientHeight - this.toolbar.clientHeight
        ) {
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
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof this.scrollListener == 'function') this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(url => {
        this.sub = !!this.route.children.length;
      });
    this.route.params.subscribe(params => {
      this.isLoading = true;
      if (!params.class) return this.location.back();
      this.class = params.class;

      let students$ = this.db
        .colWithIds$('users', ref => ref.where('class', '==', this.class))
        .pipe(take(1));
      let teachers$ = this.db
        .colWithIds$('users', ref =>
          ref.where('classes', 'array-contains', this.class)
        )
        .pipe(take(1));

      let admins$ = this.db
        .colWithIds$('users', ref =>
          ref
            .where('roles.admin', '==', true)
            .where('classes', 'array-contains', this.class)
        )
        .pipe(take(1));
      let guardsStudent$ = this.db
        .colWithIds$('users', ref =>
          ref.where('roles.guard', '==', true).where('class', '==', this.class)
        )
        .pipe(take(1));
      let guardsTeacher$ = this.db
        .colWithIds$('users', ref =>
          ref
            .where('roles.guard', '==', true)
            .where('classes', 'array-contains', this.class)
        )
        .pipe(take(1));

      forkJoin(students$, teachers$).subscribe((res: any[]) => {
        this.members = this.flatten(res);
        if (this.members && this.admins) this.isLoading = false;
      });
      forkJoin(admins$, guardsStudent$, guardsTeacher$).subscribe(
        (res: any[]) => {
          this.admins = this.flatten(res);
          if (this.members && this.admins) this.isLoading = false;
        }
      );
    });
  }

  isClass(): boolean {
    return !!this.class.match(/^\d/);
  }

  private flatten(array: any[]): any[] {
    return array.reduce((acc, val) => acc.concat(val), []);
  }

  onActivate(componentReference) {
    if (componentReference instanceof MembersComponent) {
      componentReference.members = this.members;
      componentReference.class = this.class;
      componentReference.title = this.isClass()
        ? 'Klasse '
        : 'Stufe ' + this.class;
    }
    if (componentReference instanceof AdminsComponent) {
      componentReference.admins = this.admins;
      componentReference.class = this.class;
      componentReference.title = this.isClass()
        ? 'Klasse '
        : 'Stufe ' + this.class;
    }
  }
}
