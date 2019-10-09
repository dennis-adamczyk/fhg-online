import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpRoutingModule } from './help-routing.module';
import { HelpComponent, SearchBox } from './pages/help/help.component';
import { SharedModule } from 'src/app/shared/shared.module';
import {
  HelpArticleComponent,
  NoSanitizePipe
} from './pages/help/article/article.component';
import { RequestComponent } from './pages/help/request/request.component';

@NgModule({
  declarations: [
    HelpComponent,
    SearchBox,
    HelpArticleComponent,
    NoSanitizePipe,
    RequestComponent
  ],
  imports: [CommonModule, HelpRoutingModule, SharedModule]
})
export class HelpModule {}
