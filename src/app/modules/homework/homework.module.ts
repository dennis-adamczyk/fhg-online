import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeworkRoutingModule } from './homework-routing.module';
import { HomeworkComponent } from './pages/homework/homework.component';
import { SharedModule } from '../../shared/shared.module';
import { AddHomeworkComponent } from './pages/homework/add-homework/add-homework.component';
import { HomeworkDetailsComponent } from './pages/homework/homework-details/homework-details.component';

@NgModule({
  declarations: [HomeworkComponent, AddHomeworkComponent, HomeworkDetailsComponent],
  imports: [CommonModule, HomeworkRoutingModule, SharedModule]
})
export class HomeworkModule {}
