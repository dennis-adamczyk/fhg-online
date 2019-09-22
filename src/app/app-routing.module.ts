import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { IsAdminOrGuardGuard } from './core/guards/is-admin-or-guard.guard';

const routes: Routes = [
  {
    path: 'timetable',
    loadChildren: './modules/timetable/timetable.module#TimetableModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'homework',
    loadChildren: './modules/homework/homework.module#HomeworkModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'calendar',
    loadChildren: './modules/calendar/calendar.module#CalendarModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: './modules/login/login.module#LoginModule'
  },
  {
    path: 'help',
    loadChildren: './modules/help/help.module#HelpModule'
  },
  {
    path: 'settings',
    loadChildren: './modules/settings/settings.module#SettingsModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: './modules/admin/admin.module#AdminModule',
    canActivate: [IsAdminOrGuardGuard]
  },
  {
    path: '',
    loadChildren: './modules/home/home.module#HomeModule',
    canActivate: [AuthGuard]
  },
  {
    path: '',
    loadChildren: './modules/static/static.module#StaticModule'
  },
  {
    path: '**',
    redirectTo: '404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
