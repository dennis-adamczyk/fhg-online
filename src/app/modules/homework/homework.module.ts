import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeworkRoutingModule } from './homework-routing.module';
import { HomeworkComponent } from './pages/homework/homework.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [HomeworkComponent],
  imports: [CommonModule, HomeworkRoutingModule, SharedModule]
})
export class HomeworkModule {}
