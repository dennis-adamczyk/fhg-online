import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeworkComponent } from './pages/homework/homework.component';

const routes: Routes = [
  {
    path: '',
    component: HomeworkComponent,
    data: {
      title: 'Hausaufgaben',
      description: ''
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeworkRoutingModule {}
