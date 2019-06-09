import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartComponent } from './pages/start/start.component';
import { AboutComponent } from './pages/about/about.component';
import { NoAuthGuard } from 'src/app/core/guards/no-auth.guard';
import { ImprintPrivacyComponent } from './pages/imprint-privacy/imprint-privacy.component';

const routes: Routes = [
  {
    path: 'start',
    component: StartComponent,
    canActivate: [NoAuthGuard],
    data: {
      title: 'Start'
    }
  },
  {
    path: 'about',
    component: AboutComponent,
    canActivate: [NoAuthGuard],
    data: {
      title: 'Über Uns'
    }
  },
  {
    path: 'imprint-privacy',
    component: ImprintPrivacyComponent,
    data: {
      title: 'Impressum & Datenschutz'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaticRoutingModule {}
