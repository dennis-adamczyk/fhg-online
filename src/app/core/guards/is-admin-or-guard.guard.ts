import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivate,
  Router,
  ActivatedRoute
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { take, map, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class IsAdminOrGuardGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
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
      isPlatformServer(this.platformId)
    )
      return true;
    else
      return this.auth.user$.pipe(
        take(1),
        map(user => user && (user.roles.admin || user.roles.guard)),
        map(isAdminOrGuard => {
          if (!isAdminOrGuard) {
            this.snackBar.open(
              'Du hast unzureichende Rechte um diese Seite aufzurufen.',
              null,
              { duration: 4000 }
            );
            this.router.navigate(['/start']);
            return false;
          }
          return true;
        })
      );
  }
}
