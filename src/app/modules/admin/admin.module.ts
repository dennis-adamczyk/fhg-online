import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './pages/admin/admin.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ClassesComponent } from './pages/classes/classes.component';
import { UsersComponent } from './pages/users/users.component';
import { UserComponent } from './pages/users/user/user.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ClassComponent } from './pages/classes/class/class.component';
import { MembersComponent } from './pages/classes/class/members/members.component';
import { AdminsComponent } from './pages/classes/class/admins/admins.component';
import { TreeDatabaseService } from './services/tree-database.service';
import { AddComponent } from './pages/users/add/add.component';

@NgModule({
  declarations: [
    AdminComponent,
    ClassesComponent,
    UsersComponent,
    UserComponent,
    ClassComponent,
    MembersComponent,
    AdminsComponent,
    AddComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    NgxJsonViewerModule
  ],
  providers: [TreeDatabaseService]
})
export class AdminModule {}
