import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { ClassesComponent } from './pages/classes/classes.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    data: {
      title: 'Administration'
    }
  },
  {
    path: 'classes',
    component: ClassesComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
