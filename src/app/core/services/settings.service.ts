import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Settings } from '../../../configs/settings';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { Router } from '@angular/router';
import { take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private storageKey = 'settings';

  constructor(
    private auth: AuthService,
    private db: FirestoreService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  get(key: string): any {
    return this.getAll().then(settings => {
      let keys = key.split('.');
      var setting = settings;
      keys.forEach(el => {
        setting = setting[el];
      });
      return setting;
    });
  }

  getAll(): Promise<Settings> {
    return this.sync().then(() => {
      return this.strictSettings(this.getLocalSettings() as Settings);
    });
  }

  set(key: string, value: any): Promise<void> {
    return this.getAll().then(settings => {
      this.setToValue(settings, value, key);
      return this.setAll(settings);
    });
  }

  setAll(settings: Settings): Promise<void> {
    return this.sync().then(() => {
      this.setLocalSettings(settings);
      return this.db.set(
        `users/${this.auth.user.id}/singles/settings`,
        settings
      );
    });
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
