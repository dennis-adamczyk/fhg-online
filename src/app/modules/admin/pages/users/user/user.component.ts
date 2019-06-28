import {
  Component,
  OnInit,
  Renderer2,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { tap, take } from 'rxjs/operators';
import { NestedTreeControl } from '@angular/cdk/tree';
import {
  PropertyNode,
  TreeDatabaseService
} from '../../../services/tree-database.service';
import { MatTreeNestedDataSource } from '@angular/material';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.sass']
})
export class UserComponent {
  data: User;
  name: string;
  isLoading: boolean = true;

  nestedTreeControl: NestedTreeControl<PropertyNode>;
  nestedDataSource: MatTreeNestedDataSource<PropertyNode>;

  constructor(
    private treeDb: TreeDatabaseService,
    private db: FirestoreService,
    private route: ActivatedRoute,
    private location: Location,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    this.nestedTreeControl = new NestedTreeControl<PropertyNode>(
      this._getChildren
    );
    this.nestedDataSource = new MatTreeNestedDataSource();

    treeDb.dataChange.subscribe(data => {
      this.nestedDataSource.data = data;
    });
  }

  hasNestedChild = (_: number, nodeData: PropertyNode) => nodeData.children;

  private _getChildren = (node: PropertyNode) => node.children;

  /* ##### GET DATA ##### */

  ngAfterViewInit() {
    this.route.params.subscribe(params => {
      if (!params.uid) return this.location.back();
      this.getData(params.uid);
    });
  }

  getData(uid: string) {
    this.isLoading = true;
    this.db.docWithId$<User>(`users/${uid}`).subscribe(result => {
      this.data = result;
      this.treeDb.initialize(result);
      this.isLoading = false;
    });
  }
}
