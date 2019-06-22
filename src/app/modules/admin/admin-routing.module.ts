import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { UsersComponent } from './pages/users/users.component';
import { UserComponent } from './pages/users/user/user.component';
import { ClassComponent } from './pages/classes/class/class.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    data: {
      title: 'Administration'
    }
  },
  {
    path: 'users',
    component: UsersComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    }
  },
  {
    path: 'users/:uid',
    component: UserComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    }
  },
  {
    path: 'classes',
    component: ClassesComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    }
  },
  {
    path: 'classes/:class',
    component: ClassComponent,
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
