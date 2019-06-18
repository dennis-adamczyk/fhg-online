import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './pages/admin/admin.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ClassesComponent } from './pages/classes/classes.component';

@NgModule({
  declarations: [AdminComponent, ClassesComponent],
  imports: [CommonModule, AdminRoutingModule, SharedModule]
})
export class AdminModule {}
