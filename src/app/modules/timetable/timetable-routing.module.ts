import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TimetableComponent } from './pages/timetable/timetable.component';

const routes: Routes = [
  {
    path: '',
    component: TimetableComponent,
    data: {
      title: 'Stundenplan'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimetableRoutingModule {}
