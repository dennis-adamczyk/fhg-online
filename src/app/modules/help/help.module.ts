import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpRoutingModule } from './help-routing.module';
import { HelpComponent, SearchBox } from './pages/help/help.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [HelpComponent, SearchBox],
  imports: [CommonModule, HelpRoutingModule, SharedModule]
})
export class HelpModule {}
