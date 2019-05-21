import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppToolbarService, MenuItem } from '../services/app-toolbar.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.sass']
})
export class NavigationComponent {
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));
  activeMenuItem$: Observable<MenuItem>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private toolbarService: AppToolbarService
  ) {
    this.activeMenuItem$ = this.toolbarService.activeMenuItem$;
  }
}
