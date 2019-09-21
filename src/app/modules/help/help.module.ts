import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpRoutingModule } from './help-routing.module';
import { HelpComponent } from './pages/help/help.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [HelpComponent],
  imports: [CommonModule, HelpRoutingModule, SharedModule]
})
export class HelpModule {}
