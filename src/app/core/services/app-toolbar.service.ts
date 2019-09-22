import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { constant } from '../../../configs/constants';
import { SeoService } from './seo.service';

export interface MenuItem {
  path: string;
  title: string;
  iconFunction?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppToolbarService {
  activeMenuItem$: Observable<MenuItem>;
  title$ = new Subject<string>();

  constructor(private router: Router, private seo: SeoService) {
    this.activeMenuItem$ = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(_ => this.router.routerState.root),
      map(route => {
        let active = this.lastRouteWithMenuItem(route.root);
        this.title$.next(active.title);
        return active;
      })
    );
    this.activeMenuItem$.subscribe();
  }

  setTitle(title: string) {
    this.title$.next(title);
  }

  getMenuItems(): MenuItem[] {
    return this.router.config
      .filter(route => route.data && route.data.title) //only add a menu item for routes with a title set.
      .map(route => {
        return {
          path: route.path,
          title: route.data.title,
          iconFunction: route.data.iconFunction
        };
      });
  }

  private lastRouteWithMenuItem(route: ActivatedRoute): MenuItem {
    let lastMenu = undefined;
    do {
      lastMenu = this.extractMenu(route) || lastMenu;
    } while ((route = route.firstChild));
    return lastMenu;
  }

  private extractMenu(route: ActivatedRoute): MenuItem {
    let cfg = route.routeConfig;
    return cfg && cfg.data && cfg.data.title
      ? {
          path: cfg.path,
          title: cfg.data.title,
          iconFunction: cfg.data.iconFunction ? cfg.data.iconFunction : 'menu'
        }
      : undefined;
  }
}
