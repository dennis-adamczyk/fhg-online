import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface MenuItem {
  path: string;
  title: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppToolbarService {
  activeMenuItem$: Observable<MenuItem>;

  constructor(
    private router: Router,
    private titleService: Title,
    private meta: Meta
  ) {
    this.activeMenuItem$ = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(_ => this.router.routerState.root),
      map(route => {
        let active = this.lastRouteWithMenuItem(route.root);
        if (active && active.title)
          this.titleService.setTitle(active.title + ' ◂ FHG Online');
        this.meta.addTag({
          name: 'description',
          content: active && active.description ? active.description : ''
        });
        return active;
      })
    );
  }

  getMenuItems(): MenuItem[] {
    return this.router.config
      .filter(route => route.data && route.data.title) //only add a menu item for routes with a title set.
      .map(route => {
        return {
          path: route.path,
          title: route.data.title,
          description: route.data.description
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
          description: cfg.data.description
        }
      : undefined;
  }
}
