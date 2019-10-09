import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './pages/admin/admin.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ClassesComponent } from './pages/classes/classes.component';
import { UsersComponent } from './pages/users/users.component';
import { UserComponent } from './pages/users/user/user.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ClassComponent } from './pages/classes/class/class.component';
import { MembersComponent } from './pages/classes/class/members/members.component';
import { AdminsComponent } from './pages/classes/class/admins/admins.component';
import { TreeDatabaseService } from './services/tree-database.service';
import { AddUserComponent } from './pages/users/add-user/add-user.component';
import { CoursesComponent } from './pages/classes/class/courses/courses.component';
import { CourseComponent } from './pages/classes/course/course.component';
import { AddCourseComponent } from './pages/classes/course/add-course/add-course.component';
import { TimetableComponent } from './pages/classes/class/timetable/timetable.component';
import { LessonDetailsDialog } from './pages/classes/class/timetable/dialogs/lesson-details/lesson-details.component';
import { AddLessonDialog } from './pages/classes/class/timetable/dialogs/add-lesson/add-lesson.component';
import { AddClassDialog } from './pages/classes/dialogs/add-class/add-class.component';
import { HelpArticlesComponent } from './pages/help/help.component';
import { HelpArticleEditComponent } from './pages/help/article/article.component';

@NgModule({
  declarations: [
    AdminComponent,
    ClassesComponent,
    UsersComponent,
    UserComponent,
    ClassComponent,
    MembersComponent,
    AdminsComponent,
    AddUserComponent,
    CoursesComponent,
    CourseComponent,
    AddCourseComponent,
    TimetableComponent,
    LessonDetailsDialog,
    AddLessonDialog,
    AddClassDialog,
    HelpArticlesComponent,
    HelpArticleEditComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    NgxJsonViewerModule
  ],
  entryComponents: [LessonDetailsDialog, AddLessonDialog, AddClassDialog],
  providers: [TreeDatabaseService]
})
export class AdminModule {}
