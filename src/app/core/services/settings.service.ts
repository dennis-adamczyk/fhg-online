import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Settings } from '../../../configs/settings';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { Router } from '@angular/router';
import { take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { AcceptCancelDialog } from '../dialogs/accept-cancel/accept-cancel.component';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private storageKey = 'settings';

  constructor(
    private auth: AuthService,
    private db: FirestoreService,
    private dialog: MatDialog,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    try {
      if (
        isPlatformBrowser(this.platformId) &&
        typeof localStorage == 'undefined'
      ) {
        throw 'not supported';
      }
    } catch (ex) {
      this.dialog.open(AcceptCancelDialog, {
        data: {
          title: 'Cookies aktivieren',
          content:
            'Um diese Seite nutzen zu können, musst du Cookies und das lokale Speichern aktivieren.',
          accept: 'OK'
        }
      });
      this.router.navigate(['/start']);
      return;
    }
    this.sync();
  }

  get(key: string): any {
    var settings = this.getAll();
    let keys = key.split('.');
    var setting = settings;
    keys.forEach(el => {
      setting = setting[el];
    });
    return setting;
  }

  getAll(): Settings {
    return this.strictSettings(this.getLocalSettings() as Settings);
  }

  set(key: string, value: any): Promise<void> {
    return this.sync().then(() => {
      var settings = this.getAll();
      this.setToValue(settings, value, key);
      return this.setAll(settings);
    });
  }

  setAll(settings: Settings): Promise<void> {
    this.setLocalSettings(settings);
    return this.db.set(`users/${this.auth.user.id}/singles/settings`, settings);
  }

  sync(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isNotLoggedIn) return this.router.navigate(['/login']);
      if (this.isWrongPlattform) return null;

      if (!this.auth.user.settings_changed) {
        this.db.set(
          `users/${this.auth.user.id}/singles/settings`,
          this.defaultSettings
        );
        this.setLocalSettings(this.defaultSettings, 0);
        resolve();
        return;
      }

      if (!this.getLocalSettings()) {
        this.setLocalSettings(this.defaultSettings, 0);
      }

      const serverChanged = this.auth.user.settings_changed.seconds;
      const localChanged = this.getLocalSettings()['changed'];

      if (serverChanged > localChanged) {
        this.db
          .doc$<Settings>(`users/${this.auth.user.id}/singles/settings`)
          .pipe(take(1))
          .subscribe(data => {
            var settings = this.strictSettings(data);
            this.setLocalSettings(settings);
            resolve();
          });
      } else {
        resolve();
      }
    });
  }

  reset(): Promise<void> {
    return this.setAll(this.defaultSettings).then(() => this.sync());
  }

  private setToValue(obj, value, path) {
    path = path.split('.');
    for (var i = 0; i < path.length - 1; i++) obj = obj[path[i]];

    obj[path[i]] = value;
  }

  private strictSettings(settings: Settings): Settings {
    for (const setting in settings) {
      if (!this.defaultSettings.hasOwnProperty(setting)) {
        delete settings[setting];
      }
    }
    return settings;
  }

  private get defaultSettings(): Settings {
    return new Settings();
  }

  private getLocalSettings(): object {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  private setLocalSettings(data: Settings, changed?: number) {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        ...data,
        changed: changed != undefined ? changed : this.currentTime
      })
    );
  }

  private get currentTime(): number {
    return Math.floor(Date.now() / 1000);
  }

  private get isNotLoggedIn(): boolean {
    return !this.auth.user;
  }

  private get isWrongPlattform(): boolean {
    return !isPlatformBrowser(this.platformId);
  }
}
