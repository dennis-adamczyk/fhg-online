import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatSort, MatPaginator } from '@angular/material';
import { AuthService } from 'src/app/core/services/auth.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

interface UserElement {
  uid: string;
  name: string;
  role: string;
  created: string;
}

@Component({
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.sass']
})
export class AdminsComponent implements OnInit {
  class: string;
  admins: any[];
  title: string;
  isLoading: boolean;

  displayedColumns: string[] = ['name', 'role', 'created'];
  data = new MatTableDataSource<UserElement>([]);
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  constructor(private auth: AuthService, private db: FirestoreService) {}

  ngOnInit() {}

  ngAfterViewInit() {
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
    this.loadData();
  }

  loadData() {
    const processData = () => {
      const result: UserElement[] = this.admins.map(member => {
        return {
          uid: member.id,
          name: member.name.last_name + ', ' + member.name.first_name,
          role: this.auth.getRoleName(member),
          created: this.getCreatedFormat(member.created_at)
        };
      });
      this.data = new MatTableDataSource<UserElement>(result);
      this.data.sort = this.sort;
      this.data.paginator = this.paginator;
    };
    if (!this.admins.length) {
      this.getData(processData);
    } else processData();
  }

  getData(callback: () => any) {
    let admins$ = this.db
      .colWithIds$('users', ref =>
        ref
          .where('roles.admin', '==', true)
          .where('classes', 'array-contains', this.class)
      )
      .pipe(take(1));
    let guardsStudent$ = this.db
      .colWithIds$('users', ref =>
        ref.where('roles.guard', '==', true).where('class', '==', this.class)
      )
      .pipe(take(1));
    let guardsTeacher$ = this.db
      .colWithIds$('users', ref =>
        ref
          .where('roles.guard', '==', true)
          .where('classes', 'array-contains', this.class)
      )
      .pipe(take(1));

    forkJoin(admins$, guardsStudent$, guardsTeacher$).subscribe(
      (res: any[]) => {
        this.admins = this.flatten(res);
        this.isLoading = false;
        callback();
      }
    );
  }

  private flatten(array: any[]): any[] {
    return array.reduce((acc, val) => acc.concat(val), []);
  }

  getCreatedFormat(created_at: any) {
    const date = new Date(created_at.seconds * 1000);
    var dd: any = date.getDate();

    var mm: any = date.getMonth() + 1;
    var yyyy = date.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }

    if (mm < 10) {
      mm = '0' + mm;
    }

    return `${dd}.${mm}.${yyyy}`;
  }
}
