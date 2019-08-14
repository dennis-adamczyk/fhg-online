import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { DocPipe } from './pipes/doc.pipe';
import { ColPipe } from './pipes/col.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxTrimDirectiveModule } from 'ngx-trim-directive';
import { MAT_DATE_LOCALE } from '@angular/material';

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
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'de-DE' }]
})
export class SharedModule {}
