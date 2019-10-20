import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute } from '@angular/router';
import {
  MatSnackBar,
  MatDialog,
  MatTableDataSource,
  MatSort,
  MatPaginator
} from '@angular/material';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { isPlatformBrowser } from '@angular/common';
import { constant } from 'src/configs/constants';

interface RequestElement {
  id: string;
  type: string;
  name: string;
  created_at: string;
}

export const adminRequestsKey = 'admin_requests';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.sass']
})
export class RequestsComponent implements OnInit {
  constant = constant;

  displayedColumns: string[] = ['type', 'name', 'created_at'];
  data = new MatTableDataSource<RequestElement>([]);
  rawData: any[];
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  resultsLength = 0;
  loading = true;

  search = false;

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    public helper: HelperService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Verwallte alle Anfragen, die im Hilfe Center gemeldet werden.',
      keywords: 'Administration, Meldungen, Schulplaner, FHG Online, FHG',
      robots: 'noindex, nofollow'
    });
  }

  /* ##### Toolbar Extention ##### */

  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

  ngOnInit() {
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

      this.loadData();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ===== LOAD DATA ===== */

  loadData() {
    this.db.doc$('requests/--index--').subscribe((data: any) => {
      if (!data) return;
      if (!this.loading) this.snackBar.dismiss();
      this.loading = false;
      this.rawData = data;
      data.requests = data.requests.map(element => {
        element.created_at = this.helper.getDateOf(element.created_at);
        element.name =
          element.by.name.first_name + ' ' + element.by.name.last_name;
        delete element.by;
        return element;
      });
      this.data = new MatTableDataSource<RequestElement>(data.requests);
      this.data.sort = this.sort;
      this.data.paginator = this.paginator;
      this.data.filterPredicate = (
        data: RequestElement,
        filtersJson: string
      ) => {
        const matchFilter = [];
        const filters = JSON.parse(filtersJson);

        filters.forEach(filter => {
          if (filter.id === null) {
            const dataStr = Object.keys(data)
              .reduce((currentTerm, key) => {
                if (data[key] instanceof Date)
                  return currentTerm + data[key].toLocaleDateString() + '◬';
                if (typeof data[key] !== 'string') return '';
                return currentTerm + data[key] + '◬';
              }, '')
              .toLowerCase();
            console.log(dataStr);
            const transformedFilter = filter.value.trim().toLowerCase();
            matchFilter.push(dataStr.indexOf(transformedFilter) != -1);
          } else {
            let val = data[filter.id] === null ? '' : data[filter.id];
            if (val instanceof Date) val = val.toLocaleDateString();
            if (!(typeof val == 'string')) return;
            matchFilter.push(
              val.toLowerCase().indexOf(filter.value.toLowerCase()) != -1
            );
          }
        });
        return matchFilter.some(match => match == true) || !matchFilter.length;
      };
      this.prepareView();
    });
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

  applyFilter(filterValue: string, id: string = null) {
    let old = [];
    try {
      old = JSON.parse(this.data.filter) as any[];
    } catch (error) {}
    old = old.filter(elem => (id ? !elem.id : elem.id));
    if (
      filterValue.trim().length &&
      !(id !== null && this.isFilterActive(id, filterValue))
    )
      old.push({
        id: id,
        value: filterValue.trim().toLowerCase()
      });
    console.log(old);
    this.data.filter = JSON.stringify(old);

    if (this.data.paginator) this.data.paginator.firstPage();
  }

  isFilterActive(id, filterValue): boolean {
    let filters = [];
    try {
      filters = JSON.parse(this.data.filter) as any[];
    } catch (error) {}
    return !!filters.filter(
      filter => filter.id == id && filter.value == filterValue
    ).length;
  }

  hasSeen(id: string): boolean {
    if (!localStorage.getItem(adminRequestsKey)) {
      localStorage.setItem(adminRequestsKey, JSON.stringify([]));
    }
    let storage: string[] = JSON.parse(localStorage.getItem(adminRequestsKey));
    return storage.includes(id);
  }
}
