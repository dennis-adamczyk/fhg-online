import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeworkComponent } from './pages/homework/homework.component';
import { AddHomeworkComponent } from './pages/homework/add-homework/add-homework.component';
import { PendingChangesGuard } from 'src/app/core/guards/pending-changes.guard';

const routes: Routes = [
  {
    path: 'add',
    component: AddHomeworkComponent,
    data: {
      title: 'Neue Hausaufgabe'
    },
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: '',
    component: HomeworkComponent,
    data: {
      title: 'Hausaufgaben'
    },
    children: [
      {
        path: ':course/:id'
      },
      {
        path: 'p/:id'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeworkRoutingModule {}
