import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimetableRoutingModule } from './timetable-routing.module';
import { TimetableComponent } from './pages/timetable/timetable.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { LessonDetailsDialog } from './pages/timetable/dialogs/lesson-details/lesson-details.component';

@NgModule({
  declarations: [TimetableComponent, LessonDetailsDialog],
  imports: [CommonModule, SharedModule, TimetableRoutingModule],
  entryComponents: [LessonDetailsDialog]
})
export class TimetableModule {}
