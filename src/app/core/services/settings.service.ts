import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Settings } from '../../../configs/settings';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { Router } from '@angular/router';
import { take, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { AcceptCancelDialog } from '../dialogs/accept-cancel/accept-cancel.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private storageKey = 'settings';

  private changes = new BehaviorSubject(null);

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

  onChange(): Observable<Settings> {
    return this.changes.asObservable();
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
    let settings = this.getAll();
    this.setToValue(settings, value, key);
    this.setLocalSettings(settings);
    return this.db.update(`users/${this.auth.user.id}/singles/settings`, {
      [key]: value
    });
  }

  setAll(settings: Settings): Promise<void> {
    this.setLocalSettings(settings);
    return this.db.set(`users/${this.auth.user.id}/singles/settings`, settings);
  }

  private sync() {
    if (this.isNotLoggedIn) return this.router.navigate(['/login']);
    if (this.isWrongPlattform) return null;

    if (!this.auth.user.settings_changed) {
      this.db.upsert(
        `users/${this.auth.user.id}/singles/settings`,
        this.defaultSettings
      );
      this.setLocalSettings(this.defaultSettings, 0);
      return;
    }

    this.auth.user$.subscribe(user => {
      if (!user) return;
      const serverChanged = user.settings_changed.toMillis();
      const localChanged = this.getLocalSettings(user)
        ? this.getLocalSettings(user)['changed']
        : 0;

      if (serverChanged > localChanged) {
        this.db
          .doc$<Settings>(`users/${this.auth.user.id}/singles/settings`)
          .pipe(take(1))
          .subscribe(data => {
            let settings = this.strictSettings(data);
            this.setLocalSettings(settings);
          });
      }
    });
  }

  reset(): Promise<void> {
    return this.setAll(this.defaultSettings);
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

  private getLocalSettings(user?: User): Settings {
    if (!localStorage.getItem(this.storageKey))
      this.db
        .doc$<Settings>(
          `users/${user ? user.id : this.auth.user.id}/singles/settings`
        )
        .pipe(take(1))
        .subscribe(data => {
          let settings = this.strictSettings(data);
          this.setLocalSettings(settings);
        });
    return JSON.parse(localStorage.getItem(this.storageKey)) || new Settings();
  }

  private setLocalSettings(data: Settings, changed?: number) {
    this.changes.next(data);
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        ...data,
        changed: changed != undefined ? changed : Date.now()
      })
    );
  }

  private get isNotLoggedIn(): boolean {
    return !this.auth.user || this.auth.user.status <= 0;
  }

  private get isWrongPlattform(): boolean {
    return !isPlatformBrowser(this.platformId);
  }
}
