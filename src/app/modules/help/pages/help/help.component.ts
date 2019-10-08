import {
  Component,
  OnInit,
  forwardRef,
  Inject,
  Input,
  ViewChild,
  EventEmitter,
  Output,
  PLATFORM_ID
} from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import * as algoliasearch from 'algoliasearch/lite';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.sass']
})
export class HelpComponent implements OnInit {
  searchConfig = {
    searchClient: algoliasearch(
      environment.algolia.appId,
      environment.algolia.apiKey
    ),
    indexName: 'help'
  };

  focus: boolean = false;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    public location: Location,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Beim Hilfe Center von FHG Online kannst du schnell und einfach deine Fragen stellen, Feedback geben und das Entwickler Team kontaktieren.',
      keywords:
        'Hilfe, Fragen, Feedback, Kontakt, Team, Antwort, Warum, Wie, Schulplaner, FHG Online, FHG'
    });
  }

  ngOnInit() {}

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (document.referrer.indexOf(window.location.host) !== -1)
      this.location.back();
    else this.router.navigate(['/'], { replaceUrl: true });
  }
}

import { BaseWidget, NgAisInstantSearch } from 'angular-instantsearch';
import { connectSearchBox } from 'instantsearch.js/es/connectors';

@Component({
  selector: 'app-search-box',
  template: `
    <mat-form-field floatLabel="never" #form [class.focused]="this.focused">
      <input
        matInput
        #input
        placeholder="Problem beschreiben"
        (keyup)="this.state.refine(input.value)"
        [value]="this.state.query"
        (focus)="this.focus.emit(true)"
        (focusout)="this.setFocus()"
      />
      <button
        matPrefix
        mat-icon-button
        disableRipple
        (click)="this.handset ? this.clear($event) : null"
      >
        <mat-icon>{{
          !(this.isHandset$ | async) || !this.focused ? 'search' : 'arrow_back'
        }}</mat-icon>
      </button>
      <button
        mat-icon-button
        matSuffix
        disableRipple
        *ngIf="!(this.isHandset$ | async) && this.focused"
        (click)="this.clear($event)"
      >
        <mat-icon>clear</mat-icon>
      </button>
    </mat-form-field>
  `
})
export class SearchBox extends BaseWidget {
  public state: {
    query: string;
    refine: Function;
    clear: Function;
    isSearchStalled: boolean;
    widgetParams: object;
  };
  @Output() focus = new EventEmitter<boolean>();
  focused: boolean;
  @Input('handset$') public isHandset$: Observable<boolean>;
  @ViewChild('input', { static: true }) input: any;
  @ViewChild('form', { static: true }) form: any;
  handset: boolean;

  constructor(
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchParent
  ) {
    super('SearchBox');
  }

  ngOnInit() {
    this.focus.subscribe(x => setTimeout(() => (this.focused = x), 0));
    this.createWidget(connectSearchBox, {
      queryHook: (query, search) => {
        this.state.query = query;
        search(query);
      }
    });
    super.ngOnInit();
    this.isHandset$.subscribe(hand => (this.handset = hand));
  }

  clear(event?) {
    this.focus.emit(false);
    this.state.clear();
    this.input.nativeElement.blur();
    if (event) event.stopPropagation();
  }

  setFocus() {
    setTimeout(() => {
      if (!this.focused) return;
      this.input.nativeElement.focus();
    }, 100);
  }
}
