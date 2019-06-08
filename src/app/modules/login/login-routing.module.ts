import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ActionComponent } from './pages/action/action.component';
import { NoAuthGuard } from 'src/app/core/guards/no-auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    data: { title: 'Anmelden' },
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { title: 'Registrieren' },
    canActivate: [NoAuthGuard]
  },
  {
    path: 'action',
    component: ActionComponent,
    data: { title: 'Anmeldung' }
  },
  {
    path: 'forgotPassword',
    redirectTo: '/login/action?mode=forgotPassword',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule {}
