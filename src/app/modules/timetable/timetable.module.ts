import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimetableRoutingModule } from './timetable-routing.module';
import { TimetableComponent } from './pages/timetable/timetable.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [TimetableComponent],
  imports: [CommonModule, SharedModule, TimetableRoutingModule]
})
export class TimetableModule {}
