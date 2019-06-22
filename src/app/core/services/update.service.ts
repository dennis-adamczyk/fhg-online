import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  constructor(updates: SwUpdate, snackBar: MatSnackBar) {
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
  }
}
