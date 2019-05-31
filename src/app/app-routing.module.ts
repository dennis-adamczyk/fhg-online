import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

const routes: Routes = [
  {
    path: 'timetable',
    loadChildren: './modules/timetable/timetable.module#TimetableModule'
    // canActivate: [AuthGuard]
  },
  {
    path: 'homework',
    loadChildren: './modules/homework/homework.module#HomeworkModule'
    // canActivate: [AuthGuard]
  },
  {
    path: 'calendar',
    loadChildren: './modules/calendar/calendar.module#CalendarModule'
    // canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: './modules/login/login.module#LoginModule'
    // canActivate: [NoAuthGuard]
  },
  {
    path: '',
    loadChildren: './modules/home/home.module#HomeModule'
    // canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
