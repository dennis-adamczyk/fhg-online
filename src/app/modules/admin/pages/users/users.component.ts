import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import {
  MatSort,
  MatTableDataSource,
  MatPaginator,
  MatDialog
} from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take, filter } from 'rxjs/operators';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { UserComponent } from './user/user.component';
import { message } from 'src/configs/messages';
import { userInfo } from 'os';
import { registerUser } from 'functions/src';

export interface UserElement {
  uid: string;
  name: string;
  role: string;
  last_login: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.sass']
})
export class UsersComponent implements OnInit {
  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;
  sub: boolean = !!this.route.children.length;

  displayedColumns: string[] = ['select', 'name', 'role', 'last_login'];
  data = new MatTableDataSource<UserElement>([]);
  selection = new SelectionModel<UserElement>(true, []);
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  resultsLength = 0;
  isLoadingResults = true;
  search = false;

  private storageKey = 'admin_users';

  constructor(
    private afFunc: AngularFireFunctions,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private renderer: Renderer2,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### Toolbar Extention ##### */

  ngOnInit() {
    this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe(url => {
        this.sub = !!this.route.children.length;
        if (this.isLoadingResults) {
          this.refreshData(true);
        }
        if (!this.sub) {
          setTimeout(() => {
            this.data.sort = this.sort;
            this.data.paginator = this.paginator;

            if (this.route.snapshot.queryParamMap.get('refresh')) {
              this.refreshData(true);
              this.location.replaceState('/admin/users');
            }
          }, 0);
        }
      });
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.toolbarExtention = document.querySelector('.toolbar-extention');
      let scrollHandler = () => {
        if (
          this.sidenavContent.scrollTop >
          this.toolbarExtention.clientHeight - this.toolbar.clientHeight
        ) {
          this.renderer.removeStyle(this.toolbar, 'box-shadow');
        } else {
          this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
        }
      };
      scrollHandler();
      this.scrollListener = this.renderer.listen(
        this.sidenavContent,
        'scroll',
        event => scrollHandler()
      );
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  ngAfterViewInit() {
    if (this.sub) return;
    this.refreshData(false);
    this.prepareView();
  }

  prepareView() {
    this.paginator._intl.itemsPerPageLabel = 'Pro Seite:';
    this.paginator._intl.getRangeLabel = (page, pageSize, length) => {
      if (length == 0 || pageSize == 0) {
        return `0 von ${length}`;
      }
      length = Math.max(length, 0);
      /** @type {?} */
      const startIndex = page * pageSize;
      // If the start index exceeds the list length, do not try and fix the end index to the end.
      /** @type {?} */
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} von ${length}`;
    };
  }

  refreshData(force: boolean) {
    this.isLoadingResults = true;
    this.getUsers(force)
      .then((result: { data: UserElement[]; cached: boolean }) => {
        if (!result.cached)
          result.data = result.data.map(user => {
            user.role = this.getRoleName(user.role);
            return user;
          });
        this.isLoadingResults = false;
        this.resultsLength = result.data.length;
        this.data = new MatTableDataSource<UserElement>(result.data);
        this.selection = new SelectionModel<UserElement>(true, []);
        this.data.sort = this.sort;
        this.data.paginator = this.paginator;
        this.data.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'last_login':
              let parts = item.last_login.split('.');
              return new Date(
                parseInt(parts[2]),
                parseInt(parts[1]) - 1,
                parseInt(parts[0])
              );
            default:
              return item[property];
          }
        };
        this.prepareView();
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(
            this.storageKey,
            JSON.stringify({
              data: result.data,
              updated: new Date().getTime()
            })
          );
        }
      })
      .catch(error => {
        // console.error(error);
      });
  }

  deleteUser() {
    if (this.selection.selected.length > 1) {
      const selected = this.selection.selected;
      let names = selected.map(d => d.name).join('\n');
      let uids = selected.map(d => d.uid);
      this.dialog
        .open(AcceptCancelDialog, {
          data: {
            title: 'Konto löschen?',
            content: `Die Konten werden unwiederruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können.\n\nBetroffen sind folgende Konten:\n<b>${names}</b>`,
            accept: 'Unwiederruflich löschen',
            defaultCancel: true
          }
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe(result => {
          if (result) {
            this.isLoadingResults = true;
            let deleteUsers = this.afFunc.functions.httpsCallable(
              'deleteUsers'
            );
            deleteUsers({ uids: uids }).then(() => {
              let newData = this.data.data;
              selected.forEach(selected => {
                const index = this.data.data.findIndex(
                  d => d.uid == selected.uid
                );
                newData.splice(index, 1);
              });
              this.isLoadingResults = false;
              this.data = new MatTableDataSource<UserElement>(newData);
              this.selection = new SelectionModel<UserElement>(true, []);
              this.data.sort = this.sort;
              this.data.paginator = this.paginator;
              this.data.sortingDataAccessor = (item, property) => {
                switch (property) {
                  case 'last_login':
                    let parts = item.last_login.split('.');
                    return new Date(
                      parseInt(parts[2]),
                      parseInt(parts[1]) - 1,
                      parseInt(parts[0])
                    );
                  default:
                    return item[property];
                }
              };
              localStorage.removeItem(this.storageKey);
            });
          }
        });
    } else {
      const selected = this.selection.selected[0];
      const index = this.data.data.findIndex(d => d.uid == selected.uid);
      this.dialog
        .open(AcceptCancelDialog, {
          data: {
            title: 'Konto löschen?',
            content: `Das Konto von <b>${selected.name}</b> wird unwiederruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können.`,
            accept: 'Unwiederruflich löschen',
            defaultCancel: true
          }
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe(result => {
          if (result) {
            this.isLoadingResults = true;
            let deleteUser = this.afFunc.functions.httpsCallable('deleteUser');
            deleteUser({ uid: selected.uid }).then(() => {
              this.isLoadingResults = false;
              let newData = this.data.data;
              newData.splice(index, 1);
              this.data = new MatTableDataSource<UserElement>(newData);
              this.selection = new SelectionModel<UserElement>(true, []);
              this.data.sort = this.sort;
              this.data.paginator = this.paginator;
              this.data.sortingDataAccessor = (item, property) => {
                switch (property) {
                  case 'last_login':
                    let parts = item.last_login.split('.');
                    return new Date(
                      parseInt(parts[2]),
                      parseInt(parts[1]) - 1,
                      parseInt(parts[0])
                    );
                  default:
                    return item[property];
                }
              };
              localStorage.removeItem(this.storageKey);
            });
          }
        });
    }
  }

  private getUsers(force: boolean): Promise<any> {
    if (!force) {
      var data: string = localStorage.getItem(this.storageKey);
      if (data) {
        let obj = JSON.parse(data);
        if (Date.now() - obj.updated < 3.6e6) {
          return new Promise<any>((resolve, rejcet) =>
            resolve({ data: obj.data, cached: true })
          );
        }
      }
    }
    let getUsers = this.afFunc.functions.httpsCallable('getUsers');
    return getUsers({})
      .then(result => {
        return { data: result.data, cached: false };
      })
      .catch(error => {
        console.error(error);
      });
  }

  applyFilter(filterValue: string) {
    this.data.filter = filterValue.trim().toLowerCase();

    if (this.data.paginator) {
      this.data.paginator.firstPage();
    }
  }

  getRoleName(role: string): string {
    return message.roles[role];
  }

  /* ##### SELECT FUNCTIONS ##### */

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.data.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.data.data.forEach(row => this.selection.select(row));
  }

  /* ##### LOAD SUBS ##### */

  onActivate(componentReference) {
    // if (componentReference instanceof UserComponent) {
    //   let name: any = this.selection.selected[0].name.split(', ');
    //   console.log(this.selection.selected);
    //   name = name[1] + ' ' + name[0];
    //   componentReference.name = name;
    // }
  }
}
