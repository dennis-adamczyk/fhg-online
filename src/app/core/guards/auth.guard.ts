import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
  ActivatedRoute
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (
      typeof window == 'undefined' ||
      !window ||
      isPlatformServer(this.platformId) ||
      this.auth.authentificated
    )
      return true;
    else
      return this.auth.user$.pipe(
        take(1),
        map(user => !!user),
        map(loggedIn => {
          if (!loggedIn) {
            if (state.url == '/') {
              this.router.navigate(['/start']);
              return false;
            }
            this.router.navigate(['/login'], {
              queryParams: { url: state.url }
            });
            return false;
          }
          return true;
        })
      );
  }
}
