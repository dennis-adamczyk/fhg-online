import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { UsersComponent } from './pages/users/users.component';
import { UserComponent } from './pages/users/user/user.component';
import { ClassComponent } from './pages/classes/class/class.component';
import { MembersComponent } from './pages/classes/class/members/members.component';
import { AdminsComponent } from './pages/classes/class/admins/admins.component';
import { AddUserComponent } from './pages/users/add-user/add-user.component';
import { CoursesComponent } from './pages/classes/class/courses/courses.component';
import { CourseComponent } from './pages/classes/course/course.component';
import { AddCourseComponent } from './pages/classes/course/add-course/add-course.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    data: {
      title: 'Administration'
    }
  },
  {
    path: 'users',
    component: UsersComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    },
    children: [
      {
        path: 'add',
        component: AddUserComponent
      },
      {
        path: ':uid',
        component: UserComponent
      }
    ]
  },
  {
    path: 'classes',
    component: ClassesComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    }
  },
  {
    path: 'classes/:class',
    component: ClassComponent,
    data: {
      title: 'Administration',
      iconFunction: 'back'
    },
    children: [
      {
        path: 'members',
        component: MembersComponent
      },
      {
        path: 'admins',
        component: AdminsComponent
      },
      {
        path: 'courses',
        component: CoursesComponent
      }
    ]
  },
  {
    path: 'course',
    data: {
      title: 'Administration',
      iconFunction: 'back'
    },
    children: [
      {
        path: 'add',
        component: AddCourseComponent
      },
      {
        path: ':course',
        component: CourseComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
