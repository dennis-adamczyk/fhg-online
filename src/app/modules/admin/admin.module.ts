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

@NgModule({
  declarations: [
    AdminComponent,
    ClassesComponent,
    UsersComponent,
    UserComponent,
    ClassComponent
  ],
  imports: [CommonModule, AdminRoutingModule, SharedModule, NgxJsonViewerModule]
})
export class AdminModule {}
