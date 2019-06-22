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
import { isPlatformBrowser } from '@angular/common';
import { take, map, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class IsAdminOrGuardGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.auth.user$.pipe(
        take(1),
        map(user => user && (user.roles.admin || user.roles.guard)),
        tap(isAdminOrGuard => {
          if (!isAdminOrGuard) {
            this.snackBar.open(
              'Du hast unzureichende Rechte um diese Seite aufzurufen.'
            );
            this.router.navigate(['/start']);
            return false;
          }
        })
      );
    }
    return true;
  }
}
