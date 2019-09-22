import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaticRoutingModule } from './static-routing.module';
import { StartComponent } from './pages/start/start.component';
import { AboutComponent } from './pages/about/about.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { InformationComponent } from './pages/information/information.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

@NgModule({
  declarations: [
    StartComponent,
    AboutComponent,
    InformationComponent,
    NotFoundComponent
  ],
  imports: [CommonModule, StaticRoutingModule, SharedModule]
})
export class StaticModule {}
