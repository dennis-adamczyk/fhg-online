import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take, tap, switchMap } from 'rxjs/operators';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (
      typeof window == 'undefined' ||
      !window ||
      isPlatformServer(this.platformId)
    )
      return true;
    else
      return this.auth.user$.pipe(
        take(1),
        map(user => !user),
        map(loggedOut => {
          if (!loggedOut) {
            this.router.navigate(['/']);
            return false;
          }
          return true;
        })
      );
  }
}
