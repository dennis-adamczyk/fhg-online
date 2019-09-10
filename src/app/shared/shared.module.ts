import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { DocPipe } from './pipes/doc.pipe';
import { ColPipe } from './pipes/col.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxTrimDirectiveModule } from 'ngx-trim-directive';
import {
  MAT_DATE_LOCALE,
  DateAdapter,
  MAT_DATE_FORMATS
} from '@angular/material';
import { AppDateAdapter, APP_DATE_FORMATS } from './adapters/app-date-adapters';
import { HomeworkService } from '../modules/homework/services/homework.service';

@NgModule({
  declarations: [DocPipe, ColPipe],
  imports: [CommonModule],
  exports: [
    CommonModule,
    MaterialModule,
    DocPipe,
    ColPipe,
    ReactiveFormsModule,
    NgxTrimDirectiveModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class SharedModule {}
