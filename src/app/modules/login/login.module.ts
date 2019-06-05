import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SharedModule } from '../../shared/shared.module';
import { ActionComponent } from './pages/action/action.component';

@NgModule({
  declarations: [LoginComponent, RegisterComponent, ActionComponent],
  imports: [CommonModule, LoginRoutingModule, SharedModule]
})
export class LoginModule {}
