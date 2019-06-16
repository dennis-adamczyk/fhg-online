import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaticRoutingModule } from './static-routing.module';
import { StartComponent } from './pages/start/start.component';
import { AboutComponent } from './pages/about/about.component';
import { ImprintPrivacyComponent } from './pages/imprint-privacy/imprint-privacy.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [StartComponent, AboutComponent, ImprintPrivacyComponent],
  imports: [CommonModule, StaticRoutingModule, SharedModule]
})
export class StaticModule {}
