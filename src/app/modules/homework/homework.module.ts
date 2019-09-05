import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeworkRoutingModule } from './homework-routing.module';
import { HomeworkComponent } from './pages/homework/homework.component';
import { SharedModule } from '../../shared/shared.module';
import { AddHomeworkComponent } from './pages/homework/add-homework/add-homework.component';
import { HomeworkDetailsComponent } from './pages/homework/homework-details/homework-details.component';
import { EditHomeworkComponent } from './pages/homework/edit-homework/edit-homework.component';
import { HomeworkFormComponent } from './components/homework-form/homework-form.component';

@NgModule({
  declarations: [HomeworkComponent, AddHomeworkComponent, HomeworkDetailsComponent, EditHomeworkComponent, HomeworkFormComponent],
  imports: [CommonModule, HomeworkRoutingModule, SharedModule]
})
export class HomeworkModule {}
