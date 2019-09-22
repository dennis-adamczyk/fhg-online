import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartComponent } from './pages/start/start.component';
import { AboutComponent } from './pages/about/about.component';
import { NoAuthGuard } from 'src/app/core/guards/no-auth.guard';
import { InformationComponent } from './pages/information/information.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

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
    path: 'info',
    component: InformationComponent,
    data: {
      title: 'Informationen'
    }
  },
  {
    path: '404',
    component: NotFoundComponent,
    data: {
      title: 'Seite nicht gefunden'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaticRoutingModule {}
