import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { constant } from '../../../../../configs/constants';
import { SettingsService } from '../../../../core/services/settings.service';
import { language, Settings } from '../../../../../configs/settings';
import { MatSelect, MatDialog, MatSnackBar } from '@angular/material';
import { take, filter } from 'rxjs/operators';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {
  constant = constant;
  language = language;
  objectKeys = Object.keys;
  groups = this.objectKeys(new Settings());
  settingDefaults = new Settings();

  @ViewChildren('select') select: QueryList<MatSelect>;
  @ViewChildren('numericSelect') numericSelect: QueryList<MatSelect>;

  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public settings: SettingsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    settings.sync();
  }

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment == 'account') {
        document.querySelector('mat-sidenav-content').scrollTop = 0;
      }
    });
  }

  range(min: number, max: number): number[] {
    let n = max - min + 1;
    return Array.from([...Array<number>(n).keys()].map(i => i + min));
  }

  settingType(path: string) {
    let setting = this.settings.get(path);
    if (typeof setting == 'boolean') {
      return 'toggle';
    }
    if (typeof setting == 'string') {
      return 'select';
    }
    if (typeof setting == 'number') {
      return 'numeric-select';
    }
  }

  conditionalPaths(path: string) {
    if (
      path == 'homework.max_days' &&
      this.settings.get('homework.sort_by') == 'entered'
    ) {
      return true;
    }
    return false;
  }

  changeValue(path: string, e: MouseEvent) {
    let type = this.settingType(path);
    if (type == 'toggle') {
      this.settings.set(path, !this.settings.get(path));
    }
    if (type == 'select') {
      let childSelect = this.getClosestParent(
        e.target,
        'mat-list-item'
      ).querySelector('mat-select');
      this.select.toArray().forEach(element => {
        if (element._elementRef.nativeElement == childSelect) {
          element.open();
          let change = element.selectionChange.pipe(take(1)).subscribe(data => {
            this.settings.set(path, data.value);
          });
          element.openedChange
            .pipe(
              filter(opened => !opened),
              take(1)
            )
            .subscribe(closed => {
              change.unsubscribe();
            });
        }
      });
    }
    if (type == 'numeric-select') {
      let childSelect = this.getClosestParent(
        e.target,
        'mat-list-item'
      ).querySelector('mat-select');
      this.numericSelect.toArray().forEach(element => {
        if (element._elementRef.nativeElement == childSelect) {
          element.open();
          let change = element.selectionChange.pipe(take(1)).subscribe(data => {
            this.settings.set(path, data.value);
          });
          element.openedChange
            .pipe(
              filter(opened => !opened),
              take(1)
            )
            .subscribe(closed => {
              change.unsubscribe();
            });
        }
      });
    }
  }

  private getClosestParent(elem, selector) {
    for (; elem && elem !== document; elem = elem.parentNode) {
      if (elem.matches(selector)) return elem;
    }
    return null;
  }

  resetSettings() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Einstellungen zurücksetzen?',
          content:
            'Dadurch wird Ihr Konto auf die Standardeinstellungen zurückgesetzt.'
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.settings.reset().then(() =>
            this.snackBar.open('Einstellungen zurückgesetzt', null, {
              duration: 4000
            })
          );
        }
      });
  }

  deleteAccount() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Konto löschen?',
          content:
            'Dein Konto wird unwiederruflich gelöscht, sodass du dich nicht mehr anmelden kannst.',
          accept: 'Unwiederruflich löschen',
          defaultCancel: true
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.auth.delete().catch(error => {
            if (error.code == 'auth/requires-recent-login') {
              this.snackBar
                .open(
                  'Bitte melde dich erneut an, bevor du dein Konto löschen kannst.',
                  'Neu anmelden'
                )
                .afterDismissed()
                .subscribe(() => this.auth.logout());
            }
          });
        }
      });
  }
}
