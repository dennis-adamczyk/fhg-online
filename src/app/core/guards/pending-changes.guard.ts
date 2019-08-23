import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanDeactivate
} from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material';
import { AcceptCancelDialog } from '../dialogs/accept-cancel/accept-cancel.component';
import { tap } from 'rxjs/operators';
import { Location } from '@angular/common';

export interface ComponentCanDeactivate {
  canDeactivate: () => true | Observable<true> | object;
}

@Injectable({
  providedIn: 'root'
})
export class PendingChangesGuard
  implements CanDeactivate<ComponentCanDeactivate> {
  constructor(private dialog: MatDialog, private location: Location) {}

  canDeactivate(
    component: ComponentCanDeactivate
  ): boolean | Observable<boolean> {
    return typeof component.canDeactivate() == 'object'
      ? this.dialog
          .open(AcceptCancelDialog, { data: component.canDeactivate() })
          .afterClosed()
          .pipe(
            tap(discard => {
              if (!discard) history.forward();
            })
          )
      : true;
  }
}
