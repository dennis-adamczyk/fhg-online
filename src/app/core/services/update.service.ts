import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  deferredPromt;

  constructor(
    updates: SwUpdate,
    snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    updates.available.subscribe(event => {
      snackBar
        .open('Ein Update ist verfügbar.', 'Installieren', {
          panelClass: 'update-install',
          duration: 10000
        })
        .onAction()
        .subscribe(() => {
          updates.activateUpdate().then(() => document.location.reload());
        });
    });
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', e => {
        this.deferredPromt = e;
      });
    }
  }
}
